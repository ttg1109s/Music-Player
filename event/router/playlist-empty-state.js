/**
 * event/router/playlist-empty-state.js — Router tên "playlistEmptyState".
 *
 * Cả 2 msg.type chỉ cần ĐÚNG 1 hành động, dùng lại các API/biến STATE ĐÃ CÓ SẴN (window.playSong,
 * appState.get('displayOrder')/('currentKey')/('isShuffle')/('playlistOrder')/('shuffleIndices'),
 * btnShuffle — xem mục 2b.4/2b.5: đây là hàm core toàn cục gắn window.X, không phải listener) ->
 * gọi THẲNG, KHÔNG có event/workflow/playlist-empty-state.js.
 */
const routerPlaylistEmptyState = (() => {
    function handle(msg) {
        switch (msg.type) {
            case 'playlistEmptyState.play.click': {
                const displayOrder = appState.get('displayOrder');
                if (displayOrder.length > 0) playSong(appState.get('currentKey') || displayOrder[0]);
                break;
            }
            case 'playlistEmptyState.shuffle.click': {
                if (!appState.get('isShuffle')) btnShuffle.click();
                if (appState.get('playlistOrder').length > 0) playSong(appState.get('shuffleIndices')[0]);
                break;
            }
            default:
                console.warn(`[routerPlaylistEmptyState] msg.type không xác định: "${msg.type}"`, msg);
        }
    }

    return { handle };
})();

eventBus.register('playlistEmptyState', routerPlaylistEmptyState);
