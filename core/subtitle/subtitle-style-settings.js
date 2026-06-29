/**
 * Subtitle Style Settings — toggle "Hiện phụ đề" + 8 input style (màu nền/viền/chữ, opacity,
 * kích thước, khoảng cách dòng/chữ) trong Settings > "Tùy chỉnh Phụ đề".
 *
 * ĐÃ TÁCH từ core/equalizer-settings.js (cũ, tên file gây nhầm) — đây là cấu hình HIỂN THỊ phụ
 * đề, không liên quan EQ. Gộp chung 1 file vì cùng là "điều khiển hiển thị phụ đề trong Settings"
 * (đã thống nhất, khác `core/subtitle/subtitles.js` — nội dung/sửa từng dòng sub, và
 * `core/subtitle/subtitle-display.js` — hiển thị realtime).
 *
 * PHẢI nạp SAU: core/config.js (vizConfig/saveConfig), core/dom-refs.js (settingSubtitlesEnabled +
 * 8 settingSub*), core/subtitle/subtitle-display.js (applySubtitleStyle/updateSubToggleUI/
 * clearAllActiveSubBlocks).
 */
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

        /**
         * Đồng bộ TOÀN BỘ UI Subtitle Style theo vizConfig hiện tại — gọi từ loadConfig()
         * (core/config.js) qua guard `typeof === 'function'`. Giữ ĐÚNG thứ tự gọi như loadConfig()
         * cũ.
         */
        function initSubtitleStyleSettingsUIFromConfig() {
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
