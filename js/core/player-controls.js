/**
 * Điều khiển phát nhạc: next/prev, chuyển sang màn hình visualizer, nút play/pause/shuffle/repeat, Media Session API, thanh tiến trình, cập nhật UI loại hiệu ứng & màu sắc, áp EQ preset.
 * (Trích từ file gốc, dòng 802-972 trong khối <script>)
 */
        function playNext(force = false) {
            if (playlistOrder.length === 0) return;
            if (!force && repeatMode === 2) { audioPlayer.currentTime = 0; audioPlayer.play(); return; }
            let nextKey;
            if (isShuffle) {
                let currentPos = shuffleIndices.indexOf(currentKey);
                if (currentPos === -1 || currentPos === playlistOrder.length - 1) { if (repeatMode === 1 || force) nextKey = shuffleIndices[0]; else { audioPlayer.pause(); return; } }
                else nextKey = shuffleIndices[currentPos + 1];
            } else {
                let currentPos = playlistOrder.indexOf(currentKey);
                if (currentPos === playlistOrder.length - 1) { if (repeatMode === 1 || force) nextKey = playlistOrder[0]; else { audioPlayer.pause(); return; } }
                else nextKey = playlistOrder[currentPos + 1];
            }
            window.playSong(nextKey);
        }

        function playPrev() {
            if (playlistOrder.length === 0) return;
            if (audioPlayer.currentTime > 3) { audioPlayer.currentTime = 0; return; }
            let prevKey;
            if (isShuffle) {
                let currentPos = shuffleIndices.indexOf(currentKey); prevKey = (currentPos <= 0) ? shuffleIndices[playlistOrder.length - 1] : shuffleIndices[currentPos - 1];
            } else {
                let currentPos = playlistOrder.indexOf(currentKey); prevKey = (currentPos <= 0) ? playlistOrder[playlistOrder.length - 1] : playlistOrder[currentPos - 1];
            }
            window.playSong(prevKey);
        }

        function switchToVisualizer() {
            playlistView.classList.add('-translate-y-full'); visualizerUI.classList.remove('hidden'); playerContainer.classList.remove('hidden');
            handleVideoBackground(); // rời Playlist -> cho video nền hiện lại nếu đang bật
            setTimeout(() => { 
                visualizerUI.classList.add('fade-enter-active'); canvas.classList.remove('opacity-0'); 
                if (vizConfig.type === 'vortex') document.getElementById('webgl-canvas').classList.remove('opacity-0');
            }, 50);
        }

        btnBackPlaylist.addEventListener('click', () => {
            visualizerUI.classList.remove('fade-enter-active'); canvas.classList.add('opacity-0'); document.getElementById('webgl-canvas').classList.add('opacity-0');
            playlistView.classList.remove('-translate-y-full'); // bỏ translate TRƯỚC để handleVideoBackground() nhận đúng màn hình hiện tại là Playlist
            handleVideoBackground(); // sang Playlist -> ẩn & dừng video nền (Playlist không dùng nó làm nền)
            setTimeout(() => { visualizerUI.classList.add('hidden'); playerContainer.classList.add('hidden'); renderPlaylist(); }, 300);
        });

        playPauseBtn.addEventListener('click', () => {
            requestWakeLock(); if (playlistOrder.length === 0) return;
            if (currentKey === null) { window.playSong(playlistOrder[0]); return; }
            if (audioPlayer.paused) { audioPlayer.play(); if (audioContext && audioContext.state === 'suspended') audioContext.resume(); } else { audioPlayer.pause(); }
        });

        btnNext.addEventListener('click', () => { requestWakeLock(); playNext(true); }); btnPrev.addEventListener('click', () => { requestWakeLock(); playPrev(); });
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

        audioPlayer.addEventListener('play', () => { 
            iconPlay.classList.add('hidden'); iconPause.classList.remove('hidden'); 
            let recordArtDynamic = document.getElementById('record-art'); if(recordArtDynamic) recordArtDynamic.classList.remove('paused');
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing"; renderPlaylist(); 
            if (vizConfig.videoBgEnabled && vizConfig.videoBgUrl && bgVideoElement.paused) { bgVideoElement.play().catch(() => {}); }
        });
        audioPlayer.addEventListener('pause', () => { 
            iconPlay.classList.remove('hidden'); iconPause.classList.add('hidden'); 
            let recordArtDynamic = document.getElementById('record-art'); if(recordArtDynamic) recordArtDynamic.classList.add('paused');
            releaseWakeLock(); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "paused"; renderPlaylist(); 
            if (!bgVideoElement.paused) bgVideoElement.pause();
        });
        audioPlayer.addEventListener('ended', () => { playNext(false); });
        audioPlayer.addEventListener('loadedmetadata', () => { progressBar.max = audioPlayer.duration; durationTimeDisplay.textContent = formatTime(audioPlayer.duration); updateMediaPositionState(); });

        let lastPositionSync = 0;
        let lastListenTrackTime = null; let pendingListenSeconds = 0;
        audioPlayer.addEventListener('timeupdate', () => { 
            if (!isSeeking) { progressBar.value = audioPlayer.currentTime; updateProgressBarCSS(); } 
            currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime); processSubtitles(audioPlayer.currentTime);
            if (Date.now() - lastPositionSync > 5000) { updateMediaPositionState(); lastPositionSync = Date.now(); }

            // Thống kê "thời lượng đã nghe thật" (mục 1/7 plan) — cộng dồn theo delta thời gian thực
            // giữa các lần timeupdate liên tiếp khi đang phát (không seek), flush vào IndexedDB mỗi
            // khi tích lũy đủ 5s để tránh ghi liên tục.
            if (!audioPlayer.paused && !isSeeking) {
                const now = audioPlayer.currentTime;
                if (lastListenTrackTime !== null && now > lastListenTrackTime) {
                    pendingListenSeconds += (now - lastListenTrackTime);
                }
                lastListenTrackTime = now;
                if (pendingListenSeconds >= 5) {
                    const toFlush = pendingListenSeconds; pendingListenSeconds = 0;
                    getMeta('totalListenSeconds').then(v => setMeta('totalListenSeconds', (v || 0) + toFlush));
                }
            } else { lastListenTrackTime = null; }
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