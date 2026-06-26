/**
 * Quản lý Wake Lock (giữ màn hình sáng) qua API gốc hoặc NoSleep.js fallback + dọn dẹp tài nguyên khi đóng tab.
 * (Trích từ file gốc, dòng 527-552 trong khối <script>)
 *
 * Ver 8 refine (mục 2 — LOẠI BỎ hành vi "pause tạm" của bản trước): khi tab/app bị ẨN (đổi tab,
 * khoá màn hình, chuyển app khác trên di động), DỪNG HẲN phát nhạc và đưa player về ĐÚNG trạng
 * thái đầu (resetPlayerToIdle() — như chưa từng chọn bài nào), KHÔNG còn "pause tạm + giữ nguyên
 * bài đang chọn, chờ quay lại" như bản trước. Quay lại tab KHÔNG tự làm gì cả — người dùng phải tự
 * bấm chọn lại bài muốn nghe, đúng tinh thần "không cố giữ phát nền/không cố phục hồi tự động".
 *
 * FIX (log 7->8, mục "chuyển tab/ẩn trình duyệt trên iOS" — xem giải thích đầy đủ ở
 * resetPlayerToIdle() trong player-controls.js): bản trước CHỈ lắng nghe đúng 1 sự kiện
 * 'visibilitychange' để kích hoạt reset. Trên iOS Safari, sự kiện này được WebKit xác nhận KHÔNG
 * đáng tin cậy khi người dùng chuyển sang app khác hoặc khoá màn hình — có thể bắn trễ, bắn thiếu,
 * hoặc hoàn toàn không bắn (trình duyệt có thể đã ngưng JS đúng lúc rời trang). 'pagehide' (kèm
 * 'pageshow' để biết lúc nào quay lại) là tín hiệu được khuyến nghị đáng tin cậy HƠN trên iOS cho
 * đúng mục đích "trang sắp bị rời khỏi/ẩn đi" — thêm 2 listener này làm tín hiệu DỰ PHÒNG, gọi
 * CHUNG 1 hàm triggerHideReset() với 'visibilitychange' (không tách logic riêng, tránh lệch hành
 * vi giữa 2 đường gọi). resetPlayerToIdle() tự chống gọi chồng (_resetPlayerToIdleInProgress) nên
 * việc 2 sự kiện cùng bắn ra (trường hợp hiếm) không gây chạy 2 lần/xung đột.
 *
 * FIX (ver 10 refine #3 — "lúc phát ra tiếng bình thường, lúc thì không" sau khi quay lại tab):
 * bản trước (mô tả ở trên) để app TIẾP TỤC SỐNG trong background sau khi reset RAM — chỉ dừng
 * nhạc, không reload gì. Khi quay lại tab, 3 nút (Không/Tiếp tục phát/Nghe lại) chạy ĐÚNG logic
 * của chúng, nhưng MÔI TRƯỜNG RUNTIME (AudioContext, taskManager, các task nền...) có thể đã bị hệ
 * điều hành/trình duyệt can thiệp theo những cách không nhất quán trong lúc tab ẩn đủ lâu — đúng
 * nguyên nhân hành vi "có lúc ra tiếng, có lúc không" dù bấm đúng nút. SỬA: thay vì cố duy trì
 * runtime cũ, lưu state tối thiểu vào localStorage (xem resume-state-storage.js,
 * saveResumeStateToLocalStorage()) NGAY trước khi reset, rồi RELOAD TRANG THẬT
 * (location.reload()) khi quay lại tab — toàn bộ runtime khởi tạo lại sạch từ đầu, loại bỏ hẳn
 * khả năng còn sót trạng thái nửa sống nửa chết từ phiên trước. checkPendingResumeStateOnBoot()
 * (gọi từ draw-visualizer.js, sau khi initPlaylistFromDB() nạp xong) đọc lại state đã lưu, nạp vào
 * RAM, rồi hiện đúng modal "Tiếp tục nghe?" như cũ — quy trình 3 nút không đổi gì, chỉ đổi THỜI
 * ĐIỂM nó được hiện ra (sau khi trang đã reload xong, không phải ngay lúc tab vừa visible).
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

        /**
         * Tín hiệu DÙNG CHUNG cho mọi đường báo "tab/app vừa bị ẩn" (visibilitychange + pagehide —
         * xem giải thích ở đầu file). resetPlayerToIdle() tự an toàn khi gọi nhiều lần/chồng lệnh.
         *
         * FIX (ver 10 refine #3): lưu resume state vào localStorage TRƯỚC khi resetPlayerToIdle()
         * chạy — hàm đó sẽ pause()/xoá currentKey/đưa currentTime về 0, nên PHẢI đọc currentTime
         * thật + currentKey TRƯỚC, không thể đọc sau. saveResumeStateToLocalStorage() trả về
         * true/false cho biết CÓ THỰC SỰ LƯU được gì hay không (false nếu không có bài nào đang
         * phát lúc ẩn tab) — chỉ đặt _wasHiddenThisSession khi có lưu thật, để nhánh "tab vừa hiện
         * lại" KHÔNG reload vô nghĩa trong trường hợp ẩn tab lúc đang ở màn Playlist/chưa chọn bài.
         */
        function triggerHideReset() {
            const didSave = (typeof saveResumeStateToLocalStorage === 'function') && saveResumeStateToLocalStorage();
            if (didSave) _wasHiddenThisSession = true; // chỉ đánh dấu khi thật sự có gì để phục hồi
            if (typeof resetPlayerToIdle === 'function' && typeof currentKey !== 'undefined' && currentKey !== null) {
                resetPlayerToIdle();
            }
        }

        /**
         * FIX (race condition phát hiện lúc viết — reload lặp vô hạn/mất modal): listener
         * 'visibilitychange'/'pageshow' chạy NGAY KHI SCRIPT NÀY ĐƯỢC PARSE (đồng bộ), tức RẤT
         * SỚM trong vòng đời trang — sớm hơn 'DOMContentLoaded' (nơi checkPendingResumeStateOnBoot()
         * đọc + XOÁ cờ localStorage, xem draw-visualizer.js). Nếu nhánh "tab vừa hiện lại" ở dưới
         * cứ kiểm tra readResumeStateFromLocalStorage() bất cứ khi nào sự kiện bắn ra — kể cả NGAY
         * LÚC TRANG VỪA TỰ LOAD LẦN ĐẦU (trình duyệt có thể tự bắn 'visibilitychange'/'pageshow' khi
         * document mới sẵn sàng, dù chẳng có ai "chuyển tab" thật) — nó sẽ thấy cờ VẪN CÒN (vì
         * DOMContentLoaded chưa chạy tới checkPendingResumeStateOnBoot() để xoá) và gọi
         * location.reload() THÊM 1 LẦN NỮA ngay giữa lúc trang đang khởi động dở, hủy luôn cả
         * tiến trình đang hiện modal "Tiếp tục nghe?" — đúng triệu chứng "modal mở ra rồi biến mất
         * ngay, không kịp thấy".
         *
         * SỬA: chỉ coi là "tab vừa hiện lại sau khi bị ẩn" (và mới được phép reload) nếu phiên JS
         * HIỆN TẠI đã thực sự tận mắt chứng kiến tab chuyển sang ẩn TRƯỚC ĐÓ VÀ CÓ LƯU ĐƯỢC GÌ
         * (_wasHiddenThisSession = true, đặt trong triggerHideReset() ở trên CHỈ KHI
         * saveResumeStateToLocalStorage() trả về true — có bài đang phát lúc ẩn tab) — tín hiệu bắn
         * ra lúc trang vừa khởi động (chưa từng thấy 'hidden' nào trong phiên này), hoặc lúc ẩn tab
         * mà KHÔNG có nhạc nào đang phát (ví dụ đang ở màn Playlist), đều bị bỏ qua — không có gì
         * cần "tiếp tục nghe" thì không cần reload. checkPendingResumeStateOnBoot() (DOMContentLoaded)
         * là nơi DUY NHẤT xử lý resume state lúc khởi động.
         */
        let _wasHiddenThisSession = false;

        document.addEventListener('visibilitychange', () => {
            // Tab/app vừa bị ẨN — lưu resume state + dừng hẳn phát nhạc + reset player về trạng
            // thái đầu (mục 2, ver 8 refine). resetPlayerToIdle() (player-controls.js) tự gọi
            // audioPlayer.pause() — event 'pause' tự release wake lock (xem player-controls.js),
            // không cần gọi releaseWakeLock() riêng ở đây.
            if (document.visibilityState !== 'visible') {
                triggerHideReset();
            } else if (_wasHiddenThisSession) {
                // Tab/app vừa HIỆN LẠI THẬT (đã từng ẩn trong phiên này — xem comment ở
                // _wasHiddenThisSession) — FIX (ver 10 refine #3): RELOAD TRANG THẬT thay vì gọi
                // showResumeChoiceModal() ngay tại đây như bản trước (xem comment đầu file để biết
                // lý do). Sau khi reload, checkPendingResumeStateOnBoot() (gọi từ draw-visualizer.js)
                // tự đọc lại state này và hiện đúng modal "Tiếp tục nghe?" — không cần làm gì thêm.
                // (Không cần tự kiểm tra readResumeStateFromLocalStorage() ở đây nữa — nếu
                // _wasHiddenThisSession=true thì triggerHideReset() chắc chắn đã chạy trước đó,
                // saveResumeStateToLocalStorage() trong đó đã tự lo việc có lưu gì hay không.)
                location.reload();
            }
        });
        // Tín hiệu DỰ PHÒNG cho iOS (xem ghi chú đầu file) — 'pagehide' bắn khi trang bị đưa ra
        // khỏi màn hình (chuyển app, khoá máy...) ở những trường hợp 'visibilitychange' bỏ lỡ.
        // event.persisted=true nghĩa là trang được đưa vào "bfcache" (có thể quay lại bằng
        // 'pageshow' sau đó) — vẫn coi là "ẩn", vẫn lưu + reset, vì yêu cầu là dừng hẳn nhạc bất kể
        // lý do ẩn.
        window.addEventListener('pagehide', triggerHideReset);
        // Đối ứng với 'pagehide' — bắn khi trang được phục hồi từ bfcache (quay lại bằng nút back/
        // forward của trình duyệt, ÍT gặp trên iOS hơn so với chuyển app). FIX (ver 10 refine #3):
        // cùng lý do với nhánh 'visible' ở trên (race condition) — chỉ reload nếu _wasHiddenThisSession
        // = true (đã thực sự chứng kiến pagehide trước đó trong CHÍNH phiên JS này — pagehide tự đặt
        // cờ này qua triggerHideReset() làm handler chung).
        window.addEventListener('pageshow', () => {
            if (_wasHiddenThisSession) location.reload();
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
