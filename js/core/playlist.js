/**
 * Quản lý danh sách phát — viết lại hoàn toàn để dùng IndexedDB (xem PLAN_INDEXEDDB.md mục 3).
 *
 * Nguồn sự thật của playlist giờ là:
 *   - `playlistOrder` (mảng key/slug, đồng bộ với meta.playlistOrder trong IndexedDB).
 *   - `playlistCache` (Map key -> {filename, tag, cover, duration}) — bản nhẹ giữ trong RAM để
 *     render danh sách nhanh, KHÔNG chứa `blob` (blob chỉ đọc tại thời điểm playSong, mục 3.2/3.3).
 *   - `brokenKeys` (Set key) — các key có trong playlistOrder nhưng record không đọc được từ
 *     IndexedDB (dữ liệu lỗi) — dùng để hiện icon cảnh báo riêng trong renderPlaylist (mục 3.8).
 *
 * `currentIndex`/`playlist` (mảng File object cũ) đã bị loại bỏ hoàn toàn, thay bằng `currentKey`.
 */
        let playlistOrder = [];
        let playlistCache = new Map();
        let brokenKeys = new Set();
        let currentKey = null;

        function formatTime(seconds) {
            if (isNaN(seconds)) return "0:00";
            const min = Math.floor(seconds / 60); const sec = Math.floor(seconds % 60); return `${min}:${sec < 10 ? '0' : ''}${sec}`;
        }

        /**
         * Đọc duration của 1 file qua thẻ Audio() tạm (event loadedmetadata) — mục 3.1 bước 2.
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

            const failedFiles = []; // tên các file lỗi giữa đường, báo cho người dùng sau khi xong (mục vá lỗi treo im lặng)

            await withLoadingShield(`Đang nạp 1 / ${files.length}...`, async () => {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    loadingText.textContent = `Đang nạp ${i + 1} / ${files.length}...`;

                    try {
                        let tag = { title: file.name.replace(/\.[^/.]+$/, ""), artist: "Không rõ nghệ sĩ", album: "" };
                        let cover = null;

                        // jsmediatags.read không tự bắt lỗi trong onSuccess: nếu picture.data hỏng/định
                        // dạng lạ, việc tạo Blob ở đây có thể throw đồng bộ TRƯỚC khi gọi resolve(), khiến
                        // Promise treo vĩnh viễn và "đứng hình" cả vòng lặp (không bài nào hiện ra danh
                        // sách nữa) — bọc try/catch + timeout an toàn để LUÔN resolve, dù tag lỗi.
                        await new Promise(resolve => {
                            let settled = false;
                            const safeResolve = () => { if (!settled) { settled = true; resolve(); } };
                            // Phòng trường hợp jsmediatags không gọi cả onSuccess/onError (treo im lặng
                            // trên một số file/trình duyệt) — không chờ quá 5s, vẫn nạp bài với tag mặc định.
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
                        // Ghi đè đúng bài cũ: giữ lại phụ đề đã có trước đó (không mất phụ đề khi nạp lại file trùng).
                        if (isOverwrite) {
                            const old = await getSongRecord(key);
                            if (old && old.subtitles) record.subtitles = old.subtitles;
                        }
                        await setSongRecord(key, record);

                        if (!isOverwrite) playlistOrder.push(key);
                        playlistCache.set(key, { filename: record.filename, tag: record.tag, cover: record.cover, duration: record.duration });
                        brokenKeys.delete(key);
                    } catch (err) {
                        // Lỗi IndexedDB (quota/transaction abort trên Safari, v.v.) hoặc bất kỳ lỗi nào khác
                        // ở 1 file: không để nó chặn các file còn lại trong hàng đợi hoặc "nuốt" mất
                        // renderPlaylist() phía dưới — ghi log rõ + nhớ tên file để báo cuối cùng.
                        console.error(`[playlist] Không nạp được "${file.name}":`, err);
                        failedFiles.push(file.name);
                    }

                    if (i % 10 === 0 || i === files.length - 1) { renderPlaylist(); await new Promise(r => setTimeout(r, 10)); }
                }
                await setPlaylistOrder(playlistOrder);
                updateShuffleArray();
            });

            if (failedFiles.length > 0) {
                alert(`Không nạp được ${failedFiles.length} file:\n${failedFiles.join('\n')}\n\nXem Console (F12) để biết chi tiết lỗi.`);
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

        /**
         * Khởi động app (mục 3.2): đọc meta.playlistOrder, nạp tag+cover (KHÔNG nạp blob) cho mỗi
         * key vào playlistCache, render danh sách ban đầu. Gọi 1 lần từ main bootstrap (xem index.html).
         */
        async function initPlaylistFromDB() {
            playlistOrder = await getPlaylistOrder();
            for (const key of playlistOrder) {
                const record = await getSongRecord(key);
                if (!record) { brokenKeys.add(key); continue; }
                playlistCache.set(key, { filename: record.filename, tag: record.tag, cover: record.cover, duration: record.duration });
            }
            updateShuffleArray();
            renderPlaylist();
            if (playlistOrder.length === 0) playlistEmpty.classList.remove('hidden');
        }

        function songActionIconsHtml(key) {
            return `
                <button data-action="info" data-key="${key}" class="p-2 text-slate-400 hover:text-sky-400 transition-colors z-10" title="Thông tin"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                <button data-action="edit" data-key="${key}" class="p-2 text-slate-400 hover:text-emerald-400 transition-colors z-10" title="Sửa thông tin"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                <button data-action="restore" data-key="${key}" class="p-2 text-slate-400 hover:text-amber-400 transition-colors z-10" title="Xuất file (gắn tag mới)"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-8-4V4m0 0L8 8m4-4l4 4" /></svg></button>
                <button data-action="delete" data-key="${key}" class="p-2 text-slate-400 hover:text-rose-500 transition-colors z-10" title="Xóa bài"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>`;
        }

        function renderPlaylist() {
            playlistContainer.innerHTML = '';
            playlistOrder.forEach((key) => {
                const isBroken = brokenKeys.has(key);
                const cached = playlistCache.get(key);
                const title = isBroken ? '(Dữ liệu lỗi)' : cached.tag.title;
                const artist = isBroken ? key : cached.tag.artist;
                const coverUrl = (!isBroken && cached.cover) ? URL.createObjectURL(cached.cover) : DEFAULT_VINYL;

                let isPlaying = (key === currentKey); let isActuallyPlaying = isPlaying && !audioPlayer.paused;
                let warnIconHtml = `<div class="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]" title="Dữ liệu lỗi"></div>`;
                let eqIconHtml = isActuallyPlaying ? `<div class="flex items-end gap-[2px] h-3 w-3"><div class="w-[3px] bg-sky-400 eq-1"></div><div class="w-[3px] bg-sky-400 eq-2"></div><div class="w-[3px] bg-sky-400 eq-3"></div></div>` : (isPlaying ? `<div class="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_5px_rgba(14,165,233,0.8)]"></div>` : (isBroken ? warnIconHtml : ''));
                let actionIconsHtml = songActionIconsHtml(key);
                let itemHtml = '';

                if (isGridView) {
                    itemHtml = `
                        <div data-key="${key}" data-role="play-item" class="flex flex-col cursor-pointer active:scale-[0.98] transition-transform group relative w-full ${isBroken ? 'opacity-60' : ''}">
                            <div class="w-full aspect-square relative mb-2.5">
                                <img src="${coverUrl}" class="w-full h-full rounded-2xl object-cover shadow-lg">
                                ${(isPlaying || isBroken) ? `<div class="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center backdrop-blur-[2px]">${isBroken ? warnIconHtml : eqIconHtml}</div>` : ''}
                                <div class="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">${actionIconsHtml}</div>
                            </div>
                            <h3 class="text-white text-[15px] font-semibold leading-tight line-clamp-1 px-1">${title}</h3>
                            <p class="text-slate-400 text-[13px] font-medium line-clamp-1 px-1 mt-0.5">${artist}</p>
                        </div>`;
                } else {
                    itemHtml = `
                        <div data-key="${key}" data-role="play-item" class="flex items-center gap-4 px-5 py-3 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer w-full group border-b border-white/5 ${isBroken ? 'opacity-60' : ''}">
                            <img src="${coverUrl}" class="w-12 h-12 rounded-lg flex-shrink-0 object-cover shadow-md">
                            <div class="flex-grow flex flex-col justify-center overflow-hidden gap-0.5">
                                <div class="flex items-center gap-2"><h3 class="text-[16px] leading-tight font-semibold truncate ${isPlaying ? 'text-sky-300' : 'text-slate-100'}">${title}</h3>${isPlaying ? eqIconHtml : (isBroken ? warnIconHtml : '')}</div>
                                <p class="text-[13px] text-slate-400 truncate font-medium">${artist}</p>
                            </div>
                            <div class="flex opacity-0 group-hover:opacity-100 transition-opacity">${actionIconsHtml}</div>
                        </div>`;
                }
                playlistContainer.insertAdjacentHTML('beforeend', itemHtml);
            });
            if (currentKey) btnReturnVisual.classList.remove('hidden'); else btnReturnVisual.classList.add('hidden');
        }

        // Click chuột uỷ thác (event delegation) — thay cho onclick inline, đúng yêu cầu data-key.
        playlistContainer.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('button[data-action]');
            if (actionBtn) {
                e.stopPropagation();
                const key = actionBtn.dataset.key; const action = actionBtn.dataset.action;
                if (action === 'delete') window.removeSong(key);
                else if (action === 'info') openSongInfoModal(key);
                else if (action === 'edit') openSongEditModal(key);
                else if (action === 'restore') exportSongWithTag(key);
                return;
            }
            const item = e.target.closest('[data-role="play-item"]');
            if (item) window.playSong(item.dataset.key);
        });

        window.removeSong = function(key) {
            if (key === currentKey) return; // không cho xoá bài đang phát (giữ đúng hành vi cũ)
            withLoadingShield("Đang xóa...", async () => {
                await deleteSongRecord(key);
                playlistOrder = playlistOrder.filter(k => k !== key);
                playlistCache.delete(key); brokenKeys.delete(key);
                await setPlaylistOrder(playlistOrder);
                updateShuffleArray(); renderPlaylist();
                if (playlistOrder.length === 0) playlistEmpty.classList.remove('hidden');
            });
        };

        /**
         * playSong(key) — async hoàn toàn, đọc blob từ IndexedDB tại thời điểm phát (mục 3.3).
         * Bài lỗi dữ liệu: hiện thông báo + "treo" tại bài hợp lệ cuối cùng, KHÔNG đổi currentKey
         * (mục 3.8) — return SỚM trước khi gán currentKey.
         */
        window.playSong = function(key) {
            if (key === currentKey) { switchToVisualizer(); if (audioPlayer.paused) audioPlayer.play(); return; }
            requestWakeLock();

            return withLoadingShield("Đang chuyển bài...", async () => {
                if (currentObjectURL) { URL.revokeObjectURL(currentObjectURL); currentObjectURL = null; }
                if (currentCoverObjectURL) { URL.revokeObjectURL(currentCoverObjectURL); currentCoverObjectURL = null; }
                audioPlayer.pause();

                const record = await getSongRecord(key);
                if (!record) {
                    brokenKeys.add(key); renderPlaylist();
                    alert("Không đọc được bài hát này, dữ liệu có thể đã lỗi.");
                    return;
                }
                brokenKeys.delete(key);

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

                audioPlayer.play(); switchToVisualizer(); renderPlaylist();
                beatTimes = []; fluxHistory = []; currentCalculatedBpm = "---"; statBpm.textContent = "---"; statNote.textContent = "---";
                raindrops = []; ripples = []; glassStaticDrops = []; glassStreaks = []; activeLightnings = []; starFlashes = [];
                setupAudioContext(); updateTypeUI();

                subtitles = record.subtitles ? record.subtitles.slice() : [];
                clearAllActiveSubBlocks(); resetAutoSub(); renderSubList();
            });
        };

        // ===================== Modal: Sửa thông tin (title/artist/album) — mục 3.5 =====================
        const songEditModal = document.getElementById('song-edit-modal');
        const songEditTitleInput = document.getElementById('song-edit-title');
        const songEditArtistInput = document.getElementById('song-edit-artist');
        const songEditAlbumInput = document.getElementById('song-edit-album');
        let songEditCurrentKey = null;

        async function openSongEditModal(key) {
            if (brokenKeys.has(key)) { alert("Không đọc được bài hát này, dữ liệu có thể đã lỗi."); return; }
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

            if (key === currentKey) { playerTitle.textContent = record.tag.title; playerArtist.textContent = record.tag.artist; }
            songEditModal.classList.add('hidden'); renderPlaylist();
        });

        // ===================== Modal: Thông tin chi tiết bài hát =====================
        const songInfoModal = document.getElementById('song-info-modal');
        const songInfoBody = document.getElementById('song-info-body');
        let songInfoCurrentKey = null;

        function openSongInfoModal(key) {
            if (brokenKeys.has(key)) { alert("Không đọc được bài hát này, dữ liệu có thể đã lỗi."); return; }
            const cached = playlistCache.get(key); if (!cached) return;
            songInfoCurrentKey = key;
            const sizeMb = cached.blobSize ? (cached.blobSize / (1024*1024)).toFixed(1) : null;
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
