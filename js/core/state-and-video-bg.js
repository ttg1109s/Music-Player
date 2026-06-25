/**
 * State playlist/subtitle bổ sung + sự kiện đổi chế độ xem playlist (grid/list) + xử lý video nền (handleVideoBackground và các listener liên quan).
 * (Trích từ file gốc, dòng 273-314 trong khối <script>)
 */

        // isSubtitlesEnabled: biến runtime dùng trực tiếp trong processSubtitles()/updateSubToggleUI()
        // (giữ tên cũ để không phải đổi khắp nơi). Giá trị khởi tạo `true` ở đây chỉ là tạm — được
        // ĐỒNG BỘ LẠI từ vizConfig.subtitlesEnabled (đã lưu) ngay trong loadConfig() (ver 8 refine,
        // xem equalizer-settings.js), nên giá trị thật sau khi trang nạp xong luôn khớp với Cài đặt.
        let subtitles = []; let isSubtitlesEnabled = true; let activeSubIds = new Set(); let editingSubId = null;
        let currentCalculatedBpm = "---";

        let isShuffle = false, shuffleIndices = [], repeatMode = 0;
        window.currentMediaSessionCover = null; window.lastValidNoteStr = null; window.lastValidNoteTime = 0; window.lastValidMidiNote = null;

        btnToggleView.addEventListener('click', () => {
            isGridView = !isGridView;
            if (isGridView) {
                iconGridView.classList.add('hidden'); iconListView.classList.remove('hidden');
                playlistContainer.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-6 px-5 pb-32';
            } else {
                iconGridView.classList.remove('hidden'); iconListView.classList.add('hidden');
                playlistContainer.className = 'flex flex-col pb-32';
            }
            renderPlaylistFull(); // layout grid/list khác cấu trúc node hoàn toàn -> vẽ lại từ đầu, không diff
        });

        btnReturnVisual.addEventListener('click', () => { if(currentKey) switchToVisualizer(); });

        // ===================== "Control Center" của màn Visualizer (ver 8 refine) =====================
        // Thay cho dải dọc 6 nút cũ — 1 nút mở ở góc trái, panel grid icon trượt từ trên xuống full
        // chiều rộng (kiểu Control Center điện thoại). Đóng bằng 3 cách: bấm lại nút mở, bấm overlay
        // mờ phía dưới panel, hoặc bấm 1 icon bên trong grid (data-cc-action — tự đóng sau khi chọn,
        // vì hành động đó thường là điểm kết của tương tác, ví dụ đổi hiệu ứng/mở Settings).
        function openControlCenter() {
            visualizerControlCenter.classList.remove('-translate-y-full');
            controlCenterOverlay.classList.remove('hidden');
            iconControlCenterDown.classList.add('rotate-180');
        }
        function closeControlCenter() {
            visualizerControlCenter.classList.add('-translate-y-full');
            controlCenterOverlay.classList.add('hidden');
            iconControlCenterDown.classList.remove('rotate-180');
        }
        btnOpenControlCenter.addEventListener('click', () => {
            const isOpen = !visualizerControlCenter.classList.contains('-translate-y-full');
            if (isOpen) closeControlCenter(); else openControlCenter();
        });
        controlCenterOverlay.addEventListener('click', closeControlCenter);
        // Bấm bất kỳ icon nào trong grid (data-cc-action) -> đóng panel ngay (không đợi animation
        // của hành động đó, ví dụ chuyển màn Settings) để không che mất phần UI vừa mở ra.
        visualizerControlCenter.addEventListener('click', (e) => {
            if (e.target.closest('[data-cc-action]')) closeControlCenter();
        });

        // Khi đóng drawer Cài đặt: nếu người dùng đã bật "Sử dụng Video Background" nhưng CHƯA
        // chọn video nào (vizConfig.videoBgUrl rỗng) thì tự tắt lại — tránh trạng thái "on" ảo
        // không có video thật phía sau. "Tắt Visual" (ver 8 refine) KHÔNG còn phụ thuộc video bg
        // nên không tắt theo nữa.
        function validateVideoBgOnClose() {
            if (vizConfig.videoBgEnabled && !vizConfig.videoBgUrl) {
                vizConfig.videoBgEnabled = false;
                videoEnableToggle.checked = false;
                handleVideoBackground(); saveConfig();
            }
        }

        // URL đã thực sự nạp xong + fade vào <video>. Dùng để KHÔNG fade lại khi Next/Prev:
        // cú "nền đen -> hiện video" chỉ xảy ra MỘT LẦN cho mỗi URL video, lúc nạp lần đầu.
        let _videoBgLoadedUrl = null;

        /**
         * Chỉ lo NGUỒN video + fade-in MỘT LẦN cho mỗi URL. Gọi khi cấu hình video đổi
         * (bật/tắt, upload, nạp lại lúc mở trang) — KHÔNG gọi mỗi lần chuyển bài.
         */
        function setupVideoBgSource() {
            // Đã đúng URL và đã fade xong rồi -> không làm gì (tránh fade lặp lại khi Next/Prev).
            if (bgVideoElement.getAttribute('src') === vizConfig.videoBgUrl && _videoBgLoadedUrl === vizConfig.videoBgUrl) return;
            _videoBgLoadedUrl = null;
            bgVideoElement.style.opacity = '0'; // ẩn cho tới khi có khung hình thật -> không chớp trắng
            bgVideoElement.src = vizConfig.videoBgUrl;
            const fadeVideoIn = () => { bgVideoElement.style.opacity = '1'; _videoBgLoadedUrl = vizConfig.videoBgUrl; };
            bgVideoElement.addEventListener('loadeddata', fadeVideoIn, { once: true });
            bgVideoElement.addEventListener('playing', fadeVideoIn, { once: true });
        }

        /**
         * CHỈ đồng bộ play/pause của video theo nhạc — KHÔNG đụng src/opacity/fade.
         * Đây là hàm được gọi mỗi lần nhạc play/pause hoặc Next/Prev, nên KHÔNG được
         * gây ra cú "nền đen rồi fade video" lần nữa.
         */
        function syncVideoBgToAudio() {
            if (!(vizConfig.videoBgEnabled && vizConfig.videoBgUrl)) return;
            if (!audioPlayer.paused) { bgVideoElement.play().catch(() => {}); } else { bgVideoElement.pause(); }
        }

        function handleVideoBackground() {
            // QUY TẮC v6 (đã sửa):
            //  - Video nền BẬT/TẮT chỉ phụ thuộc cấu hình + trạng thái NHẠC, KHÔNG phụ thuộc đang ở
            //    màn Playlist hay Visualizer.
            //  - NGUỒN + fade chỉ thiết lập MỘT LẦN cho mỗi URL (setupVideoBgSource). Next/Prev chỉ
            //    gọi syncVideoBgToAudio() (xem player-controls.js) nên KHÔNG fade lại nữa.
            //  - Nền đen cưỡng chế phía sau video.
            if (vizConfig.videoBgEnabled && vizConfig.videoBgUrl) {
                document.body.style.backgroundColor = '#000000'; // nền đen cưỡng chế sau video
                bgVideoElement.classList.remove('hidden');
                setupVideoBgSource(); // nạp nguồn + fade nếu là URL mới; no-op nếu đã sẵn sàng
                if (_videoBgLoadedUrl === vizConfig.videoBgUrl) bgVideoElement.style.opacity = '1'; // đã sẵn sàng -> hiện ngay
                syncVideoBgToAudio();
            } else {
                bgVideoElement.style.opacity = '0';
                bgVideoElement.pause();
                _videoBgLoadedUrl = null;
                setTimeout(() => {
                    if (!vizConfig.videoBgEnabled) { bgVideoElement.classList.add('hidden'); bgVideoElement.removeAttribute('src'); bgVideoElement.src = ''; }
                }, 500);
                updateDOMBackground();
            }
        }

        videoEnableToggle.addEventListener('change', (e) => {
            vizConfig.videoBgEnabled = e.target.checked;
            if (!vizConfig.videoBgEnabled) {
                withLoadingShield("Đang xóa video nền...", async () => {
                    await delMeta('videoBg');
                    if (vizConfig.videoBgUrl && vizConfig.videoBgUrl.startsWith('blob:')) URL.revokeObjectURL(vizConfig.videoBgUrl);
                    vizConfig.videoBgUrl = '';
                    handleVideoBackground(); saveConfig();
                });
            } else { handleVideoBackground(); saveConfig(); }
        });
        // Toggle "Tắt Visual" (ver 8 refine) — ĐỘC LẬP khỏi video nền, không còn nằm trong khối
        // cài đặt Video Background nữa (xem js/components/settings/playlist-background.js, mục
        // "Hiệu ứng Visualizer" riêng). Đổi vizConfig.visualEnabled rồi lưu — vòng lặp vẽ chính
        // (draw-visualizer.js) tự đọc field này mỗi khung hình, không cần gọi thêm hàm nào ở đây.
        // Nền hiển thị khi tắt visual tự đúng theo setting đã chọn vì handleVideoBackground()/
        // updateDOMBackground() vốn không phụ thuộc field này — chúng vẫn chạy độc lập như cũ.
        if (typeof visualEnabledToggle !== 'undefined' && visualEnabledToggle) {
            visualEnabledToggle.addEventListener('change', (e) => {
                vizConfig.visualEnabled = e.target.checked;
                saveConfig();
            });
        }
        videoUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            e.target.value = '';
            // (3c) Chỉ chấp nhận định dạng video phổ biến (mp4/webm/ogg/mov) — xem
            // upload-validation.js. Chặn TRƯỚC khi đụng tới IndexedDB/blob URL.
            const check = validateVideoFile(file);
            if (!check.valid) { alert(check.reason); return; }
            withLoadingShield("Đang lưu video nền...", async () => {
                await setMeta('videoBg', file);
                if (vizConfig.videoBgUrl && vizConfig.videoBgUrl.startsWith('blob:')) URL.revokeObjectURL(vizConfig.videoBgUrl);
                vizConfig.videoBgUrl = URL.createObjectURL(file);
                vizConfig.videoBgEnabled = true; videoEnableToggle.checked = true;
                handleVideoBackground(); saveConfig();
            });
        });