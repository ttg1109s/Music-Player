# Changelog — Ver 3 (mới nhất)

1. **Rừng Đom Đóm → Bãi Đồi & Túp Lều**: bỏ hoàn toàn các cây (thông nhiều
   tầng / tán tròn) của ver 1-2. Thay vào đó:
   - **Bãi đồi cỏ 3 lớp** (xa → gần), mỗi lớp là một đường viền cong mềm
     (nội suy smoothstep giữa các "đỉnh" ngẫu nhiên), càng gần càng đậm màu
     và càng thấp trên màn hình.
   - **Cụm cỏ lưa thưa** trên sườn đồi gần nhất, đung đưa theo gió + năng
     lượng nhạc.
   - **Một túp lều gỗ nhỏ** nằm trên sườn đồi gần, có cửa hắt ánh đèn vàng
     ấm (phản ứng nhẹ theo nhạc) và làn khói mỏng bay lên từ nóc.
   - **Mặt trăng to** (bán kính ~16% chiều rộng màn hình) được đặt đúng
     ngay đường chân trời của lớp đồi xa nhất, nên nửa trên luôn lộ ra trời
     còn nửa dưới bị các lớp đồi phía trước che khuất một cách tự nhiên.
   - Đàn đom đóm (cluster, parallax, nhịp nhấp nháy riêng từng con...) giữ
     nguyên 100% logic từ ver 1, chỉ đổi phần nền phía sau.

2. **Thêm kiểu mưa mới: "Mưa phố & công viên" (`street`)** — chọn ở
   `Cài đặt → Hình học Visualizer → Kiểu hiệu ứng mưa`. Bên cạnh 2 kiểu cũ
   (`classic` mưa sấm sét, `glass` trôi trên cửa kính):
   - Một cột **đèn đường chính** (đặt cạnh ghế công viên) + 2 đèn phụ mờ
     phía xa để tạo chiều sâu. Đèn **nhấp nháy theo bass/beat** của nhạc —
     đèn chính phản ứng mạnh hơn đèn phụ.
   - **Mưa rơi tỉ lệ nghịch với năng lượng nhạc**: nhạc nhẹ/im lặng → mưa
     to, dày, rơi nhanh; nhạc mạnh lên → mưa nhỏ, thưa, rơi chậm lại (không
     bao giờ biến mất hoàn toàn, chỉ co lại tối thiểu ~25% mật độ gốc).
   - **Ghế công viên** vẽ bằng silhouette gỗ tối giản, cạnh đèn chính.
   - **Tuỳ chọn người ngồi trên ghế** (silhouette vector đơn giản, đồng bộ
     phong cách với toàn bộ visualizer): *Không có ai* / *Ngồi một mình* /
     *Ngồi đôi*. Khi chọn "Ngồi đôi" sẽ hiện thêm lựa chọn kiểu cặp: *Nam &
     Nữ*, *Nam & Nam*, *Nữ & Nữ* (phân biệt qua dáng tóc: nam tóc ngắn ôm
     đầu, nữ tóc dài phủ ngang vai).
   - Vũng nước lăn tăn phản chiếu ánh đèn khi nhạc dồn bass mạnh.

3. **Thêm chế độ visualizer mới: "4 Mùa" (`seasons`)** — chế độ thứ 10
   trong vòng cycle (nút đổi kiểu hiển thị). Nền chung là bãi đồi cỏ 2 lớp
   + một mái nhà nhỏ riêng (không liên quan đến túp lều của Rừng Đom Đóm).
   Có 4 mùa, mỗi mùa đổi màu trời/đồi và hạt rơi đặc trưng:
   - **Xuân**: trời hồng nhạt, hoa đào rơi nhẹ nhàng, đung đưa theo gió.
   - **Hạ**: trời xanh có mặt trời sáng rực (phản ứng nhẹ theo nhạc), đồi
     cỏ điểm hoa hướng dương hướng lên, đung đưa theo nhạc.
   - **Thu**: trời cam hoàng hôn, lá rụng nhiều màu (cam/nâu/vàng), gió
     thổi xiên **mạnh hơn rõ rệt khi nhạc lên** (năng lượng nhạc đẩy lá bay
     nhanh và xiên hơn).
   - **Đông**: trời xanh đêm lạnh, có trăng dịu, tuyết rơi phủ dần lên mái
     nhà nhỏ (lớp tuyết vẽ đè lên mái, có viền rủ mềm ở mép).

   **3 cách chọn mùa** ở `Cài đặt → Hình học Visualizer → Chế độ chọn mùa`:
   - *Cố định 1 mùa*: luôn hiển thị đúng mùa đã chọn ở dropdown bên dưới.
   - *Ngẫu nhiên theo bài hát*: mỗi khi chuyển sang bài hát mới, bốc ngẫu
     nhiên 1 trong 4 mùa và giữ nguyên suốt bài đó.
   - *Theo nhạc hiện tại*: mùa tự đổi theo năng lượng nhạc tức thời — năng
     lượng rất thấp → Đông, thấp → Xuân, trung bình → Thu, cao → Hạ.

4. **Tiêu đề trang** đổi thành
   `Audio Visualizer - Master Edition (ver 3 - Bãi Đồi, Mưa Phố & 4 Mùa)`.

→ 8 file thay đổi trong ver 3: `js/components/settings-drawer.js`,
`js/core/canvas-scene-setup.js`, `js/core/config.js`, `js/core/dom-refs.js`,
`js/core/equalizer-settings.js`, `js/core/player-controls.js`,
`js/visualizers/draw-helpers.js`, `js/visualizers/draw-visualizer.js`.
**Không có file mới nào được thêm** — toàn bộ thay đổi nằm trong các file
đã tồn tại từ bản chia module gốc.

## Đã kiểm tra (ver 3)

- 8 file thay đổi của ver 3 đều hợp lệ về cú pháp (`node --check`), kiểm
  tra độc lập từng file.
- Đã mô phỏng bằng số học (`node -e`) để xác nhận:
  - `getHillYAt()` (nội suy đường viền đồi) không trả về `NaN`, dao động
    ổn định trong biên độ `amp` đã đặt cho mọi vị trí `x` trên canvas.
  - Vị trí mặt trăng trong Rừng Đom Đóm đặt đúng tâm ngay đường chân trời
    của lớp đồi xa nhất — xác nhận bằng toạ độ cụ thể rằng đúng nửa trên
    lộ ra trời và nửa dưới nằm sau lớp đồi.
  - `getActiveSeason()` trả về đúng mùa cho cả 3 chế độ (`fixed`,
    `songRandom` đổi đúng lúc đổi bài hát, `music` đổi đúng theo các mốc
    năng lượng nhạc).
- Đã rà soát toàn bộ ID HTML mới trong `settings-drawer.js` khớp 1-1 với
  biến `document.getElementById(...)` tương ứng trong `dom-refs.js`.

## Lưu ý cho người đã dùng bản cũ

Nếu trình duyệt đã lưu cấu hình cũ với kiểu Vortex "Bụi Lượng Tử" (từ
trước ver 1), lần mở sẽ tự chuyển sang kiểu "Vòng Ring Ánh Sáng" — có thể
vào `Cài đặt → Hình học Visualizer → Kiểu Ống Vortex` để chọn lại kiểu khác
(Rings / Bars 3D / Wave) nếu muốn. Cấu hình cũ không có các trường mới của
ver 3 (`rainSitter`, `seasonMode`...) sẽ tự nhận giá trị mặc định hợp lý
(không có ai ngồi ghế, mùa cố định = Xuân).
