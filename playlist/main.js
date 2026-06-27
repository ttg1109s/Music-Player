/**
 * playlist/main.js — "Bộ điều phối" của module Playlist, viết theo DẠNG OBJECT-FUNCTION.
 *
 * Gom các phần "khởi tạo & gắn sự kiện ở cấp màn hình Playlist" (sắp xếp, kiểu xem, ô tìm kiếm)
 * vào một object duy nhất `PlaylistMain` với các method rõ ràng, thay vì rải rác top-level như
 * bản gộp cũ. Logic chi tiết vẫn nằm ở các file cùng thư mục:
 *   - state.js   : biến trạng thái dùng chung
 *   - order.js   : thuật toán thứ tự (render order / play queue / sort / shuffle)
 *   - render.js  : dựng & diff DOM danh sách, trạng thái rỗng, lọc tìm kiếm
 *   - loader.js  : nạp file mới + quét DB lúc khởi động
 *   - actions.js : phát/xoá/menu/modal từng bài
 *
 * Ver 10 refine: "Sắp xếp" + "Kiểu xem" (grid/list) CHUYỂN từ 2 icon riêng ở header Playlist
 * (#btn-sort-display + dropdown nổi, #btn-toggle-view) sang 2 <select> trong Settings (section
 * "Danh sách phát & Nền", xem js/components/settings/playlist-background.js) — dọn header gọn
 * lại. initSortMenu() đổi tên ý nghĩa thành đọc/ghi qua select thay cho dropdown menu nổi.
 * initViewMode() là method MỚI, chuyển nguyên logic grid/list từ state-and-video-bg.js sang đây
 * (cùng nhà với initSortMenu() — cùng nhóm "cách hiển thị danh sách Playlist").
 *
 * `PlaylistMain.init()` được gọi 1 lần (cuối file này) — mọi #id liên quan đã tồn tại trong DOM
 * vì js/main.js (bootstrap) đã mount toàn bộ component TRƯỚC khi nhóm js/core + js/playlist chạy.
 */
        const PlaylistMain = {

            // ---- "Sắp xếp" (default / A→Z / Z→A; v6 đã bỏ "Ngẫu nhiên") — select trong Settings ----
            initSortMenu() {
                const sortSelect = document.getElementById('setting-playlist-sort-mode');
                if (!sortSelect) return;
                sortSelect.value = displaySortMode; // đồng bộ giá trị hiện tại lúc Settings mở ra
                sortSelect.addEventListener('change', (e) => {
                    setDisplaySortMode(e.target.value);
                });
            },

            // ---- "Kiểu xem" (Danh sách / Lưới) — select trong Settings, thay cho #btn-toggle-view
            //      cũ (logic chuyển nguyên từ state-and-video-bg.js, không đổi gì về hành vi). ----
            initViewMode() {
                const viewModeSelect = document.getElementById('setting-playlist-view-mode');
                if (!viewModeSelect) return;
                viewModeSelect.value = isGridView ? 'grid' : 'list'; // đồng bộ giá trị hiện tại lúc Settings mở ra
                viewModeSelect.addEventListener('change', (e) => {
                    isGridView = (e.target.value === 'grid');
                    playlistContainer.className = isGridView
                        ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-6 px-5 pb-32'
                        : 'flex flex-col pb-32';
                    renderPlaylistFull(); // layout grid/list khác cấu trúc node hoàn toàn -> vẽ lại từ đầu, không diff
                });
            },

            // ---- Ô tìm kiếm nhanh trong Playlist (chỉ lọc DANH SÁCH HIỂN THỊ, không đụng hàng đợi phát) ----
            initSearch() {
                const input = document.getElementById('playlist-search-input');
                const clearBtn = document.getElementById('playlist-search-clear');
                if (!input) return;
                input.addEventListener('input', (e) => {
                    const val = e.target.value;
                    if (clearBtn) clearBtn.classList.toggle('hidden', !val);
                    applySearchQuery(val);
                });
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        input.value = '';
                        clearBtn.classList.add('hidden');
                        applySearchQuery('');
                        input.focus();
                    });
                }
            },

            init() {
                this.initSortMenu();
                this.initViewMode();
                this.initSearch();
            }
        };

        PlaylistMain.init();
