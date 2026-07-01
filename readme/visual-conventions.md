# Quy ước BẮT BUỘC khi viết / sửa một Visual (từ ver 6, đường dẫn cập nhật ver 11)

Mọi visual trong `core/visualizer/types/*.js` PHẢI hỗ trợ đầy đủ 4 nhóm cấu hình chung dưới đây.
Đây là hợp đồng chung — visual nào bỏ sót sẽ bị coi là lỗi:

1. **Video nền (`vizConfig.videoBgEnabled`)** — khi BẬT, visual KHÔNG được tô một lớp nền đục phủ
   kín canvas (sky/background fill) đè lên video. Hãy bọc mọi lệnh
   `fillRect(0,0,canvas.width,canvas.height)` mang tính "nền" trong
   `if (!appState.get('vizConfig').videoBgEnabled) { ... }` để video hiện xuyên qua (mẫu: cả
   `drawRainGlass` lẫn `drawRainStreet` trong `rain.js`). Các phần tử tiền cảnh (thanh, hạt, đèn,
   mặt đất...) vẫn vẽ đè bình thường lên trên video.
2. **Màu nền (`vizConfig.bgColor`)** — khi KHÔNG dùng video, nền phải theo `bgColor` người dùng
   chọn (qua `updateDOMBackground()` cho body, và/hoặc lệnh fill nền trong chính visual).
3. **Chế độ màu (`vizConfig.mode` = `solid` | `dynamic` | `rainbow/auto`)** — màu của các phần tử
   vẽ phải lấy từ helper màu chung (`getComputedColor()` / `interpolateColor()` /
   `vizConfig.solidColor` / `dynA`-`dynB`) thay vì hard-code, để nhất quán với lựa chọn người dùng.
4. **Hiệu năng (`vizConfig.quality` + `PERFORMANCE_PROFILES`)** — số lượng phần tử (hạt, thanh,
   tia...) phải co giãn theo `perf` được truyền vào hàm vẽ, để máy yếu vẫn chạy mượt.

**[v11] Cách đọc `vizConfig` — BẮT BUỘC qua `appState.get('vizConfig')`, không còn biến `vizConfig`
trần nào để đọc trực tiếp** (đã migrate 100% qua `service/state.js`, xem
[changelog/v11.md](./changelog/v11.md) mục 3). Trong 1 hàm vẽ gọi nhiều lần/khung hình, đọc 1 lần
ra biến cục bộ đầu hàm (`const cfg = appState.get('vizConfig');`) rồi dùng `cfg.xxx` trong toàn hàm
— KHÔNG gọi `appState.get('vizConfig')` lặp lại nhiều lần trong cùng 1 vòng lặp vẽ (đúng khuyến
nghị hiệu năng hot path 60fps của `service/state.js`). `PERFORMANCE_PROFILES`/`MODES` vẫn là hằng
số **local** trong `core/config.js` (CHƯA migrate sang `CONST` — xem changelog/v11.md mục 3), đọc
trực tiếp như cũ, không qua `appState`.

Khi thêm visual mới: đăng ký hàm vẽ vào `VISUALIZER_DRAWERS` trong
`core/visualizer/draw-visualizer.js`, thêm tên `type` vào `MODES` (`core/config.js`), và tự kiểm 4
mục trên trước khi coi là hoàn tất. Nếu visual mới cần đọc/ghi biến runtime riêng (kiểu
`beatTimes`/`stars`/`rubikCubes`...), khai thêm key vào `STATE_SCHEMA` (`service/state.js`) thay vì
tự khai `let` cục bộ mới trong file visual — xem quy ước STATE ở
[changelog/v11.md](./changelog/v11.md) mục 3.

← [Quay lại README](../README.md)
