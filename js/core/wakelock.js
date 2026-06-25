/**
 * Quản lý Wake Lock (giữ màn hình sáng) qua API gốc hoặc NoSleep.js fallback + dọn dẹp tài nguyên khi đóng tab.
 * (Trích từ file gốc, dòng 527-552 trong khối <script>)
 *
 * Ver 8 refine: thêm xử lý khi tab/app bị ẨN (đổi tab, khoá màn hình, chuyển app khác trên di
 * động) — Web Audio API rất dễ bị hệ điều hành mobile "suspend" giữa chừng khi không ở foreground
 * (gây tiếng rè/giật/im bất thường khi quay lại), nên CHỦ ĐỘNG pause nhạc + ẩn visual ngay lúc
 * ẩn tab, thay vì để trình duyệt tự xử lý (không đoán được, dễ lỗi). Khi quay lại tab: CHỈ khôi
 * phục lại visual theo đúng setting đã lưu — KHÔNG tự phát lại nhạc (autoplay sau khi tab ẩn rất
 * dễ bị mobile browser chặn, và tự bật nhạc không hỏi là hành vi bất ngờ với người dùng).
 */
        // Cờ runtime (KHÔNG lưu vào vizConfig) — đánh dấu visual đang bị ẩn CƯỠNG CHẾ vì tab ẩn,
        // tách biệt hoàn toàn khỏi vizConfig.visualEnabled (lựa chọn người dùng đã lưu). Đọc bởi
        // draw-visualizer.js mỗi khung hình; tắt lại (false) ngay khi tab hiện trở lại.
        let isVisualForceHiddenByTab = false;
        // Ghi nhớ "đang phát NGAY TRƯỚC lúc tab bị ẩn" — chỉ dùng để quyết định pause hay không lúc
        // ẩn tab; KHÔNG dùng để tự resume lúc quay lại (xem lý do ở comment đầu file).
        let wasPlayingBeforeTabHidden = false;

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
                isVisualForceHiddenByTab = false; // khôi phục visual theo đúng vizConfig.visualEnabled (draw-visualizer.js tự đọc lại ở khung hình kế)
                if (!audioPlayer.paused) requestWakeLock();
                // Khi quay lại tab, AudioContext có thể đã bị hệ điều hành "suspend" (đặc biệt iOS
                // Safari khi vào nền) khiến đồ thị Web Audio ngừng -> tiếng tắt. Cố gắng resume
                // (best-effort) để tiếng trở lại ngay mà không cần bấm play lại — CHỈ resume lại
                // AudioContext (đồ thị xử lý), KHÔNG tự gọi audioPlayer.play() (xem comment đầu file).
                if (typeof audioContext !== 'undefined' && audioContext && audioContext.state === 'suspended') {
                    audioContext.resume().catch(() => {});
                }
            } else {
                // Tab/app vừa bị ẩn — pause nhạc + ẩn visual NGAY, tránh Web Audio chạy lỗi ngầm
                // trong nền trên di động (rất dễ gặp tiếng rè/giật khi quay lại nếu để tự nhiên).
                wasPlayingBeforeTabHidden = !audioPlayer.paused;
                if (wasPlayingBeforeTabHidden) audioPlayer.pause(); // event 'pause' tự gọi releaseWakeLock() (xem player-controls.js)
                isVisualForceHiddenByTab = true;
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

