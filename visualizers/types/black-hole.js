/**
 * Visual BLACK HOLE — các "sao" bị hút dần vào tâm hố đen, kèm tia sáng bùng phát khi nhạc dồn
 * và dải cột tần số bao quanh viền hố đen. Logic gốc giữ nguyên 1:1.
 */
        function drawBlackHole(ctx, perf, isPlaying) {
            const centerX = canvas.width / 2, centerY = canvas.height / 2;
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

            const bufferLength = analyser.frequencyBinCount;
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
                const scaledMinH = vizConfig.minH * dpr;
                let barHeight = scaledMinH + (contrastNormalized * dynamicMaxBarHeight * 1.2); if (!vizDataArray[i] || vizDataArray[i] === 0) barHeight = scaledMinH;
                
                let angleOffset = (i / (usefulLength - 1)) * Math.PI; let angleR = (Math.PI / 2) - angleOffset, angleL = (Math.PI / 2) + angleOffset;

                const colors = getComputedColor(i, usefulLength, val); ctx.strokeStyle = colors.fill; ctx.shadowColor = perf.blurMult > 0 ? colors.glow : 'transparent'; ctx.shadowBlur = 10 * dpr * perf.blurMult; 
                ctx.beginPath(); ctx.moveTo(centerX + Math.cos(angleR) * currentRadius, centerY + Math.sin(angleR) * currentRadius); ctx.lineTo(centerX + Math.cos(angleR) * (currentRadius + barHeight), centerY + Math.sin(angleR) * (currentRadius + barHeight)); ctx.stroke();
                if (i !== usefulLength - 1) { ctx.beginPath(); ctx.moveTo(centerX + Math.cos(angleL) * currentRadius, centerY + Math.sin(angleL) * currentRadius); ctx.lineTo(centerX + Math.cos(angleL) * (currentRadius + barHeight), centerY + Math.sin(angleL) * (currentRadius + barHeight)); ctx.stroke(); }
            }
            ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.arc(centerX, centerY, Math.max(0.1, currentRadius), 0, 2 * Math.PI); ctx.fillStyle = vizConfig.bgColor; ctx.fill();
        }
