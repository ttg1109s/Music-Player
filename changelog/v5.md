# Changelog — Ver 5 (mới nhất): Tích hợp IndexedDB

> Thực hiện theo `PLAN_INDEXEDDB.md`. Thay đổi lớn nhất từ trước tới nay: toàn bộ playlist
> (nhạc, tag, cover, phụ đề, ảnh/video nền) giờ persist qua IndexedDB — reload trang không
> còn mất playlist như trước (trước đây `playlist` chỉ là mảng `File` object sống trong RAM).

## 1. Lưu trữ — IndexedDB (`musicPlayerDB`)

- Thêm thư viện **idb-keyval** (UMD, CDN) — wrapper IndexedDB tối giản.
- Thêm thư viện **browser-id3-writer** (CDN) — ghi ID3 tag mới vào blob lúc Export
  (`jsmediatags` cũ chỉ đọc, không viết).
- 2 store riêng trong DB `musicPlayerDB`:
  - `songs`: mỗi record 1 bài hát — `filename`, `blob` (mp3 gốc, không đổi khi sửa tag),
    `tag` (title/artist/album, ghi đè trực tiếp khi sửa), `cover` (Blob, không base64),
    `subtitles`, `duration`, `addedAt`.
  - `meta`: `playlistOrder` (mảng key theo thứ tự hiển thị), `totalListenSeconds`
    (thời lượng nghe thật, cộng dồn), `bgImage`/`videoBg` (Blob ảnh/video nền).
- File mới `js/core/db.js`: `slugify()`, `resolveSongKey()` (ghi đè đúng bài cùng tên file,
  thêm hậu tố `-2`/`-3`... khi 2 file khác nội dung trùng slug), CRUD helper cho cả 2 store.

## 2. Playlist viết lại hoàn toàn (`js/core/playlist.js`)

- Bỏ hẳn mảng `playlist` (chứa `File` object trong RAM) + `currentIndex`. Thay bằng:
  - `playlistOrder` (mảng key/slug, đồng bộ `meta.playlistOrder`),
  - `playlistCache` (Map key → tag/cover/duration, **không** giữ blob — tiết kiệm RAM),
  - `currentKey` (thay cho `currentIndex`),
  - `brokenKeys` (Set key có dữ liệu lỗi, để hiện cảnh báo riêng trong danh sách).
- **Khởi động app**: đọc `meta.playlistOrder`, nạp tag+cover cho mỗi bài (KHÔNG đọc blob)
  để render playlist ngay — reload trang giờ thấy lại đúng danh sách cũ.
- **`playSong(key)`** giờ async hoàn toàn: đọc blob từ IndexedDB tại đúng thời điểm phát,
  bọc trong `withLoadingShield` (mục 4). Bài lỗi dữ liệu (key có trong playlist nhưng
  record không đọc được): hiện cảnh báo, **giữ nguyên** `currentKey` ở bài hợp lệ trước đó
  (không "treo" vào bài lỗi), `audioPlayer` dừng yên — thoát trạng thái này bằng next/prev
  hoặc chọn phát bài khác.
- Render dùng `data-key` + event delegation (1 listener trên `playlistContainer`) thay cho
  `onclick="playSong(${idx})"` inline.
- Mỗi bài trong danh sách có thêm **3 icon mới** (info / sửa tag / xuất file) cạnh icon xoá,
  cho cả List view và Grid view.

## 3. Sửa thông tin bài hát, thông tin chi tiết, Export gắn tag mới

- Modal "Sửa thông tin" (title/artist/album) — ghi đè `record.tag`, **không đụng** `blob`
  gốc. Nếu đang là bài phát, cập nhật UI (`playerTitle`/`playerArtist`) ngay, không cần
  phát lại.
- Modal "Thông tin chi tiết" — filename gốc, nghệ sĩ, album, thời lượng.
- **Export (gắn tag mới)** (`js/core/id3-export.js`): đọc tag mới nhất từ IndexedDB, ghi
  vào 1 bản blob mới qua `browser-id3-writer`, tải xuống. Blob **gốc** trong DB không bị
  đổi — export lại nhiều lần vẫn nhất quán, không tích lũy lỗi ghi ID3 lặp lại.

