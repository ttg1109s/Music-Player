/**
 * Component: Playlist View (màn hình danh sách bài hát)
 * Biến này chứa chuỗi HTML, được main.js chèn vào DOM lúc khởi động.
 */
const TPL_PLAYLIST_VIEW = `
    <div id="playlist-view" class="absolute inset-0 z-[60] flex flex-col bg-[#000000] transition-transform duration-500 overflow-hidden">
        <div id="playlist-bg" class="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0 transition-all duration-300" style="filter: blur(0px); transform: scale(1.1);"></div>
        <div class="absolute inset-0 bg-black/40 pointer-events-none z-0"></div>

        <div class="px-5 pt-12 pb-4 z-10 relative shrink-0">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-[34px] leading-none font-bold tracking-tight text-white">Bài hát</h1>
                <div class="flex items-center gap-5 text-white">
                    <button id="btn-return-visual" class="hidden hover:text-emerald-400 transition-colors animate-pulse" title="Đang phát (Quay lại)">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    
                    <label for="audio-upload" class="cursor-pointer hover:text-sky-400 transition-colors" title="Thêm nhạc">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </label>
                    <button id="btn-settings-playlist" class="hover:text-sky-400 transition-colors" title="Cài đặt">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    <button id="btn-toggle-view" class="hover:text-sky-400 transition-colors" title="Đổi giao diện">
                        <svg id="icon-grid-view" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        <svg id="icon-list-view" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                </div>
            </div>
            
            <div class="flex gap-4">
                <button onclick="if(displayOrder.length > 0) playSong(currentKey || displayOrder[0]);" class="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md active:scale-95 transition-all py-3.5 rounded-2xl flex items-center justify-center gap-2 font-semibold text-[15px] text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>
                    Phát
                </button>
                <button onclick="if(!isShuffle) btnShuffle.click(); if(playlistOrder.length > 0) playSong(shuffleIndices[0]);" class="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md active:scale-95 transition-all py-3.5 rounded-2xl flex items-center justify-center gap-2 font-semibold text-[15px] text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    Trộn bài
                </button>
                <div class="relative shrink-0">
                    <button id="btn-sort-display" class="h-full px-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md active:scale-95 transition-all rounded-2xl flex items-center justify-center text-white" title="Sắp xếp danh sách hiển thị">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9M3 12h9m-9 4h9m5-8v12m0 0l-3-3m3 3l3-3" /></svg>
                    </button>
                    <div id="sort-display-menu" class="hidden absolute right-0 top-full mt-2 w-48 bg-[#171c2b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30">
                        <button data-sort="default" class="sort-display-option flex justify-between items-center w-full px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors">Mặc định (mới thêm)<svg class="sort-check h-4 w-4 text-sky-400 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg></button>
                        <button data-sort="az" class="sort-display-option flex justify-between items-center w-full px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors border-t border-white/5">Tên A → Z<svg class="sort-check h-4 w-4 text-sky-400 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg></button>
                        <button data-sort="za" class="sort-display-option flex justify-between items-center w-full px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors border-t border-white/5">Tên Z → A<svg class="sort-check h-4 w-4 text-sky-400 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg></button>
                        <button data-sort="random" class="sort-display-option flex justify-between items-center w-full px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors border-t border-white/5">Ngẫu nhiên<svg class="sort-check h-4 w-4 text-sky-400 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg></button>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex-grow overflow-y-auto z-10 w-full">
            <div id="playlist-empty" class="h-[60%] flex flex-col items-center justify-center text-slate-400 gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                <p class="text-sm">Chưa có bài hát nào. Hãy thêm nhạc để bắt đầu.</p>
            </div>
            <div id="playlist-container" class="flex flex-col pb-32"></div>
        </div>
    </div>

    <!-- Modal: Sửa thông tin bài hát (title/artist/album) -->
    <div id="song-edit-modal" class="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm hidden flex items-center justify-center px-5">
        <div class="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-sm p-5 shadow-2xl flex flex-col gap-4">
            <h3 class="text-base font-bold text-sky-400">Sửa thông tin bài hát</h3>
            <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-1">
                    <label class="text-xs text-slate-400">Tên bài hát</label>
                    <input type="text" id="song-edit-title" class="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-sky-500">
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-xs text-slate-400">Nghệ sĩ</label>
                    <input type="text" id="song-edit-artist" class="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-sky-500">
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-xs text-slate-400">Album</label>
                    <input type="text" id="song-edit-album" class="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-sky-500">
                </div>
            </div>
            <div class="flex gap-3 mt-1">
                <button id="song-edit-cancel" class="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors">Hủy</button>
                <button id="song-edit-save" class="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-sm font-semibold transition-colors">Lưu</button>
            </div>
        </div>
    </div>

    <!-- Modal: Thông tin chi tiết bài hát -->
    <div id="song-info-modal" class="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm hidden flex items-center justify-center px-5">
        <div class="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-sm p-5 shadow-2xl flex flex-col gap-4">
            <h3 class="text-base font-bold text-sky-400">Thông tin bài hát</h3>
            <div id="song-info-body" class="flex flex-col gap-2 text-sm text-slate-300"></div>
            <div class="flex gap-3 mt-1">
                <button id="song-info-export" class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold transition-colors">Xuất file (gắn tag mới)</button>
                <button id="song-info-close" class="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors">Đóng</button>
            </div>
        </div>
    </div>

    <!-- Menu 3 chấm dùng chung cho mọi bài hát (info / sửa / xuất file / xóa) — chỉ 1 phần tử duy
         nhất trong DOM, được JS định vị lại (position: fixed) ngay dưới nút "..." vừa bấm mỗi lần
         mở, thay vì nhân bản dropdown riêng cho từng item trong danh sách (đỡ tốn DOM + dễ quản lý
         khi danh sách dài). Đóng khi bấm ra ngoài hoặc chọn 1 hành động. -->
    <div id="song-action-overlay" class="hidden fixed inset-0 z-[110]"></div>
    <div id="song-action-menu" class="hidden fixed z-[115] w-48 bg-[#171c2b] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        <button data-menu-action="info" class="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-white/10 transition-colors text-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Thông tin
        </button>
        <button data-menu-action="edit" class="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-white/10 transition-colors text-slate-200 border-t border-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Sửa thông tin
        </button>
        <button data-menu-action="restore" class="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-white/10 transition-colors text-slate-200 border-t border-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-8-4V4m0 0L8 8m4-4l4 4" /></svg>
            Xuất file (gắn tag mới)
        </button>
        <button data-menu-action="delete" class="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-rose-500/10 transition-colors text-rose-400 border-t border-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Xóa bài
        </button>
    </div>

    <!-- Modal: Bài hát lỗi lúc phát (audioPlayer báo 'error' thật khi decode) — hỏi Giữ lại (chuyển
         vào danh sách chờ ở Quản lý dung lượng, không hiện trong playlist nữa) hay Xóa luôn khỏi
         IndexedDB ngay. -->
    <div id="playback-error-modal" class="fixed inset-0 z-[125] bg-black/70 backdrop-blur-sm hidden flex items-center justify-center px-5">
        <div class="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-sm p-5 shadow-2xl flex flex-col gap-4">
            <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                <h3 class="text-base font-bold text-amber-400">Không phát được bài này</h3>
            </div>
            <p id="playback-error-filename" class="text-sm text-slate-300 break-all"></p>
            <p class="text-xs text-slate-500">Dữ liệu file có thể bị lỗi hoặc không đúng định dạng. Bạn muốn giữ lại để xử lý sau (trong Quản lý dung lượng) hay xóa luôn?</p>
            <div class="flex gap-3 mt-1">
                <button id="playback-error-keep" class="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors">Giữ lại</button>
                <button id="playback-error-delete" class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold transition-colors">Xóa luôn</button>
            </div>
        </div>
    </div>
`;
