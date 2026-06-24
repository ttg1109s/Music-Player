/**
 * playlist/order.js — Thuật toán THỨ TỰ cho cả 2 khái niệm (xem state.js):
 *   - `renderOrder` (UI): sort theo mode + lọc tìm kiếm, cập nhật NGAY mọi lúc.
 *   - `displayOrder` (hàng đợi phát): sort theo mode nhưng có "pending append" lúc đang phát.
 * Cùng dùng chung 1 hàm so sánh tên (sortKeysByMode) để 2 thứ tự nhất quán về quy tắc sắp xếp.
 */

        /** Mảng key đã lọc bỏ bài lỗi (confirmedBrokenKeys) — nền chung cho cả render lẫn hàng đợi. */
        function liveKeys() {
            return playlistOrder.filter(k => !confirmedBrokenKeys.has(k));
        }

        /** So sánh & trả về MẢNG MỚI đã sắp theo displaySortMode. 'default' giữ nguyên thứ tự thêm. */
        function sortKeysByMode(keys) {
            if (displaySortMode === 'az' || displaySortMode === 'za') {
                return keys.slice().sort((a, b) => {
                    const nameA = songNameIndex.get(a) || ''; const nameB = songNameIndex.get(b) || '';
                    const cmp = nameA.localeCompare(nameB, 'vi');
                    return displaySortMode === 'az' ? cmp : -cmp;
                });
            }
            return keys.slice(); // 'default'
        }

        function matchesSearch(key) {
            if (!searchQuery) return true;
            const cached = playlistCache.get(key);
            const title = normalizeSongName(cached ? cached.tag.title : key);
            const artist = normalizeSongName(cached ? cached.tag.artist : '');
            return title.includes(searchQuery) || artist.includes(searchQuery);
        }

        // ===================== (A) DANH SÁCH HIỂN THỊ =====================
        /**
         * Tính lại renderOrder = các bài hợp lệ, lọc theo ô tìm kiếm, sắp theo mode hiện tại.
         * KHÔNG bao giờ phụ thuộc currentKey / pending / hàng đợi phát — UI luôn "đúng như mắt thấy".
         */
        function recomputeRenderOrder() {
            renderOrder = sortKeysByMode(liveKeys().filter(matchesSearch));
        }

        // ===================== (B) HÀNG ĐỢI PHÁT =====================
        /** Tính lại displayOrder thật (sort theo mode), xoá pending. Dùng khi đổi mode / chạm biên. */
        function recomputeDisplayOrder() {
            displayOrder = sortKeysByMode(liveKeys());
            pendingResortKeys.clear();
        }

        /**
         * Thêm bài MỚI vào hàng đợi phát:
         *   - Không đang phát gì -> resort hàng đợi ngay (mạch phát chưa bắt đầu, sắp lại vô hại).
         *   - Đang phát -> nối vào CUỐI hàng đợi + ghi nhận pending (chỉ resort khi chạm biên),
         *     để không làm gãy thứ tự đang nghe. (Phần này KHÔNG ảnh hưởng renderOrder/UI.)
         */
        function applyNewSongsToDisplayOrder(newKeys) {
            if (newKeys.length === 0) {
                if (displayOrder.length !== liveKeys().length) recomputeDisplayOrder();
                return;
            }
            if (!currentKey) { recomputeDisplayOrder(); return; }
            for (const k of newKeys) {
                if (!displayOrder.includes(k)) displayOrder.push(k);
                pendingResortKeys.add(k);
            }
        }

        function updateShuffleArray() {
            shuffleIndices = playlistOrder.slice();
            if (isShuffle) {
                for (let i = shuffleIndices.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffleIndices[i], shuffleIndices[j]] = [shuffleIndices[j], shuffleIndices[i]];
                }
            }
        }

        /** Đổi kiểu sắp xếp hiển thị (default/az/za) — cập nhật CẢ render lẫn hàng đợi phát rồi vẽ lại. */
        function setDisplaySortMode(mode) {
            if (!['default', 'az', 'za'].includes(mode)) return;
            displaySortMode = mode;
            recomputeDisplayOrder();   // hàng đợi: resort thật (đổi mode là hành động chủ động)
            recomputeRenderOrder();    // UI: sắp lại ngay
            renderPlaylistDiff();
        }
