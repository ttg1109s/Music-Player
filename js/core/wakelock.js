/**
 * Quản lý Wake Lock (giữ màn hình sáng) qua API gốc hoặc NoSleep.js fallback + dọn dẹp tài nguyên khi đóng tab.
 * (Trích từ file gốc, dòng 527-552 trong khối <script>)
 *
 * FIX (ver 10 refine #3 — "lúc phát ra tiếng bình thường, lúc thì không" sau khi quay lại tab):
 * CÁC BẢN TRƯỚC (lịch sử, để tham khảo nếu cần đọc lại quyết định thiết kế):
 *   - Bản v8: chỉ resetPlayerToIdle() (dừng nhạc + đưa UI về Playlist) lúc ẩn tab, KHÔNG reload —
 *     app tiếp tục sống ở background. Khi quay lại tab, hỏi tiếp tục nghe bằng cách gọi lại
 *     playSong() trên CHÍNH runtime cũ — runtime đó có thể đã bị trình duyệt/OS can thiệp không
 *     nhất quán trong lúc ẩn (suspend JS, đóng AudioContext...) -> "lúc có tiếng lúc không".
 *   - Bản v10 refine #3 (lần đầu): đổi sang lưu state + RELOAD THẬT, nhưng vẫn reload LÚC QUAY LẠI
 *     TAB (không phải lúc ẩn) — và còn giữ lại resetPlayerToIdle()/forceBackToPlaylistUI() (hành vi
 *     "tự thân" làm UI quay về Playlist) trước khi reload — DƯ THỪA vì reload thật sẽ tự dọn sạch
 *     toàn bộ DOM/RAM, không cần tự làm thủ công nữa, và "chờ tới lúc quay lại mới reload" nghĩa là
 *     trong suốt thời gian tab ẩn, app vẫn ở trạng thái cũ treo đó (vẫn có thể bị OS can thiệp).
 *   - Bản v10 refine #3 (lần 2): reload NGAY lúc ẩn tab — nhưng PHÁT HIỆN race condition mới lúc
 *     viết test: khi người dùng đang nghe nhạc rồi TỰ F5/reload tay (không thật sự ẩn tab),
 *     trình duyệt CŨNG bắn 'visibilitychange'='hidden' ngay trước lúc unload (đây là hành vi đúng
 *     theo spec — xem MDN/Page Lifecycle API: "Transitioning to hidden is the last event reliably
 *     observable", và trang luôn chuyển hidden trước khi unload bất kể lý do unload là gì) — khiến
 *     app hiểu lầm F5 thủ công thành "ẩn tab thật", lưu snapshot + hỏi "Tiếp tục nghe?" sau khi F5
 *     xong — KHÔNG đúng ý người dùng (F5 thủ công không nên bị hỏi gì cả).
 *
 * BẢN HIỆN TẠI: vẫn RELOAD NGAY LÚC ẨN — nhưng THÊM BƯỚC phân biệt "ẩn tab thật" với "F5/reload/
 * đóng tab thủ công" TRƯỚC KHI thực sự lưu/reload. Cách phân biệt (không có API nào cho biết trực
 * tiếp "đây là lý do gì" — đã tham khảo kỹ tài liệu Page Visibility/Lifecycle API, xác nhận thứ tự
 * 'visibilitychange'/'pagehide'/'beforeunload' KHÔNG cố định giữa các trình duyệt/tình huống, nên
 * không thể chỉ dựa vào thứ tự để suy luận chắc chắn — chỉ có thể dùng phép đo THỜI GIAN tương đối):
 *   - 'beforeunload' CHỈ bắn ra khi trang THẬT SỰ đang bị huỷ ngay sau đó (F5/đóng tab/điều hướng
 *     sang trang khác) — KHÔNG bắn khi chỉ đơn thuần chuyển tab/thu nhỏ/khoá máy (trang vẫn sống).
 *   - Trì hoãn việc lưu/set cờ/reload trong triggerHideAndReload() bằng 1 khoảng CHỜ NGẮN (xem
 *     HIDE_RELOAD_DEBOUNCE_MS) sau khi 'visibilitychange'/'pagehide' bắn ra. Nếu trong khoảng chờ đó
 *     'beforeunload' bắn ra (đặt cờ _isRealUnloadHappening = true) -> đây là F5/đóng tab/điều hướng
 *     THẬT -> HUỶ BỎ việc lưu/reload trong triggerHideAndReload() (không làm gì cả, để trình duyệt
 *     tự xử lý unload theo cách của nó — không có gì để "tiếp tục nghe" sau 1 lần unload thật, kể
 *     cả F5: coi như phiên nghe đã kết thúc trọn vẹn theo ý người dùng). Nếu KHÔNG có 'beforeunload'
 *     nào bắn ra trong khoảng chờ đó -> đây là ẨN TAB THẬT (trang vẫn sống, chỉ bị che/thu nhỏ) ->
 *     tiến hành lưu + reload như thiết kế ban đầu.
 *   - HIDE_RELOAD_DEBOUNCE_MS chọn NGẮN (50ms) — đủ để 'beforeunload' (nếu có) kịp bắn ra trong
 *     cùng loạt sự kiện đồng bộ của hành động F5/đóng tab, nhưng không đủ dài để người dùng cảm
 *     nhận được độ trễ khi ẩn tab thật (50ms không thể nhận biết bằng mắt thường).
 *
 * KHÔNG CÒN nhánh xử lý riêng lúc "tab vừa hiện lại" — toàn bộ việc hỏi "Tiếp tục nghe?" giờ xảy ra
 * tự nhiên ở NGAY ĐẦU quá trình khởi động lại trang (checkPendingResumeStateOnBoot(), gọi từ
 * draw-visualizer.js ngay sau loadConfig() — không đợi initPlaylistFromDB()), không cần biết/quan
 * tâm gì đến sự kiện 'visible' nữa — chỉ cần đọc đúng cờ đã lưu trước khi reload.
 *
 * FIX (lịch sử, vẫn áp dụng): trên iOS Safari, 'visibilitychange' được WebKit xác nhận KHÔNG đáng
 * tin cậy khi chuyển app/khoá máy — có thể bắn trễ/thiếu/không bắn. 'pagehide' là tín hiệu dự phòng
 * đáng tin cậy hơn cho đúng mục đích "trang sắp bị rời khỏi/ẩn đi" — gọi CHUNG 1 hàm
 * triggerHideAndReload() với 'visibilitychange' để không lệch hành vi giữa 2 đường gọi.
 */
        const HIDE_RELOAD_DEBOUNCE_MS = 50;
        /** true ngay khi 'beforeunload' bắn ra — tín hiệu "đây THẬT SỰ là F5/đóng tab/điều hướng
         * sang trang khác", dùng để huỷ bỏ lưu/reload đang chờ trong triggerHideAndReload(). */
        let _isRealUnloadHappening = false;

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

        /**
         * Tín hiệu DÙNG CHUNG cho mọi đường báo "tab/app vừa bị ẩn" (visibilitychange + pagehide).
         * Chặn gọi chồng bằng cờ _hideReloadInProgress (cả 2 sự kiện có thể cùng bắn ra).
         *
         * QUAN TRỌNG: KHÔNG còn resetPlayerToIdle()/forceBackToPlaylistUI()/dọn loadingShield gì cả
         * ở đây — reload thật (cuối hàm) sẽ tự dọn sạch toàn bộ UI/RAM ngay sau đó, làm thêm là dư
         * thừa và có thể tự gây ra race condition mới không cần thiết.
         *
         * FIX (bổ sung — phân biệt ẩn tab thật với F5/đóng tab, xem comment đầu file): CHỜ
         * HIDE_RELOAD_DEBOUNCE_MS trước khi thực sự lưu/reload — nếu 'beforeunload' bắn ra trong
         * lúc chờ (đặt _isRealUnloadHappening=true), HUỶ BỎ toàn bộ (không lưu gì, không reload gì
         * — để trình duyệt tự xử lý F5/đóng tab/điều hướng theo cách của nó).
         */
        let _hideReloadInProgress = false;
        function triggerHideAndReload() {
            if (_hideReloadInProgress) return; // chặn gọi chồng (vd. 'visibilitychange' + 'pagehide' cùng bắn)
            _hideReloadInProgress = true;
            _isRealUnloadHappening = false; // reset trước khi chờ — đo lại đúng cho LƯỢT này

            setTimeout(() => {
                _hideReloadInProgress = false; // mở lại ngay, phòng trường hợp ẩn/hiện/ẩn liên tục
                if (_isRealUnloadHappening) return; // F5/đóng tab/điều hướng THẬT -> không làm gì cả

                const didSave = (typeof saveResumeStateToLocalStorage === 'function') && saveResumeStateToLocalStorage();
                if (didSave && typeof setResumeFlag === 'function') setResumeFlag();

                // Pause rồi XÁC NHẬN đã pause thật trước khi reload — audioPlayer.pause() là API
                // đồng bộ (sự kiện 'pause' bắn ra ngay trong cùng tick JS theo spec HTML5 Media),
                // nên việc kiểm tra audioPlayer.paused ngay sau đó là đủ tin cậy.
                if (typeof audioPlayer !== 'undefined' && audioPlayer && !audioPlayer.paused) {
                    audioPlayer.pause();
                }

                location.reload(); // NGAY SAU KHI XÁC NHẬN đây là ẩn tab thật — không đợi quay lại tab mới reload
            }, HIDE_RELOAD_DEBOUNCE_MS);
        }

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'visible') triggerHideAndReload();
        });
        // Tín hiệu DỰ PHÒNG cho iOS (xem ghi chú đầu file) — 'pagehide' bắn khi trang bị đưa ra
        // khỏi màn hình (chuyển app, khoá máy...) ở những trường hợp 'visibilitychange' bỏ lỡ.
        window.addEventListener('pagehide', triggerHideAndReload);
        document.body.addEventListener('touchstart', () => { if(!audioPlayer.paused) requestWakeLock(); }, { once: true });
        document.body.addEventListener('click', () => { if(!audioPlayer.paused) requestWakeLock(); }, { once: true });

        window.addEventListener('beforeunload', () => {
            // FIX (bổ sung — phân biệt ẩn tab thật với F5/đóng tab): đặt cờ NGAY ĐẦU, trước mọi dọn
            // dẹp khác dưới đây — đây là tín hiệu DUY NHẤT đáng tin để triggerHideAndReload() (đang
            // chờ trong setTimeout, nếu có) biết huỷ bỏ việc lưu/reload của nó.
            _isRealUnloadHappening = true;
            if (animationId) cancelAnimationFrame(animationId);
            if (audioContext && audioContext.state !== 'closed') audioContext.close();
            if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
            if (currentCoverObjectURL) URL.revokeObjectURL(currentCoverObjectURL);
            if (window.currentMediaSessionCover) URL.revokeObjectURL(window.currentMediaSessionCover);
            // Best-effort: flush phần thời lượng nghe chưa kịp ghi (xem player-controls.js timeupdate).
            // Không có gì đảm bảo IndexedDB write này hoàn tất trước khi tab đóng hẳn, nhưng vẫn
            // tốt hơn là bỏ qua hoàn toàn.
            if (typeof pendingListenSeconds !== 'undefined' && pendingListenSeconds > 0) {
                // FIX (log 9->10): cùng lý do với chỗ tương tự ở player-controls.js — thêm .catch()
                // vì IndexedDB connection có thể đã bị đóng/treo đúng lúc trang đang unload, khiến
                // db.transaction() throw -> promise reject không ai bắt. best-effort nên bỏ qua lỗi.
                getMeta('totalListenSeconds')
                    .then(v => setMeta('totalListenSeconds', (v || 0) + pendingListenSeconds))
                    .catch(err => console.warn('[wakelock] Không ghi được totalListenSeconds lúc unload (best-effort, bỏ qua):', err));
            }
            // Ghi nốt thống kê nghe theo từng bài còn đang debounce (best-effort, xem listen-stats.js).
            if (typeof flushSongStats === 'function') flushSongStats();
            releaseWakeLock();
        });
