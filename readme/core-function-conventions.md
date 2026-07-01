# Quy tắc viết function Core / nghiệp vụ — từ ver 12 trở đi

> **Áp dụng cho function MỚI viết hoặc được SỬA kể từ ver 12** — **[Đã chốt]** core di sản (~110
> file hiện có, phần lớn đang tự `appState.get()` trực tiếp, đúng theo quy ước cũ ở
> `service/state.js`) **giữ nguyên, KHÔNG rewrite/audit hồi tố**. Chỉ code mới viết hoặc bị đụng
> tới (sửa thật, không phải chỉ đọc lướt qua) từ ver 12 trở đi mới bắt buộc theo 3 rule dưới đây.

Đọc cùng [event-bus-flow.md](./event-bus-flow.md) — tài liệu đó quy định luồng
`listener → router → core/workflow/VirtualMachineState`; tài liệu NÀY quy định riêng bên TRONG 1
function Core/nghiệp vụ được viết ra sao. Xem [core-legacy-audit.md](./core-legacy-audit.md) cho
danh sách function core di sản hiện đang vi phạm 3 rule dưới đây (audit tham khảo, KHÔNG bắt buộc
sửa ngay — core di sản giữ nguyên theo phạm vi áp dụng ở trên).

---

## Rule 1 — Đơn tuyến nghiệp vụ: 1 function core = đúng 1 chức năng

**Cấm:** `if/else`, `switch/case`, object-map chọn hàm — khi mục đích là chọn giữa **≥2 tiến
trình/logic nghiệp vụ khác nhau trong cùng 1 function**. Quy tắc này KHÔNG phân biệt điều kiện rẽ
nhánh lấy từ đâu (`appState`, tham số truyền vào, hay bất kỳ nguồn nào khác) — hễ nhánh đó tạo ra
1 tiến trình/logic KHÁC, vi phạm bất kể nguồn điều kiện là gì. Việc "chọn tiến trình nào chạy" không
còn là việc của 1 function core duy nhất — tách thành nhiều function đơn tuyến, để nơi gọi (Router/
`VirtualMachineState` nếu rẽ theo state — xem [event-bus-flow.md mục 4C](./event-bus-flow.md); hay
đơn giản là nơi gọi tự chọn đúng hàm nếu rẽ theo tham số) quyết định gọi hàm nào.

**KHÔNG bị cấm:** guard clause thuần (validate tham số đầu vào, early-return khi giá trị không
hợp lệ) — đó không phải "tiến trình khác nhau", chỉ là điều kiện tiên quyết để chạy ĐÚNG 1 tiến
trình duy nhất của hàm.

**Phép thử nhanh — xoá điều kiện `if` đó đi, hàm còn lại thế nào?**
- Vẫn còn nguyên ĐÚNG 1 kịch bản, chỉ mất phần "dừng sớm nếu chưa đủ điều kiện" → **guard clause,
  được phép.**
- Code không còn ý nghĩa, vì đang mô tả ≥2 kịch bản nghiệp vụ khác hẳn nhau (không phải 1 kịch
  bản có lối thoát sớm) → **rẽ nhánh tiến trình, KHÔNG được phép**, dù điều kiện đó lấy từ
  `appState`, tham số, hay bất cứ đâu.

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
// SAI — rẽ nhánh theo appState tạo ra 2 TIẾN TRÌNH khác nhau (khoá / áp dụng)
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

```js
// SAI — rẽ nhánh theo THAM SỐ (không đụng appState), vẫn tạo ra 2 TIẾN TRÌNH khác nhau -> vẫn vi phạm
function handleUpload(file, isVideo) {
    if (isVideo) {
        // tiến trình 1: xử lý video
        validateVideoFile(file);
        setMeta('videoBg', file);
    } else {
        // tiến trình 2: xử lý ảnh — KHÁC HẲN tiến trình 1, không phải cùng 1 kịch bản có lối thoát sớm
        validateImageFile(file);
        setMeta('imageBg', file);
    }
}
```
Sửa đúng: tách `handleVideoUpload(file)` và `handleImageUpload(file)` riêng, để nơi gọi (router/
workflow) tự chọn gọi hàm nào — bất kể `isVideo` tới từ đâu (tham số, tên field input, hay gì
khác), việc chọn hàm không thuộc về bên trong 1 function core.

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

## Rule 3 — Core gọi Core CHỈ hợp lệ khi dùng return value — mọi chuỗi side-effect nối tiếp là Workflow

**Tiêu chí duy nhất để 1 lời gọi function-khác được PHÉP nằm trong 1 core function:** hàm được
gọi (B) **CÓ return value VÀ hàm gọi (A) DÙNG giá trị đó** vào phép tính ra kết quả của chính A.
B có nhận tham số hay không KHÔNG liên quan tới tiêu chí này (B tự tạo return bằng cách nào là
việc của B) — chỉ cần A THẬT SỰ dùng được cái B trả về.

**Nếu B không có return (void) và A gọi B chỉ để B tự tạo side-effect** (set state, cập nhật UI,
ghi log...) — KHÔNG được giữ trong core, **bất kể đơn giản hay phức tạp, bất kể có cần
shield/modal hay không.** Bản chất của việc "A bọc lấy B rồi B rồi C... nối tiếp nhau, không cái
nào trả giá trị cho A dùng" chính là Workflow — chỉ là code đang SAI VỊ TRÍ (nằm trong core thay
vì `/event/workflow/`), không phải Workflow "cần thêm điều kiện gì" mới tính là Workflow. **Bỏ
hẳn điều kiện "cần shield/modal" từng dùng để quyết định có cần Workflow hay không** (xem cập nhật
tương ứng ở [event-bus-flow.md mục (B)](./event-bus-flow.md)) — giờ chỉ cần đúng hình dạng "≥2
lời gọi side-effect nối tiếp, có thứ tự phụ thuộc nhau" là đủ, có `shield`/`modal` hay không không
còn là điều kiện riêng, chỉ là 1 LÝ DO thường gặp khiến 1 chuỗi cần async (IndexedDB, network...).

