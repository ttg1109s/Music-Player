# Quy ước BẮT BUỘC khi viết / sửa một Visual (★★★★★★ ver 6)

Mọi visual trong `js/visualizers/types/*.js` PHẢI hỗ trợ đầy đủ 4 nhóm cấu hình
chung dưới đây. Đây là hợp đồng chung — visual nào bỏ sót sẽ bị coi là lỗi:

1. **Video nền (`vizConfig.videoBgEnabled`)** — khi BẬT, visual KHÔNG được tô
   một lớp nền đục phủ kín canvas (sky/background fill) đè lên video. Hãy bọc
   mọi lệnh `fillRect(0,0,canvas.width,canvas.height)` mang tính "nền" trong
   `if (!vizConfig.videoBgEnabled) { ... }` để video hiện xuyên qua (mẫu: cả
   `drawRainGlass` lẫn `drawRainStreet` trong `rain.js`). Các phần tử tiền cảnh
   (thanh, hạt, đèn, mặt đất...) vẫn vẽ đè bình thường lên trên video.
2. **Màu nền (`vizConfig.bgColor`)** — khi KHÔNG dùng video, nền phải theo
   `bgColor` người dùng chọn (qua `updateDOMBackground()` cho body, và/hoặc lệnh
   fill nền trong chính visual).
3. **Chế độ màu (`vizConfig.mode` = `solid` | `dynamic` | `rainbow/auto`)** —
   màu của các phần tử vẽ phải lấy từ helper màu chung (`getComputedColor()` /
   `interpolateColor()` / `vizConfig.solidColor` / `dynA`-`dynB`) thay vì hard-code,
   để nhất quán với lựa chọn của người dùng.
4. **Hiệu năng (`vizConfig.quality` + `PERFORMANCE_PROFILES`)** — số lượng phần
   tử (hạt, thanh, tia...) phải co giãn theo `perf` được truyền vào hàm vẽ, để
   máy yếu vẫn chạy mượt.

Khi thêm visual mới: đăng ký hàm vẽ vào `VISUALIZER_DRAWERS` trong
`draw-visualizer.js`, thêm tên `type` vào `MODES` (`config.js`), và tự kiểm 4
mục trên trước khi coi là hoàn tất.

← [Quay lại README](../README.md)
