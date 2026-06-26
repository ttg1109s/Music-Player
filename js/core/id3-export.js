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
            return withLoadingShield(t('common.loading.exportingFile'), async () => {
                const record = await getSongRecord(key);
                if (!record) { await alertModal(t('common.export.notFound')); return; }
                try {
                    const taggedBlob = await buildTaggedBlob(record);
                    triggerDownload(taggedBlob, record.filename);
                } catch (e) {
                    console.error('[id3-export] Lỗi ghi tag:', e);
                    await alertModal(t('common.export.tagWriteFailed'));
                    triggerDownload(record.blob, record.filename);
                }
            });
        }
