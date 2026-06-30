/**
 * playlist/order.js — Thuật toán THỨ TỰ cho cả 2 khái niệm (xem state.js):
 *   - `renderOrder` (UI): sort theo mode + lọc tìm kiếm, cập nhật NGAY mọi lúc.
 *   - `displayOrder` (hàng đợi phát): sort theo mode nhưng có "pending append" lúc đang phát.
 * Cùng dùng chung 1 hàm so sánh tên (sortKeysByMode) để 2 thứ tự nhất quán về quy tắc sắp xếp.
 *
 * Ver 8: matchesSearch() lọc thêm theo `tag.album` (trước đây chỉ title + artist) — gõ tên
 * album vào ô tìm kiếm giờ cũng ra kết quả đúng.
 */

        /** Mảng key đã lọc bỏ bài lỗi (confirmedBrokenKeys) — nền chung cho cả render lẫn hàng đợi. */
        function liveKeys() {
            return appState.get('playlistOrder').filter(k => !appState.get('confirmedBrokenKeys').has(k));
        }

        /** So sánh & trả về MẢNG MỚI đã sắp theo displaySortMode. 'default' giữ nguyên thứ tự thêm. */
        function sortKeysByMode(keys) {
            if (appState.get('displaySortMode') === 'az' || appState.get('displaySortMode') === 'za') {
                return keys.slice().sort((a, b) => {
                    const nameA = appState.get('songNameIndex').get(a) || ''; const nameB = appState.get('songNameIndex').get(b) || '';
                    const cmp = nameA.localeCompare(nameB, 'vi');
                    return appState.get('displaySortMode') === 'az' ? cmp : -cmp;
                });
            }
            return keys.slice(); // 'default'
        }

        function matchesSearch(key) {
            if (!appState.get('searchQuery')) return true;
            const cached = appState.get('playlistCache').get(key);
            const title = normalizeSongName(cached ? cached.tag.title : key);
            const artist = normalizeSongName(cached ? cached.tag.artist : '');
            const album = normalizeSongName(cached ? cached.tag.album : '');
            return title.includes(appState.get('searchQuery')) || artist.includes(appState.get('searchQuery')) || album.includes(appState.get('searchQuery'));
        }

        // ===================== (A) DANH SÁCH HIỂN THỊ =====================
        /**
         * Tính lại renderOrder = các bài hợp lệ, lọc theo ô tìm kiếm, sắp theo mode hiện tại.
         * KHÔNG bao giờ phụ thuộc currentKey / pending / hàng đợi phát — UI luôn "đúng như mắt thấy".
         */
        function recomputeRenderOrder() {
            appState.set('renderOrder', sortKeysByMode(liveKeys().filter(matchesSearch)));
        }

        // ===================== (B) HÀNG ĐỢI PHÁT =====================
        /** Tính lại displayOrder thật (sort theo mode), xoá pending. Dùng khi đổi mode / chạm biên. */
        function recomputeDisplayOrder() {
            appState.set('displayOrder', sortKeysByMode(liveKeys()));
            appState.mutate('pendingResortKeys', s => s.clear());
        }

        /**
         * Thêm bài MỚI vào hàng đợi phát:
         *   - Không đang phát gì -> resort hàng đợi ngay (mạch phát chưa bắt đầu, sắp lại vô hại).
         *   - Đang phát -> nối vào CUỐI hàng đợi + ghi nhận pending (chỉ resort khi chạm biên),
         *     để không làm gãy thứ tự đang nghe. (Phần này KHÔNG ảnh hưởng renderOrder/UI.)
         *
         * TỐI ƯU (v7): trước đây dùng `displayOrder.includes(k)` NGAY TRONG vòng `for` qua
         * `newKeys` -> O(newKeys.length × displayOrder.length), tức O(n²) khi nạp nhiều file vào
         * playlist đã lớn (vài nghìn bài). Đổi sang tra cứu qua `Set` (O(1)/lần) dựng 1 lần TRƯỚC
         * vòng lặp -> tổng chi phí còn O(newKeys.length + displayOrder.length). Logic kết quả
         * (thứ tự nối vào cuối displayOrder, tập pendingResortKeys) giữ nguyên 100% so với bản cũ.
         */
        function applyNewSongsToDisplayOrder(newKeys) {
            if (newKeys.length === 0) {
                if (appState.get('displayOrder').length !== liveKeys().length) recomputeDisplayOrder();
                return;
            }
            if (!appState.get('currentKey')) { recomputeDisplayOrder(); return; }
            const displaySet = new Set(appState.get('displayOrder')); // tra cứu O(1) thay cho .includes() O(n)
            for (const k of newKeys) {
                if (!displaySet.has(k)) {
                    appState.mutate('displayOrder', arr => arr.push(k));
                    displaySet.add(k);
                }
                appState.mutate('pendingResortKeys', s => s.add(k));
            }
        }

        function updateShuffleArray() {
            appState.set('shuffleIndices', appState.get('playlistOrder').slice());
            if (appState.get('isShuffle')) {
                appState.mutate('shuffleIndices', arr => {
                    for (let i = arr.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [arr[i], arr[j]] = [arr[j], arr[i]];
                    }
                });
            }
        }

        /** Đổi kiểu sắp xếp hiển thị (default/az/za) — cập nhật CẢ render lẫn hàng đợi phát rồi vẽ lại. */
        function setDisplaySortMode(mode) {
            if (!['default', 'az', 'za'].includes(mode)) return;
            appState.set('displaySortMode', mode);
            recomputeDisplayOrder();   // hàng đợi: resort thật (đổi mode là hành động chủ động)
            recomputeRenderOrder();    // UI: sắp lại ngay
            renderPlaylistDiff();
        }
