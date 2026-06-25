/**
 * playlist/loader.js — Nạp file mới (file picker) + quét nhanh store `songs` lúc khởi động.
 *
 * Sửa lỗi v6 (mục 2 + 6): SAU MỖI lần thêm bài, LUÔN gọi recomputeRenderOrder() rồi
 * renderPlaylistDiff() nên DANH SÁCH HIỂN THỊ được sắp xếp lại NGAY (kể cả đang phát), thay vì
 * phải chờ Next/Prev chạm biên. Việc nối-vào-cuối HÀNG ĐỢI PHÁT (applyNewSongsToDisplayOrder)
 * vẫn giữ nguyên — hai việc tách bạch, không ràng buộc nhau.
 */

        /**
         * Đọc duration 1 file qua thẻ Audio() tạm — CHỈ dùng lúc nạp file mới & quét sâu ở Quản lý
         * dung lượng (KHÔNG dùng lúc khởi động/quét nhanh). Có timeout an toàn cho Safari iOS.
         */
        function readAudioDuration(file) {
            return new Promise((resolve) => {
                let settled = false;
                const safeResolve = (val) => { if (!settled) { settled = true; resolve(val); } };
                let tempUrl;
                try { tempUrl = URL.createObjectURL(file); }
                catch (err) { console.error('[playlist] Không tạo được object URL để đọc duration:', err); return safeResolve(0); }
                const tempAudio = new Audio();
                const cleanup = () => { try { URL.revokeObjectURL(tempUrl); } catch (e) {} };
                const timeoutId = setTimeout(() => { cleanup(); safeResolve(0); }, 8000);
                tempAudio.addEventListener('loadedmetadata', () => { clearTimeout(timeoutId); const d = tempAudio.duration; cleanup(); safeResolve(isFinite(d) ? d : 0); });
                tempAudio.addEventListener('error', () => { clearTimeout(timeoutId); cleanup(); safeResolve(0); });
                try { tempAudio.src = tempUrl; }
                catch (err) { clearTimeout(timeoutId); cleanup(); safeResolve(0); }
            });
        }

        /**
         * Xử lý 1 FileList bất kỳ (từ input chọn file rời HOẶC input "Chọn cả thư mục") — TÁCH
         * RA thành hàm riêng (ver 8 refine) để 2 input dùng chung 100% logic, không lặp code.
         * webkitdirectory trả về FileList chứa MỌI file trong thư mục + thư mục con (ảnh, txt,
         * .DS_Store, v.v., không chỉ nhạc) — validateAudioFile() ở vòng lọc bên dưới tự loại các
         * file không phải nhạc, y hệt cách input file rời lọc file sai định dạng cố tình chọn.
         */
        async function handleAudioFiles(fileList) {
            const allFiles = Array.from(fileList); if (allFiles.length === 0) return;
            playlistEmpty.classList.add('hidden');

            const failedFiles = [];
            const newlyAddedKeys = [];

            // (3a) Lọc định dạng nhạc NGAY khi nhận file — accept="" của <input> chỉ là gợi ý UI,
            // không chặn thật (xem upload-validation.js). File không hợp lệ bị loại khỏi danh sách
            // xử lý và liệt kê chung với failedFiles, KHÔNG được đưa vào IndexedDB/playlist.
            const files = [];
            for (const file of allFiles) {
                const check = validateAudioFile(file);
                if (check.valid) files.push(file);
                else failedFiles.push(`${file.name} — ${check.reason}`);
            }
            if (files.length === 0) {
                if (failedFiles.length > 0) alert(`Không nạp được ${failedFiles.length} file:\n\n${failedFiles.join('\n\n')}`);
                return;
            }
            // TỐI ƯU (v7): trước đây dùng `playlistOrder.includes(key)` NGAY TRONG vòng `for` qua
            // từng file -> O(files.length × playlistOrder.length), O(n²) khi nạp nhiều file vào
            // playlist đã lớn. Dựng 1 Set tra cứu O(1) trước vòng lặp, đồng bộ thêm phần tử mỗi khi
            // push key mới (kể cả khi 2 file trùng tên trong CÙNG 1 lượt chọn — resolveSongKey() có
            // thể trả cùng 1 key cho 2 file liên tiếp, Set phải thấy được key đó NGAY để không bị
            // hiểu sai thành "bài mới" ở vòng lặp kế). Kết quả/logic giữ nguyên 100% so với bản cũ.
            const playlistOrderSet = new Set(playlistOrder);

            await withLoadingShield(`Đang nạp 1 / ${files.length}...`, async () => {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    loadingText.textContent = `Đang nạp ${i + 1} / ${files.length}...`;

                    try {
                        let tag = { title: file.name.replace(/\.[^/.]+$/, ""), artist: "Không rõ nghệ sĩ", album: "" };
                        let cover = null;

                        await new Promise(resolve => {
                            let settled = false;
                            const safeResolve = () => { if (!settled) { settled = true; resolve(); } };
                            const timeoutId = setTimeout(safeResolve, 5000);

                            if (window.jsmediatags) {
                                try {
                                    jsmediatags.read(file, {
                                        onSuccess: function(tagResult) {
                                            try {
                                                if (tagResult.tags.title) tag.title = tagResult.tags.title;
                                                if (tagResult.tags.artist) tag.artist = tagResult.tags.artist;
                                                if (tagResult.tags.album) tag.album = tagResult.tags.album;
                                                if (tagResult.tags.picture && tagResult.tags.picture.data) {
                                                    const data = tagResult.tags.picture.data;
                                                    const format = tagResult.tags.picture.format;
                                                    cover = new Blob([new Uint8Array(data)], { type: format });
                                                }
                                            } catch (tagErr) {
                                                console.error(`[playlist] Lỗi đọc cover/tag của "${file.name}", bỏ qua cover, vẫn nạp bài:`, tagErr);
                                                cover = null;
                                            }
                                            clearTimeout(timeoutId); safeResolve();
                                        },
                                        onError: function(err) {
                                            console.warn(`[playlist] jsmediatags không đọc được tag của "${file.name}":`, err);
                                            clearTimeout(timeoutId); safeResolve();
                                        }
                                    });
                                } catch (readErr) {
                                    console.error(`[playlist] jsmediatags.read lỗi đồng bộ với "${file.name}":`, readErr);
                                    clearTimeout(timeoutId); safeResolve();
                                }
                            } else { clearTimeout(timeoutId); safeResolve(); }
                        });

                        const duration = await readAudioDuration(file);
                        const key = await resolveSongKey(file.name);
                        const isOverwrite = playlistOrderSet.has(key);

                        const record = { filename: file.name, blob: file, tag, cover, subtitles: [], duration, addedAt: Date.now() };
                        if (isOverwrite) {
                            const old = await getSongRecord(key);
                            if (old && old.subtitles) record.subtitles = old.subtitles;
                        }
                        await setSongRecord(key, record);

                        if (!isOverwrite) { playlistOrder.push(key); playlistOrderSet.add(key); newlyAddedKeys.push(key); }
                        playlistCache.set(key, { filename: record.filename, tag: record.tag, cover: record.cover, duration: record.duration });
                        songNameIndex.set(key, normalizeSongName(record.tag.title));
                        confirmedBrokenKeys.delete(key);
                    } catch (err) {
                        console.error(`[playlist] Không nạp được "${file.name}":`, err);
                        const errMsg = (err && err.name && err.message) ? `${err.name}: ${err.message}` : String(err && err.message || err || 'Lỗi không xác định');
                        failedFiles.push(`${file.name} — ${errMsg}`);
                    }
                }
                updateShuffleArray();
                applyNewSongsToDisplayOrder(newlyAddedKeys); // (B) hàng đợi phát: nối cuối / pending
                recomputeRenderOrder();                       // (A) UI: sắp xếp lại NGAY
                renderPlaylistDiff();
            });

            if (failedFiles.length > 0) {
                alert(`Không nạp được ${failedFiles.length} file:\n\n${failedFiles.join('\n\n')}`);
            }
        }

        fileInput.addEventListener('change', async function(e) {
            const fileList = e.target.files;
            e.target.value = '';
            await handleAudioFiles(fileList);
        });

        folderInput.addEventListener('change', async function(e) {
            const fileList = e.target.files;
            e.target.value = '';
            await handleAudioFiles(fileList);
        });

        // ===================== Menu nhỏ cho nút "Thêm nhạc": Chọn file / Chọn cả thư mục =====================
        // Dùng CHUNG #song-action-overlay (đã có sẵn ở playlist/actions.js) để đóng khi bấm ra
        // ngoài — tại 1 thời điểm chỉ 1 trong 2 menu (#song-action-menu / #upload-action-menu)
        // hiện, không xung đột. Cùng công thức định vị "rect.bottom + 6, lật lên nếu tràn đáy màn
        // hình" như openSongActionMenu() để 2 menu có cảm giác nhất quán.
        const songActionOverlayForUpload = document.getElementById('song-action-overlay');
        function closeUploadActionMenu() {
            uploadActionMenu.classList.add('hidden');
            songActionOverlayForUpload.classList.add('hidden');
        }
        btnUploadAudio.addEventListener('click', () => {
            const rect = btnUploadAudio.getBoundingClientRect();
            const menuWidth = 208;
            let left = rect.right - menuWidth;
            if (left < 8) left = 8;
            let top = rect.bottom + 8;
            const viewportH = window.innerHeight || 800;
            if (top + 110 > viewportH) top = rect.top - 110 - 8;
            uploadActionMenu.style.left = `${left}px`;
            uploadActionMenu.style.top = `${top}px`;
            uploadActionMenu.classList.remove('hidden');
            songActionOverlayForUpload.classList.remove('hidden');
        });
        songActionOverlayForUpload.addEventListener('click', closeUploadActionMenu);
        uploadActionMenu.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-upload-action]');
            if (!btn) return;
            const action = btn.dataset.uploadAction;
            closeUploadActionMenu();
            if (action === 'files') fileInput.click();
            else if (action === 'folder') folderInput.click();
        });

        /**
         * Quét NHANH store `songs` (KHÔNG decode duration) — record hợp lệ (blob + tag + MIME đúng)
         * thì nạp vào playlist; không hợp lệ thì bỏ qua (sẽ hiện ở Quản lý dung lượng khi quét sâu).
         */
        async function scanValidSongsFromDB(onProgress) {
            const keys = await getAllSongKeys();
            const validKeys = [];
            playlistCache.clear(); songNameIndex.clear();
            let processed = 0;
            for (const key of keys) {
                processed++;
                if (typeof onProgress === 'function') onProgress(processed, keys.length);
                if (confirmedBrokenKeys.has(key)) continue;
                const record = await getSongRecord(key);
                if (!record || !record.blob || !record.tag) continue;
                if (!isQuickValidMime(record.blob.type)) continue;
                validKeys.push(key);
                playlistCache.set(key, { filename: record.filename, tag: record.tag, cover: record.cover, duration: record.duration });
                songNameIndex.set(key, normalizeSongName(record.tag.title));
            }
            return validKeys;
        }

        /** Khởi động app / quét lại: store `songs` là chân lý duy nhất — quét nhanh rồi dựng cả 2 thứ tự. */
        async function initPlaylistFromDB() {
            // Quyết định hiển thị TRƯỚC khi đọc sâu (yêu cầu: if key<=0 -> "chưa có bài"; else -> loading list):
            const rawKeys = await getAllSongKeys();
            if (rawKeys.length <= 0) {
                // Thực sự rỗng -> hiện luôn trạng thái "chưa có bài nào", KHÔNG nháy lớp loading.
                playlistOrder = [];
                updateShuffleArray();
                recomputeDisplayOrder();
                recomputeRenderOrder();
                renderPlaylistDiff();
                updateEmptyState();
                return;
            }
            // Có dữ liệu -> phủ lớp "đang nạp danh sách x / y bài" trong lúc đọc từng record, tránh nháy
            // "chưa có bài nào". Lớp này sẽ tự fade out khi DOM list dựng xong (updateEmptyState).
            showPlaylistLoading(0, rawKeys.length);
            playlistOrder = await scanValidSongsFromDB((done, total) => updatePlaylistLoading(done, total));
            updateShuffleArray();
            recomputeDisplayOrder();   // hàng đợi phát
            recomputeRenderOrder();    // danh sách hiển thị
            renderPlaylistDiff();
            updateEmptyState();        // dựng xong -> fade out lớp loading (hoặc hiện empty nếu mọi record hỏng)
            hidePlaylistLoading();     // chốt fade out (an toàn kể cả khi tất cả record lỗi -> renderOrder rỗng)
        }
