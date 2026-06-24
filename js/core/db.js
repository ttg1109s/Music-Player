/**
 * Lớp truy cập IndexedDB cho toàn bộ app, dựa trên idb-keyval (UMD, nạp qua CDN trong <head>).
 * Quản lý 2 store riêng trong database `musicPlayerDB`:
 *   - `songs`: mỗi record 1 bài hát (xem schema trong PLAN_INDEXEDDB.md mục 1).
 *   - `meta`:  key-value đơn lẻ (playlistOrder, totalListenSeconds, bgImage, videoBg).
 * Tách 2 store riêng (qua idbKeyval.createStore) để computeStats() (about-stats.js) chỉ cần
 * liệt kê đúng store `songs`, không lẫn key của ảnh/video nền hay playlistOrder.
 *
 * PHẢI nạp SỚM trong index.html (đầu nhóm core/), TRƯỚC playlist.js, player-controls.js,
 * equalizer-settings.js, subtitles.js, about-stats.js, id3-export.js — các file đó gọi
 * hàm helper định nghĩa ở đây.
 */
        const DB_NAME = 'musicPlayerDB';
        const songsStore = idbKeyval.createStore(DB_NAME, 'songs');
        const metaStore = idbKeyval.createStore(DB_NAME, 'meta');

        /**
         * slugify: hạ thường, bỏ dấu tiếng Việt, bỏ ký tự đặc biệt, nối bằng "-".
         * Kết quả chỉ gồm [a-z0-9-], dùng trực tiếp làm id HTML / data-key.
         */
        function slugify(filename) {
            const noExt = filename.replace(/\.[^/.]+$/, "");
            return noExt
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // bỏ dấu (Unicode combining marks)
                .replace(/đ/g, 'd')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                || 'song';
        }

        /**
         * Resolve key cho 1 file mới nạp, theo thuật toán mục 2 của plan:
         *   - slug chưa tồn tại -> dùng slug làm key.
         *   - slug đã tồn tại, filename TRÙNG -> ghi đè (trả lại đúng slug đó).
         *   - slug đã tồn tại, filename KHÁC -> thêm hậu tố số (slug-2, slug-3, ...).
         */
        async function resolveSongKey(filename) {
            const baseSlug = slugify(filename);
            let candidate = baseSlug;
            let suffix = 2;
            while (true) {
                const existing = await idbKeyval.get(candidate, songsStore);
                if (!existing) return candidate; // slug trống -> dùng luôn
                if (existing.filename === filename) return candidate; // cùng bài -> ghi đè đúng key này
                candidate = `${baseSlug}-${suffix}`; suffix++;
            }
        }

        function getSongRecord(key) { return idbKeyval.get(key, songsStore); }
        function setSongRecord(key, record) { return idbKeyval.set(key, record, songsStore); }
        function deleteSongRecord(key) { return idbKeyval.del(key, songsStore); }
        function getAllSongKeys() { return idbKeyval.keys(songsStore); }

        function getMeta(key) { return idbKeyval.get(key, metaStore); }
        function setMeta(key, value) { return idbKeyval.set(key, value, metaStore); }
        function delMeta(key) { return idbKeyval.del(key, metaStore); }

        async function getPlaylistOrder() { return (await getMeta('playlistOrder')) || []; }
        function setPlaylistOrder(order) { return setMeta('playlistOrder', order); }
