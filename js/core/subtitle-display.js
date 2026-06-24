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
            if (!isSubtitlesEnabled || subtitles.length === 0) return;
            // Khi có nhiều dòng chồng lấn thời gian (overlap), ưu tiên hiển thị dòng có
            // thời điểm BẮT ĐẦU gần nhất với hiện tại (dòng "mới" nhất đang hiệu lực).
            // Điều này đảm bảo: dòng nào bắt đầu sau sẽ thay thế dòng đang hiện, và khi nó
            // kết thúc, nếu vẫn còn dòng khác đang hiệu lực thì dòng đó được hiện tiếp ngay
            // theo đúng thứ tự — không bị "kẹt" ở dòng bắt đầu sớm nhất như trước.
            let foundIndex = -1;
            for (let i = 0; i < subtitles.length; i++) {
                let s = subtitles[i];
                if (currentTime >= s.start && currentTime <= s.end) {
                    if (foundIndex === -1 || s.start > subtitles[foundIndex].start) { foundIndex = i; }
                }
            }

            if (foundIndex !== currentActiveSubIndex) {
                let oldIndex = currentActiveSubIndex; currentActiveSubIndex = foundIndex;
                if(!subtitleModal.classList.contains('translate-y-full')) {
                    if (oldIndex !== -1) { let oldCard = document.getElementById(`sub-card-${oldIndex}`); if(oldCard && editingSubId !== subtitles[oldIndex].id) renderSubList(); }
                    if (foundIndex !== -1) { let newCard = document.getElementById(`sub-card-${foundIndex}`); if(newCard && editingSubId !== subtitles[foundIndex].id) renderSubList(); }
                }
                if (foundIndex !== -1) {
                    let lines = subtitles[foundIndex].text.split('\n'); subLine1.innerHTML = lines[0] || ''; subLine2.innerHTML = lines[1] || ''; subtitleDisplay.classList.remove('opacity-0');
                } else {
                    subtitleDisplay.classList.add('opacity-0'); setTimeout(() => { if (currentActiveSubIndex === -1) { subLine1.innerHTML = ''; subLine2.innerHTML = ''; } }, 300);
                }
            }
        }

        const noSleep = new NoSleep(); let nativeWakeLock = null;

