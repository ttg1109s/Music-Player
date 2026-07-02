/**
 * components/file-manager.js — Khung File Manager (ver 12 "Multi Media", plan-v12-multimedia.md
 * mục 2/3/4.b1). Overlay CẤP CAO (ngang hàng Settings, mở thẳng từ Playlist — KHÔNG nằm trong cây
 * Settings -> About như storageDrawer cũ), z-[100] để nổi trên #playlist-view (z-[60]) và mọi
 * drawer Settings (z-[80]/[90]).
 *
 * 4 tab điều hướng: Song (b1, ĐẦY ĐỦ ở patch này) / Image / Album / Text (b2/b4/b5, CHƯA code —
 * hiện placeholder "sắp ra mắt", tab bar vẫn bấm được để tránh phải sửa lại khung điều hướng khi
 * làm các bước sau).
 *
 * Tab Song = 2 phần:
 *   1. QUẢN LÝ FOLDER (MỚI — mục 4.b1: tạo/đổi tên/xoá folder, dùng core/file-manager/folder.js).
 *      Scoping (bấm vào 1 folder để lọc Playlist theo folder đó) CHƯA làm ở patch này — đúng thứ
 *      tự plan mục 5 (folder CRUD trước, scoping sau).
 *   2. QUẢN LÝ DUNG LƯỢNG (DỜI TỪ storage-drawer.js cũ, mục 3 "Kéo ra thành mục riêng File
 *      Manager -> Song") — giữ NGUYÊN VẸN mọi id phần tử (`stat-storage-total-songs`,
 *      `btn-storage-download-then-clear`, `btn-storage-clear-no-download`, `btn-storage-scan-broken`,
 *      `storage-scan-result`, `storage-scan-summary`, `storage-scan-list`,
 *      `btn-storage-delete-broken`, `btn-storage-dismiss-scan`) để core/storage-manager.js +
 *      core/dom-refs.js KHÔNG cần sửa gì — chỉ đổi NƠI markup này được mount + cụm event nào sở
 *      hữu (settingsMisc -> fileManagerSong, xem event/router/file-manager-song.js). Namespace lang
 *      `storageDrawer.*` CŨNG giữ nguyên tên (không đổi ~20 key chỉ vì đổi chỗ ở) — biết là hơi
 *      lệch tên so với vị trí mới, chấp nhận được, đổi tên sau nếu cần.
 *
 * components/storage-drawer.js + component TPL_STORAGE_DRAWER KHÔNG còn được mount (xem main.js) —
 * file cũ ĐỂ LẠI trong project làm tư liệu đối chiếu, KHÔNG xoá tự động, bác xoá tay khi rảnh.
 */
