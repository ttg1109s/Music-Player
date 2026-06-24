/**
 * Quản lý Wake Lock (giữ màn hình sáng) qua API gốc hoặc NoSleep.js fallback + dọn dẹp tài nguyên khi đóng tab.
 * (Trích từ file gốc, dòng 527-552 trong khối <script>)
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

        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible') {
                if (!audioPlayer.paused) requestWakeLock();
                // Khi quay lại tab, AudioContext có thể đã bị hệ điều hành "suspend" (đặc biệt iOS
                // Safari khi vào nền) khiến đồ thị Web Audio ngừng -> tiếng tắt. Cố gắng resume
                // (best-effort) để tiếng trở lại ngay mà không cần bấm play lại.
                if (typeof audioContext !== 'undefined' && audioContext && audioContext.state === 'suspended') {
                    audioContext.resume().catch(() => {});
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

