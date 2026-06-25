# Changelog — Ver 4 (mới nhất)

1. **Loại bỏ 4 visual/kiểu cũ và toàn bộ setting liên quan:**
   - Visual "Rừng Đom Đóm" (`firefly_forest`) — bỏ hoàn toàn bãi đồi, túp lều,
     đàn đom đóm, sương mù khí quyển.
   - Kiểu mưa "classic" (mưa rơi sấm sét kiểu cũ) trong visual Rain — dropdown
     "Kiểu hiệu ứng mưa" giờ chỉ còn *Trôi trên cửa kính* và *Mưa phố & công
     viên*.
   - Visual "4 Mùa" (`seasons`) — bỏ hoàn toàn bãi đồi 2 lớp, mái nhà nhỏ, hạt
     rơi theo mùa (hoa đào/hướng dương/lá/tuyết) và 3 chế độ chọn mùa.
   - Toàn bộ field cấu hình không còn dùng (`rainSitter`, `rainCoupleType`,
     `seasonMode`, `seasonFixed`) đã được dọn khỏi `DEFAULT_VIZ_CONFIG`. Cấu
     hình `localStorage` cũ của người dùng đã từng dùng các visual/field này
     sẽ tự động được quy về visual gần tương đương nhất khi nạp lại (xem mục
     6 bên dưới), không làm vỡ app.

2. **Thiết kế lại visual Rain — kiểu "Mưa phố & công viên" (`street`):**
   - **Bỏ ghế công viên** và toàn bộ logic người ngồi/cặp đôi cũ.
   - **Người đứng dưới cột đèn** (silhouette vector tối giản, đung đưa rất
     nhẹ) thay cho ghế — chọn số lượng 0-3 người ở
     `Cài đặt → Hình học Visualizer → Người đứng dưới đèn`, tự động giới hạn
     theo chế độ hiệu năng (`PERFORMANCE_PROFILES.streetStandees`).
   - **Mặt đất (groundY) luôn cao hơn vùng thanh điều khiển dưới cùng** (tên
     bài, nút play/pause, thanh tiến trình) ở mọi kích thước màn hình — xem
     hàm `getPlayerBarSafeHeight()` trong `canvas-scene-setup.js`. Đã kiểm
     chứng bằng số học ở 4 kích thước màn hình khác nhau (điện thoại nhỏ tới
     màn hình lớn).
   - **Màu đèn đường + màu nền trời/mặt đất giờ theo đúng chế độ màu đã chọn**
     (đơn sắc / pha trộn 2 màu / gradient theo nhạc) ở
     `Cài đặt → Màu sắc Visualizer`, thay vì màu vàng cam/xanh đêm cố định
     như trước.
   - **Hiệu ứng nhấp nháy đèn rõ rệt hơn**: biên độ giật theo bass lớn hơn,
     xác suất "chớp tắt" ngẫu nhiên cao hơn một chút — đèn đường có cảm giác
     cũ kỹ, sống động hơn bản trước.
   - **Số hạt mưa khởi tạo + bật/tắt glow theo đúng chế độ hiệu năng**
     (`quality: Cao/Trung bình/Thấp`) — `PERFORMANCE_PROFILES.streetRain`.
   - **Chớp sáng tận dụng đúng cơ chế của kiểu Trôi cửa kính**: một setting
     "Chớp sáng (kính & đèn đường)" duy nhất áp dụng cho cả 2 kiểu mưa (trước
     đây setting chớp sáng chỉ ảnh hưởng kiểu kính).

3. **Gộp visual Bar + Synthesia thành 1 visual "Bar" với 2 kiểu
   (`Cài đặt → Hình học Visualizer → Kiểu Bar`):**
   - **Kiểu (1) Phản chiếu** — thiết kế lại hoàn toàn cách hiển thị cũ của
     visual Bar: bỏ phần "kính" mờ (alpha thấp) phía dưới, thay bằng dải 32
     bar mỗi bên trục giữa màn hình (64 bar tổng), đối xứng **cả trái/phải
     lẫn trên/dưới** quanh tâm — kiểu cánh bướm — cộng một vòng tròn nhỏ tại
     tâm đập theo beat (bass) của nhạc.
   - **Kiểu (2) Thác đổ** — giữ nguyên 100% cách hiển thị gốc của visual
     Synthesia cũ (các "phím" rơi từ trên xuống đáy màn hình theo tần số),
     chỉ đổi tên hiển thị trong UI.
   - Visual "Synthesia" không còn tồn tại như một mode riêng trong danh sách
     cycle (`MODES`) — cấu hình cũ có `type: 'synthesia'` sẽ tự động chuyển
     thành `type: 'bar'` + `barStyle: 'cascade'` khi nạp lại, giữ đúng trải
     nghiệm hiển thị người dùng đã quen.

4. **Chia nhỏ file vẽ visual theo từng loại:**
   - `js/visualizers/draw-visualizer.js` (1 file, ~870 dòng, toàn bộ logic vẽ
     của 9 visual trong 1 chuỗi `if/else if` dài) → viết lại hoàn toàn thành
     vòng lặp điều phối ngắn (~65 dòng): cập nhật biến phân tích âm thanh dùng
     chung mỗi khung hình, rồi tra cứu hàm vẽ qua object `VISUALIZER_DRAWERS`
     thay cho chuỗi `if/else if`.
   - Logic vẽ thực tế của từng visual chuyển sang file riêng trong
     `js/visualizers/types/`: `bar.js`, `wave.js`, `lightning.js`, `rubik.js`,
     `vortex.js` (phần cập nhật mỗi khung hình — khởi tạo Three.js vẫn ở
     `three-vortex.js` như cũ), `black-hole.js`, `rain.js`.
   - Thêm visual mới trong tương lai chỉ cần: tạo 1 file trong `types/`, thêm
     1 dòng vào `VISUALIZER_DRAWERS`, không phải sửa vòng lặp chính.

