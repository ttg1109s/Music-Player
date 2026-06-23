/**
 * Vòng lặp render chính (requestAnimationFrame): vẽ toàn bộ 9 chế độ visualizer (bar, synthesia, wave, lightning, rubik, vortex, black hole, rain, firefly_forest).
 * (Trích từ file gốc, dòng 1117-1604 trong khối <script>)
 */
        function drawVisualizer() {
            animationId = requestAnimationFrame(drawVisualizer);

            if (vizConfig.videoBgEnabled && vizConfig.videoBgUrl && vizConfig.videoHideVisual) {
                if (canvas.style.visibility !== 'hidden') {
                    canvas.style.visibility = 'hidden';
                    document.getElementById('webgl-canvas').style.visibility = 'hidden';
                }
                return;
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
            let beatScale = (bassSum / bassCount) / 255; 
            smoothedEnergy += (beatScale - smoothedEnergy) * 0.15; 
            if (isPlaying) globalHueOffset = (globalHueOffset + 0.5 + (beatScale * 5)) % 360;
            
            updateStatsDashboard(bufferLength);

            if (isPlaying && (vizConfig.quality === 'high' || vizConfig.quality === 'medium') && smoothedEnergy > 0.3 && Math.random() > 0.6) spawnFlyingNote();

            // ================== THREEJS VORTEX ENGINE MỚI ==================
            if (vizConfig.type === 'vortex' && tInitialized) {
                // 1. Cập nhật đường ống bay (Cinematic Path) — đổi hướng thưa hơn và nhẹ nhàng hơn để tránh giật
                if(isPlaying && smoothedEnergy > 0.65 && Math.random() > 0.985) rollNewVortexCurve();
                updateVortexCurveLerp();

                // 2. Cập nhật tốc độ bay (Gia tốc rất mượt theo nhạc, tránh tăng/giảm tốc đột ngột)
                const targetWarpSpeed = 10 + smoothedEnergy * 40;
                tWarpSpeed += (targetWarpSpeed - tWarpSpeed) * 0.025;
                tCurrentWarpZ -= tWarpSpeed; // Bay sâu vào âm Z

                // 3. Xử lý logic trượt (Sliding Window / Wrap Z) cho TẤT CẢ các vật thể
                function wrapZ(mesh, baseZOffset) {
                    if (mesh.position.z > tCurrentWarpZ + 200) {
                        mesh.position.z -= TUNNEL_DEPTH;
                    }
                    const center = getVortexCenterAt(mesh.position.z);
                    mesh.position.x = center.x + (baseZOffset ? baseZOffset.x : 0);
                    mesh.position.y = center.y + (baseZOffset ? baseZOffset.y : 0);
                }

                // -> STYLE: RINGS (Vòng ánh sáng)
                if (vizConfig.vortexStyle === 'rings') {
                    tRings.forEach((ring, idx) => {
                        ring.position.z += tWarpSpeed * 0.8;
                        if (ring.position.z > tCurrentWarpZ + 200) ring.position.z -= TUNNEL_DEPTH;
                        
                        const center = getVortexCenterAt(ring.position.z);
                        ring.position.x = center.x; ring.position.y = center.y;
                        
                        // Scale giật theo nhạc
                        const val = vizDataArray[idx % bufferLength] || 0;
                        const s = 1 + (val/255)*0.5 * smoothedEnergy;
                        ring.scale.set(s, s, s);

                        const color = getComputedColor(idx, tRings.length, val);
                        if (vizConfig.mode === 'gradient') ring.material.color.setStyle(color.fill);
                        else if (vizConfig.mode === 'dynamic') ring.material.color.setStyle(idx % 2 === 0 ? vizConfig.dynA : vizConfig.dynB);
                        else ring.material.color.setStyle(vizConfig.solidColor);
                    });
                }

                // -> STYLE: BARS 3D (kiểu xoắn chuỗi / lò xo DNA)
                else if (vizConfig.vortexStyle === 'bars') {
                    const dummy = new THREE.Object3D();
                    // Mỗi vòng lệch thêm một góc cố định so với vòng trước -> tạo hình xoắn lò xo dọc ống.
                    // Toàn bộ "lò xo" còn tự xoay chậm theo thời gian để luôn có cảm giác sống động.
                    const twistPerRing = (Math.PI * 2 / BARS_RINGS_COUNT) * 2.4; // số vòng xoắn trọn ống
                    const globalTwist = frameCounter * 0.004;

                    for(let r=0; r<BARS_RINGS_COUNT; r++) {
                        // Sliding window đúng cách: tích lũy vị trí mỗi frame (giống tRings), không tính lại từ modulo
                        tBarRingZs[r] += tWarpSpeed * 0.8;
                        if (tBarRingZs[r] > tCurrentWarpZ + 200) tBarRingZs[r] -= TUNNEL_DEPTH;
                        const z = tBarRingZs[r];

                        const center = getVortexCenterAt(z);
                        const val = vizDataArray[r % 40] || 0;
                        const barScaleY = 1 + (val/255) * 8 * smoothedEnergy;
                        const ringTwist = r * twistPerRing + globalTwist;

                        const color = getComputedColor(r, BARS_RINGS_COUNT, val);
                        let ringColor;
                        if (vizConfig.mode === 'gradient') ringColor = color.fill;
                        else if (vizConfig.mode === 'dynamic') ringColor = (r % 2 === 0) ? vizConfig.dynA : vizConfig.dynB;
                        else ringColor = vizConfig.solidColor;
                        const threeColor = new THREE.Color(ringColor);

                        for(let b=0; b<BARS_PER_RING; b++) {
                            const ang = (b / BARS_PER_RING) * Math.PI * 2 + ringTwist;
                            dummy.position.set(center.x + Math.cos(ang)*350, center.y + Math.sin(ang)*350, z);
                            dummy.rotation.set(0, 0, ang - Math.PI/2);
                            dummy.scale.set(1, barScaleY, 1);
                            dummy.updateMatrix();
                            tBarsMesh.setMatrixAt(r * BARS_PER_RING + b, dummy.matrix);
                            tBarsMesh.setColorAt(r * BARS_PER_RING + b, threeColor);
                        }
                    }
                    tBarsMesh.instanceMatrix.needsUpdate = true;
                    if(tBarsMesh.instanceColor) tBarsMesh.instanceColor.needsUpdate = true;
                }

                // -> STYLE: WAVE FADE
                else if (vizConfig.vortexStyle === 'wave') {
                    tWaveMeshes.forEach((wave, idx) => {
                        wave.position.z += tWarpSpeed * 1.2;
                        if (wave.position.z > tCurrentWarpZ + 200) wave.position.z -= TUNNEL_DEPTH;
                        
                        const center = getVortexCenterAt(wave.position.z);
                        wave.position.x = center.x; wave.position.y = center.y;
                        
                        // Xoay tròn từ từ, tăng tốc theo bass
                        wave.rotation.z += 0.01 + smoothedEnergy * 0.05;
                        wave.scale.setScalar(0.8 + smoothedEnergy * 0.4);

                        const val = vizDataArray[idx % bufferLength] || 0;
                        const color = getComputedColor(idx, tWaveMeshes.length, val);
                        if (vizConfig.mode === 'gradient') wave.material.color.setStyle(color.fill);
                        else if (vizConfig.mode === 'dynamic') wave.material.color.setStyle(idx % 2 === 0 ? vizConfig.dynA : vizConfig.dynB);
                        else wave.material.color.setStyle(vizConfig.solidColor);
                    });
                }

                // 4. Cinematic Camera — chỉ bám theo độ cong của ống (trái/phải/trên/dưới), hoàn toàn
                // không có dao động/rung lắc nào khác (không sway, không FOV breathing).
                const camTargetPos = getVortexCenterAt(tCurrentWarpZ);
                // Camera bắt kịp rất chậm rãi (Smooth damping nhẹ hơn để tránh giật khi đường ống đổi hướng)
                tCamera.position.x += (camTargetPos.x - tCamera.position.x) * 0.045;
                tCamera.position.y += (camTargetPos.y - tCamera.position.y) * 0.045;
                tCamera.position.z = tCurrentWarpZ;

                // LookAt điểm phía trước một đoạn, theo đúng đường cong của ống — cố định, không lắc
                const lookAheadZ = tCurrentWarpZ - 800;
                const lookPos = getVortexCenterAt(lookAheadZ);
                tCamera.lookAt(lookPos.x, lookPos.y, lookAheadZ);

                tRenderer.render(tScene, tCamera);
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const centerY = canvas.height / 2, centerX = canvas.width / 2, scaledMinH = vizConfig.minH * dpr;

            // ================== RỪNG ĐOM ĐÓM (FIREFLY FOREST 3.0 - BÃI ĐỒI & TÚP LỀU) ==================
            if (vizConfig.type === 'firefly_forest') {
                // Mặt trăng to, đặt sau bãi đồi — tâm trăng nằm ngay trên đường chân trời của lớp đồi xa nhất
                // để toàn bộ các lớp đồi phía trước che khuất đúng phần nửa dưới của trăng.
                const moonX = canvas.width * 0.74;
                let moonRadius = (canvas.width * 0.16) + (smoothedEnergy * 12 * dpr);
                const farHillBaseY = hills.length > 0 ? hills[0].baseY : canvas.height * 0.62;
                const moonY = farHillBaseY;

                // Quầng sáng quanh trăng (vẽ trước, lan rộng, không bị đồi che để giữ cảm giác ánh sáng phủ trời)
                let haloGrad = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.3, moonX, moonY, moonRadius * 2.6);
                haloGrad.addColorStop(0, 'rgba(210, 230, 255, 0.22)'); haloGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = haloGrad; ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius * 2.6, 0, Math.PI * 2); ctx.fill();

                // Đĩa trăng: nền trắng-xanh dịu + vài miệng núi lửa mờ cho có chất liệu
                ctx.save();
                ctx.beginPath(); ctx.arc(moonX, moonY, Math.max(0.1, moonRadius), 0, Math.PI * 2); ctx.closePath(); ctx.clip();
                let moonBodyGrad = ctx.createRadialGradient(moonX - moonRadius * 0.3, moonY - moonRadius * 0.3, moonRadius * 0.1, moonX, moonY, moonRadius);
                moonBodyGrad.addColorStop(0, '#f5f8ff'); moonBodyGrad.addColorStop(1, '#c9d8ee');
                ctx.fillStyle = moonBodyGrad; ctx.fillRect(moonX - moonRadius, moonY - moonRadius, moonRadius * 2, moonRadius * 2);
                ctx.globalAlpha = 0.12; ctx.fillStyle = '#8fa3c2';
                [[-0.25, -0.1, 0.22], [0.3, 0.15, 0.16], [-0.05, 0.35, 0.12], [0.15, -0.35, 0.1]].forEach(c => {
                    ctx.beginPath(); ctx.arc(moonX + c[0]*moonRadius, moonY + c[1]*moonRadius, c[2]*moonRadius, 0, Math.PI*2); ctx.fill();
                });
                ctx.globalAlpha = 1.0;
                ctx.restore();

                // Sương mù khí quyển mỏng phía xa — tăng cảm giác chiều sâu giữa trăng và đàn đom đóm
                fireflyMist.forEach(m => {
                    m.phase += 0.003 + smoothedEnergy * 0.004;
                    let mx = m.x + Math.sin(m.phase) * 20 * dpr;
                    let mistGrad = ctx.createRadialGradient(mx, m.y, 0, mx, m.y, m.r);
                    mistGrad.addColorStop(0, 'rgba(140, 170, 160, 0.05)');
                    mistGrad.addColorStop(1, 'transparent');
                    ctx.fillStyle = mistGrad;
                    ctx.beginPath(); ctx.arc(mx, m.y, m.r, 0, Math.PI * 2); ctx.fill();
                });

                // Bãi đồi cỏ nhiều lớp (xa -> gần). Lớp gần nhất sẽ che khuất phần dưới của mặt trăng.
                hills.forEach((hl, hIdx) => {
                    ctx.beginPath();
                    ctx.moveTo(0, canvas.height);
                    ctx.lineTo(0, getHillYAt(hl, 0));
                    const steps = 40;
                    for (let s = 0; s <= steps; s++) {
                        const x = (canvas.width / steps) * s;
                        ctx.lineTo(x, getHillYAt(hl, x));
                    }
                    ctx.lineTo(canvas.width, canvas.height);
                    ctx.closePath();
                    ctx.fillStyle = hl.color;
                    ctx.fill();

                    // Viền cỏ mảnh sáng nhẹ trên đường sống đồi để tách lớp rõ hơn
                    if (hIdx === hills.length - 1) {
                        ctx.strokeStyle = 'rgba(160, 200, 170, 0.18)'; ctx.lineWidth = 2 * dpr;
                        ctx.beginPath();
                        for (let s = 0; s <= steps; s++) {
                            const x = (canvas.width / steps) * s; const y = getHillYAt(hl, x);
                            if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    }
                });

                // Túp lều nhỏ trên sườn đồi gần nhất
                if (hut) {
                    const sway = Math.sin(frameCounter * 0.01) * 1.5 * dpr; // rung khói rất nhẹ
                    const hx = hut.x, baseY = hut.groundY;
                    const wallTop = baseY - hut.h, wallLeft = hx - hut.w / 2, wallRight = hx + hut.w / 2;

                    // Thân lều (gỗ mộc)
                    ctx.fillStyle = '#2a1f18';
                    ctx.fillRect(wallLeft, wallTop, hut.w, hut.h);
                    ctx.fillStyle = 'rgba(255,255,255,0.04)';
                    for (let p = 1; p < 4; p++) ctx.fillRect(wallLeft, wallTop + (hut.h / 4) * p - 1*dpr, hut.w, 1.5*dpr);

                    // Mái lều hình tam giác
                    ctx.beginPath();
                    ctx.moveTo(wallLeft - hut.w * 0.08, wallTop);
                    ctx.lineTo(hx, wallTop - hut.roofH);
                    ctx.lineTo(wallRight + hut.w * 0.08, wallTop);
                    ctx.closePath();
                    ctx.fillStyle = '#1a120c'; ctx.fill();

                    // Cửa lều nhỏ
                    const doorW = hut.w * 0.22, doorH = hut.h * 0.55;
                    ctx.fillStyle = '#0c0805';
                    ctx.fillRect(hx - doorW/2, baseY - doorH, doorW, doorH);

                    // Ánh đèn vàng ấm hắt qua cửa — phản ứng nhẹ theo nhạc
                    const glowPulse = hut.windowGlow + (isPlaying ? smoothedEnergy * 0.3 : 0);
                    ctx.save();
                    ctx.globalCompositeOperation = 'lighter';
                    let doorGlow = ctx.createRadialGradient(hx, baseY - doorH*0.5, 1, hx, baseY - doorH*0.5, hut.w * 0.6);
                    doorGlow.addColorStop(0, `rgba(255, 200, 120, ${0.5 * glowPulse})`); doorGlow.addColorStop(1, 'transparent');
                    ctx.fillStyle = doorGlow; ctx.beginPath(); ctx.arc(hx, baseY - doorH*0.5, hut.w * 0.6, 0, Math.PI*2); ctx.fill();
                    ctx.restore();

                    // Khói nhẹ bay lên từ nóc lều
                    ctx.strokeStyle = 'rgba(200, 200, 210, 0.15)'; ctx.lineWidth = 2 * dpr; ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(hx + hut.w * 0.18, wallTop - hut.roofH * 0.7);
                    ctx.quadraticCurveTo(hx + hut.w * 0.18 + sway, wallTop - hut.roofH * 1.6, hx + hut.w * 0.1 + sway * 1.5, wallTop - hut.roofH * 2.6);
                    ctx.stroke();
                }

                // Cụm cỏ lưa thưa trên sườn đồi gần, đung đưa theo gió + nhạc
                ctx.strokeStyle = 'rgba(120, 160, 120, 0.5)'; ctx.lineWidth = 1.5 * dpr; ctx.lineCap = 'round';
                grassTufts.forEach(g => {
                    g.swayPhase += g.swaySpeed * 0.02 + smoothedEnergy * 0.01;
                    const bend = Math.sin(g.swayPhase) * 6 * dpr * (1 + smoothedEnergy * 0.8);
                    ctx.beginPath();
                    ctx.moveTo(g.x, g.y);
                    ctx.quadraticCurveTo(g.x + bend * 0.5, g.y - g.h * 0.6, g.x + bend, g.y - g.h);
                    ctx.stroke();
                });

                // Đom đóm — bầy đàn hữu cơ, lượn tự do quanh các cụm, có chiều sâu thật
                ctx.globalCompositeOperation = 'lighter';

                // Các cụm trôi nhẹ theo thời gian để cả đàn có cảm giác sống, không đứng yên máy móc
                fireflyClusters.forEach(cl => { cl.driftPhase += cl.driftSpeed * 0.01; });

                fireflies.forEach(f => {
                    const cl = f.clusterRef;
                    const clusterDriftX = Math.sin(cl.driftPhase) * canvas.width * 0.03;
                    const clusterDriftY = Math.cos(cl.driftPhase * 0.7) * canvas.height * 0.015;

                    // Lượn tự do quanh điểm neo (home) theo vòng hữu cơ, không di chuyển ngang đơn điệu
                    f.wanderAngle += f.wanderSpeed * 0.02;
                    f.phaseX += 0.013; f.phaseY += 0.017;
                    const wobbleX = Math.cos(f.wanderAngle) * f.wanderRadius + Math.sin(f.phaseX) * 8 * dpr;
                    const wobbleY = Math.sin(f.wanderAngle * 1.3) * f.wanderRadius * 0.6 + Math.cos(f.phaseY) * 6 * dpr;

                    let targetX = f.homeX + clusterDriftX + wobbleX;
                    let targetY = f.homeY + clusterDriftY + wobbleY;

                    let audioVal = vizDataArray[f.bin] || 0;
                    // Bass đẩy đàn đom đóm bay lên cao, càng gần (depth thấp) càng phản ứng mạnh
                    if (audioVal > 150) targetY -= (audioVal / 255) * 70 * dpr * (1 - f.depth * 0.5);

                    // Nội suy mượt tới vị trí mục tiêu — lớp xa di chuyển chậm hơn (parallax)
                    const followRate = 0.04 + (1 - f.depth) * 0.04;
                    f.x += (targetX - f.x) * followRate;
                    f.y += (targetY - f.y) * followRate;

                    // Nhịp nhấp nháy tự nhiên riêng từng con (như đom đóm thật), được nhạc "tiếp sức" thêm
                    f.blinkPhase += f.blinkSpeed + (audioVal / 255) * 0.05;
                    const naturalBlink = (Math.sin(f.blinkPhase) + 1) / 2; // 0..1, sáng/tắt mượt
                    const audioBoost = (audioVal / 255) * 0.6;
                    let brightness = (0.12 + naturalBlink * 0.55 + audioBoost) * (1 - f.depth * 0.55);
                    brightness = Math.min(1, brightness);

                    const currentRadius = f.radius * (0.7 + naturalBlink * 0.5 + (audioVal / 255) * 0.9);

                    // Màu ấm đặc trưng đom đóm (vàng-lục) ở lớp gần; pha dần sang sắc lạnh của màn đêm ở lớp xa.
                    // Vẫn tôn trọng chế độ màu người dùng đã chọn, chỉ làm nền tự nhiên hơn cho chế độ mặc định.
                    let glowColors;
                    if (vizConfig.mode === 'solid' || vizConfig.mode === 'dynamic') {
                        // Lệch hue nhẹ theo từng cá thể để bầy đàn không "đồng phục" cứng nhắc
                        const baseColor = vizConfig.mode === 'solid' ? vizConfig.solidColor : (f.dynPick ? vizConfig.dynA : vizConfig.dynB);
                        glowColors = { fill: baseColor, glow: baseColor };
                    } else {
                        const fireflyHue = (54 + f.hueJitter - f.depth * 30 + 360) % 360; // vàng-lục ấm -> ngả lục/lam khi xa
                        const sat = 80 - f.depth * 20;
                        const light = 55 + naturalBlink * 15;
                        glowColors = { fill: `hsla(${fireflyHue}, ${sat}%, ${light}%, 0.95)`, glow: `hsl(${fireflyHue}, 100%, ${Math.min(75, light + 15)}%)` };
                    }

                    ctx.beginPath();
                    ctx.arc(f.x, f.y, Math.max(0.1, currentRadius), 0, Math.PI * 2);
                    ctx.fillStyle = glowColors.fill;
                    ctx.globalAlpha = brightness;
                    ctx.shadowBlur = (8 + naturalBlink * 14 + (audioVal/255) * 16) * dpr * (1 - f.depth * 0.4);
                    ctx.shadowColor = glowColors.glow;
                    ctx.fill();
                });
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1.0;
                ctx.globalCompositeOperation = 'source-over';

            } else if (vizConfig.type === 'seasons') {
                const season = getActiveSeason();
                const w = canvas.width, h = canvas.height;

                // Nền trời theo từng mùa (tông màu đặc trưng)
                let skyTop, skyBottom;
                if (season === 'spring') { skyTop = '#fde2e4'; skyBottom = '#fef6e4'; }
                else if (season === 'summer') { skyTop = '#5ec6ea'; skyBottom = '#bfe9c0'; }
                else if (season === 'autumn') { skyTop = '#d98a4b'; skyBottom = '#f3c98b'; }
                else { skyTop = '#1c2530'; skyBottom = '#3a4a5c'; }
                let skyGrad = ctx.createLinearGradient(0, 0, 0, h);
                skyGrad.addColorStop(0, skyTop); skyGrad.addColorStop(1, skyBottom);
                ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, w, h);

                // Mặt trời mùa hè — sáng rực, phản ứng nhẹ theo nhạc
                if (season === 'summer') {
                    const sunX = w * 0.78, sunY = h * 0.22, sunR = (w * 0.07) + smoothedEnergy * 8 * dpr;
                    let sunGlow = ctx.createRadialGradient(sunX, sunY, sunR * 0.3, sunX, sunY, sunR * 2.2);
                    sunGlow.addColorStop(0, 'rgba(255, 245, 180, 0.55)'); sunGlow.addColorStop(1, 'transparent');
                    ctx.fillStyle = sunGlow; ctx.beginPath(); ctx.arc(sunX, sunY, sunR * 2.2, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI*2); ctx.fill();
                }
                // Trăng mùa đông — lạnh, dịu
                if (season === 'winter') {
                    const moonX = w * 0.78, moonY = h * 0.22, moonR = w * 0.06;
                    let moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.3, moonX, moonY, moonR * 2);
                    moonGlow.addColorStop(0, 'rgba(220, 235, 255, 0.35)'); moonGlow.addColorStop(1, 'transparent');
                    ctx.fillStyle = moonGlow; ctx.beginPath(); ctx.arc(moonX, moonY, moonR * 2, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#eef3fb'; ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, Math.PI*2); ctx.fill();
                }

                // Bãi đồi cỏ nền (đổi màu theo mùa: xuân/hạ xanh tươi, thu vàng nâu, đông trắng tuyết)
                let hillColorFar, hillColorNear;
                if (season === 'spring') { hillColorFar = 'rgba(140,190,140,0.85)'; hillColorNear = 'rgba(90,160,95,0.95)'; }
                else if (season === 'summer') { hillColorFar = 'rgba(110,180,110,0.85)'; hillColorNear = 'rgba(70,150,70,0.95)'; }
                else if (season === 'autumn') { hillColorFar = 'rgba(180,140,80,0.85)'; hillColorNear = 'rgba(150,100,55,0.95)'; }
                else { hillColorFar = 'rgba(225,235,245,0.9)'; hillColorNear = 'rgba(240,245,250,0.97)'; }

                seasonHills.forEach((hl, idx) => {
                    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, getHillYAt(hl, 0));
                    const steps = 40;
                    for (let s = 0; s <= steps; s++) { const x = (w/steps)*s; ctx.lineTo(x, getHillYAt(hl, x)); }
                    ctx.lineTo(w, h); ctx.closePath();
                    ctx.fillStyle = idx === seasonHills.length - 1 ? hillColorNear : hillColorFar;
                    ctx.fill();
                });

                // Mái nhà nhỏ riêng cho khung cảnh 4 mùa (không liên quan lều đom đóm)
                if (seasonHouse) {
                    const hx = seasonHouse.x, baseY = seasonHouse.groundY;
                    const wallTop = baseY - seasonHouse.h, wallLeft = hx - seasonHouse.w/2, wallRight = hx + seasonHouse.w/2;
                    ctx.fillStyle = season === 'winter' ? '#5b4636' : '#6b4f3a';
                    ctx.fillRect(wallLeft, wallTop, seasonHouse.w, seasonHouse.h);
                    // Mái nhà tam giác
                    ctx.beginPath();
                    ctx.moveTo(wallLeft - seasonHouse.w*0.1, wallTop);
                    ctx.lineTo(hx, wallTop - seasonHouse.roofH);
                    ctx.lineTo(wallRight + seasonHouse.w*0.1, wallTop);
                    ctx.closePath();
                    ctx.fillStyle = season === 'winter' ? '#3a2c22' : '#3f2c1f'; ctx.fill();
                    // Cửa nhỏ
                    ctx.fillStyle = '#241813';
                    ctx.fillRect(hx - seasonHouse.w*0.1, baseY - seasonHouse.h*0.5, seasonHouse.w*0.2, seasonHouse.h*0.5);

                    // MÙA ĐÔNG: tuyết phủ trên mái nhà
                    if (season === 'winter') {
                        ctx.fillStyle = '#fbfdff';
                        ctx.beginPath();
                        ctx.moveTo(wallLeft - seasonHouse.w*0.13, wallTop);
                        ctx.lineTo(hx, wallTop - seasonHouse.roofH);
                        ctx.lineTo(wallRight + seasonHouse.w*0.13, wallTop);
                        ctx.lineTo(wallRight + seasonHouse.w*0.13, wallTop + seasonHouse.h*0.08);
                        ctx.lineTo(wallLeft - seasonHouse.w*0.13, wallTop + seasonHouse.h*0.08);
                        ctx.closePath(); ctx.fill();
                        // Viền tuyết mềm rủ xuống mép mái
                        ctx.beginPath();
                        for (let s = 0; s <= 6; s++) {
                            const tx = wallLeft - seasonHouse.w*0.13 + (seasonHouse.w*1.26/6)*s;
                            const ty = wallTop + seasonHouse.h*0.08 + Math.sin(s*1.3)*seasonHouse.h*0.04;
                            if (s === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
                        }
                        ctx.lineTo(wallRight + seasonHouse.w*0.13, wallTop); ctx.lineTo(wallLeft - seasonHouse.w*0.13, wallTop); ctx.closePath();
                        ctx.fill();
                    }
                }

                // MÙA HÈ: hoa hướng dương trên sườn đồi, hướng về mặt trời, đung đưa theo nhạc
                if (season === 'summer') {
                    ctx.lineCap = 'round';
                    sunflowers.forEach(f => {
                        f.swayPhase += 0.015 + smoothedEnergy * 0.02;
                        const sway = Math.sin(f.swayPhase) * 5 * dpr * (1 + smoothedEnergy * 0.6);
                        const topX = f.x + sway, topY = f.y - f.h;
                        ctx.strokeStyle = '#3d7a2e'; ctx.lineWidth = 2.5 * dpr;
                        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.quadraticCurveTo(f.x + sway*0.5, f.y - f.h*0.6, topX, topY); ctx.stroke();
                        // Cánh hoa
                        ctx.fillStyle = '#ffd84d';
                        for (let p = 0; p < 10; p++) {
                            const ang = (p / 10) * Math.PI * 2;
                            ctx.beginPath(); ctx.ellipse(topX + Math.cos(ang)*f.size*0.9, topY + Math.sin(ang)*f.size*0.9, f.size*0.45, f.size*0.22, ang, 0, Math.PI*2); ctx.fill();
                        }
                        ctx.fillStyle = '#6b4a1f'; ctx.beginPath(); ctx.arc(topX, topY, f.size*0.5, 0, Math.PI*2); ctx.fill();
                    });
                }

                // Hạt rơi theo mùa: hoa đào (xuân) / lá (thu) / tuyết (đông). Mùa hè không có hạt rơi.
                const perfMult = perf.blurMult > 0 ? 1 : 0.5;
                let targetParticleCount = 0;
                if (season === 'spring') targetParticleCount = Math.floor(90 * perfMult);
                else if (season === 'autumn') targetParticleCount = Math.floor(70 * perfMult);
                else if (season === 'winter') targetParticleCount = Math.floor(110 * perfMult);

                while (seasonParticles.length < targetParticleCount) {
                    seasonParticles.push({
                        x: Math.random() * w, y: Math.random() * h * -1 + Math.random() * h,
                        size: (3 + Math.random() * 4) * dpr,
                        fallSpeed: (0.6 + Math.random() * 1) * dpr,
                        swayPhase: Math.random() * Math.PI * 2,
                        swaySpeed: 0.5 + Math.random() * 0.8,
                        rot: Math.random() * Math.PI * 2,
                        rotSpeed: (Math.random() - 0.5) * 0.04
                    });
                }
                if (seasonParticles.length > targetParticleCount) seasonParticles.length = targetParticleCount;

                if (season === 'autumn') {
                    // Gió thổi mạnh hơn theo nhạc — đẩy lá bay xiên rõ rệt hơn khi nhạc lên
                    const windStrength = (0.6 + smoothedEnergy * 2.2) * dpr;
                    seasonParticles.forEach(p => {
                        p.swayPhase += p.swaySpeed * 0.03;
                        p.y += p.fallSpeed * (0.7 + smoothedEnergy * 0.6);
                        p.x += windStrength + Math.sin(p.swayPhase) * 1.5 * dpr;
                        p.rot += p.rotSpeed + smoothedEnergy * 0.03;
                        if (p.y > h + 10*dpr || p.x > w + 20*dpr) { p.y = -10*dpr; p.x = -20*dpr + Math.random()*w*0.3; }
                        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
                        ctx.fillStyle = p._c || (p._c = ['#c9692f', '#d98a32', '#a8451f', '#e0a83e'][Math.floor(Math.random()*4)]);
                        ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size*0.6, 0, 0, Math.PI*2); ctx.fill();
                        ctx.restore();
                    });
                } else if (season === 'spring') {
                    seasonParticles.forEach(p => {
                        p.swayPhase += p.swaySpeed * 0.025;
                        p.y += p.fallSpeed * 0.6;
                        p.x += Math.sin(p.swayPhase) * 1.2 * dpr;
                        p.rot += p.rotSpeed;
                        if (p.y > h + 10*dpr) { p.y = -10*dpr; p.x = Math.random()*w; }
                        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
                        ctx.fillStyle = 'rgba(255, 200, 215, 0.9)';
                        ctx.beginPath(); ctx.ellipse(0, 0, p.size*0.8, p.size*0.5, 0, 0, Math.PI*2); ctx.fill();
                        ctx.fillStyle = 'rgba(255, 170, 195, 0.6)';
                        ctx.beginPath(); ctx.ellipse(p.size*0.3, 0, p.size*0.5, p.size*0.3, 0.5, 0, Math.PI*2); ctx.fill();
                        ctx.restore();
                    });
                } else if (season === 'winter') {
                    seasonParticles.forEach(p => {
                        p.swayPhase += p.swaySpeed * 0.02;
                        p.y += p.fallSpeed * 0.5;
                        p.x += Math.sin(p.swayPhase) * 0.8 * dpr;
                        if (p.y > h + 10*dpr) { p.y = -10*dpr; p.x = Math.random()*w; }
                        ctx.fillStyle = 'rgba(255,255,255,0.85)';
                        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.1, p.size*0.5), 0, Math.PI*2); ctx.fill();
                    });
                }
                ctx.globalAlpha = 1.0;

            } else if (vizConfig.type === 'rain') {
                ctx.lineCap = 'round'; 
                if (vizConfig.rainStyle === 'classic') {
                    ctx.strokeStyle = `rgba(255,255,255,0.4)`; ctx.lineWidth = 1 * dpr; ctx.beginPath();
                    for(let drop of bgRaindrops) {
                        drop.y += drop.speed + (isPlaying ? smoothedEnergy * 15 : 0);
                        if(drop.y > canvas.height) { drop.y = -drop.length; drop.x = Math.random() * canvas.width; }
                        ctx.moveTo(drop.x, drop.y); ctx.lineTo(drop.x, drop.y - drop.length);
                    }
                    ctx.stroke();

                    const dropCount = Math.floor(bufferLength * 0.2); const maxRipplesAllowed = Math.floor(10 + smoothedEnergy * 15);
                    
                    if (isPlaying) {
                        for (let i = 0; i < dropCount; i += 4) { 
                            let val = vizDataArray[i] || 0;
                            if (val > 150 && Math.random() > 0.85) raindrops.push({ x: Math.random() * canvas.width, y: -20, targetY: (Math.random() * 0.8 + 0.1) * canvas.height, speed: (15 + (val / 255) * 20) * dpr, val: val, idx: i });
                        }
                    }

                    ctx.lineWidth = 2 * dpr;
                    for (let i = raindrops.length - 1; i >= 0; i--) {
                        let drop = raindrops[i]; drop.y += drop.speed; const colors = getComputedColor(drop.idx, dropCount, drop.val);
                        ctx.strokeStyle = colors.fill; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.moveTo(drop.x, drop.y); ctx.lineTo(drop.x, drop.y - 30 * dpr); ctx.stroke();
                        if (drop.y >= drop.targetY) {
                            if (ripples.length < maxRipplesAllowed) ripples.push({ x: drop.x, y: drop.targetY, radius: 5 * dpr, maxRadius: (40 + (drop.val / 255) * 120) * dpr * (1 + smoothedEnergy), speed: (2 + (drop.val / 255) * 3) * dpr, alpha: 1, color: colors.fill, glow: colors.glow });
                            raindrops.splice(i, 1);
                        }
                    }
                    
                    for (let i = ripples.length - 1; i >= 0; i--) {
                        let rip = ripples[i]; rip.radius += rip.speed; rip.alpha -= (rip.speed / rip.maxRadius) * 1.5;
                        if (rip.alpha <= 0) ripples.splice(i, 1);
                        else {
                            ctx.beginPath(); ctx.arc(rip.x, rip.y, Math.max(0.1, rip.radius), 0, Math.PI * 2); 
                            ctx.strokeStyle = rip.color; ctx.globalAlpha = Math.max(0, rip.alpha); ctx.lineWidth = 2 * dpr; ctx.stroke();
                            if (perf.blurMult > 0) { ctx.beginPath(); ctx.arc(rip.x, rip.y, Math.max(0.1, rip.radius), 0, Math.PI * 2); ctx.strokeStyle = rip.glow; ctx.globalAlpha = Math.max(0, rip.alpha * 0.3); ctx.lineWidth = 6 * dpr; ctx.stroke(); }
                        }
                    }
                } else if (vizConfig.rainStyle === 'glass') {
                    if(!vizConfig.videoBgEnabled) { ctx.fillStyle = vizConfig.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
                    let progress = 0; if (audioPlayer && isFinite(audioPlayer.duration) && audioPlayer.duration > 0) progress = audioPlayer.currentTime / audioPlayer.duration;
                    let moonX = canvas.width * 0.70; let moonY = canvas.height * 0.35; let baseScale = 4 + Math.sin(progress * Math.PI) * 1; let baseMoonRadius = baseScale * 8 * dpr; 
                    let dynamicMoonRadius = baseMoonRadius + (smoothedEnergy * 8 * dpr);

                    if(!vizConfig.videoBgEnabled) {
                        ctx.beginPath(); ctx.arc(moonX, moonY, Math.max(0.1, dynamicMoonRadius), 0, Math.PI * 2); ctx.fillStyle = '#e0e8ff';
                        if (perf.blurMult > 0) { ctx.shadowBlur = (30 + smoothedEnergy * 20) * dpr * perf.blurMult; ctx.shadowColor = '#aaccff'; }
                        ctx.globalAlpha = 0.6 + (smoothedEnergy * 0.3); ctx.fill(); ctx.shadowBlur = 0;
                    }

                    if (vizConfig.glassFlash && isPlaying) {
                        let energySpike = smoothedEnergy * ((vizDataArray[3] || 0) / 255); let flashAlpha = energySpike > 0.4 ? (energySpike - 0.4) * 1.2 : 0;
                        if (flashAlpha > 0) { ctx.fillStyle = `rgba(200, 220, 255, ${Math.min(flashAlpha, 0.4)})`; ctx.globalAlpha = 1.0; ctx.fillRect(0, 0, canvas.width, canvas.height); }
                    }

                    if(!vizConfig.videoBgEnabled) {
                        ctx.globalAlpha = 0.4; 
                        cityBuildings.forEach(b => {
                            ctx.fillStyle = '#03060a'; ctx.fillRect(b.x, canvas.height - b.h, b.w, b.h);
                            let winW = 3 * dpr; let winH = 5 * dpr; let paddingX = (b.w - (b.cols * winW)) / (b.cols + 1); let paddingY = (b.h - (b.rows * winH)) / (b.rows + 1);
                            b.windows.forEach(win => {
                                let wx = b.x + paddingX + win.c * (winW + paddingX); let wy = canvas.height - b.h + paddingY + win.r * (winH + paddingY);
                                let isLit = win.isAlwaysOn; let alpha = isLit ? 0.3 : 0;
                                if (isPlaying) { let audioVal = vizDataArray[win.fftBin] || 0; if (audioVal > 140) { isLit = true; alpha = Math.max(alpha, (audioVal / 255) * 0.9); } }
                                if (isLit) { ctx.fillStyle = win.colorType; ctx.globalAlpha = alpha * 0.6; ctx.fillRect(wx, wy, winW, winH); }
                            }); ctx.globalAlpha = 0.4;
                        });
                    }
                    ctx.globalAlpha = 1.0; ctx.fillStyle = 'rgba(10, 15, 25, 0.2)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                    for (let i = 0; i < glassStaticDrops.length; i++) { let drop = glassStaticDrops[i]; drawWaterDrop(ctx, drop.x, drop.y, drop.r, 0.6); }

                    if (isPlaying && smoothedEnergy > 0.4 && Math.random() > perf.streakProb) {
                        let cVal = vizDataArray[Math.floor(Math.random() * 10)] || 0;
                        glassStreaks.push({ x: Math.random() * canvas.width, y: -20, r: (Math.random() * 2 + 1.5) * dpr, speed: (Math.random() * 2 + 3) * dpr, colorVal: cVal });
                    }

                    for (let i = glassStreaks.length - 1; i >= 0; i--) {
                        let streak = glassStreaks[i]; streak.y += streak.speed + (smoothedEnergy * 8 * dpr); streak.x += (Math.random() - 0.5) * 2 * dpr; 
                        for (let j = glassStaticDrops.length - 1; j >= 0; j--) {
                            let drop = glassStaticDrops[j]; let dx = drop.x - streak.x; let dy = drop.y - streak.y;
                            if (dx*dx + dy*dy < (streak.r + drop.r) * (streak.r + drop.r)) {
                                streak.r = Math.min(streak.r + drop.r * 0.3, 4.5 * dpr); glassStaticDrops.splice(j, 1);
                                glassStaticDrops.push({x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: (Math.random() * 1.5 + 0.5) * dpr});
                            }
                        }
                        if (Math.random() > 0.7 && glassStaticDrops.length <= (perf.glassDrops * 2)) glassStaticDrops.push({x: streak.x + (Math.random()-0.5)*4*dpr, y: streak.y - streak.r*1.5, r: Math.max(0.1, streak.r * 0.3)});
                        if(glassStaticDrops.length > (perf.glassDrops * 2) + 50) glassStaticDrops.shift();
                        drawWaterDrop(ctx, streak.x, streak.y, streak.r, 0.9); if (streak.y > canvas.height + 50) glassStreaks.splice(i, 1);
                    }
                    
                    let glassGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                    glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.0)'); glassGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.02)');
                    glassGradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.08)'); glassGradient.addColorStop(0.41, 'transparent'); glassGradient.addColorStop(1, 'transparent');
                    ctx.fillStyle = glassGradient; ctx.fillRect(0, 0, canvas.width, canvas.height); drawWindowFrame(ctx);
                } else {
                    // ============ RAIN STYLE: STREET (Mưa phố & công viên) ============
                    // Nền trời đêm công viên
                    let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
                    skyGrad.addColorStop(0, '#05070d'); skyGrad.addColorStop(1, '#0c1018');
                    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Mưa rơi TỈ LỆ NGHỊCH với năng lượng nhạc: nhạc nhẹ -> mưa to/dày; nhạc mạnh lên -> mưa nhỏ/thưa lại.
                    const rainIntensity = isPlaying ? (1 - smoothedEnergy * 0.75) : 1; // 0.25 (nhạc rất mạnh) .. 1 (nhạc nhẹ/im lặng)
                    const activeRainCount = Math.max(20, Math.floor(streetRain.length * rainIntensity));

                    ctx.strokeStyle = `rgba(200, 215, 230, ${0.35 * rainIntensity + 0.15})`;
                    ctx.lineWidth = (1 + rainIntensity * 0.8) * dpr; ctx.lineCap = 'round';
                    ctx.beginPath();
                    for (let i = 0; i < activeRainCount; i++) {
                        const drop = streetRain[i];
                        drop.y += drop.speed * (0.6 + rainIntensity * 0.8); drop.x += drop.drift * dpr;
                        if (drop.y > canvas.height) { drop.y = -drop.len; drop.x = Math.random() * canvas.width; }
                        if (drop.x < -20 * dpr) drop.x = canvas.width + 20 * dpr; if (drop.x > canvas.width + 20 * dpr) drop.x = -20 * dpr;
                        const dropLen = drop.len * (0.6 + rainIntensity * 0.7);
                        ctx.moveTo(drop.x, drop.y); ctx.lineTo(drop.x + drop.drift * 4 * dpr, drop.y - dropLen);
                    }
                    ctx.stroke();

                    // Vũng nước phản chiếu nhẹ trên nền đất công viên
                    let groundY = canvas.height * 0.88;
                    let groundGrad = ctx.createLinearGradient(0, groundY, 0, canvas.height);
                    groundGrad.addColorStop(0, 'rgba(15, 20, 28, 0.9)'); groundGrad.addColorStop(1, 'rgba(8, 10, 15, 0.95)');
                    ctx.fillStyle = groundGrad; ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

                    // Đèn đường — đèn chính nhấp nháy theo beat/bass, đèn phụ mờ phía xa ổn định hơn
                    streetLamps.forEach(lamp => {
                        const bassKick = isPlaying ? beatScale : 0;
                        // Nhấp nháy: nền sáng ổn định + giật theo bass, mạnh hơn ở đèn chính (depth thấp)
                        const flickerTarget = 0.7 + bassKick * (1 - lamp.depth * 0.6) * 0.9 + (Math.random() < 0.04 ? -0.15 : 0);
                        lamp.flicker += (flickerTarget - lamp.flicker) * 0.25;
                        const glow = Math.max(0.15, Math.min(1.3, lamp.flicker));

                        const postTopY = lamp.baseY - lamp.height;
                        const postW = (lamp.main ? 5 : 3.5) * dpr;

                        // Cột đèn
                        ctx.fillStyle = lamp.depth > 0 ? `rgba(15,18,24,${0.9 - lamp.depth*0.3})` : '#15181f';
                        ctx.fillRect(lamp.x - postW/2, postTopY, postW, lamp.height);
                        // Chụp đèn (hình thang nhỏ)
                        const capW = postW * 3.2;
                        ctx.beginPath();
                        ctx.moveTo(lamp.x - capW/2, postTopY); ctx.lineTo(lamp.x + capW/2, postTopY);
                        ctx.lineTo(lamp.x + capW*0.32, postTopY - capW*0.5); ctx.lineTo(lamp.x - capW*0.32, postTopY - capW*0.5);
                        ctx.closePath(); ctx.fillStyle = '#0c0e12'; ctx.fill();

                        // Quầng sáng đèn — cộng dồn (lighter) để ánh sáng vàng ấm nổi trên nền mưa
                        ctx.save();
                        ctx.globalCompositeOperation = 'lighter';
                        const haloR = (lamp.main ? 140 : 90) * dpr * (1 - lamp.depth * 0.3) * (0.7 + glow * 0.5);
                        let lampGlow = ctx.createRadialGradient(lamp.x, postTopY + 6*dpr, 1, lamp.x, postTopY + 6*dpr, haloR);
                        lampGlow.addColorStop(0, `rgba(255, 210, 130, ${0.55 * glow * (1 - lamp.depth * 0.4)})`);
                        lampGlow.addColorStop(1, 'transparent');
                        ctx.fillStyle = lampGlow; ctx.beginPath(); ctx.arc(lamp.x, postTopY + 6*dpr, haloR, 0, Math.PI*2); ctx.fill();
                        // Bóng đèn nhỏ sáng rõ ngay tâm chụp
                        ctx.fillStyle = `rgba(255, 235, 190, ${Math.min(1, glow)})`;
                        ctx.beginPath(); ctx.arc(lamp.x, postTopY + 6*dpr, (lamp.main ? 5 : 3.5) * dpr, 0, Math.PI*2); ctx.fill();
                        ctx.restore();
                    });

                    // Ghế công viên (silhouette gỗ đơn giản) cạnh đèn chính
                    if (streetBench) {
                        const bx = streetBench.x, by = streetBench.y, bw = streetBench.w, bh = streetBench.h;
                        ctx.fillStyle = '#181a20';
                        // Chân ghế
                        ctx.fillRect(bx - bw/2 + 4*dpr, by, 4*dpr, bh*2.2);
                        ctx.fillRect(bx + bw/2 - 8*dpr, by, 4*dpr, bh*2.2);
                        // Mặt ngồi (vài thanh gỗ ngang)
                        for (let s = 0; s < 3; s++) ctx.fillRect(bx - bw/2, by - bh*0.5*s, bw, bh*0.35);
                        // Lưng ghế
                        for (let s = 0; s < 3; s++) ctx.fillRect(bx - bw/2, by - bh*1.6 - bh*0.45*s, bw, bh*0.3);

                        // Người ngồi trên ghế (silhouette tối giản), tuỳ chọn từ settings
                        if (vizConfig.rainSitter === 'single') {
                            drawSitterSilhouette(ctx, bx, by - bh*0.55, bh, 'm');
                        } else if (vizConfig.rainSitter === 'couple') {
                            const t = vizConfig.rainCoupleType || 'mf';
                            const genderA = t === 'ff' ? 'f' : 'm';
                            const genderB = t === 'mm' ? 'm' : 'f';
                            drawSitterSilhouette(ctx, bx - bw*0.22, by - bh*0.55, bh, genderA);
                            drawSitterSilhouette(ctx, bx + bw*0.22, by - bh*0.55, bh, genderB);
                        }
                    }

                    // Vũng nước lăn tăn dưới chân đèn chính khi nhạc dồn (gợn sóng nhẹ phản chiếu ánh đèn)
                    if (isPlaying && beatScale > 0.55 && Math.random() > 0.92) {
                        const mainLamp = streetLamps.find(l => l.main);
                        if (mainLamp) ripples.push({ x: mainLamp.x + (Math.random()-0.5)*60*dpr, y: groundY + (canvas.height - groundY) * 0.4, radius: 4*dpr, maxRadius: 50*dpr, speed: 1.5*dpr, alpha: 0.5, color: 'rgba(255,210,140,0.6)', glow: 'rgba(255,210,140,0.3)' });
                    }
                    for (let i = ripples.length - 1; i >= 0; i--) {
                        let rip = ripples[i]; rip.radius += rip.speed; rip.alpha -= (rip.speed / rip.maxRadius) * 1.2;
                        if (rip.alpha <= 0) ripples.splice(i, 1);
                        else { ctx.beginPath(); ctx.ellipse(rip.x, rip.y, Math.max(0.1, rip.radius), Math.max(0.1, rip.radius * 0.3), 0, 0, Math.PI*2); ctx.strokeStyle = rip.color; ctx.globalAlpha = Math.max(0, rip.alpha); ctx.lineWidth = 1.5*dpr; ctx.stroke(); }
                    }
                    ctx.globalAlpha = 1.0;
                }
                ctx.globalAlpha = 1.0;

            } else if (vizConfig.type === 'lightning') {
                ctx.lineCap = 'round'; ctx.lineJoin = 'miter';
                let energySpike = smoothedEnergy * ((vizDataArray[5] || 0)/255);
                let flashAlpha = isPlaying && energySpike > 0.35 ? (energySpike - 0.35) * 2.5 : 0;
                if (flashAlpha > 0) { ctx.fillStyle = `rgba(200, 220, 255, ${flashAlpha * 0.5})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }

                if (isPlaying && energySpike > 0.4 && Math.random() > 0.8 && activeLightnings.length < (perf.blurMult > 0 ? 5 : 3)) {
                    let startX = (Math.random() * 0.8 + 0.1) * canvas.width; let boltColor = getComputedColor(Math.floor(Math.random()*10), 10, 255);
                    let bolt = { life: 1.0, color: boltColor, segments: [] }; let cx = startX, cy = 0;
                    while (cy < canvas.height) { let nx = cx + (Math.random() - 0.5) * 120 * dpr; let ny = cy + (Math.random() * 60 + 20) * dpr; bolt.segments.push({x1: cx, y1: cy, x2: nx, y2: ny}); cx = nx; cy = ny; }
                    activeLightnings.push(bolt);
                }

                for (let i = activeLightnings.length - 1; i >= 0; i--) {
                    let b = activeLightnings[i]; b.life -= 0.04 + (1 - Math.min(1, smoothedEnergy)) * 0.06;
                    if (b.life <= 0) { activeLightnings.splice(i, 1); continue; }
                    ctx.beginPath(); b.segments.forEach(seg => { ctx.moveTo(seg.x1, seg.y1); ctx.lineTo(seg.x2, seg.y2); });
                    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3 * dpr * b.life;
                    if (perf.blurMult > 0) { ctx.shadowBlur = 20 * dpr * perf.blurMult; ctx.shadowColor = b.color.glow; }
                    ctx.stroke(); ctx.strokeStyle = b.color.fill; ctx.lineWidth = 8 * dpr * b.life; ctx.globalAlpha = b.life * 0.6; ctx.stroke(); ctx.globalAlpha = 1.0; ctx.shadowBlur = 0;
                }

            } else if (vizConfig.type === 'synthesia') {
                const keysY = canvas.height; const NUM_KEYS = 64; const keyWidth = canvas.width / NUM_KEYS;
                for(let i=0; i<NUM_KEYS; i++) {
                    let val = vizDataArray[i + 5] || 0; let finalHeight = scaledMinH + ((val / 255) * vizConfig.maxH * dpr);
                    let kx = i * keyWidth; let kw = keyWidth * 0.8; let cx = kx + kw/2; const colors = getComputedColor(i, NUM_KEYS, val);
                    ctx.shadowBlur = 10 * dpr * perf.blurMult; ctx.shadowColor = perf.blurMult > 0 ? colors.glow : 'transparent';
                    ctx.fillStyle = colors.fill; ctx.globalAlpha = 0.2; ctx.fillRect(cx - vizConfig.barWidth*dpr/2, keysY - finalHeight, vizConfig.barWidth*dpr, finalHeight);
                    ctx.globalAlpha = 1.0; ctx.beginPath(); ctx.roundRect(cx - vizConfig.barWidth*dpr/2, keysY - finalHeight, vizConfig.barWidth*dpr, Math.max(5, finalHeight * 0.1), 2*dpr); ctx.fill();
                }
                ctx.shadowBlur = 0;

            } else if (vizConfig.type === 'rubik') {
                rubikRotY += (isPlaying ? 0.01 + smoothedEnergy * 0.05 : 0.005); rubikRotX += (isPlaying ? 0.005 + smoothedEnergy * 0.02 : 0.002);
                if (!rubikAnim.active && smoothedEnergy > 0.4 && isPlaying && Math.random() > 0.9) {
                    const axes = ['x', 'y', 'z']; rubikAnim.axis = axes[Math.floor(Math.random() * 3)];
                    rubikAnim.layer = Math.floor(Math.random() * 3) - 1; rubikAnim.dir = Math.random() > 0.5 ? 1 : -1; rubikAnim.angle = 0; rubikAnim.active = true;
                }
                if (rubikAnim.active) { rubikAnim.angle += 0.08 * (1 + smoothedEnergy * 2); if (rubikAnim.angle >= Math.PI / 2) { rubikAnim.angle = Math.PI / 2; rotateRubikIndices(rubikAnim.axis, rubikAnim.layer, rubikAnim.dir); rubikAnim.active = false; rubikAnim.angle = 0; } }
                const cubeSize = Math.min(canvas.width, canvas.height) * 0.08; const spacing = cubeSize * 1.05; const viewDist = cubeSize * 25; const fov = cubeSize * 18; 
                const unitVertices = [{x:-0.5,y:-0.5,z:-0.5}, {x:0.5,y:-0.5,z:-0.5}, {x:0.5,y:0.5,z:-0.5}, {x:-0.5,y:0.5,z:-0.5}, {x:-0.5,y:-0.5,z:0.5}, {x:0.5,y:-0.5,z:0.5}, {x:0.5,y:0.5,z:0.5}, {x:-0.5,y:0.5,z:0.5}];
                const faces = [ [0,1,2,3], [1,5,6,2], [5,4,7,6], [4,0,3,7], [3,2,6,7], [4,5,1,0] ]; let drawnCubes = [];
                for(let i=0; i<rubikCubes.length; i++) {
                    let rc = rubikCubes[i]; let val = vizDataArray[rc.binIdx * 4] || 0; let scaleBounce = 1 + (val / 255) * 0.4; let extraDist = (val / 255) * cubeSize * 1.2 * (isPlaying ? 1 : 0); 
                    let lx = rc.cx * spacing + Math.sign(rc.cx) * extraDist; let ly = rc.cy * spacing + Math.sign(rc.cy) * extraDist; let lz = rc.cz * spacing + Math.sign(rc.cz) * extraDist; let pos = {x: lx, y: ly, z: lz};
                    if (rubikAnim.active && rc['c' + rubikAnim.axis] === rubikAnim.layer) {
                        let currentRot = rubikAnim.angle * rubikAnim.dir;
                        if (rubikAnim.axis === 'x') pos = rotate3D(pos, currentRot, 0, 0); if (rubikAnim.axis === 'y') pos = rotate3D(pos, 0, currentRot, 0); if (rubikAnim.axis === 'z') pos = rotate3D(pos, 0, 0, currentRot);
                    }
                    let cCenter = rotate3D(pos, rubikRotX, rubikRotY, 0); drawnCubes.push({ rc: rc, centerZ: cCenter.z, val: val, pos: pos, scale: scaleBounce });
                }
                drawnCubes.sort((a, b) => b.centerZ - a.centerZ); 
                for(let i=0; i<drawnCubes.length; i++) {
                    let c = drawnCubes[i]; let colors = getComputedColor(c.rc.binIdx, 27, c.val); let projVerts = []; 
                    for(let v=0; v<8; v++) {
                        let uv = unitVertices[v]; let vx = c.pos.x + uv.x * cubeSize * c.scale; let vy = c.pos.y + uv.y * cubeSize * c.scale; let vz = c.pos.z + uv.z * cubeSize * c.scale; let vertPos = {x: vx, y: vy, z: vz};
                        if (rubikAnim.active && c.rc['c' + rubikAnim.axis] === rubikAnim.layer) {
                            let currentRot = rubikAnim.angle * rubikAnim.dir; vertPos.x -= c.pos.x; vertPos.y -= c.pos.y; vertPos.z -= c.pos.z;
                            if (rubikAnim.axis === 'x') vertPos = rotate3D(vertPos, currentRot, 0, 0); if (rubikAnim.axis === 'y') vertPos = rotate3D(vertPos, 0, currentRot, 0); if (rubikAnim.axis === 'z') vertPos = rotate3D(vertPos, 0, 0, currentRot);
                            vertPos.x += c.pos.x; vertPos.y += c.pos.y; vertPos.z += c.pos.z;
                        }
                        let rotV = rotate3D(vertPos, rubikRotX, rubikRotY, 0); projVerts.push(project3D(rotV, fov, viewDist, centerX, centerY));
                    }
                    ctx.lineWidth = 1.5 * dpr; ctx.lineJoin = 'round';
                    for(let f=0; f<6; f++) {
                        let face = faces[f]; let p0 = projVerts[face[0]], p1 = projVerts[face[1]], p2 = projVerts[face[2]];
                        let dx1 = p1.x - p0.x, dy1 = p1.y - p0.y; let dx2 = p2.x - p1.x, dy2 = p2.y - p1.y; let crossZ = dx1 * dy2 - dy1 * dx2;
                        if (crossZ > 0) { 
                            ctx.beginPath(); ctx.moveTo(p0.x, p0.y); for(let vIdx=1; vIdx<4; vIdx++) ctx.lineTo(projVerts[face[vIdx]].x, projVerts[face[vIdx]].y); ctx.closePath();
                            let lightFactor = 0.5 + (f * 0.1); ctx.fillStyle = colors.fill; ctx.globalAlpha = 0.8 * lightFactor; ctx.fill(); ctx.globalAlpha = 1.0; ctx.strokeStyle = vizConfig.bgColor; ctx.stroke();
                        }
                    }
                    if (c.val > 200 && perf.blurMult > 0) {
                        ctx.shadowBlur = 15 * dpr * perf.blurMult; ctx.shadowColor = colors.glow;
                        for(let f=0; f<6; f++) {
                            let face = faces[f]; let p0 = projVerts[face[0]], p1 = projVerts[face[1]], p2 = projVerts[face[2]];
                            let crossZ = (p1.x - p0.x)*(p2.y - p1.y) - (p1.y - p0.y)*(p2.x - p1.x);
                            if(crossZ > 0) { ctx.beginPath(); ctx.moveTo(p0.x, p0.y); for(let vIdx=1; vIdx<4; vIdx++) ctx.lineTo(projVerts[face[vIdx]].x, projVerts[face[vIdx]].y); ctx.closePath(); ctx.strokeStyle = colors.glow; ctx.stroke(); }
                        }
                        ctx.shadowBlur = 0;
                    }
                }

            } else if (vizConfig.type === 'bar') {
                const barWidth = (canvas.width / bufferLength) * 2.5; let x = 0;
                for (let i = 0; i < bufferLength; i++) {
                    let finalHeight = scaledMinH + ((vizDataArray[i] || 0) / 255) * vizConfig.maxH * dpr; if (!vizDataArray[i] || vizDataArray[i] === 0) finalHeight = 0;
                    const colors = getComputedColor(i, bufferLength, vizDataArray[i] || 0);
                    ctx.shadowBlur = 15 * dpr * perf.blurMult; ctx.shadowColor = perf.blurMult > 0 ? colors.glow : 'transparent'; ctx.fillStyle = colors.fill;
                    ctx.beginPath(); ctx.roundRect(x, centerY - finalHeight / 2, vizConfig.barWidth * dpr, finalHeight / 2, 4 * dpr); ctx.fill();
                    ctx.shadowBlur = 0; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.roundRect(x, centerY, vizConfig.barWidth * dpr, finalHeight / 2, 4 * dpr); ctx.fill(); ctx.globalAlpha = 1.0; x += barWidth;
                }
                
            } else if (vizConfig.type === 'black hole') {
                const minDimension = Math.min(canvas.width, canvas.height); const maxDist = Math.max(canvas.width, canvas.height);
                const targetRadius = (minDimension * 0.13) + (smoothedEnergy * minDimension * 0.05);
                smoothedBeatRadius += (targetRadius - smoothedBeatRadius) * 0.15; const currentRadius = smoothedBeatRadius + (beatScale * minDimension * 0.03); 
                let currentSuction = 0.2 + (isPlaying ? smoothedEnergy * 2.5 : 0); 

                if (isPlaying && smoothedEnergy > 0.65) {
                    let flareAlpha = (smoothedEnergy - 0.65) * 2.5; let grad = ctx.createRadialGradient(centerX, centerY, currentRadius, centerX, centerY, currentRadius * 4);
                    grad.addColorStop(0, `hsla(${globalHueOffset}, 100%, 70%, ${flareAlpha * 0.3})`); grad.addColorStop(1, 'transparent');
                    ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                stars.forEach(star => {
                    let distRatio = Math.max(0.05, star.distance / maxDist); let accel = 1 + (0.05 / distRatio); 
                    star.angle += star.baseSpeed * 0.002 * accel; star.distance -= star.baseSpeed * currentSuction * accel;
                    if (star.distance < currentRadius) { 
                        starFlashes.push({ x: centerX + Math.cos(star.angle) * currentRadius, y: centerY + Math.sin(star.angle) * currentRadius, alpha: 1, size: star.size });
                        star.distance = maxDist * (1 + Math.random() * 0.2); star.angle = Math.random() * Math.PI * 2; 
                    }
                    let ratio = star.distance / maxDist; ctx.fillStyle = `rgba(${star.colorTint}, ${0.1 + ratio})`; ctx.beginPath(); 
                    ctx.arc(centerX + Math.cos(star.angle) * star.distance, centerY + Math.sin(star.angle) * star.distance, Math.max(0.1, star.size * ratio + 0.5 * dpr), 0, Math.PI*2); ctx.fill();
                });

                for(let i = starFlashes.length - 1; i >= 0; i--) {
                    let f = starFlashes[i]; f.alpha -= 0.08; f.size += 1.5 * dpr;
                    if(f.alpha <= 0) starFlashes.splice(i, 1);
                    else { ctx.beginPath(); ctx.arc(f.x, f.y, Math.max(0.1, f.size), 0, Math.PI*2); ctx.fillStyle = `rgba(255, 255, 255, ${f.alpha})`; ctx.shadowBlur = 10 * dpr; ctx.shadowColor = 'white'; ctx.fill(); ctx.shadowBlur = 0; }
                }

                const usefulLength = Math.floor(bufferLength * 0.35); let dynamicMaxBarHeight = (vizConfig.maxH / 1000) * (minDimension * 0.25);
                ctx.lineWidth = vizConfig.barWidth * dpr; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

                for (let i = 0; i < usefulLength; i++) {
                    let rawVal = vizDataArray[i] || 0; let freqBoost = 1 + (i / usefulLength) * 1.2; let boostedVal = Math.min(255, rawVal * freqBoost);
                    let val = boostedVal;
                    if (i > 0 && i < usefulLength - 1) {
                        let prev = Math.min(255, (vizDataArray[i-1] || 0) * (1 + ((i-1)/usefulLength)*1.2)); let next = Math.min(255, (vizDataArray[i+1] || 0) * (1 + ((i+1)/usefulLength)*1.2));
                        val = (prev + boostedVal * 3 + next) / 5; 
                    }

                    let normalized = val / 255; let contrastNormalized = Math.pow(normalized, 2.0);
                    let barHeight = scaledMinH + (contrastNormalized * dynamicMaxBarHeight * 1.2); if (!vizDataArray[i] || vizDataArray[i] === 0) barHeight = scaledMinH;
                    
                    let angleOffset = (i / (usefulLength - 1)) * Math.PI; let angleR = (Math.PI / 2) - angleOffset, angleL = (Math.PI / 2) + angleOffset;

                    const colors = getComputedColor(i, usefulLength, val); ctx.strokeStyle = colors.fill; ctx.shadowColor = perf.blurMult > 0 ? colors.glow : 'transparent'; ctx.shadowBlur = 10 * dpr * perf.blurMult; 
                    ctx.beginPath(); ctx.moveTo(centerX + Math.cos(angleR) * currentRadius, centerY + Math.sin(angleR) * currentRadius); ctx.lineTo(centerX + Math.cos(angleR) * (currentRadius + barHeight), centerY + Math.sin(angleR) * (currentRadius + barHeight)); ctx.stroke();
                    if (i !== usefulLength - 1) { ctx.beginPath(); ctx.moveTo(centerX + Math.cos(angleL) * currentRadius, centerY + Math.sin(angleL) * currentRadius); ctx.lineTo(centerX + Math.cos(angleL) * (currentRadius + barHeight), centerY + Math.sin(angleL) * (currentRadius + barHeight)); ctx.stroke(); }
                }
                ctx.shadowBlur = 0;
                ctx.beginPath(); ctx.arc(centerX, centerY, Math.max(0.1, currentRadius), 0, 2 * Math.PI); ctx.fillStyle = vizConfig.bgColor; ctx.fill();

            } else if (vizConfig.type === 'wave') {
                analyser.getByteTimeDomainData(waveTimeDomainArray);
                ctx.lineWidth = vizConfig.barWidth * dpr; ctx.shadowBlur = 20 * dpr * perf.blurMult;
                const mainColors = getComputedColor(0, bufferLength, 128); ctx.shadowColor = perf.blurMult > 0 ? mainColors.glow : 'transparent'; ctx.strokeStyle = mainColors.fill;

                if(vizConfig.mode !== 'solid') {
                    let gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                    for(let i=0; i<=10; i++) gradient.addColorStop(i / 10, getComputedColor(i, 10, 128 + smoothedEnergy * 50).fill);
                    ctx.strokeStyle = gradient; ctx.shadowColor = perf.blurMult > 0 ? 'rgba(255,255,255,0.3)' : 'transparent';
                }

                ctx.beginPath(); const sliceWidth = canvas.width * 1.0 / bufferLength; let x = 0;
                for (let i = 0; i < bufferLength; i++) { const y = ((waveTimeDomainArray[i] || 128) / 128.0) * centerY; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); x += sliceWidth; }
                ctx.lineTo(canvas.width, centerY); ctx.stroke();
            }
        }

        document.addEventListener('DOMContentLoaded', () => { loadConfig(); updateSubToggleUI(); });

