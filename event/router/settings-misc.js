/**
 * event/router/settings-misc.js — Router tên "settingsMisc", tự đăng ký với eventBus lúc nạp.
 *
 * Gộp 3 nhánh ĐIỀU HƯỚNG/CHỨC NĂNG nhỏ của Settings vào 1 router (không phải vì cùng nghiệp vụ,
 * mà vì mỗi nhánh quá nhỏ để xứng đáng 1 router/listener riêng — quyết định gom nhóm đã thống
 * nhất, xem plan.md):
 *   - `aboutDrawer`   — mở/đóng About Drawer + render thống kê (CHA của storageDrawer trong cây
 *                       điều hướng Settings -> About -> Storage).
 *   - `storageDrawer` — Quản lý dung lượng (CON của aboutDrawer — mở từ trong About). Toàn bộ
 *                       msg.type giữ TÊN CŨ về Ý NGHĨA nghiệp vụ (đổi tiền tố 'storage.' thành
 *                       'settingsMisc.', xem bảng đối chiếu cuối file).
 *   - `appRecovery`   — Khởi động lại app / Khôi phục cài đặt mặc định (anh em CÙNG CẤP với
 *                       aboutDrawer trong Settings, KHÔNG phải con của About).
 *
 * QUY TẮC RẼ NHÁNH (không đổi so với mẫu storage gốc):
 *   - Nghiệp vụ CHỈ CẦN ĐÚNG 1 HÀM CORE -> router tự gọi thẳng, BỎ QUA workflow.
 *   - Cần >1 hàm core (hoặc modal/shield) -> router giao cho workflowSettingsMisc.
 *
 * STATE CONTEXT: `lastScanResults` (của nhánh storageDrawer) sống Ở ĐÂY, giữ nguyên y hệt cách
 * router "storage" cũ làm (closure `let`, KHÔNG dùng EventStore — đúng code thật hiện tại, xem
 * ghi chú trong plan.md về điểm lệch giữa tài liệu cũ và code thật).
 *
 * NẠP SAU: event/bus.js, core/about-stats.js, core/storage-manager.js, core/app-recovery.js
 * (cần các hàm core), event/workflow/settings-misc.js (cần workflowSettingsMisc tồn tại).
 * NẠP TRƯỚC: event/listener/settings-misc.js.
 */
const routerSettingsMisc = (() => {
    let lastScanResults = []; // context state CỦA RIÊNG nhánh storageDrawer — KHÔNG export ra ngoài

    /** @param {import('../bus.js').EventMessage} msg */
    function handle(msg) {
        switch (msg.type) {

            // ===================== aboutDrawer =====================

            case 'settingsMisc.aboutDrawer.open': {
                // CHỈ CẦN ĐÚNG 1 HÀM CORE (gộp mở drawer + render thống kê) -> gọi THẲNG.
                openAboutDrawerAndRenderStats();
                break;
            }

            case 'settingsMisc.aboutDrawer.close': {
                closeAboutDrawer();
                break;
            }

            // ===================== storageDrawer (nguyên vẹn logic từ router "storage" cũ) =====================

            case 'settingsMisc.storageDrawer.open': {
                renderStorageStats();
                resetScanResultUI();
                lastScanResults = [];
                break;
            }

            case 'settingsMisc.deleteBroken.click': {
                if (lastScanResults.length === 0) return;
                workflowSettingsMisc.askDeleteBroken({
                    scanResults: lastScanResults,
                    onConfirmSend: () => eventBus.send({ router: 'settingsMisc', type: 'settingsMisc.deleteBroken.confirm', payload: {} })
                });
                break;
            }

            case 'settingsMisc.deleteBroken.confirm': {
                if (lastScanResults.length === 0) return;
                workflowSettingsMisc.executeDeleteBroken({
                    scanResults: lastScanResults,
                    currentKey: currentKey
                });
                break;
            }

            case 'settingsMisc.downloadThenClear.click': {
                workflowSettingsMisc.askDownloadThenClear({
                    onConfirmSend: () => eventBus.send({ router: 'settingsMisc', type: 'settingsMisc.downloadThenClear.confirm', payload: {} })
                });
                break;
            }

            case 'settingsMisc.downloadThenClear.confirm': {
                workflowSettingsMisc.executeDownloadThenClear();
                break;
            }

            case 'settingsMisc.clearNoDownload.click': {
                workflowSettingsMisc.askClearNoDownload({
                    onConfirmSend: () => eventBus.send({ router: 'settingsMisc', type: 'settingsMisc.clearNoDownload.confirm', payload: {} })
                });
                break;
            }

            case 'settingsMisc.clearNoDownload.confirm': {
                workflowSettingsMisc.executeClearNoDownload();
                break;
            }

            case 'settingsMisc.scanBroken.click': {
                workflowSettingsMisc.executeScanBroken({
                    onScanComplete: (results) => { lastScanResults = results; }
                });
                break;
            }

            case 'settingsMisc.dismissScan.click': {
                resetScanResultUI();
                lastScanResults = [];
                break;
            }

            // ===================== appRecovery =====================

            case 'settingsMisc.restartApp.click': {
                workflowSettingsMisc.askRestartApp({
                    onConfirmSend: () => eventBus.send({ router: 'settingsMisc', type: 'settingsMisc.restartApp.confirm', payload: {} })
                });
                break;
            }

            case 'settingsMisc.restartApp.confirm': {
                executeRestartApp();
                break;
            }

            case 'settingsMisc.restoreDefaults.click': {
                workflowSettingsMisc.askRestoreDefaults({
                    onConfirmSend: () => eventBus.send({ router: 'settingsMisc', type: 'settingsMisc.restoreDefaults.confirm', payload: {} })
                });
                break;
            }

            case 'settingsMisc.restoreDefaults.confirm': {
                executeRestoreDefaults();
                break;
            }

            default:
                console.warn(`[router:settingsMisc] Không nhận diện được msg.type "${msg.type}" — bỏ qua.`);
        }
    }

    return { handle };
})();

eventBus.register('settingsMisc', routerSettingsMisc);

/**
 * Bảng đối chiếu msg.type CŨ (router "storage", đã xoá) -> MỚI (router "settingsMisc"), để dò
 * ngược khi cần — chỉ đổi tiền tố 'storage.' -> 'settingsMisc.', Ý NGHĨA nghiệp vụ giữ y nguyên:
 *   storage.drawer.open          -> settingsMisc.storageDrawer.open
 *   storage.deleteBroken.click   -> settingsMisc.deleteBroken.click
 *   storage.deleteBroken.confirm -> settingsMisc.deleteBroken.confirm
 *   storage.downloadThenClear.click/.confirm -> settingsMisc.downloadThenClear.click/.confirm
 *   storage.clearNoDownload.click/.confirm   -> settingsMisc.clearNoDownload.click/.confirm
 *   storage.scanBroken.click     -> settingsMisc.scanBroken.click
 *   storage.dismissScan.click    -> settingsMisc.dismissScan.click
 */
