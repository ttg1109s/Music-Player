/**
 * Tính & hiển thị thống kê trong About Drawer (mục 7 PLAN_INDEXEDDB.md) + bind nút mở/đóng.
 * computeStats() chỉ liệt kê store `songs` (qua getAllSongKeys/db.js), không lẫn key của
 * store `meta` (playlistOrder, bgImage, videoBg, totalListenSeconds) vì 2 store đã tách riêng.
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
            if (h > 0) return `${h} giờ ${m} phút`;
            return `${m} phút`;
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

        async function renderAboutStats() {
            const statTotalSongs = document.getElementById('stat-about-total-songs');
            const statTotalDuration = document.getElementById('stat-about-total-duration');
            const statListenSeconds = document.getElementById('stat-about-listen-seconds');
            const statStorage = document.getElementById('stat-about-storage');
            statTotalSongs.textContent = '...'; statTotalDuration.textContent = '...';
            statListenSeconds.textContent = '...'; statStorage.textContent = '...';

            const stats = await computeStats();
            statTotalSongs.textContent = `${stats.totalSongs}`;
            statTotalDuration.textContent = formatDurationLong(stats.totalDuration);
            statListenSeconds.textContent = formatDurationLong(stats.totalListenSeconds);
            statStorage.textContent = formatBytes(stats.totalBytes);
        }

        const drawerAbout = document.getElementById('drawer-about');
        const btnOpenAbout = document.getElementById('setting-open-about');
        const btnBackAbout = document.getElementById('btn-back-about');

        if (btnOpenAbout) {
            btnOpenAbout.addEventListener('click', () => {
                drawerAbout.classList.remove('translate-y-full');
                renderAboutStats();
            });
        }
        if (btnBackAbout) {
            // Back trong About chỉ ẩn About — KHÔNG động vào drawer-settings (vẫn mở nguyên bên dưới).
            btnBackAbout.addEventListener('click', () => { drawerAbout.classList.add('translate-y-full'); });
        }
