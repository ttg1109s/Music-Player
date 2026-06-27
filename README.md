# Simple Audio Visualizer

Bản chia nhỏ và phát triển từ tệp `VM_4.html` gốc (2032 dòng, 1 file duy nhất)
thành các file CSS / JS / "component" HTML riêng biệt, **không dùng ES6
module** (`import`/`export`) — toàn bộ vẫn dùng `<script src="...">` thông
thường để chạy được trực tiếp khi mở `index.html` bằng cách double-click
(`file://`), không cần server, không cần build step. Xem
[readme/why-no-es6-module.md](./readme/why-no-es6-module.md) để biết lý do.

## Tóm tắt thay đổi mới nhất

> **⚠️ Bản này CHƯA nâng version chính thức.** Đang trong quá trình thử nghiệm 2 việc song song:
> khung đa ngôn ngữ (lang pack) và tái cấu trúc kiến trúc **event-driven** (`/event/`) — xem mục
> "Đang cải tiến: kiến trúc event-driven" ngay dưới đây. Coi đây là bản **làm việc (work in
> progress)**, không phải bản phát hành.

Bản nền là **ver 10**: dồn toàn bộ `setInterval`/`setTimeout` của project
qua 1 `TaskManager` tập trung duy nhất, sửa lỗi "Xoá hết dữ liệu" không
cập nhật UI + thêm phòng thủ khi bị gián đoạn, dọn 2 icon Sort/Grid khỏi
header Playlist vào Settings, và tính năng mới Tự động đổi hiệu ứng
Visualizer theo thời gian.



> **⚠️ Log mini-fix này CHƯA được test đủ kỹ để coi là bản chốt (final).**
> Một số phần còn nợ kỹ thuật — đặc biệt **video nền vẫn chưa khôi phục
> đúng vị trí (`currentTime`) sau khi quay lại tab**. Xem mục "Nợ kỹ
> thuật" ở cuối [changelog/v10-mini-not-full-fix.md](./changelog/v10-mini-not-full-fix.md)
> để biết đầy đủ những gì còn dở.

Sau đó có thêm 1 batch riêng **khung đa ngôn ngữ — i18n (chưa final)** — log
riêng: [changelog/v10-lang-test.md](./changelog/v10-lang-test.md):

- `English` làm ngôn ngữ GỐC, nằm cứng trong RAM (`js/core/lang.js`, 311
  key) — không qua fetch, không qua IndexedDB, luôn là fallback cuối cùng.
- Mọi ngôn ngữ khác (kể cả tiếng Việt, `lang/vi.json` đi kèm làm file mẫu)
  đều phải do người dùng tự upload qua Settings → "Ngôn ngữ" — project chạy
  qua `file://` nên không tự `fetch()` được file json nào khác.
- File upload được validate (key thừa cắt, key thiếu/sai kiểu bù từ
  English) rồi lưu IndexedDB (store `languages` mới, `DB_VERSION` 2→3).
- Toàn bộ text trong app (template + alert/modal động) đã chuyển qua
  `t()`/`tFormat()` — không còn chuỗi tiếng Việt hard-code nào sót lại.
- Default tạm thời của bản test này là `English` (để thấy ngay UI đổi ngôn
  ngữ, chắc chắn không phải cache cũ) — đổi lại tiếng Việt làm default cần
  thêm 1 bước (xem mục "Nợ kỹ thuật" trong changelog).

> **⚠️ Batch này CHƯA test trên browser thật.** Chỉ kiểm chứng qua
> `node --check` (cú pháp) + test harness Node `vm`/`require` (mock
> IndexedDB). Rủi ro lớn nhất chưa loại trừ: `lang.js` nạp NGAY ĐẦU
> `<body>`, TRƯỚC TOÀN BỘ file component — thay đổi thứ tự nạp script DUY
> NHẤT trong cả project so với trước batch này. (Cập nhật: sau đó `lang.js`
> đã được tách tiếp thành `lang/lang.js` + `lang/patch/*.js` — xem khung
> "Cập nhật cấu trúc thư mục" ngay dưới — nhưng vị trí nạp SỚM này vẫn giữ
> nguyên, chỉ đổi tên/số lượng file.) Xem mục "Nợ kỹ thuật" ở cuối
> [changelog/v10-lang-test.md](./changelog/v10-lang-test.md).

