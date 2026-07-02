/**
 * core/playlist/bulk-actions.js — Hàm core cho hành động "Xoá hàng loạt" trong chế độ chọn nhiều
 * (ver 12 "Multi Media", plan-v12-multimedia.md mục 4.b1). Tách riêng khỏi selection.js vì đây là
 * nghiệp vụ XOÁ THẬT (đụng IndexedDB + cascade folder), khác nhóm "chọn nhiều thuần UI".
 *
 * KHÔNG lo việc dừng phát/dọn player UI khi bài đang phát nằm trong tập bị xoá — đó là quyết định
 * UX (câu 4 mục 6 plan: ép dừng rồi xoá, không hỏi/không chặn) thuộc về WORKFLOW
 * (event/workflow/playlist.js, deleteSelectedSongs()), core ở đây chỉ THUẦN xoá dữ liệu.
 *
 * NẠP SAU: core/db.js, core/file-manager/folder.js (removeSongFromAllFolders), core/listen-stats.js
 * (removeSongStats), core/playlist/order.js (recomputeRenderOrder), core/playlist/render.js
 * (renderPlaylistDiff/updateEmptyState).
 */

/**
 * Xoá THẬT nhiều bài khỏi store `songs` + cascade dọn khỏi mọi folder chúng từng thuộc (đúng thứ
 * tự CHỐT ở plan mục 6: cascade folder TRƯỚC, xoá record SAU). Guard clause thuần cho bài không
 * còn tồn tại (race hiếm) — vẫn ĐÚNG 1 tiến trình "xoá 1 lô bài", không rẽ nhánh tiến trình khác.
 * @param {string[]} keys
 * @returns {Promise<string[]>} danh sách key ĐÃ xoá thành công (có thể ít hơn keys nếu có race)
 */
async function deleteSongsBatch(keys) {
    const deletedKeys = [];
    for (const key of keys) {
        const record = await getSongRecord(key);
        if (!record) continue; // guard: đã bị xoá từ trước (hiếm, race) — bỏ qua, không chặn cả lô
        await removeSongFromAllFolders(record);
        await deleteSongRecord(key);
        removeSongStats(key);
        deletedKeys.push(key);
    }
    return deletedKeys;
}

/**
 * Dọn RAM/UI sau khi đã xoá xong 1 lô key khỏi DB — bản BATCH của removeKeyFromDisplay() (đơn lẻ,
 * playlist/actions.js), cùng hình dạng/vai trò, chỉ đổi 1 key -> N key cho hiệu quả (1 lượt
 * filter/render thay vì lặp lại N lần). Theo ĐÚNG idiom đã có sẵn của removeKeyFromDisplay() cho
 * nhóm hàm "đồng bộ RAM rồi vẽ lại ngay" trong CÙNG cụm playlist (xem lý do ở core/playlist/
 * selection.js đầu file) — không tách workflow riêng cho phần thuần đồng bộ RAM/vẽ lại này.
 * @param {string[]} keys
 */
function removeKeysFromDisplay(keys) {
    const keySet = new Set(keys);
    appState.set('playlistOrder', appState.get('playlistOrder').filter(k => !keySet.has(k)));
    appState.set('displayOrder', appState.get('displayOrder').filter(k => !keySet.has(k)));
    appState.mutate('pendingResortKeys', s => keys.forEach(k => s.delete(k)));
    appState.mutate('playlistCache', m => keys.forEach(k => m.delete(k)));
    appState.mutate('songNameIndex', m => keys.forEach(k => m.delete(k)));
    appState.mutate('selectedSongKeys', s => keys.forEach(k => s.delete(k)));
    updateShuffleArray();
    recomputeRenderOrder();
    renderPlaylistDiff();
    updateEmptyState();
}
