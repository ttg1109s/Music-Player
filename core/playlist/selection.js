/**
 * core/playlist/selection.js — "Chọn nhiều" trong Playlist, ver 12 "Multi Media"
 * (plan-v12-multimedia.md mục 4.b1). Cụm event sở hữu: `playlist` (đã chốt — không phải
 * `fileManagerSong`, xem trao đổi plan).
 *
 * setSelectionMode()/toggleSongSelection() theo ĐÚNG pattern đã có sẵn của setDisplaySortMode()
 * (core/playlist/order.js)/setPlaylistViewMode() (core/playlist/main.js) trong CÙNG cụm playlist —
 * đổi 1 field UI-state rồi vẽ lại NGAY là 1 hành động UI gắn chặt duy nhất, không phải chuỗi
 * nhiều tiến trình nghiệp vụ tách rời (khác 4 hành động thật sự đa bước — Phát đã chọn/Xuất ZIP/
 * Thêm vào thư mục/Xoá hàng loạt — đi qua workflow, xem event/workflow/playlist.js). Vẫn tuân
 * Rule 2 (core-function-conventions.md): không tự appState.get() field NGOÀI chính collection
 * đang mutate — router tự đọc field cần thiết rồi truyền vào nếu có.
 *
 * NẠP SAU: core/playlist/render.js (renderPlaylistFull), core/dom-refs.js (selectionActionBar...).
 */

function setSelectionMode(enabled) {
    appState.set('selectionMode', enabled);
    console.log(`writer: "setSelectionMode", page: "selectionMode", content: "${enabled}"`);
    if (!enabled) {
        appState.mutate('selectedSongKeys', s => s.clear());
        console.log(`writer: "setSelectionMode", page: "selectedSongKeys", content: "clear khi tắt chế độ chọn"`);
    }
    renderPlaylistFull();
    updateSelectionActionBar();
}

/** Toggle đúng 1 songKey trong tập đã chọn — đọc/ghi collection ĐANG mutate qua `s`, KHÔNG phải
 * appState.get() 1 field khác (đúng phạm vi cho phép của mutate(), xem service/state.js). */
function toggleSongSelection(key) {
    appState.mutate('selectedSongKeys', s => { if (s.has(key)) s.delete(key); else s.add(key); });
    console.log(`writer: "toggleSongSelection", page: "selectedSongKeys", content: "toggle ${key}"`);
    renderPlaylistFull();
    updateSelectionActionBar();
}

/** Thuần "vẽ lại theo state hiện có" (số lượng đã chọn, ẩn/hiện thanh hành động) — cùng vai trò
 * với renderPlaylistFull()/updateEmptyState() (render.js), tự appState.get() theo ĐÚNG idiom đã
 * có sẵn của cả cụm playlist cho nhóm hàm "paint state ra DOM" (khác hàm NGHIỆP VỤ ở Rule 2). */
function updateSelectionActionBar() {
    if (!selectionActionBar) return;
    const enabled = appState.get('selectionMode');
    const count = appState.get('selectedSongKeys').size;
    selectionActionBar.classList.toggle('hidden', !enabled);
    if (selectionCountLabel) selectionCountLabel.textContent = tFormat('playlistView.selection.countLabel', { count });
}
