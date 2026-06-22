/**
 * Component: Loading Shield (màn hình che khi đang xử lý / nạp nhạc)
 * Biến này chứa chuỗi HTML, được main.js chèn vào DOM lúc khởi động.
 */
const TPL_LOADING_SHIELD = `
    <div id="loading-shield" class="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center hidden backdrop-blur-sm transition-opacity duration-300">
        <svg class="animate-spin h-12 w-12 text-sky-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p id="loading-text" class="text-white font-semibold tracking-wider text-sm">Đang xử lý...</p>
    </div>
`;
