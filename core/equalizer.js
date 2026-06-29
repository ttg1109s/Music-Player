/**
 * Thanh trượt Equalizer (10 băng tần) — initEQSliders/updateEQSlidersUI.
 *
 * ĐÃ TÁCH từ core/equalizer-settings.js (cũ, tên file gây nhầm — file đó thực ra trộn cả EQ +
 * Subtitle Style + misc settings Visualizer + saveConfig/loadConfig chung của TOÀN BỘ vizConfig).
 * Tách vật lý theo đúng chức năng TRƯỚC khi áp dụng `/event/` (đúng tinh thần mục 7c).
 *
 * `applyEQPreset()` GIỮ NGUYÊN ở core/visualizer/visualizer-display.js (cross-call, KHÔNG di
 * chuyển — đây là hàm có nhiều nguồn gọi không chỉ từ EQ, xem mục "Cross-call" của plan.md).
 *
 * PHẢI nạp SAU: core/config.js (vizConfig), core/dom-refs.js (eqSelect/eqSlidersWrapper).
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
         * Đồng bộ TOÀN BỘ UI EQ theo vizConfig hiện tại — gọi từ loadConfig() (core/config.js)
         * qua guard `typeof === 'function'`. Giữ ĐÚNG thứ tự gọi như loadConfig() cũ:
         * initEQSliders() (dựng lại 10 slider) -> gán eqSelect.value -> updateEQSlidersUI() (đồng
         * bộ vị trí slider theo mode) -> applyEQPreset() (áp dụng thật vào audio graph).
         */
        function initEqualizerUIFromConfig() {
            initEQSliders();
            eqSelect.value = vizConfig.eqMode;
            updateEQSlidersUI(vizConfig.eqMode);
            applyEQPreset(vizConfig.eqMode);
        }
