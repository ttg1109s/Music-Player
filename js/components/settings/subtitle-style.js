/**
 * Component (sub-template): Settings Drawer — Section "Khung & Chữ Phụ đề".
 * Tách từ js/components/settings-drawer.js (ver 8). Toàn bộ tham số style của khung phụ đề
 * (màu/độ trong suốt nền, màu/độ trong suốt/độ dày/độ uốn viền, màu chữ, cỡ chữ, line-height,
 * letter-spacing) — xem applySubtitleStyle() trong equalizer-settings.js.
 *
 * Ver 8 refine: toggle "Hiện phụ đề" (bật/tắt sub) CHUYỂN VỀ ĐÂY từ trình quản lý phụ đề
 * (modal #subtitle-modal, nút "Bật Sub"/"Tắt Sub" cũ) — đúng phân vùng "mọi tuỳ chọn hiển thị
 * nằm trong Cài đặt", trình quản lý phụ đề chỉ còn lo việc soạn nội dung dòng sub. Toggle này
 * giờ ĐƯỢC LƯU vào vizConfig.subtitlesEnabled (trước đây chỉ là biến in-memory
 * isSubtitlesEnabled, mất khi tải lại trang) — xem equalizer-settings.js.
 */
const TPL_SETTINGS_SUBTITLE_STYLE = `

        <!-- SECTION: PHỤ ĐỀ -->
        <div>
            <h3 class="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2 ml-2">Khung & Chữ Phụ đề</h3>
            <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                <div class="flex justify-between items-center p-4 border-b border-white/5">
                    <div class="pr-3">
                        <div class="text-sm font-medium">Hiện phụ đề</div>
                        <div class="text-xs text-slate-400 mt-0.5">Tắt đi để ẩn toàn bộ khung phụ đề khi phát, không cần xoá nội dung đã soạn.</div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" id="setting-subtitles-enabled" class="sr-only peer" checked>
                        <div class="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500 shadow-inner"></div>
                    </label>
                </div>
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
`;

