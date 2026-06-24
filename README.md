# Audio Visualizer - Master Edition

Bản chia nhỏ của file `VM_4.html` gốc (2032 dòng, 1 file duy nhất) thành các
file CSS / JS / "component" HTML riêng biệt, **không dùng ES6 module**
(`import`/`export`) — toàn bộ vẫn dùng `<script src="...">` thông thường để
chạy được trực tiếp khi mở `index.html` bằng cách double-click (file://),
không cần server, không cần build step.

Ngoài việc chia module, project đã qua nhiều lượt cải tiến tính năng/visual.
Lịch sử chi tiết từng lượt cũ nằm ở các file changelog riêng (CHANGELOG_v1
đến v4). Bản hiện tại (ver 5) là thay đổi lớn nhất từ trước tới nay — toàn bộ
playlist (nhạc, tag, cover, phụ đề, ảnh/video nền) giờ persist qua
**IndexedDB**, reload trang không còn mất playlist như trước. Xem chi tiết ở
[CHANGELOG_v5.md](./CHANGELOG_v5.md) (và `PLAN_INDEXEDDB.md` cho tài liệu
thiết kế gốc).

- [CHANGELOG_v5.md](./CHANGELOG_v5.md)
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
├── CHANGELOG_v5.md
├── PLAN_INDEXEDDB.md         ← tài liệu thiết kế gốc của ver 5
├── index.html                  ← Mở file này để chạy ứng dụng
├── css/
│   └── styles.css               (toàn bộ CSS gốc, không đổi)
└── js/
    ├── components/
    │   ├── loading-shield.js    (★★★★★ ver 5 — đổi cơ chế ẩn/hiện sang opacity)
    │   ├── playlist-view.js     (★★★★★ ver 5 — data-key, 3 icon mới, modal sửa/info)
    │   ├── visualizer-overlay.js
    │   ├── subtitle-modal.js
    │   ├── bottom-player.js
    │   ├── settings-drawer.js   (★ ver 1, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5 — toggle ảnh nền, mục Về trình phát)
    │   └── about-drawer.js      (★★★★★ mới ở ver 5 — thống kê, giới thiệu, cảnh báo IndexedDB)
    ├── main.js                  (★★★★★ ver 5 — ghép thêm TPL_ABOUT_DRAWER)
    ├── core/
    │   ├── config.js            (★ ver 1, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5)
    │   ├── dom-refs.js          (★ ver 1, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5)
    │   ├── db.js                (★★★★★ mới ở ver 5 — IndexedDB: slugify/resolveKey/CRUD)
    │   ├── loading-shield-util.js (★★★★★ mới ở ver 5 — withLoadingShield dùng chung)
    │   ├── three-vortex.js      (★ ver 1, ★★ ver 2)
    │   ├── state-and-video-bg.js (★★★★★ ver 5 — video nền qua IndexedDB)
    │   ├── subtitles.js         (★★★★★ ver 5 — persist subtitles khi Apply)
    │   ├── equalizer-settings.js (★ ver 1, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5 — loadConfig async)
    │   ├── subtitle-display.js
    │   ├── wakelock.js          (★★★★★ ver 5 — flush totalListenSeconds, revoke cover URL)
    │   ├── color-utils.js
    │   ├── canvas-scene-setup.js (★ ver 1, ★★ ver 2, ★★★ ver 3, ★★★★ ver 4)
    │   ├── playlist.js          (★★★★★ ver 5 — viết lại hoàn toàn dùng IndexedDB)
    │   ├── player-controls.js   (★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5 — playNext/Prev theo key)
    │   ├── audio-engine.js
    │   ├── audio-analysis.js
    │   ├── rubik-math.js
    │   ├── about-stats.js       (★★★★★ mới ở ver 5 — computeStats() cho About Drawer)
    │   └── id3-export.js        (★★★★★ mới ở ver 5 — export/restore gắn tag mới qua ID3Writer)
    └── visualizers/
        ├── draw-helpers.js      (★★★ ver 3, ★★★★ ver 4)
        ├── draw-visualizer.js   (★ ver 1, ★★ ver 2, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5 — điểm
        │                          khởi động giờ gọi loadConfig() async + initPlaylistFromDB())
        └── types/               (★★★★ mới ở ver 4 — mỗi visual một file riêng)
            ├── bar.js              (visual "Bar": kiểu Phản chiếu cánh bướm + kiểu Thác đổ)
            ├── lightning.js
            ├── rubik.js
            ├── vortex.js           (phần update mỗi khung hình; khởi tạo vẫn ở three-vortex.js)
            ├── black-hole.js
            └── rain.js             (visual "Rain": kiểu Trôi cửa kính + kiểu Mưa phố)
```

(★ = có thay đổi ở ver 1, ★★ = thêm ở ver 2, ★★★ = thêm ở ver 3, ★★★★ = thêm
ở ver 4, ★★★★★ = thêm ở ver 5; file không đánh dấu giữ nguyên 100% so với
bản chia module gốc.)

## Thứ tự nạp script — QUAN TRỌNG, không thay đổi

`index.html` nạp script theo đúng 4 bước, không được đảo:

0. **CDN trong `<head>`**: Tailwind, jsmediatags, NoSleep.js, Three.js (như cũ)
   + **idb-keyval** (wrapper IndexedDB) và **browser-id3-writer** (ghi ID3 tag
   mới lúc Export) — thêm ở ver 5.
1. **components/*.js** — chỉ định nghĩa biến `TPL_...` (chuỗi HTML), chưa
   đụng vào DOM.
2. **main.js** — chèn toàn bộ `TPL_...` vào `<div id="app-root">`. Sau bước
   này, mọi phần tử có `id="..."` mới thực sự tồn tại trong DOM.
3. **core/*.js** — các file này gọi `document.getElementById(...)` ngay khi
   được nạp, nên phải chạy sau bước 2. Thứ tự giữa các file trong `core/`
   cũng giữ nguyên như trong file gốc vì có phụ thuộc biến/hàm giữa chúng.
   Từ ver 5: `db.js` và `loading-shield-util.js` nạp ngay sau `dom-refs.js` —
   cần `#loading-shield`/`#loading-text` đã có trong DOM, và phải có mặt
   TRƯỚC `playlist.js`/`equalizer-settings.js`/`subtitles.js`/
   `state-and-video-bg.js`/`about-stats.js`/`id3-export.js` vì các file đó
   gọi hàm helper định nghĩa trong 2 file này.
4. **visualizers/draw-helpers.js**, rồi **visualizers/types/\*.js** (mỗi
   visual một file, không phụ thuộc thứ tự lẫn nhau), rồi cuối cùng
   **visualizers/draw-visualizer.js** — file này gọi tới các hàm `draw*`
   định nghĩa trong `types/`, nên phải nạp sau cùng. Nó cũng còn chứa dòng
   `document.addEventListener('DOMContentLoaded', async () => { await
   loadConfig(); updateSubToggleUI(); await initPlaylistFromDB(); })` ở cuối
   cùng — đây là điểm khởi động thực sự của toàn bộ app. Từ ver 5,
   `loadConfig()` là `async` (đọc ảnh/video nền từ IndexedDB) và có thêm
   `initPlaylistFromDB()` (đọc lại playlist đã lưu, render danh sách ngay
   khi mở trang — thay cho playlist luôn rỗng lúc load như các bản trước).

## Cách dùng

Mở `index.html` bằng double-click (hoặc kéo vào trình duyệt), hoặc deploy
lên GitHub Pages / bất kỳ static host nào (khuyến nghị từ ver 5 vì IndexedDB
hoạt động ổn định hơn theo origin `https://` so với `file://`). Ứng dụng cần
kết nối Internet ở lần mở đầu để tải các thư viện qua CDN (Tailwind,
jsmediatags, NoSleep.js, Three.js, idb-keyval, browser-id3-writer).

**Lưu ý quan trọng (ver 5):** nhạc/tag/cover/phụ đề/ảnh-video nền giờ lưu
trong IndexedDB của trình duyệt — gắn theo từng trình duyệt + thiết bị cụ
thể, không tự đồng bộ qua thiết bị khác, và có thể bị hệ điều hành tự dọn
khi thiết bị thiếu dung lượng. Xem mục "Cảnh báo" trong About Drawer
(Cài đặt → Về trình phát) để biết chi tiết.

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
| Lưu trữ IndexedDB (nhạc/tag/cover/sub/ảnh-video nền), slugify/resolve key | `js/core/db.js` |
| Che màn hình khi xử lý (nạp nhạc/chuyển bài/lưu ảnh nền...) | `js/core/loading-shield-util.js` (hàm `withLoadingShield`) |
| Sửa tag/info/export gắn tag mới của 1 bài | `js/core/playlist.js` (modal sửa/info), `js/core/id3-export.js` (export) |
| Thống kê "Về trình phát" (About Drawer) | `js/core/about-stats.js`, `js/components/about-drawer.js` |
| Hiện/ẩn các khối setting theo kiểu visualizer/kiểu Bar đang chọn | `js/core/player-controls.js` (hàm `updateTypeUI`, `updateBarStyleUI`) |
| Equalizer, cấu hình lưu localStorage | `js/core/equalizer-settings.js` |
| Phụ đề (.srt) | `js/core/subtitles.js`, `js/core/subtitle-display.js` |
| Hiệu ứng Vortex (Three.js) — khởi tạo rings/bars/wave, camera | `js/core/three-vortex.js` (khởi tạo) + `js/visualizers/types/vortex.js` (cập nhật mỗi khung hình) |
| Khởi tạo đèn đường/hàng rào/mưa phố, mặt đất an toàn dưới control bar | `js/core/canvas-scene-setup.js` (hàm `generateStreetScene`, `getPlayerBarSafeHeight`) |
| Phát hiện pitch (nốt nhạc YIN), nốt MIDI trung bình động dùng cho Rubik | `js/core/audio-analysis.js` (hàm `updateStatsDashboard`), `js/core/audio-engine.js` (hàm `detectPitchYIN`) |
| Thêm trường cấu hình mới (lưu vào `vizConfig`) | `js/core/config.js` (giá trị mặc định) + `js/core/equalizer-settings.js` (nạp lúc `loadConfig`) |
| Màu sắc, nền | `js/core/color-utils.js` |
| Toàn bộ màu sắc/giao diện CSS | `css/styles.css` |