> **📦 Cập nhật cấu trúc thư mục (sau batch i18n trên):** `lang.js` đã được tách tiếp thành
> `lang/lang.js` (engine) + 5 file `lang/patch/*.js` (default key tiếng Anh, viết dạng `.js` vì
> `file://` không `fetch()` được file tĩnh). Đồng thời, toàn bộ `js/core/`, `js/components/`,
> `js/playlist/`, `js/visualizers/`, `js/main.js` đã được đưa thẳng ra root (`core/`,
> `components/`, `playlist/`, `visualizers/`, `main.js`) — thư mục `js/` không còn tồn tại.

## Đang cải tiến: kiến trúc event-driven (`/event/`) — chưa hoàn thành, đang làm dần

Xuất phát từ vấn đề: logic nghiệp vụ (gọi DB, build zip, xoá file...) đang nằm thẳng trong
callback của `addEventListener`, trộn lẫn với việc đăng ký sự kiện — khó đọc, khó sửa an toàn.
Đang tái cấu trúc theo mô hình "gửi thư": **listener** chỉ gửi message → **event bus** định tuyến
→ **router** quyết định gọi thẳng 1 hàm core hoặc giao cho **workflow** (chuỗi gọi nhiều hàm core,
có `withLoadingShield`/`alertModal`) → **core** là hàm thuần, không biết gì về DOM/event/modal.

**Làm từng cụm nhỏ, kiểm chứng kỹ trước khi nhân rộng** — không đổi đại trà 1 lần vì rủi ro làm
hỏng toàn bộ project đang chạy ổn định. Tới nay đã hoàn thành 2 cụm:

- **`storage`** (Quản lý dung lượng) — cụm mẫu đầu tiên, dùng làm chuẩn tham chiếu.
- **`playlist`** (gộp hành động trên 1 bài + nạp nhạc mới + sắp xếp/kiểu xem/tìm kiếm) — cụm thứ
  2, có thêm `EventStore` (store trung tâm tối giản cho state context, dùng `class`, mỗi module
  tự tạo 1 instance riêng namespace).

> **⚠️ Chưa chạy thử trên trình duyệt thật.** Mọi kiểm chứng tới nay đều bằng Node `vm` với DOM
> giả lập (nạp file thật theo đúng thứ tự nạp trong `index.html`, không viết lại code tay vào
> test). Còn **101/134 listener gốc chưa tách** — toàn bộ chi tiết quyết định kiến trúc, lỗi đã
> mắc, và việc còn thiếu được ghi đầy đủ trong `plan.md` (file kế hoạch riêng, mang theo giữa các
> phiên làm việc) — đọc file đó trước khi tiếp tục sửa bất kỳ phần nào liên quan `/event/`.

## Đọc tiếp ở đâu

| Muốn biết... | Đọc... |
|---|---|

| Toàn bộ lịch sử thay đổi (ver 1 → ver 10 → mini-fix → i18n) | [readme/changelog-index.md](./readme/changelog-index.md) |
| Cấu trúc thư mục, file nào làm gì | [readme/folder-structure.md](./readme/folder-structure.md) |
| Thứ tự nạp script trong `index.html` (quan trọng, đừng đảo) | [readme/script-load-order.md](./readme/script-load-order.md) |
| Cách chạy / deploy ứng dụng + các lưu ý theo từng bản | [readme/usage.md](./readme/usage.md) |
| Muốn sửa 1 tính năng cụ thể thì vào file nào | [readme/where-to-edit.md](./readme/where-to-edit.md) |
| Quy ước bắt buộc khi viết/sửa 1 Visual mới | [readme/visual-conventions.md](./readme/visual-conventions.md) |
| Vì sao không dùng ES6 module | [readme/why-no-es6-module.md](./readme/why-no-es6-module.md) |

## Cách dùng nhanh

Mở `index.html` bằng double-click, hoặc deploy lên GitHub Pages / static
host. Cần Internet ở lần mở đầu để tải thư viện qua CDN. Chi tiết đầy đủ +
các lưu ý quan trọng theo từng bản (đặc biệt về IndexedDB và modal "Tiếp
tục nghe?") ở [readme/usage.md](./readme/usage.md).