### Ngoại lệ — gọi BẤT ĐỒNG BỘ và KHÔNG chờ (fire-and-forget, không `await`)

Nếu A gọi 1 hàm khác dưới dạng bất đồng bộ và **KHÔNG `await`/không chờ nó hoàn thành** trước khi
code sau đó tiếp tục chạy — lời gọi đó **KHÔNG tính là Workflow**, được giữ trong core. Lý do:
bản chất Workflow là "bước SAU chỉ chạy khi bước TRƯỚC đã hoàn thành" (có phụ thuộc thứ tự thực
thi). Lời gọi async không chờ không tạo phụ thuộc thứ tự nào — nó chạy song song, độc lập hoàn
toàn với phần còn lại của A, không giấu 1 "bước kế tiếp" nào cả.

**Ngược lại — gọi ĐỒNG BỘ (dù chỉ set 1 state đơn giản) tạo ra thứ tự phụ thuộc → VẪN LÀ
Workflow, không có ngoại lệ nào cho việc "đơn giản".** Khác biệt duy nhất giữa 1 chuỗi state-set
đồng bộ nối tiếp và 1 Workflow "phức tạp" chỉ là quy mô, không phải bản chất.

```js
// ĐƯỢC — B có return, A DÙNG vào phép tính
function computeSomething(x) {
    const a = x;
    const b = xxx(a); // xxx() CÓ return value
    console.log(`[computeSomething] callTo: "xxx", request: "tính phần b từ a để cộng vào tổng"`);
    const c = a + b; // A THẬT SỰ dùng b
    return c;
}
```

```js
// ĐƯỢC — gọi bất đồng bộ, KHÔNG await, không tạo phụ thuộc thứ tự -> ngoại lệ, không phải Workflow
function doSomething(a, c) {
    const A = a + c;
    logListenEventAsync(A); // KHÔNG await — fire-and-forget, code dưới chạy ngay, không chờ kết quả
    // ...code khác tiếp tục ngay lập tức, không phụ thuộc thời điểm logListenEventAsync() xong
    return A;
}
```

```js
// SAI — B không có return (void), A gọi B chỉ để side-effect -> đây LÀ Workflow, phải chuyển ra
// /event/workflow/, KHÔNG được giữ trong core dù rất đơn giản, dù không cần shield/modal
function applyModeChange(idx) {
    appState.set('currentModeIndex', idx); // set state X
    updateTypeUI();  // void, side-effect thuần — A không dùng gì từ nó
    saveConfig();     // void, side-effect thuần — A không dùng gì từ nó, PHỤ THUỘC thứ tự (chạy
                       // sau updateTypeUI(), sau khi state X đã set) -> đúng hình dạng Workflow
}
```
Sửa đúng: tách 3 dòng trên thành `workflowX.applyModeChange(idx)` trong `/event/workflow/<cụm>.js`
— `applyModeChange` không còn là core function nữa, mà là 1 method của Workflow.

**Mọi lời gọi Core → Core hợp lệ (theo tiêu chí return-value ở trên) phải có `console.log` NGAY
DƯỚI dòng gọi**, đúng format:
```js
console.log(`[<tên function gọi>] callTo: "<tên function được gọi>", request: "<mục đích ngắn gọn>"`);
```

**Ngoại lệ bắt buộc — KHÔNG log trong hot path 60fps** (vòng vẽ visualizer
`core/visualizer/draw-visualizer.js`, `taskManager` tần suất cao): vẫn được gọi core khác bình
thường trong các vòng lặp này (nếu thoả tiêu chí return-value), chỉ **miễn** yêu cầu `console.log`
— log mỗi frame sẽ spam console và tốn hiệu năng thật (khác `appState.get()`, vốn rẻ — xem
`service/state.js` — nhưng `console.log` có chi phí I/O thật, không miễn phí ở tần suất 60fps).

---

## Bảng tổng hợp

| Câu hỏi | Đúng luật ver 12 |
|---|---|
| Function có `if/else`/`switch` chọn giữa ≥2 TIẾN TRÌNH/logic nghiệp vụ khác nhau (bất kể điều kiện lấy từ `appState`, tham số, hay đâu khác)? | **KHÔNG được** — tách thành nhiều function đơn tuyến, để nơi gọi chọn |
| Function có guard clause thuần (validate, early-return, vẫn chỉ 1 tiến trình)? | **ĐƯỢC** — không phải Rule 1 |
| Function có tự `appState.get()` bên trong? | **KHÔNG được** — nhận qua tham số |
| Function có tự `appState.set()`/`mutate()`? | **ĐƯỢC** — chỉ chặn đọc, không chặn ghi |
| Function gọi function core khác CÓ return value VÀ dùng giá trị đó? | **ĐƯỢC** — phải `console.log` `sender/callTo/request` ngay dưới, TRỪ hot path 60fps |
| Function gọi function core khác VOID (không return, chỉ side-effect), gọi ĐỒNG BỘ? | **KHÔNG được** — đây LÀ Workflow, chuyển ra `/event/workflow/`, bất kể đơn giản hay cần shield/modal |
| Function gọi function khác BẤT ĐỒNG BỘ và KHÔNG `await`/không chờ? | **ĐƯỢC** — ngoại lệ, không tạo phụ thuộc thứ tự nên không phải Workflow |

← [Quay lại README](../README.md)
