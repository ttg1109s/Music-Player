/**
 * Lớp truy cập IndexedDB cho toàn bộ app, dựa trên idb-keyval (UMD, nạp qua CDN trong <head>).
 * Quản lý 2 store riêng trong database `musicPlayerDB`:
 *   - `songs`: mỗi record 1 bài hát (xem schema trong PLAN_INDEXEDDB.md mục 1).
 *   - `meta`:  key-value đơn lẻ (playlistOrder, totalListenSeconds, bgImage, videoBg).
 * Tách 2 store riêng để computeStats() (about-stats.js) chỉ cần liệt kê đúng store `songs`,
 * không lẫn key của ảnh/video nền hay playlistOrder.
 *
 * QUAN TRỌNG — KHÔNG dùng 2 lệnh `idbKeyval.createStore(DB_NAME, ...)` độc lập (1 cho mỗi store)
 * như cách làm tưởng chừng hợp lý: mỗi lệnh đó tự gọi `indexedDB.open(DB_NAME)` RIÊNG, không version
 * cụ thể. `onupgradeneeded` chỉ chạy đúng 1 lần khi DB được tạo (version 0 -> 1) — connection nào
 * "thắng" race đó quyết định CHỈ store của lệnh đó được tạo thật. Tuỳ thứ tự tính năng nào được
 * dùng trước (nạp nhạc trước hay đổi ảnh nền trước), người dùng có thể kẹt với DB chỉ có 1 trong 2
 * store ('songs' hoặc 'meta'), gây lỗi `NotFoundError: One of the specified object stores was not
 * found` ngay khi đụng tới store còn thiếu — và vì đây xảy ra ngay ở lần mở DB đầu tiên trên máy đó,
 * lỗi sẽ lặp lại ở MỌI lần sau cho tới khi sửa đúng cách (xoá DB thủ công không phải giải pháp tốt
 * vì mất hết nhạc/ảnh đã lưu).
 *
 * Cách sửa: tự quản lý `indexedDB.open(DB_NAME, DB_VERSION)` ĐÚNG MỘT LẦN, tạo CẢ HAI store trong
 * cùng một `onupgradeneeded` (idempotent — kiểm tra `objectStoreNames.contains` trước khi tạo, để
 * vẫn chạy đúng cho DB cũ chỉ có sẵn 1 trong 2 store, tự bổ sung store còn thiếu mà KHÔNG mất data
 * đã có ở store kia). Sau đó bọc lại thành 2 "store accessor" cùng signature mà idb-keyval cần
 * (`(txMode, callback) => Promise`), để toàn bộ chỗ gọi `idbKeyval.get/set/del/keys(key, songsStore)`
 * ở các file khác (playlist.js, player-controls.js, about-stats.js...) không cần đổi gì.
 *
 * PHẢI nạp SỚM trong index.html (đầu nhóm core/), TRƯỚC playlist.js, player-controls.js,
 * equalizer-settings.js, subtitles.js, about-stats.js, id3-export.js — các file đó gọi
 * hàm helper định nghĩa ở đây.
 */
        const DB_NAME = 'musicPlayerDB';
        const DB_VERSION = 2; // tăng lên 2 để buộc onupgradeneeded chạy lại cho DB cũ (v1) bị thiếu store

        const dbReadyPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('songs')) db.createObjectStore('songs');
                if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            request.onblocked = () => console.warn('[db] Mở IndexedDB bị "blocked" — có tab/cửa sổ khác đang giữ kết nối DB phiên bản cũ. Đóng các tab khác của trang này rồi tải lại.');
        });

        /**
         * Tạo 1 "store accessor" tương thích đúng signature mà idb-keyval cần
         * ((txMode, callback) => Promise), dùng chung 1 connection DB đã mở sẵn ở trên — thay cho
         * idbKeyval.createStore() (nguồn gốc lỗi race condition ở trên).
         */
        function makeStoreAccessor(storeName) {
            return (txMode, callback) => dbReadyPromise.then((db) => callback(db.transaction(storeName, txMode).objectStore(storeName)));
        }

        const songsStore = makeStoreAccessor('songs');
        const metaStore = makeStoreAccessor('meta');

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
        // KHÔNG còn getPlaylistOrder/setPlaylistOrder: playlist không lưu thứ tự riêng trong
        // store `meta` nữa — store `songs` là chân lý duy nhất. Mỗi lần cần danh sách (khởi động,
        // sau khi thêm/xoá bài), quét lại toàn bộ key qua getAllSongKeys() + lọc hợp lệ ngay trong
        // RAM (xem scanValidSongsFromDB() trong playlist.js) — không cố lưu/khôi phục thứ tự cũ.

        // MIME type hợp lệ cho mp3 — trình duyệt/thiết bị khác nhau có thể báo hơi khác nhau, nên
        // chấp nhận cả audio/mpeg, audio/mp3 (không chuẩn nhưng vẫn gặp), và rỗng (file picker một số
        // hệ điều hành không set type, không tự coi đó là lỗi chỉ vì thiếu type). Định nghĩa Ở ĐÂY
        // (db.js, nạp sớm nhất) để dùng CHUNG giữa playlist.js (quét nhanh lúc khởi động/thêm bài,
        // KHÔNG decode) và storage-manager.js (quét sâu ở Quản lý dung lượng, có decode) — tránh 2
        // nơi định nghĩa "thế nào là hợp lệ" lệch nhau.
        const VALID_MP3_MIME_TYPES = new Set(['audio/mpeg', 'audio/mp3', 'audio/mpa', '']);
        function isQuickValidMime(mime) {
            return VALID_MP3_MIME_TYPES.has((mime || '').toLowerCase());
        }
