/**
 * event/workflow/visualizer-display.js — "THẰNG THỰC THI CUỐI" của router "visualizerDisplay".
 *
 * QUY TẮC (giống workflow/storage.js, workflow/playlist.js):
 *   - Workflow KHÔNG tự nghĩ ra logic nghiệp vụ mới — chỉ gọi các hàm core thuần đã có ở
 *     visualizers/visualizer-display.js.
 *   - withLoadingShield() và alertModal() ĐẶT Ở TẦNG NÀY — core hoàn toàn không biết 2 thứ này
 *     tồn tại.
 *   - QUY TẮC SHIELD/MODAL: alertModal() KHÔNG bao giờ gọi BÊN TRONG callback của
 *     withLoadingShield() — luôn gọi SAU KHI shield đã đóng hẳn.
 *
 * Chỉ 2 msg.type của router "visualizerDisplay" cần shield (đụng IndexedDB qua setMeta/delMeta)
 * -> được giao cho workflow xử lý ở đây: 'visualizerDisplay.bgImage.upload' và
 * 'visualizerDisplay.bgImage.toggle'. Mọi msg.type còn lại router tự gọi thẳng 1 hàm core, KHÔNG
 * đi qua workflow (xem router/visualizer-display.js).
 */
const workflowVisualizerDisplay = {

    /**
     * Ứng với msg.type = 'visualizerDisplay.bgImage.upload' — cần VALIDATE (có thể fail ->
     * alertModal) rồi PHỐI HỢP shield + hàm core lưu ảnh -> rõ ràng là workflow.
     * @param {{file: File}} payload
     */
    async uploadBgImage(payload) {
        const { file } = payload;
        const check = validateBgImageFile(file); // core thuần, trả {status, reason?}
        if (check.status === 'invalid') {
            await alertModal(check.reason);
            return;
        }
        await withLoadingShield(t('common.loading.savingImageBg'), async () => {
            await applyBgImage(check.file); // "tay" cần file -> đưa file
        });
    },

    /**
     * Ứng với msg.type = 'visualizerDisplay.bgImage.toggle' — cần PHỐI HỢP shield (đụng
     * IndexedDB qua setMeta/delMeta bên trong applyBgImageEnabled) -> workflow, dù chỉ gọi 1 hàm
     * core (tiêu chí shield, không phải tiêu chí "đếm số hàm core" — xem mục 2 quy tắc 4 của
     * plan.md: bất kỳ msg.type cần shield/modal đều qua workflow).
     * @param {{enabled: boolean}} payload
     */
    async toggleBgImage(payload) {
        const { enabled } = payload;
        await withLoadingShield(enabled ? t('common.loading.generic') : t('common.loading.deletingImageBg'), async () => {
            await applyBgImageEnabled(enabled); // "tay" cần enabled -> đưa enabled
        });
    }
};
