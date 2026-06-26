/**
 * Component: About Drawer (ngăn kéo "Về trình phát" — thống kê, giới thiệu, cảnh báo IndexedDB)
 * Biến này chứa chuỗi HTML, được main.js chèn vào DOM lúc khởi động.
 * z-index cao hơn #drawer-settings (z-[80]) để mở chồng lên trên, đúng kiểu navigation stack
 * của Settings app trên điện thoại — Back ở đây chỉ ẩn About, không động vào Settings bên dưới.
 */
const TPL_ABOUT_DRAWER = `
    <div id="drawer-about" class="fixed inset-0 drawer-glass z-[90] transform translate-y-full transition-transform duration-500 ease-in-out flex flex-col">
        <div class="flex justify-between items-center px-4 py-3 sm:px-6 border-b border-white/10 shrink-0 bg-black/40">
            <div class="flex items-center gap-2">
                <button id="btn-back-about" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white" data-i18n-title="aboutDrawer.backToSettings.title" title="${t('aboutDrawer.backToSettings.title')}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 class="text-base sm:text-lg font-bold tracking-wider text-white uppercase" data-i18n="aboutDrawer.title">${t('aboutDrawer.title')}</h2>
            </div>
        </div>

        <div class="flex-grow overflow-y-auto px-4 py-6 sm:px-8 pb-20">
            <div class="max-w-2xl mx-auto space-y-8">

                <!-- SECTION: THỐNG KÊ -->
                <div>
                    <h3 class="text-xs font-bold text-sky-400 uppercase tracking-widest mb-2 ml-2" data-i18n="aboutDrawer.statsSectionTitle">${t('aboutDrawer.statsSectionTitle')}</h3>
                    <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                        <div class="flex justify-between items-center p-4 border-b border-white/5">
                            <span class="text-sm font-medium text-slate-300" data-i18n="aboutDrawer.statTotalSongs">${t('aboutDrawer.statTotalSongs')}</span>
                            <span id="stat-about-total-songs" class="text-sm font-mono text-sky-300">—</span>
                        </div>
                        <div class="flex justify-between items-center p-4 border-b border-white/5">
                            <span class="text-sm font-medium text-slate-300" data-i18n="aboutDrawer.statTotalDuration">${t('aboutDrawer.statTotalDuration')}</span>
                            <span id="stat-about-total-duration" class="text-sm font-mono text-sky-300">—</span>
                        </div>
                        <div class="flex justify-between items-center p-4">
                            <span class="text-sm font-medium text-slate-300" data-i18n="aboutDrawer.statListenSeconds">${t('aboutDrawer.statListenSeconds')}</span>
                            <span id="stat-about-listen-seconds" class="text-sm font-mono text-sky-300">—</span>
                        </div>
                    </div>
                </div>

                <!-- SECTION: QUẢN LÝ DUNG LƯỢNG (mục mới — tách khỏi Thống kê, sang ngăn riêng) -->
                <div>
                    <h3 class="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2 ml-2" data-i18n="aboutDrawer.storageSectionTitle">${t('aboutDrawer.storageSectionTitle')}</h3>
                    <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                        <button id="setting-open-storage" class="flex justify-between items-center p-4 hover:bg-white/5 transition-colors w-full text-left">
                            <div>
                                <div class="text-sm font-medium" data-i18n="aboutDrawer.openStorage.label">${t('aboutDrawer.openStorage.label')}</div>
                                <div class="text-xs text-slate-400 mt-0.5" data-i18n="aboutDrawer.openStorage.hint">${t('aboutDrawer.openStorage.hint')}</div>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>

                <!-- SECTION: GIỚI THIỆU -->
                <div>
                    <h3 class="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 ml-2" data-i18n="aboutDrawer.introSectionTitle">${t('aboutDrawer.introSectionTitle')}</h3>
                    <div class="bg-white/5 rounded-2xl border border-white/10 p-4">
                        <p class="text-sm text-slate-300 leading-relaxed" data-i18n="aboutDrawer.introBody">
                            ${t('aboutDrawer.introBody')}
                        </p>
                    </div>
                </div>

                <!-- SECTION: CẢNH BÁO INDEXEDDB -->
                <div>
                    <h3 class="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2 ml-2" data-i18n="aboutDrawer.warningSectionTitle">${t('aboutDrawer.warningSectionTitle')}</h3>
                    <div class="bg-amber-500/5 rounded-2xl border border-amber-500/20 p-4 flex flex-col gap-3">
                        <p class="text-sm text-slate-300 leading-relaxed" data-i18n="aboutDrawer.warning.deviceBound">
                            ${t('aboutDrawer.warning.deviceBound')}
                        </p>
                        <p class="text-sm text-slate-300 leading-relaxed" data-i18n="aboutDrawer.warning.osCleanup">
                            ${t('aboutDrawer.warning.osCleanup')}
                        </p>
                        <p class="text-sm text-slate-300 leading-relaxed" data-i18n="aboutDrawer.warning.offline">
                            ${t('aboutDrawer.warning.offline')}
                        </p>
                        <p class="text-sm text-slate-300 leading-relaxed" data-i18n="aboutDrawer.warning.recommendation">
                            ${t('aboutDrawer.warning.recommendation')}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    </div>
`;
