/**
 * Visual BAR — gộp 2 kiểu (trước đây là 2 visual riêng: "bar" và "synthesia"):
 *   - barStyle 'mirror'  : Phản chiếu — dải cánh bướm 64 bar (32 bar mỗi bên trục giữa màn
 *     hình), mỗi bar đối xứng cả trái/phải lẫn trên/dưới quanh centerY, cộng một vòng tròn nhỏ
 *     tại tâm đập theo beat nhạc. Đây là bản thiết kế lại của visual "bar" cũ (đã bỏ phần kính
 *     mờ alpha=0.3 phía dưới của bản gốc).
 *   - barStyle 'cascade' : Thác đổ — giữ nguyên 100% cách vẽ của visual "synthesia" cũ (các
 *     "phím" rơi xuống đáy màn hình theo tần số), chỉ đổi tên hiển thị trong UI.
 */
        const BAR_MIRROR_COUNT_PER_SIDE = 32;

        function drawBarMirror(ctx, perf) {
            const centerX = canvas.width / 2, centerY = canvas.height / 2;
            const halfWidth = canvas.width / 2;
            const barSlotWidth = halfWidth / BAR_MIRROR_COUNT_PER_SIDE;
            const barW = Math.max(1, vizConfig.barWidth * dpr);
            const maxBarLen = vizConfig.maxH * dpr * 0.5;

            for (let i = 0; i < BAR_MIRROR_COUNT_PER_SIDE; i++) {
                // Dồn các bin tần số thấp (âm trầm) gần tâm, bin cao ra ngoài rìa — cảm giác cánh bướm tự nhiên.
                const bin = Math.floor((i / BAR_MIRROR_COUNT_PER_SIDE) * (analyser.frequencyBinCount * 0.5));
                const val = vizDataArray[bin] || 0;
                let len = (val / 255) * maxBarLen;
                if (!val) len = 0;

                const colors = getComputedColor(i, BAR_MIRROR_COUNT_PER_SIDE, val);
                ctx.shadowBlur = 15 * dpr * perf.blurMult;
                ctx.shadowColor = perf.blurMult > 0 ? colors.glow : 'transparent';
                ctx.fillStyle = colors.fill;

                // Khoảng cách từ tâm tới vị trí slot hiện tại (cùng khoảng cho cả trái và phải).
                const distFromCenter = i * barSlotWidth + barSlotWidth * 0.2;
                const slotW = barSlotWidth * 0.6;

                // 4 góc: phải-trên, phải-dưới, trái-trên, trái-dưới — đối xứng hoàn toàn (cánh bướm).
                const rx = centerX + distFromCenter;
                const lx = centerX - distFromCenter - slotW;

                ctx.beginPath(); ctx.roundRect(rx, centerY - len, slotW, len, 3 * dpr); ctx.fill();
                ctx.beginPath(); ctx.roundRect(rx, centerY, slotW, len, 3 * dpr); ctx.fill();
                ctx.beginPath(); ctx.roundRect(lx, centerY - len, slotW, len, 3 * dpr); ctx.fill();
                ctx.beginPath(); ctx.roundRect(lx, centerY, slotW, len, 3 * dpr); ctx.fill();
            }
            ctx.shadowBlur = 0;

            // Vòng tròn nhỏ ở tâm, đập theo beat (bass) của nhạc.
            const pulseColors = getComputedColor(0, 1, Math.round(beatScale * 255));
            const baseR = Math.min(canvas.width, canvas.height) * 0.018;
            const pulseR = baseR + beatScale * baseR * 1.8 + smoothedEnergy * baseR * 0.6;
            ctx.beginPath(); ctx.arc(centerX, centerY, Math.max(0.1, pulseR), 0, Math.PI * 2);
            ctx.fillStyle = pulseColors.fill;
            if (perf.blurMult > 0) { ctx.shadowBlur = 18 * dpr * perf.blurMult; ctx.shadowColor = pulseColors.glow; }
            ctx.fill(); ctx.shadowBlur = 0;
        }

        function drawBarCascade(ctx, perf) {
            // Logic gốc 1:1 của visual "synthesia" cũ — các "phím" trải đều theo chiều ngang,
            // mỗi phím rơi từ trên xuống đáy màn hình theo cường độ tần số tương ứng.
            const scaledMinH = vizConfig.minH * dpr;
            const keysY = canvas.height; const NUM_KEYS = 64; const keyWidth = canvas.width / NUM_KEYS;
            for(let i=0; i<NUM_KEYS; i++) {
                let val = vizDataArray[i + 5] || 0; let finalHeight = scaledMinH + ((val / 255) * vizConfig.maxH * dpr);
                let kx = i * keyWidth; let kw = keyWidth * 0.8; let cx = kx + kw/2; const colors = getComputedColor(i, NUM_KEYS, val);
                ctx.shadowBlur = 10 * dpr * perf.blurMult; ctx.shadowColor = perf.blurMult > 0 ? colors.glow : 'transparent';
                ctx.fillStyle = colors.fill; ctx.globalAlpha = 0.2; ctx.fillRect(cx - vizConfig.barWidth*dpr/2, keysY - finalHeight, vizConfig.barWidth*dpr, finalHeight);
                ctx.globalAlpha = 1.0; ctx.beginPath(); ctx.roundRect(cx - vizConfig.barWidth*dpr/2, keysY - finalHeight, vizConfig.barWidth*dpr, Math.max(5, finalHeight * 0.1), 2*dpr); ctx.fill();
            }
            ctx.shadowBlur = 0;
        }

        function drawBar(ctx, perf) {
            if (vizConfig.barStyle === 'cascade') drawBarCascade(ctx, perf);
            else drawBarMirror(ctx, perf);
        }
