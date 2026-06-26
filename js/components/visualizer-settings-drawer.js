/**
 * Component: Visualizer Settings Drawer (ngăn kéo "Tùy chỉnh Visualizer")
 * Biến này chứa chuỗi HTML, được main.js chèn vào DOM lúc khởi động.
 *
 * Ver 8 refine (mục 3): hợp nhất "Chất lượng Render" + "Hình học Visualizer" + "Màu sắc
 * Visualizer" (trước đây nằm thẳng trong Settings chính, rất dài) vào 1 DRAWER RIÊNG — đúng
 * pattern navigation stack đã có ở About/Storage Drawer: z-index cao hơn #drawer-settings
 * (z-[80]) để mở chồng lên trên, Back chỉ ẩn drawer này, không động vào Settings bên dưới.
 *
 * Trong Settings chính giờ CHỈ còn lại "Kiểu hiệu ứng" (select chọn trực tiếp 1 trong 6 visual —
 * Bar/Lightning/Rubik/Vortex/Black Hole/Rain, thay cho việc phải bấm nút cycle nhiều lần) + nút
 * mở drawer này để vào sâu hơn (Chất lượng Render, hình học chi tiết theo từng kiểu, màu sắc, và
 * "Tự động đổi hiệu ứng" — xem mục dưới).
 *
 * Ver 10 refine #2: thêm SECTION "Tự động đổi hiệu ứng" (CHUYỂN VÀO ĐÂY từ Settings chính —
 * js/components/settings/visualizer-geometry-color.js — nơi nó đã ở SAI VỊ TRÍ kể từ lúc mới
 * thêm ở ver 10). Đây là thiết lập nâng cao của visualizer (hẹn giờ tự đổi hiệu ứng), nên thuộc
 * đúng nhóm "tuỳ chỉnh chi tiết" ở drawer này, không phải thứ cần thấy ngay khi mở Settings.
 * Toàn bộ id + JS xử lý (initAutoSwitchVisualUI(), js/core/auto-switch-visual.js) giữ NGUYÊN
 * không đổi gì — hàm đó chỉ cần các #id tồn tại trong DOM, không quan tâm nằm ở template nào.
 */
