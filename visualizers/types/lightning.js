/**
 * Visual LIGHTNING — chớp sấm sét bay ngang màn hình, cường độ/độ dài tia phản ứng theo năng
 * lượng nhạc tức thời (energySpike). Logic gốc giữ nguyên 1:1.
 */
        function drawLightning(ctx, perf, isPlaying) {
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
        }
