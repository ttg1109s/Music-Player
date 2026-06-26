/**
 * event/workflow/storage.js — "THẰNG THỰC THI CUỐI" của router "storage".
 *
 * QUY TẮC:
 *   - Workflow KHÔNG tự nghĩ ra logic nghiệp vụ mới — toàn bộ logic xử lý dữ liệu (loop xoá, build
 *     zip, quét corrupted...) đã tồn tại SẴN dưới dạng hàm core thuần ở js/core/storage-manager.js.
 *     Workflow chỉ là 1 CHUỖI GỌI các hàm đó ("chân tay") — đưa đúng data hàm nào cần, hàm nào
 *     không cần thì không đưa.
 *   - withLoadingShield() và alertModal()/modalChoice() ĐẶT Ở TẦNG NÀY (đã thống nhất) — core
 *     hoàn toàn không biết 2 thứ này tồn tại.
 *   - QUY TẮC SHIELD/MODAL (đã thống nhất ở patch trước): alertModal() KHÔNG bao giờ gọi BÊN
 *     TRONG callback của withLoadingShield() — luôn gọi SAU KHI shield đã đóng hẳn.
 *
 * Mỗi method tương ứng đúng 1 `msg.type` mà router "storage" quyết định cần gọi tới workflow
 * (những msg.type chỉ cần gọi thẳng 1 hàm core thì router KHÔNG gọi vào đây — xem router/storage.js).
 */
const workflowStorage = {

    /** Ứng với msg.type = 'storage.deleteBroken.click' — PHỐI HỢP 2 hàm (tFormat + modalChoice)
     *  để tạo 1 hành vi hoàn chỉnh, và cần "đẩy tiếp" message kế tiếp qua onConfirmSend.
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

    /** Ứng với msg.type = 'storage.deleteBroken.confirm' — cần PHỐI HỢP shield + hàm core xoá +
     *  2 hàm core dọn UI + alertModal -> rõ ràng là workflow (>1 hàm).
     * @param {{scanResults: Array, currentKey: string|null}} payload
     */
    async executeDeleteBroken(payload) {
        const { scanResults, currentKey } = payload;

        await withLoadingShield(t('common.storage.deletingBroken'), async () => {
            await deleteCorruptedSongs(scanResults, currentKey); // "tay" cần cả scanResults + currentKey -> đưa cả 2
            resetScanResultUI(); // "chân" không cần data gì -> không đưa gì
            renderStorageStats(); // "chân" không cần data gì -> không đưa gì
        });

        await alertModal(t('common.storage.deleteBrokenDone')); // SAU KHI shield đã đóng hẳn
    },

    /** Ứng với msg.type = 'storage.downloadThenClear.click' */
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

    /** Ứng với msg.type = 'storage.downloadThenClear.confirm' — gọi "tay" downloadAllSongsThenClear
     *  (1 hàm core, nhưng kết quả cần XỬ LÝ TIẾP theo status -> đủ phối hợp để là workflow).
     */
    async executeDownloadThenClear() {
        let result;
        await withLoadingShield(t('common.storage.zippingStart'), async () => {
            result = await downloadAllSongsThenClear((pct) => {
                loadingText.textContent = tFormat('common.storage.zippingProgress', { percent: pct });
            });
        });

        // Shield đã đóng HẲN — an toàn để hiện modal theo đúng status hàm core trả về.
        if (result.status === 'noSongs') {
            await alertModal(t('common.storage.noSongsToDownload'));
        } else if (result.status === 'zipError') {
            await alertModal(tFormat('common.storage.zipBuildError', { message: escapeHtml(result.message) }));
        } else {
            await alertModal(t('common.storage.downloadThenClearDone'));
        }
    },

    /** Ứng với msg.type = 'storage.clearNoDownload.click' */
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

    /** Ứng với msg.type = 'storage.clearNoDownload.confirm' */
    async executeClearNoDownload() {
        await withLoadingShield(t('common.storage.deletingData'), async () => {
            await clearAllSongsNoDownload();
        });
        await alertModal(t('common.storage.clearNoDownloadDone'));
    },

    /** Ứng với msg.type = 'storage.scanBroken.click' — gọi "tay" scanAllSongsForCorruption, rồi
     *  "tay" khác renderScanResultUI với đúng kết quả -> 2 hàm phối hợp -> workflow. Sau khi xong,
     *  BÁO LẠI router qua onScanComplete(results) — vì router là nơi giữ state lastScanResults
     *  (context giữa các message liên tiếp), workflow không tự giữ state đó.
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
        if (onScanComplete) onScanComplete(results); // báo kết quả lại cho router lưu state
    }
};
