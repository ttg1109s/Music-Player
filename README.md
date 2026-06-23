# Audio Visualizer - Master Edition (ver 2 - Vortex Mượt & Rừng Đom Đóm)

Bản chia nhỏ của file `VM_4.html` gốc (2032 dòng, 1 file duy nhất) thành các
file CSS / JS / "component" HTML riêng biệt, **không dùng ES6 module**
(`import`/`export`) — toàn bộ vẫn dùng `<script src="...">` thông thường để
chạy được trực tiếp khi mở `index.html` bằng cách double-click (file://),
không cần server, không cần build step.

Ngoài việc chia module, project đã qua 2 lượt cải tiến tính năng/visual —
xem chi tiết ở mục [Lịch sử thay đổi](#lịch-sử-thay-đổi).

## Lịch sử thay đổi

### Ver 2 (mới nhất)

1. **Bỏ hoàn toàn rung lắc camera (`swayX`/`swayY`) và hiệu ứng "hít thở"
   FOV** đã thêm ở ver 1. Camera vortex giờ **chỉ** bám theo độ cong của
   đường ống (lên/xuống/trái/phải theo hình dạng tunnel) — không còn bất kỳ
   dao động phụ trợ nào khác.

2. **Làm mượt toàn bộ chuyển động camera trong Vortex**, xử lý đúng nguyên
   nhân gây giật cục:
   - `rollNewVortexCurve()` (hàm đổi hướng uốn lượn của ống khi nhạc mạnh)
     trước đây nhảy sang một hình dạng **hoàn toàn ngẫu nhiên mới** mỗi khi
     trúng điều kiện — giờ chỉ "nhích" nhẹ so với hình dạng hiện tại
     (jitter có giới hạn min/max), tránh đổi hướng đột ngột.
   - Tần suất đổi hướng giảm xuống (ngưỡng năng lượng cao hơn + xác suất
     thấp hơn mỗi khung hình).
   - Hệ số nội suy hình dạng ống (`updateVortexCurveLerp`) và tốc độ bay
     (`tWarpSpeed`) đều được làm chậm/mềm hơn.
   - Hệ số camera bám theo tâm ống giảm từ `0.08` xuống `0.045` để theo kịp
     êm hơn khi đường ống đổi hướng, không bị "giật" theo.

3. **Sửa lỗi vòng Bar 3D (kiểu "bars") bị biến mất sau vài giây** — nguyên
   nhân là công thức tính vị trí Z cũ dùng phép chia lấy dư (`%`) trên một
   giá trị càng ngày càng âm lớn (`tCurrentWarpZ`), khiến các vòng bar dần
   trôi ra ngoài tầm nhìn của camera mà không được kéo lại đúng cách. Đã
   viết lại theo đúng mô hình "sliding window" mà `rings`/`wave` đang dùng
   (tích lũy vị trí Z mỗi khung hình, lưu riêng cho từng vòng trong
   `tBarRingZs`) — bar giờ luôn nằm trong tầm nhìn camera bất kể chạy bao
   lâu.

   **Đồng thời thêm hiệu ứng "xoắn chuỗi" (lò xo / DNA)**: mỗi vòng bar dọc
   theo ống lệch thêm một góc cố định so với vòng ngay trước nó, tạo hình
   xoắn ốc trọn vài vòng dọc suốt đường ống; toàn bộ "lò xo" còn tự xoay
   chậm theo thời gian để luôn có cảm giác sống động.

4. **Sửa lỗi 3 kiểu Vortex (rings / bars / wave) bị "cài cứng" màu, không
   theo đúng setting màu người dùng chọn**:
   - Trước đây, khi người dùng chọn chế độ màu "Đơn sắc" (`solid`),
     `rings`/`wave` vẫn vô tình rơi vào nhánh code dành cho chế độ "Pha
     trộn 2 màu" (`dynamic`) — bỏ qua hoàn toàn `solidColor` đã chọn.
   - `bars` thậm chí không có nhánh điều kiện nào theo chế độ màu — luôn
     tô màu kiểu "Gradient theo nhạc" dù người dùng chọn gì.
   - Cả 3 kiểu giờ đã tách rõ đúng 3 nhánh `solid` / `dynamic` / `gradient`,
     khớp với lựa chọn ở `Cài đặt → Màu sắc Visualizer → Chế độ sóng âm`.

5. **Thiết kế lại hình dáng cây trong Rừng Đom Đóm** — trước đây mỗi cây chỉ
   là một tam giác đơn giản (1 đỉnh + 2 đáy). Giờ mỗi cây ngẫu nhiên thuộc
   1 trong 2 kiểu:
   - **Cây thông nhiều tầng**: 3-5 tầng lá hình tam giác xếp chồng, thu nhỏ
     dần lên đỉnh, có cạnh hơi răng cưa và lệch ngẫu nhiên từng tầng.
   - **Cây tán tròn rậm**: nhiều thùy hình tròn chồng lên nhau dạng "mây",
     có ngọn nhỏ phía trên.
   
   Cả 2 kiểu đều có thân cây phía dưới và vẫn giữ hiệu ứng lắc nhẹ theo
   nhạc như trước.

6. **Tiêu đề trang** đổi thành
   `Audio Visualizer - Master Edition (ver 2 - Vortex Mượt & Rừng Đom Đóm)`
   để phản ánh các thay đổi của bản này.

→ 4 file thay đổi trong ver 2: `index.html`, `js/core/canvas-scene-setup.js`,
`js/core/three-vortex.js`, `js/visualizers/draw-visualizer.js`.

### Ver 1

1. Loại bỏ hoàn toàn kiểu Vortex "Bụi Lượng Tử" (dust) — chỉ còn 3 kiểu
   rings / bars / wave. Style mặc định đổi từ `dust` → `rings`. Thêm
   migration để cấu hình cũ (`dust`/`tardis`/`classic`) tự chuyển về `rings`.
2. Loại bỏ phần camera "lắc lư" ngẫu nhiên theo beat (`swayX`/`swayY`) —
   sau đó ở ver 2 đã bỏ luôn cả phương án thay thế (FOV breathing) vì vẫn
   tạo cảm giác dao động không mong muốn.
3. Thiết kế lại toàn diện visual Rừng Đom Đóm: bố cục theo cụm hữu cơ
   (cluster), chiều sâu 3 lớp (parallax) + sương mù khí quyển, thuật toán
   lượn tự do quanh điểm neo, nhịp nhấp nháy tự nhiên riêng từng con, màu
   vàng-lục ấm đặc trưng đom đóm.
4. Rà soát tương quan nhạc ↔ camera/đường hầm trong Vortex (trái/phải/
   trên/dưới qua hình dạng ống, đi vào/ra qua tốc độ bay).

→ 7 file thay đổi trong ver 1: `js/components/settings-drawer.js`,
`js/core/canvas-scene-setup.js`, `js/core/config.js`, `js/core/dom-refs.js`,
`js/core/equalizer-settings.js`, `js/core/three-vortex.js`,
`js/visualizers/draw-visualizer.js`.

## Vì sao không dùng ES6 module ở đây?

Với `type="module"`, mỗi file có scope riêng và trình duyệt áp dụng CORS khi
nạp qua `file://`, nên sẽ bị lỗi khi mở trực tiếp. Với `<script>` thường,
tất cả file chia sẻ **cùng một global scope** giống như khi chúng còn nằm
trong một thẻ `<script>` duy nhất — đây là lý do toàn bộ logic gốc vẫn chạy
đúng dù đã được chia ra nhiều file.

## Cấu trúc thư mục

```
visual-master/
├── index.html                  ← Mở file này để chạy ứng dụng (★ ver 2)
├── css/
│   └── styles.css               (toàn bộ CSS gốc, không đổi)
└── js/
    ├── components/
    │   ├── loading-shield.js
    │   ├── playlist-view.js
    │   ├── visualizer-overlay.js
    │   ├── subtitle-modal.js
    │   ├── bottom-player.js
    │   └── settings-drawer.js   (★ ver 1)
    ├── main.js
    ├── core/
    │   ├── config.js            (★ ver 1)
    │   ├── dom-refs.js          (★ ver 1)
    │   ├── three-vortex.js      (★ ver 1, ★★ ver 2)
    │   ├── state-and-video-bg.js
    │   ├── subtitles.js
    │   ├── equalizer-settings.js (★ ver 1)
    │   ├── subtitle-display.js
    │   ├── wakelock.js
    │   ├── color-utils.js
    │   ├── canvas-scene-setup.js (★ ver 1, ★★ ver 2)
    │   ├── playlist.js
    │   ├── player-controls.js
    │   ├── audio-engine.js
    │   ├── audio-analysis.js
    │   └── rubik-math.js
    └── visualizers/
        ├── draw-helpers.js
        └── draw-visualizer.js   (★ ver 1, ★★ ver 2)
```

(★ = có thay đổi ở ver 1, ★★ = có thay đổi thêm ở ver 2; file không đánh
dấu giữ nguyên 100% so với bản chia module gốc.)

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

## Đã kiểm tra (ver 2)

- 4 file thay đổi của ver 2 đều hợp lệ về cú pháp (`node --check`), kể cả
  khi kiểm tra độc lập từng file lẫn khi nối toàn bộ 24 file JS theo đúng
  thứ tự nạp trong `index.html`.
- Đã mô phỏng bằng số học (`node -e`) để xác nhận:
  - Vòng Bar 3D không còn trôi ra ngoài tầm nhìn camera sau hàng nghìn
    khung hình liên tục (trước đây bị lệch ra xa hàng nghìn đơn vị chỉ sau
    vài trăm khung hình).
  - Tham số hình dạng đường ống (`tPathParams`) dao động ổn định trong
    giới hạn đã đặt qua hàng chục nghìn khung hình, không bị kẹt ở biên
    hay phát nổ giá trị.
- Đã rà soát cả 3 kiểu Vortex để xác nhận đều tôn trọng đúng 3 chế độ màu
  (`solid` / `dynamic` / `gradient`) ở `Cài đặt → Màu sắc Visualizer`.

## Cách dùng

Mở `index.html` bằng double-click (hoặc kéo vào trình duyệt). Ứng dụng cần
kết nối Internet ở lần mở đầu để tải 4 thư viện ngoài qua CDN (Tailwind,
jsmediatags, NoSleep.js, Three.js) — đây là giới hạn từ bản gốc, không phải
do việc chia file hay các thay đổi visual.

**Lưu ý cho người đã dùng bản cũ**: nếu trình duyệt đã lưu cấu hình cũ với
kiểu Vortex "Bụi Lượng Tử" (từ trước ver 1), lần mở sẽ tự chuyển sang kiểu
"Vòng Ring Ánh Sáng" — có thể vào `Cài đặt → Hình học Visualizer → Kiểu Ống
Vortex` để chọn lại kiểu khác (Rings / Bars 3D / Wave) nếu muốn.

## Muốn sửa gì thì sửa ở đâu?

| Muốn sửa... | Vào file... |
|---|---|
| Giao diện danh sách bài hát | `js/components/playlist-view.js` |
| Giao diện ngăn cài đặt | `js/components/settings-drawer.js` |
| Thêm/sửa hiệu ứng visualizer (kể cả Rừng Đom Đóm, hình cây) | `js/visualizers/draw-visualizer.js` |
| Logic phát nhạc, next/prev, shuffle | `js/core/playlist.js`, `js/core/player-controls.js` |
| Equalizer, cấu hình lưu localStorage | `js/core/equalizer-settings.js` |
| Phụ đề (.srt) | `js/core/subtitles.js`, `js/core/subtitle-display.js` |
| Hiệu ứng Vortex (Three.js) — khởi tạo rings/bars/wave, camera | `js/core/three-vortex.js` (khởi tạo) + `js/visualizers/draw-visualizer.js` (cập nhật mỗi khung hình) |
| Khởi tạo đàn đom đóm, cụm, sương mù, hình dáng cây | `js/core/canvas-scene-setup.js` |
| Màu sắc, nền | `js/core/color-utils.js` |
| Toàn bộ màu sắc/giao diện CSS | `css/styles.css` |
