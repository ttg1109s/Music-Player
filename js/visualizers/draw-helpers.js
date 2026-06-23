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
            setTimeout(() => { if (note.parentNode) note.parentNode.removeChild(note); }, 1500);
        }

        // Vẽ silhouette người ngồi đơn giản (tối giản, đồng bộ phong cách vector của visualizer).
        // baseX/baseY: điểm hông ngồi trên ghế. scaleH: đơn vị chiều cao tham chiếu (= chiều cao ghế).
        // gender: 'm' (dáng tóc ngắn, vai rộng hơn) | 'f' (tóc dài ngang vai, eo thu hẹp hơn).
        function drawSitterSilhouette(ctx, baseX, baseY, scaleH, gender) {
            const s = scaleH * 2.4; // tỉ lệ tổng thể người so với đơn vị ghế
            const headR = s * 0.16;
            const shoulderW = gender === 'f' ? s * 0.34 : s * 0.42;
            const torsoH = s * 0.55;
            const headCenterY = baseY - torsoH - headR;

            ctx.fillStyle = '#0a0b0e';

            // Thân (hình thang đơn giản: hẹp ở cổ, rộng ở hông)
            ctx.beginPath();
            ctx.moveTo(baseX - shoulderW * 0.5, baseY);
            ctx.lineTo(baseX - shoulderW * 0.42, headCenterY + headR * 1.6);
            ctx.lineTo(baseX + shoulderW * 0.42, headCenterY + headR * 1.6);
            ctx.lineTo(baseX + shoulderW * 0.5, baseY);
            ctx.closePath();
            ctx.fill();

            // Đầu
            ctx.beginPath(); ctx.arc(baseX, headCenterY, headR, 0, Math.PI * 2); ctx.fill();

            // Tóc: nam ngắn gọn ôm đầu; nữ dài phủ xuống ngang vai
            if (gender === 'f') {
                ctx.beginPath();
                ctx.moveTo(baseX - headR * 0.95, headCenterY - headR * 0.2);
                ctx.quadraticCurveTo(baseX - headR * 1.3, headCenterY + headR * 2.2, baseX - headR * 0.5, headCenterY + headR * 2.6);
                ctx.lineTo(baseX - headR * 0.3, headCenterY + headR * 0.6);
                ctx.closePath(); ctx.fill();
                ctx.beginPath();
                ctx.moveTo(baseX + headR * 0.95, headCenterY - headR * 0.2);
                ctx.quadraticCurveTo(baseX + headR * 1.3, headCenterY + headR * 2.2, baseX + headR * 0.5, headCenterY + headR * 2.6);
                ctx.lineTo(baseX + headR * 0.3, headCenterY + headR * 0.6);
                ctx.closePath(); ctx.fill();
            } else {
                ctx.beginPath(); ctx.arc(baseX, headCenterY - headR * 0.1, headR * 1.05, Math.PI, Math.PI * 2); ctx.fill();
            }

            // Cánh tay buông dọc thân, tay đặt lên đùi (gợi ý ngồi tĩnh lặng)
            const armW = s * 0.07;
            ctx.fillRect(baseX - shoulderW * 0.46 - armW * 0.5, headCenterY + headR * 1.7, armW, torsoH * 0.55);
            ctx.fillRect(baseX + shoulderW * 0.46 - armW * 0.5, headCenterY + headR * 1.7, armW, torsoH * 0.55);

            // Chân gập ngồi, đùi hướng ra phía trước ghế
            const legW = s * 0.16;
            ctx.fillRect(baseX - shoulderW * 0.32, baseY, legW, s * 0.22);
            ctx.fillRect(baseX + shoulderW * 0.32 - legW, baseY, legW, s * 0.22);
        }

        const SEASON_ORDER = ['spring', 'summer', 'autumn', 'winter'];

        // Trả về mùa thực sự sẽ render ở frame hiện tại, tuỳ theo vizConfig.seasonMode:
        // - 'fixed': luôn dùng đúng mùa người dùng chọn trong settings.
        // - 'songRandom': bốc ngẫu nhiên 1 mùa mỗi khi chuyển sang bài hát mới (giữ nguyên trong suốt bài).
        // - 'music': mùa phản ứng theo năng lượng nhạc hiện tại (êm -> Xuân/Đông tĩnh lặng, mạnh -> Hè/Thu sôi động).
        function getActiveSeason() {
            if (vizConfig.seasonMode === 'songRandom') {
                if (currentIndex !== lastSeasonSongIndex) {
                    lastSeasonSongIndex = currentIndex;
                    currentSeasonRuntime = SEASON_ORDER[Math.floor(Math.random() * SEASON_ORDER.length)];
                }
                return currentSeasonRuntime;
            }
            if (vizConfig.seasonMode === 'music') {
                // Năng lượng thấp + nhịp chậm -> mùa tĩnh (Đông/Xuân); năng lượng cao -> mùa động (Hè/Thu)
                const e = smoothedEnergy;
                if (e < 0.18) return 'winter';
                if (e < 0.4) return 'spring';
                if (e < 0.7) return 'autumn';
                return 'summer';
            }
            return vizConfig.seasonFixed || 'spring';
        }

