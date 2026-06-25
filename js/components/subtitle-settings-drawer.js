/**
 * Component: Subtitle Settings Drawer (ngăn kéo "Tùy chỉnh Phụ đề")
 * Biến này chứa chuỗi HTML, được main.js chèn vào DOM lúc khởi động.
 *
 * Ver 8 refine (mục 3): toàn bộ slider style khung/chữ phụ đề (màu/độ trong suốt nền, màu/độ
 * trong suốt/độ dày/độ uốn viền, màu chữ, cỡ chữ, line-height, letter-spacing) CHUYỂN từ Settings
 * chính sang DRAWER RIÊNG — đúng pattern navigation stack ở About/Storage/Visualizer Settings
 * Drawer. Settings chính giờ CHỈ còn toggle "Hiện phụ đề" (on/off) + nút "Tùy chỉnh" mở drawer này.
 */
const TPL_SUBTITLE_SETTINGS_DRAWER = `
    <div id="drawer-subtitle-settings" class="fixed inset-0 drawer-glass z-[90] transform translate-y-full transition-transform duration-500 ease-in-out flex flex-col">
        <div class="flex justify-between items-center px-4 py-3 sm:px-6 border-b border-white/10 shrink-0 bg-black/40">
            <div class="flex items-center gap-2">
                <button id="btn-back-subtitle-settings" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white" title="Quay lại Cài đặt">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 class="text-base sm:text-lg font-bold tracking-wider text-white uppercase">Tùy chỉnh Phụ đề</h2>
            </div>
        </div>

        <div class="flex-grow overflow-y-auto px-4 py-6 sm:px-8 pb-20">
            <div class="max-w-2xl mx-auto space-y-8">

                <!-- SECTION: PHỤ ĐỀ -->
                <div>
                    <h3 class="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2 ml-2">Khung & Chữ Phụ đề</h3>
                    <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                        <div class="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <span class="text-sm font-medium">Màu nền khung</span>
                            <div class="w-8 h-8 rounded-full border border-white/20 overflow-hidden shrink-0"><input type="color" id="setting-sub-bg-color" class="w-10 h-10 -m-1 cursor-pointer"></div>
                        </div>
                        <div class="flex flex-col p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div class="flex justify-between items-center mb-2"><span class="text-sm font-medium">Độ trong suốt nền</span><span id="val-sub-bg-opacity" class="text-xs text-yellow-400 font-mono">40%</span></div>
                            <input type="range" id="setting-sub-bg-opacity" min="0" max="100" step="1" class="setting-slider">
                        </div>
                        <div class="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <span class="text-sm font-medium">Màu viền khung</span>
                            <div class="w-8 h-8 rounded-full border border-white/20 overflow-hidden shrink-0"><input type="color" id="setting-sub-border-color" class="w-10 h-10 -m-1 cursor-pointer"></div>
                        </div>
                        <div class="flex flex-col p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div class="flex justify-between items-center mb-2"><span class="text-sm font-medium">Độ trong suốt viền</span><span id="val-sub-border-opacity" class="text-xs text-yellow-400 font-mono">10%</span></div>
                            <input type="range" id="setting-sub-border-opacity" min="0" max="100" step="1" class="setting-slider">
                        </div>
                        <div class="flex flex-col p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div class="flex justify-between items-center mb-2"><span class="text-sm font-medium">Độ dày viền (px)</span><span id="val-sub-border-width" class="text-xs text-yellow-400 font-mono">1</span></div>
                            <input type="range" id="setting-sub-border-width" min="0" max="6" step="1" class="setting-slider">
                        </div>
                        <div class="flex flex-col p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div class="flex justify-between items-center mb-2"><span class="text-sm font-medium">Độ uốn góc khung (px)</span><span id="val-sub-border-radius" class="text-xs text-yellow-400 font-mono">16</span></div>
                            <input type="range" id="setting-sub-border-radius" min="0" max="40" step="1" class="setting-slider">
                        </div>
                        <div class="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <span class="text-sm font-medium">Màu chữ phụ đề</span>
                            <div class="w-8 h-8 rounded-full border border-white/20 overflow-hidden shrink-0"><input type="color" id="setting-sub-text-color" class="w-10 h-10 -m-1 cursor-pointer"></div>
                        </div>
                        <div class="flex flex-col p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div class="flex justify-between items-center mb-2"><span class="text-sm font-medium">Cỡ chữ (px)</span><span id="val-sub-font-size" class="text-xs text-yellow-400 font-mono">8</span></div>
                            <input type="range" id="setting-sub-font-size" min="8" max="16" step="1" class="setting-slider">
                        </div>
                        <div class="flex flex-col p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div class="flex justify-between items-center mb-2"><span class="text-sm font-medium">Giãn dòng (Line height)</span><span id="val-sub-line-height" class="text-xs text-yellow-400 font-mono">1.3</span></div>
                            <input type="range" id="setting-sub-line-height" min="1" max="2.5" step="0.1" class="setting-slider">
                        </div>
                        <div class="flex flex-col p-4 hover:bg-white/5 transition-colors">
                            <div class="flex justify-between items-center mb-2"><span class="text-sm font-medium">Giãn chữ (Letter spacing, px)</span><span id="val-sub-letter-spacing" class="text-xs text-yellow-400 font-mono">0</span></div>
                            <input type="range" id="setting-sub-letter-spacing" min="-1" max="5" step="0.5" class="setting-slider">
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
`;
