/**
 * Component (sub-template): Settings Drawer — Section "Khác".
 * Tách từ js/components/settings-drawer.js (ver 8). Toggle "Giữ màn hình sáng" (wake lock) +
 * nút mở About Drawer ("Về trình phát").
 *
 * Ver 10 refine (bổ sung): thêm SECTION "Khắc phục sự cố" — 2 nút dành cho lúc trình phát gặp lỗi/
 * hành vi không bình thường (treo, kẹt khoá shield, UI lệch state...) mà người dùng không biết
 * chỉnh gì khác ngoài tự F5: "Khởi động lại app" (dọn state RAM tạm rồi reload — xem
 * js/core/app-recovery.js, KHÔNG đụng tới nhạc/playlist/cài đặt) và "Khôi phục cài đặt mặc định"
 * (CHỈ reset vizConfig — màu sắc/hiệu ứng/EQ/v.v. — về DEFAULT_VIZ_CONFIG, GIỮ NGUYÊN nhạc/playlist
 * đã upload, vì đó là dữ liệu người dùng tốn công thêm vào, không nên mất chỉ vì muốn reset giao
 * diện). Cả 2 đều hỏi xác nhận trước khi thực hiện (modalChoice(), tránh bấm nhầm).
 */
const TPL_SETTINGS_MISC = `

        <!-- SECTION: VỀ TRÌNH PHÁT -->
        <div>
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-2">Khác</h3>
            <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                <div class="flex justify-between items-center p-4 border-b border-white/5">
                    <div class="pr-3">
                        <div class="text-sm font-medium">Giữ màn hình sáng</div>
                        <div class="text-xs text-slate-400 mt-0.5">Khi đang phát, ngăn màn hình tự tắt. Tắt đi để tiết kiệm pin (nhạc vẫn cố gắng phát ở chế độ nền).</div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" id="setting-keep-screen-on" class="sr-only peer" checked>
                        <div class="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500 shadow-inner"></div>
                    </label>
                </div>
                <button id="setting-open-about" class="flex justify-between items-center p-4 hover:bg-white/5 transition-colors w-full text-left">
                    <span class="text-sm font-medium">Về trình phát</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>

        <!-- SECTION: KHẮC PHỤC SỰ CỐ (mới) — xem js/core/app-recovery.js -->
        <div>
            <h3 class="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2 ml-2">Khắc phục sự cố</h3>
            <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                <button id="setting-restart-app" class="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors w-full text-left">
                    <div class="pr-3">
                        <div class="text-sm font-medium">Khởi động lại app</div>
                        <div class="text-xs text-slate-400 mt-0.5">Dùng khi trình phát bị treo, kẹt, hoặc hành vi không bình thường. Không ảnh hưởng nhạc/playlist/cài đặt đã lưu.</div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
                <button id="setting-restore-defaults" class="flex justify-between items-center p-4 hover:bg-white/5 transition-colors w-full text-left">
                    <div class="pr-3">
                        <div class="text-sm font-medium">Khôi phục cài đặt mặc định</div>
                        <div class="text-xs text-slate-400 mt-0.5">Đưa màu sắc, hiệu ứng, EQ, và mọi tuỳ chỉnh hiển thị khác về mặc định gốc. KHÔNG xoá nhạc/playlist đã upload.</div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>
`;

