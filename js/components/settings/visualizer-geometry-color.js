/**
 * Component (sub-template): Settings Drawer — Section "Kiểu hiệu ứng" (rút gọn).
 *
 * Ver 8 refine (mục 3): toàn bộ "Hình học Visualizer" + "Màu sắc Visualizer" (Chất lượng Render,
 * độ cao/độ dày thanh, kiểu Vortex/Bar/Rain, màu nền/màu sóng âm — rất nhiều control) ĐÃ CHUYỂN
 * sang drawer riêng `js/components/visualizer-settings-drawer.js` (biến TPL_VISUALIZER_SETTINGS_
 * DRAWER), đúng pattern navigation stack ở About/Storage Drawer. File này (vẫn giữ tên cũ +
 * biến TPL_SETTINGS_VISUALIZER để không phải sửa object điều phối SettingsDrawer ở
 * settings-drawer.js) giờ CHỈ còn 2 thứ:
 *   - select "Kiểu hiệu ứng" (#setting-visualizer-type) — chọn TRỰC TIẾP 1 trong 6 visual,
 *     thay cho việc phải bấm nút cycle (#btn-cycle-mode) nhiều lần mới tới đúng kiểu muốn —
 *     đây là phần người dùng cần "ngay trong giao diện", không phải mở drawer mới thấy.
 *   - nút "Tùy chỉnh Visualizer" mở drawer chứa phần còn lại (Chất lượng Render, hình học chi
 *     tiết theo từng kiểu, màu sắc).
 */
const TPL_SETTINGS_VISUALIZER = `

        <!-- SECTION: KIỂU HIỆU ỨNG (rút gọn, ver 8 refine) -->
        <div>
            <h3 class="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 ml-2">Visualizer</h3>
            <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                <div class="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                    <span class="text-sm font-medium">Kiểu hiệu ứng</span>
                    <select id="setting-visualizer-type" class="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none w-36 text-right">
                        <option value="bar">Bar (Cột nhạc)</option>
                        <option value="lightning">Lightning (Sấm chớp)</option>
                        <option value="rubik">Rubik</option>
                        <option value="vortex">Vortex (Đường hầm)</option>
                        <option value="black hole">Black Hole</option>
                        <option value="rain">Rain (Mưa)</option>
                    </select>
                </div>
                <button id="setting-open-visualizer-settings" class="flex justify-between items-center p-4 hover:bg-white/5 transition-colors w-full text-left">
                    <div>
                        <div class="text-sm font-medium">Tùy chỉnh Visualizer</div>
                        <div class="text-xs text-slate-400 mt-0.5">Chất lượng render, hình học theo từng kiểu, màu sắc</div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>
`;
