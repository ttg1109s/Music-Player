/**
 * Visualizer Misc Settings — 4 nút mở/đóng drawer "Tùy chỉnh Visualizer"/"Tùy chỉnh Phụ đề",
 * select "Kiểu hiệu ứng", toggle "Giữ màn hình sáng".
 *
 * ĐÃ TÁCH từ core/equalizer-settings.js (cũ, tên file gây nhầm) — các mục này thuộc về Visualizer
 * nói chung, không liên quan EQ.
 *
 * PHẢI nạp SAU: core/config.js (vizConfig/saveConfig/MODES), core/dom-refs.js, core/wakelock.js
 * (requestWakeLock/releaseWakeLock), core/visualizer/visualizer-display.js (updateTypeUI).
 */

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
        // + saveConfig() đã có sẵn — không cần viết logic riêng, giữ NGUYÊN 1 nguồn sự thật duy
        // nhất cho việc đổi kiểu hiệu ứng (currentModeIndex), dù đổi qua cycle hay qua select đều
        // chạy chung 1 hàm.
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

        /**
         * Đồng bộ TOÀN BỘ UI misc settings này theo vizConfig hiện tại — gọi từ loadConfig()
         * (core/config.js) qua guard `typeof === 'function'`.
         */
        function initVisualizerMiscSettingsUIFromConfig() {
            if (typeof keepScreenOnToggle !== 'undefined' && keepScreenOnToggle) keepScreenOnToggle.checked = vizConfig.keepScreenOn !== false;
            if (typeof visualEnabledToggle !== 'undefined' && visualEnabledToggle) visualEnabledToggle.checked = vizConfig.visualEnabled !== false;
            if (typeof visualizerTypeSelect !== 'undefined' && visualizerTypeSelect) visualizerTypeSelect.value = MODES[currentModeIndex];
        }
