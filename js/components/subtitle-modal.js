/**
 * Component: Subtitle Editor Modal (màn hình toàn màn hình để quản lý / chỉnh sửa phụ đề)
 * Biến này chứa chuỗi HTML, được main.js chèn vào DOM lúc khởi động.
 */
const TPL_SUBTITLE_MODAL = `
    <div id="subtitle-modal" class="fixed inset-0 z-[110] bg-[#0f172a] transform translate-y-full transition-transform duration-300 flex flex-col">
        <div class="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-white/10 shrink-0 bg-[#0f172a]">
            <h3 class="text-base font-bold text-yellow-400 flex items-center gap-2">
                <span class="bg-yellow-400/20 p-1.5 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                </span>
                Quản lý Phụ đề
            </h3>
            <div class="flex gap-2">
                <button id="btn-toggle-sub" class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold rounded-xl transition-colors text-white shadow-md">Bật Sub</button>
                <button id="btn-close-sub-modal" class="px-5 py-2.5 bg-slate-700/80 hover:bg-slate-600 text-sm font-semibold rounded-xl transition-colors text-white shadow-md">Đóng</button>
            </div>
        </div>
        <div class="flex-grow flex flex-col gap-6 overflow-hidden w-full bg-[#0f172a]">

            <div class="flex justify-center gap-4 shrink-0 pt-4 sm:pt-6 px-4 sm:px-6">
                <label class="w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-2xl cursor-pointer shadow-lg flex items-center justify-center transition-transform hover:scale-105" title="Tải file (.srt) lên">
                    <input type="file" id="srt-upload" accept=".srt" class="hidden">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                </label>
                <button id="btn-auto-timing" class="w-14 h-14 bg-rose-600 hover:bg-rose-500 rounded-2xl shadow-lg flex items-center justify-center transition-colors relative" title="Canh giờ Tự động (Auto Timing)">
                    <svg id="icon-auto-timing-idle" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <svg id="icon-auto-timing-recording" class="w-6 h-6 text-white hidden" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" class="animate-pulse"></circle></svg>
                </button>
                <button id="btn-add-sub" class="w-14 h-14 bg-indigo-500 hover:bg-indigo-400 rounded-2xl shadow-lg flex items-center justify-center transition-transform hover:scale-105" title="Thêm dòng Sub">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                </button>
                <button id="btn-apply-sub" class="w-14 h-14 bg-emerald-500 hover:bg-emerald-400 rounded-2xl shadow-lg flex items-center justify-center transition-transform hover:scale-105" title="Áp dụng & Phát lại">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                </button>
            </div>

            <div class="text-xs font-bold text-slate-400 uppercase flex justify-between items-center tracking-wider border-b border-white/5 pb-2 px-5 shrink-0">
                <span>Danh sách các dòng:</span>
                <button id="btn-export-srt" class="text-sky-400 hover:text-sky-300 underline font-semibold normal-case">Xuất file .SRT</button>
            </div>

            <div id="sub-list-container" class="flex-grow overflow-y-auto pb-10">
                <div class="flex flex-col items-center justify-center h-full text-slate-500 gap-3 opacity-60" id="sub-empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span class="font-medium text-sm">Chưa có phụ đề nào</span>
                </div>
            </div>
        </div>
    </div>
`;
