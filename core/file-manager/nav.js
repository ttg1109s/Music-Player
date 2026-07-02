/**
 * core/file-manager/nav.js — Điều hướng khung File Manager (ver 12 "Multi Media",
 * plan-v12-multimedia.md mục 2). Cụm event sở hữu: `fileManager`.
 *
 * ĐÚNG pattern đã lập ở core/playlist/selection.js: tách STATE (set thuần) khỏi DOM-PATCH (hàm
 * thuần, nhận tham số) — nơi đọc appState rồi điều phối gọi nối tiếp là WORKFLOW
 * (event/workflow/file-manager.js).
 *
 * NẠP SAU: core/dom-refs.js (fileManagerOverlay/fileManagerTabBtns/fileManagerPanes...).
 */

// ===================== State — set thuần =====================

function setFileManagerOpen(isOpen) {
    appState.set('isFileManagerOpen', isOpen);
    console.log(`writer: "setFileManagerOpen", page: "isFileManagerOpen", content: "${isOpen}"`);
}

function setFileManagerActiveTab(tab) {
    appState.set('fileManagerActiveTab', tab);
    console.log(`writer: "setFileManagerActiveTab", page: "fileManagerActiveTab", content: "${tab}"`);
}

// ===================== DOM-patch — hàm THUẦN =====================

function showFileManagerOverlay() {
    if (!fileManagerOverlay) return; // guard
    fileManagerOverlay.classList.remove('translate-y-full');
}

function hideFileManagerOverlay() {
    if (!fileManagerOverlay) return; // guard
    fileManagerOverlay.classList.add('translate-y-full');
}

/**
 * Vẽ đúng tab đang chọn — đổi style nút tab (viền dưới sky) + ẩn/hiện pane tương ứng. Hàm THUẦN,
 * nhận `tab` qua tham số (Rule 2). Lặp qua fileManagerTabBtns/fileManagerPanes (đã là mảng cố định
 * từ dom-refs.js) so khớp `dataset.tab`/id `file-manager-pane-{tab}` — KHÔNG if/else rẽ nhánh theo
 * từng tab cụ thể (4 tab tương lai có thể thêm mà không phải sửa hàm này).
 * @param {string} tab - 'song' | 'image' | 'album' | 'text'
 */
function renderActiveFileManagerTab(tab) {
    fileManagerTabBtns.forEach((btn) => {
        const isActive = btn.dataset.tab === tab;
        btn.classList.toggle('text-sky-400', isActive);
        btn.classList.toggle('border-sky-400', isActive);
        btn.classList.toggle('text-slate-400', !isActive);
        btn.classList.toggle('border-transparent', !isActive);
    });
    fileManagerPanes.forEach((pane) => {
        pane.classList.toggle('hidden', pane.id !== `file-manager-pane-${tab}`);
    });
}
