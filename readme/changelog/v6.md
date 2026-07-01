# Changelog — Ver 6 (mới nhất): Fix các lỗi vớ va vớ vẩn đáng nhẽ không nên có.

> Vòng này không thêm tính năng hoành tráng, chủ yếu là **dọn dẹp những lỗi lẽ
> ra không nên tồn tại**: sort không áp dụng ngay, menu sort bị che, ô "chưa có
> bài hát" hiện sai lúc đang có bài, mở Playlist làm khựng video nền, chuyển bài
> lóe trắng video... Nhân tiện tách lại file `playlist.js` quá khổ, thêm ô tìm
> kiếm, thống kê nghe theo từng bài, và mày mò chuyện giữ nhạc chạy nền trên điện
> thoại.

---

## 1. Tách rời "DANH SÁCH HIỂN THỊ" và "HÀNG ĐỢI PHÁT" (gốc rễ của nhiều lỗi)

Trước v6, cả phần vẽ danh sách lẫn Next/Prev đều dùng chung một mảng
`displayOrder`. Hậu quả: thêm bài lúc đang phát thì DOM **không sắp xếp lại
ngay** (vì thuật toán hàng đợi cố ý nối bài mới vào cuối để không gãy mạch đang
nghe) — nhìn như "sort bị lỗi".

v6 tách hẳn thành 2 khái niệm độc lập, cùng sinh ra từ `playlistOrder` nhưng
theo 2 quy tắc khác nhau:

- **`renderOrder` — Danh sách hiển thị (UI):** thứ người dùng NHÌN THẤY. Luôn
  được sắp theo kiểu sort đang chọn + lọc theo ô tìm kiếm, và **cập nhật NGAY**
  mỗi khi thêm/xoá/sửa bài. Không phụ thuộc đang phát bài nào.
- **`displayOrder` — Hàng đợi phát (logic):** thứ tự Next/Prev đi qua khi không
  shuffle. Thêm bài lúc đang nghe vẫn nối vào cuối (pending), chỉ resort thật khi
  "chạm biên" — đúng như cũ, nhưng giờ chuyện này **không còn ảnh hưởng tới DOM**.

→ Khắc phục trực tiếp lỗi **1.2** (sort không áp dụng ngay lúc nạp/upload/đang
phát): nay sau mỗi lần thêm bài luôn gọi `recomputeRenderOrder()` +
`renderPlaylistDiff()`, danh sách hiển thị sắp lại tức thì.

## 2. Sửa loạt lỗi giao diện Playlist

- **1.4 — Menu sort bị che / bỏ "Ngẫu nhiên":** header playlist nâng từ `z-10`
  lên `z-20`, menu sort nâng lên `z-50` nên không bị các lớp khác đè lên nữa.
  Bỏ luôn lựa chọn sort **"Ngẫu nhiên"** (random) — giờ chỉ còn *Mặc định (mới
  thêm)* / *Tên A → Z* / *Tên Z → A*. Cấu hình cũ lỡ lưu `random` sẽ tự quy về
  `az` (hàm `setDisplaySortMode` từ chối thẳng giá trị `random`).
- **1.6 — "Chưa có bài hát nào" hiện sai:** trạng thái rỗng giờ tính THUẦN theo
  dữ liệu (`liveKeys().length`), gom vào một hàm `updateEmptyState()` được gọi ở
  cuối mọi lần render. Có 2 trạng thái rỗng tách biệt: `#playlist-empty` (thư
  viện trống thật) và `#playlist-search-empty` (có bài nhưng tìm kiếm không khớp).

## 3. Ô tìm kiếm bài hát (mới)

- Thêm ô tìm kiếm ngay trong header Playlist (`#playlist-search-input` + nút xoá
  `#playlist-search-clear`). Lọc theo **tên bài + nghệ sĩ**, có chuẩn hoá bỏ dấu
  tiếng Việt nên gõ "anna" hay "ÁNH" đều khớp tự nhiên.
- Tìm kiếm CHỈ lọc danh sách hiển thị — **không đụng** tới hàng đợi phát đang
  chạy (đang nghe bài gì vẫn nguyên, Next/Prev không bị ô tìm kiếm ảnh hưởng).

## 4. Video nền: bám theo NHẠC, không bám theo màn hình (mục 2.2)

Trước đây mở/đóng Playlist gọi `handleVideoBackground()` để dừng/ẩn video — một
can thiệp phi chức năng khiến mở Playlist lúc đang nghe làm **khựng video**.

