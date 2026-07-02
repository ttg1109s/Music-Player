/**
 * core/file-manager/folder.js — Folder nhạc (File Manager → Song → Folder), ver 12 "Multi Media".
 * Toàn bộ function MỚI ở file này viết từ đầu theo plan-v12-multimedia.md mục 4.b1 — tuân 4 rule
 * ở core-function-conventions.md.
 *
 * GHI CHÚ THIẾT KẾ (đọc trước khi sửa file này): các hàm CRUD thô định nghĩa ở core/db.js
 * (getFolderRecord/setFolderRecord/deleteFolderRecord/getAllFolderKeys,
 * getFolderSongMap/setFolderSongMap/deleteFolderSongMap) được coi là TẦNG DỮ LIỆU thuần (tương
 * đương idbKeyval.get/set/del dùng trực tiếp khắp project) — KHÔNG tính là "core khác" theo Rule 3
 * (core-function-conventions.md). Rule 3 nhắm tới việc 1 hàm core MỚI gọi 1 hàm core NGHIỆP VỤ
 * khác (có thể là workflow-shaped) mà không dùng kết quả — không nhắm tới việc gọi thẳng hàm CRUD
 * đọc/ghi 1 record IndexedDB. Nhờ vậy, các hàm dưới đây được phép tự đọc/ghi nhiều record trong
 * CÙNG 1 hàm nếu đó là ĐÚNG 1 tiến trình nghiệp vụ duy nhất (Rule 1) — ví dụ deleteFolder() đọc +
 * ghi nhiều record `songs` để dọn field `folder[folderId]` TRƯỚC khi xoá `folder_song`/`folders`,
 * vẫn là 1 tiến trình "xoá 1 folder", không phải nhiều tiến trình khác nhau.
 *
 * Schema (CHỐT — xem plan-v12-multimedia.md mục 4.b1):
 *   folders     : { [folderId]: { id, name } }
 *   folder_song : { [folderId]: { list: [songKey|null, ...], empty: number } } — tombstone null
 *                 khi gỡ bài khỏi folder, KHÔNG splice (giữ nguyên index/position).
 *   songs (field mới trên record có sẵn) : record.folder = { [folderId]: position (number) } —
 *                 sự TỒN TẠI của key folderId đã đủ biết "từng thêm vào folder này chưa"; trạng
 *                 thái đang-ở-trong hay đã-gỡ đọc thẳng từ folder_song[folderId].list[position].
 *
 * NẠP SAU: core/db.js (cần mọi hàm CRUD kể trên + slugify() dùng chung cho resolveFolderId).
 */

/**
 * Sinh folderId DUY NHẤT từ tên folder, tái dùng slugify() đã có ở db.js (cùng thuật toán với
 * resolveSongKey — KHÔNG trùng logic, chỉ đổi store kiểm tra tồn tại).
 * @param {string} name
 * @returns {Promise<string>}
 */
async function resolveFolderId(name) {
    const baseSlug = slugify(name) || 'folder';
    let candidate = baseSlug;
    let suffix = 2;
    while (true) {
        const existing = await getFolderRecord(candidate);
        if (!existing) return candidate;
        candidate = `${baseSlug}-${suffix}`; suffix++;
    }
}

/**
 * Tạo 1 folder mới rỗng. 1 tiến trình duy nhất: sinh id -> ghi metadata -> ghi mapping rỗng.
 * @param {string} name
 * @returns {Promise<string>} folderId vừa tạo
 */
async function createFolder(name) {
    const folderId = await resolveFolderId(name);
    await setFolderRecord(folderId, { id: folderId, name });
    await setFolderSongMap(folderId, { list: [], empty: 0 });
    return folderId;
}

/**
 * Đổi tên 1 folder đã có. Guard clause thuần (không tồn tại -> dừng sớm) — KHÔNG phải rẽ nhánh
 * tiến trình theo Rule 1.
 * @param {string} folderId
 * @param {string} newName
 * @returns {Promise<{status: 'notFound'|'ok'}>}
 */
async function renameFolder(folderId, newName) {
    const record = await getFolderRecord(folderId);
    if (!record) return { status: 'notFound' };
    record.name = newName;
    await setFolderRecord(folderId, record);
    return { status: 'ok' };
}

/**
 * Xoá 1 folder — thứ tự BẮT BUỘC theo plan mục 6 "Đã chốt": dọn field `folder[folderId]` khỏi
 * TỪNG bài đang có trong `list` TRƯỚC, xong mới xoá `folder_song`, cuối cùng xoá metadata `folders`.
 * @param {string} folderId
 * @returns {Promise<{status: 'notFound'|'ok'}>}
 */
