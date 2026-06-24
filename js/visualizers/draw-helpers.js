/**
 * Các hàm vẽ canvas dùng chung giữa nhiều hiệu ứng (giọt nước, khung cửa kính, người đứng/standee, nốt nhạc bay lên).
 * (Trích từ file gốc, dòng 1084-1116 trong khối <script>)
 */
        function drawWaterDrop(ctx, x, y, r, alpha=1) {
            let safeR = Math.max(0.1, r); 
            ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(x, y, safeR, 0, Math.PI*2); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
            ctx.beginPath(); ctx.arc(x, y+safeR*0.2, safeR*0.8, 0, Math.PI*2); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
            ctx.beginPath(); ctx.arc(x-safeR*0.3, y-safeR*0.3, safeR*0.2, 0, Math.PI*2); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill(); ctx.globalAlpha = 1;
        }

        function drawWindowFrame(ctx) {
            let fw = 25 * dpr; let midW = 15 * dpr; 
            ctx.fillStyle = '#11131a'; 
            ctx.fillRect(0, 0, canvas.width, fw); ctx.fillRect(0, canvas.height - fw, canvas.width, fw);
            ctx.fillRect(0, 0, fw, canvas.height); ctx.fillRect(canvas.width - fw, 0, fw, canvas.height);
            ctx.fillRect(canvas.width/2 - midW/2, 0, midW, canvas.height); ctx.fillRect(0, canvas.height/2 - midW/2, canvas.width, midW);
            
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(fw, fw, canvas.width/2 - fw - midW/2, 2*dpr); 
            ctx.fillRect(canvas.width/2 + midW/2, fw, canvas.width/2 - fw - midW/2, 2*dpr);
            ctx.fillRect(fw, canvas.height/2 - midW/2, canvas.width/2 - fw - midW/2, 2*dpr); ctx.fillRect(canvas.width/2 + midW/2, canvas.height/2 - midW/2, canvas.width/2 - fw - midW/2, 2*dpr);
            
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(canvas.width/2 - midW/2 - 2*dpr, 0, 2*dpr, canvas.height); ctx.fillRect(0, canvas.height/2 + midW/2, canvas.width, 2*dpr); 
        }

        function spawnFlyingNote() {
            if (frameCounter % 8 !== 0) return;
            const symbols = ['♪', '♫', '♩', '♬'];
            const note = document.createElement('div'); note.className = 'music-note'; note.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            const offsetX = Math.random() * 40 - 20; const offsetY = Math.random() * 20 - 10;
            note.style.left = `calc(50% + ${offsetX}px)`; note.style.top = `calc(50% + ${offsetY}px)`;
            note.style.color = `hsl(${globalHueOffset + Math.random()*60}, 100%, 70%)`; recordContainer.appendChild(note);
            setTimeout(() => { if (note.parentNode) note.parentNode.removeChild(note); }, 1500);
        }

        // Vẽ silhouette người đứng đơn giản (tối giản, đồng bộ phong cách vector của visualizer).
        // baseX/baseY: điểm chân đứng trên mặt đất. scaleH: đơn vị chiều cao tham chiếu của người.
        // gender: 'm' (dáng tóc ngắn, vai rộng hơn) | 'f' (tóc dài ngang vai, eo thu hẹp hơn).
        function drawStandingSilhouette(ctx, baseX, baseY, scaleH, gender, swayPhase) {
            const sway = Math.sin(swayPhase) * scaleH * 0.015; // đung đưa rất nhẹ, như đứng chờ dưới mưa
            const s = scaleH;
            const headR = s * 0.09;
            const shoulderW = gender === 'f' ? s * 0.2 : s * 0.26;
            const torsoH = s * 0.42;
            const legH = s * 0.46;
            const headCenterY = baseY - legH - torsoH - headR;
            const topX = baseX + sway;

            ctx.fillStyle = '#0a0b0e';

            // Thân (hình thang đơn giản: hẹp ở cổ, rộng ở hông)
            ctx.beginPath();
            ctx.moveTo(baseX - shoulderW * 0.42, baseY - legH);
            ctx.lineTo(topX - shoulderW * 0.5, headCenterY + headR * 1.5);
            ctx.lineTo(topX + shoulderW * 0.5, headCenterY + headR * 1.5);
            ctx.lineTo(baseX + shoulderW * 0.42, baseY - legH);
            ctx.closePath();
            ctx.fill();

            // Đầu
            ctx.beginPath(); ctx.arc(topX, headCenterY, headR, 0, Math.PI * 2); ctx.fill();

            // Tóc: nam ngắn gọn ôm đầu; nữ dài phủ xuống ngang vai
            if (gender === 'f') {
                ctx.beginPath();
                ctx.moveTo(topX - headR * 0.95, headCenterY - headR * 0.2);
                ctx.quadraticCurveTo(topX - headR * 1.3, headCenterY + headR * 2.0, topX - headR * 0.5, headCenterY + headR * 2.4);
                ctx.lineTo(topX - headR * 0.3, headCenterY + headR * 0.6);
                ctx.closePath(); ctx.fill();
                ctx.beginPath();
                ctx.moveTo(topX + headR * 0.95, headCenterY - headR * 0.2);
                ctx.quadraticCurveTo(topX + headR * 1.3, headCenterY + headR * 2.0, topX + headR * 0.5, headCenterY + headR * 2.4);
                ctx.lineTo(topX + headR * 0.3, headCenterY + headR * 0.6);
                ctx.closePath(); ctx.fill();
            } else {
                ctx.beginPath(); ctx.arc(topX, headCenterY - headR * 0.1, headR * 1.05, Math.PI, Math.PI * 2); ctx.fill();
            }

            // Cánh tay buông dọc thân
            const armW = s * 0.045;
            ctx.fillRect(baseX - shoulderW * 0.46 - armW * 0.5 + sway * 0.6, headCenterY + headR * 1.6, armW, torsoH * 0.85);
            ctx.fillRect(baseX + shoulderW * 0.46 - armW * 0.5 + sway * 0.6, headCenterY + headR * 1.6, armW, torsoH * 0.85);

            // Hai chân đứng thẳng, hơi tách
            const legW = s * 0.085;
            ctx.fillRect(baseX - shoulderW * 0.26, baseY - legH, legW, legH);
            ctx.fillRect(baseX + shoulderW * 0.26 - legW, baseY - legH, legW, legH);
        }

