# Quy tắc viết function Core / nghiệp vụ — từ ver 12 trở đi

> Áp dụng cho function **MỚI viết hoặc được SỬA** kể từ ver 12. KHÔNG bắt buộc rewrite ngay toàn
> bộ core hiện có (~110 file, phần lớn đang tự `appState.get()` trực tiếp, đúng theo quy ước cũ ở
> `service/state.js`) — việc migrate core cũ theo luật này (nếu cần) là 1 cụm việc rà soát riêng,
> CHƯA nằm trong phạm vi tài liệu này. **[Cần Giang xác nhận]** đây có đúng phạm vi áp dụng
> (opt-in cho code mới) hay ý định là bắt buộc audit lại toàn bộ core cũ ngay — 2 việc khác nhau
> rất nhiều về khối lượng.

Đọc cùng [event-bus-flow.md](./event-bus-flow.md) — tài liệu đó quy định luồng
`listener → router → core/workflow/VirtualMachineState`; tài liệu NÀY quy định riêng bên TRONG 1
function Core/nghiệp vụ được viết ra sao.

---

## Rule 1 — Đơn tuyến nghiệp vụ: 1 function core = đúng 1 chức năng

**Cấm:** `if/else`, `switch/case`, object-map chọn hàm — khi mục đích là chọn giữa **≥2 tiến
trình nghiệp vụ khác nhau dựa theo `appState`**. Việc "chọn tiến trình nào chạy theo state" không
còn là việc của Core — đó là việc của Router/`VirtualMachineState` (xem
[event-bus-flow.md mục 4C](./event-bus-flow.md)).

**KHÔNG bị cấm:** guard clause thuần (validate tham số đầu vào, early-return khi giá trị không
hợp lệ) — đó không phải "tiến trình khác nhau", chỉ là điều kiện tiên quyết để chạy ĐÚNG 1 tiến
trình duy nhất của hàm. Phân biệt bằng câu hỏi: *nhánh `if` đó có dẫn tới 2 KẾT QUẢ NGHIỆP VỤ khác
nhau, hay chỉ là "chưa đủ điều kiện thì dừng, đủ thì chạy tiếp đúng 1 đường"?*

```js
// ĐƯỢC — guard clause thuần, chỉ 1 tiến trình duy nhất khi hợp lệ
function applyVisualType(type) {
    const idx = MODES.indexOf(type);
    if (idx === -1) return; // chưa đủ điều kiện -> dừng, KHÔNG phải "tiến trình khác"
    appState.set('currentModeIndex', idx);
    updateTypeUI();
}
```

```js
// SAI — if theo appState chọn giữa 2 TIẾN TRÌNH nghiệp vụ khác nhau (khoá / áp dụng)
function applyVisualType(type) {
    if (appState.get('vizConfig').autoSwitchVisualEnabled) {
        return; // tiến trình 1: bị khoá
    }
    // tiến trình 2: áp dụng type mới
    const idx = MODES.indexOf(type);
    if (idx === -1) return;
    appState.set('currentModeIndex', idx);
    updateTypeUI();
}
```
Sửa đúng: bỏ hẳn nhánh `autoSwitchVisualEnabled` khỏi function (nó vi phạm luôn Rule 2 — đọc
`appState` trực tiếp) — hàm chỉ còn ĐÚNG 1 tiến trình như ví dụ "ĐƯỢC" ở trên; việc quyết định có
gọi hàm hay không (khi đang khoá) chuyển ra Router/`VirtualMachineState`.

## Rule 2 — Chỉ nhận tham số, không tự đọc `appState` — chỉ được GHI qua `set()`/`mutate()`

Function nghiệp vụ **KHÔNG được gọi `appState.get()`** trong thân hàm. Mọi dữ liệu cần dùng phải
được truyền vào qua tham số — nơi GỌI (router, callback trong `VirtualMachineState`, hoặc 1
function core khác) chịu trách nhiệm `appState.get()` trước, rồi truyền giá trị vào.

**ĐƯỢC PHÉP:**
- `appState.set(...)` / `appState.mutate(...)` — chỉ chặn chiều ĐỌC, không chặn chiều GHI (hàm
  vẫn tạo side-effect ra ngoài bình thường, chỉ không được tự ý ĐỌC state để quyết định hành vi).
