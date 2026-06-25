/**
 * Component: Visualizer UI Overlay (lớp giao diện đè lên canvas khi đang phát nhạc: stats, subtitle, các nút điều khiển nhanh)
 * Biến này chứa chuỗi HTML, được main.js chèn vào DOM lúc khởi động.
 *
 * Ver 8 refine: dải dọc 6 nút ở góc phải (Quay lại/Đổi hiệu ứng/Phụ đề/Cài đặt/Trộn bài/Lặp lại)
 * THAY BẰNG 1 nút "Control Center" nhỏ ở góc trái (#btn-open-control-center, mũi tên xuống) —
 * bấm vào mở panel #visualizer-control-center trượt từ trên xuống FULL CHIỀU RỘNG (kiểu Control
 * Center điện thoại), chứa GRID 5 icon (Đổi hiệu ứng/Phụ đề/Cài đặt/Trộn bài/Lặp lại), mỗi ô có
 * icon + nhãn chữ. #btn-back-playlist (Quay lại Danh sách) TÁCH RIÊNG, vẫn cố định góc phải trên
 * như cũ vì là thao tác dùng rất thường xuyên — không nằm trong panel ẩn/hiện. Mọi #id nút bên
 * trong grid GIỮ NGUYÊN (#btn-cycle-mode, #btn-subtitle, #btn-settings, #btn-shuffle, #btn-repeat)
 * nên toàn bộ listener ở player-controls.js/equalizer-settings.js không cần sửa gì — chỉ JS mới
 * ở đây là mở/đóng panel (xem state-and-video-bg.js).
 */
const TPL_VISUALIZER_OVERLAY = `
    <div id="visualizer-ui" class="absolute inset-0 z-30 pointer-events-none fade-enter hidden flex flex-col">
        <div id="stats-panel" class="w-full glass-panel !border-x-0 !border-t-0 border-b border-white/10 p-2 flex justify-around sm:justify-center sm:gap-16 items-center pointer-events-none select-none z-50 relative">
            <div class="flex flex-col items-center"><span class="text-slate-400 font-semibold tracking-wider text-[9px] mb-0.5">EST. BPM</span><span id="stat-bpm" class="font-mono text-green-400 font-bold text-sm">---</span></div>
            <div class="flex flex-col items-center"><span class="text-slate-400 font-semibold tracking-wider text-[9px] mb-0.5">PITCH (YIN)</span><span id="stat-note" class="font-mono text-yellow-400 font-bold text-sm">---</span></div>
            <div class="flex flex-col items-center"><span class="text-slate-400 font-semibold tracking-wider text-[9px] mb-0.5">ENERGY</span><span id="stat-energy" class="font-mono text-rose-400 font-bold text-sm">0%</span></div>
        </div>

        <div class="flex-grow relative">
            <div id="subtitle-display" class="absolute bottom-[20%] w-full px-4 sm:px-10 flex flex-col items-center justify-center pointer-events-none z-[60] hidden">
                <div id="subtitle-frame" class="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-center max-w-4xl shadow-2xl flex flex-col items-center gap-1.5">
                    <div id="sub-active-lines" class="flex flex-col items-center gap-1.5"></div>
                </div>
            </div>

            <!-- Nút "Quay lại Danh sách" — TÁCH RIÊNG, luôn hiện cố định góc phải trên (thao tác
                 dùng rất thường xuyên, không gộp vào Control Center ẩn/hiện bên dưới). -->
            <button id="btn-back-playlist" class="absolute top-4 right-3 sm:right-6 w-10 h-10 flex items-center justify-center glass-panel hover:bg-white/10 rounded-full transition-colors group shadow-lg pointer-events-auto z-40" title="Quay lại Danh sách"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-300 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" /></svg></button>

            <!-- Nút mở/đóng "Control Center" (ver 8 refine) — góc trái trên, mũi tên xuống. Thay
                 cho dải dọc 6 nút chiếm nhiều chỗ trước đây: giờ chỉ 1 nút nhỏ, bấm vào mở panel
                 #visualizer-control-center trượt từ trên xuống full chiều rộng (kiểu Control
                 Center điện thoại), gập lại khi bấm lần 2 hoặc bấm ra ngoài panel. -->
            <button id="btn-open-control-center" class="absolute top-4 left-3 sm:left-6 w-10 h-10 flex items-center justify-center glass-panel hover:bg-white/10 rounded-full transition-colors group shadow-lg pointer-events-auto z-40" title="Bảng điều khiển nhanh">
                <svg id="icon-control-center-down" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-300 group-hover:text-white transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </button>

            <!-- Panel "Control Center" — trượt từ trên xuống, full chiều rộng, chứa GRID icon
                 (Đổi hiệu ứng / Phụ đề / Cài đặt / Trộn bài / Lặp lại) thay cho dải dọc cũ. Mỗi ô
                 grid = icon + nhãn chữ nhỏ (giống Control Center điện thoại, không chỉ trơ icon).
                 Đóng bằng: bấm lại nút mũi tên, bấm 1 icon trong grid (tự đóng sau khi chọn), hoặc
                 bấm vùng overlay mờ phía dưới panel. -->
            <div id="control-center-overlay" class="hidden fixed inset-0 z-[45] pointer-events-auto"></div>
            <div id="visualizer-control-center" class="absolute top-0 left-0 right-0 drawer-glass border-b border-white/10 rounded-b-3xl shadow-2xl transform -translate-y-full transition-transform duration-300 ease-in-out z-[46] pointer-events-auto pt-16 pb-6 px-5">
                <div class="grid grid-cols-4 sm:grid-cols-5 gap-3 max-w-md mx-auto">
                    <button id="btn-cycle-mode" data-cc-action class="flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-white/10 transition-colors relative" title="Đổi hiệu ứng">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 11a9 9 0 019 9M4 11a9 9 0 019-9m9 9a9 9 0 01-9-9m9 9a9 9 0 01-9 9m-9-9h18" /></svg>
                        <span class="text-[10px] text-slate-300 font-medium">Hiệu ứng</span>
                        <span id="mode-badge" class="absolute top-1 right-3 bg-sky-500 text-[9px] font-bold px-1 rounded-full border border-slate-900 shadow-md">1/9</span>
                    </button>
                    <button id="btn-subtitle" data-cc-action class="flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-white/10 transition-colors relative" title="Phụ đề (Subtitles)">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                        <span class="text-[10px] text-slate-300 font-medium">Phụ đề</span>
                        <span id="sub-toggle-badge" class="hidden absolute top-1 right-3 bg-green-500 text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border border-slate-900 text-white shadow-md"></span>
                    </button>
                    <button id="btn-settings" data-cc-action class="flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-white/10 transition-colors" title="Cài đặt">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span class="text-[10px] text-slate-300 font-medium">Cài đặt</span>
                    </button>
                    <button id="btn-shuffle" data-cc-action class="flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-white/10 transition-colors text-slate-400" title="Trộn bài">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        <span class="text-[10px] font-medium">Trộn bài</span>
                    </button>
                    <button id="btn-repeat" data-cc-action class="flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-white/10 transition-colors text-slate-400 relative" title="Lặp lại">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        <span class="text-[10px] font-medium">Lặp lại</span>
                        <span id="repeat-badge" class="hidden absolute top-1 right-3 bg-sky-500 text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border border-slate-900 text-white">1</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
`;
