/**
 * Visual WAVE — dạng dao động sóng âm (oscilloscope) chạy ngang toàn màn hình.
 */
        function drawWave(ctx, perf) {
            const centerY = canvas.height / 2;
            const bufferLength = analyser.frequencyBinCount;
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
