# Audio Visualizer - Master Edition

Bản chia nhỏ của file `VM_4.html` gốc (2032 dòng, 1 file duy nhất) thành các
file CSS / JS / "component" HTML riêng biệt, **không dùng ES6 module**
(`import`/`export`) — toàn bộ vẫn dùng `<script src="...">` thông thường để
chạy được trực tiếp khi mở `index.html` bằng cách double-click (file://),
không cần server, không cần build step.

Ngoài việc chia module, project đã qua nhiều lượt cải tiến tính năng/visual.
Lịch sử chi tiết từng lượt cũ nằm ở các file changelog riêng (CHANGELOG_v1
đến v4) — bản hiện tại đã cập nhật thêm so với CHANGELOG_v4:

- Bỏ hẳn visual "Wave"; bỏ người đứng dưới đèn ở Mưa Phố (đèn đường giờ chỉ
  còn 3 cột, đều chạm mặt đất) và bổ sung hàng rào công viên chạy dọc mặt đất
  ngay sau lưng các cột đèn.
- Visual "Bar" kiểu Phản chiếu cánh bướm: hai bên trái/phải KHÔNG còn đối
  xứng gương về xu hướng độ cao (trái: xa tâm cao → gần tâm thấp; phải: gần
  tâm thấp → xa tâm cao); số lượng thanh mỗi bên và độ to vòng tròn tâm giờ
  TÙY CHỈNH được qua setting riêng (10-32 thanh; vòng tròn có thể chồng lấn
  lên các thanh khi để to, dải bar không co giãn theo). Setting "Độ dày
  thanh" đã bỏ khỏi cả 2 kiểu của Bar — giờ chỉ còn áp dụng cho Black Hole.
- Visual "Rubik": mỗi mảnh phóng to/thu nhỏ ngay tại tâm riêng theo biên độ
  tần số của mảnh đó cộng với cú đập beat chung. Xoay không còn ngẫu nhiên —
  xoay tự thân nhanh/chậm theo nốt nhạc so với pha trung bình động, và xoay
  từng lớp theo nốt cụ thể (mỗi 1 trong 12 nốt map cố định ra 1 trục+lớp).

- [CHANGELOG_v4.md](./CHANGELOG_v4.md)
- [CHANGELOG_v3.md](./CHANGELOG_v3.md)
- [CHANGELOG_v2.md](./CHANGELOG_v2.md)
- [CHANGELOG_v1.md](./CHANGELOG_v1.md)

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
├── CHANGELOG_v4.md
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
    │   └── settings-drawer.js   (★ ver 1, ★★★ ver 3, ★★★★ ver 4)
    ├── main.js
    ├── core/
    │   ├── config.js            (★ ver 1, ★★★ ver 3, ★★★★ ver 4)
    │   ├── dom-refs.js          (★ ver 1, ★★★ ver 3, ★★★★ ver 4)
    │   ├── three-vortex.js      (★ ver 1, ★★ ver 2)
    │   ├── state-and-video-bg.js
    │   ├── subtitles.js
    │   ├── equalizer-settings.js (★ ver 1, ★★★ ver 3, ★★★★ ver 4)
    │   ├── subtitle-display.js
    │   ├── wakelock.js
    │   ├── color-utils.js
    │   ├── canvas-scene-setup.js (★ ver 1, ★★ ver 2, ★★★ ver 3, ★★★★ ver 4)
    │   ├── playlist.js
    │   ├── player-controls.js   (★★★ ver 3, ★★★★ ver 4)
    │   ├── audio-engine.js
    │   ├── audio-analysis.js
    │   └── rubik-math.js
    └── visualizers/
        ├── draw-helpers.js      (★★★ ver 3, ★★★★ ver 4)
        ├── draw-visualizer.js   (★ ver 1, ★★ ver 2, ★★★ ver 3, ★★★★ ver 4 — viết lại
        │                          hoàn toàn thành vòng lặp điều phối, logic vẽ chuyển ra types/)
        └── types/               (★★★★ mới ở ver 4 — mỗi visual một file riêng)
            ├── bar.js              (visual "Bar": kiểu Phản chiếu cánh bướm + kiểu Thác đổ)
            ├── lightning.js
            ├── rubik.js
            ├── vortex.js           (phần update mỗi khung hình; khởi tạo vẫn ở three-vortex.js)
            ├── black-hole.js
            └── rain.js             (visual "Rain": kiểu Trôi cửa kính + kiểu Mưa phố)
```

(★ = có thay đổi ở ver 1, ★★ = có thay đổi thêm ở ver 2, ★★★ = có thay đổi
thêm ở ver 3, ★★★★ = có thay đổi thêm ở ver 4; file không đánh dấu giữ
nguyên 100% so với bản chia module gốc.)

## Thứ tự nạp script — QUAN TRỌNG, không thay đổi

`index.html` nạp script theo đúng 4 bước, không được đảo:

1. **components/*.js** — chỉ định nghĩa biến `TPL_...` (chuỗi HTML), chưa
   đụng vào DOM.
2. **main.js** — chèn toàn bộ `TPL_...` vào `<div id="app-root">`. Sau bước
   này, mọi phần tử có `id="..."` mới thực sự tồn tại trong DOM.
3. **core/*.js** — các file này gọi `document.getElementById(...)` ngay khi
   được nạp, nên phải chạy sau bước 2. Thứ tự giữa các file trong `core/`
   cũng giữ nguyên như trong file gốc vì có phụ thuộc biến/hàm giữa chúng.
4. **visualizers/draw-helpers.js**, rồi **visualizers/types/\*.js** (mỗi
   visual một file, không phụ thuộc thứ tự lẫn nhau), rồi cuối cùng
   **visualizers/draw-visualizer.js** — file này gọi tới các hàm `draw*`
   định nghĩa trong `types/`, nên phải nạp sau cùng. Nó cũng còn chứa dòng
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
| Giao diện ngăn cài đặt (kiểu Bar, số lượng thanh/độ to vòng tròn, kiểu mưa...) | `js/components/settings-drawer.js` |
| Visual "Bar" (kiểu Phản chiếu cánh bướm / kiểu Thác đổ) | `js/visualizers/types/bar.js` |
| Visual "Rain" (kiểu Trôi cửa kính / kiểu Mưa phố, đèn đường, hàng rào) | `js/visualizers/types/rain.js` |
| Visual "Rubik" (phóng to/thu nhỏ theo beat, xoay tự thân + xoay lớp theo pitch) | `js/visualizers/types/rubik.js` (map nốt→trục/lớp ở `RUBIK_NOTE_TO_TURN` trong `js/core/dom-refs.js`) |
| Visual Lightning / Black Hole | `js/visualizers/types/lightning.js`, `black-hole.js` (tương ứng) |
| Vòng lặp render chính, thêm visual mới vào bảng dispatch | `js/visualizers/draw-visualizer.js` (object `VISUALIZER_DRAWERS`) |
| Hàm vẽ dùng chung (giọt nước, khung kính, nốt nhạc bay lên) | `js/visualizers/draw-helpers.js` |
| Logic phát nhạc, next/prev, shuffle | `js/core/playlist.js`, `js/core/player-controls.js` |
| Hiện/ẩn các khối setting theo kiểu visualizer/kiểu Bar đang chọn | `js/core/player-controls.js` (hàm `updateTypeUI`, `updateBarStyleUI`) |
| Equalizer, cấu hình lưu localStorage | `js/core/equalizer-settings.js` |
| Phụ đề (.srt) | `js/core/subtitles.js`, `js/core/subtitle-display.js` |
| Hiệu ứng Vortex (Three.js) — khởi tạo rings/bars/wave, camera | `js/core/three-vortex.js` (khởi tạo) + `js/visualizers/types/vortex.js` (cập nhật mỗi khung hình) |
| Khởi tạo đèn đường/hàng rào/mưa phố, mặt đất an toàn dưới control bar | `js/core/canvas-scene-setup.js` (hàm `generateStreetScene`, `getPlayerBarSafeHeight`) |
| Phát hiện pitch (nốt nhạc YIN), nốt MIDI trung bình động dùng cho Rubik | `js/core/audio-analysis.js` (hàm `updateStatsDashboard`), `js/core/audio-engine.js` (hàm `detectPitchYIN`) |
| Thêm trường cấu hình mới (lưu vào `vizConfig`) | `js/core/config.js` (giá trị mặc định) + `js/core/equalizer-settings.js` (nạp lúc `loadConfig`) |
| Màu sắc, nền | `js/core/color-utils.js` |
| Toàn bộ màu sắc/giao diện CSS | `css/styles.css` |
