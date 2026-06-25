/**
 * Component (sub-template): Settings Drawer — Section "Khác".
 * Tách từ js/components/settings-drawer.js (ver 8). Toggle "Giữ màn hình sáng" (wake lock) +
 * nút mở About Drawer ("Về trình phát").
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
`;

