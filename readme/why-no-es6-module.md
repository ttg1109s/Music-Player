# Vì sao không dùng ES6 module ở đây?

Với `type="module"`, mỗi file có scope riêng và trình duyệt áp dụng CORS khi
nạp qua `file://`, nên sẽ bị lỗi khi mở trực tiếp. Với `<script>` thường,
tất cả file chia sẻ **cùng một global scope** giống như khi chúng còn nằm
trong một thẻ `<script>` duy nhất — đây là lý do toàn bộ logic gốc vẫn chạy
đúng dù đã được chia ra nhiều file.

**[v11]** Toàn bộ 14 cụm `/event/` (listener/router/workflow) và `service/state.js` vẫn tuân thủ
đúng quy ước này — `eventBus`, `EventStore`, `appState`, `CONST` đều là biến/hằng global thường
(không `export`/`import`), dựa vào đúng cơ chế "1 global scope chung" ở trên để mọi file gọi được
lẫn nhau mà không cần khai báo `import` — không có ngoại lệ nào phá vỡ quy tắc "không ES6 module"
kể từ khi dự án bắt đầu.

← [Quay lại README](../README.md)
