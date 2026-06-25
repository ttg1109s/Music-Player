# Changelog — Ver 2

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

5. **Thiết kế lại hình dáng cây trong Rừng Đom Đóm** (★ đã bỏ hoàn toàn ở
   ver 3, mục này chỉ còn giá trị lịch sử) — trước đây mỗi cây chỉ là một
   tam giác đơn giản (1 đỉnh + 2 đáy). Ver 2 đổi thành 2 kiểu cây:
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
