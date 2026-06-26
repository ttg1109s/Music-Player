# Simple Audio Visualizer

Bản chia nhỏ và phát triển từ tệp `VM_4.html` gốc (2032 dòng, 1 file duy nhất)
thành các file CSS / JS / "component" HTML riêng biệt, **không dùng ES6
module** (`import`/`export`) — toàn bộ vẫn dùng `<script src="...">` thông
thường để chạy được trực tiếp khi mở `index.html` bằng cách double-click
(`file://`), không cần server, không cần build step. Xem
[readme/why-no-es6-module.md](./readme/why-no-es6-module.md) để biết lý do.

## Tóm tắt thay đổi mới nhất

Bản nền là **ver 10**: dồn toàn bộ `setInterval`/`setTimeout` của project
qua 1 `TaskManager` tập trung duy nhất, sửa lỗi "Xoá hết dữ liệu" không
cập nhật UI + thêm phòng thủ khi bị gián đoạn, dọn 2 icon Sort/Grid khỏi
header Playlist vào Settings, và tính năng mới Tự động đổi hiệu ứng
Visualizer theo thời gian.

Sau đó có thêm 1 loạt **mini-fix (chưa final)** — log riêng:
[changelog/v10-mini-not-full-fix.md](./changelog/v10-mini-not-full-fix.md):

- Sửa logo "SAV" không bấm được trên mobile (chuyển từ CSS `:hover` thuần
  sang JS — `click`/tap-ra-ngoài-tự-thu trên mobile, `mouseenter`/
  `mouseleave` trên desktop).
- Tự động đổi hiệu ứng: chuyển đúng vào drawer "Tùy chỉnh Visualizer", và
  nút "Đổi hiệu ứng" tự khoá khi tính năng này đang bật.
- Cơ chế "ẩn tab" viết lại hoàn toàn: reload trang thật NGAY lúc ẩn tab
  (không đợi quay lại), phân biệt được F5 thủ công với ẩn tab thật, hỏi
  "Tiếp tục nghe?" ngay từ đầu lúc khởi động lại (không đợi load xong
  playlist), khôi phục cả vị trí audio/video nền/hiệu ứng auto-switch đã
  lưu khi chọn "Tiếp tục phát"/"Nghe lại".
- Thêm Settings → "Khắc phục sự cố": **Khởi động lại app** / **Khôi phục
  cài đặt mặc định**.
- Thêm toggle ẩn/hiện dải BPM/Pitch/Energy trong Control Center.

> **⚠️ Log mini-fix này CHƯA được test đủ kỹ để coi là bản chốt (final).**
> Một số phần còn nợ kỹ thuật — đặc biệt **video nền vẫn chưa khôi phục
> đúng vị trí (`currentTime`) sau khi quay lại tab**. Xem mục "Nợ kỹ
> thuật" ở cuối [changelog/v10-mini-not-full-fix.md](./changelog/v10-mini-not-full-fix.md)
> để biết đầy đủ những gì còn dở.

## Đọc tiếp ở đâu

| Muốn biết... | Đọc... |
|---|---|
| Toàn bộ lịch sử thay đổi (ver 1 → ver 10 → mini-fix) | [readme/changelog-index.md](./readme/changelog-index.md) |
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
