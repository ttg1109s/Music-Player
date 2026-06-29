/**
 * event/listener/settings-misc.js — TẤT CẢ listener của cụm "settingsMisc" (aboutDrawer +
 * storageDrawer + appRecovery) nằm CHUNG file này — gộp vì mỗi nhánh quá nhỏ để xứng đáng 1
 * listener riêng (xem ghi chú đầu router/settings-misc.js).
 *
 * QUY TẮC (ẩn dụ "người gửi thư", không đổi):
 *   - Listener KHÔNG biết, KHÔNG quan tâm nội dung nghiệp vụ.
 *   - "Địa chỉ nhà" (msg.router) LUÔN là 'settingsMisc' cho mọi listener trong file này.
 *   - Dùng biến DOM có sẵn từ dom-refs.js, KHÔNG tự document.getElementById.
 *
 * NẠP SAU CÙNG (sau bus, core, workflow, router, VÀ SAU dom-refs.js).
 */

// ===================== aboutDrawer =====================

if (btnOpenAbout) {
    btnOpenAbout.addEventListener('click', () => {
        eventBus.send({ router: 'settingsMisc', type: 'settingsMisc.aboutDrawer.open', payload: {} });
    });
}

if (btnBackAbout) {
    btnBackAbout.addEventListener('click', () => {
        // Back trong About chỉ ẩn About — KHÔNG động vào drawer-settings (vẫn mở nguyên bên dưới).
        eventBus.send({ router: 'settingsMisc', type: 'settingsMisc.aboutDrawer.close', payload: {} });
    });
}

// ===================== storageDrawer =====================

if (btnOpenStorage) {
    btnOpenStorage.addEventListener('click', () => {
        drawerStorage.classList.remove('translate-y-full'); // thuần UI hiển thị drawer
        eventBus.send({ router: 'settingsMisc', type: 'settingsMisc.storageDrawer.open', payload: {} });
    });
}

if (btnBackStorage) {
    btnBackStorage.addEventListener('click', () => {
        drawerStorage.classList.add('translate-y-full'); // thuần UI, không có nghiệp vụ nào để gửi message
    });
}

if (btnDownloadThenClear) {
    btnDownloadThenClear.addEventListener('click', () => {
        eventBus.send({ router: 'settingsMisc', type: 'settingsMisc.downloadThenClear.click', payload: {} });
    });
}

if (btnClearNoDownload) {
    btnClearNoDownload.addEventListener('click', () => {
        eventBus.send({ router: 'settingsMisc', type: 'settingsMisc.clearNoDownload.click', payload: {} });
    });
}

if (btnScanBroken) {
    btnScanBroken.addEventListener('click', () => {
        eventBus.send({ router: 'settingsMisc', type: 'settingsMisc.scanBroken.click', payload: {} });
    });
}

if (btnDeleteBroken) {
    btnDeleteBroken.addEventListener('click', () => {
        // Không cần gửi gì trong payload — router tự đọc lastScanResults + currentKey trực tiếp.
        eventBus.send({ router: 'settingsMisc', type: 'settingsMisc.deleteBroken.click', payload: {} });
    });
}

if (btnDismissScan) {
    btnDismissScan.addEventListener('click', () => {
        eventBus.send({ router: 'settingsMisc', type: 'settingsMisc.dismissScan.click', payload: {} });
    });
}

// ===================== appRecovery =====================

if (typeof btnRestartApp !== 'undefined' && btnRestartApp) {
    btnRestartApp.addEventListener('click', () => {
        eventBus.send({ router: 'settingsMisc', type: 'settingsMisc.restartApp.click', payload: {} });
    });
}

if (typeof btnRestoreDefaults !== 'undefined' && btnRestoreDefaults) {
    btnRestoreDefaults.addEventListener('click', () => {
        eventBus.send({ router: 'settingsMisc', type: 'settingsMisc.restoreDefaults.click', payload: {} });
    });
}
