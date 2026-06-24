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
                <button id="btn-back-about" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white" title="Quay lại Cài đặt">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 class="text-base sm:text-lg font-bold tracking-wider text-white uppercase">Về trình phát</h2>
            </div>
        </div>

        <div class="flex-grow overflow-y-auto px-4 py-6 sm:px-8 pb-20">
            <div class="max-w-2xl mx-auto space-y-8">

                <!-- SECTION: THỐNG KÊ -->
                <div>
                    <h3 class="text-xs font-bold text-sky-400 uppercase tracking-widest mb-2 ml-2">Thống kê</h3>
                    <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                        <div class="flex justify-between items-center p-4 border-b border-white/5">
                            <span class="text-sm font-medium text-slate-300">Tổng số bài hát</span>
                            <span id="stat-about-total-songs" class="text-sm font-mono text-sky-300">—</span>
                        </div>
                        <div class="flex justify-between items-center p-4 border-b border-white/5">
                            <span class="text-sm font-medium text-slate-300">Tổng thời lượng các bài</span>
                            <span id="stat-about-total-duration" class="text-sm font-mono text-sky-300">—</span>
                        </div>
                        <div class="flex justify-between items-center p-4">
                            <span class="text-sm font-medium text-slate-300">Thời lượng đã nghe</span>
                            <span id="stat-about-listen-seconds" class="text-sm font-mono text-sky-300">—</span>
                        </div>
                    </div>
                </div>

                <!-- SECTION: QUẢN LÝ DUNG LƯỢNG (mục mới — tách khỏi Thống kê, sang ngăn riêng) -->
                <div>
                    <h3 class="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2 ml-2">Lưu trữ</h3>
                    <div class="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                        <button id="setting-open-storage" class="flex justify-between items-center p-4 hover:bg-white/5 transition-colors w-full text-left">
                            <div>
                                <div class="text-sm font-medium">Quản lý dung lượng</div>
                                <div class="text-xs text-slate-400 mt-0.5">Dung lượng đang dùng, giải phóng bộ nhớ, dọn file lỗi</div>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>

                <!-- SECTION: GIỚI THIỆU -->
                <div>
                    <h3 class="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 ml-2">Giới thiệu</h3>
                    <div class="bg-white/5 rounded-2xl border border-white/10 p-4">
                        <p class="text-sm text-slate-300 leading-relaxed">
                            Trình phát nhạc &amp; visualizer này chạy hoàn toàn ở phía trình duyệt (client-side):
                            không có server, không upload file của bạn lên đâu cả. Toàn bộ nhạc, ảnh cover,
                            phụ đề và ảnh/video nền được lưu cục bộ ngay trên thiết bị bạn đang dùng.
                        </p>
                    </div>
                </div>

                <!-- SECTION: CẢNH BÁO INDEXEDDB -->
                <div>
                    <h3 class="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2 ml-2">Lưu ý về dữ liệu lưu trữ</h3>
                    <div class="bg-amber-500/5 rounded-2xl border border-amber-500/20 p-4 flex flex-col gap-3">
                        <p class="text-sm text-slate-300 leading-relaxed">
                            Dữ liệu gắn theo <strong class="text-amber-300">trình duyệt + thiết bị cụ thể</strong> —
                            không tự đồng bộ qua thiết bị hoặc trình duyệt khác.
                        </p>
                        <p class="text-sm text-slate-300 leading-relaxed">
                            Hệ điều hành có thể tự dọn dữ liệu khi thiết bị thiếu dung lượng, đặc biệt trên di động.
                            iOS Safari có chính sách dọn dữ liệu riêng nếu trang không được thêm vào Home Screen.
                        </p>
                        <p class="text-sm text-slate-300 leading-relaxed">
                            <strong class="text-amber-300">Về offline:</strong> dữ liệu đã lưu KHÔNG tự mất khi offline.
                            Vấn đề thực tế là nếu không có mạng để tải lại trang từ đầu, sẽ không có cách nào mở được
                            ứng dụng để chạm vào dữ liệu đó. Hiện tại trình phát chưa dùng Service Worker để giữ tốc độ
                            phát triển, nên rủi ro này vẫn tồn tại — bạn nên biết trước.
                        </p>
                        <p class="text-sm text-slate-300 leading-relaxed">
                            <strong class="text-amber-300">Khuyến nghị:</strong> giữ file mp3 gốc ở nơi khác (Google Drive,
                            máy tính...). Coi đây là bộ nhớ cache tiện lợi, không phải nơi lưu trữ chính của bạn.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    </div>
`;
