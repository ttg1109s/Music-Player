/**
 * Quản lý danh sách phát — KIẾN TRÚC MỚI: store `songs` trong IndexedDB là CHÂN LÝ DUY NHẤT,
 * không còn lưu `meta.playlistOrder` riêng. Mỗi lần cần danh sách (khởi động, sau khi thêm/xoá
 * bài, sau khi quét/xoá file lỗi ở Quản lý dung lượng), quét lại toàn bộ key qua getAllSongKeys()
 * rồi lọc hợp lệ ngay trong RAM — "có sao thì playlistOrder nhận vậy", không cố lưu/khôi phục thứ
 * tự cũ qua reload.
 *
 * 1) QUÉT NHANH (KHÔNG decode duration): scanValidSongsFromDB() chỉ kiểm tra record có `blob` +
 *    `tag` + MIME đúng mp3 (xem isQuickValidMime trong storage-manager.js) — KHÔNG gọi
 *    readAudioDuration() (tạo Audio() + chờ event, có thể mất tới 8s/bài nếu lỗi) để giữ tốc độ
 *    khởi động nhanh dù playlist dài. File đúng MIME nhưng hỏng thật (không decode được) vẫn được
 *    tạm cho vào playlist — chỉ phát hiện khi thực sự bấm phát (xem audioPlayer 'error' listener
 *    trong player-controls.js) hoặc khi quét sâu ở Quản lý dung lượng.
 *
 * 2) DIFF-BASED RENDER: `domNodesByKey` (Map key -> phần tử DOM) giữ tham chiếu node đã render.
 *    Khi thêm bài mới, không gọi lại render toàn bộ — chỉ insert node CÒN THIẾU vào đúng vị trí.
 *
 * 3) SORT HIỂN THỊ (`displaySortMode`: 'default' | 'az' | 'za' | 'random') — mặc định 'az' (lần
 *    đầu mở app, theo yêu cầu, cân nhắc tốc độ nên KHÔNG có lựa chọn "đúng thứ tự lưu" ổn định qua
 *    reload nữa, vì không còn gì để giữ thứ tự đó). Khi KHÔNG shuffle, Next/Prev dùng trực tiếp
 *    `displayOrder`. Thêm bài lúc đang phát -> vào CUỐI displayOrder trước, resort thật khi
 *    Next/Prev "chạm biên" (xem player-controls.js) — trừ mode 'random', resort ngay khi thêm.
 *
 * 4) MENU 3 CHẤM: 4 icon cũ gộp vào 1 dropdown chung (#song-action-menu).
 *
 * 5) PHÁT LỖI THẬT (audioPlayer bắn event 'error' sau khi gán src — khác với lỗi MIME/thiếu blob
 *    phát hiện được ngay lúc quét): hiện modal hỏi "Giữ lại" (thêm vào confirmedBrokenKeys, ẩn khỏi
 *    playlist, chờ xử lý ở Quản lý dung lượng) hay "Xóa luôn" (xoá thẳng khỏi IndexedDB, cập nhật
 *    lại danh sách ngay). Xem handlePlaybackError() + listener 'error' trong player-controls.js.
 *
 * Biến trạng thái:
 *   - `playlistOrder` (mảng key) — kết quả quét HỢP LỆ gần nhất từ store `songs`, chỉ tồn tại
 *     trong RAM, KHÔNG persist.
 *   - `displayOrder` (mảng key) — thứ tự ĐANG HIỂN THỊ/PHÁT, tính từ playlistOrder + displaySortMode.
 *   - `playlistCache` (Map key -> {filename, tag, cover, duration}) — bản nhẹ trong RAM để render.
 *   - `confirmedBrokenKeys` (Set key) — key người dùng đã chọn "Giữ lại" lúc phát lỗi: loại khỏi
 *     playlist hiển thị, KHÔNG xoá khỏi IndexedDB, chờ xử lý thủ công ở Quản lý dung lượng.
 */
        let playlistOrder = [];
        let displayOrder = [];
        let playlistCache = new Map();
        let songNameIndex = new Map(); // key -> tên bài đã chuẩn hoá (bỏ dấu, hạ thường) để sort nhanh
        let confirmedBrokenKeys = new Set(); // key lỗi phát thật, người dùng chọn "Giữ lại" — ẩn khỏi playlist
        let currentKey = null;
        let displaySortMode = 'az'; // 'default' | 'az' | 'za' | 'random' — mặc định A-Z lúc mở app lần đầu
        let pendingResortKeys = new Set(); // key mới thêm lúc đang phát, đợi chạm biên mới sort lại
        const domNodesByKey = new Map(); // key -> phần tử DOM đã render, dùng cho diff-render

        function formatTime(seconds) {
            if (isNaN(seconds)) return "0:00";
            const min = Math.floor(seconds / 60); const sec = Math.floor(seconds % 60); return `${min}:${sec < 10 ? '0' : ''}${sec}`;
        }

        /** Chuẩn hoá tên bài để sort A-Z/Z-A ổn định: bỏ dấu tiếng Việt, hạ thường, trim. */
        function normalizeSongName(name) {
            return (name || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        }

        /**
         * Đọc duration của 1 file qua thẻ Audio() tạm (event loadedmetadata) — CHỈ dùng lúc nạp file
         * mới (đã chọn từ file picker) và lúc quét sâu ở Quản lý dung lượng — KHÔNG dùng lúc khởi
         * động/quét nhanh (xem scanValidSongsFromDB) để giữ tốc độ load playlist.
         * Có timeout an toàn: một số trình duyệt (đặc biệt Safari iOS) đôi khi không bắn cả
         * 'loadedmetadata' lẫn 'error' cho blob: URL trong vài trường hợp hiếm — không có timeout
         * thì Promise treo vĩnh viễn, kéo theo toàn bộ vòng lặp nạp file bị "đứng hình".
         */
        function readAudioDuration(file) {
            return new Promise((resolve) => {
                let settled = false;
                const safeResolve = (val) => { if (!settled) { settled = true; resolve(val); } };
                let tempUrl;
                try {
                    tempUrl = URL.createObjectURL(file);
                } catch (err) {
                    console.error('[playlist] Không tạo được object URL để đọc duration:', err);
                    return safeResolve(0);
                }
                const tempAudio = new Audio();
                const cleanup = () => { try { URL.revokeObjectURL(tempUrl); } catch (e) {} };
                const timeoutId = setTimeout(() => { cleanup(); safeResolve(0); }, 8000);
                tempAudio.addEventListener('loadedmetadata', () => { clearTimeout(timeoutId); const d = tempAudio.duration; cleanup(); safeResolve(isFinite(d) ? d : 0); });
                tempAudio.addEventListener('error', () => { clearTimeout(timeoutId); cleanup(); safeResolve(0); });
                try {
                    tempAudio.src = tempUrl;
                } catch (err) {
                    clearTimeout(timeoutId); cleanup(); safeResolve(0);
                }
            });
        }

        fileInput.addEventListener('change', async function(e) {
            const files = Array.from(e.target.files); if (files.length === 0) return;
            e.target.value = ''; // cho phép chọn lại đúng file cũ ở lần sau (đổi tag rồi nạp lại)
            playlistEmpty.classList.add('hidden');

            const failedFiles = []; // tên các file lỗi giữa đường, báo cho người dùng sau khi xong
            const newlyAddedKeys = []; // key thực sự MỚI (không phải ghi đè) thêm trong lượt này

            await withLoadingShield(`Đang nạp 1 / ${files.length}...`, async () => {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    loadingText.textContent = `Đang nạp ${i + 1} / ${files.length}...`;

                    try {
                        let tag = { title: file.name.replace(/\.[^/.]+$/, ""), artist: "Không rõ nghệ sĩ", album: "" };
                        let cover = null;

                        await new Promise(resolve => {
                            let settled = false;
                            const safeResolve = () => { if (!settled) { settled = true; resolve(); } };
                            const timeoutId = setTimeout(safeResolve, 5000);

                            if (window.jsmediatags) {
                                try {
                                    jsmediatags.read(file, {
                                        onSuccess: function(tagResult) {
                                            try {
                                                if (tagResult.tags.title) tag.title = tagResult.tags.title;
                                                if (tagResult.tags.artist) tag.artist = tagResult.tags.artist;
                                                if (tagResult.tags.album) tag.album = tagResult.tags.album;
                                                if (tagResult.tags.picture && tagResult.tags.picture.data) {
                                                    const data = tagResult.tags.picture.data;
                                                    const format = tagResult.tags.picture.format;
                                                    cover = new Blob([new Uint8Array(data)], { type: format });
                                                }
                                            } catch (tagErr) {
                                                console.error(`[playlist] Lỗi đọc cover/tag của "${file.name}", bỏ qua cover, vẫn nạp bài:`, tagErr);
                                                cover = null;
                                            }
                                            clearTimeout(timeoutId); safeResolve();
                                        },
                                        onError: function(err) {
                                            console.warn(`[playlist] jsmediatags không đọc được tag của "${file.name}":`, err);
                                            clearTimeout(timeoutId); safeResolve();
                                        }
                                    });
                                } catch (readErr) {
                                    console.error(`[playlist] jsmediatags.read lỗi đồng bộ với "${file.name}":`, readErr);
                                    clearTimeout(timeoutId); safeResolve();
                                }
                            } else { clearTimeout(timeoutId); safeResolve(); }
                        });

                        const duration = await readAudioDuration(file);
                        const key = await resolveSongKey(file.name);
                        const isOverwrite = playlistOrder.includes(key);

                        const record = { filename: file.name, blob: file, tag, cover, subtitles: [], duration, addedAt: Date.now() };
                        if (isOverwrite) {
                            const old = await getSongRecord(key);
                            if (old && old.subtitles) record.subtitles = old.subtitles;
                        }
                        await setSongRecord(key, record);

                        if (!isOverwrite) { playlistOrder.push(key); newlyAddedKeys.push(key); }
                        playlistCache.set(key, { filename: record.filename, tag: record.tag, cover: record.cover, duration: record.duration });
                        songNameIndex.set(key, normalizeSongName(record.tag.title));
                        confirmedBrokenKeys.delete(key); // nạp lại file trùng key coi như đã sửa, bỏ khỏi danh sách lỗi cũ nếu có
                    } catch (err) {
                        console.error(`[playlist] Không nạp được "${file.name}":`, err);
                        const errMsg = (err && err.name && err.message) ? `${err.name}: ${err.message}` : String(err && err.message || err || 'Lỗi không xác định');
                        failedFiles.push(`${file.name} — ${errMsg}`);
                    }
                }
                updateShuffleArray();
                applyNewSongsToDisplayOrder(newlyAddedKeys);
                renderPlaylistDiff();
            });

            if (failedFiles.length > 0) {
                alert(`Không nạp được ${failedFiles.length} file:\n\n${failedFiles.join('\n\n')}`);
            }
        });

        function updateShuffleArray() {
            shuffleIndices = playlistOrder.slice();
            if (isShuffle) {
                for (let i = shuffleIndices.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffleIndices[i], shuffleIndices[j]] = [shuffleIndices[j], shuffleIndices[i]];
                }
            }
        }

        function recomputeDisplayOrder() {
            let order = playlistOrder.filter(k => !confirmedBrokenKeys.has(k));
            if (displaySortMode === 'az' || displaySortMode === 'za') {
                order = order.slice().sort((a, b) => {
                    const nameA = songNameIndex.get(a) || ''; const nameB = songNameIndex.get(b) || '';
                    const cmp = nameA.localeCompare(nameB, 'vi');
                    return displaySortMode === 'az' ? cmp : -cmp;
                });
            } else if (displaySortMode === 'random') {
                order = order.slice();
                for (let i = order.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [order[i], order[j]] = [order[j], order[i]];
                }
            }
            displayOrder = order;
            pendingResortKeys.clear();
        }

        function applyNewSongsToDisplayOrder(newKeys) {
            if (newKeys.length === 0) {
                if (displayOrder.length !== playlistOrder.filter(k => !confirmedBrokenKeys.has(k)).length) recomputeDisplayOrder();
                return;
            }
            if (!currentKey || displaySortMode === 'random') {
                recomputeDisplayOrder();
                return;
            }
            for (const k of newKeys) {
                if (!displayOrder.includes(k)) displayOrder.push(k);
                pendingResortKeys.add(k);
            }
        }

        function setDisplaySortMode(mode) {
            if (!['default', 'az', 'za', 'random'].includes(mode)) return;
            displaySortMode = mode;
            recomputeDisplayOrder();
            renderPlaylistDiff();
        }

        /**
         * Quét NHANH toàn bộ store `songs` — KHÔNG decode duration (xem ghi chú đầu file). Mỗi key
         * đọc record lên, hợp lệ (có blob + tag + MIME đúng mp3) thì add vào danh sách, không hợp lệ
         * thì bỏ qua (không đưa vào playlist, sẽ hiện trong Quản lý dung lượng khi quét sâu ở đó).
         * isQuickValidMime() định nghĩa trong storage-manager.js (dùng chung với phần quét sâu ở
         * Quản lý dung lượng, tránh 2 nơi định nghĩa "thế nào là hợp lệ" lệch nhau).
         */
        async function scanValidSongsFromDB() {
            const keys = await getAllSongKeys();
            const validKeys = [];
            playlistCache.clear(); songNameIndex.clear();
            for (const key of keys) {
                if (confirmedBrokenKeys.has(key)) continue;
                const record = await getSongRecord(key);
                if (!record || !record.blob || !record.tag) continue;
                if (!isQuickValidMime(record.blob.type)) continue;
                validKeys.push(key);
                playlistCache.set(key, { filename: record.filename, tag: record.tag, cover: record.cover, duration: record.duration });
                songNameIndex.set(key, normalizeSongName(record.tag.title));
            }
            return validKeys;
        }

        /**
         * Khởi động app / quét lại danh sách: store `songs` là CHÂN LÝ DUY NHẤT — quét nhanh, gán
         * thẳng vào playlistOrder, không còn đọc/lưu meta.playlistOrder nào cả.
         */
        async function initPlaylistFromDB() {
            playlistOrder = await scanValidSongsFromDB();
            updateShuffleArray();
            recomputeDisplayOrder();
            renderPlaylistDiff();
            if (playlistOrder.length === 0) playlistEmpty.classList.remove('hidden');
        }

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

        function renderPlaylistFull() {
            playlistContainer.innerHTML = '';
            domNodesByKey.clear();
            displayOrder.forEach((key) => {
                const node = buildSongNode(key);
                domNodesByKey.set(key, node);
                playlistContainer.appendChild(node);
            });
            if (currentKey) btnReturnVisual.classList.remove('hidden'); else btnReturnVisual.classList.add('hidden');
        }

        function renderPlaylistDiff() {
            if (playlistContainer.children.length !== domNodesByKey.size) {
                renderPlaylistFull();
                return;
            }

            const displayKeySet = new Set(displayOrder);

            for (const [key, node] of Array.from(domNodesByKey.entries())) {
                if (!displayKeySet.has(key)) {
                    node.remove();
                    domNodesByKey.delete(key);
                }
            }

            let prevNode = null;
            for (const key of displayOrder) {
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
        }

        function refreshSongNode(key) {
            const oldNode = domNodesByKey.get(key);
            if (!oldNode) return;
            const newNode = buildSongNode(key);
            oldNode.replaceWith(newNode);
            domNodesByKey.set(key, newNode);
        }

        /**
         * Loại 1 key khỏi playlist (dùng chung cho: xoá tay, người dùng chọn "Xóa luôn" lúc phát
         * lỗi, người dùng chọn "Giữ lại" lúc phát lỗi — chỉ khác ở việc record có bị xoá khỏi
         * IndexedDB hay không, do nơi gọi quyết định trước khi gọi hàm này).
         */
        function removeKeyFromDisplay(key) {
            playlistOrder = playlistOrder.filter(k => k !== key);
            displayOrder = displayOrder.filter(k => k !== key);
            pendingResortKeys.delete(key);
            playlistCache.delete(key); songNameIndex.delete(key);
            updateShuffleArray();
            renderPlaylistDiff();
            if (playlistOrder.length === 0) playlistEmpty.classList.remove('hidden');
        }

        // ===================== Sort hiển thị =====================
        const btnSortDisplay = document.getElementById('btn-sort-display');
        const sortDisplayMenu = document.getElementById('sort-display-menu');
        function updateSortDisplayCheckmarks() {
            sortDisplayMenu.querySelectorAll('.sort-display-option').forEach(btn => {
                const isActive = btn.dataset.sort === displaySortMode;
                btn.querySelector('.sort-check').classList.toggle('hidden', !isActive);
            });
        }
        if (btnSortDisplay && sortDisplayMenu) {
            btnSortDisplay.addEventListener('click', (e) => {
                e.stopPropagation();
                updateSortDisplayCheckmarks();
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
        }

        // ===================== Menu 3 chấm dùng chung =====================
        const songActionMenu = document.getElementById('song-action-menu');
        const songActionOverlay = document.getElementById('song-action-overlay');
        let songActionMenuKey = null;

        function openSongActionMenu(key, anchorBtn) {
            songActionMenuKey = key;
            const rect = anchorBtn.getBoundingClientRect();
            const menuWidth = 192;
            let left = rect.right - menuWidth;
            if (left < 8) left = 8;
            let top = rect.bottom + 6;
            const viewportH = window.innerHeight || 800;
            if (top + 220 > viewportH) top = rect.top - 220 - 6;
            songActionMenu.style.left = `${left}px`;
            songActionMenu.style.top = `${top}px`;
            songActionMenu.classList.remove('hidden');
            songActionOverlay.classList.remove('hidden');
        }
        function closeSongActionMenu() {
            songActionMenu.classList.add('hidden');
            songActionOverlay.classList.add('hidden');
            songActionMenuKey = null;
        }
        songActionOverlay.addEventListener('click', closeSongActionMenu);
        songActionMenu.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-menu-action]');
            if (!btn || !songActionMenuKey) return;
            const key = songActionMenuKey; const action = btn.dataset.menuAction;
            closeSongActionMenu();
            if (action === 'delete') window.removeSong(key);
            else if (action === 'info') openSongInfoModal(key);
            else if (action === 'edit') openSongEditModal(key);
            else if (action === 'restore') exportSongWithTag(key);
        });

        playlistContainer.addEventListener('click', (e) => {
            const menuBtn = e.target.closest('button[data-action="menu"]');
            if (menuBtn) {
                e.stopPropagation();
                openSongActionMenu(menuBtn.dataset.key, menuBtn);
                return;
            }
            const item = e.target.closest('[data-role="play-item"]');
            if (item) window.playSong(item.dataset.key);
        });

        window.removeSong = function(key) {
            if (key === currentKey) return;
            withLoadingShield("Đang xóa...", async () => {
                await deleteSongRecord(key);
                removeKeyFromDisplay(key);
            });
        };

        window.playSong = function(key) {
            if (key === currentKey) { switchToVisualizer(); if (audioPlayer.paused) audioPlayer.play(); return; }
            requestWakeLock();

            return withLoadingShield("Đang chuyển bài...", async () => {
                if (currentObjectURL) { URL.revokeObjectURL(currentObjectURL); currentObjectURL = null; }
                if (currentCoverObjectURL) { URL.revokeObjectURL(currentCoverObjectURL); currentCoverObjectURL = null; }
                audioPlayer.pause();
                const previousKey = currentKey;

                const record = await getSongRecord(key);
                if (!record) {
                    removeKeyFromDisplay(key);
                    alert("Không đọc được bài hát này, dữ liệu có thể đã bị xóa.");
                    return;
                }

                currentKey = key;
                currentCoverObjectURL = record.cover ? URL.createObjectURL(record.cover) : DEFAULT_VINYL;
                currentObjectURL = URL.createObjectURL(record.blob);
                audioPlayer.src = currentObjectURL;

                playerTitle.textContent = record.tag.title; playerArtist.textContent = record.tag.artist;
                recordContainer.innerHTML = `<img id="record-art" src="${currentCoverObjectURL}" class="w-full h-full rounded-full object-cover shadow-lg relative z-20 ${audioPlayer.paused ? 'paused' : 'animate-spin-slow'}" alt="Record"><div class="absolute inset-0 m-auto w-3 h-3 bg-slate-900 rounded-full border border-slate-700 z-30"></div>`;

                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: record.tag.title || "Visual Master",
                        artist: record.tag.artist || "Unknown Artist",
                        artwork: record.cover ? [{ src: currentCoverObjectURL, sizes: '512x512', type: 'image/jpeg' }] : []
                    });
                }

                audioPlayer.play(); switchToVisualizer();
                if (previousKey) refreshSongNode(previousKey);
                refreshSongNode(key);
                if (!domNodesByKey.has(key)) renderPlaylistDiff();
                if (currentKey) btnReturnVisual.classList.remove('hidden');
                beatTimes = []; fluxHistory = []; currentCalculatedBpm = "---"; statBpm.textContent = "---"; statNote.textContent = "---";
                raindrops = []; ripples = []; glassStaticDrops = []; glassStreaks = []; activeLightnings = []; starFlashes = [];
                setupAudioContext(); updateTypeUI();

                subtitles = record.subtitles ? record.subtitles.slice() : [];
                clearAllActiveSubBlocks(); resetAutoSub(); renderSubList();
            });
        };

        // ===================== Modal: Bài hát lỗi lúc phát (audioPlayer 'error' thật) =====================
        const playbackErrorModal = document.getElementById('playback-error-modal');
        const playbackErrorFilename = document.getElementById('playback-error-filename');
        let playbackErrorKey = null;

        /**
         * Gọi từ listener 'error' của audioPlayer (xem player-controls.js) khi trình duyệt thực sự
         * không decode được file đang phát — khác với lỗi "không tìm thấy record" (removeKeyFromDisplay
         * trực tiếp ở playSong, vì không còn gì để hỏi giữ/xóa).
         */
        function handlePlaybackError(key) {
            playbackErrorKey = key;
            const cached = playlistCache.get(key);
            playbackErrorFilename.textContent = cached ? cached.filename : key;
            playbackErrorModal.classList.remove('hidden');
        }

        document.getElementById('playback-error-keep').addEventListener('click', () => {
            if (!playbackErrorKey) return;
            confirmedBrokenKeys.add(playbackErrorKey);
            removeKeyFromDisplay(playbackErrorKey);
            playbackErrorModal.classList.add('hidden');
            playbackErrorKey = null;
        });
        document.getElementById('playback-error-delete').addEventListener('click', () => {
            if (!playbackErrorKey) return;
            const key = playbackErrorKey;
            playbackErrorModal.classList.add('hidden');
            playbackErrorKey = null;
            withLoadingShield("Đang xóa...", async () => {
                await deleteSongRecord(key);
                removeKeyFromDisplay(key);
            });
        });

        // ===================== Modal: Sửa thông tin (title/artist/album) =====================
        const songEditModal = document.getElementById('song-edit-modal');
        const songEditTitleInput = document.getElementById('song-edit-title');
        const songEditArtistInput = document.getElementById('song-edit-artist');
        const songEditAlbumInput = document.getElementById('song-edit-album');
        let songEditCurrentKey = null;

        async function openSongEditModal(key) {
            const cached = playlistCache.get(key); if (!cached) return;
            songEditCurrentKey = key;
            songEditTitleInput.value = cached.tag.title || '';
            songEditArtistInput.value = cached.tag.artist || '';
            songEditAlbumInput.value = cached.tag.album || '';
            songEditModal.classList.remove('hidden');
        }

        document.getElementById('song-edit-cancel').addEventListener('click', () => songEditModal.classList.add('hidden'));
        document.getElementById('song-edit-save').addEventListener('click', async () => {
            const key = songEditCurrentKey; if (!key) return;
            const newTag = { title: songEditTitleInput.value.trim() || '(Không tên)', artist: songEditArtistInput.value.trim() || 'Không rõ nghệ sĩ', album: songEditAlbumInput.value.trim() };

            const record = await getSongRecord(key);
            if (!record) { alert("Không đọc được bài hát này, dữ liệu có thể đã lỗi."); songEditModal.classList.add('hidden'); return; }
            record.tag = { ...record.tag, ...newTag };
            await setSongRecord(key, record);

            const cached = playlistCache.get(key);
            if (cached) cached.tag = record.tag;
            songNameIndex.set(key, normalizeSongName(record.tag.title));

            if (key === currentKey) { playerTitle.textContent = record.tag.title; playerArtist.textContent = record.tag.artist; }
            songEditModal.classList.add('hidden');
            if (displaySortMode === 'az' || displaySortMode === 'za') recomputeDisplayOrder();
            renderPlaylistDiff();
        });

        // ===================== Modal: Thông tin chi tiết bài hát =====================
        const songInfoModal = document.getElementById('song-info-modal');
        const songInfoBody = document.getElementById('song-info-body');
        let songInfoCurrentKey = null;

        function openSongInfoModal(key) {
            const cached = playlistCache.get(key); if (!cached) return;
            songInfoCurrentKey = key;
            songInfoBody.innerHTML = `
                <div class="flex justify-between"><span class="text-slate-500">Tên file gốc</span><span class="text-right break-all max-w-[60%]">${cached.filename}</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Nghệ sĩ</span><span>${cached.tag.artist || '—'}</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Album</span><span>${cached.tag.album || '—'}</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Thời lượng</span><span>${formatTime(cached.duration)}</span></div>
            `;
            songInfoModal.classList.remove('hidden');
        }
        document.getElementById('song-info-close').addEventListener('click', () => songInfoModal.classList.add('hidden'));
        document.getElementById('song-info-export').addEventListener('click', () => {
            if (songInfoCurrentKey) exportSongWithTag(songInfoCurrentKey);
            songInfoModal.classList.add('hidden');
        });