const TPL_FILE_MANAGER = `
    <div id="file-manager-overlay" class="fixed inset-0 drawer-glass z-[100] transform translate-y-full transition-transform duration-500 ease-in-out flex flex-col">
        <div class="flex justify-between items-center px-4 py-3 sm:px-6 border-b border-white/10 shrink-0 bg-black/40">
            <div class="flex items-center gap-2">
                <button id="btn-close-file-manager" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white" data-i18n-title="fileManager.close.title" title="${t('fileManager.close.title')}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h2 class="text-base sm:text-lg font-bold tracking-wider text-white uppercase" data-i18n="fileManager.title">${t('fileManager.title')}</h2>
            </div>
        </div>

        <!-- Tab bar 4 mục — data-tab dùng chung cho listener delegation (event/listener/file-manager.js) -->
        <div class="flex shrink-0 border-b border-white/10 bg-black/20 px-2">
            <button data-tab="song" class="file-manager-tab-btn flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors" data-i18n="fileManager.tab.song">${t('fileManager.tab.song')}</button>
            <button data-tab="image" class="file-manager-tab-btn flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors" data-i18n="fileManager.tab.image">${t('fileManager.tab.image')}</button>
            <button data-tab="album" class="file-manager-tab-btn flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors" data-i18n="fileManager.tab.album">${t('fileManager.tab.album')}</button>
            <button data-tab="text" class="file-manager-tab-btn flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors" data-i18n="fileManager.tab.text">${t('fileManager.tab.text')}</button>
        </div>

        <div class="flex-grow overflow-y-auto px-4 py-6 sm:px-8 pb-20">
            <div class="max-w-2xl mx-auto space-y-8">

                <!-- ===================== TAB: SONG ===================== -->
                <div id="file-manager-pane-song" class="file-manager-pane space-y-8">

                    <!-- SECTION: FOLDER (MỚI, mục 4.b1) -->
                    <div>
                        <h3 class="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 ml-2" data-i18n="fileManager.song.folderSectionTitle">${t('fileManager.song.folderSectionTitle')}</h3>
                        <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                            <div class="flex gap-2 p-3 border-b border-white/5">
                                <input id="file-manager-new-folder-input" type="text" placeholder="${t('fileManager.song.newFolderPlaceholder')}" class="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-sky-500 transition-colors">
                                <button id="btn-file-manager-create-folder" class="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-colors shrink-0" data-i18n="fileManager.song.btnCreateFolder">${t('fileManager.song.btnCreateFolder')}</button>
                            </div>
                            <div id="file-manager-folder-list" class="flex flex-col divide-y divide-white/5"></div>
                            <p id="file-manager-folder-empty" class="hidden text-sm text-slate-400 p-4 text-center" data-i18n="fileManager.song.folderEmpty">${t('fileManager.song.folderEmpty')}</p>
                        </div>
                    </div>

                    <!-- SECTION: THỐNG KÊ DUNG LƯỢNG (dời từ storage-drawer.js, id giữ nguyên) -->
                    <div>
                        <h3 class="text-xs font-bold text-sky-400 uppercase tracking-widest mb-2 ml-2" data-i18n="storageDrawer.statsSectionTitle">${t('storageDrawer.statsSectionTitle')}</h3>
                        <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                            <div class="flex justify-between items-center p-4 border-b border-white/5">
                                <span class="text-sm font-medium text-slate-300" data-i18n="storageDrawer.statTotalSongs">${t('storageDrawer.statTotalSongs')}</span>
                                <span id="stat-storage-total-songs" class="text-sm font-mono text-sky-300">—</span>
                            </div>
                            <div class="flex justify-between items-center p-4">
                                <span class="text-sm font-medium text-slate-300" data-i18n="storageDrawer.statTotalBytes">${t('storageDrawer.statTotalBytes')}</span>
                                <span id="stat-storage-total-bytes" class="text-sm font-mono text-sky-300">—</span>
                            </div>
                        </div>
                    </div>

                    <!-- SECTION: GIẢI PHÓNG BỘ NHỚ (dời từ storage-drawer.js, id giữ nguyên) -->
                    <div>
                        <h3 class="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2 ml-2" data-i18n="storageDrawer.freeSpaceSectionTitle">${t('storageDrawer.freeSpaceSectionTitle')}</h3>
                        <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                            <button id="btn-storage-download-then-clear" class="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors w-full text-left">
                                <div>
                                    <div class="text-sm font-medium text-emerald-300" data-i18n="storageDrawer.downloadThenClear.label">${t('storageDrawer.downloadThenClear.label')}</div>
                                    <div class="text-xs text-slate-400 mt-0.5" data-i18n="storageDrawer.downloadThenClear.hint">${t('storageDrawer.downloadThenClear.hint')}</div>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-8-4V4m0 0L8 8m4-4l4 4" /></svg>
                            </button>
                            <button id="btn-storage-clear-no-download" class="flex justify-between items-center p-4 hover:bg-rose-500/10 transition-colors w-full text-left">
                                <div>
                                    <div class="text-sm font-medium text-rose-400" data-i18n="storageDrawer.clearNoDownload.label">${t('storageDrawer.clearNoDownload.label')}</div>
                                    <div class="text-xs text-slate-400 mt-0.5" data-i18n="storageDrawer.clearNoDownload.hint">${t('storageDrawer.clearNoDownload.hint')}</div>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>

                    <!-- SECTION: DỌN FILE LỖI (dời từ storage-drawer.js, id giữ nguyên) -->
                    <div>
                        <h3 class="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2 ml-2" data-i18n="storageDrawer.brokenSectionTitle">${t('storageDrawer.brokenSectionTitle')}</h3>
                        <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                            <button id="btn-storage-scan-broken" class="flex justify-between items-center p-4 hover:bg-white/5 transition-colors w-full text-left">
                                <div>
                                    <div class="text-sm font-medium" data-i18n="storageDrawer.scanBroken.label">${t('storageDrawer.scanBroken.label')}</div>
                                    <div class="text-xs text-slate-400 mt-0.5" data-i18n="storageDrawer.scanBroken.hint">${t('storageDrawer.scanBroken.hint')}</div>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg>
                            </button>
                            <div id="storage-scan-result" class="hidden border-t border-white/5 p-4 flex flex-col gap-3">
                                <p id="storage-scan-summary" class="text-sm text-slate-300"></p>
                                <div id="storage-scan-list" class="flex flex-col gap-1.5 max-h-48 overflow-y-auto text-xs text-slate-400"></div>
                                <div class="flex gap-3 mt-1">
                                    <button id="btn-storage-delete-broken" class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold transition-colors" data-i18n="storageDrawer.btnDeleteBroken">${t('storageDrawer.btnDeleteBroken')}</button>
                                    <button id="btn-storage-dismiss-scan" class="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors" data-i18n="storageDrawer.btnDismissScan">${t('storageDrawer.btnDismissScan')}</button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- ===================== TAB: IMAGE / ALBUM / TEXT — placeholder, CHƯA code (b2/b4/b5) ===================== -->
                <div id="file-manager-pane-image" class="file-manager-pane hidden">
                    <p class="text-sm text-slate-400 text-center py-10" data-i18n="fileManager.comingSoon">${t('fileManager.comingSoon')}</p>
                </div>
                <div id="file-manager-pane-album" class="file-manager-pane hidden">
                    <p class="text-sm text-slate-400 text-center py-10" data-i18n="fileManager.comingSoon">${t('fileManager.comingSoon')}</p>
                </div>
                <div id="file-manager-pane-text" class="file-manager-pane hidden">
                    <p class="text-sm text-slate-400 text-center py-10" data-i18n="fileManager.comingSoon">${t('fileManager.comingSoon')}</p>
                </div>

            </div>
        </div>
    </div>
`;