- Biến nội bộ (`let`/`const` khai báo trong scope hàm) tự do, không giới hạn.

```js
// SAI — tự appState.get() bên trong
function saveConfig() {
    const cfg = appState.get('vizConfig');
    localforage.setItem('vizConfig', cfg);
}
```
```js
// ĐÚNG — nhận cfg qua tham số, nơi gọi tự appState.get('vizConfig') trước khi gọi hàm này
function saveConfig(cfg) {
    localforage.setItem('vizConfig', cfg);
}
```

## Rule 3 — Được gọi function core khác để hỗ trợ tính toán, PHẢI log lại — phân biệt Workflow

1 function nghiệp vụ **được phép** gọi 1 (hoặc nhiều) function core khác, khi bản thân nó cần
dùng kết quả đó để hoàn thành **đúng 1 kết quả trả về của chính nó** — không phải điều phối nhiều
bước độc lập nối tiếp nhau (đó là Workflow, thuộc `/event/workflow/`, KHÔNG phải Core).

**Phân biệt Core-gọi-Core vs Workflow:**

| | Core gọi Core | Workflow (`/event/workflow/`) |
|---|---|---|
| Hình dạng | Lời gọi HỖ TRỢ TÍNH TOÁN cho 1 kết quả trả về duy nhất | Chuỗi BƯỚC độc lập, bước sau chỉ chạy khi bước trước ĐÃ HOÀN THÀNH |
| Ví dụ | `a = x; b = xxx(a); c = a + b; return c;` | `await functionA(); → hoàn thành → functionB(); → hoàn thành → ...` |
| Thường có gì | Tính toán đồng bộ, thuần | `shield`/`modal`, IndexedDB async, thứ tự phụ thuộc rõ ràng giữa các bước |
| Trả về | 1 giá trị/kết quả nghiệp vụ | Không nhất thiết trả giá trị — mục đích là hoàn tất chuỗi hành động |

**Mọi lời gọi Core → Core phải có `console.log` NGAY DƯỚI dòng gọi**, đúng format:
```js
console.log(`[<tên function gọi>] callTo: "<tên function được gọi>", request: "<mục đích ngắn gọn>"`);
```

```js
function computeSomething(x) {
    const a = x;
    const b = xxx(a);
    console.log(`[computeSomething] callTo: "xxx", request: "tính phần b từ a để cộng vào tổng"`);
    const c = a + b;
    return c;
}
```

**Ngoại lệ bắt buộc — KHÔNG log trong hot path 60fps** (vòng vẽ visualizer
`core/visualizer/draw-visualizer.js`, `taskManager` tần suất cao): vẫn được gọi core khác bình
thường trong các vòng lặp này, chỉ **miễn** yêu cầu `console.log` — log mỗi frame sẽ spam console
và tốn hiệu năng thật (khác `appState.get()`, vốn rẻ — xem `service/state.js` — nhưng
`console.log` có chi phí I/O thật, không miễn phí ở tần suất 60fps).

---

## Bảng tổng hợp

| Câu hỏi | Đúng luật ver 12 |
|---|---|
| Function có `if/else`/`switch` chọn giữa ≥2 TIẾN TRÌNH nghiệp vụ khác nhau theo `appState`? | **KHÔNG được** — tách thành nhiều function đơn tuyến, để Router/`VirtualMachineState` chọn |
| Function có guard clause thuần (validate, early-return, vẫn chỉ 1 tiến trình)? | **ĐƯỢC** — không phải Rule 1 |
| Function có tự `appState.get()` bên trong? | **KHÔNG được** — nhận qua tham số |
| Function có tự `appState.set()`/`mutate()`? | **ĐƯỢC** — chỉ chặn đọc, không chặn ghi |
| Function có gọi function core khác để hỗ trợ tính 1 kết quả duy nhất? | **ĐƯỢC** — phải `console.log` `sender/callTo/request` ngay dưới, TRỪ hot path 60fps |
| Function có điều phối nhiều bước, bước sau chờ bước trước hoàn thành (thường async/shield/modal)? | **KHÔNG thuộc Core** — đó là Workflow (`/event/workflow/`) |

← [Quay lại README](../README.md)
