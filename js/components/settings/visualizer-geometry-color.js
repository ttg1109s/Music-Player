/**
 * Component (sub-template): Settings Drawer — Section "Hình học Visualizer" + "Màu sắc
 * Visualizer". Tách từ js/components/settings-drawer.js (ver 8) — gộp 2 SECTION gốc lại
 * thành 1 file vì chúng nằm trong cùng 1 <div> bao ngoài ở bản gốc (Chất lượng render, độ
 * cao/độ dày thanh, kiểu Vortex/Bar/Rain + màu nền/màu sóng âm).
 */
const TPL_SETTINGS_VISUALIZER = `

        <!-- SECTION: VISUALIZER -->
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
`;

