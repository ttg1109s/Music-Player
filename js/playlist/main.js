/**
 * playlist/main.js — "Bộ điều phối" của module Playlist, viết theo DẠNG OBJECT-FUNCTION.
 *
 * Gom các phần "khởi tạo & gắn sự kiện ở cấp màn hình Playlist" (menu sắp xếp, ô tìm kiếm) vào
 * một object duy nhất `PlaylistMain` với các method rõ ràng, thay vì rải rác top-level như bản
 * gộp cũ. Logic chi tiết vẫn nằm ở các file cùng thư mục:
 *   - state.js   : biến trạng thái dùng chung
 *   - order.js   : thuật toán thứ tự (render order / play queue / sort / shuffle)
 *   - render.js  : dựng & diff DOM danh sách, trạng thái rỗng, lọc tìm kiếm
 *   - loader.js  : nạp file mới + quét DB lúc khởi động
 *   - actions.js : phát/xoá/menu/modal từng bài
 *
 * `PlaylistMain.init()` được gọi 1 lần (cuối file này) — mọi #id liên quan đã tồn tại trong DOM
 * vì js/main.js (bootstrap) đã mount toàn bộ component TRƯỚC khi nhóm js/core + js/playlist chạy.
 */
        const PlaylistMain = {

            // ---- Menu "Sắp xếp danh sách hiển thị" (default / A→Z / Z→A; v6 đã bỏ "Ngẫu nhiên") ----
            initSortMenu() {
                const btnSortDisplay = document.getElementById('btn-sort-display');
                const sortDisplayMenu = document.getElementById('sort-display-menu');
                if (!btnSortDisplay || !sortDisplayMenu) return;

                const updateCheckmarks = () => {
                    sortDisplayMenu.querySelectorAll('.sort-display-option').forEach(btn => {
                        const isActive = btn.dataset.sort === displaySortMode;
                        btn.querySelector('.sort-check').classList.toggle('hidden', !isActive);
                    });
                };

                btnSortDisplay.addEventListener('click', (e) => {
                    e.stopPropagation();
                    updateCheckmarks();
                    sortDisplayMenu.classList.toggle('hidden');
                });
                sortDisplayMenu.querySelectorAll('.sort-display-option').forEach(btn => {
                    btn.addEventListener('click', () => {
                        setDisplaySortMode(btn.dataset.sort);
                        sortDisplayMenu.classList.add('hidden');
                    });
                });
                document.addEventListener('click', (e) => {
                    if (!sortDisplayMenu.classList.contains('hidden') && !sortDisplayMenu.contains(e.target) && e.target !== btnSortDisplay) {
                        sortDisplayMenu.classList.add('hidden');
                    }
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
                this.initSearch();
            }
        };

        PlaylistMain.init();
