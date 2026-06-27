/**
 * Visual VORTEX — cập nhật mỗi khung hình cho đường ống bay xuyên không gian dựng bằng Three.js
 * (khởi tạo scene/camera/group nằm ở js/core/three-vortex.js, hàm initThreeJS()). File này chỉ
 * chứa phần cập nhật vị trí/màu/camera mỗi frame, gọi từ vòng lặp render chính. Logic gốc giữ
 * nguyên 1:1.
 */
        function drawVortex(perf, isPlaying) {
            if (!tInitialized) return;
            const bufferLength = analyser.frequencyBinCount;

            // 1. Cập nhật đường ống bay (Cinematic Path) — đổi hướng thưa hơn và nhẹ nhàng hơn để tránh giật
            if(isPlaying && smoothedEnergy > 0.65 && Math.random() > 0.985) rollNewVortexCurve();
            updateVortexCurveLerp();

            // 2. Cập nhật tốc độ bay (Gia tốc rất mượt theo nhạc, tránh tăng/giảm tốc đột ngột)
            const targetWarpSpeed = 10 + smoothedEnergy * 40;
            tWarpSpeed += (targetWarpSpeed - tWarpSpeed) * 0.025;
            tCurrentWarpZ -= tWarpSpeed; // Bay sâu vào âm Z

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
