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

        function saveConfig() { localStorage.setItem('visualMasterConfigV21', JSON.stringify(vizConfig)); }

        function loadConfig() {
            const saved = localStorage.getItem('visualMasterConfigV21') || localStorage.getItem('visualMasterConfigV20');
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
            if (!vizConfig.subtitleStyle) vizConfig.subtitleStyle = { ...DEFAULT_VIZ_CONFIG.subtitleStyle };
            else vizConfig.subtitleStyle = { ...DEFAULT_VIZ_CONFIG.subtitleStyle, ...vizConfig.subtitleStyle };
            // Cấu hình cũ (trước khi thang cỡ chữ đổi thành 8-16px) có thể đã lưu giá trị lớn hơn —
            // giới hạn lại để khớp với range slider hiện tại, tránh lệch giữa dữ liệu và UI.
            vizConfig.subtitleStyle.fontSize = Math.min(16, Math.max(8, vizConfig.subtitleStyle.fontSize));

            qualitySelect.value = vizConfig.quality; bgColorPicker.value = vizConfig.bgColor;
            bgBlurSlider.value = vizConfig.bgBlur; valBgBlurDisplay.textContent = vizConfig.bgBlur + 'px';
            
            // videoBgUrl là blob: URL (từ file đã chọn) — KHÔNG sống sót qua reload, nên luôn reset
            // về rỗng ở đây. Nếu vizConfig.videoBgEnabled vẫn còn true từ config đã lưu trước đó,
            // mà giờ không còn URL video nào cả, thì đó là trạng thái "on" ảo (mất data video sau
            // refresh) — phải tự tắt cả videoBgEnabled lẫn videoHideVisual (phụ thuộc vào nó) và
            // lưu lại ngay, để lần load sau không bị treo "on" mãi.
            vizConfig.videoBgUrl = '';
            if (vizConfig.videoBgEnabled) { vizConfig.videoBgEnabled = false; vizConfig.videoHideVisual = false; saveConfig(); }
            videoEnableToggle.checked = vizConfig.videoBgEnabled; handleVideoBackground();
            videoHideVisualToggle.checked = vizConfig.videoHideVisual || false;
            
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
            
            volumeSlider.value = vizConfig.volume; valVolumeDisplay.textContent = vizConfig.volume + '%';
            if(masterGainNode) masterGainNode.gain.value = vizConfig.volume / 100;
            
            initEQSliders(); eqSelect.value = vizConfig.eqMode; updateEQSlidersUI(vizConfig.eqMode); applyEQPreset(vizConfig.eqMode);

            currentModeIndex = MODES.indexOf(vizConfig.type); if(currentModeIndex === -1) currentModeIndex = 0;
            updateDOMBackground(); updatePlaylistBg(); updateColorMenuUI(); updateTypeUI();

            const ss = vizConfig.subtitleStyle;
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
        btnToggleSub.addEventListener('click', () => { isSubtitlesEnabled = !isSubtitlesEnabled; updateSubToggleUI(); });

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