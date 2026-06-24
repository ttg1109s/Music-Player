/**
 * Visual BAR — gộp 2 kiểu (trước đây là 2 visual riêng: "bar" và "synthesia"):
 *   - barStyle 'mirror'  : Phản chiếu — dải cánh bướm, số lượng thanh mỗi bên TÙY CHỈNH 10-32
 *     qua setting (vizConfig.mirrorBarCount, mặc định 32), mỗi bar đối xứng trên/dưới quanh
 *     centerY, cộng một vòng tròn ở tâm đập theo beat nhạc với ĐỘ TO cũng tùy chỉnh qua setting
 *     (vizConfig.mirrorCircleSize, % so với kích thước màn hình). Bố cục dải bar LUÔN dựa trên
 *     một bán kính tâm cơ sở cố định nhỏ — dải KHÔNG co giãn theo độ to vòng tròn người dùng
 *     chọn; nếu chọn vòng tròn to, nó có thể chồng lấn lên các thanh gần tâm (đánh đổi được người
 *     dùng chấp nhận khi bật setting này). Hai bên ĐỐI XỨNG GƯƠNG thật qua tâm: tại cùng một
 *     khoảng cách từ tâm, bên trái và bên phải dùng CÙNG một bin tần số (binLeft === binRight)
 *     nên độ cao bar luôn bằng nhau hai bên — đúng nghĩa "phản chiếu". Slot GẦN tâm lấy bin
 *     CAO (treble), slot XA tâm (gần mép màn hình) lấy bin THẤP (bass, biên độ thường lớn hơn)
 *     -> bar có xu hướng cao dần khi ra xa tâm, giống nhau ở cả hai cánh.
 *   - barStyle 'cascade' : Thác đổ — giữ nguyên cách vẽ của visual "synthesia" cũ (các "phím" rơi
 *     xuống đáy màn hình theo tần số). Độ dày mỗi phím tự tính theo độ rộng slot của bố cục 64
 *     phím, KHÔNG còn phụ thuộc setting "Độ dày thanh" (cùng lý do với 'mirror' ở trên).
 */
        const BAR_MIRROR_COUNT_PER_SIDE = 32;

        function drawBarMirror(ctx, perf) {
            const centerX = canvas.width / 2, centerY = canvas.height / 2;
            const halfWidth = canvas.width / 2;
            const maxBarLen = vizConfig.maxH * dpr * 0.5;

            // Số lượng thanh mỗi bên: tùy chỉnh 10-32 qua setting (mirrorBarCount). Mặc định 32
            // (hành vi gốc) nếu chưa từng đặt.
            const barCount = Math.max(10, Math.min(32, vizConfig.mirrorBarCount || BAR_MIRROR_COUNT_PER_SIDE));

            // Bố cục dải bar LUÔN dựa trên bán kính tâm CƠ SỞ cố định nhỏ (centerCircleBaseR) —
            // dải bar không co giãn theo độ to vòng tròn người dùng chọn ở setting. Điều này giữ
            // số lượng/khoảng cách các thanh ổn định dù vòng tròn to nhỏ thế nào.
            const centerCircleBaseR = Math.min(canvas.width, canvas.height) * 0.018;
            const barSlotWidth = (halfWidth - centerCircleBaseR) / barCount;
            const maxBin = analyser.frequencyBinCount * 0.5;

            for (let i = 0; i < barCount; i++) {
                // Khoảng cách từ tâm tới vị trí slot hiện tại (cùng khoảng cho cả trái và phải).
                // Slot 0 (i=0) bắt đầu ngay tại rìa vòng tròn CƠ SỞ; slot cuối ở ngoài cùng (mép màn hình).
                const distFromCenter = centerCircleBaseR + i * barSlotWidth;
                const slotW = barSlotWidth * 0.6;

                // ĐỐI XỨNG GƯƠNG THẬT: cùng khoảng cách từ tâm (cùng chỉ số slot i) -> cùng một
                // bin tần số cho cả hai bên (binLeft === binRight luôn). Đảo chiều map so với
                // trước: slot GẦN tâm (i nhỏ) lấy bin CAO (treble), slot XA tâm (i lớn, gần mép
                // màn hình) lấy bin THẤP (bass). Vì bass thường có biên độ lớn hơn treble, kết quả
                // là bar XA tâm cao hơn, bar GẦN tâm thấp hơn — đúng ý đồ ban đầu.
                const bin = Math.floor(((barCount - 1 - i) / barCount) * maxBin);
                const val = vizDataArray[bin] || 0;
                let len = val ? (val / 255) * maxBarLen : 0;

                const rx = centerX + distFromCenter;
                const lx = centerX - distFromCenter - slotW;

                const colors = getComputedColor(i, barCount, val);
                ctx.shadowBlur = 15 * dpr * perf.blurMult;
                ctx.shadowColor = perf.blurMult > 0 ? colors.glow : 'transparent';
                ctx.fillStyle = colors.fill;
                // Bên phải
                ctx.beginPath(); ctx.roundRect(rx, centerY - len, slotW, len, 3 * dpr); ctx.fill();
                ctx.beginPath(); ctx.roundRect(rx, centerY, slotW, len, 3 * dpr); ctx.fill();
                // Bên trái (gương — cùng giá trị len, cùng màu)
                ctx.beginPath(); ctx.roundRect(lx, centerY - len, slotW, len, 3 * dpr); ctx.fill();
                ctx.beginPath(); ctx.roundRect(lx, centerY, slotW, len, 3 * dpr); ctx.fill();
            }
            ctx.shadowBlur = 0;

            // Vòng tròn tâm — độ to tùy chỉnh qua setting (mirrorCircleSize, % so với kích thước
            // màn hình). Đây là bán kính NỀN của vòng tròn (chưa cộng phần đập theo beat); khi
            // người dùng đặt to, vòng tròn có thể chồng lấn lên các thanh bar gần tâm — đây là
            // đánh đổi đã được chấp nhận, dải bar KHÔNG co giãn lại để né vòng tròn.
            const circleSizePercent = (vizConfig.mirrorCircleSize != null) ? vizConfig.mirrorCircleSize : 1.8;
            const circleBaseR = Math.min(canvas.width, canvas.height) * (circleSizePercent / 100);
            const pulseColors = getComputedColor(0, 1, Math.round(beatScale * 255));
            const pulseR = circleBaseR + beatScale * circleBaseR * 1.8 + smoothedEnergy * circleBaseR * 0.6;
            ctx.beginPath(); ctx.arc(centerX, centerY, Math.max(0.1, pulseR), 0, Math.PI * 2);
            ctx.fillStyle = pulseColors.fill;
            if (perf.blurMult > 0) { ctx.shadowBlur = 18 * dpr * perf.blurMult; ctx.shadowColor = pulseColors.glow; }
            ctx.fill(); ctx.shadowBlur = 0;
        }

        function drawBarCascade(ctx, perf) {
            // Logic gốc của visual "synthesia" cũ — các "phím" trải đều theo chiều ngang, mỗi
            // phím rơi từ trên xuống đáy màn hình theo cường độ tần số tương ứng. Độ dày mỗi phím
            // không còn lấy từ setting "Độ dày thanh" (setting đó giờ chỉ dùng cho Black Hole) —
            // thay vào đó tự tính theo độ rộng slot (kw) để luôn khớp đều với bố cục 64 phím.
            const scaledMinH = vizConfig.minH * dpr;
            const keysY = canvas.height; const NUM_KEYS = 64; const keyWidth = canvas.width / NUM_KEYS;
            for(let i=0; i<NUM_KEYS; i++) {
                let val = vizDataArray[i + 5] || 0; let finalHeight = scaledMinH + ((val / 255) * vizConfig.maxH * dpr);
                let kx = i * keyWidth; let kw = keyWidth * 0.8; let cx = kx + kw/2; const colors = getComputedColor(i, NUM_KEYS, val);
                ctx.shadowBlur = 10 * dpr * perf.blurMult; ctx.shadowColor = perf.blurMult > 0 ? colors.glow : 'transparent';
                ctx.fillStyle = colors.fill; ctx.globalAlpha = 0.2; ctx.fillRect(cx - kw/2, keysY - finalHeight, kw, finalHeight);
                ctx.globalAlpha = 1.0; ctx.beginPath(); ctx.roundRect(cx - kw/2, keysY - finalHeight, kw, Math.max(5, finalHeight * 0.1), 2*dpr); ctx.fill();
            }
            ctx.shadowBlur = 0;
        }

        function drawBar(ctx, perf) {
            if (vizConfig.barStyle === 'cascade') drawBarCascade(ctx, perf);
            else drawBarMirror(ctx, perf);
        }
