# Changelog — Ver 1

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
