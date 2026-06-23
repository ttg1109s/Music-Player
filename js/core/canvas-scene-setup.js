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
                // Lớp xa hơn (layer nhỏ) hơi ánh xanh đêm; lớp gần (layer lớn) đậm và rõ viền hơn
                let tint = 5 + layer * 2;
                let color = `rgba(${tint}, ${tint + 5}, ${tint + 10}, ${0.4 + layer * 0.3})`;
                for(let i=0; i<numTrees; i++) {
                    const kind = Math.random() > 0.45 ? 'pine' : 'round'; // thông nhiều tầng | tán tròn rậm
                    const tierCount = 3 + Math.floor(Math.random() * 3); // 3-5 tầng lá cho cây thông
                    // Lệch ngẫu nhiên nhẹ cho từng tầng/đường viền tán để silhouette không đối xứng hoàn hảo
                    const jitterSeed = [];
                    for(let j=0; j<8; j++) jitterSeed.push(0.75 + Math.random() * 0.5);

                    trees.push({
                        x: Math.random() * w, baseW: (30 + Math.random() * 40) * dpr * (3 - layer),
                        height: (h * 0.4 + Math.random() * h * 0.5) * (1 - layer*0.1),
                        color: color, layer: layer, swayPhase: Math.random() * Math.PI * 2,
                        kind: kind, tierCount: tierCount, jitterSeed: jitterSeed,
                        trunkW: (4 + Math.random() * 3) * dpr * (3 - layer) / 3
                    });
                }
            }
            trees.sort((a,b) => b.layer - a.layer);
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
            generateTrees();
        }
        window.addEventListener('resize', resizeCanvas);

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

