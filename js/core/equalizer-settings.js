/**
 * Thanh trượt Equalizer (10 băng tần) + lưu/nạp cấu hình (saveConfig/loadConfig), đồng bộ lại toàn bộ UI cài đặt khi nạp trang.
 * (Trích từ file gốc, dòng 434-491 trong khối <script>)
 */
        function initEQSliders() {
            eqSlidersWrapper.innerHTML = '';
            for(let i=0; i<10; i++) {
                const col = document.createElement('div'); col.className = 'flex flex-col items-center gap-1 w-6';
                col.innerHTML = `<span class="text-[8px] text-sky-300 w-full text-center" id="eq-val-${i}">0</span><div class="eq-slider-container"><input type="range" class="eq-slider" min="-12" max="12" step="1" value="0" data-index="${i}"></div><span class="text-[8px] text-slate-400 mt-1">${EQ_LABELS[i]}</span>`;
                eqSlidersWrapper.appendChild(col);
                const slider = col.querySelector('.eq-slider');
                slider.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value); document.getElementById(`eq-val-${i}`).textContent = val > 0 ? `+${val}` : val;
                    vizConfig.manualEq[i] = val;
                    if(vizConfig.eqMode !== 'manual') { vizConfig.eqMode = 'manual'; eqSelect.value = 'manual'; }
                    if(eqBandNodes[i]) eqBandNodes[i].gain.value = val; saveConfig();
                });
            }
        }

        function updateEQSlidersUI(mode) {
            const gains = mode === 'manual' ? vizConfig.manualEq : (EQ_PRESETS[mode] || EQ_PRESETS['flat']);
            const sliders = document.querySelectorAll('.eq-slider');
            for(let i=0; i<10; i++) { if(sliders[i]) { sliders[i].value = gains[i]; document.getElementById(`eq-val-${i}`).textContent = gains[i] > 0 ? `+${gains[i]}` : gains[i]; } }
        }

        /**
         * LƯU CONFIG (v7) — 2 lớp:
         *   (1) localStorage — NGUỒN GHI CHÍNH, đồng bộ, tức thì. saveConfig() được gọi RẤT dày
         *       (mỗi lần kéo 1 slider màu/EQ/sub-style...) nên phải giữ đồng bộ & rẻ, không thể đổi
         *       thẳng sang IndexedDB (async) cho lớp này — sẽ tạo hàng trăm transaction/giây lúc kéo.
         *   (2) IndexedDB (meta.configBackup) — BẢN SAO LƯU, ghi DEBOUNCE (giống cơ chế đã có ở
         *       listen-stats.js: gom nhiều thay đổi liên tiếp thành 1 lần ghi sau 2s yên tĩnh).
         *       Mục đích DUY NHẤT: phòng trường hợp browser tự xoá localStorage (ví dụ Safari iOS
         *       xoá dữ liệu site ít dùng để nhường chỗ, hoặc người dùng xoá "Clear browsing data"
         *       nhưng không đụng IndexedDB) — xem loadConfig() để biết luồng phục hồi.
         *
         * KHÔNG backup `bgImage`/`videoBgUrl`: đây là blob: URL chỉ sống trong 1 session (tạo lại
         * mỗi lần loadBackgroundAssets() chạy), lưu vào bản backup là vô nghĩa và có thể trỏ tới
         * blob: URL đã chết ở session sau.
         */
        function saveConfig() {
            localStorage.setItem('visualMasterConfigV21', JSON.stringify(vizConfig));
            scheduleConfigBackup();
        }

        function scheduleConfigBackup() {
            // taskManager.once() với tên cố định tự huỷ bản cũ + đặt lại từ đầu (addNew() validate
            // tự kill() task trùng tên) — đúng hành vi debounce, không cần biến timer riêng nữa.
            taskManager.once(flushConfigBackup, 2000, 'configBackupFlush');
        }
        function flushConfigBackup() {
            taskManager.kill('configBackupFlush');
            const { bgImage, videoBgUrl, ...persistable } = vizConfig; // loại trừ blob: URL runtime
            setMeta('configBackup', persistable).catch(e => console.warn('[equalizer-settings] Lưu configBackup (IndexedDB) lỗi:', e));
        }

        /**
         * Đọc lại ảnh nền & video nền từ IndexedDB (meta.bgImage / meta.videoBg), tự sửa trạng thái
         * "on ảo" nếu config nói đang bật nhưng IndexedDB không còn Blob tương ứng (mục 6 plan).
         * Áp dụng đồng nhất cho CẢ ảnh và video.
         */
        async function loadBackgroundAssets() {
            const [imgBlob, videoBlob] = await Promise.all([
                getMeta('bgImage'),
                getMeta('videoBg')
            ]);

            if (vizConfig.bgImageEnabled && !imgBlob) {
                vizConfig.bgImageEnabled = false;
            } else if (imgBlob && vizConfig.bgImageEnabled) {
                vizConfig.bgImage = URL.createObjectURL(imgBlob);
            }

            if (vizConfig.videoBgEnabled && !videoBlob) {
                vizConfig.videoBgEnabled = false;
            } else if (videoBlob && vizConfig.videoBgEnabled) {
                vizConfig.videoBgUrl = URL.createObjectURL(videoBlob);
            }

            saveConfig();
            bgImageEnableToggle.checked = vizConfig.bgImageEnabled;
            videoEnableToggle.checked = vizConfig.videoBgEnabled;
            updatePlaylistBg(); handleVideoBackground();
        }

        async function loadConfig() {
            let saved = localStorage.getItem('visualMasterConfigV21') || localStorage.getItem('visualMasterConfigV20');
            // FALLBACK (v7): localStorage rỗng (lần đầu mở MÁY THẬT MỚI, hoặc browser đã tự xoá
            // localStorage để nhường chỗ cho dữ liệu khác) NHƯNG IndexedDB còn bản backup -> đây là
            // dấu hiệu mất localStorage ngoài ý muốn (không phải người dùng mới thật), phục hồi lại
            // NGAY vào localStorage rồi nạp tiếp như thường — người dùng không mất cấu hình đã chỉnh.
            if (!saved) {
                try {
                    const backup = await getMeta('configBackup');
                    if (backup && typeof backup === 'object') {
                        saved = JSON.stringify(backup);
                        localStorage.setItem('visualMasterConfigV21', saved);
                        console.warn('[equalizer-settings] localStorage rỗng — đã phục hồi cấu hình từ bản backup IndexedDB.');
                    }
                } catch (e) { console.warn('[equalizer-settings] Không đọc được configBackup (IndexedDB):', e); }
            }
            if (saved) { try { vizConfig = { ...vizConfig, ...JSON.parse(saved) }; } catch(e) {} }
            if(!vizConfig.manualEq) vizConfig.manualEq = [0,0,0,0,0,0,0,0,0,0];
            if(vizConfig.vortexStyle === 'tardis' || vizConfig.vortexStyle === 'classic' || vizConfig.vortexStyle === 'dust') vizConfig.vortexStyle = 'rings';
            // Cấu hình cũ từng có rainStyle 'classic', visualizer 'synthesia'/'firefly_forest'/'seasons'/'wave' đã
            // bị loại bỏ — quy về giá trị tương đương gần nhất để không vỡ trải nghiệm của người dùng cũ.
            if (vizConfig.rainStyle === 'classic') vizConfig.rainStyle = 'glass';
            if (vizConfig.type === 'synthesia') { vizConfig.type = 'bar'; vizConfig.barStyle = 'cascade'; }
            if (vizConfig.type === 'firefly_forest' || vizConfig.type === 'seasons' || vizConfig.type === 'wave') vizConfig.type = 'bar';
            if (!vizConfig.barStyle) vizConfig.barStyle = 'mirror';
            if (vizConfig.mirrorBarCount == null) vizConfig.mirrorBarCount = 32;
            if (vizConfig.bgImageEnabled == null) vizConfig.bgImageEnabled = false;
            if (vizConfig.keepScreenOn == null) vizConfig.keepScreenOn = true;
            if (vizConfig.subtitlesEnabled == null) vizConfig.subtitlesEnabled = true;
            if (vizConfig.visualEnabled == null) vizConfig.visualEnabled = true;
            // Dữ liệu cũ (trước ver 8) có thể còn field `videoHideVisual` (đã loại bỏ, thay bằng
            // `visualEnabled` độc lập khỏi video nền) — không cần migrate giá trị qua, vì ý nghĩa
            // 2 field khác nhau (cũ: ẩn visual CHỈ khi có video; mới: ẩn visual LUÔN LUÔN khi tắt).
            // Field thừa này vô hại nếu còn tồn tại trong bản JSON cũ, JS đơn giản bỏ qua nó.
            if (!vizConfig.subtitleStyle) vizConfig.subtitleStyle = { ...DEFAULT_VIZ_CONFIG.subtitleStyle };
            else vizConfig.subtitleStyle = { ...DEFAULT_VIZ_CONFIG.subtitleStyle, ...vizConfig.subtitleStyle };
            // Cấu hình cũ (trước khi thang cỡ chữ đổi thành 8-16px) có thể đã lưu giá trị lớn hơn —
            // giới hạn lại để khớp với range slider hiện tại, tránh lệch giữa dữ liệu và UI.
            vizConfig.subtitleStyle.fontSize = Math.min(16, Math.max(8, vizConfig.subtitleStyle.fontSize));

            qualitySelect.value = vizConfig.quality; bgColorPicker.value = vizConfig.bgColor;
            bgBlurSlider.value = vizConfig.bgBlur; valBgBlurDisplay.textContent = vizConfig.bgBlur + 'px';

            // bgImage/videoBgUrl giờ là blob: URL runtime, tạo lại mỗi session từ IndexedDB — KHÔNG
            // sống sót qua reload, nên luôn reset về rỗng ở đây TRƯỚC khi loadBackgroundAssets() đọc
            // lại Blob thật và tự sửa trạng thái "on ảo" nếu cần (mục 6).
            vizConfig.bgImage = ''; vizConfig.videoBgUrl = '';
            await loadBackgroundAssets();
            
            colorModeSelect.value = vizConfig.mode;
            solidColorPicker.value = vizConfig.solidColor; solidColorText.value = vizConfig.solidColor;
            dynColorA.value = vizConfig.dynA; dynColorB.value = vizConfig.dynB;
            maxHeightSlider.value = vizConfig.maxH; valMaxDisplay.textContent = vizConfig.maxH;
            barWidthSlider.value = vizConfig.barWidth; valWidthDisplay.textContent = vizConfig.barWidth;
            mirrorCountSlider.value = vizConfig.mirrorBarCount; valMirrorCountDisplay.textContent = vizConfig.mirrorBarCount;
            vortexStyleSelect.value = vizConfig.vortexStyle;
            barStyleSelect.value = vizConfig.barStyle;
            rainStyleSelect.value = vizConfig.rainStyle;
            glassFlashToggle.checked = vizConfig.glassFlash;
            if (typeof keepScreenOnToggle !== 'undefined' && keepScreenOnToggle) keepScreenOnToggle.checked = vizConfig.keepScreenOn !== false;
            if (typeof visualEnabledToggle !== 'undefined' && visualEnabledToggle) visualEnabledToggle.checked = vizConfig.visualEnabled !== false;
            
            volumeSlider.value = vizConfig.volume; valVolumeDisplay.textContent = vizConfig.volume + '%';
            if(masterGainNode) masterGainNode.gain.value = vizConfig.volume / 100;
            
            initEQSliders(); eqSelect.value = vizConfig.eqMode; updateEQSlidersUI(vizConfig.eqMode); applyEQPreset(vizConfig.eqMode);

            currentModeIndex = MODES.indexOf(vizConfig.type); if(currentModeIndex === -1) currentModeIndex = 0;
            if (typeof visualizerTypeSelect !== 'undefined' && visualizerTypeSelect) visualizerTypeSelect.value = MODES[currentModeIndex];
            updateDOMBackground(); updatePlaylistBg(); updateColorMenuUI(); updateTypeUI();

            const ss = vizConfig.subtitleStyle;
            // Đồng bộ biến runtime + checkbox UI từ config đã lưu (ver 8 refine) — updateSubToggleUI()
            // cập nhật luôn badge xanh #sub-toggle-badge ở overlay theo giá trị vừa nạp.
            isSubtitlesEnabled = vizConfig.subtitlesEnabled !== false;
            if (typeof settingSubtitlesEnabled !== 'undefined' && settingSubtitlesEnabled) settingSubtitlesEnabled.checked = isSubtitlesEnabled;
            updateSubToggleUI();
            settingSubBgColor.value = ss.bgColor; settingSubBgOpacity.value = Math.round(ss.bgOpacity * 100); valSubBgOpacity.textContent = Math.round(ss.bgOpacity * 100) + '%';
            settingSubBorderColor.value = ss.borderColor; settingSubBorderOpacity.value = Math.round(ss.borderOpacity * 100); valSubBorderOpacity.textContent = Math.round(ss.borderOpacity * 100) + '%';
            settingSubBorderWidth.value = ss.borderWidth; valSubBorderWidth.textContent = ss.borderWidth;
            settingSubBorderRadius.value = ss.borderRadius; valSubBorderRadius.textContent = ss.borderRadius;
            settingSubTextColor.value = ss.textColor;
            settingSubFontSize.value = ss.fontSize; valSubFontSize.textContent = ss.fontSize;
            settingSubLineHeight.value = ss.lineHeight; valSubLineHeight.textContent = ss.lineHeight;
            settingSubLetterSpacing.value = ss.letterSpacing; valSubLetterSpacing.textContent = ss.letterSpacing;
            applySubtitleStyle();
        }

        btnSubtitle.addEventListener('click', () => { subtitleModal.classList.remove('translate-y-full'); renderSubList(); });
        btnCloseSubModal.addEventListener('click', () => { resetAutoSub(); subtitleModal.classList.add('translate-y-full'); });

        // Toggle "Hiện phụ đề" (ver 8 refine) — chuyển từ nút trong modal sub về Cài đặt, giờ LƯU
        // vào vizConfig.subtitlesEnabled (saveConfig()) thay vì chỉ đổi biến in-memory như trước.
        if (typeof settingSubtitlesEnabled !== 'undefined' && settingSubtitlesEnabled) {
            settingSubtitlesEnabled.addEventListener('change', (e) => {
                isSubtitlesEnabled = e.target.checked;
                vizConfig.subtitlesEnabled = isSubtitlesEnabled;
                saveConfig();
                updateSubToggleUI();
                if (!isSubtitlesEnabled) clearAllActiveSubBlocks();
            });
        }

        settingSubBgColor.addEventListener('input', (e) => { vizConfig.subtitleStyle.bgColor = e.target.value; applySubtitleStyle(); saveConfig(); });
        settingSubBgOpacity.addEventListener('input', (e) => { const v = parseInt(e.target.value); vizConfig.subtitleStyle.bgOpacity = v / 100; valSubBgOpacity.textContent = v + '%'; applySubtitleStyle(); saveConfig(); });
        settingSubBorderColor.addEventListener('input', (e) => { vizConfig.subtitleStyle.borderColor = e.target.value; applySubtitleStyle(); saveConfig(); });
        settingSubBorderOpacity.addEventListener('input', (e) => { const v = parseInt(e.target.value); vizConfig.subtitleStyle.borderOpacity = v / 100; valSubBorderOpacity.textContent = v + '%'; applySubtitleStyle(); saveConfig(); });
        settingSubBorderWidth.addEventListener('input', (e) => { const v = parseInt(e.target.value); vizConfig.subtitleStyle.borderWidth = v; valSubBorderWidth.textContent = v; applySubtitleStyle(); saveConfig(); });
        settingSubBorderRadius.addEventListener('input', (e) => { const v = parseInt(e.target.value); vizConfig.subtitleStyle.borderRadius = v; valSubBorderRadius.textContent = v; applySubtitleStyle(); saveConfig(); });
        settingSubTextColor.addEventListener('input', (e) => { vizConfig.subtitleStyle.textColor = e.target.value; applySubtitleStyle(); saveConfig(); });
        settingSubFontSize.addEventListener('input', (e) => { const v = parseInt(e.target.value); vizConfig.subtitleStyle.fontSize = v; valSubFontSize.textContent = v; applySubtitleStyle(); saveConfig(); });
        settingSubLineHeight.addEventListener('input', (e) => { const v = parseFloat(e.target.value); vizConfig.subtitleStyle.lineHeight = v; valSubLineHeight.textContent = v; applySubtitleStyle(); saveConfig(); });
        settingSubLetterSpacing.addEventListener('input', (e) => { const v = parseFloat(e.target.value); vizConfig.subtitleStyle.letterSpacing = v; valSubLetterSpacing.textContent = v; applySubtitleStyle(); saveConfig(); });

        // ===================== Drawer "Tùy chỉnh Visualizer" / "Tùy chỉnh Phụ đề" (ver 8 refine, mục 3) =====================
        // Cùng pattern navigation stack với About/Storage Drawer (xem about-stats.js) — Back chỉ
        // ẩn drawer con, không động vào #drawer-settings bên dưới.
        if (btnOpenVisualizerSettings) btnOpenVisualizerSettings.addEventListener('click', () => drawerVisualizerSettings.classList.remove('translate-y-full'));
        if (btnBackVisualizerSettings) btnBackVisualizerSettings.addEventListener('click', () => drawerVisualizerSettings.classList.add('translate-y-full'));
        if (btnOpenSubtitleSettings) btnOpenSubtitleSettings.addEventListener('click', () => drawerSubtitleSettings.classList.remove('translate-y-full'));
        if (btnBackSubtitleSettings) btnBackSubtitleSettings.addEventListener('click', () => drawerSubtitleSettings.classList.add('translate-y-full'));

        // Select "Kiểu hiệu ứng" (#setting-visualizer-type, ver 8 refine) — chọn TRỰC TIẾP 1 trong
        // 6 visual ngay trong Settings chính, thay cho việc phải bấm nút cycle (#btn-cycle-mode)
        // nhiều lần. Đồng bộ currentModeIndex theo MODES.indexOf() rồi gọi lại đúng updateTypeUI()
        // + saveConfig() đã có sẵn (player-controls.js) — không cần viết logic riêng, giữ NGUYÊN
        // 1 nguồn sự thật duy nhất cho việc đổi kiểu hiệu ứng (currentModeIndex), dù đổi qua cycle
        // hay qua select đều chạy chung 1 hàm.
        if (typeof visualizerTypeSelect !== 'undefined' && visualizerTypeSelect) {
            visualizerTypeSelect.addEventListener('change', (e) => {
                const idx = MODES.indexOf(e.target.value);
                if (idx === -1) return;
                currentModeIndex = idx;
                updateTypeUI();
                saveConfig();
            });
        }

        // Tuỳ chọn "Giữ màn hình sáng" (mục 2.10). Bật -> xin wake lock khi đang phát; tắt -> nhả
        // wake lock để máy tự tắt màn theo hệ điều hành (nhạc vẫn cố gắng phát ở chế độ nền).
        if (typeof keepScreenOnToggle !== 'undefined' && keepScreenOnToggle) {
            keepScreenOnToggle.addEventListener('change', (e) => {
                vizConfig.keepScreenOn = e.target.checked;
                saveConfig();
                if (vizConfig.keepScreenOn) { if (typeof audioPlayer !== 'undefined' && !audioPlayer.paused) requestWakeLock(); }
                else { releaseWakeLock(); }
            });
        }