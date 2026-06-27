/**
 * Restore / Export bài hát: đọc record từ IndexedDB, ghi tag mới nhất (record.tag + record.cover)
 * vào blob mp3 qua browser-id3-writer, trigger download — KHÔNG ghi blob mới này trở lại
 * IndexedDB (record gốc trong DB giữ nguyên blob chưa từng bị ghi tag — xem mục 3.6 plan).
 */
        async function buildTaggedBlob(record) {
            const arrayBuffer = await record.blob.arrayBuffer();
            const writer = new ID3Writer(arrayBuffer);
            writer.setFrame('TIT2', record.tag.title || '');
            writer.setFrame('TPE1', [record.tag.artist || '']);
            writer.setFrame('TALB', record.tag.album || '');

            if (record.cover) {
                const coverBuffer = await record.cover.arrayBuffer();
                writer.setFrame('APIC', {
                    type: 3,
                    data: coverBuffer,
                    description: 'Cover'
                });
            }

            writer.addTag();
            return writer.getBlob();
        }

        function triggerDownload(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename; a.click();
            URL.revokeObjectURL(url);
        }

        async function exportSongWithTag(key) {
            // FIX (xung đột shield/modal): KHÔNG await alertModal() bên trong fn() của
            // withLoadingShield() — xem giải thích chi tiết ở playlist/actions.js (window.playSong).
            // Tóm tắt: isShieldBusy chỉ giải phóng SAU KHI fn() resolve, còn alertModal() chỉ resolve
            // khi người dùng bấm OK -> lồng vào nhau làm #loading-shield (z-[200]) treo, đè lên trên
            // modalChoice() (z-[130]) suốt thời gian chờ. Dùng cờ mang thông tin ra ngoài, hiện modal
            // SAU KHI withLoadingShield() đã resolve hoàn toàn.
            let resultFlag = null; // null = ổn (không cần báo gì) | 'notFound' | 'tagWriteFailed'
            let failedRecord = null; // giữ lại record gốc khi ghi tag lỗi — dùng để triggerDownload(record.blob,...) ở ngoài, tránh query lại DB lần 2
            await withLoadingShield(t('common.loading.exportingFile'), async () => {
                const record = await getSongRecord(key);
                if (!record) { resultFlag = 'notFound'; return; }
                try {
                    const taggedBlob = await buildTaggedBlob(record);
                    triggerDownload(taggedBlob, record.filename);
                } catch (e) {
                    console.error('[id3-export] Lỗi ghi tag:', e);
                    resultFlag = 'tagWriteFailed';
                    failedRecord = record;
                    // Giữ ĐÚNG thứ tự hành vi gốc: trước đây alert() (chặn đồng bộ) chạy XONG rồi mới
                    // tới triggerDownload(record.blob,...) — nghĩa là người dùng đọc thông báo lỗi
                    // TRƯỚC khi file (chưa ghi tag) được tải xuống. Đưa triggerDownload này ra ngoài
                    // CÙNG với alertModal() (xem dưới) để giữ đúng thứ tự đó.
                }
            });

            // Shield đã đóng HẲN tới đây — an toàn để hiện modal.
            if (resultFlag === 'notFound') {
                await alertModal(t('common.export.notFound'));
            } else if (resultFlag === 'tagWriteFailed') {
                await alertModal(t('common.export.tagWriteFailed'));
                triggerDownload(failedRecord.blob, failedRecord.filename);
            }
        }
