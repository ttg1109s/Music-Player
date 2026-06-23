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
                // 1. Cập nhật đường ống bay (Cinematic Path)
                if(isPlaying && smoothedEnergy > 0.6 && Math.random() > 0.9) rollNewVortexCurve();
                updateVortexCurveLerp();

                // 2. Cập nhật tốc độ bay (Gia tốc mượt theo nhạc)
                const targetWarpSpeed = 10 + smoothedEnergy * 40;
                tWarpSpeed += (targetWarpSpeed - tWarpSpeed) * 0.05;
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
                        if(vizConfig.mode === 'gradient') ring.material.color.setStyle(color.fill);
                        else ring.material.color.setStyle(idx % 2 === 0 ? vizConfig.dynA : vizConfig.dynB);
                    });
                }

                // -> STYLE: BARS 3D
                else if (vizConfig.vortexStyle === 'bars') {
                    const dummy = new THREE.Object3D();
                    for(let r=0; r<BARS_RINGS_COUNT; r++) {
                        // Tính toán Z "ảo" cho ring này
                        let z = -(r / BARS_RINGS_COUNT) * TUNNEL_DEPTH + (tCurrentWarpZ % (TUNNEL_DEPTH / BARS_RINGS_COUNT));
                        if(z > tCurrentWarpZ + 200) z -= TUNNEL_DEPTH;
                        
                        const center = getVortexCenterAt(z);
                        const val = vizDataArray[r % 40] || 0;
                        const barScaleY = 1 + (val/255) * 8 * smoothedEnergy;

                        for(let b=0; b<BARS_PER_RING; b++) {
                            const ang = (b / BARS_PER_RING) * Math.PI * 2;
                            dummy.position.set(center.x + Math.cos(ang)*350, center.y + Math.sin(ang)*350, z);
                            dummy.rotation.set(0, 0, ang - Math.PI/2);
                            dummy.scale.set(1, barScaleY, 1);
                            dummy.updateMatrix();
                            tBarsMesh.setMatrixAt(r * BARS_PER_RING + b, dummy.matrix);
                            
                            const color = getComputedColor(b, BARS_PER_RING, val);
                            tBarsMesh.setColorAt(r * BARS_PER_RING + b, new THREE.Color(color.fill));
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
                        if(vizConfig.mode === 'gradient') wave.material.color.setStyle(color.fill);
                        else wave.material.color.setStyle(idx % 2 === 0 ? vizConfig.dynA : vizConfig.dynB);
                    });
                }

                // 4. Cinematic Camera — bám theo độ cong của ống (trái/phải/trên/dưới), không rung giật theo beat
                const camTargetPos = getVortexCenterAt(tCurrentWarpZ);
                // Camera bắt kịp chậm rãi (Smooth damping)
                tCamera.position.x += (camTargetPos.x - tCamera.position.x) * 0.08;
                tCamera.position.y += (camTargetPos.y - tCamera.position.y) * 0.08;
                tCamera.position.z = tCurrentWarpZ;

                // LookAt điểm phía trước một đoạn, theo đúng đường cong của ống (không lắc ngẫu nhiên)
                const lookAheadZ = tCurrentWarpZ - 800;
                const lookPos = getVortexCenterAt(lookAheadZ);
                tCamera.lookAt(lookPos.x, lookPos.y, lookAheadZ);

                // "Hít thở" tiêu cự (FOV) rất nhẹ theo năng lượng nhạc — tạo cảm giác camera đi sâu vào/lùi ra
                // khỏi đường hầm theo tiếng nhạc, mượt mà, không giật cục như sway cũ
                const targetFov = 75 - smoothedEnergy * 6;
                tCamera.fov += (targetFov - tCamera.fov) * 0.04;
                tCamera.updateProjectionMatrix();

                tRenderer.render(tScene, tCamera);
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const centerY = canvas.height / 2, centerX = canvas.width / 2, scaledMinH = vizConfig.minH * dpr;

            // ================== RỪNG ĐOM ĐÓM (FIREFLY FOREST 3.0 - SWARM HỮU CƠ) ==================
            if (vizConfig.type === 'firefly_forest') {
                // Mặt trăng
                let moonRadius = (canvas.width * 0.1) + (smoothedEnergy * 10 * dpr);
                ctx.beginPath(); ctx.arc(canvas.width * 0.8, canvas.height * 0.25, moonRadius, 0, Math.PI * 2);
                let moonGrad = ctx.createRadialGradient(canvas.width * 0.8, canvas.height * 0.25, moonRadius * 0.2, canvas.width * 0.8, canvas.height * 0.25, moonRadius);
                moonGrad.addColorStop(0, 'rgba(200, 230, 255, 0.4)'); moonGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = moonGrad; ctx.fill();

                // Lớp cây (vẽ trước đom đóm xa, sau đom đóm gần — bố trí lại bên dưới theo layer)
                trees.forEach(t => {
                    t.swayPhase += 0.01 + (smoothedEnergy * 0.02);
                    let swayX = Math.sin(t.swayPhase) * 10 * dpr * (1 - t.layer * 0.2);
                    ctx.fillStyle = t.color; ctx.beginPath();
                    ctx.moveTo(t.x + swayX, canvas.height - t.height); 
                    ctx.lineTo(t.x + t.baseW/2, canvas.height); 
                    ctx.lineTo(t.x - t.baseW/2, canvas.height); 
                    ctx.closePath(); ctx.fill();
                });

                // Sương mù khí quyển mỏng phía xa — tạo lớp không gian giữa cây và đàn đom đóm
                fireflyMist.forEach(m => {
                    m.phase += 0.003 + smoothedEnergy * 0.004;
                    let mx = m.x + Math.sin(m.phase) * 20 * dpr;
                    let mistGrad = ctx.createRadialGradient(mx, m.y, 0, mx, m.y, m.r);
                    mistGrad.addColorStop(0, 'rgba(140, 170, 160, 0.05)');
                    mistGrad.addColorStop(1, 'transparent');
                    ctx.fillStyle = mistGrad;
                    ctx.beginPath(); ctx.arc(mx, m.y, m.r, 0, Math.PI * 2); ctx.fill();
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
                } else {
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

