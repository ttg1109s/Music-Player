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

**2 điểm rẽ nhánh khác nhau, đừng nhầm** (Router switch/if tay đọc `appState` KHÔNG còn là 1
nhánh riêng — mọi rẽ nhánh theo state trong case đều đi qua `VirtualMachineState`, xem mục 4C):

| Tầng | Chạy khi nào | Biết `appState` không | Trả về / hành vi | Có thể chọn "chạy cái gì" không |
|---|---|---|---|---|
| **Block** (`event/block.js` + `bus.js`) | Trước khi vào Router | Có (đọc để quyết định chặn) | boolean — chặn hẳn hoặc không | **KHÔNG** — chỉ chặn/không chặn, không chọn đích |
| **`VirtualMachineState`** | Trong 1 case | KHÔNG (router tự đọc, truyền `state` sẵn vào rule) | gọi 0..N callback | Có — 1 rule khớp (đơn đích) hay nhiều rule khớp (đa đích) đều cùng 1 API |

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

### (C) `VirtualMachineState.run([...])` — MỌI rẽ nhánh theo state, kể cả đơn đích lẫn đa đích

Dùng khi 1 case cần đọc **1 hoặc nhiều field `appState` KHÁC** (không phải `msg.payload` của
chính nó) để quyết định chạy gì — **luôn qua `VirtualMachineState`, không viết switch/if tay đọc
`appState` trong case nữa**, kể cả khi chỉ có 1 điều kiện/1 đích duy nhất. Lý do đổi từ khuyến
nghị trước (từng cho phép switch/if tay nếu đơn đích): 1 API duy nhất cho "rẽ nhánh theo state"
dễ đọc/dễ audit hơn 2 cách viết khác nhau tuỳ case đơn hay đa đích — quét toàn bộ router chỉ cần
tìm `VirtualMachineState.run(` là ra hết chỗ nào đang rẽ nhánh theo state, không sót chỗ viết tay.

**Đa đích (nhiều rule cùng khớp là đúng, không loại trừ nhau):**
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

> **Lưu ý thứ tự chạy:** khi ≥2 rule CÙNG khớp trong 1 lần `run()`, callback được gọi **tuần tự
> theo đúng thứ tự khai báo trong mảng, từ trên xuống dưới** (`run()` là vòng `for` thường, không
> chạy song song, không tự sắp xếp lại) — rule khai báo trước LUÔN chạy xong trước rule khai báo
> sau. Nếu 2 workflow/core cùng khớp có side-effect đụng nhau (vd cùng ghi 1 field `appState`,
> cùng động vào 1 vùng DOM), thứ tự viết trong mảng chính là thứ tự ai-ghi-đè-ai — cân nhắc kỹ khi
> sắp xếp, không coi 2 rule khớp cùng lúc là độc lập tuyệt đối về mặt thời gian chạy.

**Đơn đích (loại trừ nhau, giống switch/if cũ)** — viết y hệt cú pháp trên, chỉ khác các `value`
so sánh vốn đã loại trừ nhau tự nhiên (1 field không thể vừa `'dong'` vừa `'bac'` cùng lúc), nên
CHỈ 1 rule khớp — không cần cơ chế "dừng sớm" riêng, tự nhiên chỉ 1 callback chạy:
```js
case 'cluster.action.click': {
    const doorMaterial = appState.get('doorMaterial');
    VirtualMachineState.run([
        { state: doorMaterial, operation: '===', value: 'dong', callback: () => workflow1(msg) },
        { state: doorMaterial, operation: '===', value: 'bac',  callback: () => workflow2(msg) },
    ]);
    break;
}
```
Không rule nào khớp (vd `doorMaterial` mang giá trị lạ, chưa tính tới) → `run()` tự
`console.warn('[VirtualMachineState] run() — không rule nào khớp.', rules)` — thay hẳn cho nhánh
`default: console.warn(...)` từng viết tay trong switch, không cần viết lại.

## 5. `callback` trong `VirtualMachineState` gọi gì?

`VirtualMachineState` không biết Core hay Workflow là gì — `callback` là 1 arrow function router
tự viết, bên trong gọi thẳng hàm Core hoặc `workflowX.method()` tuỳ case đó cần gì (giống hệt
tiêu chí (A)/(B) ở mục 4, chỉ khác là được BỌC trong 1 rule thay vì gọi trực tiếp trong case).

## 6. Ngưỡng chọn (A) / (B) / (C) / Block — tóm tắt quyết định

| Câu hỏi | Chọn |
|---|---|
| Không cần biết state nào cả (kể cả chỉ dùng `msg.payload` của chính message)? | (A) gọi thẳng Core |
| Cần shield/modal, hoặc ≥2 hàm core phụ thuộc thứ tự? | (B) Workflow |
| Cần đọc `appState` KHÁC để quyết định chạy gì — dù chỉ 1 điều kiện/1 đích hay nhiều? | (C) `VirtualMachineState` — LUÔN dùng, không viết switch/if tay đọc `appState` trong case nữa |
| Điều kiện chặn dùng ở ≥2 router, hoặc bản chất là chặn hẳn không chạy gì? | Block (`event/block.js`) — chặn TRƯỚC router, không phải trong case |

← [Quay lại README](../README.md)
