/**
 * Cấp phát buffer phân tích âm thanh, tạo blob từ DataURI, resize canvas, khởi tạo các hiệu ứng (sao, rubik, mưa phố...).
 * (Trích từ file gốc, dòng 576-671 trong khối <script>)
 */
        function allocateBuffers() {
            if(!analyser || !analyserPitch) return;
            vizDataArray = new Uint8Array(analyser.frequencyBinCount); previousSpectrumArray = new Uint8Array(analyser.frequencyBinCount);
            waveTimeDomainArray = new Uint8Array(analyser.frequencyBinCount); pitchTimeDomainArray = new Float32Array(analyserPitch.fftSize);
        }

        function dataURItoBlobUrl(dataURI) {
            try {
                let parts = dataURI.split(','); let byteString = atob(parts[1]); let mimeString = parts[0].split(':')[1].split(';')[0];
                let ab = new ArrayBuffer(byteString.length); let ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                return URL.createObjectURL(new Blob([ab], {type: mimeString}));
            } catch(e) { return null; }
        }

        function resizeCanvas() {
            dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr;
            if(tRenderer) { tRenderer.setSize(window.innerWidth, window.innerHeight); tCamera.aspect = window.innerWidth/window.innerHeight; tCamera.updateProjectionMatrix(); }
            
            initStars(); initThreeJS(); updateThreeJSColors(); initRubik(); ripples = [];
            glassStaticDrops = []; glassStreaks = []; activeLightnings = []; starFlashes = [];
            
            const perfProfile = PERFORMANCE_PROFILES[vizConfig.quality];

            for(let i=0; i < perfProfile.glassDrops; i++) glassStaticDrops.push({x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: (Math.random() * 1.5 + 0.5) * dpr});
            
            cityBuildings = []; let currentX = -50 * dpr;
            while(currentX < canvas.width + 50 * dpr) {
                let w = (Math.random() * 60 + 30) * dpr * perfProfile.bldMult; let h = (Math.random() * 250 + 80) * dpr;
                let winStepX = 14 * dpr * (perfProfile.bldMult > 1 ? 1.5 : 1); let winStepY = 18 * dpr * (perfProfile.bldMult > 1 ? 1.5 : 1);
                let cols = Math.floor(w / winStepX); let rows = Math.floor(h / winStepY); let windows = [];
                for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (Math.random() > 0.3) windows.push({ r: r, c: c, isAlwaysOn: Math.random() > 0.85, fftBin: Math.floor(Math.random() * 40), colorType: Math.random() > 0.6 ? '#fff5e6' : '#ffdd44' });
                cityBuildings.push({x: currentX, w: w, h: h, cols: cols, rows: rows, windows: windows}); currentX += w + (Math.random() * 15 * dpr); 
            }

            generateStreetScene();
        }
        window.addEventListener('resize', resizeCanvas);

        // Chiều cao (px thiết bị, đã *dpr) của vùng thanh điều khiển dưới cùng (progress bar + tên
        // bài/control/thời gian) — mặt đất của visual Street PHẢI nằm cao hơn mốc này để không bị
        // thanh điều khiển che mất, bất kể kích thước màn hình.
        function getPlayerBarSafeHeight() {
            return 130 * dpr;
        }

        function generateStreetScene() {
            // Công viên về đêm dưới mưa: 1 cột đèn đường chính (lệch trái) + người đứng dưới đèn,
            // vài cột đèn phụ mờ phía xa để tạo chiều sâu phố/công viên.
            // Mặt đất (groundY) luôn được đặt cao hơn vùng thanh điều khiển dưới cùng (tên bài,
            // nút play/pause, thanh tiến trình) để không bao giờ bị che mất bởi visual.
            const w = canvas.width, h = canvas.height;
            const safeGroundY = Math.min(h * 0.88, h - getPlayerBarSafeHeight());
            streetGroundY = safeGroundY;

            streetLamps = [];
            const mainLampX = w * 0.28;
            streetLamps.push({ x: mainLampX, baseY: safeGroundY, height: h * 0.42, main: true, flicker: 1, depth: 0 });
            // Đèn phụ phía xa hai bên, nhỏ và mờ hơn
            streetLamps.push({ x: w * 0.06, baseY: safeGroundY - h * 0.08, height: h * 0.26, main: false, flicker: 1, depth: 0.7 });
            streetLamps.push({ x: w * 0.85, baseY: safeGroundY - h * 0.06, height: h * 0.28, main: false, flicker: 1, depth: 0.6 });

            // Người đứng dưới đèn chính, số lượng tuỳ theo cấu hình + giới hạn theo hiệu năng
            const perfProfile = PERFORMANCE_PROFILES[vizConfig.quality];
            const wantedStandees = Math.min(vizConfig.streetStanding || 0, perfProfile.streetStandees);
            streetStandees = [];
            for (let i = 0; i < wantedStandees; i++) {
                const spread = (i - (wantedStandees - 1) / 2) * w * 0.045;
                streetStandees.push({
                    x: mainLampX + spread + (Math.random() - 0.5) * w * 0.01,
                    groundY: safeGroundY,
                    h: h * (0.16 + Math.random() * 0.02),
                    gender: Math.random() > 0.5 ? 'm' : 'f',
                    swayPhase: Math.random() * Math.PI * 2
                });
            }

            // Mưa phố: các hạt mưa rơi xiên nhẹ, mật độ/độ dài sẽ được điều biến theo nhạc lúc vẽ.
            // Số lượng hạt khởi tạo theo PERFORMANCE_PROFILES để giảm tải ở chế độ hiệu năng thấp.
            streetRain = [];
            for (let i = 0; i < perfProfile.streetRain; i++) {
                streetRain.push({
                    x: Math.random() * w, y: Math.random() * h,
                    len: (14 + Math.random() * 18) * dpr,
                    speed: (10 + Math.random() * 8) * dpr,
                    drift: (Math.random() - 0.5) * 0.6
                });
            }
        }

        function initStars() {
            stars = []; const maxDist = Math.max(canvas.width, canvas.height); const count = PERFORMANCE_PROFILES[vizConfig.quality].stars;
            for(let i=0; i < count; i++) {
                let clusterAngle = (Math.floor(Math.random() * 5) / 5) * Math.PI * 2; let angle = clusterAngle + (Math.random() * 1.5 - 0.75); 
                let layer = Math.random(); let baseSpeed, sizeMult;
                if (layer < 0.2) { baseSpeed = 0.1; sizeMult = 0.5; } else if (layer < 0.7) { baseSpeed = 0.4; sizeMult = 1.0; } else { baseSpeed = 1.0; sizeMult = 2.0; } 
                let colorTint = '255, 255, 255'; let colorRand = Math.random();
                if (colorRand > 0.9) colorTint = '200, 220, 255'; else if (colorRand > 0.8) colorTint = '255, 240, 200'; 
                stars.push({ angle: angle, distance: Math.random() * maxDist, size: (Math.random() * 1.5 + 0.5) * sizeMult * dpr, baseSpeed: baseSpeed * dpr, colorTint: colorTint });
            }
        }

        function initRubik() {
            rubikCubes = [];
            for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) rubikCubes.push({ cx: x, cy: y, cz: z, binIdx: Math.abs(x*9 + y*3 + z) % 27 });
        }

