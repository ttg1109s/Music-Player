/**
 * patch-file-manager.js — patch default-language keys (tiếng Anh), namespace `fileManager.*`.
 * MỚI thêm ver 12 "Multi Media" (plan-v12-multimedia.md mục 2) — bước đầu chỉ có phần Folder
 * Picker (dùng bởi core/file-manager/folder-picker-ui.js + hành động "Thêm vào thư mục" trong
 * chế độ chọn nhiều của Playlist). Các namespace `fileManager.song.*`/`fileManager.image.*`/
 * `reader.*` sẽ bổ sung ở các bước sau khi khung điều hướng File Manager được code.
 *
 * Đây KHÔNG phải file JSON — xem comment đầu patch-playlist.js để biết lý do (project chạy qua
 * file://, không fetch() được file tĩnh).
 *
 * Nạp TRƯỚC /lang/lang.js (xem index.html).
 */
const LANG_PATCH_FILE_MANAGER = {
    'fileManager.folderPicker.title': 'Add to folder',
    'fileManager.folderPicker.empty': 'No folders yet. Create one below.',
    'fileManager.folderPicker.newNamePlaceholder': 'New folder name',
    'fileManager.folderPicker.btnCreate': 'Create',
    'fileManager.folderPicker.addSuccess': 'Added {count} song(s) to the folder.',
    // ── Khung File Manager (ver 12 "Multi Media", plan-v12-multimedia.md mục 2) ─────────────
    'fileManager.openTitle': 'File Manager',
    'fileManager.title': 'File Manager',
    'fileManager.close.title': 'Close',
    'fileManager.tab.song': 'Song',
    'fileManager.tab.image': 'Image',
    'fileManager.tab.album': 'Album',
    'fileManager.tab.text': 'Text',
    'fileManager.comingSoon': 'Coming soon.',
    // ── File Manager -> Song: Folder (mục 4.b1) ──────────────────────────────────────────────
    'fileManager.song.folderSectionTitle': 'Folders',
    'fileManager.song.newFolderPlaceholder': 'New folder name',
    'fileManager.song.btnCreateFolder': 'Create',
    'fileManager.song.folderEmpty': 'No folders yet.',
    'fileManager.song.renameFolderTitle': 'Rename folder',
    'fileManager.song.deleteFolderTitle': 'Delete folder',
    'fileManager.song.deleteFolderConfirm': 'Delete folder "{name}"? Songs inside stay in your library, only the folder is removed.',
    'fileManager.song.btnDeleteFolder': 'Delete',
};
