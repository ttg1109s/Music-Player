/**
 * Vòng lặp render chính (requestAnimationFrame).
 *
 * File này CHỈ còn: cập nhật các biến phân tích âm thanh dùng chung mỗi khung hình (năng
 * lượng/beat/hue), rồi dispatch sang đúng hàm vẽ của visual đang chọn — tra trong object
 * VISUALIZER_DRAWERS thay vì một chuỗi if/else if dài. Logic vẽ thực tế của từng visual nằm ở
 * các file riêng trong js/visualizers/types/ (bar.js, lightning.js, rubik.js,
 * vortex.js, black-hole.js, rain.js).
 */

        // Tra cứu hàm vẽ theo vizConfig.type. Mỗi hàm nhận (ctx, perf, isPlaying, beatScale) —
        // không phải mọi hàm dùng hết các tham số này, nhưng ký hiệu được giữ đồng nhất để dễ
        // thêm visual mới sau này mà không phải sửa lại vòng lặp chính.
        const VISUALIZER_DRAWERS = {
            'bar':        (ctx, perf) => drawBar(ctx, perf),
            'lightning':  (ctx, perf, isPlaying) => drawLightning(ctx, perf, isPlaying),
            'rubik':      (ctx, perf, isPlaying) => drawRubik(ctx, perf, isPlaying),
            'black hole': (ctx, perf, isPlaying) => drawBlackHole(ctx, perf, isPlaying),
            'rain':       (ctx, perf, isPlaying) => drawRain(ctx, perf, isPlaying)
            // 'vortex' không nằm trong bảng này: nó render qua WebGL (canvas riêng, ba lớp scene
            // Three.js) và được cập nhật TRƯỚC khi canvas 2D được clear, xem drawVisualizer() dưới.
        };

        function drawVisualizer() {
            animationId = requestAnimationFrame(drawVisualizer);

            // Video nền đang "phủ kín, tạm dừng Visual": vẫn phải tính toán phân tích âm thanh
            // (BPM/Pitch/Energy ở stats-panel dùng chung các biến này) mỗi khung hình — CHỈ bỏ
            // qua phần vẽ canvas (2D + WebGL) vì nó đang bị ẩn phía sau video nên vẽ ra cũng vô ích.
            const isVideoHidingVisual = vizConfig.videoBgEnabled && vizConfig.videoBgUrl && vizConfig.videoHideVisual;

            if (isVideoHidingVisual) {
                if (canvas.style.visibility !== 'hidden') {
                    canvas.style.visibility = 'hidden';
                    document.getElementById('webgl-canvas').style.visibility = 'hidden';
                }
            } else if (canvas.style.visibility === 'hidden') {
                canvas.style.visibility = '';
                document.getElementById('webgl-canvas').style.visibility = '';
            }

            frameCounter++;
            const perf = PERFORMANCE_PROFILES[vizConfig.quality];
            if(!vizDataArray) return;
            analyser.getByteFrequencyData(vizDataArray);
            const bufferLength = analyser.frequencyBinCount;
            
            const isPlaying = !audioPlayer.paused;
            let bassSum = 0; const bassCount = Math.floor(bufferLength * 0.1);
            for(let i = 0; i < bassCount; i++) bassSum += vizDataArray[i];
            beatScale = (bassSum / bassCount) / 255; 
            smoothedEnergy += (beatScale - smoothedEnergy) * 0.15; 
            if (isPlaying) globalHueOffset = (globalHueOffset + 0.5 + (beatScale * 5)) % 360;
            
            updateStatsDashboard(bufferLength);

            // Mọi phần dưới đây CHỈ liên quan tới việc VẼ ra canvas (note bay, Vortex WebGL, các
            // visual 2D) — bỏ qua khi video đang phủ kín & ẩn visual, vì canvas đang invisible.
            if (isVideoHidingVisual) return;

            if (isPlaying && (vizConfig.quality === 'high' || vizConfig.quality === 'medium') && smoothedEnergy > 0.3 && Math.random() > 0.6) spawnFlyingNote();

            // ================== THREEJS VORTEX ENGINE ==================
            // Render qua canvas WebGL riêng (#webgl-canvas), TRƯỚC khi canvas 2D (#visualizer) được
            // clear ở dưới — 2 canvas xếp lớp lên nhau bằng CSS (xem styles.css, #webgl-canvas z-index).
            if (vizConfig.type === 'vortex') drawVortex(perf, isPlaying);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const drawFn = VISUALIZER_DRAWERS[vizConfig.type];
            if (drawFn) drawFn(ctx, perf, isPlaying, beatScale);
        }

        // Điểm khởi động thực sự của toàn bộ app. loadConfig() giờ là async (đọc ảnh/video nền
        // từ IndexedDB — mục 6 PLAN_INDEXEDDB.md). initPlaylistFromDB() đọc meta.playlistOrder +
        // tag/cover từng bài (KHÔNG đọc blob) để render danh sách ban đầu — thay cho playlist
        // luôn rỗng lúc load trang như bản cũ (mục 3.2).
        document.addEventListener('DOMContentLoaded', async () => {
            await loadConfig();
            updateSubToggleUI();
            if (typeof loadSongStats === 'function') await loadSongStats();
            await initPlaylistFromDB();
        });
