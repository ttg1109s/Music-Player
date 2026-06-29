/**
 * event/workflow/settings-misc.js — "THẰNG THỰC THI CUỐI" của router "settingsMisc".
 *
 * Gộp 3 nhánh: `storageDrawer` (Quản lý dung lượng — nguyên workflow cũ của router "storage"),
 * `appRecovery` (Khởi động lại / Khôi phục mặc định). `aboutDrawer` KHÔNG cần workflow (chỉ 1 hàm
 * core mỗi msg.type, router gọi thẳng — xem router/settings-misc.js).
 *
 * QUY TẮC (không đổi so với mẫu storage gốc):
 *   - Workflow KHÔNG tự nghĩ ra logic nghiệp vụ mới — chỉ là 1 CHUỖI GỌI hàm core đã có sẵn.
 *   - withLoadingShield() và alertModal()/modalChoice() ĐẶT Ở TẦNG NÀY — core không biết 2 thứ
 *     này tồn tại.
 *   - alertModal() KHÔNG bao giờ gọi BÊN TRONG callback của withLoadingShield() — luôn gọi SAU
 *     KHI shield đã đóng hẳn.
 */
const workflowSettingsMisc = {

    // ===================== storageDrawer (nguyên vẹn từ workflowStorage cũ) =====================

    /** Ứng với msg.type = 'settingsMisc.deleteBroken.click'.
     * @param {{scanResults: Array, onConfirmSend: () => void}} payload
     */
    askDeleteBroken(payload) {
        const { scanResults, onConfirmSend } = payload;
        modalChoice(
            tFormat('common.storage.deleteBrokenConfirm', { n: scanResults.length }),
            [
                { label: t('common.cancel'), className: 'flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors', onClick: () => {} },
                { label: t('common.storage.deleteBrokenConfirmBtn'), className: 'flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold transition-colors', onClick: onConfirmSend }
            ],
            { title: t('common.storage.deleteBrokenTitle') }
        );
    },

    /** Ứng với msg.type = 'settingsMisc.deleteBroken.confirm'.
     * @param {{scanResults: Array, currentKey: string|null}} payload
     */
    async executeDeleteBroken(payload) {
        const { scanResults, currentKey } = payload;

        await withLoadingShield(t('common.storage.deletingBroken'), async () => {
            await deleteCorruptedSongs(scanResults, currentKey);
            resetScanResultUI();
            renderStorageStats();
        });

        await alertModal(t('common.storage.deleteBrokenDone'));
    },

    /** Ứng với msg.type = 'settingsMisc.downloadThenClear.click'. */
    askDownloadThenClear(payload) {
        const { onConfirmSend } = payload;
        modalChoice(
            t('common.storage.downloadThenClearConfirm'),
            [
                { label: t('common.cancel'), className: 'flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors', onClick: () => {} },
                { label: t('common.storage.downloadThenClearConfirmBtn'), className: 'flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold transition-colors', onClick: onConfirmSend }
            ],
            { title: t('common.storage.downloadThenClearTitle') }
        );
    },

    /** Ứng với msg.type = 'settingsMisc.downloadThenClear.confirm'. */
    async executeDownloadThenClear() {
        let result;
        await withLoadingShield(t('common.storage.zippingStart'), async () => {
            result = await downloadAllSongsThenClear((pct) => {
                loadingText.textContent = tFormat('common.storage.zippingProgress', { percent: pct });
            });
        });

        if (result.status === 'noSongs') {
            await alertModal(t('common.storage.noSongsToDownload'));
        } else if (result.status === 'zipError') {
            await alertModal(tFormat('common.storage.zipBuildError', { message: escapeHtml(result.message) }));
        } else {
            await alertModal(t('common.storage.downloadThenClearDone'));
        }
    },

    /** Ứng với msg.type = 'settingsMisc.clearNoDownload.click'. */
    askClearNoDownload(payload) {
        const { onConfirmSend } = payload;
        modalChoice(
            t('common.storage.clearNoDownloadConfirm'),
            [
                { label: t('common.cancel'), className: 'flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors', onClick: () => {} },
                { label: t('common.storage.clearNoDownloadConfirmBtn'), className: 'flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold transition-colors', onClick: onConfirmSend }
            ],
            { title: t('common.storage.clearNoDownloadTitle') }
        );
    },

    /** Ứng với msg.type = 'settingsMisc.clearNoDownload.confirm'. */
    async executeClearNoDownload() {
        await withLoadingShield(t('common.storage.deletingData'), async () => {
            await clearAllSongsNoDownload();
        });
        await alertModal(t('common.storage.clearNoDownloadDone'));
    },

    /** Ứng với msg.type = 'settingsMisc.scanBroken.click'.
     * @param {{onScanComplete: (results: Array) => void}} payload
     */
    async executeScanBroken(payload) {
        const { onScanComplete } = payload;
        let results;
        await withLoadingShield(t('common.storage.scanning'), async () => {
            results = await scanAllSongsForCorruption((current, total) => {
                loadingText.textContent = tFormat('common.storage.scanningProgress', { n: current, total });
            });
            renderScanResultUI(results);
        });
        if (onScanComplete) onScanComplete(results);
    },

    // ===================== appRecovery =====================

    /** Ứng với msg.type = 'settingsMisc.restartApp.click' — modal xác nhận; OK gửi tiếp message
     *  MỚI qua bus ('settingsMisc.restartApp.confirm'), không gọi tắt thẳng core (đúng mục 2.1). */
    askRestartApp(payload) {
        const { onConfirmSend } = payload;
        modalChoice(
            t('common.appRecovery.restartBody'),
            [
                { label: t('common.cancel'), className: 'flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors', onClick: () => {} },
                { label: t('common.appRecovery.restartConfirmBtn'), className: 'flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold transition-colors', onClick: onConfirmSend }
            ],
            { title: t('common.appRecovery.restartTitle') }
        );
    },

    /** Ứng với msg.type = 'settingsMisc.restoreDefaults.click'. */
    askRestoreDefaults(payload) {
        const { onConfirmSend } = payload;
        modalChoice(
            t('common.appRecovery.restoreDefaultsBody'),
            [
                { label: t('common.cancel'), className: 'flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors', onClick: () => {} },
                { label: t('common.appRecovery.restoreDefaultsConfirmBtn'), className: 'flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold transition-colors', onClick: onConfirmSend }
            ],
            { title: t('common.appRecovery.restoreDefaultsTitle') }
        );
    }
};
