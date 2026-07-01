# Luồng kiến trúc `/event/` — sơ đồ đầy đủ (ver 12)

> Tài liệu này mô tả ĐÚNG luồng thật đang chạy trong code, không phải kế hoạch. Đọc cùng
> [folder-structure.md](./folder-structure.md) (cấu trúc thư mục), [where-to-edit.md](./where-to-edit.md)
> (sửa ở đâu khi cần thêm tính năng) và [script-load-order.md](./script-load-order.md) (thứ tự nạp
> `<script>`).

## Sơ đồ tổng quan

```
Listener (DOM/tab/window/...)
        │  eventBus.send(msg)
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ event/bus.js                                                    │
│                                                                   │
│  Block gate (event/block.js — DATA, hiện RỖNG)                  │
│  isBlocked(msg.type)? ──── true ────▶  DỪNG, KHÔNG vào Router   │
│       │ false                          (im lặng, đúng thiết kế) │
└───────┼───────────────────────────────────────────────────────┘
        ▼
    Router.handle(msg)
        │  switch (msg.type)
        ▼
    ┌───────────────────────────── case cụ thể ─────────────────────────────┐
    │                                                                        │
    │  (A) gọi thẳng 1 hàm CORE          (B) giao WORKFLOW      (C) VirtualMachineState.run([...])
    │      không cần state gì cả             cần shield/modal        rẽ nhánh theo state, CHẠY
    │      (Ví dụ 1 — xem mục 3)              HOẶC ≥2 hàm core        NHIỀU callback nếu nhiều rule
    │                                         độc lập                cùng khớp — mỗi callback là
    │                                                                 CORE hoặc WORKFLOW tuỳ rule
    └────────────────────────────────────────────────────────────────────────┘
                                                                          │
                                                             mỗi rule khớp gọi callback()
                                                                          ▼
                                                              core function  hoặc  workflow method
```

**3 điểm rẽ nhánh khác nhau, đừng nhầm:**

| Tầng | Chạy khi nào | Biết `appState` không | Trả về / hành vi | Có thể chọn "chạy cái gì" không |
|---|---|---|---|---|
| **Block** (`event/block.js` + `bus.js`) | Trước khi vào Router | Có (đọc để quyết định chặn) | boolean — chặn hẳn hoặc không | **KHÔNG** — chỉ chặn/không chặn, không chọn đích |
| **Router switch/if tay** | Trong 1 case | Có (nếu case đó cần) | gọi 1 đích cố định theo `if` viết tay | Có, nhưng chỉ 1 đích mỗi lần chạy (loại trừ nhau kiểu `if/else`) |
| **`VirtualMachineState`** | Trong 1 case | KHÔNG (router tự đọc, truyền `state` sẵn vào rule) | gọi 0..N callback | Có, và **KHÔNG loại trừ nhau** — nhiều rule khớp thì nhiều callback cùng chạy |

## 1. Listener — nguồn trigger

DOM (`click`/`change`/`input`...), `tab`/`window` lifecycle (`visibilitychange`/`pagehide`/
`beforeunload`...), hoặc nguồn khác (`audioPlayer` media events). Chỉ làm 1 việc: đăng ký sự kiện
+ gọi `eventBus.send({ router, type, payload })`. KHÔNG chứa logic nghiệp vụ, KHÔNG đọc `appState`
để quyết định gì (đó là việc của Block/Router/VirtualMachineState phía sau).

Ngoại lệ đã chốt từ trước (rule 2b.7): browser lifecycle events gắn thẳng trên `window`/`document`
đứng NGOÀI `/event/` (`core/tab-hide-reload.js`, `core/wakelock.js`, `core/app-cleanup.js`,
`event/tab.js`) — không đổi ở ver 12.

## 2. Block gate — chặn TRƯỚC khi vào Router

`eventBus.send(msg)` tra `event/block.js` (đăng ký qua `eventBus.registerBlock(msgType, groups)`)
TRƯỚC khi gọi `router.handle(msg)`. Nếu khớp block, `send()` `return` ngay — Router, Core, Workflow
đều KHÔNG chạy, không có ngoại lệ nào lọt qua.

**Chỉ dùng khi:**
- Điều kiện chặn dùng ở **≥2 router khác nhau** cho cùng 1 ý nghĩa nghiệp vụ (tránh lệch logic
  giữa các entry point — đây là lý do ra đời cơ chế này, xem case thật ở
  [v12.md](./changelog/v12.md) mục 1), HOẶC
- Bản chất là **chặn hẳn** (không chạy gì khi điều kiện đúng), không phải chọn giữa nhiều đích.

