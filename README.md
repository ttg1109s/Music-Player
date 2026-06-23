# Audio Visualizer - Master Edition (ver 3 - Bãi Đồi, Mưa Phố & 4 Mùa)

Bản chia nhỏ của file `VM_4.html` gốc (2032 dòng, 1 file duy nhất) thành các
file CSS / JS / "component" HTML riêng biệt, **không dùng ES6 module**
(`import`/`export`) — toàn bộ vẫn dùng `<script src="...">` thông thường để
chạy được trực tiếp khi mở `index.html` bằng cách double-click (file://),
không cần server, không cần build step.

Ngoài việc chia module, project đã qua 3 lượt cải tiến tính năng/visual.
Chi tiết từng lượt nằm ở file changelog riêng:

- [CHANGELOG_v3.md](./CHANGELOG_v3.md) — mới nhất: Bãi Đồi & Túp Lều (thay
  Rừng Đom Đóm cũ), kiểu mưa "Mưa phố & công viên", chế độ visualizer "4 Mùa".
- [CHANGELOG_v2.md](./CHANGELOG_v2.md) — làm mượt camera Vortex, sửa lỗi Bar
  3D biến mất, sửa lỗi màu bị "cài cứng", thiết kế lại hình cây (Rừng Đom Đóm).
- [CHANGELOG_v1.md](./CHANGELOG_v1.md) — bỏ kiểu Vortex "Bụi Lượng Tử", bỏ
  camera lắc theo beat, thiết kế lại toàn diện Rừng Đom Đóm (bản đầu).

## Vì sao không dùng ES6 module ở đây?

Với `type="module"`, mỗi file có scope riêng và trình duyệt áp dụng CORS khi
nạp qua `file://`, nên sẽ bị lỗi khi mở trực tiếp. Với `<script>` thường,
tất cả file chia sẻ **cùng một global scope** giống như khi chúng còn nằm
trong một thẻ `<script>` duy nhất — đây là lý do toàn bộ logic gốc vẫn chạy
đúng dù đã được chia ra nhiều file.

## Cấu trúc thư mục

```
visual-master/
├── README.md
├── CHANGELOG_v1.md
├── CHANGELOG_v2.md
├── CHANGELOG_v3.md
├── index.html                  ← Mở file này để chạy ứng dụng
├── css/
│   └── styles.css               (toàn bộ CSS gốc, không đổi)
└── js/
    ├── components/
    │   ├── loading-shield.js
    │   ├── playlist-view.js
    │   ├── visualizer-overlay.js
    │   ├── subtitle-modal.js
    │   ├── bottom-player.js
    │   └── settings-drawer.js   (★ ver 1, ★★★ ver 3)
    ├── main.js
    ├── core/
    │   ├── config.js            (★ ver 1, ★★★ ver 3)
    │   ├── dom-refs.js          (★ ver 1, ★★★ ver 3)
    │   ├── three-vortex.js      (★ ver 1, ★★ ver 2)
    │   ├── state-and-video-bg.js
    │   ├── subtitles.js
    │   ├── equalizer-settings.js (★ ver 1, ★★★ ver 3)
    │   ├── subtitle-display.js
    │   ├── wakelock.js
    │   ├── color-utils.js
    │   ├── canvas-scene-setup.js (★ ver 1, ★★ ver 2, ★★★ ver 3)
    │   ├── playlist.js
    │   ├── player-controls.js   (★★★ ver 3)
    │   ├── audio-engine.js
    │   ├── audio-analysis.js
    │   └── rubik-math.js
    └── visualizers/
        ├── draw-helpers.js      (★★★ ver 3)
        └── draw-visualizer.js   (★ ver 1, ★★ ver 2, ★★★ ver 3)
```

(★ = có thay đổi ở ver 1, ★★ = có thay đổi thêm ở ver 2, ★★★ = có thay đổi
thêm ở ver 3; file không đánh dấu giữ nguyên 100% so với bản chia module
gốc. Không có file `.js` nào mới được thêm ở bất kỳ ver nào.)

## Thứ tự nạp script — QUAN TRỌNG, không thay đổi

`index.html` nạp script theo đúng 4 bước, không được đảo:

1. **components/*.js** — chỉ định nghĩa biến `TPL_...` (chuỗi HTML), chưa
   đụng vào DOM.
2. **main.js** — chèn toàn bộ `TPL_...` vào `<div id="app-root">`. Sau bước
   này, mọi phần tử có `id="..."` mới thực sự tồn tại trong DOM.
3. **core/*.js** — các file này gọi `document.getElementById(...)` ngay khi
   được nạp, nên phải chạy sau bước 2. Thứ tự giữa các file trong `core/`
   cũng giữ nguyên như trong file gốc vì có phụ thuộc biến/hàm giữa chúng.
4. **visualizers/*.js** — các hàm vẽ canvas + vòng lặp `requestAnimationFrame`
   chính. `draw-visualizer.js` còn chứa dòng
   `document.addEventListener('DOMContentLoaded', () => { loadConfig(); ... })`
   ở cuối cùng — đây là điểm khởi động thực sự của toàn bộ app, giữ nguyên
   vị trí như bản gốc.

## Cách dùng

Mở `index.html` bằng double-click (hoặc kéo vào trình duyệt). Ứng dụng cần
kết nối Internet ở lần mở đầu để tải 4 thư viện ngoài qua CDN (Tailwind,
jsmediatags, NoSleep.js, Three.js) — đây là giới hạn từ bản gốc, không phải
do việc chia file hay các thay đổi visual.

## Muốn sửa gì thì sửa ở đâu?

| Muốn sửa... | Vào file... |
|---|---|
| Giao diện danh sách bài hát | `js/components/playlist-view.js` |
| Giao diện ngăn cài đặt (kể cả setting mưa phố, 4 mùa) | `js/components/settings-drawer.js` |
| Thêm/sửa hiệu ứng visualizer (Rừng Đom Đóm, Mưa, 4 Mùa...) | `js/visualizers/draw-visualizer.js` |
| Hàm vẽ dùng chung (giọt nước, khung kính, người ngồi ghế, xác định mùa hiện tại) | `js/visualizers/draw-helpers.js` |
| Logic phát nhạc, next/prev, shuffle | `js/core/playlist.js`, `js/core/player-controls.js` |
| Hiện/ẩn các khối setting theo kiểu visualizer đang chọn | `js/core/player-controls.js` (hàm `updateTypeUI`, `updateRainStyleUI`, `updateSeasonModeUI`) |
| Equalizer, cấu hình lưu localStorage | `js/core/equalizer-settings.js` |
| Phụ đề (.srt) | `js/core/subtitles.js`, `js/core/subtitle-display.js` |
| Hiệu ứng Vortex (Three.js) — khởi tạo rings/bars/wave, camera | `js/core/three-vortex.js` (khởi tạo) + `js/visualizers/draw-visualizer.js` (cập nhật mỗi khung hình) |
| Khởi tạo bãi đồi/túp lều, đèn đường/ghế công viên, khung cảnh 4 mùa | `js/core/canvas-scene-setup.js` |
| Thêm trường cấu hình mới (lưu vào `vizConfig`) | `js/core/config.js` (giá trị mặc định) + `js/core/equalizer-settings.js` (nạp lúc `loadConfig`) |
| Màu sắc, nền | `js/core/color-utils.js` |
| Toàn bộ màu sắc/giao diện CSS | `css/styles.css` |
