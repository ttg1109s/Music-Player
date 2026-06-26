/**
 * event/router/storage.js — Router tên "storage", tự đăng ký với eventBus lúc nạp.
 *
 * QUY TẮC RẼ NHÁNH (đã thống nhất):
 *   - Router mở message, đọc payload, xét state cần thiết.
 *   - Nếu nghiệp vụ ứng với msg.type CHỈ CẦN ĐÚNG 1 HÀM CORE -> router tự gọi thẳng hàm đó, BỎ
 *     QUA workflow hoàn toàn.
 *   - Nếu cần >1 hàm core (hoặc cần phối hợp shield/modal) -> router giao cho workflowStorage xử lý.
 *
 * STATE CONTEXT: `lastScanResults` sống Ở ĐÂY (không sống trong core, không sống trong workflow)
 * — vì đây là dữ liệu ghi nhớ GIỮA 2 LƯỢT MESSAGE LIÊN TIẾP của cùng 1 luồng nghiệp vụ (quét xong
 * ghi nhớ kết quả -> lượt bấm xoá sau dùng lại) — đúng vai "người nhận thư giữ hồ sơ vụ việc",
 * không phải vai của "thằng thực thi" (workflow) hay "công cụ thuần" (core).
 *
 * NẠP SAU: event/bus.js (cần eventBus tồn tại), js/core/storage-manager.js (cần các hàm core),
 * event/workflow/storage.js (cần workflowStorage tồn tại). NẠP TRƯỚC: event/listener/storage.js.
 */
const routerStorage = (() => {
    let lastScanResults = []; // context state — KHÔNG export biến này ra ngoài, chỉ router này được đọc/ghi

    /** @param {import('../bus.js').EventMessage} msg */
    function handle(msg) {
        switch (msg.type) {

            case 'storage.deleteBroken.click': {
                // Rẽ nhánh theo state: không có gì để xoá -> không có workflow nào phù hợp, dừng tại đây.
                if (lastScanResults.length === 0) return;
                workflowStorage.askDeleteBroken({
                    scanResults: lastScanResults,
                    // onConfirmSend KHÔNG gọi thẳng workflow xoá — nó gửi tiếp 1 message MỚI qua
                    // bus, để LƯỢT BẤM KẾ TIẾP (bấm OK trên modal) đi qua đúng quy trình
                    // listener-gửi-thư -> router-nhận-thư như mọi message khác, không có đường tắt.
                    onConfirmSend: () => eventBus.send({ router: 'storage', type: 'storage.deleteBroken.confirm', payload: {} })
                });
                break;
            }

            case 'storage.deleteBroken.confirm': {
                if (lastScanResults.length === 0) return; // kiểm tra LẠI tại thời điểm này, không dùng state cũ đã chụp
                workflowStorage.executeDeleteBroken({
                    scanResults: lastScanResults,
                    currentKey: currentKey // biến global của core (bài đang phát) — router tự đọc trực tiếp, không cần listener truyền qua payload vì đây không phải state riêng của router/listener
                });
                break;
            }

            case 'storage.downloadThenClear.click': {
                workflowStorage.askDownloadThenClear({
                    onConfirmSend: () => eventBus.send({ router: 'storage', type: 'storage.downloadThenClear.confirm', payload: {} })
                });
                break;
            }

            case 'storage.downloadThenClear.confirm': {
                workflowStorage.executeDownloadThenClear();
                break;
            }

            case 'storage.clearNoDownload.click': {
                workflowStorage.askClearNoDownload({
                    onConfirmSend: () => eventBus.send({ router: 'storage', type: 'storage.clearNoDownload.confirm', payload: {} })
                });
                break;
            }

            case 'storage.clearNoDownload.confirm': {
                workflowStorage.executeClearNoDownload();
                break;
            }

            case 'storage.scanBroken.click': {
                workflowStorage.executeScanBroken({
                    onScanComplete: (results) => { lastScanResults = results; } // router tự cập nhật context của mình
                });
                break;
            }

            case 'storage.dismissScan.click': {
                // CHỈ CẦN ĐÚNG 1 HÀM CORE (resetScanResultUI) -> gọi THẲNG, BỎ QUA workflow hoàn toàn.
                resetScanResultUI();
                lastScanResults = []; // router tự dọn context của mình theo cùng hành động
                break;
            }

            case 'storage.drawer.open': {
                // CHỈ CẦN gọi 2 hàm thuần hiển thị, KHÔNG có nhánh điều kiện, KHÔNG cần modal/shield
                // -> vẫn coi là "đủ đơn giản" để router tự làm, không cần workflow chuyên trách.
                renderStorageStats();
                resetScanResultUI();
                lastScanResults = [];
                break;
            }

            default:
                console.warn(`[router:storage] Không nhận diện được msg.type "${msg.type}" — bỏ qua.`);
        }
    }

    return { handle };
})();

eventBus.register('storage', routerStorage);
