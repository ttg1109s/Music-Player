/**
 * Điều khiển phát nhạc: next/prev, chuyển sang màn hình visualizer, nút play/pause/shuffle/repeat, Media Session API, thanh tiến trình, cập nhật UI loại hiệu ứng & màu sắc, áp EQ preset.
 * (Trích từ file gốc, dòng 802-972 trong khối <script>)
 */
        /**
         * Next/Prev khi KHÔNG shuffle giờ dùng `displayOrder` (thứ tự ĐANG HIỂN THỊ theo sort mode
         * — mục 3 trong playlist.js) làm thứ tự phát, thay cho `playlistOrder` gốc (thứ tự thêm
         * vào) như trước — đúng yêu cầu "thứ tự phát = thứ tự hiển thị" khi không trộn bài.
         *
         * "Chạm biên" (Next từ bài cuối quay về đầu, hoặc Prev từ bài đầu quay về cuối) là điểm áp
         * lại sort thật cho các bài mới thêm vào lúc đang nghe (`pendingResortKeys`, xem
         * applyNewSongsToDisplayOrder trong playlist.js) — chỉ áp dụng khi KHÔNG shuffle, vì khi
         * shuffle thì shuffleIndices đã là nguồn phát riêng, không liên quan displayOrder.
         */
        /**
         * Fix (ver 8 refine): trước đây requestWakeLock() chỉ được gọi RIÊNG ở từng nơi BẤM nút
         * (click Next/Prev) — Media Session ('previoustrack'/'nexttrack', điều khiển từ màn hình
         * khoá/tai nghe) và auto-next khi hết bài ('ended') KHÔNG xin lại wake lock, nên màn hình
         * vẫn có thể tự tắt sau khi chuyển bài bằng những đường đó dù "Giữ màn hình sáng" đang bật.
         * Đưa requestWakeLock() vào ĐẦU playNext()/playPrev() — chạy NGAY khi hàm được gọi, trước
         * mọi điều kiện khác — để MỌI lối gọi (click, mediaSession, ended, và bất kỳ chỗ nào sau
         * này gọi 2 hàm này) đều tự động xin lại, không cần nhớ gọi requestWakeLock() riêng ở từng
         * nơi nữa. requestWakeLock() tự kiểm tra vizConfig.keepScreenOn nội bộ (xem wakelock.js) nên
         * gọi vô điều kiện ở đây không vi phạm tùy chọn "Giữ màn hình sáng" đang tắt.
         */
        function playNext(force = false) {
            requestWakeLock();
            if (playlistOrder.length === 0) return;
            if (!force && repeatMode === 2) { audioPlayer.currentTime = 0; audioPlayer.play(); return; }
            let nextKey;
            if (isShuffle) {
                let currentPos = shuffleIndices.indexOf(currentKey);
                if (currentPos === -1 || currentPos === playlistOrder.length - 1) { if (repeatMode === 1 || force) nextKey = shuffleIndices[0]; else { audioPlayer.pause(); return; } }
                else nextKey = shuffleIndices[currentPos + 1];
            } else {
                let currentPos = displayOrder.indexOf(currentKey);
                const isWrappingToStart = (currentPos === displayOrder.length - 1);
                if (isWrappingToStart) {
                    if (repeatMode === 1 || force) {
                        if (pendingResortKeys.size > 0) recomputeDisplayOrder(); // chạm biên: áp lại sort thật cho bài mới thêm giữa lúc nghe
                        nextKey = displayOrder[0];
                    } else { audioPlayer.pause(); return; }
                } else nextKey = displayOrder[currentPos + 1];
            }
            window.playSong(nextKey);
        }

        function playPrev() {
            requestWakeLock();
            if (playlistOrder.length === 0) return;
            if (audioPlayer.currentTime > 3) { audioPlayer.currentTime = 0; return; }
            let prevKey;
            if (isShuffle) {
                let currentPos = shuffleIndices.indexOf(currentKey); prevKey = (currentPos <= 0) ? shuffleIndices[playlistOrder.length - 1] : shuffleIndices[currentPos - 1];
            } else {
                let currentPos = displayOrder.indexOf(currentKey);
                const isWrappingToEnd = (currentPos <= 0);
                if (isWrappingToEnd) {
                    if (pendingResortKeys.size > 0) recomputeDisplayOrder(); // chạm biên: áp lại sort thật
                    prevKey = displayOrder[displayOrder.length - 1];
                } else prevKey = displayOrder[currentPos - 1];
            }
            window.playSong(prevKey);
        }

        /**
         * Ver 8 refine (mục 2): dừng hẳn phát nhạc + đưa player về ĐÚNG trạng thái đầu (như chưa
         * từng chọn bài nào) — dùng khi tab/app bị ẩn (xem wakelock.js), THAY HẲN cho hành vi cũ
         * "pause tạm, giữ nguyên bài đang chọn, không tự resume". Khác removeKeyFromDisplay() (xoá
         * 1 bài khỏi playlist): hàm này KHÔNG đụng tới playlistOrder/displayOrder/IndexedDB, chỉ
         * dừng playback + reset UI player + giải phóng currentKey, playlist vẫn còn nguyên y hệt.
         *
         * FIX (log 7->8, mục "chuyển tab/ẩn trình duyệt trên iOS"): bản trước có 3 lỗi liên quan
         * lẫn nhau, đều bắt nguồn từ việc CHỈ trông cậy vào sự kiện 'visibilitychange' (xem
         * wakelock.js) — sự kiện này được WebKit/Safari trên iOS xác nhận là KHÔNG đáng tin cậy khi
         * chuyển app/khoá màn hình (có thể bắn trễ, bắn không đầy đủ, hoặc không bắn — trình duyệt
         * có thể đã ngưng chạy JS đúng lúc đó). Khi điều đó xảy ra, hàm này có thể chỉ chạy được MỘT
         * PHẦN hoặc chạy NHIỀU LẦN chồng nhau (gọi từ cả 'visibilitychange' VÀ 'pagehide' làm tín
         * hiệu dự phòng — xem wakelock.js), gây ra:
         *   (a) "Thanh tiến trình không bị reset": nếu hàm không chạy/chạy nửa chừng,
         *       audioPlayer.pause() có thể chưa kịp thực thi -> audio vẫn phát ở dưới (iOS cho phép
         *       <audio> tiếp tục phát khi tab ẩn), 'timeupdate' vẫn bắn liên tục -> thanh tiến trình
         *       (và biến isSeeking=false) tiếp tục nhảy theo currentTime thật, trông như "không bị
         *       reset" dù logic reset có gọi.
         *   (b) "Không tự chuyển UI Playlist": bản trước CHỈ reset dữ liệu (currentKey, text, ảnh...)
         *       mà KHÔNG đụng tới class hiển thị của #playlist-view/#visualizer-ui — nếu người dùng
         *       đang ở màn Visualizer lúc bị ẩn, quay lại vẫn thấy màn Visualizer (trống, không có
         *       gì để xem) thay vì được đưa về Playlist — đúng tinh thần "như chưa chọn bài nào,
         *       app nên hiện đúng màn ban đầu (Playlist)".
         *   (c) "Nút phát không chuyển/nhạc không phát/BPM-Pitch-Energy không hoạt động khi bấm lại":
         *       nếu hàm reset bị NGẮT GIỮA CHỪNG bởi việc trang bị treo (browser suspend JS), hoặc
         *       nếu MỘT LƯỢT playSong() trước đó (chạy trong withLoadingShield, xem actions.js) đang
         *       "bay" đúng lúc tab bị ẩn và promise của nó không bao giờ settle lại được, biến khoá
         *       isShieldBusy (loading-shield-util.js) có thể bị "kẹt" mãi ở true. Mọi lượt
         *       playSong()/withLoadingShield() gọi SAU đó (kể cả lúc người dùng bấm lại Play) sẽ bị
         *       chặn IM LẶNG ngay dòng đầu (`if (isShieldBusy) return;`) — nút Play không đổi icon,
         *       không có gì phát, các thống kê (BPM/Pitch/Energy) không cập nhật vì playSong() chưa
         *       từng thực sự chạy lại — ĐÚNG triệu chứng quan sát được, dù thumb thanh trượt vẫn nhảy
         *       (xem (a) — đó là audio CŨ vẫn đang phát ở dưới, không liên quan tới lượt playSong()
         *       mới bị chặn).
         *
         * Giải pháp — 3 phần, áp dụng NGAY ĐẦU hàm trước khi làm bất cứ gì khác:
         *   1. Cờ `_resetPlayerToIdleInProgress` chặn việc hàm tự gọi chồng lên chính nó (do cả
         *      'visibilitychange' VÀ 'pagehide' có thể cùng kích hoạt nó) — KHÔNG chặn việc gọi
         *      hàm nhiều lần liên tiếp (mỗi lần đều phải làm xong việc của nó), chỉ chặn đè lên nhau
         *      trong cùng 1 lượt xử lý đồng bộ.
         *   2. Giải phóng cứng `isShieldBusy = false` — đảm bảo dù lượt playSong()/loadingShield
         *      nào đó có bị "treo" do trang bị OS suspend, lần phát lại sau khi quay lại tab LUÔN
         *      được phép chạy, không bị khoá im lặng vĩnh viễn. An toàn vì resetPlayerToIdle() chỉ
         *      chạy khi tab vừa ẨN/quay lại — không có tác vụ shield nào còn "hợp lệ" để bảo vệ vào
         *      đúng thời điểm này (nhạc đã được lệnh dừng).
         *   3. Đưa luôn UI về màn Playlist (gọi đúng chuỗi class đã dùng ở nút "Quay lại" sẵn có –
         *      btnBackPlaylist – để nhất quán 100% hiệu ứng) + closeControlCenter() phòng panel đó
         *      còn mở sót.
         */
        let _resetPlayerToIdleInProgress = false;
        function resetPlayerToIdle() {
            if (_resetPlayerToIdleInProgress) return; // chặn gọi chồng (vd. 'visibilitychange' + 'pagehide' cùng bắn)
            _resetPlayerToIdleInProgress = true;
            try {
                // (2) Giải phóng cứng — không để 1 lượt withLoadingShield() bị OS treo giữa chừng
                // (lúc tab vừa ẩn) khoá im lặng MỌI lượt playSong() sau khi người dùng quay lại tab.
                isShieldBusy = false;
                if (typeof loadingShield !== 'undefined' && loadingShield) {
                    loadingShield.classList.remove('opacity-100', 'pointer-events-auto');
                    loadingShield.classList.add('opacity-0', 'pointer-events-none');
                }

                audioPlayer.pause();
                audioPlayer.currentTime = 0;
                if (currentObjectURL) { URL.revokeObjectURL(currentObjectURL); currentObjectURL = null; }
                if (currentCoverObjectURL) { URL.revokeObjectURL(currentCoverObjectURL); currentCoverObjectURL = null; }
                audioPlayer.removeAttribute('src'); audioPlayer.src = '';
                const previousKey = currentKey;
                currentKey = null;
                // Reset UI player về ĐÚNG trạng thái ban đầu — xem bottom-player.js (TPL_BOTTOM_PLAYER)
                // để biết giá trị gốc lúc chưa chọn bài nào.
                playerTitle.textContent = 'Chưa chọn bài'; playerArtist.textContent = '---';
                recordContainer.innerHTML = `<img id="record-art" src="" class="w-full h-full rounded-full object-cover shadow-lg relative z-20" alt="Record"><div class="absolute inset-0 m-auto w-3 h-3 bg-slate-900 rounded-full border border-slate-700 z-30"></div>`;
                progressBar.value = 0;
                currentTimeDisplay.textContent = '0:00'; durationTimeDisplay.textContent = '0:00';
                if ('mediaSession' in navigator) { navigator.mediaSession.metadata = null; navigator.mediaSession.playbackState = 'none'; }
                btnReturnVisual.classList.add('hidden');
                if (previousKey) refreshSongNode(previousKey); // bỏ trạng thái "đang phát" (chấm xanh/EQ icon) khỏi bài vừa dừng trong danh sách

                // (3) Đưa UI về màn Playlist — cùng chuỗi hiệu ứng/đóng panel với nút "Quay lại"
                // (btnBackPlaylist) để nhất quán, tránh người dùng quay lại tab vẫn thấy màn
                // Visualizer trống không còn gì đang phát.
                visualizerUI.classList.remove('fade-enter-active');
                canvas.classList.add('opacity-0');
                const webglCanvasEl = document.getElementById('webgl-canvas');
                if (webglCanvasEl) webglCanvasEl.classList.add('opacity-0');
                playlistView.classList.remove('-translate-y-full');
                if (typeof closeControlCenter === 'function') closeControlCenter(); // phòng panel còn mở sót
                setTimeout(() => { visualizerUI.classList.add('hidden'); playerContainer.classList.add('hidden'); renderPlaylistDiff(); }, 300);
            } finally {
                _resetPlayerToIdleInProgress = false;
            }
        }

        function switchToVisualizer() {
            playlistView.classList.add('-translate-y-full'); visualizerUI.classList.remove('hidden'); playerContainer.classList.remove('hidden');
            // KHÔNG gọi handleVideoBackground() ở đây nữa: chuyển màn hình KHÔNG được điều khiển video
            // (video chỉ bám theo trạng thái nhạc). Playlist đè z-[60] tự che video khi cần.
            setTimeout(() => { 
                visualizerUI.classList.add('fade-enter-active'); canvas.classList.remove('opacity-0'); 
                if (vizConfig.type === 'vortex') document.getElementById('webgl-canvas').classList.remove('opacity-0');
            }, 50);
        }

        btnBackPlaylist.addEventListener('click', () => {
            visualizerUI.classList.remove('fade-enter-active'); canvas.classList.add('opacity-0'); document.getElementById('webgl-canvas').classList.add('opacity-0');
            playlistView.classList.remove('-translate-y-full');
            closeControlCenter(); // tránh trạng thái panel còn mở sót khi quay lại Visualizer lần sau
            // KHÔNG dừng/ẩn video ở đây nữa: Playlist (z-[60]) tự che video, video vẫn chạy theo nhạc.
            setTimeout(() => { visualizerUI.classList.add('hidden'); playerContainer.classList.add('hidden'); renderPlaylistDiff(); }, 300);
        });

        playPauseBtn.addEventListener('click', () => {
            requestWakeLock(); if (playlistOrder.length === 0) return;
            if (currentKey === null) { window.playSong(displayOrder[0] || playlistOrder[0]); return; }
            // FIX (log 9->10): 'interrupted' là trạng thái RIÊNG của iOS Safari khi audio bị hệ điều
            // hành "ngắt" lúc tab/app bị ẩn (khác 'suspended' — xem giải thích đầy đủ ở
            // setupAudioContext(), audio-engine.js). Thiếu check này thì audioContext.resume() không
            // được gọi, dù audioPlayer.play() có chạy thì vẫn không nghe được tiếng gì.
            if (audioPlayer.paused) { audioPlayer.play(); if (audioContext && (audioContext.state === 'suspended' || audioContext.state === 'interrupted')) audioContext.resume(); } else { audioPlayer.pause(); }
        });

        btnNext.addEventListener('click', () => playNext(true)); btnPrev.addEventListener('click', () => playPrev());
        btnShuffle.addEventListener('click', () => { isShuffle = !isShuffle; btnShuffle.classList.toggle('!text-sky-400', isShuffle); btnShuffle.classList.toggle('text-slate-400', !isShuffle); updateShuffleArray(); });
        btnRepeat.addEventListener('click', () => {
            repeatMode = (repeatMode + 1) % 3;
            if (repeatMode === 0) { btnRepeat.classList.remove('!text-sky-400'); btnRepeat.classList.add('text-slate-400'); repeatBadge.classList.add('hidden'); } 
            else if (repeatMode === 1) { btnRepeat.classList.remove('text-slate-400'); btnRepeat.classList.add('!text-sky-400'); repeatBadge.classList.add('hidden'); } 
            else if (repeatMode === 2) { btnRepeat.classList.add('!text-sky-400'); repeatBadge.classList.remove('hidden'); }
        });

        // Ver 8 refine (mục 2 — loại bỏ can thiệp điều khiển từ ngoài app): KHÔNG còn
        // navigator.mediaSession.setActionHandler(...) nào nữa — play/pause/next/prev/seek từ màn
        // hình khoá, tai nghe, hoặc nút điều khiển trên thông báo hệ thống SẼ KHÔNG còn tác dụng.
        // navigator.mediaSession.metadata (tên bài/ảnh hiển thị trên thông báo, xem playlist/
        // actions.js) và .playbackState (trạng thái playing/paused hiển thị) VẪN GIỮ — đây chỉ là
        // thông tin hiển thị một chiều, không phải đường điều khiển ngược lại vào app.

        function updateMediaPositionState() {
            if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
                if (isFinite(audioPlayer.duration) && isFinite(audioPlayer.currentTime) && isFinite(audioPlayer.playbackRate)) {
                    try { navigator.mediaSession.setPositionState({ duration: audioPlayer.duration, playbackRate: audioPlayer.playbackRate, position: audioPlayer.currentTime }); } catch(e) {}
                }
            }
        }

        // ===== Bộ đếm THỜI GIAN NGHE THẬT — đồng hồ thực, ĐỘC LẬP với thanh tiến trình =====
        // Trước đây thời lượng nghe được suy ra từ delta của audioPlayer.currentTime (vị trí thanh
        // tiến trình). Cách đó không đáng tin: currentTime nhảy khi seek, khựng khi buffer, và phụ
        // thuộc tốc độ phát — không phản ánh đúng "đã nghe bao lâu theo đồng hồ". Bản này đo bằng
        // performance.now(): một interval 1s chỉ chạy KHI nhạc thực sự đang phát, cộng dồn delta
        // thời gian thực vào cả tổng (meta.totalListenSeconds) lẫn từng bài (addSongListenTime).
        let _listenTickHandle = null;
        let _listenLastTick = 0;
        let pendingListenSeconds = 0; // phần tổng chưa flush vào IndexedDB (cũng được wakelock.js flush lúc unload)

        function _listenTick() {
            const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            let delta = (now - _listenLastTick) / 1000;
            _listenLastTick = now;
            if (!(delta > 0)) return;
            // Chặn delta bất thường khi tab bị treo/throttle nền hoặc máy ngủ rồi thức (tránh cộng
            // vọt hàng phút/giờ). Giới hạn 4s/tick (interval 1s nên bình thường delta ~1s).
            if (delta > 4) delta = 4;
            pendingListenSeconds += delta;
            if (currentKey && typeof addSongListenTime === 'function') addSongListenTime(currentKey, delta);
            if (pendingListenSeconds >= 5) {
                const toFlush = pendingListenSeconds; pendingListenSeconds = 0;
                getMeta('totalListenSeconds').then(v => setMeta('totalListenSeconds', (v || 0) + toFlush));
            }
        }
        function startListenClock() {
            if (_listenTickHandle !== null) return;
            _listenLastTick = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            _listenTickHandle = setInterval(_listenTick, 1000);
        }
        function stopListenClock() {
            if (_listenTickHandle === null) return;
            _listenTick(); // chốt nốt phần lẻ kể từ tick gần nhất trước khi dừng
            clearInterval(_listenTickHandle); _listenTickHandle = null;
        }

        audioPlayer.addEventListener('play', () => { 
            iconPlay.classList.add('hidden'); iconPause.classList.remove('hidden'); 
            let recordArtDynamic = document.getElementById('record-art'); if(recordArtDynamic) recordArtDynamic.classList.remove('paused');
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing";
            if (currentKey) refreshSongNode(currentKey);
            startListenClock();
            // Chỉ ĐỒNG BỘ phát video theo nhạc — KHÔNG fade lại. Nguồn + fade đã thiết lập 1 lần
            // lúc bật/upload/nạp trang (handleVideoBackground), nên Next/Prev không lặp lại cú fade.
            syncVideoBgToAudio();
        });
        audioPlayer.addEventListener('pause', () => { 
            iconPlay.classList.remove('hidden'); iconPause.classList.add('hidden'); 
            let recordArtDynamic = document.getElementById('record-art'); if(recordArtDynamic) recordArtDynamic.classList.add('paused');
            releaseWakeLock(); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "paused";
            if (currentKey) refreshSongNode(currentKey);
            stopListenClock();
            syncVideoBgToAudio();
        });
        audioPlayer.addEventListener('ended', () => { stopListenClock(); playNext(false); });
        audioPlayer.addEventListener('loadedmetadata', () => { progressBar.max = audioPlayer.duration; durationTimeDisplay.textContent = formatTime(audioPlayer.duration); updateMediaPositionState(); });
        // Lỗi decode THẬT (khác với "không tìm thấy record" đã xử lý riêng trong playSong) — trình
        // duyệt gán src xong rồi mới phát hiện không decode được (file hỏng dù qua được check nhanh
        // lúc nạp/quét). Chỉ xử lý khi đang thực sự gắn với currentKey (audioPlayer.src vẫn còn trỏ
        // đúng bài đó) — tránh trường hợp hiếm: lỗi bắn ra sau khi đã playSong() sang bài khác.
        audioPlayer.addEventListener('error', () => {
            if (currentKey && currentObjectURL && audioPlayer.src === currentObjectURL) {
                handlePlaybackError(currentKey);
            }
        });

        let lastPositionSync = 0;
        audioPlayer.addEventListener('timeupdate', () => { 
            if (!isSeeking) { progressBar.value = audioPlayer.currentTime; updateProgressBarCSS(); } 
            currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime); processSubtitles(audioPlayer.currentTime);
            if (Date.now() - lastPositionSync > 5000) { updateMediaPositionState(); lastPositionSync = Date.now(); }
            // (Thống kê thời lượng nghe KHÔNG còn tính ở đây — xem "Bộ đếm thời gian nghe thật"
            //  phía trên: đo bằng đồng hồ thực, độc lập với currentTime/thanh tiến trình.)
        });
        
        audioPlayer.addEventListener('seeked', updateMediaPositionState);
        progressBar.addEventListener('input', () => { isSeeking = true; currentTimeDisplay.textContent = formatTime(progressBar.value); updateProgressBarCSS(); processSubtitles(progressBar.value); });
        progressBar.addEventListener('change', () => { audioPlayer.currentTime = progressBar.value; isSeeking = false; updateMediaPositionState(); });

        function updateProgressBarCSS() {
            const percentage = (progressBar.value / (progressBar.max || 100)) * 100;
            const color = vizConfig.mode === 'solid' ? vizConfig.solidColor : (vizConfig.mode === 'dynamic' ? vizConfig.dynB : '#38bdf8');
            progressBar.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, rgba(255,255,255,0.2) ${percentage}%, rgba(255,255,255,0.2) 100%)`;
        }

        btnSettings.addEventListener('click', () => drawerSettings.classList.remove('-translate-y-full'));
        btnSettingsPlaylist.addEventListener('click', () => drawerSettings.classList.remove('-translate-y-full'));
        closeDrawer.addEventListener('click', () => { validateVideoBgOnClose(); drawerSettings.classList.add('-translate-y-full'); });
        
        btnCycleMode.addEventListener('click', () => { currentModeIndex = (currentModeIndex + 1) % MODES.length; updateTypeUI(); saveConfig(); });

        function updateTypeUI() {
            vizConfig.type = MODES[currentModeIndex]; modeBadge.textContent = `${currentModeIndex + 1}/${MODES.length}`;
            // Đồng bộ select "Kiểu hiệu ứng" trong Settings (ver 8 refine) — updateTypeUI() là
            // điểm DUY NHẤT mọi đường đổi kiểu hiệu ứng đều đi qua (cycle button HOẶC select), nên
            // đặt đồng bộ ở đây đảm bảo 2 UI luôn khớp nhau bất kể đổi từ đâu.
            if (typeof visualizerTypeSelect !== 'undefined' && visualizerTypeSelect) visualizerTypeSelect.value = vizConfig.type;
            blockMaxHeight.classList.add('hidden'); blockBarWidth.classList.add('hidden');
            blockVortex.classList.add('hidden'); blockRain.classList.add('hidden'); blockBarStyle.classList.add('hidden');
            
            if (vizConfig.type === 'vortex') {
                if(!tInitialized) initThreeJS();
                updateVortexVisibility();
                if (!playlistView.classList.contains('-translate-y-full')) {} else { document.getElementById('webgl-canvas').classList.remove('opacity-0'); }
            } else { document.getElementById('webgl-canvas').classList.add('opacity-0'); }

            if (vizConfig.type === 'vortex') { blockVortex.classList.remove('hidden'); blockVortex.classList.add('flex'); }
            else if (vizConfig.type === 'rain') { blockRain.classList.remove('hidden'); blockRain.classList.add('flex'); }
            else if (vizConfig.type === 'bar') {
                // "Độ cao tối đa" vẫn dùng chung cho Bar (cả mirror/cascade); "Độ dày thanh" KHÔNG
                // áp dụng cho Bar nữa (chỉ Black Hole) — xem updateBarStyleUI cho 2 setting riêng
                // của kiểu Phản chiếu (số lượng thanh, độ to vòng tròn).
                blockMaxHeight.classList.remove('hidden'); blockMaxHeight.classList.add('flex');
                blockBarStyle.classList.remove('hidden'); blockBarStyle.classList.add('flex');
                updateBarStyleUI();
            }
            else if (vizConfig.type === 'black hole') {
                // Black Hole là visual DUY NHẤT còn dùng "Độ dày thanh".
                blockMaxHeight.classList.remove('hidden'); blockMaxHeight.classList.add('flex');
                blockBarWidth.classList.remove('hidden'); blockBarWidth.classList.add('flex');
            }
            else if (vizConfig.type !== 'rubik' && vizConfig.type !== 'lightning') { 
                blockMaxHeight.classList.remove('hidden'); blockMaxHeight.classList.add('flex'); 
            }

            if(analyser) { analyser.fftSize = (vizConfig.type === 'vortex' || vizConfig.type === 'lightning') ? APP_CONFIG.fftSizeHighRes : APP_CONFIG.fftSizeStandard; allocateBuffers(); }
        }

        function updateBarStyleUI() {
            const isMirror = vizConfig.barStyle === 'mirror';
            barMirrorOptions.classList.toggle('hidden', !isMirror);
            barMirrorOptions.classList.toggle('flex', isMirror);
        }

        function updateColorMenuUI() {
            if (vizConfig.mode === 'solid') { solidColorContainer.classList.remove('hidden'); dynColorContainer.classList.add('hidden'); dynColorContainer.classList.remove('flex'); } 
            else if (vizConfig.mode === 'dynamic') { solidColorContainer.classList.add('hidden'); dynColorContainer.classList.remove('hidden'); dynColorContainer.classList.add('flex'); } 
            else { solidColorContainer.classList.add('hidden'); dynColorContainer.classList.add('hidden'); dynColorContainer.classList.remove('flex'); }
            updateProgressBarCSS();
        }

        function applyEQPreset(mode) {
            if (!eqBandNodes || eqBandNodes.length === 0) return;
            const gains = mode === 'manual' ? vizConfig.manualEq : (EQ_PRESETS[mode] || EQ_PRESETS['flat']);
            for(let i = 0; i < eqBandNodes.length; i++) { if(eqBandNodes[i]) eqBandNodes[i].gain.value = gains[i] || 0; }
        }

        qualitySelect.addEventListener('change', (e) => { vizConfig.quality = e.target.value; resizeCanvas(); saveConfig(); });
        bgUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            e.target.value = '';
            // (3b) Chỉ chấp nhận PNG/JPG/WEBP — xem upload-validation.js. Chặn TRƯỚC khi đụng tới
            // IndexedDB/blob URL, không đổi gì khác trong luồng cũ nếu file hợp lệ.
            const check = validateImageFile(file);
            if (!check.valid) { alert(check.reason); return; }
            withLoadingShield("Đang lưu ảnh nền...", async () => {
                await setMeta('bgImage', file);
                if (vizConfig.bgImage && vizConfig.bgImage.startsWith('blob:')) URL.revokeObjectURL(vizConfig.bgImage);
                vizConfig.bgImage = URL.createObjectURL(file);
                vizConfig.bgImageEnabled = true; bgImageEnableToggle.checked = true;
                updatePlaylistBg(); saveConfig();
            });
        });
        bgImageEnableToggle.addEventListener('change', (e) => {
            vizConfig.bgImageEnabled = e.target.checked;
            withLoadingShield(vizConfig.bgImageEnabled ? "Đang xử lý..." : "Đang xóa ảnh nền...", async () => {
                if (!vizConfig.bgImageEnabled) {
                    await delMeta('bgImage');
                    if (vizConfig.bgImage && vizConfig.bgImage.startsWith('blob:')) URL.revokeObjectURL(vizConfig.bgImage);
                    vizConfig.bgImage = '';
                }
                updatePlaylistBg(); saveConfig();
            });
        });
        bgBlurSlider.addEventListener('input', (e) => { vizConfig.bgBlur = e.target.value; valBgBlurDisplay.textContent = e.target.value + 'px'; updatePlaylistBg(); saveConfig(); });
        
        bgColorPicker.addEventListener('input', (e) => { vizConfig.bgColor = e.target.value; updateDOMBackground(); saveConfig(); });
        colorModeSelect.addEventListener('change', (e) => { vizConfig.mode = e.target.value; updateColorMenuUI(); saveConfig(); });
        solidColorPicker.addEventListener('input', (e) => { vizConfig.solidColor = e.target.value; solidColorText.value = e.target.value; updateProgressBarCSS(); saveConfig(); });
        solidColorText.addEventListener('input', (e) => { if (/^#[0-9A-F]{6}$/i.test(e.target.value)) { vizConfig.solidColor = e.target.value; solidColorPicker.value = e.target.value; updateProgressBarCSS(); saveConfig(); } });
        dynColorA.addEventListener('input', (e) => { vizConfig.dynA = e.target.value; saveConfig(); }); 
        dynColorB.addEventListener('input', (e) => { vizConfig.dynB = e.target.value; updateProgressBarCSS(); saveConfig(); });
        vortexStyleSelect.addEventListener('change', (e) => { vizConfig.vortexStyle = e.target.value; updateVortexVisibility(); saveConfig(); });
        barStyleSelect.addEventListener('change', (e) => { vizConfig.barStyle = e.target.value; updateBarStyleUI(); saveConfig(); });
        rainStyleSelect.addEventListener('change', (e) => { vizConfig.rainStyle = e.target.value; resizeCanvas(); saveConfig(); });
        glassFlashToggle.addEventListener('change', (e) => { vizConfig.glassFlash = e.target.checked; saveConfig(); });
        maxHeightSlider.addEventListener('input', (e) => { vizConfig.maxH = parseInt(e.target.value); valMaxDisplay.textContent = vizConfig.maxH; saveConfig(); });
        barWidthSlider.addEventListener('input', (e) => { vizConfig.barWidth = parseInt(e.target.value); valWidthDisplay.textContent = vizConfig.barWidth; saveConfig(); });
        mirrorCountSlider.addEventListener('input', (e) => { vizConfig.mirrorBarCount = parseInt(e.target.value); valMirrorCountDisplay.textContent = vizConfig.mirrorBarCount; saveConfig(); });

        volumeSlider.addEventListener('input', (e) => { 
            vizConfig.volume = parseInt(e.target.value); valVolumeDisplay.textContent = vizConfig.volume + '%'; 
            if(masterGainNode) masterGainNode.gain.value = vizConfig.volume / 100; saveConfig();
        });
        eqSelect.addEventListener('change', (e) => { vizConfig.eqMode = e.target.value; updateEQSlidersUI(vizConfig.eqMode); applyEQPreset(vizConfig.eqMode); saveConfig(); });