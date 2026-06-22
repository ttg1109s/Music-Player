# Audio Visualizer - Master Edition (đã chia module)

Bản chia nhỏ của file `VM_4.html` gốc (2032 dòng, 1 file duy nhất) thành các
file CSS / JS / "component" HTML riêng biệt, **không dùng ES6 module**
(`import`/`export`) — toàn bộ vẫn dùng `<script src="...">` thông thường để
chạy được trực tiếp khi mở `index.html` bằng cách double-click (file://),
không cần server, không cần build step.

## Vì sao không dùng ES6 module ở đây?

Với `type="module"`, mỗi file có scope riêng và trình duyệt áp dụng CORS khi
nạp qua `file://`, nên sẽ bị lỗi khi mở trực tiếp. Với `<script>` thường,
tất cả file chia sẻ **cùng một global scope** giống như khi chúng còn nằm
trong một thẻ `<script>` duy nhất — đây là lý do toàn bộ logic gốc vẫn chạy
đúng dù đã được chia ra nhiều file.

## Cấu trúc thư mục

```
visual-master/
├── index.html                  ← Mở file này để chạy ứng dụng
├── css/
│   └── styles.css               (toàn bộ CSS gốc)
└── js/
    ├── components/              (mỗi file = 1 chuỗi HTML, gắn vào DOM lúc khởi động)
    │   ├── loading-shield.js
    │   ├── playlist-view.js
    │   ├── visualizer-overlay.js
    │   ├── subtitle-modal.js
    │   ├── bottom-player.js
    │   └── settings-drawer.js
    ├── main.js                  (bootstrap: lắp components vào #app-root)
    ├── core/                    (logic nghiệp vụ, theo đúng thứ tự phụ thuộc)
    │   ├── config.js
    │   ├── dom-refs.js
    │   ├── three-vortex.js
    │   ├── state-and-video-bg.js
    │   ├── subtitles.js
    │   ├── equalizer-settings.js
    │   ├── subtitle-display.js
    │   ├── wakelock.js
    │   ├── color-utils.js
    │   ├── canvas-scene-setup.js
    │   ├── playlist.js
    │   ├── player-controls.js
    │   ├── audio-engine.js
    │   ├── audio-analysis.js
    │   └── rubik-math.js
    └── visualizers/
        ├── draw-helpers.js
        └── draw-visualizer.js   (vòng lặp render chính, 9 chế độ hiệu ứng)
```

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

## Đã kiểm tra

- Toàn bộ phần JS khi nối lại theo đúng thứ tự **khớp 100% byte-for-byte**
  với nội dung script gốc.
- Toàn bộ 6 component HTML khớp 100% byte-for-byte với các đoạn HTML gốc
  tương ứng.
- CSS khớp 100% byte-for-byte với nội dung gốc trong `<style>`.
- Mọi `id` mà JavaScript tham chiếu (`getElementById`) đều có mặt trong HTML.
- Cả 24 file JavaScript đều hợp lệ về cú pháp (`node --check`), kể cả khi
  kiểm tra độc lập từng file lẫn khi nối toàn bộ theo đúng thứ tự nạp.

## Cách dùng

Mở `index.html` bằng double-click (hoặc kéo vào trình duyệt). Ứng dụng cần
kết nối Internet ở lần mở đầu để tải 4 thư viện ngoài qua CDN (Tailwind,
jsmediatags, NoSleep.js, Three.js) — đây là giới hạn từ bản gốc, không phải
do việc chia file.

## Muốn sửa gì thì sửa ở đâu?

| Muốn sửa... | Vào file... |
|---|---|
| Giao diện danh sách bài hát | `js/components/playlist-view.js` |
| Giao diện ngăn cài đặt | `js/components/settings-drawer.js` |
| Thêm/sửa hiệu ứng visualizer | `js/visualizers/draw-visualizer.js` |
| Logic phát nhạc, next/prev, shuffle | `js/core/playlist.js`, `js/core/player-controls.js` |
| Equalizer, cấu hình lưu localStorage | `js/core/equalizer-settings.js` |
| Phụ đề (.srt) | `js/core/subtitles.js`, `js/core/subtitle-display.js` |
| Hiệu ứng Vortex (Three.js) | `js/core/three-vortex.js` |
| Màu sắc, nền | `js/core/color-utils.js` |
| Toàn bộ màu sắc/giao diện CSS | `css/styles.css` |
