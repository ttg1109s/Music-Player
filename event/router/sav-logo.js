/**
 * event/router/sav-logo.js — Router tên "savLogo", tự đăng ký với eventBus lúc nạp.
 *
 * Chỉ 1 msg.type, chỉ cần đúng 1 hàm core (setSavLogoExpanded, xem core/sav-logo.js) -> gọi
 * THẲNG, KHÔNG có event/workflow/sav-logo.js. KHÔNG giữ state context riêng (savLogoExpanded là
 * global ở core, không phải state context của router).
 */
const routerSavLogo = (() => {
    function handle(msg) {
        switch (msg.type) {
            case 'savLogo.expand.set':
                setSavLogoExpanded(!!msg.payload.expand);
                break;
            case 'savLogo.expand.toggle':
                setSavLogoExpanded(!savLogoExpanded);
                break;
            default:
                console.warn(`[routerSavLogo] msg.type không xác định: "${msg.type}"`, msg);
        }
    }

    return { handle };
})();

eventBus.register('savLogo', routerSavLogo);