## 4. `withLoadingShield` — utility che màn hình dùng chung

- File mới `js/core/loading-shield-util.js`: 1 khoá toàn cục (`isShieldBusy`) tự động chặn
  mọi tác vụ dùng shield chạy chồng nhau (nạp file / chuyển bài / lưu ảnh nền...).
- Component `loading-shield.js` đổi cơ chế ẩn/hiện từ `hidden` sang `opacity-0` +
  `pointer-events-none` để hiệu ứng fade chạy thật (trước đây `display:none` không
  transition được).
- Áp dụng cho: nạp nhạc, chuyển bài, xóa bài, lưu/xóa ảnh nền, lưu/xóa video nền, export.

## 5. Ảnh nền & Video nền giờ qua IndexedDB

- Thêm toggle **"Sử dụng Ảnh nền Playlist"** (`setting-bg-image-enable`) — đồng bộ cơ chế
  với toggle Video đã có. Tắt toggle → tự xóa Blob khỏi IndexedDB, không giữ lại.
- `loadBackgroundAssets()` (gọi từ `loadConfig()`, giờ là `async`): đọc lại Blob ảnh/video
  từ `meta`, tự sửa trạng thái **"on ảo"** nếu config nói đang bật nhưng IndexedDB không
  còn Blob tương ứng (áp dụng đồng nhất cho cả ảnh và video — trước đây chỉ video có cơ
  chế tự sửa này).

## 6. Phụ đề — nguồn sự thật chuyển sang IndexedDB

- Bỏ biến `subtitlesBySongId` (map tạm theo `song.id` đổi mỗi lần nạp lại) — phụ đề giờ
  đọc/ghi trực tiếp `record.subtitles` theo key bền (slug), không mất khi nạp lại trang.
- Sửa trong lúc edit vẫn chỉ thay đổi biến `subtitles` tạm trong RAM; bấm **Áp dụng** mới
  là điểm ghi đè IndexedDB duy nhất (giữ đúng hành vi UI cũ, không ghi liên tục mỗi lần sửa
  1 dòng).

## 7. About Drawer (mới) — "Về trình phát"

- Drawer mới mở từ mục "Về trình phát" trong Cài đặt, mở chồng lên trên Settings
  (navigation stack kiểu Settings app trên điện thoại — Back chỉ ẩn About).
- **Thống kê** (tính động mỗi lần mở): tổng số bài, tổng thời lượng các bài, thời lượng đã
  nghe thật (cộng dồn qua `meta.totalListenSeconds`, flush mỗi 5s khi đang phát), dung
  lượng đang dùng (MB/GB). Chỉ tính trên store `songs` — không lẫn ảnh/video nền.
- **Giới thiệu** + **Cảnh báo lưu trữ**: dữ liệu gắn theo trình duyệt + thiết bị, có thể bị
  hệ điều hành tự dọn khi thiếu dung lượng, rủi ro khi không có mạng để tải lại trang
  (chưa dùng Service Worker), khuyến nghị giữ file gốc ở nơi khác.

## 8. Các thay đổi kỹ thuật khác

- `currentObjectURL` (audio) tách riêng khỏi `currentCoverObjectURL` (cover) — revoke đúng
  lúc, tránh leak memory cho cả 2.
- `playNext`/`playPrev` chuyển từ index số sang key — `shuffleIndices` giờ là mảng key đã
  xáo trộn.
- Đã kiểm thử bằng test harness `vm.createContext` (stub DOM/Canvas/Three.js/Web
  Audio/idb-keyval/jsmediatags/ID3Writer): xác nhận đúng thứ tự nạp 35 file script, và xác
  nhận đúng hành vi của slugify/resolveKey, nạp file mới, playSong, bài lỗi dữ liệu,
  removeSong (chặn xóa bài đang phát), edit tag (không đụng blob), computeStats (tách
  đúng store), persist phụ đề, export/restore, loadBackgroundAssets.
