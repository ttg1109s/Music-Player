/**
 * Hằng số & toàn bộ hàm khởi tạo / cập nhật Vortex Engine bằng Three.js (đường ống tunnel, particles, rings, bars, waves).
 * (Trích từ file gốc, dòng 100-272 trong khối <script>)
 */
        let tWarpSpeed = 0;
        let tPathParams = { freqX: 0.0012, freqY: 0.0009, ampX: 450, ampY: 300, phaseX: 0, phaseY: 0 };
        let tPathTarget = { freqX: 0.0012, freqY: 0.0009, ampX: 450, ampY: 300, phaseX: 0, phaseY: 0 };
        const TUNNEL_DEPTH = 3000;

        // Hướng nhìn (lookAt) đã được làm mượt, lưu liên tục qua từng frame.
        // Lý do tồn tại biến này: nếu gọi tCamera.lookAt() mỗi frame bằng một điểm
        // lấy trực tiếp từ getVortexCenterAt() (sin/cos) thì khi tốc độ bay (tWarpSpeed)
        // tăng cao lúc BPM/energy lớn, camera "ăn" qua đường cong của ống nhanh hơn rất
        // nhiều, khiến góc nhìn đổi hướng gấp giữa các frame liên tiếp -> lookAt() dựng
        // lại toàn bộ hướng (kể cả roll) từ đầu mỗi lần -> hiệu ứng giật/xoay lắc rất
        // nhanh trái-phải-trên-dưới ("rung lắc nhoằng nhoằng") đúng vào lúc nhạc mạnh.
        // Khắc phục: nội suy (lerp) điểm lookAt thực tế dùng để gọi lookAt(), tách biệt
        // hoàn toàn khỏi tốc độ bay, để hướng camera luôn xoay mượt dù ống đổi hướng gấp.
        let tLookTarget = null; // { x, y, z } – khởi tạo lại mỗi khi initThreeJS chạy
        
        // Nhóm cho từng style
        let tGroupDust, tGroupRings, tGroupBars, tGroupWaves;
        let tDustParticles;
        let tRings = [];
        let tBarsMesh; // InstancedMesh
        let tBarRingZ = []; // Z thế giới thực hiện tại của từng ring bar (persistent, không tính lại từ đầu mỗi frame)
        let tWaveMeshes = [];

        // BARS_RINGS_COUNT & WAVE_COUNT trước đây là const cố định (40 và 20), không ăn theo
        // Quality. Giờ chuyển thành "let", được set lại mỗi lần initThreeJS() chạy theo
        // perf.barRings / perf.waveCount tương ứng — High giữ nguyên 40/20 như cũ (không đổi
        // hành vi mặc định), Medium/Low giảm xuống để nhẹ GPU hơn, giống cách Dust/Rings vẫn
        // đang ăn theo Quality từ trước.
        let BARS_RINGS_COUNT = 40;
        const BARS_PER_RING = 24;
        let WAVE_COUNT = 20;

        // Tính toán tọa độ tâm của ống hầm tại một điểm Z bất kỳ
        function getVortexCenterAt(z) {
            return {
                x: Math.sin(z * tPathParams.freqX + tPathParams.phaseX) * tPathParams.ampX,
                y: Math.cos(z * tPathParams.freqY + tPathParams.phaseY) * tPathParams.ampY
            };
        }

        // Thay đổi hình dáng uốn lượn của ống (khi có bass)
        function rollNewVortexCurve() {
            tPathTarget.freqX = 0.0005 + Math.random() * 0.0015;
            tPathTarget.freqY = 0.0005 + Math.random() * 0.0015;
            tPathTarget.ampX = 200 + Math.random() * 400;
            tPathTarget.ampY = 150 + Math.random() * 300;
        }

        // Nội suy mượt mà hình dáng ống. Tốc độ nội suy (k) bị giảm theo vortexShakeIntensity
        // (mặc định 100 = gốc) để khi người dùng hạ thấp slider, ống đổi hướng chậm & êm hơn,
        // tránh cảm giác camera "giật" khi nhạc mạnh liên tục đẩy đường ống đổi chiều gấp.
        function updateVortexCurveLerp() {
            const shakeAmt = (vizConfig.vortexShakeIntensity ?? 100) / 100;
            const k = 0.01 * Math.max(0.08, shakeAmt); // không cho k về 0 tuyệt đối để ống vẫn "sống"
            tPathParams.freqX += (tPathTarget.freqX - tPathParams.freqX) * k;
            tPathParams.freqY += (tPathTarget.freqY - tPathParams.freqY) * k;
            tPathParams.ampX += (tPathTarget.ampX - tPathParams.ampX) * k;
            tPathParams.ampY += (tPathTarget.ampY - tPathParams.ampY) * k;
            // Tiến pha để ống luôn "sống" (giữ tốc độ pha cố định, chỉ giảm biên độ đổi hướng ở trên)
            tPathParams.phaseX += 0.005;
            tPathParams.phaseY += 0.005;
        }

        function createGlowingParticleTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 128; canvas.height = 128;
            const context = canvas.getContext('2d');
            const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, 128, 128);
            return new THREE.CanvasTexture(canvas);
        }

        function disposeThreeObject(obj) {
            if (!obj) return;
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
            }
        }

        function initThreeJS() {
            if (tInitialized && tScene) {
                // Giải phóng đúng cách bộ nhớ GPU (geometry/material/texture) trước khi tạo lại,
                // tránh leak khi initThreeJS được gọi lại nhiều lần (vd: đổi Quality).
                tScene.traverse(disposeThreeObject);
                while(tScene.children.length > 0){ tScene.remove(tScene.children[0]); }
            }
            
            const tCanvas = document.getElementById('webgl-canvas');
            tScene = new THREE.Scene();
            tScene.fog = new THREE.FogExp2(0x000000, 0.0006); // Sương mù tạo chiều sâu fade

            tCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, TUNNEL_DEPTH);
            // QUAN TRỌNG: trước đây camera luôn spawn cứng tại (0,0,0), nhưng tâm ống thực tế
            // tại Z=0 lại là getVortexCenterAt(0) = (0, ampY) = (0, 300) theo tham số mặc định —
            // lệch ngay 300 đơn vị so với bán kính ring (350) ngay khung hình đầu tiên. Vì
            // camera đuổi theo tâm ống bằng lerp chậm (*0.08/frame), nó phải "bơi" qua hàng
            // chục frame mới bắt kịp, đúng lúc tWarpSpeed cũng đang tăng tốc từ 0 — kết quả là
            // hiệu ứng giật/xoay/nhoè rất mạnh ngay vài giây đầu mỗi khi bài hát bắt đầu (hoặc
            // sau khi initThreeJS chạy lại). Khắc phục: spawn camera NGAY tại tâm ống thật ở
            // Z=0, để không còn độ trễ lớn cần bắt kịp lúc khởi động.
            const initialCenter = getVortexCenterAt(0);
            tCamera.position.set(initialCenter.x, initialCenter.y, 0);

            if(!tRenderer) {
                tRenderer = new THREE.WebGLRenderer({ canvas: tCanvas, alpha: true, antialias: true });
                tRenderer.setPixelRatio(window.devicePixelRatio);

                // Lý do thêm 2 listener này: trên di động (đặc biệt iOS Safari), khi hệ điều
                // hành thấy thiếu RAM/VRAM (do trình duyệt mở lâu, nhiều tab, hoặc nhiệt độ máy
                // cao), nó có thể "rút" (lose) WebGL context bất kỳ lúc nào — KHÔNG hề ném lỗi
                // JavaScript nào cả. tRenderer.render() sau đó chỉ âm thầm không vẽ gì, nhưng
                // toàn bộ phần còn lại của app (canvas 2D, BPM/Pitch/Energy, v.v...) vẫn chạy
                // bình thường vì chúng không phụ thuộc WebGL. Hậu quả: toàn bộ hiệu ứng Vortex
                // (bụi, ring, bar, wave) biến mất NGAY LẬP TỨC, đúng 1 frame, không có dấu hiệu
                // báo trước — chính là hiện tượng "chạy được một tí là mất" người dùng gặp phải.
                // Khắc phục: lắng nghe sự kiện mất context để biết và tạm ngưng gọi render
                // (tránh log lỗi vô ích / vẽ vào context chết), rồi khi trình duyệt khôi phục
                // context (webglcontextrestored), tự động gọi lại initThreeJS() để build lại
                // toàn bộ scene + buffer GPU, làm hiệu ứng "tự hồi sinh" mà người dùng không cần
                // phải tải lại trang hay đổi Quality để ép tạo lại.
                tCanvas.addEventListener('webglcontextlost', (e) => {
                    e.preventDefault(); // báo cho browser ta sẽ tự khôi phục, không phải tải lại trang
                    tInitialized = false;
                    console.warn('[Vortex] Mất WebGL context (thường do thiết bị thiếu VRAM/RAM) — đang chờ khôi phục...');
                }, false);
                tCanvas.addEventListener('webglcontextrestored', () => {
                    console.warn('[Vortex] WebGL context đã khôi phục — dựng lại toàn bộ hiệu ứng Vortex.');
                    initThreeJS();
                }, false);
            }
            tRenderer.setSize(window.innerWidth, window.innerHeight);

            const perf = PERFORMANCE_PROFILES[vizConfig.quality];
            const pTexture = createGlowingParticleTexture();

            // Nhóm 1: Bụi lượng tử (Dust)
            tGroupDust = new THREE.Group();
            const dGeo = new THREE.BufferGeometry();
            const dPos = new Float32Array(perf.dustParticles * 3);
            const dSize = new Float32Array(perf.dustParticles);
            // userData để lưu offset cố định của hạt so với tâm hầm
            const dOffsets = []; 
            for(let i=0; i<perf.dustParticles; i++) {
                const z = -Math.random() * TUNNEL_DEPTH;
                const r = 50 + Math.random() * 800; // Bán kính
                const ang = Math.random() * Math.PI * 2;
                dOffsets.push({r, ang, z});
                dPos[i*3] = 0; dPos[i*3+1] = 0; dPos[i*3+2] = z;
                dSize[i] = 10 + Math.random() * 30;
            }
            dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
            dGeo.setAttribute('size', new THREE.BufferAttribute(dSize, 1));
            const dMat = new THREE.PointsMaterial({ size: 20, map: pTexture, color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
            tDustParticles = new THREE.Points(dGeo, dMat);
            tDustParticles.userData.offsets = dOffsets;
            tGroupDust.add(tDustParticles);
            tScene.add(tGroupDust);

            // Nhóm 2: Vòng Ring
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

            // Nhóm 3: Đoạn Bar 3D (InstancedMesh)
            // Số ring (BARS_RINGS_COUNT) giờ lấy từ perf.barRings theo Quality đang chọn,
            // thay vì hard-code 40 cho mọi trường hợp — xem giải thích ở khai báo let phía trên.
            BARS_RINGS_COUNT = perf.barRings;
            tGroupBars = new THREE.Group();
            const barGeo = new THREE.BoxGeometry(15, 15, 60);
            // Dời tâm khối hộp lên một chút để scaleY mọc ra ngoài thay vì ra 2 hướng
            barGeo.translate(0, 7.5, 0); 
            const barMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
            const totalBars = BARS_RINGS_COUNT * BARS_PER_RING;
            tBarsMesh = new THREE.InstancedMesh(barGeo, barMat, totalBars);

            // Lưu Z thế giới thực (world Z) của từng "ring" bar — giống cách tRings lưu
            // mesh.position.z — để mỗi frame chỉ cần TRƯỢT dần theo tốc độ bay và cuộn (wrap)
            // khi đi quá xa, thay vì tính lại từ đầu dựa trên index ring (cách cũ khiến các
            // ring bị "bỏ lại" phía sau xa dần camera và không bao giờ wrap về lại, làm Bar 3D
            // biến mất hoàn toàn sau vài giây).
            tBarRingZ = [];
            const dummy = new THREE.Object3D();
            for(let r=0; r<BARS_RINGS_COUNT; r++) {
                const z = -(r / BARS_RINGS_COUNT) * TUNNEL_DEPTH;
                tBarRingZ.push(z);
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

            // Nhóm 4: Nhiễu động sóng (Wave/Fade)
            // WAVE_COUNT giờ lấy từ perf.waveCount theo Quality, thay vì hard-code 20.
            WAVE_COUNT = perf.waveCount;
            tGroupWaves = new THREE.Group();
            tWaveMeshes = [];
            const waveGeo = new THREE.TorusGeometry(300, 40, 12, 48);
            for(let i=0; i<WAVE_COUNT; i++) {
                const z = -(i / WAVE_COUNT) * TUNNEL_DEPTH;
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
            // Đồng bộ với fix spawn camera ở trên: điểm nhìn ban đầu cũng phải là tâm ống thật
            // tại Z = -800 (lookAheadZ ban đầu), không phải (0,0) cố định — nếu không, ngay cả
            // khi camera.position đã spawn đúng chỗ, hướng NHÌN ban đầu vẫn lệch và vẫn phải
            // "bơi" qua vài chục frame mới chỉnh đúng, làm giảm một phần hiệu quả của fix trên.
            const initialLookPos = getVortexCenterAt(-800);
            tLookTarget = { x: initialLookPos.x, y: initialLookPos.y, z: -800 };
            tInitialized = true;
            updateThreeJSColors();
            updateVortexVisibility();
        }

        function updateVortexVisibility() {
            if(!tInitialized) return;
            tGroupDust.visible = (vizConfig.vortexStyle === 'dust');
            tGroupRings.visible = (vizConfig.vortexStyle === 'rings');
            tGroupBars.visible = (vizConfig.vortexStyle === 'bars');
            tGroupWaves.visible = (vizConfig.vortexStyle === 'wave');
        }

        function updateThreeJSColors() {
            if(!tInitialized) return;
            // Sẽ được gọi trong frame render để làm màu động, ở đây chỉ để reset
        }
