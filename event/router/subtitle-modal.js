/**
 * event/router/subtitle-modal.js — Router tên "subtitleModal", tự đăng ký với eventBus.
 *
 * 3 msg.type (editSub/saveSub/deleteSub) đến từ listener DELEGATION duy nhất trên
 * subListContainer (xem mục 2b.8 — TRƯỚC ĐÂY là onclick inline gọi window.editSubItem/
 * saveSubItem/deleteSubItem). KHÔNG giữ state context riêng.
 *
 * MỚI: `openModal`/`closeModal` — 2 nút TRƯỚC ĐÂY "lạc" trong core/equalizer-settings.js (đã
 * xoá), nay gọi thẳng `openSubtitleModal()`/`closeSubtitleModalWithoutSaving()` (core/subtitle/subtitles.js).
 */
const routerSubtitleModal = (() => {
    function handle(msg) {
        switch (msg.type) {

            case 'subtitleModal.openModal.click': {
                openSubtitleModal();
                break;
            }

            case 'subtitleModal.closeModal.click': {
                closeSubtitleModalWithoutSaving();
                break;
            }

            case 'subtitleModal.editSub.click': {
                editSubItem(msg.payload.id);
                break;
            }

            case 'subtitleModal.saveSub.click': {
                saveSubItem(msg.payload.id);
                break;
            }

            case 'subtitleModal.deleteSub.click': {
                deleteSubItem(msg.payload.id);
                break;
            }

            case 'subtitleModal.autoTiming.click': {
                handleAutoTimingClick();
                break;
            }

            case 'subtitleModal.addLine.click': {
                addNewSubLine();
                break;
            }

            case 'subtitleModal.exportSrt.click': {
                workflowSubtitleModal.exportSrt();
                break;
            }

            case 'subtitleModal.importSrt.change': {
                importSrtFile(msg.payload.file);
                break;
            }

            case 'subtitleModal.apply.click': {
                applySubtitlesAndClose();
                break;
            }

            default:
                console.warn(`[routerSubtitleModal] msg.type không xác định: "${msg.type}"`, msg);
        }
    }

    return { handle };
})();

eventBus.register('subtitleModal', routerSubtitleModal);
