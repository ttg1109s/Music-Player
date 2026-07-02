/**
 * main.js — Bootstrap của ứng dụng.
 *
 * File này PHẢI được nạp NGAY SAU các file components/*.js (chúng chỉ định nghĩa
 * các biến TPL_* chứa chuỗi HTML) và PHẢI chạy TRƯỚC TOÀN BỘ các file js/core/*.js
 * và core/visualizer/*.js, vì các file đó dùng document.getElementById(...) ngay khi
 * được nạp — nếu DOM chưa có các phần tử tương ứng, code sẽ lỗi (null reference).
 *
 * Cơ chế: mỗi component là một chuỗi HTML (TPL_...) được "lắp" (mount) vào đúng vị
 * trí của nó trong <div id="app-root"> bằng innerHTML, theo đúng thứ tự xuất hiện
 * trong file gốc ban đầu (loading-shield, playlist-view, visualizer-overlay,
 * subtitle-modal, bottom-player, settings-drawer).
 *
 * Không dùng fetch()/import vì ứng dụng được thiết kế để chạy trực tiếp qua
 * file:// (mở file index.html bằng double-click), không qua server.
 */
(function mountComponents() {
    const appRoot = document.getElementById('app-root');
    if (!appRoot) {
        console.error('[main.js] Không tìm thấy #app-root trong index.html — không thể lắp giao diện.');
        return;
    }

    // Thứ tự lắp ghép PHẢI giống thứ tự các block trong file HTML gốc.
    // Ver 12 "Multi Media": TPL_STORAGE_DRAWER (About -> Storage cũ) THAY bằng TPL_FILE_MANAGER —
    // nội dung "Quản lý dung lượng" đã dời sang File Manager -> Song (xem components/file-manager.js
    // đầu file, mục 3 plan-v12-multimedia.md). File components/storage-drawer.js CŨ không còn được
    // mount ở đây nữa (còn để lại trong project làm tư liệu, không tự xoá).
    appRoot.innerHTML =
        TPL_LOADING_SHIELD +
        TPL_PLAYLIST_VIEW +
        TPL_VISUALIZER_OVERLAY +
        TPL_SUBTITLE_MODAL +
        TPL_BOTTOM_PLAYER +
        TPL_SETTINGS_DRAWER +
        TPL_ABOUT_DRAWER +
        TPL_FILE_MANAGER +
        TPL_VISUALIZER_SETTINGS_DRAWER +
        TPL_SUBTITLE_SETTINGS_DRAWER;
})();
