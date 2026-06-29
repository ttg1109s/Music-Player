/**
 * event/router/playlist-empty-state.js — Router tên "playlistEmptyState".
 *
 * Cả 2 msg.type chỉ cần ĐÚNG 1 hành động, dùng lại các API/biến global ĐÃ CÓ SẴN (window.playSong,
 * displayOrder, currentKey, isShuffle, btnShuffle, playlistOrder, shuffleIndices — xem mục 2b.4/
 * 2b.5: đây là hàm core toàn cục gắn window.X, không phải listener) -> gọi THẲNG, KHÔNG có
 * event/workflow/playlist-empty-state.js.
 */
const routerPlaylistEmptyState = (() => {
    function handle(msg) {
        switch (msg.type) {
            case 'playlistEmptyState.play.click': {
                if (displayOrder.length > 0) playSong(currentKey || displayOrder[0]);
                break;
            }
            case 'playlistEmptyState.shuffle.click': {
                if (!isShuffle) btnShuffle.click();
                if (playlistOrder.length > 0) playSong(shuffleIndices[0]);
                break;
            }
            default:
                console.warn(`[routerPlaylistEmptyState] msg.type không xác định: "${msg.type}"`, msg);
        }
    }

    return { handle };
})();

eventBus.register('playlistEmptyState', routerPlaylistEmptyState);
