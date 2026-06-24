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

        fileInput.addEventListener('change', async function(e) {
            const files = Array.from(e.target.files); if (files.length === 0) return;
            e.target.value = '';
            playlistEmpty.classList.add('hidden');

            const failedFiles = [];
            const newlyAddedKeys = [];

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
                        const isOverwrite = playlistOrder.includes(key);

                        const record = { filename: file.name, blob: file, tag, cover, subtitles: [], duration, addedAt: Date.now() };
                        if (isOverwrite) {
                            const old = await getSongRecord(key);
                            if (old && old.subtitles) record.subtitles = old.subtitles;
                        }
                        await setSongRecord(key, record);

                        if (!isOverwrite) { playlistOrder.push(key); newlyAddedKeys.push(key); }
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
        });

        /**
         * Quét NHANH store `songs` (KHÔNG decode duration) — record hợp lệ (blob + tag + MIME đúng)
         * thì nạp vào playlist; không hợp lệ thì bỏ qua (sẽ hiện ở Quản lý dung lượng khi quét sâu).
         */
        async function scanValidSongsFromDB() {
            const keys = await getAllSongKeys();
            const validKeys = [];
            playlistCache.clear(); songNameIndex.clear();
            for (const key of keys) {
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
            playlistOrder = await scanValidSongsFromDB();
            updateShuffleArray();
            recomputeDisplayOrder();   // hàng đợi phát
            recomputeRenderOrder();    // danh sách hiển thị
            renderPlaylistDiff();
            updateEmptyState();
        }
