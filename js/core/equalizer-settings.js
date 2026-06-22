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
            if(vizConfig.vortexStyle === 'tardis' || vizConfig.vortexStyle === 'classic') vizConfig.vortexStyle = 'dust';

            qualitySelect.value = vizConfig.quality; bgColorPicker.value = vizConfig.bgColor;
            bgBlurSlider.value = vizConfig.bgBlur; valBgBlurDisplay.textContent = vizConfig.bgBlur + 'px';
            
            videoEnableToggle.checked = vizConfig.videoBgEnabled; vizConfig.videoBgUrl = ''; handleVideoBackground();
            videoHideVisualToggle.checked = vizConfig.videoHideVisual || false;
            
            colorModeSelect.value = vizConfig.mode;
            solidColorPicker.value = vizConfig.solidColor; solidColorText.value = vizConfig.solidColor;
            dynColorA.value = vizConfig.dynA; dynColorB.value = vizConfig.dynB;
            maxHeightSlider.value = vizConfig.maxH; valMaxDisplay.textContent = vizConfig.maxH;
            barWidthSlider.value = vizConfig.barWidth; valWidthDisplay.textContent = vizConfig.barWidth;
            vortexStyleSelect.value = vizConfig.vortexStyle;
            rainStyleSelect.value = vizConfig.rainStyle;
            glassFlashToggle.checked = vizConfig.glassFlash;
            
            volumeSlider.value = vizConfig.volume; valVolumeDisplay.textContent = vizConfig.volume + '%';
            if(masterGainNode) masterGainNode.gain.value = vizConfig.volume / 100;
            
            initEQSliders(); eqSelect.value = vizConfig.eqMode; updateEQSlidersUI(vizConfig.eqMode); applyEQPreset(vizConfig.eqMode);

            currentModeIndex = MODES.indexOf(vizConfig.type); if(currentModeIndex === -1) currentModeIndex = 0;
            updateDOMBackground(); updatePlaylistBg(); updateColorMenuUI(); updateTypeUI();
        }

        btnSubtitle.addEventListener('click', () => { subtitleModal.classList.remove('translate-y-full'); renderSubList(); });
        btnCloseSubModal.addEventListener('click', () => { resetAutoSub(); subtitleModal.classList.add('translate-y-full'); });
        btnToggleSub.addEventListener('click', () => { isSubtitlesEnabled = !isSubtitlesEnabled; updateSubToggleUI(); });

