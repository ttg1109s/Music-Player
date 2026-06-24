/**
 * playlist/render.js — Vẽ DANH SÁCH HIỂN THỊ (renderOrder) ra DOM theo kiểu diff (chỉ đụng node
 * cần đổi). Toàn bộ render đọc `renderOrder` (UI) — KHÔNG đọc `displayOrder` (hàng đợi phát).
 *
 * Trạng thái rỗng (#playlist-empty / #playlist-search-empty) được tính thuần từ dữ liệu:
 *   - Không có bài nào hợp lệ        -> hiện "Chưa có bài hát nào".
 *   - Có bài nhưng tìm kiếm 0 kết quả -> hiện "Không tìm thấy bài hát phù hợp".
 *   - Còn lại                         -> ẩn cả hai.
 * (Sửa lỗi v6: trước đây #playlist-empty không bao giờ được tự ẩn khi đã có bài, nên hiện đè
 *  lên cả danh sách.)
 */

        function songActionMenuButtonHtml(key) {
            return `<button data-action="menu" data-key="${key}" class="p-2 text-slate-400 hover:text-white transition-colors z-10" title="Tùy chọn">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 6a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4z"/></svg>
            </button>`;
        }

        function buildSongNode(key) {
            const cached = playlistCache.get(key);
            const title = cached ? cached.tag.title : key;
            const artist = cached ? cached.tag.artist : '';
            const coverUrl = (cached && cached.cover) ? URL.createObjectURL(cached.cover) : DEFAULT_VINYL;

            const isPlaying = (key === currentKey); const isActuallyPlaying = isPlaying && !audioPlayer.paused;
            const eqIconHtml = isActuallyPlaying ? `<div class="flex items-end gap-[2px] h-3 w-3"><div class="w-[3px] bg-sky-400 eq-1"></div><div class="w-[3px] bg-sky-400 eq-2"></div><div class="w-[3px] bg-sky-400 eq-3"></div></div>` : (isPlaying ? `<div class="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_5px_rgba(14,165,233,0.8)]"></div>` : '');
            const menuBtnHtml = songActionMenuButtonHtml(key);

            const wrapper = document.createElement('div');
            wrapper.dataset.key = key;

            if (isGridView) {
                wrapper.className = `flex flex-col cursor-pointer active:scale-[0.98] transition-transform group relative w-full`;
                wrapper.dataset.role = 'play-item';
                wrapper.innerHTML = `
                    <div class="w-full aspect-square relative mb-2.5">
                        <img src="${coverUrl}" class="w-full h-full rounded-2xl object-cover shadow-lg">
                        ${isPlaying ? `<div class="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center backdrop-blur-[2px]">${eqIconHtml}</div>` : ''}
                        <div class="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">${menuBtnHtml}</div>
                    </div>
                    <h3 class="text-white text-[15px] font-semibold leading-tight line-clamp-1 px-1">${title}</h3>
                    <p class="text-slate-400 text-[13px] font-medium line-clamp-1 px-1 mt-0.5">${artist}</p>`;
            } else {
                wrapper.className = `flex items-center gap-4 px-5 py-3 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer w-full group border-b border-white/5`;
                wrapper.dataset.role = 'play-item';
                wrapper.innerHTML = `
                    <img src="${coverUrl}" class="w-12 h-12 rounded-lg flex-shrink-0 object-cover shadow-md">
                    <div class="flex-grow flex flex-col justify-center overflow-hidden gap-0.5">
                        <div class="flex items-center gap-2"><h3 class="text-[16px] leading-tight font-semibold truncate ${isPlaying ? 'text-sky-300' : 'text-slate-100'}">${title}</h3>${isPlaying ? eqIconHtml : ''}</div>
                        <p class="text-[13px] text-slate-400 truncate font-medium">${artist}</p>
                    </div>
                    <div class="flex opacity-0 group-hover:opacity-100 transition-opacity">${menuBtnHtml}</div>`;
            }
            return wrapper;
        }

        /** Cập nhật trạng thái rỗng/không-kết-quả thuần từ dữ liệu (không liên quan hàng đợi phát). */
        function updateEmptyState() {
            const totalSongs = liveKeys().length;
            const emptyEl = playlistEmpty;
            const searchEmptyEl = document.getElementById('playlist-search-empty');
            if (totalSongs === 0) {
                emptyEl.classList.remove('hidden');
                if (searchEmptyEl) searchEmptyEl.classList.add('hidden');
            } else if (renderOrder.length === 0) {
                emptyEl.classList.add('hidden');
                if (searchEmptyEl) searchEmptyEl.classList.remove('hidden');
            } else {
                emptyEl.classList.add('hidden');
                if (searchEmptyEl) searchEmptyEl.classList.add('hidden');
            }
        }

        function renderPlaylistFull() {
            playlistContainer.innerHTML = '';
            domNodesByKey.clear();
            renderOrder.forEach((key) => {
                const node = buildSongNode(key);
                domNodesByKey.set(key, node);
                playlistContainer.appendChild(node);
            });
            if (currentKey) btnReturnVisual.classList.remove('hidden'); else btnReturnVisual.classList.add('hidden');
            updateEmptyState();
        }

        function renderPlaylistDiff() {
            if (playlistContainer.children.length !== domNodesByKey.size) {
                renderPlaylistFull();
                return;
            }

            const renderKeySet = new Set(renderOrder);

            for (const [key, node] of Array.from(domNodesByKey.entries())) {
                if (!renderKeySet.has(key)) {
                    node.remove();
                    domNodesByKey.delete(key);
                }
            }

            let prevNode = null;
            for (const key of renderOrder) {
                let node = domNodesByKey.get(key);
                if (!node) {
                    node = buildSongNode(key);
                    domNodesByKey.set(key, node);
                }
                const expectedNextSibling = prevNode ? prevNode.nextSibling : playlistContainer.firstChild;
                if (expectedNextSibling !== node) {
                    playlistContainer.insertBefore(node, expectedNextSibling);
                }
                prevNode = node;
            }

            if (currentKey) btnReturnVisual.classList.remove('hidden'); else btnReturnVisual.classList.add('hidden');
            updateEmptyState();
        }

        function refreshSongNode(key) {
            const oldNode = domNodesByKey.get(key);
            if (!oldNode) return;
            const newNode = buildSongNode(key);
            oldNode.replaceWith(newNode);
            domNodesByKey.set(key, newNode);
        }

        /** Ô tìm kiếm thay đổi: CHỈ lọc lại danh sách hiển thị (renderOrder) — KHÔNG đụng hàng đợi phát. */
        function applySearchQuery(raw) {
            searchQuery = normalizeSongName(raw);
            recomputeRenderOrder();
            renderPlaylistDiff();
        }
