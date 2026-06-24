/**
 * Visual BAR — gộp 2 kiểu (trước đây là 2 visual riêng: "bar" và "synthesia"):
 *   - barStyle 'mirror'  : Phản chiếu — dải cánh bướm 64 bar (32 bar mỗi bên trục giữa màn
 *     hình), mỗi bar đối xứng trên/dưới quanh centerY, cộng một vòng tròn nhỏ tại tâm đập theo
 *     beat nhạc. Dải bar bắt đầu sát rìa vòng tròn tâm (không có khoảng hở) và trải đều ra tới
 *     mép màn hình. Hai bên KHÔNG đối xứng gương về xu hướng độ cao — đây là chủ đích thiết kế:
 *       + Bên TRÁI : xa tâm cao -> gần tâm thấp (giảm dần khi tới gần vòng tròn).
 *       + Bên PHẢI : gần tâm thấp -> xa tâm cao (tăng dần khi ra xa vòng tròn).
 *     Cả hai vẫn nhảy động theo nhạc thật (độ cao mỗi bar = biên độ bin tần số tương ứng); xu
 *     hướng trên chỉ là cách map vị trí slot -> bin tần số (xem binRight/binLeft trong
 *     drawBarMirror), không phải giá trị cố định.
 *   - barStyle 'cascade' : Thác đổ — giữ nguyên 100% cách vẽ của visual "synthesia" cũ (các
 *     "phím" rơi xuống đáy màn hình theo tần số), chỉ đổi tên hiển thị trong UI.
 */
        const BAR_MIRROR_COUNT_PER_SIDE = 32;

        function drawBarMirror(ctx, perf) {
            const centerX = canvas.width / 2, centerY = canvas.height / 2;
            const halfWidth = canvas.width / 2;
            const barW = Math.max(1, vizConfig.barWidth * dpr);
            const maxBarLen = vizConfig.maxH * dpr * 0.5;

            // Vòng tròn tâm: bán kính CƠ SỞ (không đập theo beat) dùng làm điểm neo cho dải bar —
            // để dải luôn bắt đầu sát rìa vòng tròn, không "nhảy" ra/vào theo nhạc.
            const centerCircleBaseR = Math.min(canvas.width, canvas.height) * 0.018;

            // Vùng còn lại sau khi trừ đi bán kính vòng tròn tâm, chia đều cho 32 slot mỗi bên —
            // slot đầu tiên (i=0, sát tâm) bắt đầu ngay tại rìa vòng tròn (distFromCenter = centerCircleBaseR).
            const barSlotWidth = (halfWidth - centerCircleBaseR) / BAR_MIRROR_COUNT_PER_SIDE;
            const maxBin = analyser.frequencyBinCount * 0.5;

            for (let i = 0; i < BAR_MIRROR_COUNT_PER_SIDE; i++) {
                // Khoảng cách từ tâm tới vị trí slot hiện tại (cùng khoảng cho cả trái và phải).
                // Slot 0 (i=0) bắt đầu ngay tại rìa vòng tròn tâm; slot 31 ở ngoài cùng (mép màn hình).
                const distFromCenter = centerCircleBaseR + i * barSlotWidth;
                const slotW = barSlotWidth * 0.6;

                // BÊN PHẢI: gần tâm THẤP -> xa tâm CAO. Bin tần số thấp (bass) ở slot gần tâm,
                // bin cao (treble) ở slot ngoài rìa — độ cao bar tăng dần ra ngoài theo cùng chiều.
                const binRight = Math.floor((i / BAR_MIRROR_COUNT_PER_SIDE) * maxBin);
                const valRight = vizDataArray[binRight] || 0;
                let lenRight = valRight ? (valRight / 255) * maxBarLen : 0;

                // BÊN TRÁI: xa tâm CAO -> gần tâm THẤP (ngược lại bên phải). Đảo chỉ số slot khi
                // tra bin, để slot ngoài rìa (i nhỏ về phía mép) nhận bin ứng với biên độ lớn hơn
                // ở vị trí xa, và giảm dần khi tới gần tâm.
                const binLeft = Math.floor(((BAR_MIRROR_COUNT_PER_SIDE - 1 - i) / BAR_MIRROR_COUNT_PER_SIDE) * maxBin);
                const valLeft = vizDataArray[binLeft] || 0;
                let lenLeft = valLeft ? (valLeft / 255) * maxBarLen : 0;

                const rx = centerX + distFromCenter;
                const lx = centerX - distFromCenter - slotW;

                const colorsRight = getComputedColor(i, BAR_MIRROR_COUNT_PER_SIDE, valRight);
                ctx.shadowBlur = 15 * dpr * perf.blurMult;
                ctx.shadowColor = perf.blurMult > 0 ? colorsRight.glow : 'transparent';
                ctx.fillStyle = colorsRight.fill;
                ctx.beginPath(); ctx.roundRect(rx, centerY - lenRight, slotW, lenRight, 3 * dpr); ctx.fill();
                ctx.beginPath(); ctx.roundRect(rx, centerY, slotW, lenRight, 3 * dpr); ctx.fill();

                const colorsLeft = getComputedColor(BAR_MIRROR_COUNT_PER_SIDE - 1 - i, BAR_MIRROR_COUNT_PER_SIDE, valLeft);
                ctx.shadowColor = perf.blurMult > 0 ? colorsLeft.glow : 'transparent';
                ctx.fillStyle = colorsLeft.fill;
                ctx.beginPath(); ctx.roundRect(lx, centerY - lenLeft, slotW, lenLeft, 3 * dpr); ctx.fill();
                ctx.beginPath(); ctx.roundRect(lx, centerY, slotW, lenLeft, 3 * dpr); ctx.fill();
            }
            ctx.shadowBlur = 0;

            // Vòng tròn nhỏ ở tâm, đập theo beat (bass) của nhạc.
            const pulseColors = getComputedColor(0, 1, Math.round(beatScale * 255));
            const pulseR = centerCircleBaseR + beatScale * centerCircleBaseR * 1.8 + smoothedEnergy * centerCircleBaseR * 0.6;
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
