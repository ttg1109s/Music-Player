# Mục lục Changelog

Bản hiện tại: **ver 12** — thêm hạ tầng rẽ nhánh theo `appState` cho `/event/`: `service/
operation.js` (so sánh toán tử dùng chung), `event/block.js` (chặn message trước router, hiện
rỗng), `event/virtual-machine-state.js` (chạy nhiều workflow độc lập trong 1 case router). CHƯA
wire vào router/core nào — xem [event-bus-flow.md](./event-bus-flow.md) cho sơ đồ đầy đủ. Xem
đầy đủ ở [v12.md](./changelog/v12.md).

- [v12.md](./changelog/v12.md) — hạ tầng block/virtual-machine-state cho event bus, chưa wire
- [v11.md](./changelog/v11.md) — event bus hoàn tất, State tập trung (đã audit từng key), 3 lỗi nhỏ
- [v10-lang-test.md](./changelog/v10-lang-test.md) — khung đa ngôn ngữ (i18n), English gốc cứng
  RAM, ngôn ngữ khác qua IndexedDB tự upload — ⚠️ vẫn CHƯA test trên browser thật (không đổi ở v11)
- [v10-mini-not-full-fix.md](./changelog/v10-mini-not-full-fix.md) — các fix lẻ (logo mobile, vị
  trí UI auto-switch, viết lại cơ chế ẩn tab, Khắc phục sự cố, toggle BPM/Pitch/Energy) — nợ kỹ
  thuật video nền `currentTime` ghi trong log này đã được xử lý ở phiên ngay trước v11 (xem
  v11.md mục "Nợ kỹ thuật còn lại")
- [v10.md](./changelog/v10.md) — TaskManager tập trung, fix "Xoá hết dữ liệu", dọn icon Sort/Grid,
  Tự động đổi hiệu ứng Visualizer
- [v9.md](./changelog/v9.md) — fix loạt lỗi iOS (upload im lặng, reset không hoàn chỉnh, AudioContext
  'interrupted', IndexedDB connection tự đóng), modal "Tiếp tục nghe?"
- [v8.md](./changelog/v8.md) — modal sửa bài thêm tab Ảnh bìa, logo SAV, tách settings-drawer.js
- [v7.md](./changelog/v7.md) — YIN sang Web Worker, sửa O(n²), khoá định dạng file, tự phục hồi config
- [v6.md](./changelog/v6.md) — dọn lỗi vặt ver 5, tách playlist.js, ô tìm kiếm + thống kê nghe
- [v5.md](./changelog/v5.md) — playlist persist qua IndexedDB (thay đổi lớn nhất lịch sử project)
- [v4.md](./changelog/v4.md)
- [v3.md](./changelog/v3.md)
- [v2.md](./changelog/v2.md)
- [v1.md](./changelog/v1.md)

## Tóm tắt từng bản (cũ → mới)

Ver 12 thêm hạ tầng rẽ nhánh theo `appState` cho kiến trúc `/event/`, KHÔNG đổi hành vi app nào —
`service/operation.js` (so sánh toán tử `=== !== > < >= <= in notIn` dùng chung), `event/block.js`
(chặn 1 `msg.type` TRƯỚC khi vào router, đăng ký qua `eventBus.registerBlock()`, hiện đang RỖNG),
`event/virtual-machine-state.js` (`VirtualMachineState.run()`, chạy nhiều workflow độc lập NGAY
TRONG 1 case của router, không loại trừ nhau). Cả 3 file đã nạp vào `index.html` nhưng chưa wire
case thật nào — xem [event-bus-flow.md](./event-bus-flow.md) cho sơ đồ đầy đủ luồng
listener→router→core/workflow/virtual-machine-state.

Ver 11 KHÔNG có tính năng mới cho người dùng cuối — thuần tái cấu trúc nội bộ. Kiến trúc `/event/`
(`listener → router → workflow → core`) hoàn tất cho 14 cụm (119 listener nghiệp vụ), cả State
(96 biến mutable) lẫn CONST (16 hằng số) đều migrate 100% qua `service/state.js` (93 chỗ dùng
`CONST.xxx` thật trên 18 file). 3 lỗi nhỏ phát hiện qua audit: 1 file mồ côi, 1 biến khai báo lạc
chỗ, 1 comment sai đường dẫn. Chốt chính thức 2 batch trước từng để "chưa final" (mini-fix + i18n)
— chi tiết đầy đủ, kèm số liệu đối chiếu qua script, ở [v11.md](./changelog/v11.md).

Ver 10 tập trung sửa lỗi thực tế phát hiện khi dùng trên iOS (đặc biệt khi
chuyển tab/ẩn trình duyệt): dồn toàn bộ `setInterval`/`setTimeout` qua 1
`TaskManager` tập trung duy nhất, sửa lỗi "Xoá hết dữ liệu" không cập nhật
UI + thêm phòng thủ khi bị gián đoạn, dọn 2 icon Sort/Grid khỏi header
Playlist vào Settings, và tính năng mới Tự động đổi hiệu ứng Visualizer
theo thời gian. Sau đó có 2 batch riêng (mini-fix + i18n) — cả 2 nay đã
được ver 11 chốt chính thức.

Ver 9 tập trung sửa lỗi thực tế phát hiện khi dùng trên iOS (đặc biệt khi
chuyển tab/ẩn trình duyệt): sửa lỗi upload im lặng, lỗi reset không hoàn
chỉnh khi chuyển tab, nguyên nhân gốc rễ của "không ra tiếng" sau khi quay
lại tab (AudioContext chuyển `'interrupted'` + IndexedDB connection bị
trình duyệt tự đóng không tự mở lại), và modal "Tiếp tục nghe?" khi quay
lại tab.

Ver 8 tập trung vào chỉnh sửa metadata bài hát và dọn kiến trúc file: modal
"Sửa thông tin bài hát" có thêm tab "Ảnh bìa" (upload/xem trước/xóa cover
ngay trong app, tự ghi vào tag APIC lúc Xuất tệp), 2 modal liên quan thông
tin/ảnh bài hát thiết kế lại theo theme kính mờ "nét" (`glass-modal`,
layout dạng card/icon), thêm logo wordmark "SAV" (không khung/viền, kiểu
Facebook) hover trượt chữ theo chiều ngang ở góc Playlist, nút "Thêm nhạc"
hỗ trợ chọn cả 1 thư mục nhạc, ô tìm kiếm lọc thêm theo album, và
`settings-drawer.js` (từng dồn ~28KB HTML vào 1 file) được tách thành 5
file con theo từng khối cài đặt.

Ver 7 tách thuật toán nhận diện cao độ (YIN) sang Web Worker riêng để
không tranh CPU với canvas mỗi khung hình, sửa 2 điểm O(n²) khi playlist
lớn, khoá định dạng file ở cả 3 nơi nhận upload (nhạc/ảnh nền/video nền),
và cấu hình tự phục hồi từ IndexedDB nếu `localStorage` bị trình duyệt xoá
mất.

Ver 6 dọn lỗi vặt còn sót từ ver 5 (sort, trạng thái rỗng, video nền
chớp/khựng), tách lại file `playlist.js` quá khổ, thêm ô tìm kiếm + thống
kê nghe theo từng bài.

Ver 5 là thay đổi lớn nhất trong lịch sử project — toàn bộ playlist (nhạc,
tag, cover, phụ đề, ảnh/video nền) persist qua **IndexedDB**.

Lịch sử các bản cũ hơn (ver 1–4) nằm ở changelog riêng từng bản trong thư
mục [changelog/](./changelog/).

← [Quay lại README](../README.md)