- Việc bật/tắt & phát/dừng video giờ **chỉ phụ thuộc cấu hình + trạng thái phát
  nhạc**. Playlist nằm đè (`z-[60]`) lên trên nên tự che video — không cần dừng.
- **Không lóe trắng khi chuyển bài (2.2a/b):** `src` của video chỉ gán **một
  lần** (hoặc khi URL đổi thật) nên Next/Prev **không nạp lại** video. Phía sau
  video luôn ép **nền đen cưỡng chế**, video giữ `opacity:0` cho tới khi có khung
  hình thật (`loadeddata`/`playing`) rồi mới fade lên → bỏ hẳn cú chớp trắng.
- `color-utils.js` cũng đổi: khi bật video nền, body để **`#000000`** thay vì
  `transparent` (transparent để lộ nền trắng mặc định của trang → chính là thủ
  phạm gây chớp).

## 5. Mọi visual phải "trong suốt" với video nền — sửa Rain Street (mục 2.4)

- `drawRainStreet` trước đây luôn tô một lớp trời (sky gradient) phủ kín canvas,
  che mất video nền. Nay lớp này được bọc trong `if (!vizConfig.videoBgEnabled)`
  (giống `drawRainGlass` đã làm), nên khi bật video, cảnh công viên (đất, đèn,
  hàng rào, mưa) vẫn vẽ đè nhưng **video hiện xuyên qua phần trời**.
- README bổ sung mục **"Quy ước BẮT BUỘC khi viết/sửa một Visual"**: mọi visual
  phải hỗ trợ đủ 4 nhóm — **video nền, màu nền, chế độ màu, hiệu năng** — kèm
  hướng dẫn cụ thể (bọc các fill nền trong `if(!videoBgEnabled)`, lấy màu từ
  helper chung, co giãn số phần tử theo `perf`).

## 6. Thống kê nghe theo từng bài (mục 2.6)

- File mới `js/core/listen-stats.js`: lưu `meta.songStats` dạng
  `{ key: { count, totalTime } }`.
  - `count`: +1 mỗi khi bắt đầu phát một bài.
  - `totalTime`: cộng dồn **thời gian nghe thật** của riêng bài đó (theo delta
    `timeupdate`, không tính lúc seek/tạm dừng).
- Lưu **debounce 4s** (gộp nhiều thay đổi thành một lần ghi IndexedDB), tách khỏi
  record bài hát nên **không phải ghi lại blob** mỗi lần cập nhật.
- Modal **Thông tin bài hát** giờ hiện thêm *Số lần nghe* và *Thời gian đã nghe*
  (định dạng giờ/phút/giây gọn).
- Xoá bài → xoá luôn thống kê của bài đó; "Xoá hết bài hát" → xoá toàn bộ
  `songStats`.

## 7. "Xoá hết dữ liệu" CHỈ xoá bài hát, GIỮ LẠI ảnh/video nền (quyết định 1.8)

- `clearAllStoredData()` trước đây xoá cả `bgImage` + `videoBg` và reset các
  toggle — không hợp lý vì ảnh/video nền là thiết lập riêng, không thuộc "thư
  viện nhạc". Nay **chỉ xoá bài hát** (và `songStats`, `totalListenSeconds`),
  **giữ nguyên** ảnh/video nền + trạng thái bật/tắt của chúng.
- Cập nhật lại lời thoại 2 nút xoá + các hộp thoại xác nhận cho đúng ý nghĩa
  ("...ảnh/video nền vẫn được giữ lại").

## 8. Tách `playlist.js` thành module nhiều file (mục 2.8)

`js/core/playlist.js` (một file quá khổ) **đã bị xoá**, tách thành thư mục
`js/playlist/` gồm 6 file, viết theo kiểu **object-function** ở `main.js`:

| File | Vai trò |
|---|---|
| `state.js`  | Trạng thái dùng chung (`playlistOrder`/`displayOrder`/`renderOrder`...), `formatTime`, `normalizeSongName` |
| `order.js`  | `sortKeysByMode` (default/az/za), lọc tìm kiếm, `recomputeRenderOrder`/`recomputeDisplayOrder`, pending-append |
| `render.js` | Vẽ diff theo `renderOrder`, `updateEmptyState`, `refreshSongNode`, `applySearchQuery` |
| `loader.js` | `readAudioDuration`, nạp file mới, `scanValidSongsFromDB`, `initPlaylistFromDB` |
| `actions.js`| `playSong`, xoá/sửa/info bài, menu thao tác, modal lỗi phát |
| `main.js`   | `const PlaylistMain = { initSortMenu, initSearch, init }`, tự gọi `PlaylistMain.init()` ở cuối |

