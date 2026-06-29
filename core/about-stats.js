/**
 * Tính & hiển thị thống kê trong About Drawer (mục 7 PLAN_INDEXEDDB.md).
 * computeStats() chỉ liệt kê store `songs` (qua getAllSongKeys/db.js), không lẫn key của
 * store `meta` (playlistOrder, bgImage, videoBg, totalListenSeconds) vì 2 store đã tách riêng.
 *
 * ÁP DỤNG /event/ (cụm "settingsNav"): `addEventListener` cũ của btnOpenAbout/btnBackAbout đã
 * CHUYỂN sang event/listener/settings-nav.js — xem event/router/settings-nav.js (gộp chung với
 * storageDrawer + appRecovery, vì cả 3 đều là ĐIỀU HƯỚNG Settings, không phải nghiệp vụ riêng).
 * DOM ref (drawerAbout, btnOpenAbout, btnBackAbout, stat*) đã dọn về core/dom-refs.js — file này
 * KHÔNG còn tự document.getElementById nào.
 */
        function formatBytes(bytes) {
            if (!bytes) return '0 MB';
            const mb = bytes / (1024 * 1024);
            if (mb < 1024) return `${mb.toFixed(1)} MB`;
            return `${(mb / 1024).toFixed(2)} GB`;
        }

        function formatDurationLong(totalSeconds) {
            const s = Math.floor(totalSeconds || 0);
            const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60);
            if (h > 0) return tFormat('common.durationLong.hourMinute', { h, m });
            return tFormat('common.durationLong.minuteOnly', { m });
        }

        async function computeStats() {
            const keys = await getAllSongKeys();
            let totalSongs = 0, totalDuration = 0, totalBytes = 0;
            for (const key of keys) {
                const record = await getSongRecord(key);
                if (!record || !record.blob) continue;
                totalSongs++;
                totalDuration += record.duration || 0;
                totalBytes += record.blob.size + (record.cover ? record.cover.size : 0);
            }
            const totalListenSeconds = (await getMeta('totalListenSeconds')) || 0;
            return { totalSongs, totalDuration, totalListenSeconds, totalBytes };
        }

        /** Core thuần: mở About Drawer + render thống kê. Không biết gì về eventBus. */
        async function openAboutDrawerAndRenderStats() {
            drawerAbout.classList.remove('translate-y-full');
            statAboutTotalSongs.textContent = '...'; statAboutTotalDuration.textContent = '...';
            statAboutListenSeconds.textContent = '...';

            const stats = await computeStats();
            statAboutTotalSongs.textContent = `${stats.totalSongs}`;
            statAboutTotalDuration.textContent = formatDurationLong(stats.totalDuration);
            statAboutListenSeconds.textContent = formatDurationLong(stats.totalListenSeconds);
        }

        /** Core thuần: đóng About Drawer — Back ở đây chỉ ẩn About, KHÔNG động vào drawer-settings bên dưới. */
        function closeAboutDrawer() {
            drawerAbout.classList.add('translate-y-full');
        }
