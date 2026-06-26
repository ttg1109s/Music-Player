/**
 * Điều khiển phát nhạc: next/prev, chuyển sang màn hình visualizer, nút play/pause/shuffle/repeat, Media Session API, thanh tiến trình, cập nhật UI loại hiệu ứng & màu sắc, áp EQ preset.
 * (Trích từ file gốc, dòng 802-972 trong khối <script>)
 */
        /**
         * Next/Prev khi KHÔNG shuffle giờ dùng `displayOrder` (thứ tự ĐANG HIỂN THỊ theo sort mode
         * — mục 3 trong playlist.js) làm thứ tự phát, thay cho `playlistOrder` gốc (thứ tự thêm
         * vào) như trước — đúng yêu cầu "thứ tự phát = thứ tự hiển thị" khi không trộn bài.
         *
         * "Chạm biên" (Next từ bài cuối quay về đầu, hoặc Prev từ bài đầu quay về cuối) là điểm áp
         * lại sort thật cho các bài mới thêm vào lúc đang nghe (`pendingResortKeys`, xem
         * applyNewSongsToDisplayOrder trong playlist.js) — chỉ áp dụng khi KHÔNG shuffle, vì khi
         * shuffle thì shuffleIndices đã là nguồn phát riêng, không liên quan displayOrder.
         */
        /**
         * Fix (ver 8 refine): trước đây requestWakeLock() chỉ được gọi RIÊNG ở từng nơi BẤM nút
         * (click Next/Prev) — Media Session ('previoustrack'/'nexttrack', điều khiển từ màn hình
         * khoá/tai nghe) và auto-next khi hết bài ('ended') KHÔNG xin lại wake lock, nên màn hình
         * vẫn có thể tự tắt sau khi chuyển bài bằng những đường đó dù "Giữ màn hình sáng" đang bật.
         * Đưa requestWakeLock() vào ĐẦU playNext()/playPrev() — chạy NGAY khi hàm được gọi, trước
         * mọi điều kiện khác — để MỌI lối gọi (click, mediaSession, ended, và bất kỳ chỗ nào sau
         * này gọi 2 hàm này) đều tự động xin lại, không cần nhớ gọi requestWakeLock() riêng ở từng
         * nơi nữa. requestWakeLock() tự kiểm tra vizConfig.keepScreenOn nội bộ (xem wakelock.js) nên
         * gọi vô điều kiện ở đây không vi phạm tùy chọn "Giữ màn hình sáng" đang tắt.
         */
        function playNext(force = false) {
            requestWakeLock();
            if (playlistOrder.length === 0) return;
            if (!force && repeatMode === 2) { audioPlayer.currentTime = 0; audioPlayer.play(); return; }
            let nextKey;
            if (isShuffle) {
                let currentPos = shuffleIndices.indexOf(currentKey);
                if (currentPos === -1 || currentPos === playlistOrder.length - 1) { if (repeatMode === 1 || force) nextKey = shuffleIndices[0]; else { audioPlayer.pause(); return; } }
                else nextKey = shuffleIndices[currentPos + 1];
            } else {
                let currentPos = displayOrder.indexOf(currentKey);
                const isWrappingToStart = (currentPos === displayOrder.length - 1);
                if (isWrappingToStart) {
                    if (repeatMode === 1 || force) {
                        if (pendingResortKeys.size > 0) recomputeDisplayOrder(); // chạm biên: áp lại sort thật cho bài mới thêm giữa lúc nghe
                        nextKey = displayOrder[0];
                    } else { audioPlayer.pause(); return; }
                } else nextKey = displayOrder[currentPos + 1];
            }
            window.playSong(nextKey);
        }

        function playPrev() {
            requestWakeLock();
            if (playlistOrder.length === 0) return;
            if (audioPlayer.currentTime > 3) { audioPlayer.currentTime = 0; return; }
            let prevKey;
            if (isShuffle) {
                let currentPos = shuffleIndices.indexOf(currentKey); prevKey = (currentPos <= 0) ? shuffleIndices[playlistOrder.length - 1] : shuffleIndices[currentPos - 1];
            } else {
                let currentPos = displayOrder.indexOf(currentKey);
                const isWrappingToEnd = (currentPos <= 0);
                if (isWrappingToEnd) {
                    if (pendingResortKeys.size > 0) recomputeDisplayOrder(); // chạm biên: áp lại sort thật
                    prevKey = displayOrder[displayOrder.length - 1];
                } else prevKey = displayOrder[currentPos - 1];
            }
            window.playSong(prevKey);
        }

        /**
         * Ver 8 refine (mục 2): dừng hẳn phát nhạc + đưa player về ĐÚNG trạng thái đầu (như chưa
         * từng chọn bài nào) — dùng khi tab/app bị ẩn (xem wakelock.js), THAY HẲN cho hành vi cũ
         * "pause tạm, giữ nguyên bài đang chọn, không tự resume". Khác removeKeyFromDisplay() (xoá
         * 1 bài khỏi playlist): hàm này KHÔNG đụng tới playlistOrder/displayOrder/IndexedDB, chỉ
         * dừng playback + reset UI player + giải phóng currentKey, playlist vẫn còn nguyên y hệt.
         *
         * FIX (log 7->8, mục "chuyển tab/ẩn trình duyệt trên iOS"): bản trước có 3 lỗi liên quan
         * lẫn nhau, đều bắt nguồn từ việc CHỈ trông cậy vào sự kiện 'visibilitychange' (xem
         * wakelock.js) — sự kiện này được WebKit/Safari trên iOS xác nhận là KHÔNG đáng tin cậy khi
         * chuyển app/khoá màn hình (có thể bắn trễ, bắn không đầy đủ, hoặc không bắn — trình duyệt
         * có thể đã ngưng chạy JS đúng lúc đó). Khi điều đó xảy ra, hàm này có thể chỉ chạy được MỘT
         * PHẦN hoặc chạy NHIỀU LẦN chồng nhau (gọi từ cả 'visibilitychange' VÀ 'pagehide' làm tín
         * hiệu dự phòng — xem wakelock.js), gây ra:
         *   (a) "Thanh tiến trình không bị reset": nếu hàm không chạy/chạy nửa chừng,
         *       audioPlayer.pause() có thể chưa kịp thực thi -> audio vẫn phát ở dưới (iOS cho phép
         *       <audio> tiếp tục phát khi tab ẩn), 'timeupdate' vẫn bắn liên tục -> thanh tiến trình
         *       (và biến isSeeking=false) tiếp tục nhảy theo currentTime thật, trông như "không bị
         *       reset" dù logic reset có gọi.
         *   (b) "Không tự chuyển UI Playlist": bản trước CHỈ reset dữ liệu (currentKey, text, ảnh...)
         *       mà KHÔNG đụng tới class hiển thị của #playlist-view/#visualizer-ui — nếu người dùng
         *       đang ở màn Visualizer lúc bị ẩn, quay lại vẫn thấy màn Visualizer (trống, không có
         *       gì để xem) thay vì được đưa về Playlist — đúng tinh thần "như chưa chọn bài nào,
         *       app nên hiện đúng màn ban đầu (Playlist)".
         *   (c) "Nút phát không chuyển/nhạc không phát/BPM-Pitch-Energy không hoạt động khi bấm lại":
         *       nếu hàm reset bị NGẮT GIỮA CHỪNG bởi việc trang bị treo (browser suspend JS), hoặc
         *       nếu MỘT LƯỢT playSong() trước đó (chạy trong withLoadingShield, xem actions.js) đang
         *       "bay" đúng lúc tab bị ẩn và promise của nó không bao giờ settle lại được, biến khoá
         *       isShieldBusy (loading-shield-util.js) có thể bị "kẹt" mãi ở true. Mọi lượt
         *       playSong()/withLoadingShield() gọi SAU đó (kể cả lúc người dùng bấm lại Play) sẽ bị
         *       chặn IM LẶNG ngay dòng đầu (`if (isShieldBusy) return;`) — nút Play không đổi icon,
         *       không có gì phát, các thống kê (BPM/Pitch/Energy) không cập nhật vì playSong() chưa
         *       từng thực sự chạy lại — ĐÚNG triệu chứng quan sát được, dù thumb thanh trượt vẫn nhảy
         *       (xem (a) — đó là audio CŨ vẫn đang phát ở dưới, không liên quan tới lượt playSong()
         *       mới bị chặn).
         *
         * Giải pháp — 3 phần, áp dụng NGAY ĐẦU hàm trước khi làm bất cứ gì khác:
         *   1. Cờ `_resetPlayerToIdleInProgress` chặn việc hàm tự gọi chồng lên chính nó (do cả
         *      'visibilitychange' VÀ 'pagehide' có thể cùng kích hoạt nó) — KHÔNG chặn việc gọi
         *      hàm nhiều lần liên tiếp (mỗi lần đều phải làm xong việc của nó), chỉ chặn đè lên nhau
         *      trong cùng 1 lượt xử lý đồng bộ.
         *   2. Giải phóng cứng `isShieldBusy = false` — đảm bảo dù lượt playSong()/loadingShield
         *      nào đó có bị "treo" do trang bị OS suspend, lần phát lại sau khi quay lại tab LUÔN
         *      được phép chạy, không bị khoá im lặng vĩnh viễn. An toàn vì resetPlayerToIdle() chỉ
         *      chạy khi tab vừa ẨN/quay lại — không có tác vụ shield nào còn "hợp lệ" để bảo vệ vào
         *      đúng thời điểm này (nhạc đã được lệnh dừng).
         *   3. Đưa luôn UI về màn Playlist (gọi đúng chuỗi class đã dùng ở nút "Quay lại" sẵn có –
         *      btnBackPlaylist – để nhất quán 100% hiệu ứng) + closeControlCenter() phòng panel đó
         *      còn mở sót.
         */
        /**
         * Cache "bài vừa bị dừng" do resetPlayerToIdle() — dùng cho modalChoice() hỏi người dùng
         * lúc quay lại tab (xem wakelock.js, showResumeChoiceModal()). KHÁC `previousKey` cục bộ
         * trong resetPlayerToIdle() (biến đó chỉ sống trong phạm vi hàm, dùng để refreshSongNode):
         * 2 biến dưới đây sống XUYÊN SUỐT đến khi modal xử lý xong (Không/Tiếp tục phát/Nghe lại),
         * rồi mới bị xoá. `lastStoppedTime` lưu ĐÚNG `audioPlayer.currentTime` tại thời điểm bị
         * dừng (trước khi resetPlayerToIdle() đưa nó về 0) — để "Tiếp tục phát" phát đúng từ chỗ
         * cũ, "Nghe lại" phát lại từ đầu.
         */
        let lastStoppedKey = null;
        let lastStoppedTime = 0;

        /**
         * Đưa UI về màn Playlist, ẩn Visualizer/player-container — TÁCH RA dùng chung giữa
         * resetPlayerToIdle() (tab/app bị ẩn) và clearAllStoredData() (Clear All trong Quản lý
         * dung lượng, xem storage-manager.js): cả 2 trường hợp đều "không còn gì đang phát" sau
         * khi gọi, nên UI phải bị ép về đúng màn Playlist NGAY, không chờ người dùng tự bấm Back —
         * tránh đúng bug "Clear All xong vẫn thấy current/next/prev trên màn Visualizer" (UI cũ
         * đứng yên dù currentKey đã bị xoá khỏi RAM).
         *
         * KHÔNG đụng tới currentKey/audioPlayer/RAM khác — chỉ lo phần hiển thị (class CSS, panel
         * Control Center). Nơi gọi PHẢI tự reset RAM (currentKey=null, audioPlayer.pause()...)
         * TRƯỚC khi gọi hàm này, đúng như resetPlayerToIdle()/clearAllStoredData() đang làm.
         */
        function forceBackToPlaylistUI() {
            visualizerUI.classList.remove('fade-enter-active');
            canvas.classList.add('opacity-0');
            const webglCanvasEl = document.getElementById('webgl-canvas');
            if (webglCanvasEl) webglCanvasEl.classList.add('opacity-0');
            playlistView.classList.remove('-translate-y-full');
            if (typeof closeControlCenter === 'function') closeControlCenter(); // phòng panel còn mở sót
            taskManager.once(() => { visualizerUI.classList.add('hidden'); playerContainer.classList.add('hidden'); renderPlaylistDiff(); }, 300, 'hideVisualizerUiAfterFade');
        }

        let _resetPlayerToIdleInProgress = false;
        function resetPlayerToIdle() {
            if (_resetPlayerToIdleInProgress) return; // chặn gọi chồng (vd. 'visibilitychange' + 'pagehide' cùng bắn)
            _resetPlayerToIdleInProgress = true;
            try {
                // (2) Giải phóng cứng — KHÔNG để 1 lượt withLoadingShield() bị OS treo giữa chừng
                // (lúc tab vừa ẩn) khoá im lặng MỌI lượt playSong() sau khi người dùng quay lại tab.
                //
                // FIX (sau bug Clear All): trước đây dòng này set CỨNG isShieldBusy = false vô điều
                // kiện — nếu resetPlayerToIdle() bị gọi (tab ẩn) ĐÚNG LÚC clearAllStoredData() đang
                // chạy giữa loop xoá bài (cũng nằm trong withLoadingShield()), khoá bị mở sớm trong
                // khi tác vụ xoá vẫn còn dở — 1 hành động khác gọi withLoadingShield() ngay sau đó
                // (hiếm nhưng có thể) sẽ chạy CHỒNG lên lượt xoá đang chạy. Giờ chỉ giải phóng cứng
                // khi CHẮC CHẮN không có tác vụ "phá hủy không hoàn tác" nào đang dở — cờ
                // isDestructiveTaskInProgress (xem storage-manager.js, bật trong suốt
                // clearAllStoredData()) là tín hiệu DUY NHẤT cho việc đó.
                if (typeof isDestructiveTaskInProgress === 'undefined' || !isDestructiveTaskInProgress) {
                    isShieldBusy = false;
                    if (typeof loadingShield !== 'undefined' && loadingShield) {
                        loadingShield.classList.remove('opacity-100', 'pointer-events-auto');
                        loadingShield.classList.add('opacity-0', 'pointer-events-none');
                    }
                }

                // Cache LẠI key + vị trí đang phát TRƯỚC khi mọi thứ dưới đây bị reset về 0/null —
                // dùng cho modal hỏi "Tiếp tục nghe?" lúc quay lại tab (xem wakelock.js).
                if (currentKey) { lastStoppedKey = currentKey; lastStoppedTime = audioPlayer.currentTime || 0; }

                audioPlayer.pause();
                audioPlayer.currentTime = 0;
                if (currentObjectURL) { URL.revokeObjectURL(currentObjectURL); currentObjectURL = null; }
                if (currentCoverObjectURL) { URL.revokeObjectURL(currentCoverObjectURL); currentCoverObjectURL = null; }
                audioPlayer.removeAttribute('src'); audioPlayer.src = '';
                const previousKey = currentKey;
                currentKey = null;
                // ver 10: audioPlayer.pause() ở trên đã bắn event 'pause' (gọi syncAutoSwitchVisualPlayState())
                // NHƯNG lúc đó currentKey vẫn còn giá trị cũ (dòng này mới set null) -> hàm đó chỉ
                // pause() task thay vì kill() hẳn. Dọn dứt điểm ở đây — không còn bài nào đang phát
                // thì task auto-switch-visual không có lý do gì tồn tại (pause hờ) nữa.
                if (typeof killAllAutoSwitchVisualTasks === 'function') killAllAutoSwitchVisualTasks();
                // Reset UI player về ĐÚNG trạng thái ban đầu — xem bottom-player.js (TPL_BOTTOM_PLAYER)
                // để biết giá trị gốc lúc chưa chọn bài nào.
                playerTitle.textContent = 'Chưa chọn bài'; playerArtist.textContent = '---';
                recordContainer.innerHTML = `<img id="record-art" src="" class="w-full h-full rounded-full object-cover shadow-lg relative z-20" alt="Record"><div class="absolute inset-0 m-auto w-3 h-3 bg-slate-900 rounded-full border border-slate-700 z-30"></div>`;
                progressBar.value = 0;
                currentTimeDisplay.textContent = '0:00'; durationTimeDisplay.textContent = '0:00';
                if ('mediaSession' in navigator) { navigator.mediaSession.metadata = null; navigator.mediaSession.playbackState = 'none'; }
                btnReturnVisual.classList.add('hidden');
                if (previousKey) refreshSongNode(previousKey); // bỏ trạng thái "đang phát" (chấm xanh/EQ icon) khỏi bài vừa dừng trong danh sách

                // (3) Đưa UI về màn Playlist — xem forceBackToPlaylistUI() ở trên, dùng CHUNG với
                // clearAllStoredData() (storage-manager.js) để tránh người dùng quay lại tab vẫn
                // thấy màn Visualizer trống không còn gì đang phát.
                forceBackToPlaylistUI();
            } finally {
                _resetPlayerToIdleInProgress = false;
            }
        }

        /**
         * Modal "Bạn có muốn tiếp tục nghe bài XXX không?" — hiện ra khi người dùng QUAY LẠI tab
         * sau khi resetPlayerToIdle() đã dừng nhạc + xoá currentKey (xem wakelock.js, gọi hàm này
         * lúc visibilitychange/pageshow báo tab vừa hiện lại). Dùng modalChoice() (file riêng,
         * js/core/modal-choice.js) — KHÔNG đụng gì tới loading-shield (chỉ là spinner, không có
         * chỗ cho nút bấm — xem comment ở modal-choice.js).
         *
         * 3 lựa chọn (đúng yêu cầu):
         *   - "Không"          -> không làm gì cả, ở lại màn Playlist (đã sẵn ở idle từ
         *                         resetPlayerToIdle() rồi, không cần làm gì thêm).
         *   - "Tiếp tục phát"  -> phát lại ĐÚNG bài đó, seek về đúng vị trí (lastStoppedTime) lúc
         *                         bị dừng.
         *   - "Nghe lại"       -> phát lại bài đó TỪ ĐẦU (currentTime = 0).
         */
        /**
         * Cờ chống MỞ CHỒNG modal "Tiếp tục nghe?" — xử lý đúng kịch bản người dùng phát hiện:
         * quay lại tab -> modal hiện ra -> (CHƯA CHỌN GÌ) ẩn tab đi -> quay lại tab LẦN NỮA. Nếu
         * không có cờ này, lần quay lại thứ 2 có thể gọi showResumeChoiceModal() chồng lên modal
         * cũ đang mở (modalChoice() tự dọn modal cũ trước khi dựng modal mới — xem modal-choice.js
         * — nhưng làm vậy nghĩa là context của lượt hỏi đầu tiên bị xoá âm thầm, người dùng có thể
         * hoang mang vì modal "tự đổi nội dung"/nhảy giật mà không hiểu vì sao).
         *
         * true  = modal đang mở, đang chờ người dùng chọn -> showResumeChoiceModal() gọi lại lúc
         *         này sẽ KHÔNG làm gì cả (không dựng modal thứ 2, không đụng vào modal đang có).
         * false = không có modal nào đang mở -> nếu có lastStoppedKey, được phép dựng modal mới.
         * Đặt lại false ngay khi 1 trong 3 nút được bấm (modal đã đóng xong), bất kể chọn nút nào.
         */
        let isResumeModalOpen = false;

        function showResumeChoiceModal() {
            if (isResumeModalOpen) return; // modal cũ vẫn đang mở chờ chọn -> không mở chồng/thay thế
            if (!lastStoppedKey) return; // chưa từng nghe gì trước đó -> không có gì để hỏi
            const key = lastStoppedKey;
            const resumeTime = lastStoppedTime;
            // Xoá cache NGAY khi mở modal (không phải lúc bấm nút) — tránh hiện lại modal này thêm
            // lần nữa nếu lại bị ẩn/hiện tab liên tiếp trong lúc modal đang mở (currentKey vẫn null
            // lúc đó, nhưng lastStoppedKey đã bị xoá nên triggerHideReset()/showResumeChoiceModal()
            // sau đó không có gì để hỏi nữa). Cờ isResumeModalOpen ở trên là lớp chặn THỨ HAI, áp
            // dụng kể cả trong trường hợp hiếm lastStoppedKey vô tình có giá trị trở lại trước khi
            // modal hiện tại đóng (ví dụ nếu code khác sau này gán lastStoppedKey ở chỗ mới).
            lastStoppedKey = null; lastStoppedTime = 0;
            isResumeModalOpen = true;

            const cached = (typeof playlistCache !== 'undefined') ? playlistCache.get(key) : null;
            const title = cached && cached.tag && cached.tag.title ? cached.tag.title : key;

            modalChoice(
                `Bạn có muốn tiếp tục nghe bài <b>${title}</b> không?`,
                [
                    {
                        label: 'Không',
                        className: 'flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors',
                        onClick: () => { isResumeModalOpen = false; }
                    },
                    {
                        label: 'Tiếp tục phát',
                        className: 'flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold transition-colors',
                        onClick: async () => {
                            isResumeModalOpen = false;
                            await window.playSong(key);
                            if (currentKey === key) audioPlayer.currentTime = resumeTime;
                        }
                    },
                    {
                        label: 'Nghe lại',
                        className: 'flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold transition-colors',
                        onClick: () => { isResumeModalOpen = false; window.playSong(key); } // playSong() đã tự đặt currentTime = 0 khi gán src mới — không cần seek thêm
                    }
                ],
                { title: 'Đang phát tiếp?' }
            );
        }

        function switchToVisualizer() {
            playlistView.classList.add('-translate-y-full'); visualizerUI.classList.remove('hidden'); playerContainer.classList.remove('hidden');
            // KHÔNG gọi handleVideoBackground() ở đây nữa: chuyển màn hình KHÔNG được điều khiển video
            // (video chỉ bám theo trạng thái nhạc). Playlist đè z-[60] tự che video khi cần.
            taskManager.once(() => { 
                visualizerUI.classList.add('fade-enter-active'); canvas.classList.remove('opacity-0'); 
                if (vizConfig.type === 'vortex') document.getElementById('webgl-canvas').classList.remove('opacity-0');
            }, 50, 'showVisualizerFadeIn');
        }

        btnBackPlaylist.addEventListener('click', () => {
            // KHÔNG dừng/ẩn video ở đây nữa: Playlist (z-[60]) tự che video, video vẫn chạy theo nhạc.
            forceBackToPlaylistUI(); // dùng chung với resetPlayerToIdle()/clearAllStoredData() — xem định nghĩa ở trên
        });

        playPauseBtn.addEventListener('click', () => {
            requestWakeLock(); if (playlistOrder.length === 0) return;
            if (currentKey === null) { window.playSong(displayOrder[0] || playlistOrder[0]); return; }
            // FIX (log 9->10): 'interrupted' là trạng thái RIÊNG của iOS Safari khi audio bị hệ điều
            // hành "ngắt" lúc tab/app bị ẩn (khác 'suspended' — xem giải thích đầy đủ ở
            // setupAudioContext(), audio-engine.js). Thiếu check này thì audioContext.resume() không
            // được gọi, dù audioPlayer.play() có chạy thì vẫn không nghe được tiếng gì.
            if (audioPlayer.paused) { audioPlayer.play(); if (audioContext && (audioContext.state === 'suspended' || audioContext.state === 'interrupted')) audioContext.resume(); } else { audioPlayer.pause(); }
        });

        btnNext.addEventListener('click', () => playNext(true)); btnPrev.addEventListener('click', () => playPrev());
        btnShuffle.addEventListener('click', () => { isShuffle = !isShuffle; btnShuffle.classList.toggle('!text-sky-400', isShuffle); btnShuffle.classList.toggle('text-slate-400', !isShuffle); updateShuffleArray(); });
        btnRepeat.addEventListener('click', () => {
            repeatMode = (repeatMode + 1) % 3;
            if (repeatMode === 0) { btnRepeat.classList.remove('!text-sky-400'); btnRepeat.classList.add('text-slate-400'); repeatBadge.classList.add('hidden'); } 
            else if (repeatMode === 1) { btnRepeat.classList.remove('text-slate-400'); btnRepeat.classList.add('!text-sky-400'); repeatBadge.classList.add('hidden'); } 
            else if (repeatMode === 2) { btnRepeat.classList.add('!text-sky-400'); repeatBadge.classList.remove('hidden'); }
        });

        // Ver 8 refine (mục 2 — loại bỏ can thiệp điều khiển từ ngoài app): KHÔNG còn
        // navigator.mediaSession.setActionHandler(...) nào nữa — play/pause/next/prev/seek từ màn
        // hình khoá, tai nghe, hoặc nút điều khiển trên thông báo hệ thống SẼ KHÔNG còn tác dụng.
        // navigator.mediaSession.metadata (tên bài/ảnh hiển thị trên thông báo, xem playlist/
        // actions.js) và .playbackState (trạng thái playing/paused hiển thị) VẪN GIỮ — đây chỉ là
        // thông tin hiển thị một chiều, không phải đường điều khiển ngược lại vào app.

        function updateMediaPositionState() {
            if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
                if (isFinite(audioPlayer.duration) && isFinite(audioPlayer.currentTime) && isFinite(audioPlayer.playbackRate)) {
                    try { navigator.mediaSession.setPositionState({ duration: audioPlayer.duration, playbackRate: audioPlayer.playbackRate, position: audioPlayer.currentTime }); } catch(e) {}
                }
            }
        }

        // ===== Bộ đếm THỜI GIAN NGHE THẬT — đồng hồ thực, ĐỘC LẬP với thanh tiến trình =====
        // Trước đây thời lượng nghe được suy ra từ delta của audioPlayer.currentTime (vị trí thanh
        // tiến trình). Cách đó không đáng tin: currentTime nhảy khi seek, khựng khi buffer, và phụ
        // thuộc tốc độ phát — không phản ánh đúng "đã nghe bao lâu theo đồng hồ". Bản này đo bằng
        // performance.now(): một task lặp 1s (qua taskManager, mode 'timeout' — bù trôi, tránh dồn
        // tick khi tab bị throttle nền) chỉ chạy KHI nhạc thực sự đang phát, cộng dồn delta thời
        // gian thực vào cả tổng (meta.totalListenSeconds) lẫn từng bài (addSongListenTime).
        //
        // Mỗi lần play() là 1 "phiên" đếm MỚI (không nối tiếp pha cũ của lần phát trước) — vì vậy
        // startListenClock() luôn kill() task cũ (nếu lỡ còn sót) rồi addNew() + enabled() lại từ
        // đầu, KHÔNG dùng taskManager.resume() (resume() giữ nguyên remainingTime để nối đúng pha
        // — đúng nghĩa cho việc tạm dừng/tiếp tục GIỮA chừng 1 phiên, không phải bắt đầu phiên mới).
        const LISTEN_CLOCK_TASK = 'listenClock';
        let _listenLastTick = 0;
        let pendingListenSeconds = 0; // phần tổng chưa flush vào IndexedDB (cũng được wakelock.js flush lúc unload)

        function _listenTick() {
            const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            let delta = (now - _listenLastTick) / 1000;
            _listenLastTick = now;
            if (!(delta > 0)) return;
            // Chặn delta bất thường khi tab bị treo/throttle nền hoặc máy ngủ rồi thức (tránh cộng
            // vọt hàng phút/giờ). Giới hạn 4s/tick (chu kỳ 1s nên bình thường delta ~1s).
            if (delta > 4) delta = 4;
            pendingListenSeconds += delta;
            if (currentKey && typeof addSongListenTime === 'function') addSongListenTime(currentKey, delta);
            if (pendingListenSeconds >= 5) {
                const toFlush = pendingListenSeconds; pendingListenSeconds = 0;
                // FIX (log 9->10, mục "Promise bị reject nhưng không ai .catch()"): hàm này chạy mỗi
                // GIÂY qua taskManager (xem startListenClock()) SUỐT lúc nhạc đang phát — nếu tab bị
                // ẩn trên iOS và connection IndexedDB bị hệ điều hành đóng/treo giữa lúc transaction
                // đang mở (db.transaction() throw đồng bộ một DOMException khi connection đã chết —
                // xem db.js, makeStoreAccessor), exception đó tự biến thành promise reject vì nằm
                // trong .then() callback. Thiếu .catch() ở đây khiến nó thoát ra dưới dạng
                // "unhandled promise rejection" — có thể lặp lại MỖI GIÂY nếu trạng thái lỗi kéo dài,
                // đúng log "[FATAL] Promise bị reject nhưng không ai .catch(): TypeError {}" người
                // dùng báo lại qua console-log tool. Best-effort — bỏ qua lỗi (log để dò), không để
                // 1 lượt ghi thống kê lỗi làm crash/spam lỗi ra ngoài.
                getMeta('totalListenSeconds')
                    .then(v => setMeta('totalListenSeconds', (v || 0) + toFlush))
                    .catch(err => console.warn('[player-controls] Không ghi được totalListenSeconds (best-effort, bỏ qua):', err));
            }
        }
        function startListenClock() {
            taskManager.kill(LISTEN_CLOCK_TASK); // phòng còn sót từ phiên trước (an toàn nếu gọi lại)
            _listenLastTick = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            taskManager.addNew(LISTEN_CLOCK_TASK, { time: 1000, exe: _listenTick, mode: 'timeout', count: 0 });
            taskManager.operator(LISTEN_CLOCK_TASK, 'enabled');
        }
        function stopListenClock() {
            if (!taskManager.isTaskRunning(LISTEN_CLOCK_TASK)) return;
            _listenTick(); // chốt nốt phần lẻ kể từ tick gần nhất trước khi dừng
            taskManager.kill(LISTEN_CLOCK_TASK);
        }

        audioPlayer.addEventListener('play', () => { 
            iconPlay.classList.add('hidden'); iconPause.classList.remove('hidden'); 
            let recordArtDynamic = document.getElementById('record-art'); if(recordArtDynamic) recordArtDynamic.classList.remove('paused');
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing";
            if (currentKey) refreshSongNode(currentKey);
            startListenClock();
            if (typeof syncAutoSwitchVisualPlayState === 'function') syncAutoSwitchVisualPlayState(); // ver 10: xem auto-switch-visual.js
            // Chỉ ĐỒNG BỘ phát video theo nhạc — KHÔNG fade lại. Nguồn + fade đã thiết lập 1 lần
            // lúc bật/upload/nạp trang (handleVideoBackground), nên Next/Prev không lặp lại cú fade.
            syncVideoBgToAudio();
        });
        audioPlayer.addEventListener('pause', () => { 
            iconPlay.classList.remove('hidden'); iconPause.classList.add('hidden'); 
            let recordArtDynamic = document.getElementById('record-art'); if(recordArtDynamic) recordArtDynamic.classList.add('paused');
            releaseWakeLock(); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "paused";
            if (currentKey) refreshSongNode(currentKey);
            stopListenClock();
            if (typeof syncAutoSwitchVisualPlayState === 'function') syncAutoSwitchVisualPlayState(); // ver 10: xem auto-switch-visual.js
            syncVideoBgToAudio();
        });
        audioPlayer.addEventListener('ended', () => { stopListenClock(); playNext(false); });
        audioPlayer.addEventListener('loadedmetadata', () => {
            progressBar.max = audioPlayer.duration; durationTimeDisplay.textContent = formatTime(audioPlayer.duration); updateMediaPositionState();
            // ver 10: bài MỚI bắt đầu (duration vừa có giá trị chính xác) -> build lại marks cho
            // auto-switch-visual — xem onAutoSwitchVisualSongChanged() ở auto-switch-visual.js.
            if (typeof onAutoSwitchVisualSongChanged === 'function') onAutoSwitchVisualSongChanged();
        });
        // Lỗi decode THẬT (khác với "không tìm thấy record" đã xử lý riêng trong playSong) — trình
        // duyệt gán src xong rồi mới phát hiện không decode được (file hỏng dù qua được check nhanh
        // lúc nạp/quét). Chỉ xử lý khi đang thực sự gắn với currentKey (audioPlayer.src vẫn còn trỏ
        // đúng bài đó) — tránh trường hợp hiếm: lỗi bắn ra sau khi đã playSong() sang bài khác.
        audioPlayer.addEventListener('error', () => {
            if (currentKey && currentObjectURL && audioPlayer.src === currentObjectURL) {
                handlePlaybackError(currentKey);
            }
        });

        let lastPositionSync = 0;
        audioPlayer.addEventListener('timeupdate', () => { 
            if (!isSeeking) { progressBar.value = audioPlayer.currentTime; updateProgressBarCSS(); } 
            currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime); processSubtitles(audioPlayer.currentTime);
            if (Date.now() - lastPositionSync > 5000) { updateMediaPositionState(); lastPositionSync = Date.now(); }
            // (Thống kê thời lượng nghe KHÔNG còn tính ở đây — xem "Bộ đếm thời gian nghe thật"
            //  phía trên: đo bằng đồng hồ thực, độc lập với currentTime/thanh tiến trình.)
        });
        
        audioPlayer.addEventListener('seeked', updateMediaPositionState);
        progressBar.addEventListener('input', () => { isSeeking = true; currentTimeDisplay.textContent = formatTime(progressBar.value); updateProgressBarCSS(); processSubtitles(progressBar.value); });
        progressBar.addEventListener('change', () => { audioPlayer.currentTime = progressBar.value; isSeeking = false; updateMediaPositionState(); });

        function updateProgressBarCSS() {
            const percentage = (progressBar.value / (progressBar.max || 100)) * 100;
            const color = vizConfig.mode === 'solid' ? vizConfig.solidColor : (vizConfig.mode === 'dynamic' ? vizConfig.dynB : '#38bdf8');
            progressBar.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, rgba(255,255,255,0.2) ${percentage}%, rgba(255,255,255,0.2) 100%)`;
        }

        btnSettings.addEventListener('click', () => drawerSettings.classList.remove('-translate-y-full'));
        btnSettingsPlaylist.addEventListener('click', () => drawerSettings.classList.remove('-translate-y-full'));
        closeDrawer.addEventListener('click', () => { validateVideoBgOnClose(); drawerSettings.classList.add('-translate-y-full'); });
        
        // FIX (yêu cầu mới): khi "Tự động đổi hiệu ứng" đang BẬT (vizConfig.autoSwitchVisualEnabled),
        // nút "Đổi hiệu ứng" (#btn-cycle-mode) ở Control Center PHẢI vô hiệu — không bấm được, bấm
        // cũng không có tác dụng gì. Trước đây nút này luôn hoạt động bất kể auto-switch đang bật
        // hay tắt, gây xung đột: tự động đang đếm giờ để đổi, nhưng người dùng bấm tay cũng đổi
        // được luôn, 2 cơ chế dẫm chân nhau. Kiểm tra ĐIỀU KIỆN NGAY ĐẦU listener (không chỉ dựa
        // vào thuộc tính HTML `disabled` của nút — xem updateCycleModeButtonState() ở
        // auto-switch-visual.js, nơi đồng bộ CẢ thuộc tính disabled/style THỊ GIÁC lẫn cờ JS này)
        // để chắc chắn không có đường nào lách qua được, kể cả khi nút được kích hoạt bằng cách
        // khác ngoài click chuột thật (ví dụ gọi .click() bằng JS từ nơi khác).
        btnCycleMode.addEventListener('click', () => {
            if (vizConfig.autoSwitchVisualEnabled) return;
            currentModeIndex = (currentModeIndex + 1) % MODES.length; updateTypeUI(); saveConfig();
        });

        function updateTypeUI() {
            vizConfig.type = MODES[currentModeIndex]; modeBadge.textContent = `${currentModeIndex + 1}/${MODES.length}`;
            // Đồng bộ select "Kiểu hiệu ứng" trong Settings (ver 8 refine) — updateTypeUI() là
            // điểm DUY NHẤT mọi đường đổi kiểu hiệu ứng đều đi qua (cycle button HOẶC select), nên
            // đặt đồng bộ ở đây đảm bảo 2 UI luôn khớp nhau bất kể đổi từ đâu.
            if (typeof visualizerTypeSelect !== 'undefined' && visualizerTypeSelect) visualizerTypeSelect.value = vizConfig.type;
            blockMaxHeight.classList.add('hidden'); blockBarWidth.classList.add('hidden');
            blockVortex.classList.add('hidden'); blockRain.classList.add('hidden'); blockBarStyle.classList.add('hidden');
            
            if (vizConfig.type === 'vortex') {
                if(!tInitialized) initThreeJS();
                updateVortexVisibility();
                if (!playlistView.classList.contains('-translate-y-full')) {} else { document.getElementById('webgl-canvas').classList.remove('opacity-0'); }
            } else { document.getElementById('webgl-canvas').classList.add('opacity-0'); }

            if (vizConfig.type === 'vortex') { blockVortex.classList.remove('hidden'); blockVortex.classList.add('flex'); }
            else if (vizConfig.type === 'rain') { blockRain.classList.remove('hidden'); blockRain.classList.add('flex'); }
            else if (vizConfig.type === 'bar') {
                // "Độ cao tối đa" vẫn dùng chung cho Bar (cả mirror/cascade); "Độ dày thanh" KHÔNG
                // áp dụng cho Bar nữa (chỉ Black Hole) — xem updateBarStyleUI cho 2 setting riêng
                // của kiểu Phản chiếu (số lượng thanh, độ to vòng tròn).
                blockMaxHeight.classList.remove('hidden'); blockMaxHeight.classList.add('flex');
                blockBarStyle.classList.remove('hidden'); blockBarStyle.classList.add('flex');
                updateBarStyleUI();
            }
            else if (vizConfig.type === 'black hole') {
                // Black Hole là visual DUY NHẤT còn dùng "Độ dày thanh".
                blockMaxHeight.classList.remove('hidden'); blockMaxHeight.classList.add('flex');
                blockBarWidth.classList.remove('hidden'); blockBarWidth.classList.add('flex');
            }
            else if (vizConfig.type !== 'rubik' && vizConfig.type !== 'lightning') { 
                blockMaxHeight.classList.remove('hidden'); blockMaxHeight.classList.add('flex'); 
            }

            if(analyser) { analyser.fftSize = (vizConfig.type === 'vortex' || vizConfig.type === 'lightning') ? APP_CONFIG.fftSizeHighRes : APP_CONFIG.fftSizeStandard; allocateBuffers(); }
        }

        function updateBarStyleUI() {
            const isMirror = vizConfig.barStyle === 'mirror';
            barMirrorOptions.classList.toggle('hidden', !isMirror);
            barMirrorOptions.classList.toggle('flex', isMirror);
        }

        function updateColorMenuUI() {
            if (vizConfig.mode === 'solid') { solidColorContainer.classList.remove('hidden'); dynColorContainer.classList.add('hidden'); dynColorContainer.classList.remove('flex'); } 
            else if (vizConfig.mode === 'dynamic') { solidColorContainer.classList.add('hidden'); dynColorContainer.classList.remove('hidden'); dynColorContainer.classList.add('flex'); } 
            else { solidColorContainer.classList.add('hidden'); dynColorContainer.classList.add('hidden'); dynColorContainer.classList.remove('flex'); }
            updateProgressBarCSS();
        }

        function applyEQPreset(mode) {
            if (!eqBandNodes || eqBandNodes.length === 0) return;
            const gains = mode === 'manual' ? vizConfig.manualEq : (EQ_PRESETS[mode] || EQ_PRESETS['flat']);
            for(let i = 0; i < eqBandNodes.length; i++) { if(eqBandNodes[i]) eqBandNodes[i].gain.value = gains[i] || 0; }
        }

        qualitySelect.addEventListener('change', (e) => { vizConfig.quality = e.target.value; resizeCanvas(); saveConfig(); });
        bgUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            e.target.value = '';
            // (3b) Chỉ chấp nhận PNG/JPG/WEBP — xem upload-validation.js. Chặn TRƯỚC khi đụng tới
            // IndexedDB/blob URL, không đổi gì khác trong luồng cũ nếu file hợp lệ.
            const check = validateImageFile(file);
            if (!check.valid) { alert(check.reason); return; }
            withLoadingShield("Đang lưu ảnh nền...", async () => {
                await setMeta('bgImage', file);
                if (vizConfig.bgImage && vizConfig.bgImage.startsWith('blob:')) URL.revokeObjectURL(vizConfig.bgImage);
                vizConfig.bgImage = URL.createObjectURL(file);
                vizConfig.bgImageEnabled = true; bgImageEnableToggle.checked = true;
                updatePlaylistBg(); saveConfig();
            });
        });
        bgImageEnableToggle.addEventListener('change', (e) => {
            vizConfig.bgImageEnabled = e.target.checked;
            withLoadingShield(vizConfig.bgImageEnabled ? "Đang xử lý..." : "Đang xóa ảnh nền...", async () => {
                if (!vizConfig.bgImageEnabled) {
                    await delMeta('bgImage');
                    if (vizConfig.bgImage && vizConfig.bgImage.startsWith('blob:')) URL.revokeObjectURL(vizConfig.bgImage);
                    vizConfig.bgImage = '';
                }
                updatePlaylistBg(); saveConfig();
            });
        });
        bgBlurSlider.addEventListener('input', (e) => { vizConfig.bgBlur = e.target.value; valBgBlurDisplay.textContent = e.target.value + 'px'; updatePlaylistBg(); saveConfig(); });
        
        bgColorPicker.addEventListener('input', (e) => { vizConfig.bgColor = e.target.value; updateDOMBackground(); saveConfig(); });
        colorModeSelect.addEventListener('change', (e) => { vizConfig.mode = e.target.value; updateColorMenuUI(); saveConfig(); });
        solidColorPicker.addEventListener('input', (e) => { vizConfig.solidColor = e.target.value; solidColorText.value = e.target.value; updateProgressBarCSS(); saveConfig(); });
        solidColorText.addEventListener('input', (e) => { if (/^#[0-9A-F]{6}$/i.test(e.target.value)) { vizConfig.solidColor = e.target.value; solidColorPicker.value = e.target.value; updateProgressBarCSS(); saveConfig(); } });
        dynColorA.addEventListener('input', (e) => { vizConfig.dynA = e.target.value; saveConfig(); }); 
        dynColorB.addEventListener('input', (e) => { vizConfig.dynB = e.target.value; updateProgressBarCSS(); saveConfig(); });
        vortexStyleSelect.addEventListener('change', (e) => { vizConfig.vortexStyle = e.target.value; updateVortexVisibility(); saveConfig(); });
        barStyleSelect.addEventListener('change', (e) => { vizConfig.barStyle = e.target.value; updateBarStyleUI(); saveConfig(); });
        rainStyleSelect.addEventListener('change', (e) => { vizConfig.rainStyle = e.target.value; resizeCanvas(); saveConfig(); });
        glassFlashToggle.addEventListener('change', (e) => { vizConfig.glassFlash = e.target.checked; saveConfig(); });
        maxHeightSlider.addEventListener('input', (e) => { vizConfig.maxH = parseInt(e.target.value); valMaxDisplay.textContent = vizConfig.maxH; saveConfig(); });
        barWidthSlider.addEventListener('input', (e) => { vizConfig.barWidth = parseInt(e.target.value); valWidthDisplay.textContent = vizConfig.barWidth; saveConfig(); });
        mirrorCountSlider.addEventListener('input', (e) => { vizConfig.mirrorBarCount = parseInt(e.target.value); valMirrorCountDisplay.textContent = vizConfig.mirrorBarCount; saveConfig(); });

        volumeSlider.addEventListener('input', (e) => { 
            vizConfig.volume = parseInt(e.target.value); valVolumeDisplay.textContent = vizConfig.volume + '%'; 
            if(masterGainNode) masterGainNode.gain.value = vizConfig.volume / 100; saveConfig();
        });
        eqSelect.addEventListener('change', (e) => { vizConfig.eqMode = e.target.value; updateEQSlidersUI(vizConfig.eqMode); applyEQPreset(vizConfig.eqMode); saveConfig(); });