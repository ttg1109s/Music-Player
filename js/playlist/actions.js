/**
 * playlist/actions.js — Hành động trên 1 bài: phát (playSong), xoá, menu 3 chấm, và 3 modal
 * (lỗi lúc phát / sửa thông tin / xem thông tin chi tiết). Thông tin chi tiết v6 có thêm
 * "Số lần nghe" + "Thời gian đã nghe riêng" (xem listen-stats.js — key {count, totalTime}).
 */

        /**
         * Loại 1 key khỏi playlist (xoá tay / "Xóa luôn" / "Giữ lại" lúc phát lỗi). Cập nhật CẢ
         * nguồn chân lý, hàng đợi phát LẪN danh sách hiển thị rồi vẽ lại.
         */
        function removeKeyFromDisplay(key) {
            playlistOrder = playlistOrder.filter(k => k !== key);
            displayOrder = displayOrder.filter(k => k !== key);
            pendingResortKeys.delete(key);
            playlistCache.delete(key); songNameIndex.delete(key);
            updateShuffleArray();
            recomputeRenderOrder();
            renderPlaylistDiff();
            updateEmptyState();
        }

        window.removeSong = function(key) {
            if (key === currentKey) return;
            withLoadingShield("Đang xóa...", async () => {
                await deleteSongRecord(key);
                removeSongStats(key); // dọn luôn thống kê nghe của bài đã xoá
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

                bumpSongPlayCount(key); // +1 số lần nghe ngay khi bắt đầu phát bài mới

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

        // ===================== Modal: Bài hát lỗi lúc phát =====================
        const playbackErrorModal = document.getElementById('playback-error-modal');
        const playbackErrorFilename = document.getElementById('playback-error-filename');
        let playbackErrorKey = null;

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
                removeSongStats(key);
                removeKeyFromDisplay(key);
            });
        });

        // ===================== Modal: Sửa thông tin =====================
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
            // Đổi tên -> ảnh hưởng sort: cập nhật cả hàng đợi phát (nếu az/za) lẫn danh sách hiển thị.
            if (displaySortMode === 'az' || displaySortMode === 'za') recomputeDisplayOrder();
            recomputeRenderOrder();
            renderPlaylistDiff();
        });

        // ===================== Modal: Thông tin chi tiết bài hát =====================
        const songInfoModal = document.getElementById('song-info-modal');
        const songInfoBody = document.getElementById('song-info-body');
        let songInfoCurrentKey = null;

        function openSongInfoModal(key) {
            const cached = playlistCache.get(key); if (!cached) return;
            songInfoCurrentKey = key;
            const stats = getSongStats(key); // { count, totalTime }
            songInfoBody.innerHTML = `
                <div class="flex justify-between"><span class="text-slate-500">Tên file gốc</span><span class="text-right break-all max-w-[60%]">${cached.filename}</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Nghệ sĩ</span><span>${cached.tag.artist || '—'}</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Album</span><span>${cached.tag.album || '—'}</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Thời lượng</span><span>${formatTime(cached.duration)}</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Số lần nghe</span><span>${stats.count} lần</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Thời gian đã nghe</span><span>${formatListenTime(stats.totalTime)}</span></div>
            `;
            songInfoModal.classList.remove('hidden');
        }
        document.getElementById('song-info-close').addEventListener('click', () => songInfoModal.classList.add('hidden'));
        document.getElementById('song-info-export').addEventListener('click', () => {
            if (songInfoCurrentKey) exportSongWithTag(songInfoCurrentKey);
            songInfoModal.classList.add('hidden');
        });
