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

        function generateHillScene() {
            // Bãi đồi cỏ nhiều lớp (đồi xa thấp & mờ, đồi gần cao & rõ) + một túp lều nhỏ nằm trên sườn đồi gần.
            const w = canvas.width; const h = canvas.height;
            hills = [];
            const numLayers = 3;
            for (let layer = 0; layer < numLayers; layer++) {
                // Lớp xa (layer nhỏ) nằm cao hơn & nhạt hơn (sương đêm); lớp gần thấp hơn & đậm hơn.
                const baseY = h * (0.62 + layer * 0.13);
                const amp = h * (0.05 + layer * 0.035);
                const tint = 10 + layer * 4;
                const color = `rgba(${tint}, ${tint + 14}, ${tint + 8}, ${0.55 + layer * 0.18})`;
                // Tạo đường viền đồi bằng vài "đỉnh" ngẫu nhiên rồi nội suy mượt (giống đường cỏ nhấp nhô)
                const numPeaks = 4 + Math.floor(Math.random() * 2);
                const peaks = [];
                for (let i = 0; i <= numPeaks; i++) {
                    peaks.push({ x: (w / numPeaks) * i, yOff: (Math.random() - 0.5) * amp * 2 });
                }
                hills.push({ layer, baseY, amp, color, peaks });
            }

            // Cụm cỏ lưa thưa rải trên sườn đồi gần nhất, đung đưa theo gió/nhạc
            grassTufts = [];
            const frontHill = hills[hills.length - 1];
            for (let i = 0; i < 70; i++) {
                const x = Math.random() * w;
                grassTufts.push({
                    x, y: getHillYAt(frontHill, x) - Math.random() * 4 * dpr,
                    h: (8 + Math.random() * 10) * dpr,
                    swayPhase: Math.random() * Math.PI * 2,
                    swaySpeed: 0.4 + Math.random() * 0.4
                });
            }

            // Túp lều nhỏ nằm trên sườn đồi gần, lệch về một phía để không che mặt trăng
            const hutX = w * (0.18 + Math.random() * 0.12);
            const hutHillY = getHillYAt(frontHill, hutX);
            hut = {
                x: hutX, groundY: hutHillY,
                w: w * 0.1, h: h * 0.085,
                roofH: h * 0.055,
                windowGlow: 0.5 + Math.random() * 0.3
            };
        }

        // Trả về tung độ Y của đường viền đồi tại hoành độ x (nội suy tuyến tính giữa các "đỉnh")
        function getHillYAt(hillObj, x) {
            const peaks = hillObj.peaks; const n = peaks.length - 1;
            let seg = Math.min(n - 1, Math.floor((x / canvas.width) * n));
            seg = Math.max(0, seg);
            const p0 = peaks[seg], p1 = peaks[seg + 1] || peaks[seg];
            const t = p1.x > p0.x ? (x - p0.x) / (p1.x - p0.x) : 0;
            const smoothT = t * t * (3 - 2 * t); // smoothstep cho đường cong mềm hơn
            const yOff = p0.yOff + (p1.yOff - p0.yOff) * smoothT;
            return hillObj.baseY + yOff;
        }

        function resizeCanvas() {
            dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr;
            if(tRenderer) { tRenderer.setSize(window.innerWidth, window.innerHeight); tCamera.aspect = window.innerWidth/window.innerHeight; tCamera.updateProjectionMatrix(); }
            
            initStars(); initThreeJS(); updateThreeJSColors(); initRubik(); raindrops = []; ripples = [];
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

            // ============ RỪNG ĐOM ĐÓM — Thiết lập không gian & bầy đàn hữu cơ ============
            fireflies = [];

            // Vài "cụm" (cluster) trung tâm để đom đóm tụ lại thành đàn tự nhiên,
            // thay cho các dải ngang cố định cứng nhắc của bản cũ.
            const numClusters = 4 + Math.floor(Math.random() * 2); // 4-5 cụm
            fireflyClusters = [];
            for(let i=0; i<numClusters; i++) {
                fireflyClusters.push({
                    x: canvas.width * (0.1 + Math.random() * 0.8),
                    y: canvas.height * (0.55 + Math.random() * 0.35),
                    driftPhase: Math.random() * Math.PI * 2,
                    driftSpeed: 0.05 + Math.random() * 0.08
                });
            }

            for(let i=0; i<perfProfile.fireflies; i++) {
                // depth: 0 = sát mặt đất/gần camera (to, sáng, nhanh) | 1 = xa/mờ trong sương (nhỏ, dịu, chậm)
                const depth = Math.random();
                const cluster = fireflyClusters[Math.floor(Math.random() * fireflyClusters.length)];
                const homeX = cluster.x + (Math.random() - 0.5) * canvas.width * 0.35;
                const homeY = cluster.y + (Math.random() - 0.5) * canvas.height * 0.22;

                fireflies.push({
                    x: homeX, y: homeY,
                    homeX: homeX, homeY: homeY,           // điểm neo của hành trình lượn tự do
                    clusterRef: cluster,
                    depth: depth,                           // 0 (gần) .. 1 (xa)
                    wanderAngle: Math.random() * Math.PI * 2,
                    wanderSpeed: (0.15 + Math.random() * 0.25) * (1 - depth * 0.5),
                    wanderRadius: (40 + Math.random() * 70) * dpr * (1 - depth * 0.4),
                    phaseX: Math.random() * Math.PI * 2,
                    phaseY: Math.random() * Math.PI * 2,
                    radius: (1.2 + Math.random() * 2.2) * dpr * (1 - depth * 0.55),
                    bin: Math.floor(Math.random() * 40),
                    // Nhịp nhấp nháy tự nhiên riêng của từng con (giống đom đóm thật, không phải nhạc cụ)
                    blinkPhase: Math.random() * Math.PI * 2,
                    blinkSpeed: 0.025 + Math.random() * 0.035,
                    hueJitter: Math.random() * 24 - 12, // lệch màu nhẹ cá thể, tránh đồng phục cứng nhắc
                    dynPick: Math.random() > 0.5 // chọn cố định giữa 2 màu pha trộn (mode dynamic), không đổi theo frame
                });
            }
            fireflies.sort((a, b) => b.depth - a.depth); // vẽ con xa trước, con gần sau (đúng thứ tự lớp)

            // Sương mù khí quyển mỏng phía xa — tăng cảm giác chiều sâu của khu rừng
            fireflyMist = [];
            for(let i=0; i<14; i++) {
                fireflyMist.push({
                    x: Math.random() * canvas.width,
                    y: canvas.height * (0.6 + Math.random() * 0.35),
                    r: (canvas.width * 0.08) + Math.random() * canvas.width * 0.1,
                    phase: Math.random() * Math.PI * 2
                });
            }
            generateHillScene();
            generateStreetScene();
            generateSeasonScene();
        }
        window.addEventListener('resize', resizeCanvas);

        function generateStreetScene() {
            // Công viên về đêm dưới mưa: 1 cột đèn đường chính (lệch trái) + ghế công viên cạnh đó,
            // vài cột đèn phụ mờ phía xa để tạo chiều sâu phố/công viên.
            const w = canvas.width, h = canvas.height;
            streetLamps = [];
            const mainLampX = w * 0.28;
            streetLamps.push({ x: mainLampX, baseY: h * 0.88, height: h * 0.42, main: true, flicker: 1, depth: 0 });
            // Đèn phụ phía xa hai bên, nhỏ và mờ hơn
            streetLamps.push({ x: w * 0.06, baseY: h * 0.8, height: h * 0.26, main: false, flicker: 1, depth: 0.7 });
            streetLamps.push({ x: w * 0.85, baseY: h * 0.82, height: h * 0.28, main: false, flicker: 1, depth: 0.6 });

            // Ghế công viên đặt cạnh đèn chính
            streetBench = { x: mainLampX + w * 0.09, y: h * 0.88, w: w * 0.16, h: h * 0.035 };

            // Mưa phố: các hạt mưa rơi xiên nhẹ, mật độ/độ dài sẽ được điều biến theo nhạc lúc vẽ
            streetRain = [];
            for (let i = 0; i < 220; i++) {
                streetRain.push({
                    x: Math.random() * w, y: Math.random() * h,
                    len: (14 + Math.random() * 18) * dpr,
                    speed: (10 + Math.random() * 8) * dpr,
                    drift: (Math.random() - 0.5) * 0.6
                });
            }
        }

        function generateSeasonScene() {
            // Khung cảnh nền dùng chung cho 4 mùa: bãi đồi cỏ 2 lớp + một mái nhà nhỏ riêng (không liên quan lều đom đóm)
            const w = canvas.width, h = canvas.height;
            seasonHills = [];
            for (let layer = 0; layer < 2; layer++) {
                const baseY = h * (0.72 + layer * 0.14);
                const amp = h * (0.04 + layer * 0.025);
                const numPeaks = 4;
                const peaks = [];
                for (let i = 0; i <= numPeaks; i++) peaks.push({ x: (w / numPeaks) * i, yOff: (Math.random() - 0.5) * amp * 2 });
                seasonHills.push({ layer, baseY, amp, peaks });
            }
            const frontHill = seasonHills[seasonHills.length - 1];
            const houseX = w * (0.74 + Math.random() * 0.1);
            seasonHouse = { x: houseX, groundY: getHillYAt(frontHill, houseX), w: w * 0.09, h: h * 0.075, roofH: h * 0.05 };

            // Hoa hướng dương cho mùa hè, rải trên sườn đồi gần
            sunflowers = [];
            for (let i = 0; i < 12; i++) {
                const x = Math.random() * w * 0.65;
                sunflowers.push({ x, y: getHillYAt(frontHill, x), h: (40 + Math.random() * 30) * dpr, swayPhase: Math.random() * Math.PI * 2, size: (10 + Math.random() * 6) * dpr });
            }

            seasonParticles = [];
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

