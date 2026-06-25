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
            // KHÔNG dừng/ẩn video ở đây nữa: Playlist (z-[60]) tự che video, video vẫn chạy theo nhạc.
            setTimeout(() => { visualizerUI.classList.add('hidden'); playerContainer.classList.add('hidden'); renderPlaylistDiff(); }, 300);
        });

        playPauseBtn.addEventListener('click', () => {
            requestWakeLock(); if (playlistOrder.length === 0) return;
            if (currentKey === null) { window.playSong(displayOrder[0] || playlistOrder[0]); return; }
            if (audioPlayer.paused) { audioPlayer.play(); if (audioContext && audioContext.state === 'suspended') audioContext.resume(); } else { audioPlayer.pause(); }
        });

        btnNext.addEventListener('click', () => playNext(true)); btnPrev.addEventListener('click', () => playPrev());
        btnShuffle.addEventListener('click', () => { isShuffle = !isShuffle; btnShuffle.classList.toggle('!text-sky-400', isShuffle); btnShuffle.classList.toggle('text-slate-400', !isShuffle); updateShuffleArray(); });
        btnRepeat.addEventListener('click', () => {
            repeatMode = (repeatMode + 1) % 3;
            if (repeatMode === 0) { btnRepeat.classList.remove('!text-sky-400'); btnRepeat.classList.add('text-slate-400'); repeatBadge.classList.add('hidden'); } 
            else if (repeatMode === 1) { btnRepeat.classList.remove('text-slate-400'); btnRepeat.classList.add('!text-sky-400'); repeatBadge.classList.add('hidden'); } 
            else if (repeatMode === 2) { btnRepeat.classList.add('!text-sky-400'); repeatBadge.classList.remove('hidden'); }
        });

        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => { requestWakeLock(); audioPlayer.play(); });
            navigator.mediaSession.setActionHandler('pause', () => { audioPlayer.pause(); releaseWakeLock(); });
            navigator.mediaSession.setActionHandler('previoustrack', playPrev); navigator.mediaSession.setActionHandler('nexttrack', () => playNext(true));
            navigator.mediaSession.setActionHandler('seekto', (details) => { if (details.fastSeek && ('fastSeek' in audioPlayer)) audioPlayer.fastSeek(details.seekTime); else audioPlayer.currentTime = details.seekTime; });
        }

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