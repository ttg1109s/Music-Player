/**
 * Hằng số & toàn bộ hàm khởi tạo / cập nhật Vortex Engine bằng Three.js (đường ống tunnel, particles, rings, bars, waves).
 * (Trích từ file gốc, dòng 100-272 trong khối <script>)
 */
        let tWarpSpeed = 0;
        let tPathParams = { freqX: 0.0012, freqY: 0.0009, ampX: 450, ampY: 300, phaseX: 0, phaseY: 0 };
        let tPathTarget = { freqX: 0.0012, freqY: 0.0009, ampX: 450, ampY: 300, phaseX: 0, phaseY: 0 };
        const TUNNEL_DEPTH = 3000;
        
        // Nhóm cho từng style
        let tGroupRings, tGroupBars, tGroupWaves;
        let tRings = [];
        let tBarsMesh; // InstancedMesh
        let tBarRingZs = []; // vị trí Z hiện tại của từng "vòng" bar (sliding window, giống tRings)
        let tWaveMeshes = [];

        const BARS_RINGS_COUNT = 40;
        const BARS_PER_RING = 24;

        // Tính toán tọa độ tâm của ống hầm tại một điểm Z bất kỳ
        function getVortexCenterAt(z) {
            return {
                x: Math.sin(z * tPathParams.freqX + tPathParams.phaseX) * tPathParams.ampX,
                y: Math.cos(z * tPathParams.freqY + tPathParams.phaseY) * tPathParams.ampY
            };
        }

        // Thay đổi hình dáng uốn lượn của ống (khi có bass) — thay đổi nhẹ nhàng so với target hiện tại,
        // tránh nhảy đột ngột sang một hình dạng hoàn toàn khác gây cảm giác giật khi nội suy.
        function rollNewVortexCurve() {
            const jitter = (base, range) => base + (Math.random() - 0.5) * range;
            tPathTarget.freqX = Math.max(0.0004, Math.min(0.0022, jitter(tPathTarget.freqX, 0.0006)));
            tPathTarget.freqY = Math.max(0.0004, Math.min(0.0022, jitter(tPathTarget.freqY, 0.0006)));
            tPathTarget.ampX = Math.max(180, Math.min(620, jitter(tPathTarget.ampX, 160)));
            tPathTarget.ampY = Math.max(130, Math.min(470, jitter(tPathTarget.ampY, 120)));
        }

        // Nội suy mượt mà hình dáng ống
        function updateVortexCurveLerp() {
            const k = 0.006;
            tPathParams.freqX += (tPathTarget.freqX - tPathParams.freqX) * k;
            tPathParams.freqY += (tPathTarget.freqY - tPathParams.freqY) * k;
            tPathParams.ampX += (tPathTarget.ampX - tPathParams.ampX) * k;
            tPathParams.ampY += (tPathTarget.ampY - tPathParams.ampY) * k;
            // Tiến pha để ống luôn "sống"
            tPathParams.phaseX += 0.005;
            tPathParams.phaseY += 0.005;
        }

        function initThreeJS() {
            if (tInitialized && tScene) { while(tScene.children.length > 0){ tScene.remove(tScene.children[0]); } }
            
            const tCanvas = document.getElementById('webgl-canvas');
            tScene = new THREE.Scene();
            tScene.fog = new THREE.FogExp2(0x000000, 0.0006); // Sương mù tạo chiều sâu fade

            tCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, TUNNEL_DEPTH);
            tCamera.position.set(0, 0, 0);

            if(!tRenderer) {
                tRenderer = new THREE.WebGLRenderer({ canvas: tCanvas, alpha: true, antialias: true });
                tRenderer.setPixelRatio(window.devicePixelRatio);
            }
            tRenderer.setSize(window.innerWidth, window.innerHeight);

            const perf = PERFORMANCE_PROFILES[vizConfig.quality];

            // Nhóm 1: Vòng Ring
            tGroupRings = new THREE.Group();
            tRings = [];
            const ringGeo = new THREE.TorusGeometry(350, 6, 8, 48);
            for(let i=0; i<perf.tunnelRings; i++) {
                const z = -(i / perf.tunnelRings) * TUNNEL_DEPTH;
                const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
                const mesh = new THREE.Mesh(ringGeo, mat);
                mesh.position.z = z;
                mesh.userData = { initialZ: z };
                tRings.push(mesh);
                tGroupRings.add(mesh);
            }
            tScene.add(tGroupRings);

            // Nhóm 2: Đoạn Bar 3D (InstancedMesh)
            tGroupBars = new THREE.Group();
            const barGeo = new THREE.BoxGeometry(15, 15, 60);
            // Dời tâm khối hộp lên một chút để scaleY mọc ra ngoài thay vì ra 2 hướng
            barGeo.translate(0, 7.5, 0); 
            const barMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
            const totalBars = BARS_RINGS_COUNT * BARS_PER_RING;
            tBarsMesh = new THREE.InstancedMesh(barGeo, barMat, totalBars);
            
            // Vị trí Z ban đầu của từng vòng bar — dùng sliding window giống tRings, tránh trôi lệch theo thời gian
            tBarRingZs = [];
            for(let r=0; r<BARS_RINGS_COUNT; r++) tBarRingZs.push(-(r / BARS_RINGS_COUNT) * TUNNEL_DEPTH);

            const dummy = new THREE.Object3D();
            for(let r=0; r<BARS_RINGS_COUNT; r++) {
                const z = tBarRingZs[r];
                for(let b=0; b<BARS_PER_RING; b++) {
                    const ang = (b / BARS_PER_RING) * Math.PI * 2;
                    dummy.position.set(Math.cos(ang) * 350, Math.sin(ang) * 350, z);
                    // Xoay hộp hướng tâm
                    dummy.rotation.set(0, 0, ang - Math.PI/2); 
                    dummy.updateMatrix();
                    tBarsMesh.setMatrixAt(r * BARS_PER_RING + b, dummy.matrix);
                }
            }
            tGroupBars.add(tBarsMesh);
            tScene.add(tGroupBars);

            // Nhóm 3: Nhiễu động sóng (Wave/Fade)
            tGroupWaves = new THREE.Group();
            tWaveMeshes = [];
            const waveGeo = new THREE.TorusGeometry(300, 40, 12, 48);
            const waveCount = 20;
            for(let i=0; i<waveCount; i++) {
                const z = -(i / waveCount) * TUNNEL_DEPTH;
                // Wireframe với Additive Blending tạo hiệu ứng mờ ảo
                const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, wireframe: true, blending: THREE.AdditiveBlending });
                const mesh = new THREE.Mesh(waveGeo, mat);
                mesh.position.z = z;
                mesh.userData = { initialZ: z, rotZOffset: Math.random() * Math.PI };
                tWaveMeshes.push(mesh);
                tGroupWaves.add(mesh);
            }
            tScene.add(tGroupWaves);

            tCurrentWarpZ = 0;
            tInitialized = true;
            updateThreeJSColors();
            updateVortexVisibility();
        }

        function updateVortexVisibility() {
            if(!tInitialized) return;
            tGroupRings.visible = (vizConfig.vortexStyle === 'rings');
            tGroupBars.visible = (vizConfig.vortexStyle === 'bars');
            tGroupWaves.visible = (vizConfig.vortexStyle === 'wave');
        }

        function updateThreeJSColors() {
            if(!tInitialized) return;
            // Sẽ được gọi trong frame render để làm màu động, ở đây chỉ để reset
        }
