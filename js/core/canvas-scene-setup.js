/**
 * Cấp phát buffer phân tích âm thanh, tạo blob từ DataURI, sinh cây cho rừng đom đóm, resize canvas, khởi tạo các hiệu ứng (sao, rubik...).
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

        function generateTrees() {
            trees = [];
            const w = canvas.width; const h = canvas.height;
            for(let layer = 0; layer < 3; layer++) {
                let numTrees = 10 + layer * 5;
                let color = `rgba(5, 10, 15, ${0.4 + layer * 0.3})`;
                for(let i=0; i<numTrees; i++) {
                    trees.push({
                        x: Math.random() * w, baseW: (30 + Math.random() * 40) * dpr * (3 - layer),
                        height: (h * 0.4 + Math.random() * h * 0.5) * (1 - layer*0.1),
                        color: color, layer: layer, swayPhase: Math.random() * Math.PI * 2
                    });
                }
            }
            trees.sort((a,b) => b.layer - a.layer);
        }

        function resizeCanvas(forceRebuildThree = false) {
            dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr;
            if(tRenderer) { tRenderer.setSize(window.innerWidth, window.innerHeight); tCamera.aspect = window.innerWidth/window.innerHeight; tCamera.updateProjectionMatrix(); }

            // Chỉ build lại toàn bộ Three.js scene (particles, bars, rings...) khi thực sự cần
            // (lần đầu tiên, hoặc đổi Quality). Việc resize cửa sổ thông thường (vd: thanh địa chỉ
            // trên mobile ẩn/hiện khi cuộn) KHÔNG được phép phá huỷ & tạo lại toàn bộ hệ hạt Vortex,
            // nếu không hiệu ứng "dust" sẽ bị giật/biến mất giữa lúc đang chạy.
            if (forceRebuildThree || !tInitialized) initThreeJS();
            updateThreeJSColors();

            initStars(); initRubik(); raindrops = []; ripples = [];
            glassStaticDrops = []; glassStreaks = []; activeLightnings = []; starFlashes = [];
            
            const perfProfile = PERFORMANCE_PROFILES[vizConfig.quality];

            bgRaindrops = [];
            for(let i = 0; i < 150; i++) bgRaindrops.push({x: Math.random() * canvas.width, y: Math.random() * canvas.height, speed: Math.random() * 8 + 4, length: Math.random() * 20 + 10, alpha: Math.random() * 0.15 + 0.05});
            for(let i=0; i < perfProfile.glassDrops; i++) glassStaticDrops.push({x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: (Math.random() * 1.5 + 0.5) * dpr});
            
            cityBuildings = []; let currentX = -50 * dpr;
            while(currentX < canvas.width + 50 * dpr) {
                let w = (Math.random() * 60 + 30) * dpr * perfProfile.bldMult; let h = (Math.random() * 250 + 80) * dpr;
                let winStepX = 14 * dpr * (perfProfile.bldMult > 1 ? 1.5 : 1); let winStepY = 18 * dpr * (perfProfile.bldMult > 1 ? 1.5 : 1);
                let cols = Math.floor(w / winStepX); let rows = Math.floor(h / winStepY); let windows = [];
                for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (Math.random() > 0.3) windows.push({ r: r, c: c, isAlwaysOn: Math.random() > 0.85, fftBin: Math.floor(Math.random() * 40), colorType: Math.random() > 0.6 ? '#fff5e6' : '#ffdd44' });
                cityBuildings.push({x: currentX, w: w, h: h, cols: cols, rows: rows, windows: windows}); currentX += w + (Math.random() * 15 * dpr); 
            }

            // Setup Fireflies Bầy đàn
            fireflies = [];
            fireflyBands = [];
            for(let i=0; i<numFireflyBands; i++) {
                fireflyBands.push({ baseY: canvas.height * (0.75 + i*0.1), phase: Math.random() * Math.PI*2 });
            }

            for(let i=0; i<perfProfile.fireflies; i++) {
                const bandIdx = Math.floor(Math.random() * numFireflyBands);
                fireflies.push({
                    x: Math.random() * canvas.width, 
                    y: fireflyBands[bandIdx].baseY,
                    bandId: bandIdx,
                    phaseX: Math.random() * Math.PI * 2,
                    speedX: (Math.random() * 0.015 + 0.005),
                    radius: (Math.random() * 3 + 1.5) * dpr, 
                    bin: Math.floor(Math.random() * 40),
                    vy: 0 // Vận tốc trục Y để lượn mượt
                });
            }
            generateTrees();
        }
        // QUAN TRỌNG: không truyền resizeCanvas trực tiếp làm callback — trình duyệt sẽ gọi nó
        // với đối tượng Event làm tham số đầu tiên (forceRebuildThree), và Event luôn là truthy,
        // vô tình bắt buộc build lại toàn bộ Three.js scene mỗi lần resize (đúng cái lỗi cần sửa).
        window.addEventListener('resize', () => resizeCanvas());

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

