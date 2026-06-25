/**
 * Module phụ đề: parse/build SRT, render danh sách sub, sửa/xóa/thêm dòng sub, auto-timing, export .srt.
 * (Trích từ file gốc, dòng 315-433 trong khối <script>)
 */
        function secToStr(sec) {
            if (isNaN(sec)) return "00:00:00,000";
            let h = Math.floor(sec / 3600); let m = Math.floor((sec % 3600) / 60); let s = Math.floor(sec % 60); let ms = Math.floor((sec % 1) * 1000);
            return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')},${ms.toString().padStart(3,'0')}`;
        }
        function strToSec(str) {
            let parts = str.trim().split(/[:,]/); if (parts.length !== 4) return 0;
            return parseInt(parts[0])*3600 + parseInt(parts[1])*60 + parseInt(parts[2]) + parseInt(parts[3])/1000;
        }

        function parseSRT(data) {
            const regex = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n([\s\S]*?)(?=\n\n|\n*$)/g;
            let result = []; let match;
            while ((match = regex.exec(data)) !== null) result.push({ id: Date.now() + Math.random(), displayId: match[1], start: strToSec(match[2]), end: strToSec(match[3]), startStr: match[2], endStr: match[3], text: match[4] });
            return result;
        }

        function buildSRTString() {
            let out = ""; subtitles.forEach((s, i) => { out += `${i+1}\n${s.startStr} --> ${s.endStr}\n${s.text}\n\n`; }); return out.trim();
        }

        function renderSubList() {
            subListContainer.innerHTML = '';
            if (subtitles.length === 0) { subListContainer.appendChild(subEmptyState); subEmptyState.classList.remove('hidden'); return; }
            subEmptyState.classList.add('hidden');
            subtitles.sort((a,b) => a.start - b.start); 
            
            subtitles.forEach((sub, index) => {
                const isEditing = editingSubId === sub.id; const isActive = activeSubIds.has(sub.id);
                const card = document.createElement('div');
                card.className = `sub-item-block group transition-all border-b border-white/5 ${isActive ? 'bg-emerald-900/30' : 'hover:bg-white/5'}`;
                card.id = `sub-card-${index}`;

                if (isEditing) {
                    card.classList.add('sub-edit-mode');
                    card.innerHTML = `
                        <div class="flex flex-col sm:flex-row gap-3 px-5 py-3">
                            <div class="flex-grow flex flex-col gap-2">
                                <div class="flex items-center gap-2">
                                    <input type="text" id="edit-start-${sub.id}" value="${sub.startStr}" class="w-32 text-center text-sky-300 bg-black/60 border border-slate-600 rounded" placeholder="00:00:00,000">
                                    <span class="text-slate-500">--></span>
                                    <input type="text" id="edit-end-${sub.id}" value="${sub.endStr}" class="w-32 text-center text-sky-300 bg-black/60 border border-slate-600 rounded" placeholder="00:00:00,000">
                                </div>
                                <textarea id="edit-text-${sub.id}" rows="2" class="w-full text-white bg-black/60 border border-slate-600 rounded resize-none" placeholder="Nhập nội dung sub...">${sub.text}</textarea>
                            </div>
                            <div class="flex sm:flex-col gap-2 shrink-0 justify-end sm:justify-start mt-2 sm:mt-0">
                                <button onclick="saveSubItem('${sub.id}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded shadow transition-colors">Lưu</button>
                                <button onclick="deleteSubItem('${sub.id}')" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded shadow transition-colors">Xóa</button>
                            </div>
                        </div>`;
                } else {
                    let formattedText = sub.text.replace(/\n/g, '<br>');
                    card.innerHTML = `
                        <div class="flex justify-between items-center gap-4 px-5 py-3 cursor-pointer" onclick="editSubItem('${sub.id}')">
                            <div class="flex-grow">
                                <div class="text-xs font-mono text-sky-400 mb-1 flex items-center gap-2">
                                    ${isActive ? '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>' : ''}
                                    ${sub.startStr} <span class="text-slate-500">⟶</span> ${sub.endStr}
                                </div>
                                <div class="text-sm font-medium text-slate-200 line-clamp-2">${formattedText}</div>
                            </div>
                            <div class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </div>
                        </div>`;
                }
                subListContainer.appendChild(card);
            });
        }

        window.editSubItem = function(id) { editingSubId = id; renderSubList(); };
        window.saveSubItem = function(id) {
            let sub = subtitles.find(s => s.id === id); if(!sub) return;
            sub.startStr = document.getElementById(`edit-start-${id}`).value; sub.endStr = document.getElementById(`edit-end-${id}`).value; sub.text = document.getElementById(`edit-text-${id}`).value;
            sub.start = strToSec(sub.startStr); sub.end = strToSec(sub.endStr);
            editingSubId = null; renderSubList();
        };
        window.deleteSubItem = function(id) { subtitles = subtitles.filter(s => s.id !== id); editingSubId = null; renderSubList(); };
        
        function resetAutoSub() {
            autoSubStartTime = null;
            btnAutoTiming.classList.remove('bg-red-500', 'animate-pulse'); btnAutoTiming.classList.add('bg-rose-600');
            iconAutoTimingRecording.classList.add('hidden'); iconAutoTimingIdle.classList.remove('hidden');
        }

        btnAutoTiming.addEventListener('click', () => {
            if (autoSubStartTime === null) {
                autoSubStartTime = audioPlayer.currentTime; btnAutoTiming.classList.remove('bg-rose-600'); btnAutoTiming.classList.add('bg-red-500', 'animate-pulse');
                iconAutoTimingIdle.classList.add('hidden'); iconAutoTimingRecording.classList.remove('hidden');
            } else {
                let endTime = audioPlayer.currentTime;
                if (endTime < autoSubStartTime) { let temp = autoSubStartTime; autoSubStartTime = endTime; endTime = temp; }
                let newSub = { id: Date.now().toString(), start: autoSubStartTime, end: endTime, startStr: secToStr(autoSubStartTime), endStr: secToStr(endTime), text: "(Nhập nội dung...)" };
                subtitles.push(newSub); resetAutoSub(); renderSubList();
                setTimeout(() => { document.getElementById('sub-list-container').scrollTop = document.getElementById('sub-list-container').scrollHeight; }, 100);
            }
        });

        btnAddSub.addEventListener('click', () => {
            let lastSub = subtitles[subtitles.length - 1]; let newStart = lastSub ? lastSub.end + 0.1 : 0; let newEnd = newStart + 2;
            let newSub = { id: Date.now().toString(), start: newStart, end: newEnd, startStr: secToStr(newStart), endStr: secToStr(newEnd), text: "Dòng phụ đề mới..." };
            subtitles.push(newSub); editingSubId = newSub.id; renderSubList();
            setTimeout(() => { document.getElementById('sub-list-container').scrollTop = document.getElementById('sub-list-container').scrollHeight; }, 100);
        });

        btnExportSrt.addEventListener('click', () => {
            if(subtitles.length === 0) { alert("Chưa có phụ đề để xuất!"); return; }
            const blob = new Blob([buildSRTString()], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob); const a = document.createElement('a');
            const cached = currentKey ? playlistCache.get(currentKey) : null;
            a.href = url; a.download = `${cached?.tag?.title || 'VisualMaster_Sub'}.srt`; a.click(); URL.revokeObjectURL(url);
        });

        srtUpload.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader(); reader.onload = (evt) => { subtitles = parseSRT(evt.target.result); renderSubList(); }; reader.readAsText(file);
        });

        btnApplySub.addEventListener('click', async () => {
            editingSubId = null; resetAutoSub(); renderSubList();
            // Tự bật lại "Hiện phụ đề" nếu đang tắt — người dùng vừa soạn xong, hợp lý là muốn xem
            // ngay. Đồng bộ LUÔN vào vizConfig + lưu (ver 8 refine) để checkbox trong Cài đặt khớp
            // với trạng thái thật, không chỉ đổi biến runtime như trước.
            if (!isSubtitlesEnabled) {
                isSubtitlesEnabled = true;
                vizConfig.subtitlesEnabled = true;
                saveConfig();
                updateSubToggleUI();
            }
            subtitleModal.classList.add('translate-y-full'); clearAllActiveSubBlocks();

            // Ghi đè subtitles của bài hiện tại vào IndexedDB — điểm xác nhận + persist duy nhất.
            if (currentKey) {
                const record = await getSongRecord(currentKey);
                if (record) { record.subtitles = subtitles.slice(); await setSongRecord(currentKey, record); }
            }

            if (!audioPlayer.paused || audioPlayer.currentTime > 0) { audioPlayer.currentTime = 0; audioPlayer.play(); }
        });

