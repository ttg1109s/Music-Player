/**
 * Resume State Storage — lưu/đọc trạng thái phát nhạc qua localStorage khi tab/app bị ẩn, dùng
 * CHUNG với cơ chế "ẩn tab -> reload trang thật -> hỏi tiếp tục nghe" (ver 10 refine #3).
 *
 * BỐI CẢNH — TẠI SAO ĐỔI CƠ CHẾ NÀY:
 * Bản trước (xem player-controls.js, resetPlayerToIdle()) chỉ reset MỌI THỨ trong RAM lúc tab bị
 * ẩn rồi để app tiếp tục SỐNG ở background (không reload) — khi quay lại tab, showResumeChoiceModal()
 * gọi window.playSong(key) lại để phát tiếp. Vấn đề: hành vi đó phụ thuộc vào TOÀN BỘ trạng thái
 * runtime (AudioContext, audioPlayer, taskManager, các task auto-switch-visual, isShieldBusy...) mà
 * trình duyệt có thể đã âm thầm can thiệp/treo/đóng theo những cách KHÔNG đồng nhất trong lúc tab ẩn
 * (đặc biệt khi tab ẩn đủ lâu, hệ điều hành có thể suspend hẳn tiến trình JS, đóng AudioContext, giải
 * phóng bộ nhớ...) — đúng nguyên nhân của hành vi "lúc phát ra tiếng bình thường, lúc thì không" dù 3
 * nút bấm (Không/Tiếp tục phát/Nghe lại) đều chạy đúng logic của chúng: logic ĐÚNG, nhưng MÔI TRƯỜNG
 * RUNTIME nó đang chạy trên có thể đã hỏng/không nhất quán theo những cách không thể đoán trước.
 *
 * SỬA: thay vì cố "sống sót" qua việc ẩn tab với toàn bộ runtime cũ, lưu STATE TỐI THIỂU cần để
 * phục hồi vào localStorage (đồng bộ, tức thì — không có gì để "treo giữa chừng" như IndexedDB
 * async), rồi để trang RELOAD THẬT (location.reload()) lúc quay lại tab. Reload thật nghĩa là toàn
 * bộ runtime (AudioContext, taskManager, mọi biến RAM...) được KHỞI TẠO LẠI HOÀN TOÀN SẠCH — không
 * còn trạng thái "nửa sống nửa chết" nào sót lại từ phiên trước, nên việc phát lại bài hát luôn chạy
 * đúng 1 luồng playSong() y hệt lúc mở app lần đầu, không có biến số ẩn nào từ phiên cũ.
 *
 * PHẢI nạp SAU: config.js (không phụ thuộc gì đặc biệt, chỉ cần localStorage có sẵn — luôn đúng).
 * Các hàm ở đây được gọi từ wakelock.js (lúc ẩn tab) và draw-visualizer.js/loader.js (lúc khởi
 * động, sau khi playlist đã nạp xong từ DB).
 */
        const RESUME_STATE_STORAGE_KEY = 'sav_pendingResumeState_v1';

        /**
         * Lưu snapshot tối thiểu để phục hồi đúng trạng thái phát — gọi NGAY lúc tab/app vừa bị ẩn,
         * TRƯỚC khi audioPlayer.pause()/bất kỳ dọn dẹp RAM nào khác xảy ra (cần đọc currentTime THẬT
         * lúc còn đang phát). localStorage.setItem là đồng bộ + rất nhanh (không phải Promise/IndexedDB),
         * nên an toàn ngay cả khi trình duyệt sắp suspend JS ngay sau đó.
         *
         * Lưu CẢ playlistOrder/displayOrder/shuffleIndices (không chỉ currentKey) vì 2 lý do:
         *   1. isShuffle/repeatMode là state CHỈ SỐNG TRONG RAM (không qua saveConfig() như các
         *      tuỳ chọn khác) — reload trang thật sẽ mất hẳn nếu không tự lưu riêng ở đây.
         *   2. shuffleIndices được random MỖI LẦN updateShuffleArray() chạy — nếu để app tự build
         *      lại mảng mới sau reload (thay vì phục hồi đúng mảng cũ), thứ tự Next/Prev đang nghe
         *      dở theo shuffle sẽ đổi khác hoàn toàn, mất tính nhất quán "tiếp tục đúng như cũ".
         * KHÔNG lưu playlistOrder gốc (thứ tự thêm vào) vì IndexedDB (nguồn chân lý) đã có sẵn —
         * initPlaylistFromDB() lúc khởi động lại sẽ tự build lại đúng từ DB, lưu thêm là dư thừa.
         *
         * Trả về true nếu ĐÃ LƯU THẬT (có bài đang phát), false nếu không có gì để lưu hoặc lưu lỗi
         * — nơi gọi (wakelock.js, triggerHideReset()) dùng giá trị này để biết có nên đánh dấu
         * "phiên này đã từng ẩn tab có ý nghĩa" hay không (tránh reload vô nghĩa lúc quay lại tab
         * nếu lúc ẩn tab không có nhạc nào đang phát cả).
         */
        function saveResumeStateToLocalStorage() {
            if (typeof currentKey === 'undefined' || currentKey === null) return false; // không có gì đang phát -> không cần lưu
            try {
                const snapshot = {
                    v: 1,
                    savedAt: Date.now(),
                    currentKey: currentKey,
                    currentTime: (typeof audioPlayer !== 'undefined' && audioPlayer) ? (audioPlayer.currentTime || 0) : 0,
                    isShuffle: typeof isShuffle !== 'undefined' ? !!isShuffle : false,
                    repeatMode: typeof repeatMode !== 'undefined' ? repeatMode : 0,
                    shuffleIndices: typeof shuffleIndices !== 'undefined' ? shuffleIndices.slice() : [],
                    displayOrder: typeof displayOrder !== 'undefined' ? displayOrder.slice() : [],
                };
                localStorage.setItem(RESUME_STATE_STORAGE_KEY, JSON.stringify(snapshot));
                return true;
            } catch (e) {
                // localStorage có thể đầy/bị chặn (Safari riêng tư...) — best-effort, bỏ qua lỗi,
                // không để việc lưu resume state làm gãy luồng ẩn tab chính.
                console.warn('[resume-state] Không lưu được resume state vào localStorage (bỏ qua):', e);
                return false;
            }
        }

        /** Đọc snapshot đã lưu (nếu có) — KHÔNG tự xoá, gọi clearResumeStateFromLocalStorage() riêng sau khi xử lý xong. */
        function readResumeStateFromLocalStorage() {
            try {
                const raw = localStorage.getItem(RESUME_STATE_STORAGE_KEY);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                if (!parsed || typeof parsed !== 'object' || !parsed.currentKey) return null;
                return parsed;
            } catch (e) {
                console.warn('[resume-state] Resume state trong localStorage bị hỏng/không đọc được (bỏ qua):', e);
                return null;
            }
        }

        function clearResumeStateFromLocalStorage() {
            try { localStorage.removeItem(RESUME_STATE_STORAGE_KEY); } catch (e) {}
        }

        /**
         * Gọi lúc KHỞI ĐỘNG (sau khi initPlaylistFromDB() đã nạp playlistOrder/displayOrder THẬT từ
         * DB — xem draw-visualizer.js) — nếu có resume state đang chờ, NẠP LẠI vào RAM (shuffle/
         * repeat/displayOrder đã lưu, đè lên giá trị mặc định vừa build từ DB) rồi hiện modal hỏi
         * người dùng, đúng quy trình bình thường (showResumeChoiceModal() có sẵn ở player-controls.js).
         *
         * Bỏ qua an toàn (không làm gì) nếu: không có resume state nào đang chờ, hoặc bài đã lưu
         * (currentKey) không còn tồn tại trong playlist hiện tại (đã bị xoá ở phiên trước/phiên khác).
         */
        function checkPendingResumeStateOnBoot() {
            const snapshot = readResumeStateFromLocalStorage();
            if (!snapshot) return;
            // Bài đã lưu không còn tồn tại nữa (bị xoá) -> không có gì để hỏi, dọn cờ rồi thôi.
            if (typeof playlistCache === 'undefined' || !playlistCache.has(snapshot.currentKey)) {
                clearResumeStateFromLocalStorage();
                return;
            }
            // Nạp lại state đã lưu vào RAM — ĐÈ lên giá trị mặc định vừa build từ
            // initPlaylistFromDB()/updateShuffleArray() (isShuffle=false, repeatMode=0,
            // shuffleIndices random mới) bằng đúng giá trị đã lưu, để Next/Prev tiếp tục nhất quán.
            if (typeof isShuffle !== 'undefined') isShuffle = !!snapshot.isShuffle;
            if (typeof repeatMode !== 'undefined') repeatMode = snapshot.repeatMode || 0;
            if (Array.isArray(snapshot.shuffleIndices) && snapshot.shuffleIndices.length > 0) {
                shuffleIndices = snapshot.shuffleIndices.filter(k => playlistCache.has(k));
            }
            if (Array.isArray(snapshot.displayOrder) && snapshot.displayOrder.length > 0) {
                const filtered = snapshot.displayOrder.filter(k => playlistCache.has(k));
                if (filtered.length > 0) displayOrder = filtered;
            }
            // Đồng bộ UI nút Trộn bài/Lặp lại theo giá trị vừa phục hồi — dùng ĐÚNG class đã thấy ở
            // listener click của 2 nút này (player-controls.js: btnShuffle/btnRepeat đổi
            // '!text-sky-400'/'text-slate-400', btnRepeat thêm 'hidden' trên repeatBadge khi
            // repeatMode=0/1, hiện badge khi repeatMode=2) — không tự ý đặt tên hàm/class mới.
            if (typeof btnShuffle !== 'undefined' && btnShuffle) {
                btnShuffle.classList.toggle('!text-sky-400', isShuffle);
                btnShuffle.classList.toggle('text-slate-400', !isShuffle);
            }
            if (typeof btnRepeat !== 'undefined' && btnRepeat && typeof repeatBadge !== 'undefined' && repeatBadge) {
                if (repeatMode === 0) { btnRepeat.classList.remove('!text-sky-400'); btnRepeat.classList.add('text-slate-400'); repeatBadge.classList.add('hidden'); }
                else if (repeatMode === 1) { btnRepeat.classList.remove('text-slate-400'); btnRepeat.classList.add('!text-sky-400'); repeatBadge.classList.add('hidden'); }
                else if (repeatMode === 2) { btnRepeat.classList.add('!text-sky-400'); repeatBadge.classList.remove('hidden'); }
            }

            // Dùng ĐÚNG cơ chế hỏi đã có (lastStoppedKey/lastStoppedTime + showResumeChoiceModal(),
            // xem player-controls.js) — chỉ cần gán lại 2 biến cache đó từ snapshot rồi gọi hàm cũ,
            // không cần viết lại UI modal riêng, đảm bảo quy trình ("Không"/"Tiếp tục phát"/"Nghe
            // lại") áp dụng giống hệt như đã thiết kế.
            if (typeof lastStoppedKey !== 'undefined') lastStoppedKey = snapshot.currentKey;
            if (typeof lastStoppedTime !== 'undefined') lastStoppedTime = snapshot.currentTime || 0;
            clearResumeStateFromLocalStorage(); // đã nạp xong vào RAM -> dọn cờ, tránh hỏi lại nếu lỡ reload thêm lần nữa
            if (typeof showResumeChoiceModal === 'function') showResumeChoiceModal();
        }
