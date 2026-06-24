/**
 * Visual RAIN — 2 kiểu (rainStyle):
 *   - 'glass'  : mưa trôi trên ô cửa kính nhìn ra thành phố ban đêm, có trăng. Logic gốc giữ
 *     nguyên 1:1 (chỉ tách hàm flash chớp ra dùng chung với 'street').
 *   - 'street' : mưa phố & công viên về đêm — đèn đường (3 cột, đều chạm mặt đất) + hàng rào
 *     công viên (cọc sắt tĩnh) chạy dọc mặt đất ngay sau lưng các cột đèn. Mặt đất luôn cao hơn
 *     vùng thanh điều khiển dưới cùng. Đèn/nền tô theo vizConfig.mode (đơn sắc/pha trộn/gradient)
 *     thay vì màu cố định, nhấp nháy rõ hơn, và mật độ mưa/hiệu ứng glow co giãn theo
 *     PERFORMANCE_PROFILES.
 *
 * Chớp sáng (vizConfig.glassFlash) dùng CHUNG một hàm cho cả 2 kiểu — bật/tắt một nơi, áp dụng
 * đồng thời cho ô kính ("chớp sáng ngoài ô kính") và đèn đường ("chớp xa" mô phỏng sấm chớp ở
 * đường phố).
 */

        // Chớp sáng dùng chung cho cả 'glass' và 'street': phủ một lớp sáng nhẹ toàn màn hình khi
        // năng lượng nhạc tức thời (energySpike) vượt ngưỡng. flashTint cho phép đổi màu chớp theo
        // ngữ cảnh (glass: ánh trăng hơi xanh; street: ánh đèn sấm chớp trung tính).
        function drawRainFlash(ctx, isPlaying, flashTint) {
            if (!vizConfig.glassFlash || !isPlaying) return;
            let energySpike = smoothedEnergy * ((vizDataArray[3] || 0) / 255);
            let flashAlpha = energySpike > 0.4 ? (energySpike - 0.4) * 1.2 : 0;
            if (flashAlpha > 0) {
                ctx.fillStyle = flashTint(Math.min(flashAlpha, 0.4));
                ctx.globalAlpha = 1.0; ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }

        function drawRainGlass(ctx, perf, isPlaying) {
            if(!vizConfig.videoBgEnabled) { ctx.fillStyle = vizConfig.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); }
            let progress = 0; if (audioPlayer && isFinite(audioPlayer.duration) && audioPlayer.duration > 0) progress = audioPlayer.currentTime / audioPlayer.duration;
            let moonX = canvas.width * 0.70; let moonY = canvas.height * 0.35; let baseScale = 4 + Math.sin(progress * Math.PI) * 1; let baseMoonRadius = baseScale * 8 * dpr; 
            let dynamicMoonRadius = baseMoonRadius + (smoothedEnergy * 8 * dpr);

            if(!vizConfig.videoBgEnabled) {
                ctx.beginPath(); ctx.arc(moonX, moonY, Math.max(0.1, dynamicMoonRadius), 0, Math.PI * 2); ctx.fillStyle = '#e0e8ff';
                if (perf.blurMult > 0) { ctx.shadowBlur = (30 + smoothedEnergy * 20) * dpr * perf.blurMult; ctx.shadowColor = '#aaccff'; }
                ctx.globalAlpha = 0.6 + (smoothedEnergy * 0.3); ctx.fill(); ctx.shadowBlur = 0;
            }

            drawRainFlash(ctx, isPlaying, (a) => `rgba(200, 220, 255, ${a})`);

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

        // Hàng rào kiểu cổng/rào công viên cổ điển — một dãy cọc thẳng đứng nối bằng 2 thanh
        // ngang, chạy dọc suốt chiều ngang màn hình ngay trên mặt đất (groundY). Vẽ tĩnh, màu tối
        // gần với màu nền/cột đèn để gợi cảm giác hàng rào sắt cũ đứng yên trong mưa, không cướp
        // sự chú ý khỏi đèn đường hay mưa.
        function drawParkFence(ctx, groundY) {
            const postSpacing = 26 * dpr;
            const postH = 34 * dpr;
            const postW = 2 * dpr;
            const fenceColor = '#0a0c11';
            const railTopY = groundY - postH * 0.78;
            const railBottomY = groundY - postH * 0.22;

            ctx.fillStyle = fenceColor;
            // 2 thanh ngang nối các cọc
            ctx.fillRect(0, railTopY - dpr, canvas.width, 2 * dpr);
            ctx.fillRect(0, railBottomY - dpr, canvas.width, 2 * dpr);

            // Cọc đứng + đầu cọc nhọn (mác giáo nhỏ) kiểu rào sắt công viên
            for (let x = postSpacing * 0.5; x < canvas.width; x += postSpacing) {
                ctx.fillRect(x - postW / 2, groundY - postH, postW, postH);
                ctx.beginPath();
                ctx.moveTo(x - postW * 1.3, groundY - postH);
                ctx.lineTo(x, groundY - postH - postW * 2.4);
                ctx.lineTo(x + postW * 1.3, groundY - postH);
                ctx.closePath();
                ctx.fill();
            }
        }

        function drawRainStreet(ctx, perf, isPlaying) {
            // Nền: theo chế độ màu đã chọn (đơn sắc/pha trộn/gradient) thay vì cố định 1 tông xanh đêm,
            // để visual luôn nhất quán với màu người dùng đã chọn ở Cài đặt.
            const nightColors = getComputedColor(0, 1, 60);
            let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            if (vizConfig.mode === 'solid') {
                skyGrad.addColorStop(0, '#05070d'); skyGrad.addColorStop(1, interpolateColor('#05070d', vizConfig.solidColor, 0.12));
            } else if (vizConfig.mode === 'dynamic') {
                skyGrad.addColorStop(0, interpolateColor('#05070d', vizConfig.dynA, 0.18));
                skyGrad.addColorStop(1, interpolateColor('#05070d', vizConfig.dynB, 0.18));
            } else {
                skyGrad.addColorStop(0, '#05070d'); skyGrad.addColorStop(1, interpolateColor('#05070d', nightColors.fill, 0.15));
            }
            ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);

            drawRainFlash(ctx, isPlaying, (a) => `rgba(220, 225, 255, ${a * 0.8})`);

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

            // Mặt đất công viên — luôn cao hơn vùng thanh điều khiển dưới cùng (xem getPlayerBarSafeHeight),
            // tô theo chế độ màu đã chọn để đồng nhất với toàn bộ visualizer.
            const groundY = streetGroundY || canvas.height * 0.88;
            let groundGrad = ctx.createLinearGradient(0, groundY, 0, canvas.height);
            if (vizConfig.mode === 'solid') {
                groundGrad.addColorStop(0, interpolateColor('#0f141c', vizConfig.solidColor, 0.08)); groundGrad.addColorStop(1, '#08090f');
            } else if (vizConfig.mode === 'dynamic') {
                groundGrad.addColorStop(0, interpolateColor('#0f141c', vizConfig.dynA, 0.1)); groundGrad.addColorStop(1, interpolateColor('#08090f', vizConfig.dynB, 0.1));
            } else {
                groundGrad.addColorStop(0, 'rgba(15, 20, 28, 0.9)'); groundGrad.addColorStop(1, 'rgba(8, 10, 15, 0.95)');
            }
            ctx.fillStyle = groundGrad; ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

            // Hàng rào công viên — chạy dọc theo mặt đất, NGAY SAU lưng các cột đèn (vẽ trước đèn
            // để đèn/quầng sáng luôn nổi lên trên, không bị hàng rào che mất).
            drawParkFence(ctx, groundY);

            // Đèn đường — đèn chính nhấp nháy theo beat/bass, đèn phụ mờ phía xa ổn định hơn.
            // Màu ánh đèn theo vizConfig.mode (đơn sắc/pha trộn/gradient theo nhạc) thay vì vàng cam cố định.
            streetLamps.forEach((lamp, lampIdx) => {
                const bassKick = isPlaying ? beatScale : 0;
                // Nhấp nháy rõ rệt hơn bản cũ: biên độ giật theo bass lớn hơn + xác suất "chớp tắt" ngẫu
                // nhiên cao hơn một chút để có cảm giác đèn đường cũ kỹ, sống động hơn.
                const flickerTarget = 0.65 + bassKick * (1 - lamp.depth * 0.6) * 1.15 + (Math.random() < 0.06 ? -0.22 : 0);
                lamp.flicker += (flickerTarget - lamp.flicker) * 0.3;
                const glow = Math.max(0.12, Math.min(1.5, lamp.flicker));

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

                // Màu ánh sáng đèn: theo chế độ màu hiện hành (dùng trực tiếp globalAlpha để tương thích
                // mọi định dạng màu trả về — hex ở mode solid/dynamic, hsla() ở mode gradient).
                const lampColor = getComputedColor(lampIdx, streetLamps.length, Math.round(glow * 255));
                let lampFill;
                if (vizConfig.mode === 'solid') lampFill = vizConfig.solidColor;
                else if (vizConfig.mode === 'dynamic') lampFill = lampIdx % 2 === 0 ? vizConfig.dynA : vizConfig.dynB;
                else lampFill = lampColor.fill;

                // Quầng sáng đèn — cộng dồn (lighter) để ánh sáng nổi rõ trên nền mưa
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                const haloR = (lamp.main ? 150 : 95) * dpr * (1 - lamp.depth * 0.3) * (0.7 + glow * 0.55);
                let lampGlow = ctx.createRadialGradient(lamp.x, postTopY + 6*dpr, 1, lamp.x, postTopY + 6*dpr, haloR);
                ctx.globalAlpha = 0.6 * glow * (1 - lamp.depth * 0.4);
                lampGlow.addColorStop(0, lampFill); lampGlow.addColorStop(1, 'transparent');
                ctx.fillStyle = lampGlow; ctx.beginPath(); ctx.arc(lamp.x, postTopY + 6*dpr, haloR, 0, Math.PI*2); ctx.fill();
                // Bóng đèn nhỏ sáng rõ ngay tâm chụp
                ctx.globalAlpha = Math.min(1, glow);
                ctx.fillStyle = lampFill;
                ctx.beginPath(); ctx.arc(lamp.x, postTopY + 6*dpr, (lamp.main ? 5 : 3.5) * dpr, 0, Math.PI*2); ctx.fill();
                ctx.globalAlpha = 1.0;
                ctx.restore();
            });

            // Vũng nước lăn tăn dưới chân đèn chính khi nhạc dồn (gợn sóng nhẹ phản chiếu ánh đèn)
            if (isPlaying && beatScale > 0.55 && Math.random() > 0.92) {
                const mainLamp = streetLamps.find(l => l.main);
                if (mainLamp) {
                    const rippleColors = getComputedColor(0, 1, 200);
                    ripples.push({ x: mainLamp.x + (Math.random()-0.5)*60*dpr, y: groundY + (canvas.height - groundY) * 0.4, radius: 4*dpr, maxRadius: 50*dpr, speed: 1.5*dpr, alpha: 0.5, color: rippleColors.fill, glow: rippleColors.glow });
                }
            }
            for (let i = ripples.length - 1; i >= 0; i--) {
                let rip = ripples[i]; rip.radius += rip.speed; rip.alpha -= (rip.speed / rip.maxRadius) * 1.2;
                if (rip.alpha <= 0) ripples.splice(i, 1);
                else { ctx.beginPath(); ctx.ellipse(rip.x, rip.y, Math.max(0.1, rip.radius), Math.max(0.1, rip.radius * 0.3), 0, 0, Math.PI*2); ctx.strokeStyle = rip.color; ctx.globalAlpha = Math.max(0, rip.alpha); ctx.lineWidth = 1.5*dpr; ctx.stroke(); }
            }
            ctx.globalAlpha = 1.0;
        }

        function drawRain(ctx, perf, isPlaying) {
            ctx.lineCap = 'round';
            if (vizConfig.rainStyle === 'street') drawRainStreet(ctx, perf, isPlaying);
            else drawRainGlass(ctx, perf, isPlaying);
        }
