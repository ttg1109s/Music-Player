/**
 * Quản lý Wake Lock (giữ màn hình sáng) qua API gốc hoặc NoSleep.js fallback + dọn dẹp tài nguyên khi đóng tab.
 * (Trích từ file gốc, dòng 527-552 trong khối <script>)
 *
 * Ver 8 refine (mục 2 — LOẠI BỎ hành vi "pause tạm" của bản trước): khi tab/app bị ẨN (đổi tab,
 * khoá màn hình, chuyển app khác trên di động), DỪNG HẲN phát nhạc và đưa player về ĐÚNG trạng
 * thái đầu (resetPlayerToIdle() — như chưa từng chọn bài nào), KHÔNG còn "pause tạm + giữ nguyên
 * bài đang chọn, chờ quay lại" như bản trước. Quay lại tab KHÔNG tự làm gì cả — người dùng phải tự
 * bấm chọn lại bài muốn nghe, đúng tinh thần "không cố giữ phát nền/không cố phục hồi tự động".
 */
        async function requestWakeLock() {
            // Tôn trọng tuỳ chọn "Giữ màn hình sáng" (vizConfig.keepScreenOn). Khi người dùng tắt,
            // không xin wake lock nữa -> để máy tự tắt màn hình theo thiết lập hệ điều hành.
            if (typeof vizConfig !== 'undefined' && vizConfig.keepScreenOn === false) { releaseWakeLock(); return; }
            try {
                if ('wakeLock' in navigator) { nativeWakeLock = await navigator.wakeLock.request('screen'); nativeWakeLock.addEventListener('release', () => {}); } 
                else { try { if (!noSleep.isEnabled) noSleep.enable(); } catch(e) {} }
            } catch (err) { try { if (!noSleep.isEnabled) noSleep.enable(); } catch (e) {} }
        }

        function releaseWakeLock() {
            try {
                if (nativeWakeLock !== null) { nativeWakeLock.release().then(() => { nativeWakeLock = null; }).catch(()=>{}); }
                if (noSleep.isEnabled) noSleep.disable();
            } catch (e) {}
        }

        document.addEventListener('visibilitychange', () => {
            // Tab/app vừa bị ẨN — dừng hẳn phát nhạc + reset player về trạng thái đầu (mục 2, ver 8
            // refine). resetPlayerToIdle() (player-controls.js) tự gọi audioPlayer.pause() — event
            // 'pause' tự release wake lock (xem player-controls.js), không cần gọi releaseWakeLock()
            // riêng ở đây.
            if (document.visibilityState !== 'visible') {
                if (typeof resetPlayerToIdle === 'function' && typeof currentKey !== 'undefined' && currentKey !== null) {
                    resetPlayerToIdle();
                }
            }
        });
        document.body.addEventListener('touchstart', () => { if(!audioPlayer.paused) requestWakeLock(); }, { once: true });
        document.body.addEventListener('click', () => { if(!audioPlayer.paused) requestWakeLock(); }, { once: true });

        window.addEventListener('beforeunload', () => {
            if (animationId) cancelAnimationFrame(animationId);
            if (audioContext && audioContext.state !== 'closed') audioContext.close();
            if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
            if (currentCoverObjectURL) URL.revokeObjectURL(currentCoverObjectURL);
            if (window.currentMediaSessionCover) URL.revokeObjectURL(window.currentMediaSessionCover);
            // Best-effort: flush phần thời lượng nghe chưa kịp ghi (xem player-controls.js timeupdate).
            // Không có gì đảm bảo IndexedDB write này hoàn tất trước khi tab đóng hẳn, nhưng vẫn
            // tốt hơn là bỏ qua hoàn toàn.
            if (typeof pendingListenSeconds !== 'undefined' && pendingListenSeconds > 0) {
                getMeta('totalListenSeconds').then(v => setMeta('totalListenSeconds', (v || 0) + pendingListenSeconds));
            }
            // Ghi nốt thống kê nghe theo từng bài còn đang debounce (best-effort, xem listen-stats.js).
            if (typeof flushSongStats === 'function') flushSongStats();
            releaseWakeLock();
        });

