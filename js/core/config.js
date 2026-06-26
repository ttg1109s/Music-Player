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
        let _hasShownFatalErrorAlert = false;
        function _reportFatalError(context, err) {
            console.error(`[FATAL] ${context}:`, err);
            if (!_hasShownFatalErrorAlert) {
                _hasShownFatalErrorAlert = true;
                try {
                    const message = err && err.message ? err.message : err;
                    // Guard: lang.js PHẢI nạp trước config.js (xem index.html), nhưng nếu vì lý do
                    // nào đó tFormat chưa tồn tại lúc lỗi xảy ra (ví dụ chính lang.js bị lỗi tải),
                    // fallback về chuỗi tiếng Việt cứng thay vì throw thêm 1 lỗi mới ngay trong
                    // chính hàm báo lỗi (sẽ làm im lặng hoàn toàn, không alert được gì cả).
                    const text = (typeof tFormat === 'function')
                        ? tFormat('common.fatalError.alert', { context, message })
                        : `Đã xảy ra lỗi không mong muốn (${context}). Vui lòng tải lại trang (F5).\n\nChi tiết: ${message}`;
                    alert(text);
                } catch (alertErr) { /* alert có thể bị chặn ở 1 số trình duyệt — bỏ qua, log vẫn còn ở console */ }
            }
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
