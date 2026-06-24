/**
 * Quản lý dung lượng (mục 5) — drawer riêng tách khỏi About:
 *   - Thống kê dung lượng + tổng số bài hát (dùng lại computeStats() từ about-stats.js).
 *   - Giải phóng bộ nhớ: tải toàn bộ nhạc gốc thành 1 file .zip rồi xóa, HOẶC xóa thẳng không tải.
 *   - Quét & dọn file lỗi: phát hiện record có blob KHÔNG phải mp3 hợp lệ — kiểm bằng 2 lớp:
 *     (1) MIME type của blob (record.blob.type) không khớp audio/mpeg hoặc các kiểu mp3 phổ biến,
 *     (2) thử đọc duration qua Audio() (dùng lại readAudioDuration() từ playlist.js) — nếu trình
 *     duyệt không decode được (trả về 0/NaN), coi là dữ liệu lỗi. Hỏi xác nhận trước khi xóa, không
 *     tự xóa ngầm.
 *
 * PHẢI nạp SAU: db.js (CRUD, isQuickValidMime), about-stats.js (computeStats/formatBytes),
 * id3-export.js (triggerDownload), playlist.js (readAudioDuration, playlistOrder,
 * renderPlaylistDiff, removeKeyFromDisplay, songNameIndex, playlistCache, confirmedBrokenKeys).
 */

        const drawerStorage = document.getElementById('drawer-storage');
        const btnOpenStorage = document.getElementById('setting-open-storage');
        const btnBackStorage = document.getElementById('btn-back-storage');

        async function renderStorageStats() {
            const statSongs = document.getElementById('stat-storage-total-songs');
            const statBytes = document.getElementById('stat-storage-total-bytes');
            statSongs.textContent = '...'; statBytes.textContent = '...';
            const stats = await computeStats();
            statSongs.textContent = `${stats.totalSongs}`;
            statBytes.textContent = formatBytes(stats.totalBytes);
        }

        if (btnOpenStorage) {
            btnOpenStorage.addEventListener('click', () => {
                drawerStorage.classList.remove('translate-y-full');
                renderStorageStats();
                resetScanResultUI();
            });
        }
        if (btnBackStorage) {
            // Back ở đây chỉ ẩn Storage Management — KHÔNG động vào About bên dưới (vẫn mở nguyên).
            btnBackStorage.addEventListener('click', () => { drawerStorage.classList.add('translate-y-full'); });
        }

        // ===================== Giải phóng bộ nhớ =====================

        /**
         * Đóng gói toàn bộ blob mp3 GỐC (không gắn tag mới, giữ nguyên file thật) thành 1 file .zip,
         * tên file giữ nguyên filename gốc — trùng tên tự thêm số đếm để JSZip không ghi đè lẫn nhau.
         */
        async function buildAllSongsZipBlob(onProgress) {
            if (typeof JSZip === 'undefined') {
                throw new Error('Thư viện JSZip chưa nạp được (kiểm tra kết nối mạng tới CDN).');
            }
            const zip = new JSZip();
            const keys = await getAllSongKeys();
            const usedNames = new Map(); // filename -> số lần đã dùng, để chống trùng tên trong zip
            let done = 0;
            for (const key of keys) {
                const record = await getSongRecord(key);
                if (!record || !record.blob) { done++; continue; }
                let name = record.filename || `${key}.mp3`;
                if (usedNames.has(name)) {
                    const count = usedNames.get(name) + 1; usedNames.set(name, count);
                    const dot = name.lastIndexOf('.');
                    name = dot > -1 ? `${name.slice(0, dot)} (${count})${name.slice(dot)}` : `${name} (${count})`;
                } else { usedNames.set(name, 0); }
                zip.file(name, record.blob);
                done++;
                if (onProgress) onProgress(done, keys.length);
            }
            return zip.generateAsync({ type: 'blob' }, (meta) => {
                if (onProgress) onProgress(keys.length, keys.length, meta.percent);
            });
        }

        /** Xóa TOÀN BỘ dữ liệu app khỏi IndexedDB: cả 2 store songs + meta — dùng chung cho cả 2 nút giải phóng bộ nhớ. */
        async function clearAllStoredData() {
            // [QUYẾT ĐỊNH 1.8] "Xóa hết dữ liệu" CHỈ xóa bài hát (và thống kê nghe riêng từng bài,
            // vì bài hát đã mất). KHÔNG đụng tới ảnh/video nền (bgImage/videoBg) — đó là tài nguyên
            // người dùng thiết lập riêng, không nằm trong "thư viện nhạc".
            const songKeys = await getAllSongKeys();
            for (const key of songKeys) await deleteSongRecord(key);
            await delMeta('totalListenSeconds');
            if (typeof clearAllSongStats === 'function') await clearAllSongStats();

            // Đồng bộ lại toàn bộ state RAM — không reload trang, để người dùng thấy ngay kết quả.
            playlistOrder = []; displayOrder = []; playlistCache.clear(); songNameIndex.clear(); confirmedBrokenKeys.clear();
            pendingResortKeys.clear();
            if (typeof recomputeRenderOrder === 'function') recomputeRenderOrder();
            if (currentKey) { audioPlayer.pause(); audioPlayer.src = ''; currentKey = null; }
            if (currentObjectURL) { URL.revokeObjectURL(currentObjectURL); currentObjectURL = null; }
            if (currentCoverObjectURL) { URL.revokeObjectURL(currentCoverObjectURL); currentCoverObjectURL = null; }
            playerTitle.textContent = 'Chưa chọn bài'; playerArtist.textContent = '---';
            updateShuffleArray();
            renderPlaylistFull();
            // updateEmptyState() đã được renderPlaylistFull() gọi -> tự bật #playlist-empty đúng lúc.
            saveConfig();
        }

        const btnDownloadThenClear = document.getElementById('btn-storage-download-then-clear');
        if (btnDownloadThenClear) {
            btnDownloadThenClear.addEventListener('click', () => {
                const ok = confirm('Tải toàn bộ nhạc thành 1 file zip, sau đó XÓA toàn bộ BÀI HÁT khỏi thiết bị này? (Ảnh/video nền vẫn được giữ lại.) Hành động xóa không thể hoàn tác sau khi tải xong.');
                if (!ok) return;
                withLoadingShield('Đang đóng gói file zip (0%)...', async () => {
                    const keys = await getAllSongKeys();
                    if (keys.length === 0) { alert('Chưa có bài hát nào để tải.'); return; }
                    let zipBlob;
                    try {
                        zipBlob = await buildAllSongsZipBlob((done, total, percent) => {
                            const pct = percent != null ? Math.round(percent) : Math.round((done / total) * 100);
                            loadingText.textContent = `Đang đóng gói file zip (${pct}%)...`;
                        });
                    } catch (err) {
                        console.error('[storage-manager] Lỗi đóng gói zip:', err);
                        alert(`Không tạo được file zip: ${err.message || err}`);
                        return;
                    }
                    const dateStr = new Date().toISOString().slice(0, 10);
                    triggerDownload(zipBlob, `nhac-da-luu-${dateStr}.zip`);

                    loadingText.textContent = 'Đang xóa dữ liệu...';
                    await clearAllStoredData();
                    renderStorageStats();
                    alert('Đã tải xong file zip và xóa toàn bộ bài hát. Ảnh/video nền vẫn được giữ lại.');
                });
            });
        }

        const btnClearNoDownload = document.getElementById('btn-storage-clear-no-download');
        if (btnClearNoDownload) {
            btnClearNoDownload.addEventListener('click', () => {
                const ok = confirm('Xóa toàn bộ BÀI HÁT đã lưu trên thiết bị này? (Ảnh/video nền vẫn được giữ lại.) Hành động này KHÔNG thể hoàn tác.');
                if (!ok) return;
                withLoadingShield('Đang xóa dữ liệu...', async () => {
                    await clearAllStoredData();
                    renderStorageStats();
                    alert('Đã xóa toàn bộ bài hát. Ảnh/video nền vẫn được giữ lại.');
                });
            });
        }

        // ===================== Quét & dọn file lỗi =====================

        /**
         * Kiểm tra 1 record có phải dữ liệu lỗi không, theo 2 lớp đã thống nhất:
         *   (1) MIME type của blob không khớp mp3 hợp lệ (isQuickValidMime, dùng chung với
         *       scanValidSongsFromDB() trong playlist.js — mp3 giả/đổi đuôi từ file khác).
         *   (2) Thử decode duration qua Audio() (readAudioDuration, có timeout an toàn) — nếu trả
         *       về 0 (không đọc được mọi cách, bao gồm cả lỗi 'error' event), coi là lỗi. Một bài mp3
         *       hợp lệ với duration thật = 0 giây gần như không tồn tại trong thực tế, nên ngưỡng này
         *       chấp nhận được mà không cần phân tích sâu container hơn. Lớp này KHÔNG chạy ở
         *       playlist.js lúc khởi động (giữ tốc độ) — chỉ chạy ở đây khi người dùng chủ động bấm
         *       Quét, và lúc playSong() gặp lỗi 'error' thật trên audioPlayer (player-controls.js).
         */
        async function isRecordCorrupted(record) {
            if (!record || !record.blob) return { corrupted: true, reason: 'Không có dữ liệu file (blob trống)' };
            if (!isQuickValidMime(record.blob.type)) {
                return { corrupted: true, reason: `Định dạng không phải mp3 (MIME: "${record.blob.type || '(rỗng)'}")` };
            }
            const duration = await readAudioDuration(record.blob);
            if (!duration || duration <= 0) return { corrupted: true, reason: 'Trình duyệt không đọc/decode được nội dung audio' };
            return { corrupted: false };
        }

        let lastScanResults = []; // [{key, filename, reason}]

        function resetScanResultUI() {
            document.getElementById('storage-scan-result').classList.add('hidden');
            document.getElementById('storage-scan-list').innerHTML = '';
            lastScanResults = [];
        }

        const btnScanBroken = document.getElementById('btn-storage-scan-broken');
        if (btnScanBroken) {
            btnScanBroken.addEventListener('click', () => {
                withLoadingShield('Đang quét dữ liệu...', async () => {
                    const keys = await getAllSongKeys();
                    const results = [];
                    for (let i = 0; i < keys.length; i++) {
                        const key = keys[i];
                        loadingText.textContent = `Đang quét ${i + 1} / ${keys.length}...`;
                        const record = await getSongRecord(key);
                        if (confirmedBrokenKeys.has(key)) {
                            // Đã được người dùng xác nhận "Giữ lại" lúc phát lỗi trước đó — không cần
                            // decode lại (tốn thời gian vô ích, đã biết chắc là lỗi), liệt kê thẳng.
                            results.push({ key, filename: record ? record.filename : key, reason: 'Lỗi lúc phát — đã chọn "Giữ lại" để xử lý sau' });
                            continue;
                        }
                        const check = await isRecordCorrupted(record);
                        if (check.corrupted) {
                            results.push({ key, filename: record ? record.filename : key, reason: check.reason });
                        }
                    }
                    lastScanResults = results;
                    renderScanResultUI(results);
                });
            });
        }

        function renderScanResultUI(results) {
            const resultBox = document.getElementById('storage-scan-result');
            const summary = document.getElementById('storage-scan-summary');
            const list = document.getElementById('storage-scan-list');
            const deleteBtn = document.getElementById('btn-storage-delete-broken');
            resultBox.classList.remove('hidden');
            if (results.length === 0) {
                summary.textContent = 'Không tìm thấy file lỗi nào — toàn bộ dữ liệu hợp lệ.';
                list.innerHTML = '';
                deleteBtn.classList.add('hidden');
            } else {
                summary.textContent = `Tìm thấy ${results.length} file có vấn đề:`;
                list.innerHTML = results.map(r => `<div class="truncate"><span class="text-amber-400">●</span> ${r.filename} — ${r.reason}</div>`).join('');
                deleteBtn.classList.remove('hidden');
            }
        }

        const btnDeleteBroken = document.getElementById('btn-storage-delete-broken');
        if (btnDeleteBroken) {
            btnDeleteBroken.addEventListener('click', () => {
                if (lastScanResults.length === 0) return;
                const ok = confirm(`Xóa ${lastScanResults.length} file lỗi đã tìm thấy? Không thể hoàn tác.`);
                if (!ok) return;
                withLoadingShield('Đang xóa file lỗi...', async () => {
                    for (const { key } of lastScanResults) {
                        if (key === currentKey) continue; // không xóa bài đang phát, giữ đúng quy tắc chung của removeSong
                        await deleteSongRecord(key);
                        confirmedBrokenKeys.delete(key); // xoá khỏi IndexedDB rồi thì cũng không cần nhớ "đã giữ lại" nữa
                        removeKeyFromDisplay(key);
                    }
                    resetScanResultUI();
                    renderStorageStats();
                    alert('Đã xóa xong các file lỗi.');
                });
            });
        }

        const btnDismissScan = document.getElementById('btn-storage-dismiss-scan');
        if (btnDismissScan) btnDismissScan.addEventListener('click', resetScanResultUI);
