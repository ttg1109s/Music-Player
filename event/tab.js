/**
 * event/tab.js — 3 lifecycle listener đặc thù của tab, gọi thẳng hàm (không qua bus).
 *
 * Không qua bus vì không có định tuyến: mỗi sự kiện ánh xạ 1-1 đến đúng 1 hàm,
 * không có ngữ cảnh DOM cụ thể (không phải click nút hay input nào), không có
 * msg.type nghiệp vụ hợp lý để đặt tên.
 *
 * Tập trung ở đây để dễ mở rộng: thêm việc cần làm khi ẩn/đóng tab → sửa đúng chỗ này,
 * không phải lùng trong từng file core.
 *
 * PHẢI nạp SAU: core/tab-hide-reload.js (triggerHideAndReload, _isRealUnloadHappening),
 *   core/app-cleanup.js (executeAppCleanup).
 * NẠP CUỐI CÙNG trong khối /event/ (sau tất cả router/listener khác) vì đây là
 * lifecycle toàn trang, không phụ thuộc thứ tự với các cụm nghiệp vụ còn lại.
 */

// ── Ẩn tab thật (chuyển tab, khoá máy, thu nhỏ) ─────────────────────────────
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') triggerHideAndReload();
});

// ── Dự phòng iOS Safari (pagehide đáng tin hơn visibilitychange trên WebKit) ─
window.addEventListener('pagehide', triggerHideAndReload);

// ── F5 / đóng tab / điều hướng thật ─────────────────────────────────────────
window.addEventListener('beforeunload', () => {
    appState.set('_isRealUnloadHappening', true); // huỷ triggerHideAndReload() đang chờ (nếu có)
    executeAppCleanup();
});
