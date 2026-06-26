# Mục lục Changelog

Bản hiện tại (**ver 10**, cộng thêm mini-fix sau đó) gồm 4 phần chính ở
ver 10: dồn toàn bộ `setInterval`/`setTimeout` của project qua 1
`TaskManager` tập trung duy nhất, sửa lỗi "Xoá hết dữ liệu" không cập nhật
UI + thêm phòng thủ khi bị gián đoạn, dọn 2 icon Sort/Grid khỏi header
Playlist vào Settings, và tính năng mới Tự động đổi hiệu ứng Visualizer
theo thời gian. Sau đó có thêm 1 loạt mini-fix (xem
[v10-mini-not-full-fix.md](../changelog/v10-mini-not-full-fix.md)) — **log
đó chưa test đủ kỹ để coi là final, còn nợ kỹ thuật.**

- [changelog/v10-mini-not-full-fix.md](../changelog/v10-mini-not-full-fix.md) — ⚠️ chưa final, xem mục "Nợ kỹ thuật"
- [changelog/v10.md](../changelog/v10.md)
- [changelog/v9.md](../changelog/v9.md)
- [changelog/v8.md](../changelog/v8.md)
- [changelog/v7.md](../changelog/v7.md)
- [changelog/v6.md](../changelog/v6.md)
- [changelog/v5.md](../changelog/v5.md)
- [changelog/v4.md](../changelog/v4.md)
- [changelog/v3.md](../changelog/v3.md)
- [changelog/v2.md](../changelog/v2.md)
- [changelog/v1.md](../changelog/v1.md)

## Tóm tắt từng bản (cũ → mới)

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
`js/components/settings-drawer.js` (từng dồn ~28KB HTML vào 1 file) được
tách thành 5 file con theo từng khối cài đặt.

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
mục [changelog/](../changelog/).

← [Quay lại README](../README.md)
