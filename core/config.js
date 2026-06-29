/**
 * Hằng số cấu hình toàn cục: APP_CONFIG, PERFORMANCE_PROFILES, danh sách EQ, MODES, DEFAULT_VIZ_CONFIG.
 * (Trích từ file gốc, dòng 1-25 trong khối <script>)
 */
        // FIX (ver 8 refine #2 — yêu cầu "đặt console.log/alert nếu có lỗi"): bắt TOÀN BỘ lỗi
        // runtime không được try/catch ở bất kỳ đâu khác trong app — kể cả lỗi xảy ra ngay lúc
        // nạp script (ví dụ 1 phần tử DOM bị thiếu id khiến dom-refs.js trả về null, rồi 1 file
        // core/playlist nào đó gọi .addEventListener trên null) — những lỗi NHƯ VẬY trước đây làm
        // TOÀN BỘ script phía sau dừng nạp HOÀN TOÀN và im lặng (không alert, không log gì hiện ra
        // màn hình), đúng kiểu "không tải được file/thư mục" mà người dùng gặp (mọi tính năng phía
        // sau điểm lỗi, kể cả nạp nhạc, ngừng hoạt động mà không có dấu hiệu gì). Đặt SỚM NHẤT có
        // thể (đầu file core đầu tiên, NGAY SAU components/main.js) để bắt được lỗi của chính các
        // file core/playlist/visualizer nạp SAU nó. Chỉ alert 1 LẦN DUY NHẤT (qua cờ `_hasShownFatalErrorAlert`)
        // để tránh spam nhiều hộp thoại liên tiếp khi 1 lỗi gốc kéo theo nhiều lỗi phụ.
        // FIX (patch alert -> silent): trước đây còn alert() text lỗi cho người dùng — bỏ hẳn theo
        // yêu cầu, giữ SILENT hoàn toàn ở tầng global error handler này. Lý do: đây là handler bắt
        // MỌI lỗi runtime chưa được catch ở bất kỳ đâu trong app (window.addEventListener('error')),
        // có thể bắn ra rất nhiều lần liên tiếp với các lỗi vụn vặt không ảnh hưởng người dùng (ví
        // dụ lỗi từ 1 extension trình duyệt, lỗi nguồn ngoài không phải code app) — hiện hộp thoại
        // cho mọi trường hợp này dễ gây phiền hơn là giúp ích. console.error(...) ngay trên vẫn ghi
        // đầy đủ context+err vào console — đủ để dev tự mở DevTools kiểm tra khi cần debug, không
        // mất thông tin, chỉ không làm phiền người dùng cuối bằng hộp thoại nữa.
        let _hasShownFatalErrorAlert = false;
        function _reportFatalError(context, err) {
            console.error(`[FATAL] ${context}:`, err);
            _hasShownFatalErrorAlert = true; // giữ lại cờ phòng trường hợp code khác đang đọc biến này
        }
        window.addEventListener('error', (e) => {
            _reportFatalError(`${e.filename || 'script'}:${e.lineno || '?'}`, e.error || e.message);
        });
        window.addEventListener('unhandledrejection', (e) => {
            _reportFatalError('Promise bị reject nhưng không ai .catch()', e.reason);
        });

        const APP_CONFIG = { fftSizeStandard: 256, fftSizeHighRes: 2048, fftSizePitch: 2048, bpmMinWaitTime: 250 };
        const PERFORMANCE_PROFILES = {
            high: { stars: 200, tunnelRings: 60, glassDrops: 250, bldMult: 1.0, streakProb: 0.8, blurMult: 1.0, streetRain: 220 },
            medium: { stars: 100, tunnelRings: 35, glassDrops: 100, bldMult: 1.5, streakProb: 0.9, blurMult: 0.5, streetRain: 130 },
            low: { stars: 40, tunnelRings: 15, glassDrops: 40, bldMult: 2.5, streakProb: 0.95, blurMult: 0, streetRain: 70 } 
        };
        const DEFAULT_VINYL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0iIzFlMjkzYiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjE2IiBmaWxsPSIjMGYxNzJhIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iMTUiIGZpbGw9IiNjYmQ1ZTEiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0IiBmaWxsPSIjMGYxNzJhIi8+PC9zdmc+';
        const EQ_FREQS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
        const EQ_LABELS = ['32', '64', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'];
        const EQ_PRESETS = {
            'flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 'bass_boost': [6, 5, 4, 1, 0, 0, 0, 0, 0, 0], 'pop': [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2],
            'rock': [5, 4, 3, 1, -1, -1, 1, 2, 3, 4], 'acoustic': [2, 1, 0, 0, 1, 2, 3, 4, 3, 2], 'electronic': [5, 4, 1, -1, -2, 0, 1, 3, 4, 5],
            'manual': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };

        const MODES = ['bar', 'lightning', 'rubik', 'vortex', 'black hole', 'rain'];

        // Auto-switch-visual (ver 10): ngưỡng tối thiểu HARDCODE cho mọi cách tính thời gian giữa
        // 2 lần đổi hiệu ứng — người dùng KHÔNG thể điền thấp hơn mức này, validate ở cả input UI
        // (auto-switch-visual.js) lẫn lúc đọc lại config cũ/hỏng (đề phòng giá trị bị sửa tay
        // trong localStorage/IndexedDB). Cùng 1 hằng số dùng cho:
        //   - mode 'fixed' (c1): chính là khoảng giây cố định người điền — không cho < ngưỡng này.
        //   - mode 'random' (c2): cận DƯỚI của khoảng random — max là số người điền.
        //   - mode 'duration' (c3): SỐ CHIA CỐ ĐỊNH cho duration bài hát (vd: bài 450s / 10 = 45s/lần
        //     đổi) — KHÔNG phải ngưỡng tối thiểu ở đây, người dùng KHÔNG điền/can thiệp được gì cả.
        const AUTO_SWITCH_VISUAL_MIN_SECONDS = 10;

        const DEFAULT_VIZ_CONFIG = {
            quality: 'high', type: 'bar', barStyle: 'mirror', vortexStyle: 'rings', rainStyle: 'glass', glassFlash: true, mode: 'solid', 
            bgColor: '#000000', solidColor: '#ffffff', dynA: '#ec4899', dynB: '#3b82f6', 
            minH: 4, maxH: 400, barWidth: 4, bgImage: '', bgBlur: 0, bgImageEnabled: false,
            mirrorBarCount: 32,
            volume: 100, eqMode: 'flat', manualEq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            videoBgEnabled: false, videoBgUrl: '',
            // Bật/tắt riêng cho VISUAL (canvas hiệu ứng) — ver 8 refine: TÁCH HẲN khỏi video nền
            // (trước đây field này tên `videoHideVisual`, chỉ có tác dụng khi video nền đang bật).
            // Giờ độc lập hoàn toàn: tắt -> luôn ẩn canvas + dừng tính toán vẽ, BẤT KỂ có video nền
            // hay không; nền hiển thị khi đó là nền THẬT đang được chọn (video nền nếu đang bật,
            // nếu không thì màu nền `bgColor`) — xem updateVisualVisibility() ở color-utils.js.
            visualEnabled: true,
            keepScreenOn: true,
            // Tự động đổi hiệu ứng Visualizer theo thời gian (ver 10) — xem auto-switch-visual.js.
            //   - autoSwitchVisualEnabled : bật/tắt tổng.
            //   - autoSwitchVisualMode    : 'sequential' (tuần tự/cố định theo MODES) | 'random'.
            //   - autoSwitchVisualTimeMode: 'fixed' (c1) | 'random' (c2) | 'duration' (c3).
            //   - 3 field SỐ GIÂY RIÊNG cho từng mode — KHÔNG dùng chung 1 field, vì mỗi mode diễn
            //     giải số khác hẳn nhau (khoảng cố định / cận TRÊN của random / số chia cho độ dài
            //     bài) — dùng chung sẽ bị GHI ĐÈ mất giá trị của mode khác mỗi khi người dùng đổi
            //     qua đổi lại giữa các mode (đã xảy ra ở bản đầu, sửa lại ở đây):
            //     autoSwitchVisualSecondsFixed (c1), autoSwitchVisualSecondsRandom (c2, cận trên —
            //     cận dưới luôn AUTO_SWITCH_VISUAL_MIN_SECONDS cố định), autoSwitchVisualSecondsDuration
            //     (c3, số chia trong công thức duration/X — tự kẹp ≤ round(duration/2) lúc build mốc).
            autoSwitchVisualEnabled: false,
            autoSwitchVisualMode: 'sequential',
            autoSwitchVisualTimeMode: 'fixed',
            autoSwitchVisualSecondsFixed: 30,
            autoSwitchVisualSecondsRandom: 30,
            autoSwitchVisualSecondsDuration: 30,
            // Hiện/ẩn phụ đề (ver 8 refine) — chuyển từ biến in-memory isSubtitlesEnabled (mất khi
            // tải lại trang) sang field lưu trong vizConfig, đồng bộ với mọi setting khác.
            subtitlesEnabled: true,
            subtitleStyle: {
                bgColor: '#000000', bgOpacity: 0.4,
                borderColor: '#ffffff', borderOpacity: 0.1, borderWidth: 1, borderRadius: 16,
                textColor: '#ffffff', fontSize: 8, lineHeight: 1.3, letterSpacing: 0
            }
        };
        let vizConfig = { ...DEFAULT_VIZ_CONFIG };

        /**
         * LƯU CONFIG (v7) — 2 lớp:
         *   (1) localStorage — NGUỒN GHI CHÍNH, đồng bộ, tức thì. saveConfig() được gọi RẤT dày
         *       (mỗi lần kéo 1 slider màu/EQ/sub-style...) nên phải giữ đồng bộ & rẻ, không thể đổi
         *       thẳng sang IndexedDB (async) cho lớp này — sẽ tạo hàng trăm transaction/giây lúc kéo.
         *   (2) IndexedDB (meta.configBackup) — BẢN SAO LƯU, ghi DEBOUNCE (giống cơ chế đã có ở
         *       listen-stats.js: gom nhiều thay đổi liên tiếp thành 1 lần ghi sau 2s yên tĩnh).
         *       Mục đích DUY NHẤT: phòng trường hợp browser tự xoá localStorage (ví dụ Safari iOS
         *       xoá dữ liệu site ít dùng để nhường chỗ, hoặc người dùng xoá "Clear browsing data"
         *       nhưng không đụng IndexedDB) — xem loadConfig() để biết luồng phục hồi.
         *
         * KHÔNG backup `bgImage`/`videoBgUrl`: đây là blob: URL chỉ sống trong 1 session (tạo lại
         * mỗi lần loadBackgroundAssets() chạy), lưu vào bản backup là vô nghĩa và có thể trỏ tới
         * blob: URL đã chết ở session sau.
         *
         * ĐÃ CHUYỂN từ core/equalizer-settings.js (cũ) — đây là hạ tầng CHUNG cho TOÀN BỘ
         * vizConfig (EQ, visualizer, subtitle style, video nền...), không riêng EQ, nên hợp lý
         * hơn khi đặt cùng nhà với khai báo `vizConfig`/`DEFAULT_VIZ_CONFIG` ở trên.
         */
        function saveConfig() {
            localStorage.setItem('visualMasterConfigV21', JSON.stringify(vizConfig));
            scheduleConfigBackup();
        }

        function scheduleConfigBackup() {
            // taskManager.once() với tên cố định tự huỷ bản cũ + đặt lại từ đầu (addNew() validate
            // tự kill() task trùng tên) — đúng hành vi debounce, không cần biến timer riêng nữa.
            taskManager.once(flushConfigBackup, 2000, 'configBackupFlush');
        }
        function flushConfigBackup() {
            taskManager.kill('configBackupFlush');
            const { bgImage, videoBgUrl, ...persistable } = vizConfig; // loại trừ blob: URL runtime
            setMeta('configBackup', persistable).catch(e => console.warn('[config] Lưu configBackup (IndexedDB) lỗi:', e));
        }

        /**
         * Đọc lại ảnh nền & video nền từ IndexedDB (meta.bgImage / meta.videoBg), tự sửa trạng thái
         * "on ảo" nếu config nói đang bật nhưng IndexedDB không còn Blob tương ứng (mục 6 plan).
         * Áp dụng đồng nhất cho CẢ ảnh và video.
         */
        async function loadBackgroundAssets() {
            const [imgBlob, videoBlob] = await Promise.all([
                getMeta('bgImage'),
                getMeta('videoBg')
            ]);

            if (vizConfig.bgImageEnabled && !imgBlob) {
                vizConfig.bgImageEnabled = false;
            } else if (imgBlob && vizConfig.bgImageEnabled) {
                vizConfig.bgImage = URL.createObjectURL(imgBlob);
            }

            if (vizConfig.videoBgEnabled && !videoBlob) {
                vizConfig.videoBgEnabled = false;
            } else if (videoBlob && vizConfig.videoBgEnabled) {
                vizConfig.videoBgUrl = URL.createObjectURL(videoBlob);
            }

            saveConfig();
            bgImageEnableToggle.checked = vizConfig.bgImageEnabled;
            videoEnableToggle.checked = vizConfig.videoBgEnabled;
            updatePlaylistBg(); handleVideoBackground();
        }

        /**
         * Đồng bộ TOÀN BỘ UI Cài đặt theo vizConfig hiện tại (sau khi nạp/migrate xong) — ĐIỀU
         * PHỐI DUY NHẤT, gọi các hàm "init UI" của TỪNG MODULE CON qua guard `typeof === 'function'`
         * (đúng pattern đã dùng với initAutoSwitchVisualUI() — xem core/visualizer/visualizer-misc-settings.js,
         * core/subtitle/subtitle-style-settings.js, core/equalizer.js). KHÔNG tự đụng DOM ref của
         * module khác trực tiếp ở đây — mỗi module tự lo đồng bộ UI CỦA NÓ.
         */
        async function loadConfig() {
            let saved = localStorage.getItem('visualMasterConfigV21') || localStorage.getItem('visualMasterConfigV20');
            // FALLBACK (v7): localStorage rỗng (lần đầu mở MÁY THẬT MỚI, hoặc browser đã tự xoá
            // localStorage để nhường chỗ cho dữ liệu khác) NHƯNG IndexedDB còn bản backup -> đây là
            // dấu hiệu mất localStorage ngoài ý muốn (không phải người dùng mới thật), phục hồi lại
            // NGAY vào localStorage rồi nạp tiếp như thường — người dùng không mất cấu hình đã chỉnh.
            if (!saved) {
                try {
                    const backup = await getMeta('configBackup');
                    if (backup && typeof backup === 'object') {
                        saved = JSON.stringify(backup);
                        localStorage.setItem('visualMasterConfigV21', saved);
                        console.warn('[config] localStorage rỗng — đã phục hồi cấu hình từ bản backup IndexedDB.');
                    }
                } catch (e) { console.warn('[config] Không đọc được configBackup (IndexedDB):', e); }
            }
            if (saved) { try { vizConfig = { ...vizConfig, ...JSON.parse(saved) }; } catch(e) {} }
            if(!vizConfig.manualEq) vizConfig.manualEq = [0,0,0,0,0,0,0,0,0,0];
            if(vizConfig.vortexStyle === 'tardis' || vizConfig.vortexStyle === 'classic' || vizConfig.vortexStyle === 'dust') vizConfig.vortexStyle = 'rings';
            // Cấu hình cũ từng có rainStyle 'classic', visualizer 'synthesia'/'firefly_forest'/'seasons'/'wave' đã
            // bị loại bỏ — quy về giá trị tương đương gần nhất để không vỡ trải nghiệm của người dùng cũ.
            if (vizConfig.rainStyle === 'classic') vizConfig.rainStyle = 'glass';
            if (vizConfig.type === 'synthesia') { vizConfig.type = 'bar'; vizConfig.barStyle = 'cascade'; }
            if (vizConfig.type === 'firefly_forest' || vizConfig.type === 'seasons' || vizConfig.type === 'wave') vizConfig.type = 'bar';
            if (!vizConfig.barStyle) vizConfig.barStyle = 'mirror';
            if (vizConfig.mirrorBarCount == null) vizConfig.mirrorBarCount = 32;
            if (vizConfig.bgImageEnabled == null) vizConfig.bgImageEnabled = false;
            if (vizConfig.keepScreenOn == null) vizConfig.keepScreenOn = true;
            if (vizConfig.subtitlesEnabled == null) vizConfig.subtitlesEnabled = true;
            if (vizConfig.visualEnabled == null) vizConfig.visualEnabled = true;
            // Auto-switch-visual (ver 10) — migrate field mới + validate lại ngưỡng tối thiểu
            // (phòng giá trị bị sửa tay/hỏng trong bản JSON cũ thấp hơn AUTO_SWITCH_VISUAL_MIN_SECONDS).
            if (vizConfig.autoSwitchVisualEnabled == null) vizConfig.autoSwitchVisualEnabled = false;
            if (vizConfig.autoSwitchVisualMode !== 'sequential' && vizConfig.autoSwitchVisualMode !== 'random') vizConfig.autoSwitchVisualMode = 'sequential';
            if (!['fixed', 'random', 'duration'].includes(vizConfig.autoSwitchVisualTimeMode)) vizConfig.autoSwitchVisualTimeMode = 'fixed';
            // 3 field RIÊNG cho từng mode (xem giải thích ở trên) — validate ĐỘC LẬP từng cái,
            // không dùng chung 1 field nữa (bug bản đầu: đổi mode A rồi mode B sẽ ghi đè mất giá
            // trị đã lưu của mode A). MIGRATE field cũ `autoSwitchVisualSeconds` (nếu config cũ từ
            // trước khi tách field còn sót lại trong localStorage/IndexedDB) sang cả 3 field mới —
            // dùng đúng giá trị cũ làm điểm khởi đầu cho cả 3, hợp lý hơn reset về default cứng.
            if (typeof vizConfig.autoSwitchVisualSeconds === 'number') {
                if (vizConfig.autoSwitchVisualSecondsFixed == null) vizConfig.autoSwitchVisualSecondsFixed = vizConfig.autoSwitchVisualSeconds;
                if (vizConfig.autoSwitchVisualSecondsRandom == null) vizConfig.autoSwitchVisualSecondsRandom = vizConfig.autoSwitchVisualSeconds;
                if (vizConfig.autoSwitchVisualSecondsDuration == null) vizConfig.autoSwitchVisualSecondsDuration = vizConfig.autoSwitchVisualSeconds;
                delete vizConfig.autoSwitchVisualSeconds; // dọn field cũ, không lưu lại nữa từ lần saveConfig() kế tiếp
            }
            ['autoSwitchVisualSecondsFixed', 'autoSwitchVisualSecondsRandom', 'autoSwitchVisualSecondsDuration'].forEach((field) => {
                if (typeof vizConfig[field] !== 'number' || vizConfig[field] < AUTO_SWITCH_VISUAL_MIN_SECONDS) {
                    vizConfig[field] = Math.max(AUTO_SWITCH_VISUAL_MIN_SECONDS, DEFAULT_VIZ_CONFIG[field]);
                }
            });
            // Dữ liệu cũ (trước ver 8) có thể còn field `videoHideVisual` (đã loại bỏ, thay bằng
            // `visualEnabled` độc lập khỏi video nền) — không cần migrate giá trị qua, vì ý nghĩa
            // 2 field khác nhau (cũ: ẩn visual CHỈ khi có video; mới: ẩn visual LUÔN LUÔN khi tắt).
            // Field thừa này vô hại nếu còn tồn tại trong bản JSON cũ, JS đơn giản bỏ qua nó.
            if (!vizConfig.subtitleStyle) vizConfig.subtitleStyle = { ...DEFAULT_VIZ_CONFIG.subtitleStyle };
            else vizConfig.subtitleStyle = { ...DEFAULT_VIZ_CONFIG.subtitleStyle, ...vizConfig.subtitleStyle };
            // Cấu hình cũ (trước khi thang cỡ chữ đổi thành 8-16px) có thể đã lưu giá trị lớn hơn —
            // giới hạn lại để khớp với range slider hiện tại, tránh lệch giữa dữ liệu và UI.
            vizConfig.subtitleStyle.fontSize = Math.min(16, Math.max(8, vizConfig.subtitleStyle.fontSize));

            qualitySelect.value = vizConfig.quality; bgColorPicker.value = vizConfig.bgColor;
            bgBlurSlider.value = vizConfig.bgBlur; valBgBlurDisplay.textContent = vizConfig.bgBlur + 'px';

            // bgImage/videoBgUrl giờ là blob: URL runtime, tạo lại mỗi session từ IndexedDB — KHÔNG
            // sống sót qua reload, nên luôn reset về rỗng ở đây TRƯỚC khi loadBackgroundAssets() đọc
            // lại Blob thật và tự sửa trạng thái "on ảo" nếu cần (mục 6).
            vizConfig.bgImage = ''; vizConfig.videoBgUrl = '';
            await loadBackgroundAssets();

            colorModeSelect.value = vizConfig.mode;
            solidColorPicker.value = vizConfig.solidColor; solidColorText.value = vizConfig.solidColor;
            dynColorA.value = vizConfig.dynA; dynColorB.value = vizConfig.dynB;
            maxHeightSlider.value = vizConfig.maxH; valMaxDisplay.textContent = vizConfig.maxH;
            barWidthSlider.value = vizConfig.barWidth; valWidthDisplay.textContent = vizConfig.barWidth;
            mirrorCountSlider.value = vizConfig.mirrorBarCount; valMirrorCountDisplay.textContent = vizConfig.mirrorBarCount;
            vortexStyleSelect.value = vizConfig.vortexStyle;
            barStyleSelect.value = vizConfig.barStyle;
            rainStyleSelect.value = vizConfig.rainStyle;
            glassFlashToggle.checked = vizConfig.glassFlash;

            volumeSlider.value = vizConfig.volume; valVolumeDisplay.textContent = vizConfig.volume + '%';
            if(masterGainNode) masterGainNode.gain.value = vizConfig.volume / 100;

            currentModeIndex = MODES.indexOf(vizConfig.type); if(currentModeIndex === -1) currentModeIndex = 0;
            updateDOMBackground(); updatePlaylistBg(); updateColorMenuUI(); updateTypeUI();

            // Mỗi module con tự lo đồng bộ UI CỦA NÓ (EQ, misc settings visualizer, subtitle
            // style) — gọi qua guard vì thứ tự nạp các module này SAU config.js (xem index.html).
            if (typeof initEqualizerUIFromConfig === 'function') initEqualizerUIFromConfig();
            if (typeof initVisualizerMiscSettingsUIFromConfig === 'function') initVisualizerMiscSettingsUIFromConfig();
            if (typeof initSubtitleStyleSettingsUIFromConfig === 'function') initSubtitleStyleSettingsUIFromConfig();
            if (typeof initAutoSwitchVisualUI === 'function') initAutoSwitchVisualUI(); // đồng bộ toàn bộ UI auto-switch-visual (xem auto-switch-visual.js)
        }
