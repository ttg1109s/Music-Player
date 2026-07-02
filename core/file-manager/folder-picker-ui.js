/**
 * core/file-manager/folder-picker-ui.js — Modal "Thêm vào thư mục": chọn 1 folder có sẵn HOẶC
 * tạo folder mới ngay tại chỗ. Dựng DOM động + tự xoá khi đóng — CÙNG PATTERN với modalChoice()
 * (core/modal-choice.js), KHÔNG tái dùng modalChoice() trực tiếp vì cần list cuộn + ô nhập liệu
 * (modalChoice() chỉ hỗ trợ text + N nút bấm, không đủ hình dạng cho nhu cầu này).
 *
 * Đây là hàm UI-thuần (dựng DOM + gọi callback do nơi khác truyền vào), KHÔNG chứa nghiệp vụ đọc/
 * ghi IndexedDB — giống hệt vai trò của modalChoice()/alertModal(), không thuộc phạm vi 4 rule
 * core-function-conventions.md (rule đó áp cho hàm NGHIỆP VỤ, không áp cho hàm dựng UI thuần).
 *
 * NẠP SAU: core/modal-choice.js (dùng chung escapeHtml()), lang/lang.js (t()).
 */

/**
 * @param {Array<{id: string, name: string}>} folders - danh sách folder hiện có
 * @param {Object} callbacks
 * @param {function(string): void} callbacks.onPickExisting - nhận folderId đã chọn
 * @param {function(string): void} callbacks.onCreateNew - nhận tên folder mới muốn tạo
 */
function openFolderPickerModal(folders, callbacks) {
    const stale = document.getElementById('folder-picker-overlay');
    if (stale) stale.remove();

    const overlay = document.createElement('div');
    overlay.id = 'folder-picker-overlay';
    overlay.className = 'fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-center justify-center px-5';

    const card = document.createElement('div');
    card.className = 'bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-sm p-5 shadow-2xl flex flex-col gap-4 max-h-[80vh]';

    const titleEl = document.createElement('h3');
    titleEl.className = 'text-base font-bold text-white';
    titleEl.textContent = t('fileManager.folderPicker.title');
    card.appendChild(titleEl);

    function closeModal() { overlay.remove(); }

    const listWrap = document.createElement('div');
    listWrap.className = 'flex flex-col gap-1.5 overflow-y-auto min-h-0';

    if (folders.length === 0) {
        const emptyEl = document.createElement('p');
        emptyEl.className = 'text-sm text-slate-400 py-2';
        emptyEl.textContent = t('fileManager.folderPicker.empty');
        listWrap.appendChild(emptyEl);
    } else {
        folders.forEach((folder) => {
            const btnEl = document.createElement('button');
            btnEl.className = 'text-left px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-slate-100 transition-colors truncate';
            btnEl.textContent = folder.name;
            btnEl.addEventListener('click', () => {
                closeModal();
                callbacks.onPickExisting(folder.id);
            });
            listWrap.appendChild(btnEl);
        });
    }
    card.appendChild(listWrap);

    const createRow = document.createElement('div');
    createRow.className = 'flex gap-2 pt-2 border-t border-white/10';
    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.placeholder = t('fileManager.folderPicker.newNamePlaceholder');
    inputEl.className = 'flex-1 min-w-0 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-sky-500 focus:bg-black/60 transition-colors';
    const createBtn = document.createElement('button');
    createBtn.className = 'px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-colors shrink-0';
    createBtn.textContent = t('fileManager.folderPicker.btnCreate');
    createBtn.addEventListener('click', () => {
        const name = inputEl.value.trim();
        if (!name) return; // guard clause thuần — chưa nhập tên thì không làm gì
        closeModal();
        callbacks.onCreateNew(name);
    });
    createRow.appendChild(inputEl);
    createRow.appendChild(createBtn);
    card.appendChild(createRow);

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm font-semibold transition-colors';
    cancelBtn.textContent = t('common.cancel');
    cancelBtn.addEventListener('click', closeModal);
    card.appendChild(cancelBtn);

    overlay.appendChild(card);
    document.body.appendChild(overlay);
}

/**
 * Modal đổi tên 1 folder — 1 ô nhập liệu đã điền sẵn tên hiện tại + 2 nút Huỷ/Lưu. Dùng CHUNG kiểu
 * dựng-DOM-động như openFolderPickerModal() ở trên, KHÔNG tái dùng chính nó (hình dạng khác hẳn:
 * 1 input đơn, không có danh sách chọn).
 * @param {string} currentName
 * @param {function(string): void} onConfirm - nhận tên mới (đã trim, khác rỗng)
 */
function openRenameFolderModal(currentName, onConfirm) {
    const stale = document.getElementById('rename-folder-overlay');
    if (stale) stale.remove();

    const overlay = document.createElement('div');
    overlay.id = 'rename-folder-overlay';
    overlay.className = 'fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-center justify-center px-5';

    const card = document.createElement('div');
    card.className = 'bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-sm p-5 shadow-2xl flex flex-col gap-4';

    const titleEl = document.createElement('h3');
    titleEl.className = 'text-base font-bold text-white';
    titleEl.textContent = t('fileManager.song.renameFolderTitle');
    card.appendChild(titleEl);

    function closeModal() { overlay.remove(); }

    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.value = currentName;
    inputEl.className = 'bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-sky-500 focus:bg-black/60 transition-colors';
    card.appendChild(inputEl);

    const btnRow = document.createElement('div');
    btnRow.className = 'flex gap-3';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm font-semibold transition-colors';
    cancelBtn.textContent = t('common.cancel');
    cancelBtn.addEventListener('click', closeModal);
    const saveBtn = document.createElement('button');
    saveBtn.className = 'flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-colors';
    saveBtn.textContent = t('common.ok');
    saveBtn.addEventListener('click', () => {
        const name = inputEl.value.trim();
        if (!name) return; // guard clause thuần — chưa nhập tên thì không làm gì
        closeModal();
        onConfirm(name);
    });
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);
    card.appendChild(btnRow);

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    inputEl.focus();
    inputEl.select();
}
