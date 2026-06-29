/**
 * event/listener/playlist-empty-state.js — listener cho 2 nút "Phát"/"Trộn bài" của empty-state
 * playlist (TRƯỚC ĐÂY onclick inline trong components/playlist-view.js, xem mục 2b.8).
 */
if (btnPlaylistEmptyPlay) {
    btnPlaylistEmptyPlay.addEventListener('click', () => {
        eventBus.send({ router: 'playlistEmptyState', type: 'playlistEmptyState.play.click', payload: {} });
    });
}

if (btnPlaylistEmptyShuffle) {
    btnPlaylistEmptyShuffle.addEventListener('click', () => {
        eventBus.send({ router: 'playlistEmptyState', type: 'playlistEmptyState.shuffle.click', payload: {} });
    });
}
