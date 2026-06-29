/**
 * event/listener/subtitle-style-settings.js — TẤT CẢ listener của cụm "subtitleStyleSettings".
 */
if (typeof settingSubtitlesEnabled !== 'undefined' && settingSubtitlesEnabled) {
    settingSubtitlesEnabled.addEventListener('change', (e) => {
        eventBus.send({ router: 'subtitleStyleSettings', type: 'subtitleStyleSettings.enable.change', payload: { checked: e.target.checked } });
    });
}

settingSubBgColor.addEventListener('input', (e) => {
    eventBus.send({ router: 'subtitleStyleSettings', type: 'subtitleStyleSettings.bgColor.input', payload: { value: e.target.value } });
});

settingSubBgOpacity.addEventListener('input', (e) => {
    eventBus.send({ router: 'subtitleStyleSettings', type: 'subtitleStyleSettings.bgOpacity.input', payload: { rawValue: e.target.value } });
});

settingSubBorderColor.addEventListener('input', (e) => {
    eventBus.send({ router: 'subtitleStyleSettings', type: 'subtitleStyleSettings.borderColor.input', payload: { value: e.target.value } });
});

settingSubBorderOpacity.addEventListener('input', (e) => {
    eventBus.send({ router: 'subtitleStyleSettings', type: 'subtitleStyleSettings.borderOpacity.input', payload: { rawValue: e.target.value } });
});

settingSubBorderWidth.addEventListener('input', (e) => {
    eventBus.send({ router: 'subtitleStyleSettings', type: 'subtitleStyleSettings.borderWidth.input', payload: { rawValue: e.target.value } });
});

settingSubBorderRadius.addEventListener('input', (e) => {
    eventBus.send({ router: 'subtitleStyleSettings', type: 'subtitleStyleSettings.borderRadius.input', payload: { rawValue: e.target.value } });
});

settingSubTextColor.addEventListener('input', (e) => {
    eventBus.send({ router: 'subtitleStyleSettings', type: 'subtitleStyleSettings.textColor.input', payload: { value: e.target.value } });
});

settingSubFontSize.addEventListener('input', (e) => {
    eventBus.send({ router: 'subtitleStyleSettings', type: 'subtitleStyleSettings.fontSize.input', payload: { rawValue: e.target.value } });
});

settingSubLineHeight.addEventListener('input', (e) => {
    eventBus.send({ router: 'subtitleStyleSettings', type: 'subtitleStyleSettings.lineHeight.input', payload: { rawValue: e.target.value } });
});

settingSubLetterSpacing.addEventListener('input', (e) => {
    eventBus.send({ router: 'subtitleStyleSettings', type: 'subtitleStyleSettings.letterSpacing.input', payload: { rawValue: e.target.value } });
});
