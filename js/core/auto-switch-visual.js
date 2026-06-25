/**
 * Tự động đổi hiệu ứng Visualizer theo thời gian (ver 10).
 *
 * KIẾN TRÚC (mốc TUYỆT ĐỐI theo audioPlayer.currentTime — KHÔNG dùng timer đếm lùi độc lập):
 *
 *   Vấn đề với cách đếm lùi (setTimeout/Loop đếm ms riêng, độc lập với currentTime thật):
 *     1. Pause/resume timer riêng dễ lệch nếu không quản lý cẩn thận.
 *     2. NGHIÊM TRỌNG HƠN: nếu người dùng TUA (seek) lùi/tiến tay trên thanh tiến trình, currentTime
 *        nhảy nhưng timer đếm lùi không biết gì — vẫn đếm theo nhịp cũ, hoàn toàn không đồng bộ với
 *        vị trí thật của bài hát.
 *     3. Nếu seek LÙI về 1 đoạn đã từng đổi hiệu ứng rồi (ví dụ đang ở giây 200 với visual B, tua
 *        lùi về giây 50 — nơi trước đó đã đổi sang visual A) — nếu hệ thống chỉ biết "đã qua mốc
 *        này, đổi tiếp" một cách vô điều kiện, nó sẽ ngẫu nhiên/tuần tự sang 1 visual MỚI, không
 *        phải lại đúng visual A đã gán cho đoạn đó — gây cảm giác ngẫu nhiên, không nhất quán.
 *
 *   GIẢI PHÁP — 2 phần:
 *     (a) Mốc TUYỆT ĐỐI: build trước 1 mảng `marks = [{time, visual}, ...]` cho bài đang phát,
 *         time là giây TUYỆT ĐỐI tính từ đầu bài (0, 45, 90, ...) — không phải khoảng cách tương
 *         đối. 1 task qua taskManager (tick mỗi 1s, pause/resume theo đúng audioPlayer play/pause
 *         — KHÔNG cần lo lệch nhịp vì mỗi tick đọc THẲNG audioPlayer.currentTime hiện tại, dù giá
 *         trị đó nhảy do play tự nhiên HAY do seek tay, tick kế tiếp luôn đọc đúng giá trị mới).
 *     (b) Mỗi mark TỰ NHỚ visual của riêng nó: mark.visual khởi tạo `null`. Lần ĐẦU TIÊN currentTime
 *         rơi vào đoạn của 1 mark (mark.visual còn null) -> chọn visual MỚI (theo mode tuần tự/
 *         ngẫu nhiên), gán vào mark.visual, áp dụng. Mọi lần SAU đó rơi lại đúng đoạn này (dù đi
 *         tới tự nhiên lần 2 lúc lặp lại bài, hay do TUA/seek lùi về) -> mark.visual ĐÃ CÓ GIÁ TRỊ,
 *         chỉ áp dụng LẠI đúng giá trị cũ, KHÔNG chọn mới — đúng yêu cầu "nhớ lại visual đã gán
 *         cho mốc đó", tua qua tua lại vẫn nhất quán.
 *
 * 2 mode ĐỔI (vizConfig.autoSwitchVisualMode, chỉ ảnh hưởng lúc CHỌN MỚI — không ảnh hưởng mark
 * đã có giá trị):
 *   - 'sequential': đi đúng thứ tự MODES (giống #btn-cycle-mode).
 *   - 'random'     : chọn 1 kiểu KHÁC kiểu hiện tại.
 *
 * 3 mode TÍNH KHOẢNG CÁCH GIỮA CÁC MỐC khi BUILD mảng marks (vizConfig.autoSwitchVisualTimeMode):
 *   - 'fixed'   (c1): cách đều vizConfig.autoSwitchVisualSeconds (người điền, validate min 10s).
 *   - 'random'  (c2): mỗi đoạn cách nhau ngẫu nhiên trong [10, autoSwitchVisualSeconds] — random
 *                     MỘT LẦN lúc build (không random lại giữa chừng nữa — khác bản thiết kế đếm
 *                     lùi trước đây — vì giờ mảng marks cố định ngay khi bài bắt đầu, đảm bảo seek
 *                     qua lại vẫn thấy đúng cùng 1 bộ mốc, không bị "build lại ngẫu nhiên" mỗi lần).
 *   - 'duration'(c3): HARDCODE chia 10 — đúng 10 mốc/bài, KHÔNG phụ thuộc autoSwitchVisualSeconds,
 *                     người dùng không điền/can thiệp được gì.
 *
 * Build lại marks (kill task + buildMarksForCurrentSong() lại) khi: đổi bài (loadedmetadata, vì
 * duration mới khác hẳn), hoặc đổi autoSwitchVisualTimeMode/autoSwitchVisualSeconds (đổi CÁCH
 * TÍNH khoảng cách thì áp dụng lại từ đầu cho hợp lý, không cố giữ marks cũ lệch chuẩn mới).
 *
 * PHẢI nạp SAU: config.js (AUTO_SWITCH_VISUAL_MIN_SECONDS, MODES), dom-refs.js (currentModeIndex,
 * audioPlayer), task-manager.js (taskManager), player-controls.js (updateTypeUI, saveConfig) —
 * xem index.html.
 */
        const AUTO_SWITCH_VISUAL_TASK = 'autoSwitchVisual';

        /** Mảng mốc của BÀI ĐANG PHÁT hiện tại — [{ time: giây tuyệt đối, visual: 'bar'|null }, ...]. */
        let autoSwitchVisualMarks = [];

        /** Build mảng mốc MỚI cho bài đang phát — gọi lúc đổi bài hoặc đổi setting ảnh hưởng cách tính. */
        function buildAutoSwitchVisualMarks() {
            const duration = (typeof audioPlayer !== 'undefined' && isFinite(audioPlayer.duration) && audioPlayer.duration > 0)
                ? audioPlayer.duration : 0;
            // Mark ĐẦU TIÊN (t=0) GIỮ NGUYÊN kiểu đang chọn hiện tại — KHÔNG coi là "1 lần đổi".
            // Người dùng vừa mới bắt đầu nghe/tới mở Visualizer, chưa có lý do gì để auto-switch
            // nhảy hiệu ứng NGAY GIÂY ĐẦU TIÊN trước khi mốc thời gian thật nào trôi qua — đúng
            // tinh thần "đổi SAU MỖI khoảng X giây", không phải "đổi ngay khi bắt đầu phát".
            const marks = [{ time: 0, visual: MODES[currentModeIndex] }];
            if (duration <= 0) { autoSwitchVisualMarks = marks; return; } // chưa có duration hợp lệ -> chỉ 1 mốc, không đổi gì cho tới khi build lại

            const mode = vizConfig.autoSwitchVisualTimeMode;
            if (mode === 'duration') {
                // (c3) HARDCODE chia 10 — đúng 10 mốc/bài (mốc 0 + 9 mốc tiếp theo cách đều
                // duration/10), KHÔNG phụ thuộc autoSwitchVisualSeconds.
                const step = Math.max(AUTO_SWITCH_VISUAL_MIN_SECONDS, duration / 10);
                let t = step;
                while (t < duration) { marks.push({ time: t, visual: null }); t += step; }
            } else if (mode === 'random') {
                // (c2) Mỗi đoạn cách nhau ngẫu nhiên trong [10, autoSwitchVisualSeconds] — random
                // MỘT LẦN lúc build này, KHÔNG random lại giữa chừng (xem giải thích ở đầu file).
                const maxSeconds = Math.max(AUTO_SWITCH_VISUAL_MIN_SECONDS, vizConfig.autoSwitchVisualSeconds);
                let t = AUTO_SWITCH_VISUAL_MIN_SECONDS + Math.random() * (maxSeconds - AUTO_SWITCH_VISUAL_MIN_SECONDS);
                while (t < duration) {
                    marks.push({ time: t, visual: null });
                    t += AUTO_SWITCH_VISUAL_MIN_SECONDS + Math.random() * (maxSeconds - AUTO_SWITCH_VISUAL_MIN_SECONDS);
                }
            } else {
                // (c1) 'fixed' — cách đều autoSwitchVisualSeconds (validate lại min phòng giá trị hỏng).
                const step = Math.max(AUTO_SWITCH_VISUAL_MIN_SECONDS, vizConfig.autoSwitchVisualSeconds);
                let t = step;
                while (t < duration) { marks.push({ time: t, visual: null }); t += step; }
            }
            autoSwitchVisualMarks = marks;
        }

        /** Chọn 1 giá trị MODES MỚI theo đúng autoSwitchVisualMode hiện tại (KHÔNG tự áp dụng/lưu gì cả). */
        function pickNextAutoSwitchVisualType() {
            if (vizConfig.autoSwitchVisualMode === 'random' && MODES.length > 1) {
                let idx = currentModeIndex;
                while (idx === currentModeIndex) idx = Math.floor(Math.random() * MODES.length);
                return MODES[idx];
            }
            return MODES[(currentModeIndex + 1) % MODES.length]; // 'sequential' — đúng cơ chế #btn-cycle-mode
        }

        /** Áp dụng 1 kiểu hiệu ứng cụ thể (đã biết trước, KHÔNG tự chọn) — dùng khi mark đã có visual sẵn. */
        function applyAutoSwitchVisualType(type) {
            const idx = MODES.indexOf(type);
            if (idx === -1 || idx === currentModeIndex) return; // type lạ hoặc đã đúng kiểu hiện tại -> không làm gì
            currentModeIndex = idx;
            updateTypeUI();
            saveConfig();
        }

        /**
         * Tick định kỳ (mỗi 1s, qua taskManager) — đọc THẲNG audioPlayer.currentTime hiện tại
         * (đúng dù nhạc tự trôi tự nhiên hay người dùng vừa seek tay), tìm mark mà currentTime
         * đang thuộc vào, áp dụng ĐÚNG quy tắc "nhớ visual theo mốc" (xem giải thích đầu file).
         */
        function autoSwitchVisualTick() {
            if (typeof audioPlayer === 'undefined' || autoSwitchVisualMarks.length === 0) return;
            const t = audioPlayer.currentTime;

            // Tìm mark CUỐI CÙNG có time <= t (mark mà currentTime đang thuộc đoạn của nó). Nếu t
            // đã vượt qua mark cuối cùng trong mảng, idx tự nhiên DỪNG LẠI ở chính mark cuối đó —
            // KHÔNG cần code riêng để "stop đổi visual sau mark cuối": vì không có mark nào sau nó
            // trong mảng, applyAutoSwitchVisualType() ở dưới sẽ chỉ áp dụng LẠI đúng visual đã gán
            // cho mark cuối (mark.visual đã có giá trị từ lần đầu đi qua nó), không bao giờ "nhảy
            // tiếp" sang visual nào khác nữa cho tới khi marks được build lại (đổi bài/đổi setting).
            let idx = 0;
            for (let i = 0; i < autoSwitchVisualMarks.length; i++) {
                if (autoSwitchVisualMarks[i].time <= t) idx = i; else break;
            }

            const mark = autoSwitchVisualMarks[idx];
            if (mark.visual === null) {
                // Lần ĐẦU TIÊN đi qua đoạn này -> chọn visual MỚI, GHI NHỚ vào chính mark đó.
                const type = pickNextAutoSwitchVisualType();
                mark.visual = type;
                applyAutoSwitchVisualType(type);
            } else {
                // Đã từng đi qua đoạn này rồi (kể cả do tua/seek lùi về) -> áp dụng LẠI đúng giá
                // trị đã nhớ, KHÔNG chọn mới — đúng yêu cầu nhất quán khi tua qua tua lại.
                applyAutoSwitchVisualType(mark.visual);
            }
        }

        /** Bắt đầu/dừng hẳn task tick — gọi lúc bật/tắt tính năng hoặc build lại marks cho bài mới. */
        function startOrStopAutoSwitchVisualTask() {
            const shouldRun = vizConfig.autoSwitchVisualEnabled && currentKey;
            if (!shouldRun) { taskManager.kill(AUTO_SWITCH_VISUAL_TASK); return; }
            taskManager.kill(AUTO_SWITCH_VISUAL_TASK); // luôn bắt đầu sạch — marks vừa build lại nên task cũ (nếu có) không còn hợp lệ
            taskManager.addNew(AUTO_SWITCH_VISUAL_TASK, { time: 1000, exe: autoSwitchVisualTick, mode: 'timeout', count: 0 });
            taskManager.operator(AUTO_SWITCH_VISUAL_TASK, 'enabled');
            if (typeof audioPlayer !== 'undefined' && audioPlayer.paused) taskManager.pause(AUTO_SWITCH_VISUAL_TASK); // bắt đầu nhưng nhạc đang pause -> pause luôn task theo đúng trạng thái thật
        }

        /**
         * Gọi khi BÀI ĐANG PHÁT THAY ĐỔI (loadedmetadata — đã có audioPlayer.duration mới chính
         * xác) — build lại TOÀN BỘ marks cho bài mới rồi khởi động lại task. An toàn để gọi cả
         * khi tính năng đang tắt (startOrStopAutoSwitchVisualTask() tự no-op qua shouldRun).
         */
        function onAutoSwitchVisualSongChanged() {
            buildAutoSwitchVisualMarks();
            startOrStopAutoSwitchVisualTask();
        }

        /**
         * Gọi lúc nhạc play/pause (player-controls.js, trong listener đã có sẵn) — CHỈ pause/resume
         * task tick theo đúng audioPlayer play/pause, KHÔNG đụng tới marks (marks thuộc về BÀI,
         * không thuộc về 1 lượt play/pause — pause rồi play lại CÙNG bài phải giữ nguyên marks đã
         * build, không build lại).
         */
        function syncAutoSwitchVisualPlayState() {
            if (!vizConfig.autoSwitchVisualEnabled || !currentKey) { taskManager.kill(AUTO_SWITCH_VISUAL_TASK); return; }
            if (!taskManager.isTaskRunning(AUTO_SWITCH_VISUAL_TASK)) { startOrStopAutoSwitchVisualTask(); return; }
            if (typeof audioPlayer !== 'undefined' && audioPlayer.paused) taskManager.pause(AUTO_SWITCH_VISUAL_TASK);
            else taskManager.resume(AUTO_SWITCH_VISUAL_TASK);
        }

        // ===================== UI binding (Settings, section "Tự động đổi hiệu ứng") =====================

        /**
         * Đồng bộ TOÀN BỘ UI auto-switch-visual theo vizConfig hiện tại + gắn listener (idempotent
         * — addEventListener trùng lặp do gọi initAutoSwitchVisualUI() nhiều lần, ví dụ mỗi lần
         * loadConfig() chạy lại, sẽ KHÔNG xảy ra vì hàm này chỉ gắn listener ĐÚNG 1 LẦN nhờ cờ
         * _autoSwitchVisualUiBound — các lần gọi sau chỉ làm việc đồng bộ giá trị hiển thị).
         */
        let _autoSwitchVisualUiBound = false;
        function initAutoSwitchVisualUI() {
            const elEnable = document.getElementById('setting-auto-switch-enable');
            const elOptions = document.getElementById('auto-switch-options');
            const elMode = document.getElementById('setting-auto-switch-mode');
            const elTimeMode = document.getElementById('setting-auto-switch-time-mode');
            const elBlockFixed = document.getElementById('auto-switch-time-fixed-block');
            const elBlockRandom = document.getElementById('auto-switch-time-random-block');
            const elBlockDuration = document.getElementById('auto-switch-time-duration-block');
            const elSecondsFixed = document.getElementById('setting-auto-switch-seconds-fixed');
            const elSecondsRandom = document.getElementById('setting-auto-switch-seconds-random');
            if (!elEnable || !elOptions || !elMode || !elTimeMode) return; // DOM chưa sẵn sàng — an toàn bỏ qua

            /** Hiện ĐÚNG 1 trong 3 khối input theo elTimeMode.value, ẩn 2 khối còn lại. */
            const syncTimeModeBlocks = () => {
                const tm = elTimeMode.value;
                elBlockFixed.classList.toggle('hidden', tm !== 'fixed');
                elBlockRandom.classList.toggle('hidden', tm !== 'random');
                elBlockDuration.classList.toggle('hidden', tm !== 'duration');
            };

            // ---- Đồng bộ giá trị hiển thị theo vizConfig hiện tại (gọi lại mỗi lần loadConfig()) ----
            elEnable.checked = vizConfig.autoSwitchVisualEnabled === true;
            elOptions.classList.toggle('hidden', !elEnable.checked);
            elMode.value = vizConfig.autoSwitchVisualMode;
            elTimeMode.value = vizConfig.autoSwitchVisualTimeMode;
            if (elSecondsFixed) elSecondsFixed.value = vizConfig.autoSwitchVisualSeconds;
            if (elSecondsRandom) elSecondsRandom.value = vizConfig.autoSwitchVisualSeconds;
            syncTimeModeBlocks();

            if (_autoSwitchVisualUiBound) return; // listener đã gắn ở lượt init() đầu tiên — không gắn lại
            _autoSwitchVisualUiBound = true;

            elEnable.addEventListener('change', (e) => {
                vizConfig.autoSwitchVisualEnabled = e.target.checked;
                elOptions.classList.toggle('hidden', !e.target.checked);
                saveConfig();
                if (e.target.checked) onAutoSwitchVisualSongChanged(); // bật lên -> build marks mới + chạy ngay cho bài đang phát
                else taskManager.kill(AUTO_SWITCH_VISUAL_TASK);
            });

            elMode.addEventListener('change', (e) => {
                vizConfig.autoSwitchVisualMode = e.target.value;
                saveConfig();
                // KHÔNG build lại marks — đổi cách CHỌN MỚI không ảnh hưởng marks đã có giá trị
                // (mark.visual !== null) lẫn mốc TIME đã định — chỉ ảnh hưởng lần CHỌN MỚI kế tiếp.
            });

            elTimeMode.addEventListener('change', (e) => {
                vizConfig.autoSwitchVisualTimeMode = e.target.value;
                syncTimeModeBlocks();
                saveConfig();
                onAutoSwitchVisualSongChanged(); // đổi CÁCH TÍNH khoảng cách -> build lại marks từ đầu cho hợp lý
            });

            const onSecondsInput = (e) => {
                let v = parseInt(e.target.value, 10);
                if (!Number.isFinite(v) || v < AUTO_SWITCH_VISUAL_MIN_SECONDS) v = AUTO_SWITCH_VISUAL_MIN_SECONDS;
                e.target.value = v;
                vizConfig.autoSwitchVisualSeconds = v;
                saveConfig();
                onAutoSwitchVisualSongChanged(); // đổi số giây -> build lại marks từ đầu
            };
            if (elSecondsFixed) elSecondsFixed.addEventListener('change', onSecondsInput);
            if (elSecondsRandom) elSecondsRandom.addEventListener('change', onSecondsInput);
        }

        // ===================== Liên kết với trạng thái phát nhạc =====================
        // KHÔNG thêm listener 'play'/'pause'/'loadedmetadata' MỚI ở đây (tránh rải listener cho
        // cùng 1 <audio> element ở nhiều file, khó theo dõi thứ tự chạy) — player-controls.js (nơi
        // đã có sẵn các listener đó) sẽ gọi syncAutoSwitchVisualPlayState()/onAutoSwitchVisualSongChanged()
        // trực tiếp trong chính các listener đó. Xem player-controls.js.