- **Giữ nguyên 100% tên biến/hàm global** mà các file khác phụ thuộc
  (`playlistOrder`, `displayOrder`, `playSong`, `renderPlaylistDiff`,
  `initPlaylistFromDB`, `currentKey`, `refreshSongNode`...) → không phải sửa lan
  ra ngoài module.
- `index.html` nạp 6 file theo đúng thứ tự phụ thuộc
  `state → order → render → loader → actions → main`, đặt **trước**
  `player-controls.js`.

## 9. Giữ nhạc chạy nền trên điện thoại + tuỳ chọn giữ màn hình sáng (mục 2.10)

### Tuỳ chọn mới
- Thêm toggle **"Giữ màn hình sáng"** (`vizConfig.keepScreenOn`, mặc định BẬT)
  trong Cài đặt → mục *Khác*. Khi tắt, app **không xin Wake Lock** nữa → màn hình
  tự tắt theo thiết lập hệ điều hành để tiết kiệm pin.
- `requestWakeLock()` nay tôn trọng cờ này (tắt thì nhả wake lock ngay).

### Cố gắng giữ nhạc chạy khi vào nền (best-effort)
- Khi quay lại tab (`visibilitychange` → visible), nếu `AudioContext` bị hệ điều
  hành "suspend" thì **tự `resume()`** để tiếng trở lại ngay, không cần bấm play.
- Vẫn dùng **Media Session API** (đã có từ trước) để hiện điều khiển play/pause/
  next/prev ở màn khoá / trung tâm điều khiển.

### Giới hạn thành thật (đọc kỹ phần này)
Ứng dụng route âm thanh qua đồ thị **Web Audio API**
(`MediaElementSource → EQ → gain → destination`) để chạy equalizer + phân tích
phổ cho visual. Đây chính là chỗ vướng:

- Trên **iOS Safari**, khi vuốt ra khỏi trình duyệt / khoá máy, hệ điều hành
  **suspend AudioContext** → nhạc dừng. Đây là hành vi của hệ điều hành với web
  app dùng Web Audio, **không thể vá triệt để** bằng JavaScript thuần. Wake Lock
  chỉ giữ *màn hình sáng*, không khiến iOS cho phép Web Audio chạy nền vô thời
  hạn.
- Các mitigations ở trên (resume khi quay lại, Media Session, wake lock, không
  tự pause khi mất focus) giúp trải nghiệm **đỡ tệ hơn**, nhưng nghe nhạc nền tắt
  màn hình ổn định như app native thì một web app Web-Audio **không đảm bảo
  được**. Nếu cần chạy nền bền bỉ: để màn hình sáng (bật "Giữ màn hình sáng"),
  hoặc cân nhắc dùng app phát nhạc native.

---

## Tóm tắt file thay đổi ở ver 6

**Mới:**
- `js/core/listen-stats.js`
- `js/playlist/{state,order,render,loader,actions,main}.js`
- `CHANGELOG_v6.md`

**Sửa:**
- `index.html` (tiêu đề ver 6, cache-bust `v=20260624v6`, nạp `listen-stats.js`
  + 6 file `playlist/*.js`, bỏ dòng `playlist.js`)
- `js/components/playlist-view.js` (z-index, bỏ sort random, ô tìm kiếm, 2 trạng
  thái rỗng)
- `js/components/settings-drawer.js` (toggle "Giữ màn hình sáng")
- `js/components/storage-drawer.js` (mô tả nút xoá: chỉ xoá bài hát)
- `js/core/config.js` (`keepScreenOn: true`)
- `js/core/dom-refs.js` (ref `keepScreenOnToggle`)
- `js/core/equalizer-settings.js` (nạp/đồng bộ `keepScreenOn`, gắn handler toggle)
- `js/core/color-utils.js` (body đen thay vì transparent khi bật video)
- `js/core/state-and-video-bg.js` (`handleVideoBackground` viết lại — bám nhạc,
  gán src 1 lần, fade chống chớp trắng)
- `js/core/player-controls.js` (play→`handleVideoBackground`, cộng giờ nghe/bài
  ở timeupdate, bỏ điều khiển video theo màn hình)