async function deleteFolder(folderId) {
    const folderMap = await getFolderSongMap(folderId);
    if (!folderMap) return { status: 'notFound' };

    const songKeys = getFolderSongKeys(folderMap);
    for (const songKey of songKeys) {
        const record = await getSongRecord(songKey);
        if (!record || !record.folder) continue; // guard: record đã bị xoá/hỏng dữ liệu ở nơi khác — bỏ qua, không chặn xoá folder
        delete record.folder[folderId];
        await setSongRecord(songKey, record);
    }

    await deleteFolderSongMap(folderId);
    await deleteFolderRecord(folderId);
    return { status: 'ok' };
}

/**
 * Thêm NHIỀU bài vào 1 folder — đúng thuật toán CHỐT ở plan mục 4.b1 "Thêm vào folder":
 *   - Chưa từng thêm (`folder[folderId]` không tồn tại) -> lần đầu tuyệt đối, push vào cuối list,
 *     KHÔNG đổi `empty`.
 *   - Đã từng thêm, đang bị gỡ (`list[position] === null`) -> tái điền đúng position cũ, `empty--`.
 *   - Đã từng thêm, đang ở trong rồi -> không làm gì (tránh thêm trùng).
 * 3 nhánh trên là 3 TRẠNG THÁI của ĐÚNG 1 tiến trình "đảm bảo bài có mặt trong folder" (idempotent
 * upsert) — không phải 3 tiến trình nghiệp vụ khác nhau, nên không vi phạm Rule 1.
 * @param {string[]} songKeys
 * @param {string} folderId
 * @returns {Promise<{status: 'notFound'|'ok', addedCount: number}>}
 */
async function addSongsToFolder(songKeys, folderId) {
    const folderMap = await getFolderSongMap(folderId);
    if (!folderMap) return { status: 'notFound', addedCount: 0 };

    let addedCount = 0;
    for (const songKey of songKeys) {
        const record = await getSongRecord(songKey);
        if (!record) continue; // guard: bài không còn tồn tại — bỏ qua, không chặn cả lô
        if (!record.folder) record.folder = {};

        if (!(folderId in record.folder)) {
            const position = folderMap.list.length;
            folderMap.list.push(songKey);
            record.folder[folderId] = position;
            addedCount++;
        } else {
            const position = record.folder[folderId];
            if (folderMap.list[position] === null) {
                folderMap.list[position] = songKey;
                folderMap.empty--;
                addedCount++;
            }
            // else: list[position] !== null -> đã ở trong rồi, không làm gì (đúng đặc tả)
        }
        await setSongRecord(songKey, record);
    }
    await setFolderSongMap(folderId, folderMap);
    return { status: 'ok', addedCount };
}

/**
 * Gỡ cascade 1 bài khỏi TẤT CẢ folder nó từng thuộc — dùng khi bài bị XOÁ THẬT khỏi `songs`
 * (khác "gỡ khỏi 1 folder cụ thể", xem plan mục 6 "Đã chốt"). Nhận songRecord qua tham số (Rule 2
 * — không tự appState.get()), KHÔNG tự setSongRecord() lại record (nơi gọi đang xoá hẳn record đó
 * ngay sau, ghi lại vô nghĩa).
 * @param {Object} songRecord - record đầy đủ của bài SẮP bị xoá (đã getSongRecord() từ trước)
 */
async function removeSongFromAllFolders(songRecord) {
    if (!songRecord || !songRecord.folder) return;
    for (const folderId of Object.keys(songRecord.folder)) {
        const folderMap = await getFolderSongMap(folderId);
        if (!folderMap) continue; // guard: folder đã bị xoá trước đó, record chỉ còn sót field cũ
        const position = songRecord.folder[folderId];
        if (folderMap.list[position] != null) {
            folderMap.list[position] = null;
            folderMap.empty++;
            await setFolderSongMap(folderId, folderMap);
        }
    }
}

/**
 * Liệt kê toàn bộ folder hiện có (metadata), dùng cho picker/UI danh sách.
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
async function listFolders() {
    const ids = await getAllFolderKeys();
    const records = await Promise.all(ids.map(id => getFolderRecord(id)));
    return records.filter(Boolean);
}

/** Pure — danh sách songKey ĐANG THẬT trong folder (lọc bỏ lỗ tombstone null). Không I/O. */
function getFolderSongKeys(folderMap) {
    return folderMap.list.filter(k => k != null);
}

/** Pure — check rỗng hoàn toàn O(1), không scan mảng. Không I/O. */
function isFolderEmpty(folderMap) {
    return folderMap.empty === folderMap.list.length;
}
