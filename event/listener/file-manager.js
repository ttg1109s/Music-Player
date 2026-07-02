/**
 * event/listener/file-manager.js — TẤT CẢ listener của cụm "fileManager" (khung điều hướng).
 * NẠP SAU CÙNG (sau bus, core, workflow, router, VÀ SAU dom-refs.js).
 */

if (btnOpenFileManager) {
    btnOpenFileManager.addEventListener('click', () => {
        eventBus.send({ router: 'fileManager', type: 'fileManager.open', payload: {} });
    });
}

if (btnCloseFileManager) {
    btnCloseFileManager.addEventListener('click', () => {
        eventBus.send({ router: 'fileManager', type: 'fileManager.close', payload: {} });
    });
}

fileManagerTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
        eventBus.send({ router: 'fileManager', type: 'fileManager.tab.switch', payload: { tab: btn.dataset.tab } });
    });
});
