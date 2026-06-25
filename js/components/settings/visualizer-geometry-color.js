/**
 * Component (sub-template): Settings Drawer — Section "Kiểu hiệu ứng" (rút gọn).
 *
 * Ver 8 refine (mục 3): toàn bộ "Hình học Visualizer" + "Màu sắc Visualizer" (Chất lượng Render,
 * độ cao/độ dày thanh, kiểu Vortex/Bar/Rain, màu nền/màu sóng âm — rất nhiều control) ĐÃ CHUYỂN
 * sang drawer riêng `js/components/visualizer-settings-drawer.js` (biến TPL_VISUALIZER_SETTINGS_
 * DRAWER), đúng pattern navigation stack ở About/Storage Drawer. File này (vẫn giữ tên cũ +
 * biến TPL_SETTINGS_VISUALIZER để không phải sửa object điều phối SettingsDrawer ở
 * settings-drawer.js) giờ còn 3 thứ:
 *   - select "Kiểu hiệu ứng" (#setting-visualizer-type) — chọn TRỰC TIẾP 1 trong 6 visual,
 *     thay cho việc phải bấm nút cycle (#btn-cycle-mode) nhiều lần mới tới đúng kiểu muốn —
 *     đây là phần người dùng cần "ngay trong giao diện", không phải mở drawer mới thấy.
 *   - nút "Tùy chỉnh Visualizer" mở drawer chứa phần còn lại (Chất lượng Render, hình học chi
 *     tiết theo từng kiểu, màu sắc).
 *   - toggle "Hiện Visual" (#setting-visual-enable) — ver 10 refine: CHUYỂN VÀO ĐÂY từ section
 *     riêng "Hiệu ứng Visualizer" (trước nằm ở js/components/settings/playlist-background.js) —
 *     mọi setting liên quan tới HIỂN THỊ hiệu ứng (kiểu/tuỳ chỉnh/bật-tắt) giờ nằm 1 nơi. Lưu ý:
 *     đây KHÁC nút "Đổi hiệu ứng" (#btn-cycle-mode) ở Control Center của Visualizer UI — nút đó
 *     vẫn giữ nguyên, dùng để đổi NHANH sang kiểu hiệu ứng kế tiếp, không phải bật/tắt. id giữ
 *     nguyên `setting-visual-enable` — JS xử lý ở state-and-video-bg.js không cần đổi gì.
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
                <button id="setting-open-visualizer-settings" class="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors w-full text-left">
                    <div>
                        <div class="text-sm font-medium">Tùy chỉnh Visualizer</div>
                        <div class="text-xs text-slate-400 mt-0.5">Chất lượng render, hình học theo từng kiểu, màu sắc</div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </button>
                <div class="flex justify-between items-center p-4">
                    <div class="pr-3">
                        <div class="text-sm font-medium">Hiện Visual</div>
                        <div class="text-xs text-slate-400 mt-0.5">Tắt đi để chỉ xem nền (video/ảnh/màu đã chọn), ẩn hẳn hiệu ứng visualizer mà không cần đụng tới Video Background.</div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" id="setting-visual-enable" class="sr-only peer" checked>
                        <div class="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500 shadow-inner"></div>
                    </label>
                </div>
            </div>
        </div>
`;

