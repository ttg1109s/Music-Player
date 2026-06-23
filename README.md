# Audio Visualizer - Master Edition (đã chia module + đã cải tiến)

Bản chia nhỏ của file `VM_4.html` gốc (2032 dòng, 1 file duy nhất) thành các
file CSS / JS / "component" HTML riêng biệt, **không dùng ES6 module**
(`import`/`export`) — toàn bộ vẫn dùng `<script src="...">` thông thường để
chạy được trực tiếp khi mở `index.html` bằng cách double-click (file://),
không cần server, không cần build step.

Phiên bản này, ngoài việc chia module, còn có **5 thay đổi về tính năng/visual**
so với bản gốc — xem chi tiết ở mục [Đã thay đổi so với bản gốc](#đã-thay-đổi-so-với-bản-gốc).

## Đã thay đổi so với bản gốc

### 1. Đã loại bỏ kiểu Vortex "Bụi Lượng Tử" (dust)

Vortex trước đây có 4 kiểu hiển thị: Bụi Lượng Tử (dust), Vòng Ring Ánh Sáng
(rings), Đoạn Bar 3D (bars), Nhiễu Động Sóng (wave). Kiểu **dust đã bị xóa
hoàn toàn**, chỉ còn 3 kiểu rings / bars / wave.

- Option "Bụi Lượng Tử" đã xóa khỏi dropdown cài đặt
  (`js/components/settings-drawer.js`).
- Toàn bộ logic khởi tạo/cập nhật particle bụi đã xóa khỏi
  `js/core/three-vortex.js` và `js/visualizers/draw-visualizer.js`.
- `dustParticles` đã xóa khỏi `PERFORMANCE_PROFILES` (`js/core/config.js`).
- **Style mặc định khi mở app lần đầu đổi từ `dust` → `rings`.**
- Đã thêm logic migration: nếu máy người dùng có cấu hình cũ lưu trong
  `localStorage` với `vortexStyle: 'dust'` (hoặc các giá trị cũ hơn nữa là
  `tardis`/`classic`), app sẽ tự động chuyển về `rings` khi nạp lại, tránh
  vortex bị "biến mất" do style không còn tồn tại
  (`js/core/equalizer-settings.js`, hàm `loadConfig`).

### 2. Đã loại bỏ rung lắc camera trong Vortex

Bản gốc có đoạn camera "lắc lư" ngẫu nhiên dựa theo năng lượng nhạc
(`swayX`/`swayY`, dao động sin/cos tốc độ cao cộng dồn vào điểm camera nhìn
tới). Phần rung giật này **đã bị xóa**.

Camera vẫn **bám theo độ cong của đường ống** (lên/xuống/trái/phải theo hình
dạng tunnel đang uốn lượn) — đây không phải là rung lắc mà là chuyển động
mượt theo đường đi, nên được **giữ lại theo đúng yêu cầu**. Để bù lại phần
cảm giác "sống" mà sway cũ tạo ra mà không bị giật, đã thêm hiệu ứng tiêu cự
(FOV) hơi co — giãn rất nhẹ và mượt theo năng lượng nhạc, tạo cảm giác
camera đi sâu vào / lùi ra khỏi đường hầm theo tiếng nhạc.

→ Xem `js/visualizers/draw-visualizer.js`, khối `// 4. Cinematic Camera`.

### 3. Đã thiết kế lại toàn diện visual "Rừng Đom Đóm" (Firefly Forest)

So với bản gốc (đom đóm bay theo 3 "dải" ngang cố định, di chuyển ngang đơn
điệu, màu lấy theo tần số âm thanh không liên quan tới màu đom đóm thật),
bản mới thay đổi cả 4 khía cạnh:

- **Bố cục**: bỏ hệ thống dải ngang cố định, thay bằng 4-5 "cụm" (cluster)
  ngẫu nhiên trong không gian mà đàn đom đóm tụ quanh, trôi nhẹ theo thời
  gian — tạo cảm giác đàn tự nhiên hơn là xếp hàng theo tầng.
- **Không gian / chiều sâu**: mỗi con đom đóm có thuộc tính `depth` (0 = gần,
  1 = xa). Con ở gần thì to hơn, sáng hơn, di chuyển nhanh hơn; con ở xa thì
  nhỏ, mờ, chậm (hiệu ứng parallax). Thêm các đám sương mù khí quyển mỏng
  phía xa để tăng cảm giác chiều sâu của khu rừng.
- **Thuật toán di chuyển**: thay di chuyển ngang một chiều bằng chuyển động
  "lượn" hữu cơ quanh một điểm neo (`homeX`/`homeY`) theo vòng cong ngẫu
  nhiên (giống cách đom đóm thật bay vòng vèo tại chỗ, không bay thẳng một
  hướng).
- **Nhịp sáng/tắt**: mỗi con có chu kỳ nhấp nháy tự nhiên riêng (lệch pha
  ngẫu nhiên), thay vì độ sáng chỉ tỉ lệ thuận trực tiếp với biên độ âm
  thanh — tiếng bass mạnh vẫn "tiếp sức" cho độ sáng/độ cao bay, nhưng nhịp
  nháy nền vẫn giữ được cảm giác sinh học tự nhiên dù không có nhạc.
- **Màu sắc**: ở chế độ màu "Gradient theo nhạc", màu nền tảng đổi từ dải
  cầu vồng theo tần số sang tông vàng-lục ấm đặc trưng của đom đóm thật, ngả
  dần sang lục/lam khi ở lớp xa (gợi cảm giác khí quyển ban đêm), có lệch
  hue nhẹ riêng từng con để đàn không bị "đồng phục". Ở chế độ màu đơn sắc/
  pha trộn 2 màu, mỗi con đom đóm giữ **cố định** một màu (không đổi ngẫu
  nhiên theo từng khung hình) để tránh hiện tượng nhấp nháy màu giật cục.

→ Xem `js/core/canvas-scene-setup.js` (khởi tạo `fireflies`, `fireflyClusters`,
`fireflyMist`) và `js/visualizers/draw-visualizer.js` (khối `FIREFLY FOREST 3.0`).

### 4. Đã kiểm tra tương quan nhạc ↔ camera/đường hầm trong Vortex

Đã rà soát toàn bộ cơ chế liên kết âm thanh với chuyển động camera và hình
dạng đường hầm:

- **Trái / phải / trên / dưới**: hình dạng uốn lượn của ống (`tPathParams`,
  hàm `getVortexCenterAt`) được đổi hướng ngẫu nhiên khi năng lượng nhạc
  vượt ngưỡng (`smoothedEnergy > 0.6`, hàm `rollNewVortexCurve`), nội suy
  mượt qua `updateVortexCurveLerp`. Camera luôn bám theo đúng tâm ống tại
  vị trí hiện tại — xác nhận hoạt động đúng, **không cần sửa**.
- **Đi vào / đi ra (tốc độ bay)**: tốc độ bay xuyên ống (`tWarpSpeed`) tăng
  theo năng lượng nhạc (`targetWarpSpeed = 10 + smoothedEnergy * 40`), nội
  suy mượt — xác nhận hoạt động đúng, **không cần sửa**.
- **Bổ sung**: thêm hiệu ứng tiêu cự (FOV) co giãn nhẹ theo năng lượng nhạc
  (mục 2 ở trên) để tăng thêm cảm giác "đi sâu vào / lùi ra" mà không cần
  rung lắc camera.

### 5. README

Viết lại để phản ánh đúng các thay đổi trên (file bạn đang đọc).

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
│   └── styles.css               (toàn bộ CSS gốc, không đổi)
└── js/
    ├── components/              (mỗi file = 1 chuỗi HTML, gắn vào DOM lúc khởi động)
    │   ├── loading-shield.js
    │   ├── playlist-view.js
    │   ├── visualizer-overlay.js
    │   ├── subtitle-modal.js
    │   ├── bottom-player.js
    │   └── settings-drawer.js   ★ đã sửa (xóa option "Bụi Lượng Tử")
    ├── main.js                  (bootstrap: lắp components vào #app-root)
    ├── core/                    (logic nghiệp vụ, theo đúng thứ tự phụ thuộc)
    │   ├── config.js            ★ đã sửa (default style, performance profile)
    │   ├── dom-refs.js          ★ đã sửa (biến trạng thái firefly mới)
    │   ├── three-vortex.js      ★ đã sửa (xóa nhóm Dust)
    │   ├── state-and-video-bg.js
    │   ├── subtitles.js
    │   ├── equalizer-settings.js ★ đã sửa (migration style cũ)
    │   ├── subtitle-display.js
    │   ├── wakelock.js
    │   ├── color-utils.js
    │   ├── canvas-scene-setup.js ★ đã sửa (khởi tạo đàn đom đóm mới)
    │   ├── playlist.js
    │   ├── player-controls.js
    │   ├── audio-engine.js
    │   ├── audio-analysis.js
    │   └── rubik-math.js
    └── visualizers/
        ├── draw-helpers.js
        └── draw-visualizer.js   ★ đã sửa (xóa dust, camera, vẽ lại firefly)
```

(★ = file có thay đổi so với bản chia module gốc; các file không đánh dấu
giữ nguyên 100%.)

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

- Cả 7 file bị sửa (đánh dấu ★ ở trên) đều hợp lệ về cú pháp (`node --check`),
  kể cả khi kiểm tra độc lập từng file lẫn khi nối toàn bộ 24 file theo đúng
  thứ tự nạp trong `index.html`.
- Đã rà soát toàn bộ project để xác nhận không còn sót tham chiếu nào tới
  các biến/hàm đã xóa (`tGroupDust`, `tDustParticles`, `dustParticles`,
  `fireflyBands`, `numFireflyBands`, ...).
- Đã thêm logic migration để cấu hình cũ lưu trong `localStorage` của người
  dùng (style vortex `dust`/`tardis`/`classic`) không làm hỏng trải nghiệm
  khi mở bản mới.
- Mọi `id` mà JavaScript tham chiếu (`getElementById`) đều có mặt trong HTML.
- 17 file JS không bị động tới vẫn giữ khớp 100% với bản chia module gốc.

## Cách dùng

Mở `index.html` bằng double-click (hoặc kéo vào trình duyệt). Ứng dụng cần
kết nối Internet ở lần mở đầu để tải 4 thư viện ngoài qua CDN (Tailwind,
jsmediatags, NoSleep.js, Three.js) — đây là giới hạn từ bản gốc, không phải
do việc chia file hay các thay đổi visual.

**Lưu ý cho người đã dùng bản cũ**: nếu trình duyệt đã lưu cấu hình cũ với
kiểu Vortex "Bụi Lượng Tử", lần mở đầu sau khi cập nhật sẽ tự chuyển sang
kiểu "Vòng Ring Ánh Sáng" — có thể vào `Cài đặt → Hình học Visualizer → Kiểu
Ống Vortex` để chọn lại kiểu khác nếu muốn.

## Muốn sửa gì thì sửa ở đâu?

| Muốn sửa... | Vào file... |
|---|---|
| Giao diện danh sách bài hát | `js/components/playlist-view.js` |
| Giao diện ngăn cài đặt | `js/components/settings-drawer.js` |
| Thêm/sửa hiệu ứng visualizer (kể cả Rừng Đom Đóm) | `js/visualizers/draw-visualizer.js` |
| Logic phát nhạc, next/prev, shuffle | `js/core/playlist.js`, `js/core/player-controls.js` |
| Equalizer, cấu hình lưu localStorage | `js/core/equalizer-settings.js` |
| Phụ đề (.srt) | `js/core/subtitles.js`, `js/core/subtitle-display.js` |
| Hiệu ứng Vortex (Three.js) — rings/bars/wave | `js/core/three-vortex.js` |
| Khởi tạo đàn đom đóm, cụm, sương mù | `js/core/canvas-scene-setup.js` |
| Màu sắc, nền | `js/core/color-utils.js` |
| Toàn bộ màu sắc/giao diện CSS | `css/styles.css` |
