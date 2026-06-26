/**
 * playlist/actions.js — Hành động trên 1 bài: phát (playSong), xoá, menu 3 chấm, và 3 modal
 * (lỗi lúc phát / sửa thông tin / xem thông tin chi tiết). Thông tin chi tiết v6 có thêm
 * "Số lần nghe" + "Thời gian đã nghe riêng" (xem listen-stats.js — key {count, totalTime}).
 *
 * Ver 8: modal "Sửa thông tin" có thêm tab "Ảnh bìa" (upload/xem trước/xóa cover) cạnh tab
 * "Thông tin" cũ. Ảnh chỉ được ÁP DỤNG THẬT (ghi vào record.cover trong IndexedDB) khi bấm
 * "Lưu" — chọn ảnh hay bấm "Xóa ảnh bìa" chỉ cập nhật preview + biến tạm songEditPendingCover,
 * "Hủy" sẽ bỏ hoàn toàn pending đó. Cover sau khi lưu tự động được ghi vào tag APIC lúc Xuất
 * tệp (xem id3-export.js, không cần sửa gì thêm ở đó).
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
            withLoadingShield(t('common.loading.deleting'), async () => {
                await deleteSongRecord(key);
                removeSongStats(key); // dọn luôn thống kê nghe của bài đã xoá
                removeKeyFromDisplay(key);
            });
        };

        window.playSong = function(key) {
            if (key === currentKey) { switchToVisualizer(); if (audioPlayer.paused) audioPlayer.play(); return; }
            requestWakeLock();

            // display=false: chuyển bài chạy logic trong shield (khoá chồng lệnh) nhưng KHÔNG hiện
            // lớp che -> bỏ cú nháy đen bg-black/80 mỗi lần Next/Prev (rõ nhất khi có video nền).
            //
            // FIX (log 9->10): trước đây withLoadingShield() KHÔNG có .catch() ở đây, và mọi nơi
            // gọi window.playSong(...) (playPauseBtn, playNext/playPrev, click bài trong list) đều
            // gọi fire-and-forget (không await, không .catch()). Nếu thân hàm bên dưới throw — ví
            // dụ await getSongRecord(key) reject vì connection IndexedDB đã chết (xem giải thích
            // đầy đủ ở db.js, đã sửa thêm cơ chế tự mở lại connection + retry 1 lần ở đó) — lỗi đó
            // dừng hàm NGAY TẠI ĐÓ, audioPlayer.src/audioPlayer.play() ở các dòng sau KHÔNG BAO GIỜ
            // chạy tới (im lặng hoàn toàn, không alert, không crash gì khác — đúng kiểu "vẫn
            // next/prev được vì chỉ tính index trong RAM, nhưng không có tiếng vì không lấy được
            // blob thật từ IndexedDB"), rồi thoát ra ngoài dưới dạng unhandled promise rejection.
            // Sau khi db.js đã tự retry, trường hợp này hiếm xảy ra hơn nhiều, nhưng vẫn cần lớp
            // bảo vệ cuối: nếu thật sự thất bại (retry cũng lỗi, hoặc lỗi khác hẳn), alert() đúng
            // nguyên văn lỗi thay vì im lặng — cùng tinh thần đã áp dụng cho luồng upload.
            return withLoadingShield(t('common.loading.switchingSong'), async () => {
                if (currentObjectURL) { URL.revokeObjectURL(currentObjectURL); currentObjectURL = null; }
                if (currentCoverObjectURL) { URL.revokeObjectURL(currentCoverObjectURL); currentCoverObjectURL = null; }
                audioPlayer.pause();
                const previousKey = currentKey;

                const record = await getSongRecord(key);
                if (!record) {
                    removeKeyFromDisplay(key);
                    alert(t('common.playSong.notFound'));
                    return;
                }

                currentKey = key;
                currentCoverObjectURL = record.cover ? URL.createObjectURL(record.cover) : DEFAULT_VINYL;
                currentObjectURL = URL.createObjectURL(record.blob);
                audioPlayer.src = currentObjectURL;

                playerTitle.textContent = record.tag.title; playerArtist.textContent = record.tag.artist;
                recordContainer.innerHTML = `<img id="record-art" src="${currentCoverObjectURL}" class="w-full h-full rounded-full object-cover shadow-lg relative z-20 ${audioPlayer.paused ? 'paused' : 'animate-spin-slow'}" alt="Record"><div class="absolute inset-0 m-auto w-3 h-3 bg-slate-900 rounded-full border border-slate-700 z-30"></div>`;
                // Ver 8 refine (mục 4): cover Blob có thể không decode được làm ảnh thật (ID3 cover
                // lỗi/cắt cụt, jsmediatags đọc nhầm định dạng...) -> <img> "vỡ" thay vì hiện vinyl
                // mặc định. attachCoverFallback() (định nghĩa ở render.js) gắn onerror tự fallback
                // về DEFAULT_VINYL — tái dùng đúng 1 hàm cho mọi nơi hiển thị cover trong app.
                attachCoverFallback(document.getElementById('record-art'));

                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: record.tag.title || "Visual Master",
                        artist: record.tag.artist || "Unknown Artist",
                        // Ver 8 refine (mục 4): dùng ĐÚNG record.cover.type thật (đã được validate
                        // ở loader.js, đảm bảo là MIME ảnh hợp lệ) thay cho hard-code 'image/jpeg'
                        // trước đây — khai báo sai MIME (ví dụ cover thật là PNG nhưng báo JPEG) có
                        // thể khiến hệ điều hành/màn hình khóa từ chối hiển thị artwork dù dữ liệu
                        // ảnh hoàn toàn hợp lệ. Fallback 'image/jpeg' chỉ dùng khi vì lý do nào đó
                        // record.cover.type rỗng (hiếm, nhưng Blob.type có thể rỗng trên 1 số trình
                        // duyệt cũ dù nội dung vẫn đúng).
                        artwork: record.cover ? [{ src: currentCoverObjectURL, sizes: '512x512', type: record.cover.type || 'image/jpeg' }] : []
                    });
                }

                bumpSongPlayCount(key); // +1 số lần nghe ngay khi bắt đầu phát bài mới

                audioPlayer.play(); switchToVisualizer();
                if (previousKey) refreshSongNode(previousKey);
                refreshSongNode(key);
                if (!domNodesByKey.has(key)) renderPlaylistDiff();
                if (currentKey) btnReturnVisual.classList.remove('hidden');
                beatTimes = []; fluxHistory = []; currentCalculatedBpm = "---"; statBpm.textContent = "---"; statNote.textContent = "---";
                // Reset trạng thái pitch worker — tránh hiện sót nốt nhạc của bài VỪA đổi trong vài
                // chục ms đầu (worker là bất đồng bộ, kết quả cũ có thể vẫn đang "bay" lúc đổi bài).
                latestPitchFrequency = -1; window.lastValidNoteStr = null; window.lastValidNoteTime = 0; window.lastValidMidiNote = null;
                rubikPitchHistory = []; rubikPitchAvg = 0;
                raindrops = []; ripples = []; glassStaticDrops = []; glassStreaks = []; activeLightnings = []; starFlashes = [];
                setupAudioContext(); updateTypeUI();

                subtitles = record.subtitles ? record.subtitles.slice() : [];
                clearAllActiveSubBlocks(); resetAutoSub(); renderSubList();
            }, false).catch(err => {
                console.error(`[playlist] playSong("${key}") lỗi không xác định, nhạc có thể không phát ra tiếng được:`, err);
                alert(tFormat('common.playSong.error', { message: `${err && err.name ? err.name + ': ' : ''}${err && err.message ? err.message : String(err)}` }));
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
            withLoadingShield(t('common.loading.deleting'), async () => {
                await deleteSongRecord(key);
                removeSongStats(key);
                removeKeyFromDisplay(key);
            });
        });

        // ===================== Modal: Sửa thông tin (Thông tin + Ảnh bìa) =====================
        const songEditModal = document.getElementById('song-edit-modal');
        const songEditTitleInput = document.getElementById('song-edit-title');
        const songEditArtistInput = document.getElementById('song-edit-artist');
        const songEditAlbumInput = document.getElementById('song-edit-album');
        const songEditCoverPreview = document.getElementById('song-edit-cover-preview');
        const songEditCoverUploadInput = document.getElementById('song-edit-cover-upload');
        const songEditCoverRemoveBtn = document.getElementById('song-edit-cover-remove');
        const songEditTabButtons = document.querySelectorAll('.song-edit-tab-btn');
        const songEditTabInfo = document.getElementById('song-edit-tab-info');
        const songEditTabCover = document.getElementById('song-edit-tab-cover');
        let songEditCurrentKey = null;
        // Ảnh bìa được áp dụng NGAY khi bấm "Lưu" (cùng 1 lượt ghi IndexedDB với title/artist/
        // album), KHÔNG ghi DB ngay lúc chọn file — để nút "Hủy" hoàn toàn không đổi gì, giống
        // hành vi 2 ô nhập text bên cạnh. 3 trạng thái: null (không đổi gì) | File (đặt ảnh mới)
        // | 'remove' (xóa ảnh, dùng lại DEFAULT_VINYL).
        let songEditPendingCover = null;
        // object: { url: string } object URL tạm để preview ảnh MỚI chọn — phải revoke khi đóng
        // modal hoặc chọn ảnh khác, tránh rò bộ nhớ (cùng nguyên tắc currentCoverObjectURL ở actions.js).
        let songEditPendingCoverPreviewUrl = null;
        // Ver 8 refine (mục 4): songEditCoverPreview là <img> CỐ ĐỊNH trong DOM (không bị tạo lại
        // qua innerHTML như #record-art) -> chỉ cần gắn onerror fallback 1 LẦN ở đây, không cần
        // gắn lại mỗi lần setSongEditCoverPreview() đổi src.
        attachCoverFallback(songEditCoverPreview);

        function setSongEditCoverPreview(url) {
            songEditCoverPreview.src = url || DEFAULT_VINYL;
        }

        function revokeSongEditPendingPreview() {
            if (songEditPendingCoverPreviewUrl) { URL.revokeObjectURL(songEditPendingCoverPreviewUrl); songEditPendingCoverPreviewUrl = null; }
        }

        function setSongEditTab(tab) {
            const isCover = tab === 'cover';
            songEditTabInfo.classList.toggle('hidden', isCover);
            songEditTabCover.classList.toggle('hidden', !isCover);
            songEditTabCover.classList.toggle('flex', isCover);
            songEditTabButtons.forEach(btn => {
                const active = btn.dataset.editTab === tab;
                // Pill style (ver 8 refine): tab active nổi lên nền sáng + chữ trắng + shadow nhẹ;
                // tab inactive chỉ còn chữ mờ, không nền/viền riêng (rãnh nền tối bao quanh đã đủ
                // tạo ngữ cảnh "đây là switcher", không cần viền màu trên từng nút như bản trước).
                btn.classList.toggle('bg-white/10', active);
                btn.classList.toggle('text-white', active);
                btn.classList.toggle('shadow', active);
                btn.classList.toggle('text-slate-400', !active);
            });
        }
        songEditTabButtons.forEach(btn => btn.addEventListener('click', () => setSongEditTab(btn.dataset.editTab)));

        async function openSongEditModal(key) {
            const cached = playlistCache.get(key); if (!cached) return;
            songEditCurrentKey = key;
            songEditTitleInput.value = cached.tag.title || '';
            songEditArtistInput.value = cached.tag.artist || '';
            songEditAlbumInput.value = cached.tag.album || '';

            revokeSongEditPendingPreview();
            songEditPendingCover = null;
            setSongEditCoverPreview(cached.cover ? URL.createObjectURL(cached.cover) : DEFAULT_VINYL);
            // Object URL trên chỉ sống trong lúc modal mở (preview ảnh HIỆN TẠI, không phải pending);
            // gán vào songEditPendingCoverPreviewUrl để được revoke đồng bộ lúc đóng modal/đổi ảnh.
            if (cached.cover) songEditPendingCoverPreviewUrl = songEditCoverPreview.src;

            setSongEditTab('info');
            songEditModal.classList.remove('hidden');
        }

        function closeSongEditModal() {
            revokeSongEditPendingPreview();
            songEditPendingCover = null;
            songEditCoverUploadInput.value = '';
            songEditModal.classList.add('hidden');
        }

        songEditCoverUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            e.target.value = '';
            const check = validateImageFile(file);
            if (!check.valid) { alert(check.reason); return; }
            revokeSongEditPendingPreview();
            songEditPendingCover = file;
            songEditPendingCoverPreviewUrl = URL.createObjectURL(file);
            setSongEditCoverPreview(songEditPendingCoverPreviewUrl);
        });

        songEditCoverRemoveBtn.addEventListener('click', () => {
            revokeSongEditPendingPreview();
            songEditPendingCover = 'remove';
            setSongEditCoverPreview(DEFAULT_VINYL);
        });

        document.getElementById('song-edit-cancel').addEventListener('click', closeSongEditModal);
        document.getElementById('song-edit-save').addEventListener('click', async () => {
            const key = songEditCurrentKey; if (!key) return;
            const newTag = { title: songEditTitleInput.value.trim() || t('common.songEdit.defaultTitle'), artist: songEditArtistInput.value.trim() || t('common.songEdit.defaultArtist'), album: songEditAlbumInput.value.trim() };
            const pendingCover = songEditPendingCover; // chụp lại trước khi closeSongEditModal() reset về null

            await withLoadingShield(t('common.loading.savingInfo'), async () => {
                const record = await getSongRecord(key);
                if (!record) { alert(t('common.songEdit.notFound')); return; }
                record.tag = { ...record.tag, ...newTag };
                // Ảnh bìa: File mới -> ghi thẳng Blob (File là 1 dạng Blob, lưu IndexedDB được luôn,
                // giống cách record.cover đã được ghi từ jsmediatags lúc nạp file ban đầu). 'remove'
                // -> xóa hẳn field cover (record không còn cover -> các nơi đọc cover tự fallback
                // DEFAULT_VINYL, đúng hành vi cũ khi 1 bài chưa từng có cover).
                if (pendingCover instanceof File) record.cover = pendingCover;
                else if (pendingCover === 'remove') delete record.cover;
                await setSongRecord(key, record);

                const cached = playlistCache.get(key);
                if (cached) { cached.tag = record.tag; cached.cover = record.cover || null; }
                songNameIndex.set(key, normalizeSongName(record.tag.title));

                if (key === currentKey) {
                    playerTitle.textContent = record.tag.title; playerArtist.textContent = record.tag.artist;
                    if (currentCoverObjectURL && currentCoverObjectURL.startsWith('blob:')) URL.revokeObjectURL(currentCoverObjectURL);
                    currentCoverObjectURL = record.cover ? URL.createObjectURL(record.cover) : DEFAULT_VINYL;
                    const recordArtEl = document.getElementById('record-art');
                    if (recordArtEl) {
                        recordArtEl.src = currentCoverObjectURL;
                        // Gắn lại fallback mỗi khi đổi src (ver 8 refine, mục 4) — listener cũ tự
                        // gỡ sau 1 lần lỗi (xem attachCoverFallback ở render.js), nên ảnh MỚI vừa
                        // đổi sang cần listener mới của riêng nó để vẫn được bảo vệ.
                        attachCoverFallback(recordArtEl);
                    }
                    if ('mediaSession' in navigator) {
                        navigator.mediaSession.metadata = new MediaMetadata({
                            title: record.tag.title || "Visual Master",
                            artist: record.tag.artist || "Unknown Artist",
                            // Ver 8 refine (mục 4): dùng đúng record.cover.type thật, xem comment
                            // tương tự ở playSong() phía trên.
                            artwork: record.cover ? [{ src: currentCoverObjectURL, sizes: '512x512', type: record.cover.type || 'image/jpeg' }] : []
                        });
                    }
                }
            });

            closeSongEditModal();
            refreshSongNode(key); // vẽ lại ảnh/tên mới ngay trong danh sách (ảnh cũ trong DOM không tự đổi)
            // Đổi tên -> ảnh hưởng sort: cập nhật cả hàng đợi phát (nếu az/za) lẫn danh sách hiển thị.
            if (displaySortMode === 'az' || displaySortMode === 'za') recomputeDisplayOrder();
            recomputeRenderOrder();
            renderPlaylistDiff();
        });

        // ===================== Modal: Thông tin chi tiết bài hát =====================
        const songInfoModal = document.getElementById('song-info-modal');
        const songInfoBody = document.getElementById('song-info-body');
        let songInfoCurrentKey = null;

        /**
         * Dựng 1 dòng thông tin dạng "card" nhỏ (icon tròn màu + label + giá trị) — thay cho
         * <div class="flex justify-between"> trần trước đây, để 6 dòng dữ liệu dễ quét mắt hơn,
         * đồng bộ phong cách icon-tròn-màu đã dùng ở header 2 modal (Sửa thông tin/Thông tin).
         */
        function songInfoRowHtml(iconPath, accentClass, label, value) {
            return `
                <div class="flex items-center gap-3 bg-black/25 border border-white/5 rounded-xl px-3 py-2.5">
                    <div class="w-7 h-7 rounded-full ${accentClass} flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}" /></svg>
                    </div>
                    <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wide shrink-0 w-[88px]">${label}</span>
                    <span class="text-sm text-white text-right flex-1 break-all">${value}</span>
                </div>`;
        }

        function openSongInfoModal(key) {
            const cached = playlistCache.get(key); if (!cached) return;
            songInfoCurrentKey = key;
            const stats = getSongStats(key); // { count, totalTime }
            const emptyVal = t('playlistView.songInfo.empty');
            songInfoBody.innerHTML =
                songInfoRowHtml('M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM3 9a9 9 0 0118 0', 'bg-sky-500/15 text-sky-400', t('playlistView.songInfo.fieldTitle'), cached.tag.title || emptyVal) +
                songInfoRowHtml('M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', 'bg-violet-500/15 text-violet-400', t('playlistView.songInfo.fieldArtist'), cached.tag.artist || emptyVal) +
                songInfoRowHtml('M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM3 9a9 9 0 0118 0', 'bg-emerald-500/15 text-emerald-400', t('playlistView.songInfo.fieldAlbum'), cached.tag.album || emptyVal) +
                songInfoRowHtml('M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', 'bg-amber-500/15 text-amber-400', t('playlistView.songInfo.fieldDuration'), formatTime(cached.duration)) +
                songInfoRowHtml('M9 19V6l12-3v13M5 21a2 2 0 100-4 2 2 0 000 4zm12-2a2 2 0 100-4 2 2 0 000 4z', 'bg-rose-500/15 text-rose-400', t('playlistView.songInfo.fieldPlayCount'), tFormat('playlistView.songInfo.fieldPlayCountValue', { n: stats.count })) +
                songInfoRowHtml('M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', 'bg-indigo-500/15 text-indigo-400', t('playlistView.songInfo.fieldListened'), formatListenTime(stats.totalTime));
            songInfoModal.classList.remove('hidden');
        }
        document.getElementById('song-info-close').addEventListener('click', () => songInfoModal.classList.add('hidden'));
        document.getElementById('song-info-export').addEventListener('click', () => {
            if (songInfoCurrentKey) exportSongWithTag(songInfoCurrentKey);
            songInfoModal.classList.add('hidden');
        });