- `js/core/wakelock.js` (gate theo `keepScreenOn`, resume AudioContext khi visible)
- `js/core/storage-manager.js` (clear chỉ xoá bài + `songStats`, giữ ảnh/video nền)
- `js/visualizers/draw-visualizer.js` (gọi `loadSongStats()` lúc khởi động)
- `js/visualizers/types/rain.js` (Rain Street để video nền hiện xuyên qua trời)
- `README.md` (cấu trúc module mới + quy ước BẮT BUỘC cho visual)

**Xoá:**
- `js/core/playlist.js` (đã tách hết sang `js/playlist/`)

---

## Cập nhật bổ sung ver 6 (đợt 2)

Một số chỉnh sửa nhỏ tiếp theo trong cùng vòng ver 6:

1. **Video nền: fade chỉ xảy ra ĐÚNG MỘT LẦN.** Tách `handleVideoBackground()`
   thành hai phần: `setupVideoBgSource()` (gán nguồn + fade nền-đen→hiện-video,
   chỉ chạy khi URL video đổi) và `syncVideoBgToAudio()` (chỉ play/pause video
   theo nhạc, KHÔNG đụng opacity). Sự kiện `play`/`pause` của nhạc giờ chỉ gọi
   `syncVideoBgToAudio()` → **Next/Prev không còn lặp lại cú "nền đen rồi fade
   video"** như trước; fade chỉ diễn ra lần đầu nạp video vào trình phát.
2. **Bố cục đầu Playlist.** Đưa ô tìm kiếm lên hàng trên cùng (cố định), nút
   **Thêm nhạc** nằm sát bên trái, nút **Cài đặt** nằm sát bên phải ô tìm kiếm.
3. **Đổi nhãn "Xuất file (gắn tag mới)" → "Xuất tệp"** (cả trong menu 3 chấm lẫn
   modal Thông tin bài hát).
4. **Thông tin bài hát:** bỏ dòng "Tên file gốc" (thay bằng "Tên bài").
5. **Thời gian đã nghe đo bằng đồng hồ thực.** Thay cách cộng dồn cũ (dựa trên
   delta `currentTime` của thanh tiến trình — nhảy khi seek, khựng khi buffer)
   bằng một bộ đếm `performance.now()` chạy mỗi giây CHỈ khi nhạc thực sự phát,
   có chặn delta bất thường (tab nền/máy ngủ). Nhờ vậy thống kê "đã nghe bao lâu"
   độc lập hoàn toàn với thanh tiến trình và chính xác hơn.
6. **Loading shield có tham số `display` (on/off).** `withLoadingShield(text, fn,
   display=true)`: khi `display=false` vẫn chạy logic + khoá chồng lệnh nhưng
   KHÔNG hiện lớp che. **Chuyển bài (Next/Prev) giờ dùng `display=false`** nên bỏ
   hẳn cú nháy lớp đen `bg-black/80` mỗi lần đổi bài — kết hợp với sửa video ở
   mục 1, việc chuyển bài giờ mượt hoàn toàn, không chớp.

---

## Cập nhật bổ sung ver 6 (đợt 3) — giao diện Playlist

1. **Bố cục lại đầu Playlist.** "Bài hát" nằm cạnh trái cùng hàng với thanh tìm
   kiếm. Nút **Thêm nhạc** và **Cài đặt** quay về cụm icon góc phải (chỗ cũ),
   cạnh nút Đang-phát và Đổi-giao-diện. Hàng nút Phát / Trộn bài / Sắp xếp giữ
   bên dưới. Giảm khoảng đệm trên cùng của khu vực header cho gọn hơn.
2. **Lớp "đang nạp danh sách" (chống nháy "chưa có bài nào").** Thêm
   `#playlist-loading-list` phủ lên vùng list lúc khởi động. Logic ở
   `initPlaylistFromDB`: nếu **không có key nào (≤ 0)** → hiện luôn "Chưa có bài
   hát nào"; nếu **có key** → phủ lớp nạp hiển thị tiến độ "Đang nạp dữ liệu
   x / y bài..." trong lúc đọc record từ IndexedDB, rồi **fade out** khi DOM list
   dựng xong. Trạng thái rỗng `#playlist-empty` giờ mặc định ẩn (chỉ hiện khi
   thật sự không có bài) nên không còn cú nháy "chưa có bài nào" lúc đang nạp.
