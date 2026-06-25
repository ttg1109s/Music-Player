/**
 * Component (sub-template): Settings Drawer — Section "Danh sách phát & Nền".
 * Tách từ js/components/settings-drawer.js (ver 8) — xem object điều phối SettingsDrawer
 * trong settings-drawer.js để biết thứ tự ghép các section này lại thành TPL_SETTINGS_DRAWER.
 * Toggle Video Background, ảnh nền Playlist + độ mờ nhòe (blur).
 *
 * Ver 8 refine: toggle "Tắt Visual" TÁCH RA khỏi khối Video Background (trước đây tên "Video
 * phủ kín, tạm dừng Visual", chỉ có tác dụng khi video nền đang bật) — giờ là 1 section riêng
 * "Hiệu ứng Visualizer", độc lập hoàn toàn khỏi video nền. Tắt -> luôn ẩn canvas hiệu ứng, nền
 * hiển thị là nền THẬT đang được chọn (video nền nếu đang bật, ảnh/màu nền nếu không).
 */
const TPL_SETTINGS_PLAYLIST_BG = `

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
                            <input type="file" id="setting-video-upload" accept=".mp4,.webm,.ogv,.mov,video/mp4,video/webm,video/ogg,video/quicktime" class="hidden">
                        </label>
                    </div>
                </div>
        
                <div class="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                    <div><div class="text-sm font-medium">Ảnh nền Playlist</div></div>
                    <label class="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow">
                        Đổi ảnh
                        <input type="file" id="setting-bg-upload" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" class="hidden">
                    </label>
                </div>
                <div class="flex justify-between items-center p-4 border-b border-white/5">
                    <span class="text-sm font-medium">Sử dụng Ảnh nền Playlist</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="setting-bg-image-enable" class="sr-only peer">
                        <div class="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500 shadow-inner"></div>
                    </label>
                </div>
                <div class="flex flex-col p-4 hover:bg-white/5 transition-colors">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-medium">Độ mờ nhòe nền (Blur)</span>
                        <span id="val-bg-blur" class="text-xs text-sky-400 font-mono">0px</span>
                    </div>
                    <input type="range" id="setting-bg-blur" min="0" max="20" step="1" class="setting-slider">
                </div>
            </div>
        </div>

        <!-- SECTION: HIỆU ỨNG VISUALIZER (Tắt Visual) — mới ở ver 8 refine, độc lập khỏi Video
             Background. Tắt -> ẩn canvas hiệu ứng, để lộ nền thật đang chọn (video/ảnh/màu). -->
        <div>
            <h3 class="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2 ml-2">Hiệu ứng Visualizer</h3>
            <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
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

