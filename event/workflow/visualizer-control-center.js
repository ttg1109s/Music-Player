/**
 * event/workflow/visualizer-control-center.js — "THẰNG THỰC THI CUỐI" của router
 * "visualizerControlCenter". Chỉ 2 method cần workflow (đụng IndexedDB qua delMeta/setMeta,
 * cần withLoadingShield) trong toàn bộ 7 msg.type của cụm này.
 */
const workflowVisualizerControlCenter = {

    /** Ứng với msg.type = 'visualizerControlCenter.videoEnable.change' khi TẮT — xoá blob đã lưu
     *  trong IndexedDB trước, rồi mới đồng bộ state/UI qua core. */
    async disableVideoBackground() {
        await withLoadingShield(t('common.loading.deletingVideoBg'), async () => {
            await delMeta('videoBg');
            disableVideoBackgroundState(); // core: dọn vizConfig.videoBgUrl + đồng bộ UI
        });
    },

    /** Ứng với msg.type = 'visualizerControlCenter.videoUpload.change' — lưu blob mới vào
     *  IndexedDB trước (cần shield vì IndexedDB async), rồi mới gọi "tay" applyUploadedVideoBg.
     * @param {{file: File}} payload
     */
    async uploadVideoBackground(payload) {
        const { file } = payload;
        const check = validateVideoFile(file);
        if (!check.valid) { await alertModal(check.reason); return; }
        await withLoadingShield(t('common.loading.savingVideoBg'), async () => {
            await setMeta('videoBg', file);
            applyUploadedVideoBg(file); // core: tạo blob URL + bật + đồng bộ UI (validate lại 1 lần nữa, vô hại)
        });
    }
};
