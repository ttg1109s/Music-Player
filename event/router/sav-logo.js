/**
 * event/router/sav-logo.js — Router tên "savLogo", tự đăng ký với eventBus lúc nạp.
 *
 * Chỉ 1 msg.type, chỉ cần đúng 1 hàm core (setSavLogoExpanded, xem core/sav-logo.js) -> gọi
 * THẲNG, KHÔNG có event/workflow/sav-logo.js. `savLogoExpanded` là key `appState` (service/
 * state.js) — KHÔNG phải biến toàn cục.
 *
 * SỬA BUG (phát hiện khi rà soát ver 12): case 'savLogo.expand.toggle' cũ đọc `savLogoExpanded`
 * như 1 biến bare (sót lại từ trước khi migrate sang appState ở ver 11) — biến đó KHÔNG tồn tại ở
 * đâu cả (chỉ appState.get('savLogoExpanded') mới đúng), nên mỗi lần gọi throw ReferenceError
 * NGAY TRONG router.handle() -> setSavLogoExpanded() không bao giờ chạy tới -> bấm logo trên
 * cảm ứng (nhánh dùng 'toggle', xem event/listener/sav-logo.js) không bung ra được. Nhánh hover
 * thật (desktop, dùng 'set') không đụng dòng này nên không lộ bug — đúng cùng dạng bug đã tìm thấy
 * ở event/router/playlist-empty-state.js lúc migrate STATE ver 11 (xem lịch sử dự án).
 */
const routerSavLogo = (() => {
    function handle(msg) {
        switch (msg.type) {
            case 'savLogo.expand.set':
                setSavLogoExpanded(!!msg.payload.expand);
                break;
            case 'savLogo.expand.toggle':
                setSavLogoExpanded(!appState.get('savLogoExpanded'));
                break;
            default:
                console.warn(`[routerSavLogo] msg.type không xác định: "${msg.type}"`, msg);
        }
    }

    return { handle };
})();

eventBus.register('savLogo', routerSavLogo);