const TPL_VISUALIZER_SETTINGS_DRAWER = `
    <div id="drawer-visualizer-settings" class="fixed inset-0 drawer-glass z-[90] transform translate-y-full transition-transform duration-500 ease-in-out flex flex-col">
        <div class="flex justify-between items-center px-4 py-3 sm:px-6 border-b border-white/10 shrink-0 bg-black/40">
            <div class="flex items-center gap-2">
                <button id="btn-back-visualizer-settings" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white" title="Quay lại Cài đặt">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 class="text-base sm:text-lg font-bold tracking-wider text-white uppercase">Tùy chỉnh Visualizer</h2>
            </div>
        </div>

        <div class="flex-grow overflow-y-auto px-4 py-6 sm:px-8 pb-20">
            <div class="max-w-2xl mx-auto space-y-8">

                <!-- SECTION: VISUALIZER (Chất lượng Render + Hình học theo từng kiểu) -->
                <div>
                    <h3 class="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 ml-2">Hình học Visualizer</h3>
                    <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden mb-6">
                        <div class="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <span class="text-sm font-medium">Chất lượng Render</span>
                            <select id="setting-quality" class="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none w-32 text-right">
                                <option value="high">Cao (Mượt)</option>
                                <option value="medium">Trung bình</option>
                                <option value="low">Thấp (Nhẹ máy)</option>
                            </select>
                        </div>
                        <div id="block-max-height" class="flex flex-col w-full">
                            <div class="flex flex-col p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                <div class="flex justify-between items-center mb-2"><span class="text-sm font-medium">Độ cao tối đa</span><span id="val-max" class="text-xs text-emerald-400 font-mono">400</span></div>
                                <input type="range" id="setting-max-height" min="50" max="1000" step="10" class="setting-slider">
                            </div>
                        </div>
                        <div id="block-bar-width" class="hidden flex-col w-full">
                            <div class="flex flex-col p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                <div class="flex justify-between items-center mb-2"><span class="text-sm font-medium">Độ dày thanh (px)</span><span id="val-width" class="text-xs text-emerald-400 font-mono">4</span></div>
                                <input type="range" id="setting-bar-width" min="1" max="15" step="1" class="setting-slider">
                            </div>
                        </div>
                        <div id="block-vortex" class="hidden flex justify-between items-center p-4 hover:bg-white/5 transition-colors bg-indigo-900/10 border-b border-indigo-500/20">
                            <div><div class="text-sm font-medium text-indigo-300">Kiểu Ống Vortex</div></div>
                            <select id="setting-vortex-style" class="bg-black/60 border border-indigo-500/30 rounded-lg px-2 py-1.5 text-xs text-white outline-none w-44 text-right">
                                <option value="rings">Vòng Ring Ánh Sáng</option>
                                <option value="bars">Đoạn Bar 3D (Equalizer)</option>
                                <option value="wave">Nhiễu Động Sóng (Fade)</option>
                            </select>
                        </div>
                        <div id="block-bar-style" class="hidden flex-col bg-emerald-900/10 border-b border-emerald-500/20">
                            <div class="flex justify-between items-center p-4 hover:bg-white/5 transition-colors border-b border-emerald-500/10">
                                <div><div class="text-sm font-medium text-emerald-300">Kiểu Bar</div></div>
                                <select id="setting-bar-style" class="bg-black/60 border border-emerald-500/30 rounded-lg px-2 py-1.5 text-xs text-white outline-none w-40 text-right">
                                    <option value="mirror">Phản chiếu (Cánh bướm)</option>
                                    <option value="cascade">Thác đổ</option>
                                </select>
                            </div>
                            <div id="bar-mirror-options" class="hidden flex-col">
                                <div class="flex flex-col p-4 border-b border-emerald-500/10 hover:bg-white/5 transition-colors">
                                    <div class="flex justify-between items-center mb-2"><span class="text-sm font-medium text-emerald-300">Số lượng thanh (mỗi bên)</span><span id="val-mirror-count" class="text-xs text-emerald-400 font-mono">32</span></div>
                                    <input type="range" id="setting-mirror-count" min="10" max="32" step="1" class="setting-slider">
                                </div>
                            </div>
                        </div>
                        <div id="block-rain" class="hidden flex-col bg-blue-900/10 border-b border-blue-500/20">
                            <div class="flex justify-between items-center p-4 hover:bg-white/5 transition-colors border-b border-blue-500/10">
                                <div><div class="text-sm font-medium text-blue-300">Kiểu hiệu ứng mưa</div></div>
                                <select id="setting-rain-style" class="bg-black/60 border border-blue-500/30 rounded-lg px-2 py-1.5 text-xs text-white outline-none w-36 text-right">
                                    <option value="glass">Trôi trên cửa kính</option><option value="street">Mưa phố &amp; công viên</option>
                                </select>
                            </div>
                            <div class="flex justify-between items-center p-4 hover:bg-white/5 transition-colors border-b border-blue-500/10">
                                <div><div class="text-sm font-medium text-blue-300">Chớp sáng (kính &amp; đèn đường)</div></div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="setting-glass-flash" class="sr-only peer">
                                    <div class="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500 shadow-inner"></div>
                                </label>
                            </div>
                        </div>
        
                    </div>
        
                    <h3 class="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2 ml-2">Màu sắc Visualizer</h3>
                    <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                        <div class="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <span class="text-sm font-medium">Màu nền đen</span>
                            <div class="w-8 h-8 rounded-full border border-white/20 overflow-hidden shrink-0"><input type="color" id="bg-color-picker" class="w-10 h-10 -m-1 cursor-pointer"></div>
                        </div>
                        <div class="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <span class="text-sm font-medium">Chế độ sóng âm</span>
                            <select id="setting-color-mode" class="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none w-36 text-right">
                                <option value="solid">Màu đơn sắc</option><option value="dynamic">Pha trộn 2 màu</option><option value="gradient">Gradient theo nhạc</option>
                            </select>
                        </div>
                        <div id="solid-color-container" class="flex justify-between items-center p-4 hover:bg-white/5 transition-colors bg-black/20">
                            <span class="text-sm text-slate-300">Chọn màu đơn</span>
                            <div class="flex items-center gap-2">
                                <input type="text" id="solid-color-text" class="w-20 bg-transparent border-b border-white/20 px-1 py-0.5 text-xs text-white outline-none font-mono text-right uppercase">
                                <div class="w-8 h-8 rounded-full border border-white/20 overflow-hidden shrink-0"><input type="color" id="solid-color-picker" class="w-10 h-10 -m-1 cursor-pointer"></div>
                            </div>
                        </div>
                        <div id="dynamic-color-container" class="hidden flex justify-between items-center p-4 hover:bg-white/5 transition-colors bg-black/20">
                            <span class="text-sm text-slate-300">Chọn 2 màu pha trộn</span>
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-full border border-white/20 overflow-hidden shrink-0"><input type="color" id="dyn-color-a" class="w-10 h-10 -m-1 cursor-pointer"></div>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                <div class="w-8 h-8 rounded-full border border-white/20 overflow-hidden shrink-0"><input type="color" id="dyn-color-b" class="w-10 h-10 -m-1 cursor-pointer"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECTION: TỰ ĐỘNG ĐỔI HIỆU ỨNG (ver 10, CHUYỂN VÀO ĐÂY ở ver 10 refine #2) — xem
                     logic đầy đủ ở js/core/auto-switch-visual.js. Trước đây nằm ngay trong Settings
                     chính (visualizer-geometry-color.js) — dồn vào đây để đúng nhóm "tuỳ chỉnh
                     visualizer nâng cao" cùng Chất lượng Render/Hình học/Màu sắc ở trên, vì đây
                     cũng là 1 thiết lập chi tiết cho visualizer, không phải thứ cần thấy ngay khi
                     mở Settings. Toàn bộ id/JS xử lý (initAutoSwitchVisualUI() ở
                     auto-switch-visual.js) giữ NGUYÊN không đổi — hàm đó chỉ cần các #id này tồn
                     tại trong DOM, không quan tâm chúng nằm ở template nào. -->
                <div>
                    <h3 class="text-xs font-bold text-fuchsia-400 uppercase tracking-widest mb-2 ml-2">Tự động đổi hiệu ứng</h3>
                    <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                        <div class="flex justify-between items-center p-4">
                            <div class="pr-3">
                                <div class="text-sm font-medium">Bật tự động đổi</div>
                                <div class="text-xs text-slate-400 mt-0.5">Tự đổi sang hiệu ứng khác sau mỗi khoảng thời gian, không cần bấm tay. Khi bật, nút "Đổi hiệu ứng" ở Control Center của màn Visualizer sẽ tạm khoá (tránh xung đột giữa đổi tự động và đổi tay).</div>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer shrink-0">
                                <input type="checkbox" id="setting-auto-switch-enable" class="sr-only peer">
                                <div class="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500 shadow-inner"></div>
                            </label>
                        </div>

                        <div id="auto-switch-options" class="hidden flex flex-col border-t border-white/5">
                            <div class="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                <span class="text-sm font-medium">Cách đổi</span>
                                <select id="setting-auto-switch-mode" class="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none w-32 text-right">
                                    <option value="sequential">Tuần tự</option>
                                    <option value="random">Ngẫu nhiên</option>
                                </select>
                            </div>

                            <div class="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                <span class="text-sm font-medium">Thời gian đổi</span>
                                <select id="setting-auto-switch-time-mode" class="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none w-36 text-right">
                                    <option value="fixed">Cố định</option>
                                    <option value="random">Ngẫu nhiên trong khoảng</option>
                                    <option value="duration">Theo độ dài bài hát</option>
                                </select>
                            </div>

                            <!-- Khối riêng cho mode 'fixed' (c1) — JS toggle hidden theo đúng lựa chọn select trên -->
                            <div id="auto-switch-time-fixed-block" class="hidden flex-col p-4 border-b border-white/5 gap-2">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs text-slate-400">Đổi sau mỗi (giây), tối thiểu 10s</span>
                                    <input type="number" id="setting-auto-switch-seconds-fixed" min="10" step="1" class="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none w-20 text-right">
                                </div>
                            </div>

                            <!-- Khối riêng cho mode 'random' (c2) — cận dưới LUÔN 10s cố định, chỉ điền cận trên -->
                            <div id="auto-switch-time-random-block" class="hidden flex-col p-4 border-b border-white/5 gap-2">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs text-slate-400">Ngẫu nhiên từ 10s đến (giây)</span>
                                    <input type="number" id="setting-auto-switch-seconds-random" min="10" step="1" class="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none w-20 text-right">
                                </div>
                            </div>

                            <!-- Khối riêng cho mode 'duration' (c3) — KHÁC HẲN 2 khối trên: X điền vào đây
                                 là SỐ CHIA trong (độ dài bài / X), KHÔNG phải khoảng cách trực tiếp — hệ
                                 thống tự kẹp X không vượt quá MỘT NỬA độ dài bài đang phát, để đảm bảo
                                 luôn có ít nhất 1 lần đổi xảy ra (xem buildAutoSwitchVisualMarks() ở
                                 auto-switch-visual.js để biết công thức kẹp chính xác). -->
                            <div id="auto-switch-time-duration-block" class="hidden flex-col p-4 gap-2">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs text-slate-400">Chia độ dài bài hát cho (tối thiểu 10s)</span>
                                    <input type="number" id="setting-auto-switch-seconds-duration" min="10" step="1" class="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none w-20 text-right">
                                </div>
                                <p class="text-xs text-slate-400 leading-relaxed">Khoảng cách giữa 2 lần đổi = độ dài bài / số đã điền, tính lại theo từng bài đang phát. Hệ thống tự giới hạn không quá một nửa độ dài bài, để luôn có ít nhất 1 lần đổi hiệu ứng trong lúc nghe. Tua tới/lùi vẫn nhớ đúng hiệu ứng đã đổi ở từng đoạn.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
`;
