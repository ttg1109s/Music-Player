/**
 * Hằng số cấu hình toàn cục: APP_CONFIG, PERFORMANCE_PROFILES, danh sách EQ, MODES, DEFAULT_VIZ_CONFIG.
 * (Trích từ file gốc, dòng 1-25 trong khối <script>)
 */
        const APP_CONFIG = { fftSizeStandard: 256, fftSizeHighRes: 2048, fftSizePitch: 2048, bpmMinWaitTime: 250 };
        // barRings & waveCount mới thêm: trước đây Bars 3D (luôn 40 ring × 24 bar = 960 khối hộp)
        // và Wave (luôn 20 hình xuyến) bị HARD-CODE cố định, không hề giảm theo Quality như
        // Dust/Rings đã làm — khiến chọn "low" vẫn tốn GPU như "high" nếu đang ở style Bars/Wave.
        // Tỉ lệ giảm dùng cùng thang với tunnelRings (60/35/15 ≈ 100%/58%/25%) để đồng bộ cảm giác
        // giữa các style khi đổi Quality.
        const PERFORMANCE_PROFILES = {
            high:   { stars: 200, tunnelRings: 60, dustParticles: 3000, glassDrops: 250, bldMult: 1.0, streakProb: 0.8, blurMult: 1.0, fireflies: 120, barRings: 40, waveCount: 20 },
            medium: { stars: 100, tunnelRings: 35, dustParticles: 1500, glassDrops: 100, bldMult: 1.5, streakProb: 0.9, blurMult: 0.5, fireflies: 70,  barRings: 24, waveCount: 12 },
            low:    { stars: 40,  tunnelRings: 15, dustParticles: 800,  glassDrops: 40,  bldMult: 2.5, streakProb: 0.95, blurMult: 0, fireflies: 35,   barRings: 10, waveCount: 6 }
        };
        const DEFAULT_VINYL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0iIzFlMjkzYiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjE2IiBmaWxsPSIjMGYxNzJhIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iMTUiIGZpbGw9IiNjYmQ1ZTEiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0IiBmaWxsPSIjMGYxNzJhIi8+PC9zdmc+';
        const EQ_FREQS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
        const EQ_LABELS = ['32', '64', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'];
        const EQ_PRESETS = {
            'flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 'bass_boost': [6, 5, 4, 1, 0, 0, 0, 0, 0, 0], 'pop': [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2],
            'rock': [5, 4, 3, 1, -1, -1, 1, 2, 3, 4], 'acoustic': [2, 1, 0, 0, 1, 2, 3, 4, 3, 2], 'electronic': [5, 4, 1, -1, -2, 0, 1, 3, 4, 5],
            'manual': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };

        const MODES = ['bar', 'synthesia', 'wave', 'lightning', 'rubik', 'vortex', 'black hole', 'rain', 'firefly_forest'];

        const DEFAULT_VIZ_CONFIG = {
            quality: 'high', type: 'bar', vortexStyle: 'dust', vortexShakeIntensity: 100, rainStyle: 'glass', glassFlash: true, mode: 'solid', 
            bgColor: '#000000', solidColor: '#ffffff', dynA: '#ec4899', dynB: '#3b82f6', 
            minH: 4, maxH: 400, barWidth: 4, bgImage: '', bgBlur: 0,
            volume: 100, eqMode: 'flat', manualEq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            videoBgEnabled: false, videoBgUrl: '', videoHideVisual: false
        };
        let vizConfig = { ...DEFAULT_VIZ_CONFIG };
