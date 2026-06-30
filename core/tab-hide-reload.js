/**
 * tab-hide-reload.js — Xử lý lifecycle ẩn tab: lưu state + reload ngay khi tab bị ẩn.
 *
 * Tách từ core/wakelock.js (cũ) — wakelock.js chỉ còn requestWakeLock/releaseWakeLock.
 *
 * Logic debounce phân biệt "ẩn tab thật" vs "F5/đóng tab":
 *   - 'visibilitychange'/'pagehide' → triggerHideAndReload() → chờ HIDE_RELOAD_DEBOUNCE_MS
 *   - Nếu 'beforeunload' bắn trong khoảng chờ → _isRealUnloadHappening = true → huỷ reload
 *   - Nếu không → ẩn tab thật → pause audio/video → save state → location.reload()
 *
 * _isRealUnloadHappening được đọc bởi event/tab.js (beforeunload handler) để set cờ
 * trước khi gọi executeAppCleanup().
 *
 * PHẢI nạp SAU: core/resume-state-storage.js (saveResumeStateToLocalStorage, setResumeFlag),
 *   core/dom-refs.js (audioPlayer, bgVideoElement).
 * PHẢI nạp TRƯỚC: core/app-cleanup.js, event/tab.js.
 */
        const HIDE_RELOAD_DEBOUNCE_MS = 50;

        /**
         * true ngay khi 'beforeunload' bắn ra — tín hiệu "đây THẬT SỰ là F5/đóng tab/
         * điều hướng sang trang khác", dùng để huỷ bỏ lưu/reload đang chờ trong
         * triggerHideAndReload(). Đọc từ event/tab.js để set trước executeAppCleanup().
         */
        let _isRealUnloadHappening = false;
        let _hideReloadInProgress = false;

        function triggerHideAndReload() {
            if (_hideReloadInProgress) return; // chặn gọi chồng (visibilitychange + pagehide cùng bắn)
            _hideReloadInProgress = true;
            _isRealUnloadHappening = false; // reset trước khi chờ — đo lại đúng cho lượt này

            setTimeout(() => {
                _hideReloadInProgress = false; // mở lại ngay, phòng trường hợp ẩn/hiện/ẩn liên tục
                if (_isRealUnloadHappening) return; // F5/đóng tab/điều hướng thật → không làm gì cả

                // Pause trước khi lưu: đảm bảo currentTime đọc được là chính xác tại thời điểm dừng
                if (typeof audioPlayer !== 'undefined' && audioPlayer && !audioPlayer.paused) {
                    audioPlayer.pause();
                }
                if (typeof bgVideoElement !== 'undefined' && bgVideoElement && !bgVideoElement.paused) {
                    bgVideoElement.pause();
                }

                const didSave = (typeof saveResumeStateToLocalStorage === 'function') && saveResumeStateToLocalStorage();
                if (didSave && typeof setResumeFlag === 'function') setResumeFlag();

                location.reload();
            }, HIDE_RELOAD_DEBOUNCE_MS);
        }
