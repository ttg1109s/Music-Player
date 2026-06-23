/**
 * Component: Bottom Player (thanh điều khiển phát nhạc ở dưới cùng)
 * Biến này chứa chuỗi HTML, được main.js chèn vào DOM lúc khởi động.
 */
const TPL_BOTTOM_PLAYER = `
    <div id="player-container" class="absolute bottom-0 left-0 w-full z-[70] pointer-events-auto flex flex-col hidden">
        <div class="w-full bg-black"><input type="range" id="progress-bar" value="0" step="0.1" min="0" class="music-slider block"></div>

        <div class="w-full bg-gradient-to-t from-black via-black/70 to-transparent pt-3 pb-3 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-6">
            <div class="flex items-center gap-3 w-1/3 min-w-[120px]">
                <div class="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14" id="record-container">
                    <img id="record-art" src="" class="w-full h-full rounded-full object-cover shadow-lg relative z-20" alt="Record">
                    <div class="absolute inset-0 m-auto w-3 h-3 bg-slate-900 rounded-full border border-slate-700 z-30"></div>
                </div>
                <div class="flex-grow flex flex-col justify-center overflow-hidden z-20 relative">
                    <h2 id="player-title" class="text-white font-bold text-xs sm:text-sm truncate drop-shadow-md">Chưa chọn bài</h2>
                    <p id="player-artist" class="text-sky-300 text-[10px] sm:text-xs truncate font-medium mt-0.5">---</p>
                </div>
            </div>

            <div class="flex items-center justify-center gap-4 sm:gap-6 w-1/3">
                <button id="btn-prev" class="w-8 h-8 flex items-center justify-center text-white hover:text-sky-400 transition-colors" title="Bài trước"><svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" /></svg></button>
                <button id="play-pause-btn" class="shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-white text-black hover:bg-sky-100 hover:scale-105 transition-all focus:outline-none shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    <svg id="icon-play" class="w-6 h-6 sm:w-7 sm:h-7 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    <svg id="icon-pause" class="w-6 h-6 sm:w-7 sm:h-7 hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
                <button id="btn-next" class="w-8 h-8 flex items-center justify-center text-white hover:text-sky-400 transition-colors" title="Bài tiếp"><svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path d="M11.555 14.832A1 1 0 0010 14v-2.798l-5.445 3.63A1 1 0 013 14V6a1 1 0 011.555-.832L10 8.798V6a1 1 0 011.555-.832l6 4a1 1 0 010 1.664l-6 4z" /></svg></button>
            </div>

            <div class="flex items-center justify-end w-1/3 text-[10px] sm:text-xs font-mono text-slate-400 pr-2">
                <span id="current-time" class="text-white font-semibold">0:00</span>&nbsp;/&nbsp;<span id="duration-time">0:00</span>
            </div>
        </div>
        <audio id="audio-player" style="display: none;" playsinline></audio>
    </div>
`;
