/**
 * Hiển thị / đồng bộ phụ đề theo thời gian thực (updateSubToggleUI, processSubtitles).
 * (Trích từ file gốc, dòng 492-526 trong khối <script>)
 */
        function updateSubToggleUI() {
            if (isSubtitlesEnabled) {
                btnToggleSub.textContent = "Tắt Sub"; btnToggleSub.classList.replace('bg-emerald-500', 'bg-slate-700/80');
                subToggleBadge.classList.remove('hidden'); subtitleDisplay.classList.remove('hidden');
            } else {
                btnToggleSub.textContent = "Bật Sub"; btnToggleSub.classList.replace('bg-slate-700/80', 'bg-emerald-500');
                subToggleBadge.classList.add('hidden'); subtitleDisplay.classList.add('hidden');
            }
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

            if (changed && !subtitleModal.classList.contains('translate-y-full') && editingSubId === null) {
                renderSubList();
            }
        }

        function addActiveSubBlock(sub) {
            const block = document.createElement('p');
            block.id = `sub-active-${sub.id}`;
            block.dataset.subId = sub.id;
            block.dataset.start = sub.start;
            block.className = 'text-xl sm:text-3xl font-bold text-white sub-text-glow leading-snug transition-opacity duration-300 opacity-0';
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
            setTimeout(() => { block.remove(); }, 300);
        }

        function clearAllActiveSubBlocks() {
            if (activeSubIds.size === 0) return;
            activeSubIds.forEach(id => removeActiveSubBlock(id));
            activeSubIds = new Set();
        }

        const noSleep = new NoSleep(); let nativeWakeLock = null;

