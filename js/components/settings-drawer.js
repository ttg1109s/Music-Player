/**
 * Component: Settings Drawer (ngăn kéo cài đặt hệ thống toàn màn hình)
 * Biến này chứa chuỗi HTML, được main.js chèn vào DOM lúc khởi động.
 */
const TPL_SETTINGS_DRAWER = `
    <div id="drawer-settings" class="fixed inset-0 drawer-glass z-[80] transform -translate-y-full transition-transform duration-500 ease-in-out flex flex-col">
        <div class="flex justify-between items-center px-4 py-3 sm:px-6 border-b border-white/10 shrink-0 bg-black/40">
            <h2 class="text-base sm:text-lg font-bold tracking-wider text-white uppercase">Cài đặt Hệ thống</h2>
            <button id="close-drawer" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-rose-500 transition-colors text-white"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        
        <div class="flex-grow overflow-y-auto px-4 py-6 sm:px-8 pb-20">
            <div class="max-w-2xl mx-auto space-y-8">
                
                <!-- SECTION: HỆ THỐNG & PLAYLIST -->
                <div>
                    <h3 class="text-xs font-bold text-sky-400 uppercase tracking-widest mb-2 ml-2">Danh sách phát & Nền</h3>
                    <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                        <div class="flex flex-col border-b border-sky-500/30 bg-sky-900/20">
                            <div class="flex justify-between items-center p-4 hover:bg-white/5 transition-colors">
                                <span class="text-sm font-medium text-sky-300">Sử dụng Video Background</span>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="setting-video-enable" class="sr-only peer">
                                    <div class="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500 shadow-inner"></div>
                                </label>
                            </div>
                            <div class="flex justify-between items-center p-4 pt-0">
                                <div><div class="text-xs text-slate-400">Thay thế mọi hình nền bằng Video</div></div>
                                <label class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow">
                                    Chọn Video
                                    <input type="file" id="setting-video-upload" accept="video/*" class="hidden">
                                </label>
                            </div>
                            <div class="flex justify-between items-center p-4 pt-0 border-t border-white/5">
                                <div><div class="text-sm font-medium text-sky-300">Video phủ kín, tạm dừng Visual</div><div class="text-xs text-slate-400">Ẩn & dừng tính toán visual khi Video đang hiển thị</div></div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="setting-video-hide-visual" class="sr-only peer">
                                    <div class="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500 shadow-inner"></div>
                                </label>
                            </div>
                        </div>

                        <div class="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div><div class="text-sm font-medium">Ảnh nền Playlist</div></div>
                            <label class="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow">
                                Đổi ảnh
                                <input type="file" id="setting-bg-upload" accept="image/*" class="hidden">
                            </label>
                        </div>
                        <div class="flex flex-col p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm font-medium">Độ mờ nhòe nền (Blur)</span>
                                <span id="val-bg-blur" class="text-xs text-sky-400 font-mono">0px</span>
                            </div>
                            <input type="range" id="setting-bg-blur" min="0" max="20" step="1" class="setting-slider">
                        </div>
                    </div>
                </div>

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
                        <div id="block-geometry" class="flex flex-col w-full">
                            <div class="flex flex-col p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                <div class="flex justify-between items-center mb-2"><span class="text-sm font-medium">Độ cao tối đa</span><span id="val-max" class="text-xs text-emerald-400 font-mono">400</span></div>
                                <input type="range" id="setting-max-height" min="50" max="1000" step="10" class="setting-slider">
                            </div>
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
                        <div id="block-bar-style" class="hidden flex justify-between items-center p-4 hover:bg-white/5 transition-colors bg-emerald-900/10 border-b border-emerald-500/20">
                            <div><div class="text-sm font-medium text-emerald-300">Kiểu Bar</div></div>
                            <select id="setting-bar-style" class="bg-black/60 border border-emerald-500/30 rounded-lg px-2 py-1.5 text-xs text-white outline-none w-40 text-right">
                                <option value="mirror">Phản chiếu (Cánh bướm)</option>
                                <option value="cascade">Thác đổ</option>
                            </select>
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
                            <div id="rain-street-options" class="hidden flex-col">
                                <div class="flex justify-between items-center p-4 hover:bg-white/5 transition-colors border-t border-blue-500/10">
                                    <div><div class="text-sm font-medium text-blue-300">Người đứng dưới đèn</div></div>
                                    <select id="setting-street-standing" class="bg-black/60 border border-blue-500/30 rounded-lg px-2 py-1.5 text-xs text-white outline-none w-36 text-right">
                                        <option value="0">Không có ai</option>
                                        <option value="1">1 người</option>
                                        <option value="2">2 người</option>
                                        <option value="3">3 người</option>
                                    </select>
                                </div>
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

                <!-- SECTION: AUDIO EQ & VOLUME -->
                <div>
                    <h3 class="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2 ml-2">Âm thanh & Equalizer</h3>
                    <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                        <div class="flex flex-col p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm font-medium flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-violet-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" /></svg> Âm lượng tổng</span>
                                <span id="val-volume" class="text-xs text-sky-400 font-mono">100%</span>
                            </div>
                            <input type="range" id="setting-volume" min="0" max="100" step="1" value="100" class="setting-slider">
                        </div>
                        <div class="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div><div class="text-sm font-medium">Chế độ Equalizer</div></div>
                            <select id="setting-eq" class="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none w-36 text-right">
                                <option value="flat">Mặc định (Flat)</option>
                                <option value="bass_boost">Siêu Trầm (Bass)</option>
                                <option value="pop">Nhạc Pop</option>
                                <option value="rock">Nhạc Rock</option>
                                <option value="acoustic">Mộc (Acoustic)</option>
                                <option value="electronic">Điện tử (EDM)</option>
                                <option value="manual">Tùy chỉnh thủ công</option>
                            </select>
                        </div>
                        <div id="eq-manual-container" class="p-4 bg-black/20 flex flex-col gap-2 transition-all">
                            <span class="text-xs text-slate-400 text-center mb-1">Dải tần số (Hz)</span>
                            <div class="flex justify-between items-end h-32 px-2" id="eq-sliders-wrapper">
                                <!-- Tạo bằng JS -->
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
`;
