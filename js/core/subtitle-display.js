/**
 * Hiển thị / đồng bộ phụ đề theo thời gian thực (updateSubToggleUI, processSubtitles).
 * (Trích từ file gốc, dòng 492-526 trong khối <script>)
 */
        function updateSubToggleUI() {
            if (isSubtitlesEnabled) {
                btnToggleSub.textContent = "Tắt Sub"; btnToggleSub.classList.replace('bg-emerald-500', 'bg-slate-700/80');
                subToggleBadge.classList.remove('hidden');
            } else {
                btnToggleSub.textContent = "Bật Sub"; btnToggleSub.classList.replace('bg-slate-700/80', 'bg-emerald-500');
                subToggleBadge.classList.add('hidden');
            }
        }

        // Khung phụ đề chỉ thực sự hiện (chiếm chỗ trên màn hình) khi có ít nhất 1 dòng
        // đang active — tránh hiển thị 1 khung nền trống gây cảm giác "thiếu nội dung"
        // trong những đoạn nhạc không có phụ đề nào đang chạy.
        function updateSubtitleFrameVisibility() {
            if (subActiveLines.children.length > 0) subtitleDisplay.classList.remove('hidden');
            else subtitleDisplay.classList.add('hidden');
        }

        // Áp style khung (nền/viền/bo góc) + style chữ phụ đề từ vizConfig.subtitleStyle
        // lên DOM thật. Được gọi lúc loadConfig() và mỗi khi người dùng đổi 1 setting.
        function applySubtitleStyle() {
            const s = vizConfig.subtitleStyle;
            const bgRgb = hexToRgb(s.bgColor);
            subtitleFrame.style.backgroundColor = `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, ${s.bgOpacity})`;
            const borderRgb = hexToRgb(s.borderColor);
            subtitleFrame.style.borderColor = `rgba(${borderRgb.r}, ${borderRgb.g}, ${borderRgb.b}, ${s.borderOpacity})`;
            subtitleFrame.style.borderWidth = `${s.borderWidth}px`;
            subtitleFrame.style.borderRadius = `${s.borderRadius}px`;
            subtitleFrame.style.backdropFilter = s.bgOpacity > 0 ? 'blur(12px)' : 'none';
            subActiveLines.style.color = s.textColor;
            subActiveLines.style.fontSize = `${s.fontSize}px`;
        }

        function processSubtitles(currentTime) {
            if (!isSubtitlesEnabled) { clearAllActiveSubBlocks(); return; }

            // Tập các phụ đề đang trong khoảng hiệu lực [start, end] tại thời điểm hiện tại.
            // Khác với trước (chỉ giữ 1 dòng active), giờ TẤT CẢ phụ đề chồng lấn nhau đều
            // được tính là active cùng lúc — mỗi dòng có 1 khối DOM riêng (append khi bắt đầu,
            // remove khi kết thúc), nên N dòng overlap có thể hiển thị đồng thời.
            const nowActive = new Map(); // id -> sub object
            for (let i = 0; i < subtitles.length; i++) {
                const s = subtitles[i];
                if (currentTime >= s.start && currentTime <= s.end) nowActive.set(s.id, s);
            }

            let changed = false;

            // Dòng vừa hết hiệu lực: fade-out rồi xoá khối DOM tương ứng.
            activeSubIds.forEach(id => {
                if (!nowActive.has(id)) {
                    changed = true;
                    removeActiveSubBlock(id);
                }
            });

            // Dòng vừa bắt đầu hiệu lực: thêm khối DOM mới, chèn đúng vị trí theo thời gian
            // bắt đầu tăng dần (dòng bắt đầu trước nằm trên, dòng mới hơn thêm vào dưới).
            nowActive.forEach((sub, id) => {
                if (!activeSubIds.has(id)) {
                    changed = true;
                    addActiveSubBlock(sub);
                }
            });

            activeSubIds = new Set(nowActive.keys());

            if (changed) {
                updateSubtitleFrameVisibility();
                if (!subtitleModal.classList.contains('translate-y-full') && editingSubId === null) renderSubList();
            }
        }

        function addActiveSubBlock(sub) {
            const block = document.createElement('p');
            block.id = `sub-active-${sub.id}`;
            block.dataset.subId = sub.id;
            block.dataset.start = sub.start;
            block.className = 'font-bold sub-text-glow leading-snug transition-opacity duration-300 opacity-0';
            block.innerHTML = sub.text.replace(/\n/g, '<br>');

            // Chèn đúng vị trí theo start tăng dần trong số các khối đang hiển thị.
            let inserted = false;
            for (const child of subActiveLines.children) {
                if (parseFloat(child.dataset.start) > sub.start) { subActiveLines.insertBefore(block, child); inserted = true; break; }
            }
            if (!inserted) subActiveLines.appendChild(block);

            requestAnimationFrame(() => block.classList.remove('opacity-0'));
        }

        function removeActiveSubBlock(id) {
            const block = document.getElementById(`sub-active-${id}`);
            if (!block) return;
            block.classList.add('opacity-0');
            setTimeout(() => { block.remove(); updateSubtitleFrameVisibility(); }, 300);
        }

        function clearAllActiveSubBlocks() {
            if (activeSubIds.size === 0) return;
            activeSubIds.forEach(id => removeActiveSubBlock(id));
            activeSubIds = new Set();
        }

        const noSleep = new NoSleep(); let nativeWakeLock = null;