5. **Cập nhật `index.html`**: thêm khối nạp script cho `js/visualizers/types/*.js`
   (sau `draw-helpers.js`, trước `draw-visualizer.js`, đúng thứ tự phụ thuộc).

6. **Migration cấu hình cũ (`loadConfig()` trong `equalizer-settings.js`):**
   - `rainStyle: 'classic'` → `'glass'`.
   - `type: 'synthesia'` → `type: 'bar'`, `barStyle: 'cascade'`.
   - `type: 'firefly_forest'` hoặc `type: 'seasons'` → `type: 'bar'` (mặc
     định `barStyle: 'mirror'`).
   - Field `barStyle` không tồn tại trong config cũ → mặc định `'mirror'`.
   - Field `streetStanding` không tồn tại trong config cũ → mặc định `1`.

→ File thay đổi: `js/core/config.js`, `js/core/dom-refs.js`,
`js/core/canvas-scene-setup.js`, `js/core/player-controls.js`,
`js/core/equalizer-settings.js`, `js/components/settings-drawer.js`,
`js/visualizers/draw-helpers.js`, `js/visualizers/draw-visualizer.js` (viết
lại hoàn toàn), `index.html`, `README.md`.
**File mới**: `js/visualizers/types/bar.js`, `wave.js`, `lightning.js`,
`rubik.js`, `vortex.js`, `black-hole.js`, `rain.js`.

## Đã kiểm tra (ver 4)

- Toàn bộ 29 file `.js` của project (kể cả 7 file mới trong `types/`) hợp lệ
  về cú pháp (`node --check`), kiểm tra độc lập từng file.
- Dựng một bộ stub DOM + Canvas2D + Three.js + Web Audio tối giản bằng
  `vm.createContext`, nạp toàn bộ 29 file theo ĐÚNG thứ tự `<script>` trong
  `index.html` vào cùng 1 global scope (mô phỏng chính xác cách trình duyệt
  chạy `<script>` thường), rồi:
  - Gọi `resizeCanvas()`, `loadConfig()`, `updateTypeUI()` cho cả 7 mode còn
    lại trong `MODES`.
  - Render 5 khung hình `drawVisualizer()` cho mỗi tổ hợp: cả 2 `barStyle`
    (mirror/cascade), cả 2 `rainStyle` (glass/street) × 4 mức
    `streetStanding` (0-3), cả 3 `vortexStyle` (rings/bars/wave).
  - Đổi `quality` qua cả 3 mức (high/medium/low) rồi `resizeCanvas()` lại để
    kiểm tra các đường dẫn theo `PERFORMANCE_PROFILES`.
  - Tất cả chạy không lỗi runtime (không có biến/hàm thiếu định nghĩa).
- Kiểm chứng bằng số học rằng `streetGroundY` (mặt đất visual Mưa phố) luôn
  cao hơn vùng an toàn phía trên thanh điều khiển dưới cùng
  (`getPlayerBarSafeHeight()`) ở 4 kích thước màn hình khác nhau (360×640 đến
  1440×900), với mọi giá trị `dpr`.
- Kiểm chứng độc lập (không cần load cả app) rằng tọa độ các bar trong kiểu
  "Phản chiếu" mới đối xứng đúng cả 4 hướng (trái/phải quanh `centerX`,
  trên/dưới quanh `centerY`) và không có bar nào vượt ra ngoài canvas hoặc
  lấn qua tâm.
- Mô phỏng một cấu hình `localStorage` kiểu cũ (chứa `type: 'synthesia'`,
  `rainStyle: 'classic'`, `rainSitter`, `seasonMode`...) rồi gọi `loadConfig()`
  và xác nhận: không còn giá trị visual/field đã loại bỏ nào sót lại trong
  `vizConfig`, và `type: 'synthesia'` được quy đổi đúng thành
  `bar` + `barStyle: 'cascade'`.
- Rà soát toàn bộ ID HTML mới trong `settings-drawer.js` (block-bar-style,
  setting-bar-style, setting-street-standing...) khớp 1-1 với biến
  `document.getElementById(...)` tương ứng trong `dom-refs.js`.

## Lưu ý cho người đã dùng bản cũ

Nếu trình duyệt đã lưu cấu hình cũ với visual "Rừng Đom Đóm", "4 Mùa", hoặc
"Synthesia", lần mở sẽ tự chuyển sang visual "Bar" (xem mục Migration ở
trên) — có thể vào `Cài đặt → Hình học Visualizer → Kiểu Bar` để chọn lại
kiểu Phản chiếu/Thác đổ nếu muốn. Nếu đã chọn kiểu mưa "classic", lần mở sẽ
tự chuyển sang "Trôi trên cửa kính". Cấu hình cũ không có các trường mới của
ver 4 (`barStyle`, `streetStanding`) sẽ tự nhận giá trị mặc định hợp lý (Phản
chiếu, 1 người đứng dưới đèn).
