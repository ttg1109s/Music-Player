/**
 * event/router/language-settings.js — Router tên "languageSettings", tự đăng ký với eventBus.
 *
 * QUY TẮC RẼ NHÁNH (không đổi):
 *   - 'select.change' chỉ cần đúng 1 hàm core (selectLanguage) -> gọi THẲNG.
 *   - 'upload.change' cần xử lý kết quả theo status + alertModal -> giao workflow.
 *   - 'delete.click'/'delete.confirm' cần modal xác nhận + rẽ nhánh "không cho xóa English" ->
 *     giao workflow (click) / gọi thẳng core qua workflow chuyển tiếp (confirm).
 *
 * KHÔNG giữ state context riêng — code/name của ngôn ngữ đang chọn đọc trực tiếp từ
 * settingLanguageSelect (DOM, nguồn sự thật hiện tại của UI) ngay tại thời điểm xử lý message.
 */
const routerLanguageSettings = (() => {
    function handle(msg) {
        switch (msg.type) {

            case 'languageSettings.select.change': {
                selectLanguage(msg.payload.code);
                break;
            }

            case 'languageSettings.upload.change': {
                workflowLanguageSettings.handleUpload({ file: msg.payload.file });
                break;
            }

            case 'languageSettings.delete.click': {
                const code = settingLanguageSelect ? settingLanguageSelect.value : null;
                if (!code || code === 'en') {
                    workflowLanguageSettings.rejectDeleteEnglish();
                    return;
                }
                const option = settingLanguageSelect.querySelector(`option[value="${code}"]`);
                const name = option ? option.textContent : code;
                workflowLanguageSettings.askDeleteLanguage({
                    code, name,
                    onConfirmSend: () => eventBus.send({ router: 'languageSettings', type: 'languageSettings.delete.confirm', payload: { code } })
                });
                break;
            }

            case 'languageSettings.delete.confirm': {
                workflowLanguageSettings.executeDeleteLanguage({ code: msg.payload.code });
                break;
            }

            default:
                console.warn(`[routerLanguageSettings] msg.type không xác định: "${msg.type}"`, msg);
        }
    }

    return { handle };
})();

eventBus.register('languageSettings', routerLanguageSettings);
