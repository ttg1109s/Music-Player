/**
 * Các hàm vẽ canvas dùng chung giữa nhiều hiệu ứng (giọt nước, khung cửa kính, nốt nhạc bay lên).
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
            taskManager.once(() => { if (note.parentNode) note.parentNode.removeChild(note); }, 1500);
        }
