/**
 * core/playlist/selection.js — "Chọn nhiều" trong Playlist, ver 12 "Multi Media"
 * (plan-v12-multimedia.md mục 4.b1). Cụm event sở hữu: `playlist` (đã chốt).
 *
 * SỬA (sau trao đổi Rule 2): buildSongNode()/renderPlaylistFull()/renderPlaylistDiff() KHÔNG chạy
 * trong workflow — chúng bị gọi THẲNG bởi core khác/router ở nhiều nơi (setDisplaySortMode,
 * setPlaylistViewMode, loader.js, actions.js...), nên KHÔNG được sửa để tự appState.get()
 * selectionMode/selectedSongKeys (đó là đọc state trong core, vi phạm Rule 2, bất kể hàm đó cũ hay
 * mới — Rule 2 không quan tâm dữ liệu gì, chỉ quan tâm nguồn đọc). Thiết kế lại hoàn toàn tách biệt:
 *
 *   1. buildSongNode() giữ NGUYÊN VẸN bản gốc (xem render.js) — KHÔNG đụng gì tới, không biết
 *      "chọn nhiều" tồn tại.
 *   2. Chỉ báo đã chọn là 1 lớp DOM-PATCH riêng, ĐỘC LẬP hoàn toàn với vòng đời render chính —
 *      applySelectionVisual()/applySelectionToAllNodes()/updateSelectionActionBar() dưới đây đều
 *      là hàm THUẦN (không I/O, không appState.get()), nhận node/key/selectionMode/
 *      selectedSongKeys/domNodesByKey qua THAM SỐ — đúng Rule 2.
 *   3. setSelectionMode()/toggleSongSelection() CHỈ còn set/mutate state (Rule 2 cho phép ghi tự
 *      do) — KHÔNG tự gọi render gì nữa.
 *   4. Nơi ĐỌC state rồi ĐIỀU PHỐI gọi nối tiếp (set state -> patch DOM -> cập nhật action bar) là
 *      WORKFLOW (event/workflow/playlist.js, toggleSelectionMode()/toggleSongSelectionAndRefresh())
 *      — đúng vai trò "chân tay" được phép appState.get() tự do + gọi nhiều hàm nối tiếp
 *      (event-bus-flow.md mục 4B: ≥2 lời gọi side-effect nối tiếp = Workflow).
 *
 * GIỚI HẠN ĐÃ BIẾT: nếu buildSongNode() tạo NODE MỚI (bài mới thêm/sort lại) trong lúc
 * selectionMode đang bật, node mới đó CHƯA có chỉ báo cho tới lần applySelectionToAllNodes() kế
 * tiếp (thường là lần chọn/bỏ chọn/toggle mode kế tiếp) — trade-off chấp nhận được để không phải
 * đụng vào render.js/các cụm khác đang gọi nó.
 *
 * NẠP SAU: core/dom-refs.js (selectionActionBar...). KHÔNG cần nạp sau render.js nữa (không gọi
 * buildSongNode/renderPlaylistFull/renderPlaylistDiff).
 */

function setSelectionMode(enabled) {
    appState.set('selectionMode', enabled);
    console.log(`writer: "setSelectionMode", page: "selectionMode", content: "${enabled}"`);
    if (!enabled) {
        appState.mutate('selectedSongKeys', s => s.clear());
        console.log(`writer: "setSelectionMode", page: "selectedSongKeys", content: "clear khi tắt chế độ chọn"`);
    }
}

/** Toggle đúng 1 songKey — chỉ đọc/ghi collection ĐANG mutate qua `s` (phạm vi cho phép của
 * mutate(), không phải appState.get() 1 field khác). */
function toggleSongSelection(key) {
    appState.mutate('selectedSongKeys', s => { if (s.has(key)) s.delete(key); else s.add(key); });
    console.log(`writer: "toggleSongSelection", page: "selectedSongKeys", content: "toggle ${key}"`);
}

/**
 * Patch chỉ báo "đã chọn" + ẩn/hiện menu 3 chấm cho ĐÚNG 1 node đã có sẵn trong DOM — hàm THUẦN,
 * không I/O, không appState. Overlay tuyệt đối (top-2 left-2) dùng CHUNG cho cả grid/list view
 * (không cần biết isGridView) — đơn giản hơn viết 2 nhánh riêng, đủ đẹp cho cả 2 layout.
 * @param {HTMLElement} node
 * @param {string} key
 * @param {boolean} selectionMode
 * @param {Set<string>} selectedSongKeys
 */
function applySelectionVisual(node, key, selectionMode, selectedSongKeys) {
    if (!node) return;
    const menuBtn = node.querySelector('button[data-action="menu"]');
    let indicator = node.querySelector('[data-role="selection-indicator"]');

    if (!selectionMode) {
        if (indicator) indicator.remove();
        node.classList.remove('bg-sky-500/10');
        if (menuBtn) menuBtn.classList.remove('hidden');
        return;
    }

    if (menuBtn) menuBtn.classList.add('hidden'); // ẩn menu 3 chấm khi đang chọn, tránh 2 mục tiêu bấm cạnh tranh

    const isSelected = selectedSongKeys.has(key);
    node.classList.toggle('bg-sky-500/10', isSelected);

    if (!indicator) {
        node.classList.add('relative'); // positioning context cho overlay — vô hại nếu đã có sẵn (grid view)
        indicator = document.createElement('div');
        indicator.dataset.role = 'selection-indicator';
        node.appendChild(indicator);
    }
    indicator.className = `absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-sky-500 border-sky-500' : 'bg-black/30 border-white/30'}`;
    indicator.innerHTML = isSelected ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : '';
}

/**
 * Áp lại chỉ báo cho MỌI node hiện có — nơi gọi (workflow) tự `appState.get('domNodesByKey')` rồi
 * truyền vào (Rule 2). Hàm THUẦN, chỉ lặp + gọi applySelectionVisual().
 * @param {Map<string, HTMLElement>} domNodesByKey
 * @param {boolean} selectionMode
 * @param {Set<string>} selectedSongKeys
 */
function applySelectionToAllNodes(domNodesByKey, selectionMode, selectedSongKeys) {
    domNodesByKey.forEach((node, key) => applySelectionVisual(node, key, selectionMode, selectedSongKeys));
}

/**
 * Patch thanh hành động (số lượng, ẩn/hiện) — hàm THUẦN, nhận đủ qua tham số, KHÔNG appState.get().
 * @param {boolean} selectionMode
 * @param {number} count
 */
function updateSelectionActionBar(selectionMode, count) {
    if (!selectionActionBar) return;
    selectionActionBar.classList.toggle('hidden', !selectionMode);
    if (selectionCountLabel) selectionCountLabel.textContent = tFormat('playlistView.selection.countLabel', { count });
}
