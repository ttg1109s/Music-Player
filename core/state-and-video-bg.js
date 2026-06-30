/**
 * State playlist/subtitle bổ sung + xử lý video nền (handleVideoBackground và các hàm liên quan).
 *
 * ÁP DỤNG /event/ (cụm "visualizerControlCenter"): `addEventListener` cũ của btnReturnVisual/
 * btnOpenControlCenter/controlCenterOverlay/visualizerControlCenter/videoEnableToggle/
 * visualEnabledToggle/videoUploadInput đã CHUYỂN sang event/listener/visualizer-control-center.js.
 * 2 nhánh cần shield/modal (đổi videoEnableToggle, upload video) đặt ở
 * event/workflow/visualizer-control-center.js — core không biết withLoadingShield/alertModal tồn
 * tại. `bgVideoElement.addEventListener('loadeddata'/'playing', fadeVideoIn, {once:true})` GIỮ
 * NGUYÊN ở setupVideoBgSource() — đây là listener nội bộ tự gỡ sau 1 lần (mục 2b.6), KHÔNG thuộc
 * `/event/`.
 */

        // isSubtitlesEnabled: biến runtime dùng trực tiếp trong processSubtitles()/updateSubToggleUI()
        // (giữ tên cũ để không phải đổi khắp nơi). Giá trị khởi tạo `true` ở đây chỉ là tạm — được
        // ĐỒNG BỘ LẠI từ vizConfig.subtitlesEnabled (đã lưu) ngay trong loadConfig() (ver 8 refine,
        // xem equalizer-settings.js), nên giá trị thật sau khi trang nạp xong luôn khớp với Cài đặt.
        let subtitles = []; let isSubtitlesEnabled = true; let activeSubIds = new Set(); let editingSubId = null;
        let currentCalculatedBpm = "---";

        let isShuffle = false, shuffleIndices = [], repeatMode = 0;
        window.currentMediaSessionCover = null; window.lastValidNoteStr = null; window.lastValidNoteTime = 0; window.lastValidMidiNote = null;

        /** Core thuần: quay về màn Visualizer (nếu đang có bài hiện tại). */
        function returnToVisualizer() {
            if (appState.get('currentKey')) switchToVisualizer();
        }

        // ===================== "Control Center" của màn Visualizer (ver 8 refine) =====================
        // 1 nút mở ở góc trái, panel grid icon PHÓNG RA TỪ TRUNG TÂM (scale từ vị trí nút bấm).
        // Đóng bằng 3 cách: bấm lại nút mở, bấm overlay mờ phía dưới panel, hoặc bấm 1 icon bên
        // trong grid (data-cc-action — tự đóng sau khi chọn).
        function openControlCenter() {
            visualizerControlCenter.classList.remove('scale-0', 'opacity-0');
            controlCenterOverlay.classList.remove('hidden');
            iconControlCenterDown.classList.add('rotate-180');
        }
        function closeControlCenter() {
            visualizerControlCenter.classList.add('scale-0', 'opacity-0');
            controlCenterOverlay.classList.add('hidden');
            iconControlCenterDown.classList.remove('rotate-180');
        }
        /** Core thuần: toggle mở/đóng Control Center theo trạng thái hiện tại. */
        function toggleControlCenter() {
            const isOpen = !visualizerControlCenter.classList.contains('scale-0');
            if (isOpen) closeControlCenter(); else openControlCenter();
        }
        /** Core thuần: bấm icon trong grid (data-cc-action) -> đóng panel ngay, không đợi animation. */
        function handleControlCenterGridClick(target) {
            if (target.closest('[data-cc-action]')) closeControlCenter();
        }

        // Khi đóng drawer Cài đặt: nếu người dùng đã bật "Sử dụng Video Background" nhưng CHƯA
        // chọn video nào (vizConfig.videoBgUrl rỗng) thì tự tắt lại — tránh trạng thái "on" ảo
        // không có video thật phía sau. "Tắt Visual" (ver 8 refine) KHÔNG còn phụ thuộc video bg
        // nên không tắt theo nữa.
        function validateVideoBgOnClose() {
            const cfg = appState.get('vizConfig');
            if (cfg.videoBgEnabled && !cfg.videoBgUrl) {
                appState.mutate('vizConfig', c => { c.videoBgEnabled = false; });
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
            const videoBgUrl = appState.get('vizConfig').videoBgUrl;
            // Đã đúng URL và đã fade xong rồi -> không làm gì (tránh fade lặp lại khi Next/Prev).
            if (bgVideoElement.getAttribute('src') === videoBgUrl && appState.get('_videoBgLoadedUrl') === videoBgUrl) return;
            appState.set('_videoBgLoadedUrl', null);
            bgVideoElement.style.opacity = '0'; // ẩn cho tới khi có khung hình thật -> không chớp trắng
            bgVideoElement.src = videoBgUrl;
            const fadeVideoIn = () => { bgVideoElement.style.opacity = '1'; appState.set('_videoBgLoadedUrl', appState.get('vizConfig').videoBgUrl); };
            // Listener NỘI BỘ tự gỡ sau 1 lần (mục 2b.6) — KHÔNG thuộc /event/.
            bgVideoElement.addEventListener('loadeddata', fadeVideoIn, { once: true });
            bgVideoElement.addEventListener('playing', fadeVideoIn, { once: true });
        }

        /**
         * CHỈ đồng bộ play/pause của video theo nhạc — KHÔNG đụng src/opacity/fade.
         * Đây là hàm được gọi mỗi lần nhạc play/pause hoặc Next/Prev, nên KHÔNG được
         * gây ra cú "nền đen rồi fade video" lần nữa.
         */
        function syncVideoBgToAudio() {
            const cfg = appState.get('vizConfig');
            if (!(cfg.videoBgEnabled && cfg.videoBgUrl)) return;
            if (!audioPlayer.paused) { bgVideoElement.play().catch(() => {}); } else { bgVideoElement.pause(); }
        }

        function handleVideoBackground() {
            // QUY TẮC v6 (đã sửa):
            //  - Video nền BẬT/TẮT chỉ phụ thuộc cấu hình + trạng thái NHẠC, KHÔNG phụ thuộc đang ở
            //    màn Playlist hay Visualizer.
            //  - NGUỒN + fade chỉ thiết lập MỘT LẦN cho mỗi URL (setupVideoBgSource). Next/Prev chỉ
            //    gọi syncVideoBgToAudio() (xem player-controls.js) nên KHÔNG fade lại nữa.
            //  - Nền đen cưỡng chế phía sau video.
            const cfg = appState.get('vizConfig');
            if (cfg.videoBgEnabled && cfg.videoBgUrl) {
                document.body.style.backgroundColor = '#000000'; // nền đen cưỡng chế sau video
                bgVideoElement.classList.remove('hidden');
                setupVideoBgSource(); // nạp nguồn + fade nếu là URL mới; no-op nếu đã sẵn sàng
                if (appState.get('_videoBgLoadedUrl') === cfg.videoBgUrl) bgVideoElement.style.opacity = '1'; // đã sẵn sàng -> hiện ngay
                syncVideoBgToAudio();
            } else {
                bgVideoElement.style.opacity = '0';
                bgVideoElement.pause();
                appState.set('_videoBgLoadedUrl', null);
                taskManager.once(() => {
                    if (!appState.get('vizConfig').videoBgEnabled) { bgVideoElement.classList.add('hidden'); bgVideoElement.removeAttribute('src'); bgVideoElement.src = ''; }
                }, 500, 'hideVideoBgAfterFade');
                updateDOMBackground();
            }
        }

        /** Core thuần: thực thi BẬT video nền (đã biết chắc videoBgUrl đã có sẵn từ trước). */
        function enableVideoBackground() {
            appState.mutate('vizConfig', cfg => { cfg.videoBgEnabled = true; });
            handleVideoBackground(); saveConfig();
        }

        /** Core thuần: thực thi TẮT video nền + xoá blob/meta đã lưu (phần KHÔNG cần shield —
         *  shield bọc quanh phần xoá IndexedDB ở workflow, core chỉ làm phần đồng bộ state/UI). */
        function disableVideoBackgroundState() {
            appState.mutate('vizConfig', cfg => {
                cfg.videoBgEnabled = false;
                if (cfg.videoBgUrl && cfg.videoBgUrl.startsWith('blob:')) URL.revokeObjectURL(cfg.videoBgUrl);
                cfg.videoBgUrl = '';
            });
            handleVideoBackground(); saveConfig();
        }

        /** Core thuần: ứng với toggle "Tắt Visual" — độc lập hoàn toàn khỏi video nền. */
        function setVisualEnabled(checked) {
            appState.mutate('vizConfig', cfg => { cfg.visualEnabled = checked; });
            saveConfig();
        }

        /** Core thuần: lưu blob video mới vào IndexedDB + áp dụng làm video nền hiện tại (phần
         *  KHÔNG cần shield — shield bọc quanh lệnh setMeta() ở workflow). Trả {status} rõ ràng,
         *  KHÔNG tự alertModal (đặt ở workflow). */
        function applyUploadedVideoBg(file) {
            const check = validateVideoFile(file);
            if (!check.valid) return { status: 'invalid', reason: check.reason };
            appState.mutate('vizConfig', cfg => {
                if (cfg.videoBgUrl && cfg.videoBgUrl.startsWith('blob:')) URL.revokeObjectURL(cfg.videoBgUrl);
                cfg.videoBgUrl = URL.createObjectURL(file);
                cfg.videoBgEnabled = true;
            });
            videoEnableToggle.checked = true;
            handleVideoBackground(); saveConfig();
            return { status: 'ok' };
        }