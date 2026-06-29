/**
 * event/listener/language-settings.js — TẤT CẢ listener của cụm "languageSettings".
 */
if (settingLanguageSelect) {
    settingLanguageSelect.addEventListener('change', (e) => {
        eventBus.send({ router: 'languageSettings', type: 'languageSettings.select.change', payload: { code: e.target.value } });
    });
}

if (settingLanguageUpload) {
    settingLanguageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        eventBus.send({ router: 'languageSettings', type: 'languageSettings.upload.change', payload: { file } });
    });
}

if (settingLanguageDelete) {
    settingLanguageDelete.addEventListener('click', () => {
        eventBus.send({ router: 'languageSettings', type: 'languageSettings.delete.click', payload: {} });
    });
}
