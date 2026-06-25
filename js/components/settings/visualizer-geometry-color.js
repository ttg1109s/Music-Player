/**
 * Component (sub-template): Settings Drawer — Section "Kiểu hiệu ứng" (rút gọn) + "Tự động đổi
 * hiệu ứng" (auto-switch-visual, ver 10).
 *
 * Ver 8 refine (mục 3): toàn bộ "Hình học Visualizer" + "Màu sắc Visualizer" (Chất lượng Render,
 * độ cao/độ dày thanh, kiểu Vortex/Bar/Rain, màu nền/màu sóng âm — rất nhiều control) ĐÃ CHUYỂN
 * sang drawer riêng `js/components/visualizer-settings-drawer.js` (biến TPL_VISUALIZER_SETTINGS_
 * DRAWER), đúng pattern navigation stack ở About/Storage Drawer. File này (vẫn giữ tên cũ +
 * biến TPL_SETTINGS_VISUALIZER để không phải sửa object điều phối SettingsDrawer ở
 * settings-drawer.js) giờ có 2 card:
 *
 * CARD 1 — "Visualizer" (kiểu hiệu ứng):
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
 *
 * CARD 2 — "Tự động đổi hiệu ứng" (mới, ver 10) — xem logic đầy đủ ở js/core/auto-switch-visual.js:
 *   - toggle bật/tắt tổng (#setting-auto-switch-enable).
 *   - khi bật, hiện thêm 2 nhóm lựa chọn (ẨN HẲN khi tắt, không chỉ làm mờ — JS tự toggle 'hidden'
 *     ở #auto-switch-options, xem auto-switch-visual.js):
 *     (1) "Cách đổi" (#setting-auto-switch-mode): Tuần tự (theo đúng thứ tự MODES, giống
 *         #btn-cycle-mode) | Ngẫu nhiên (random 1 kiểu khác kiểu hiện tại mỗi lần đổi).
 *     (2) "Thời gian đổi" (#setting-auto-switch-time-mode), 3 lựa chọn loại trừ nhau, MỖI lựa
 *         chọn có khối input/giải thích riêng (JS tự ẩn/hiện đúng khối khớp lựa chọn đang chọn):
 *           - 'fixed'    : input số giây cố định (#setting-auto-switch-seconds-fixed), tối thiểu
 *                          AUTO_SWITCH_VISUAL_MIN_SECONDS (10s) — validate ở cả input (min HTML)
 *                          và JS (đề phòng nhập tay vượt qua min HTML bằng cách khác).
 *           - 'random'   : input số giây làm CẬN TRÊN (#setting-auto-switch-seconds-random) —
 *                          cận dưới luôn là 10s cố định, không có ô nhập riêng cho cận dưới.
 *           - 'duration' : KHÔNG có input nào — chỉ 1 đoạn giải thích tĩnh, vì công thức là
 *                          duration bài hát / 10 (cố định), người dùng không can thiệp được.
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

        <!-- SECTION: TỰ ĐỘNG ĐỔI HIỆU ỨNG (mới, ver 10) — xem logic ở js/core/auto-switch-visual.js -->
        <div>
            <h3 class="text-xs font-bold text-fuchsia-400 uppercase tracking-widest mb-2 ml-2">Tự động đổi hiệu ứng</h3>
            <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                <div class="flex justify-between items-center p-4">
                    <div class="pr-3">
                        <div class="text-sm font-medium">Bật tự động đổi</div>
                        <div class="text-xs text-slate-400 mt-0.5">Tự đổi sang hiệu ứng khác sau mỗi khoảng thời gian, không cần bấm tay.</div>
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

                    <!-- Khối riêng cho mode 'duration' (c3) — KHÔNG có input, chỉ giải thích tĩnh -->
                    <div id="auto-switch-time-duration-block" class="hidden flex-col p-4 gap-1">
                        <p class="text-xs text-slate-400 leading-relaxed">Tự tính theo độ dài bài đang phát: lấy tổng số giây của bài chia cho 10, ra khoảng cách giữa 2 lần đổi. Ví dụ bài dài 450 giây → đổi hiệu ứng mỗi 45 giây (10 lần/bài). Không cần điền gì — đổi bài khác, khoảng cách tự tính lại theo bài mới.</p>
                    </div>
                </div>
            </div>
        </div>
`;