**KHÔNG dùng khi** cần chọn "workflow nào chạy" tuỳ state — Block chỉ trả boolean, không có chỗ
nào cho "gọi hàm gì". Trường hợp đó thuộc mục 4/5 dưới.

Xem cú pháp đầy đủ ở comment đầu `event/block.js`/`event/bus.js`.

## 3. Router — switch theo `msg.type`

Mỗi cụm (`storage`, `playlist`, `visualizerDisplay`...) có đúng 1 router, tự
`eventBus.register(name, routerObject)` lúc nạp. `handle(msg)` switch theo `msg.type`
(namespace `<router>.<action>.<event>`), mỗi case đi 1 trong 3 hướng ở mục 4 dưới.

## 4. Trong 1 case — 3 hướng có thể đi (không loại trừ nhau, chọn tuỳ nhu cầu case đó)

### (A) Gọi thẳng Core — không cần biết state gì

Đa số case hiện có. Message tự đủ nghĩa (dựa vào chính `msg.payload`, hoặc hành vi không đổi theo
state khác), gọi thẳng 1 hàm:
```js
case 'cluster.action.click':
    coreFunctionX(msg.payload);
    break;
```

### (B) Giao Workflow — cần shield/modal, hoặc ≥2 hàm core độc lập

Tiêu chí đã chốt (không đổi): (a) cần `withLoadingShield`/`alertModal`, HOẶC (b) phải gọi ≥2 hàm
core có thứ tự phụ thuộc nhau (vd ghi IndexedDB xong mới gọi core cập nhật UI):
```js
case 'cluster.action.change':
    workflowX.doThing(msg.payload);
    break;
```

### (C) `VirtualMachineState.run([...])` — rẽ nhánh theo state, có thể chạy NHIỀU đích cùng lúc

Dùng khi 1 case cần đọc **1 hoặc nhiều field `appState` KHÁC** (không phải `msg.payload` của
chính nó) để quyết định chạy 0, 1, hay NHIỀU workflow/core — và các điều kiện đó **không loại trừ
nhau** (khác `switch`/`if-else`, vốn chỉ chọn đúng 1 nhánh):

```js
case 'cluster.action.click': {
    const someState = appState.get('someState'); // đọc 1 lần
    VirtualMachineState.run([
        { state: someState, operation: '===', value: 10, callback: () => coreOrWorkflowA(msg) },
        { state: someState, operation: '>=',  value: 10, callback: () => coreOrWorkflowB(msg) },
    ]);
    break;
}
```
`someState = 10` khớp CẢ HAI rule → CẢ HAI callback chạy — không phải chọn 1 trong 2.

**Nếu chỉ cần loại trừ nhau (1 điều kiện, 1 đích duy nhất mỗi lần)** — dùng switch/if tay thường
trong case, KHÔNG cần `VirtualMachineState` (over-engineer nếu chỉ có 1 nhánh đơn giản):
```js
case 'cluster.action.click': {
    switch (appState.get('doorMaterial')) {
        case 'dong': workflow1(msg); break;
        case 'bac':  workflow2(msg); break;
        default: console.warn(`[routerX] doorMaterial không xác định`, msg);
    }
    break;
}
```

## 5. `callback` trong `VirtualMachineState` gọi gì?

`VirtualMachineState` không biết Core hay Workflow là gì — `callback` là 1 arrow function router
tự viết, bên trong gọi thẳng hàm Core hoặc `workflowX.method()` tuỳ case đó cần gì (giống hệt
tiêu chí (A)/(B) ở mục 4, chỉ khác là được BỌC trong 1 rule thay vì gọi trực tiếp trong case).

## 6. Ngưỡng chọn (A) / (B) / (C) / Block — tóm tắt quyết định

| Câu hỏi | Chọn |
|---|---|
| Không cần biết state nào cả? | (A) gọi thẳng Core |
| Cần shield/modal, hoặc ≥2 hàm core phụ thuộc thứ tự? | (B) Workflow |
| Cần đọc state, nhưng chỉ 1 điều kiện, 1 đích duy nhất (loại trừ nhau)? | switch/if tay trong case |
| Cần đọc state, ≥2 điều kiện có thể CÙNG khớp, mỗi khớp chạy 1 đích riêng? | (C) `VirtualMachineState` |
| Điều kiện chặn dùng ở ≥2 router, hoặc bản chất là chặn hẳn không chạy gì? | Block (`event/block.js`) — chặn TRƯỚC router, không phải trong case |

← [Quay lại README](../README.md)
