/**
 * event/listener/storage.js — TẤT CẢ listener thuộc chức năng "Quản lý lưu trữ" (Storage
 * Management) nằm CHUNG file này, không phân nhỏ theo từng nút — ranh giới nhóm theo CHỨC NĂNG.
 *
 * QUY TẮC (đã thống nhất — ẩn dụ "người gửi thư"):
 *   - Listener KHÔNG biết, KHÔNG quan tâm nội dung nghiệp vụ là gì.
 *   - Mỗi handler CHỈ làm 1 việc: gom đúng data cần gửi (đọc biến global hiện có SẴN ở core,
 *     KHÔNG tạo state mới, KHÔNG tính toán gì) rồi gửi 1 message qua eventBus.send().
 *   - "Địa chỉ nhà" (msg.router) LUÔN là 'storage' cho mọi listener trong file này.
 *
 * NẠP SAU CÙNG (sau bus, core, workflow, router) — vì lúc gắn addEventListener, eventBus.send()
 * phải đã sẵn sàng để gọi ngay khi người dùng bấm.
 */

const btnOpenStorage = document.getElementById('setting-open-storage');
if (btnOpenStorage) {
    btnOpenStorage.addEventListener('click', () => {
        drawerStorage.classList.remove('translate-y-full'); // thuần UI hiển thị drawer — không phải nghiệp vụ, listener tự làm luôn cũng được vì không gọi hàm core nghiệp vụ nào
        eventBus.send({ router: 'storage', type: 'storage.drawer.open', payload: {} });
    });
}

const btnBackStorage = document.getElementById('btn-back-storage');
if (btnBackStorage) {
    btnBackStorage.addEventListener('click', () => {
        drawerStorage.classList.add('translate-y-full'); // thuần UI, không có nghiệp vụ nào để gửi message
    });
}

const btnDownloadThenClear = document.getElementById('btn-storage-download-then-clear');
if (btnDownloadThenClear) {
    btnDownloadThenClear.addEventListener('click', () => {
        eventBus.send({ router: 'storage', type: 'storage.downloadThenClear.click', payload: {} });
    });
}

const btnClearNoDownload = document.getElementById('btn-storage-clear-no-download');
if (btnClearNoDownload) {
    btnClearNoDownload.addEventListener('click', () => {
        eventBus.send({ router: 'storage', type: 'storage.clearNoDownload.click', payload: {} });
    });
}

const btnScanBroken = document.getElementById('btn-storage-scan-broken');
if (btnScanBroken) {
    btnScanBroken.addEventListener('click', () => {
        eventBus.send({ router: 'storage', type: 'storage.scanBroken.click', payload: {} });
    });
}

const btnDeleteBroken = document.getElementById('btn-storage-delete-broken');
if (btnDeleteBroken) {
    btnDeleteBroken.addEventListener('click', () => {
        // Không cần gửi gì trong payload — router tự đọc lastScanResults (state riêng của router)
        // và currentKey (biến global của core) trực tiếp khi xử lý message này.
        eventBus.send({ router: 'storage', type: 'storage.deleteBroken.click', payload: {} });
    });
}

const btnDismissScan = document.getElementById('btn-storage-dismiss-scan');
if (btnDismissScan) {
    btnDismissScan.addEventListener('click', () => {
        eventBus.send({ router: 'storage', type: 'storage.dismissScan.click', payload: {} });
    });
}
