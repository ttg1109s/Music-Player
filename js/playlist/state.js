/**
 * playlist/state.js — TRẠNG THÁI dùng chung cho toàn bộ module Playlist (state.js, order.js,
 * render.js, loader.js, actions.js, main.js).
 *
 * KIẾN TRÚC v6 — TÁCH RÕ 2 KHÁI NIỆM TỪNG BỊ TRỘN LẪN:
 *
 *   (A) DANH SÁCH HIỂN THỊ (UI)  → `renderOrder`
 *       Là thứ người dùng NHÌN THẤY trong màn Playlist. Về mặt ý nghĩa người dùng, nó chỉ là
 *       "danh sách bài hát đang có", LUÔN được sắp theo `displaySortMode` (+ lọc theo ô tìm
 *       kiếm) và LUÔN cập nhật NGAY khi thêm/xoá/sửa bài — KHÔNG phụ thuộc đang phát bài nào,
 *       KHÔNG phụ thuộc thuật toán hàng đợi phát.
 *
 *   (B) HÀNG ĐỢI PHÁT (logic) → `displayOrder`
 *       Là thứ tự Next/Prev sẽ đi qua khi KHÔNG trộn bài. Đây thuần tuý là logic phát: thêm bài
 *       lúc đang nghe thì nối vào CUỐI hàng đợi (pending) để không làm gãy mạch đang nghe, chỉ
 *       resort thật khi "chạm biên" (xem player-controls.js + order.js). Việc nối-vào-cuối này
 *       KHÔNG liên quan gì tới DOM/UI ở (A).
 *
 *   Trước v6, cả render lẫn Next/Prev đều dùng chung `displayOrder` nên UI bị phụ thuộc vào
 *   thuật toán hàng đợi (thêm bài lúc đang phát thì DOM không sắp xếp lại ngay). v6 tách hẳn:
 *   render đọc `renderOrder`, Next/Prev đọc `displayOrder`. Hai cái cùng sinh ra từ
 *   `playlistOrder` nhưng theo 2 quy tắc khác nhau, không buộc phải giống nhau từng bước.
 *
 * Các tên biến/hàm GLOBAL bên dưới được nhiều file khác (player-controls.js, storage-manager.js,
 * state-and-video-bg.js, component playlist-view) tham chiếu trực tiếp — GIỮ NGUYÊN TÊN khi tách
 * file để không phải sửa lan ra ngoài module.
 */

        // ----- Nguồn chân lý (RAM) -----
        let playlistOrder = [];   // mọi key hợp lệ quét được từ store `songs` (thứ tự thêm vào)
        let displayOrder = [];    // (B) HÀNG ĐỢI PHÁT — Next/Prev khi không shuffle
        let renderOrder = [];     // (A) DANH SÁCH HIỂN THỊ — đã sort + lọc tìm kiếm, chỉ để vẽ DOM

        let playlistCache = new Map();   // key -> {filename, tag, cover, duration}
        let songNameIndex = new Map();   // key -> tên đã chuẩn hoá (bỏ dấu, hạ thường) để sort
        let confirmedBrokenKeys = new Set(); // key lỗi phát thật, người dùng chọn "Giữ lại"
        let currentKey = null;

        let displaySortMode = 'az';  // 'default' | 'az' | 'za' (KHÔNG còn 'random' — bỏ ở v6)
        let pendingResortKeys = new Set(); // key mới thêm lúc đang phát, đợi chạm biên mới sort lại hàng đợi
        let searchQuery = '';        // chuỗi tìm kiếm hiện tại (lọc renderOrder, KHÔNG đụng hàng đợi phát)

        const domNodesByKey = new Map(); // key -> phần tử DOM đã render (diff-render)

        function formatTime(seconds) {
            if (isNaN(seconds)) return "0:00";
            const min = Math.floor(seconds / 60); const sec = Math.floor(seconds % 60); return `${min}:${sec < 10 ? '0' : ''}${sec}`;
        }

        /** Chuẩn hoá tên bài để sort A-Z/Z-A & tìm kiếm ổn định: bỏ dấu tiếng Việt, hạ thường, trim. */
        function normalizeSongName(name) {
            return (name || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        }
