/**
 * event/workflow/subtitle-modal.js — "THẰNG THỰC THI CUỐI" của router "subtitleModal".
 *
 * Chỉ 1 method cần workflow trong toàn bộ cụm: exportSrt (gọi "tay" exportSubtitlesAsSrt, rồi xử
 * lý tiếp theo status -> đủ phối hợp để là workflow). Mọi msg.type khác chỉ cần 1 hàm core,
 * router gọi thẳng (xem router/subtitle-modal.js).
 */
const workflowSubtitleModal = {
    /** Ứng với msg.type = 'subtitleModal.exportSrt.click'. */
    async exportSrt() {
        const result = exportSubtitlesAsSrt();
        if (result.status === 'empty') {
            await alertModal(t('common.subtitle.exportEmpty'));
        }
    }
};
