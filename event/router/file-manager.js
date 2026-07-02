/**
 * event/router/file-manager.js — Router tên "fileManager", tự đăng ký với eventBus lúc nạp.
 * Ver 12 "Multi Media" (plan-v12-multimedia.md mục 2) — khung điều hướng File Manager.
 *
 * Cả 3 msg.type đều cần ≥2 hàm core nối tiếp -> giao hết cho workflowFileManager.
 *
 * NẠP SAU: event/bus.js, core/file-manager/nav.js, event/workflow/file-manager.js.
 * NẠP TRƯỚC: event/listener/file-manager.js.
 */
const routerFileManager = (() => {
    function handle(msg) {
        switch (msg.type) {
            case 'fileManager.open': {
                workflowFileManager.openFileManager();
                break;
            }
            case 'fileManager.close': {
                workflowFileManager.closeFileManager();
                break;
            }
            case 'fileManager.tab.switch': {
                const { tab } = msg.payload;
                workflowFileManager.switchFileManagerTab(tab);
                break;
            }
            default:
                console.warn(`[router:fileManager] Không nhận diện được msg.type "${msg.type}" — bỏ qua.`, msg);
        }
    }

    return { handle };
})();

eventBus.register('fileManager', routerFileManager);
