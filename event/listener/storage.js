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
 * FIX (sau review): KHÔNG tự document.getElementById trong file này — project đã có quy ước
 * CHUNG là dom-refs.js là nơi DUY NHẤT gọi getElementById, mọi nơi khác (kể cả /event/) chỉ DÙNG
 * LẠI biến đã có sẵn ở đó (drawerStorage, btnOpenStorage, btnDeleteBroken, v.v. — xem
 * js/core/dom-refs.js, khối "Quản lý dung lượng"). Vi phạm quy ước này sẽ tạo ra 2 nguồn tham
 * chiếu cho cùng 1 phần tử DOM, dễ lệch nhau khi sửa id trong template HTML sau này.
 *
 * NẠP SAU CÙNG (sau bus, core, workflow, router, VÀ SAU dom-refs.js) — cần cả eventBus.send() và
 * mọi biến DOM (btnOpenStorage, drawerStorage,...) đã sẵn sàng trước khi gắn addEventListener.
 */

if (btnOpenStorage) {
    btnOpenStorage.addEventListener('click', () => {
        drawerStorage.classList.remove('translate-y-full'); // thuần UI hiển thị drawer — không phải nghiệp vụ, listener tự làm luôn cũng được vì không gọi hàm core nghiệp vụ nào
        eventBus.send({ router: 'storage', type: 'storage.drawer.open', payload: {} });
    });
}

if (btnBackStorage) {
    btnBackStorage.addEventListener('click', () => {
        drawerStorage.classList.add('translate-y-full'); // thuần UI, không có nghiệp vụ nào để gửi message
    });
}

if (btnDownloadThenClear) {
    btnDownloadThenClear.addEventListener('click', () => {
        eventBus.send({ router: 'storage', type: 'storage.downloadThenClear.click', payload: {} });
    });
}

if (btnClearNoDownload) {
    btnClearNoDownload.addEventListener('click', () => {
        eventBus.send({ router: 'storage', type: 'storage.clearNoDownload.click', payload: {} });
    });
}

if (btnScanBroken) {
    btnScanBroken.addEventListener('click', () => {
        eventBus.send({ router: 'storage', type: 'storage.scanBroken.click', payload: {} });
    });
}

if (btnDeleteBroken) {
    btnDeleteBroken.addEventListener('click', () => {
        // Không cần gửi gì trong payload — router tự đọc lastScanResults (state riêng của router)
        // và currentKey (biến global của core) trực tiếp khi xử lý message này.
        eventBus.send({ router: 'storage', type: 'storage.deleteBroken.click', payload: {} });
    });
}

if (btnDismissScan) {
    btnDismissScan.addEventListener('click', () => {
        eventBus.send({ router: 'storage', type: 'storage.dismissScan.click', payload: {} });
    });
}
