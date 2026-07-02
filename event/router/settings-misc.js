/**
 * event/router/settings-misc.js — Router tên "settingsMisc", tự đăng ký với eventBus lúc nạp.
 *
 * Gộp 2 nhánh ĐIỀU HƯỚNG/CHỨC NĂNG nhỏ của Settings vào 1 router (không phải vì cùng nghiệp vụ, mà
 * vì mỗi nhánh quá nhỏ để xứng đáng 1 router/listener riêng — quyết định gom nhóm đã thống nhất,
 * xem plan.md):
 *   - `aboutDrawer`   — mở/đóng About Drawer + render thống kê.
 *   - `appRecovery`   — Khởi động lại app / Khôi phục cài đặt mặc định.
 *
 * Ver 12 "Multi Media": nhánh `storageDrawer` (CON của aboutDrawer, "Quản lý dung lượng") đã DỜI
 * sang cụm "fileManagerSong" (event/router/file-manager-song.js, plan-v12-multimedia.md mục 3) —
 * File Manager giờ là điều hướng CẤP CAO riêng, không còn lồng trong About nữa.
 *
 * QUY TẮC RẼ NHÁNH:
 *   - Nghiệp vụ CHỈ CẦN ĐÚNG 1 HÀM CORE -> router tự gọi thẳng, BỎ QUA workflow.
 *   - Cần >1 hàm core (hoặc modal/shield) -> router giao cho workflowSettingsMisc.
 *
 * NẠP SAU: event/bus.js, core/about-stats.js, core/app-recovery.js (cần các hàm core),
 * event/workflow/settings-misc.js (cần workflowSettingsMisc tồn tại).
 * NẠP TRƯỚC: event/listener/settings-misc.js.
 */
const routerSettingsMisc = (() => {
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

            // (storageDrawer đã dời sang cụm "fileManagerSong" — xem header comment ở trên)

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
