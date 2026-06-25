# Simple Audio Visualizer

Bản chia nhỏ và phát triển từ tệp `VM_4.html` gốc (2032 dòng, 1 file duy nhất) thành các
file CSS / JS / "component" HTML riêng biệt, **không dùng ES6 module**
(`import`/`export`) — toàn bộ vẫn dùng `<script src="...">` thông thường để
chạy được trực tiếp khi mở `index.html` bằng cách double-click (file://),
không cần server, không cần build step.

Ngoài việc chia module, project đã qua nhiều lượt cải tiến tính năng/visual.
Bản hiện tại (**ver 8**) tập trung vào chỉnh sửa metadata bài hát và dọn
kiến trúc file: modal "Sửa thông tin bài hát" có thêm tab "Ảnh bìa" (upload/
xem trước/xóa cover ngay trong app, tự ghi vào tag APIC lúc Xuất tệp), 2
modal liên quan thông tin/ảnh bài hát thiết kế lại theo theme kính mờ "nét"
(`glass-modal`, layout dạng card/icon), thêm logo wordmark "SAV" (không
khung/viền, kiểu Facebook) hover trượt chữ theo chiều ngang ở góc Playlist,
nút "Thêm nhạc" hỗ trợ chọn cả 1 thư mục nhạc, ô tìm kiếm lọc thêm theo
album, và `js/components/settings-drawer.js` (từng dồn ~28KB HTML vào 1
file) được tách thành 5 file con theo từng khối cài đặt. Chi tiết đầy đủ ở [changelog/v8.md](./changelog/v8.md). Ver 7 trước đó
tách thuật toán nhận diện cao độ (YIN) sang Web Worker riêng để không tranh
CPU với canvas mỗi khung hình, sửa 2 điểm O(n²) khi playlist lớn, khoá định
dạng file ở cả 3 nơi nhận upload (nhạc/ảnh nền/video nền), và cấu hình tự
phục hồi từ IndexedDB nếu `localStorage` bị trình duyệt xoá mất. Ver 6 dọn
lỗi vặt còn sót từ ver 5 (sort, trạng thái rỗng, video nền chớp/khựng), tách
lại file `playlist.js` quá khổ, thêm ô tìm kiếm + thống kê nghe theo từng
bài. Ver 5 là thay đổi lớn nhất — toàn bộ playlist (nhạc, tag, cover, phụ
đề, ảnh/video nền) persist qua **IndexedDB**. Lịch sử các bản cũ hơn nằm ở
changelog riêng từng bản, gom trong thư mục [changelog/](./changelog/).

- [changelog/v8.md](./changelog/v8.md)
- [changelog/v7.md](./changelog/v7.md)
- [changelog/v6.md](./changelog/v6.md)
- [changelog/v5.md](./changelog/v5.md)
- [changelog/v4.md](./changelog/v4.md)
- [changelog/v3.md](./changelog/v3.md)
- [changelog/v2.md](./changelog/v2.md)
- [changelog/v1.md](./changelog/v1.md)

## Vì sao không dùng ES6 module ở đây?

Với `type="module"`, mỗi file có scope riêng và trình duyệt áp dụng CORS khi
nạp qua `file://`, nên sẽ bị lỗi khi mở trực tiếp. Với `<script>` thường,
tất cả file chia sẻ **cùng một global scope** giống như khi chúng còn nằm
trong một thẻ `<script>` duy nhất — đây là lý do toàn bộ logic gốc vẫn chạy
đúng dù đã được chia ra nhiều file.

## Cấu trúc thư mục

```
visual-master/
├── README.md
├── changelog/
│   ├── v1.md
│   ├── v2.md
│   ├── v3.md
│   ├── v4.md
│   ├── v5.md
│   ├── v6.md
│   ├── v7.md
│   └── v8.md
├── index.html                  ← Mở file này để chạy ứng dụng
├── css/
│   └── styles.css               (toàn bộ CSS gốc, không đổi)
└── js/
    ├── components/
    │   ├── loading-shield.js    (★★★★★ ver 5 — đổi cơ chế ẩn/hiện sang opacity)
    │   ├── playlist-view.js     (★★★★★ ver 5, ★★★★★★ ver 6 — ô tìm kiếm, z-index, bỏ sort random; ★★★★★★★★ ver 8 — logo wordmark SAV trượt ngang, tab "Ảnh bìa" trong modal sửa thông tin, 2 modal thiết kế lại theo `glass-modal`, menu "Chọn file/Chọn cả thư mục")
    │   ├── visualizer-overlay.js
    │   ├── subtitle-modal.js
    │   ├── bottom-player.js
    │   ├── settings/            (★★★★★★★★ mới ở ver 8 — 5 section HTML tách từ settings-drawer.js cũ)
    │   │   ├── playlist-background.js       (TPL_SETTINGS_PLAYLIST_BG — Video BG, ảnh nền Playlist + blur)
    │   │   ├── visualizer-geometry-color.js (TPL_SETTINGS_VISUALIZER — chất lượng render, hình học + màu sắc)
    │   │   ├── audio-eq.js                  (TPL_SETTINGS_AUDIO_EQ — âm lượng, preset EQ, dải tần số thủ công)
    │   │   ├── subtitle-style.js            (TPL_SETTINGS_SUBTITLE_STYLE — style khung/chữ phụ đề)
    │   │   └── misc.js                      (TPL_SETTINGS_MISC — giữ màn hình sáng, mở About Drawer)
    │   ├── settings-drawer.js   (★ ver 1, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — toggle "Giữ màn hình sáng"; ★★★★★★★ ver 7 — accept= khớp whitelist ảnh/video; ★★★★★★★★ ver 8 — VIẾT LẠI HOÀN TOÀN: chỉ còn object điều phối `SettingsDrawer.build()` ghép 5 file trong settings/, không tự chứa HTML)
    │   ├── storage-drawer.js    (★★★★★★ ver 6 — mô tả nút xoá: chỉ xoá bài hát)
    │   └── about-drawer.js      (★★★★★ mới ở ver 5 — thống kê, giới thiệu, cảnh báo IndexedDB)
    ├── main.js                  (★★★★★ ver 5 — ghép thêm TPL_ABOUT_DRAWER)
    ├── core/
    │   ├── config.js            (★ ver 1, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — thêm keepScreenOn)
    │   ├── dom-refs.js          (★ ver 1, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — ref keepScreenOnToggle; ★★★★★★★★ ver 8 — ref savLogo, folderInput, btnUploadAudio, uploadActionMenu)
    │   ├── db.js                (★★★★★ mới ở ver 5 — IndexedDB: slugify/resolveKey/CRUD)
    │   ├── upload-validation.js (★★★★★★★ mới ở ver 7 — validate MIME/đuôi file cho nhạc/ảnh nền/video nền; tái dùng ở ver 8 cho ảnh bìa bài hát)
    │   ├── loading-shield-util.js (★★★★★ mới ở ver 5 — withLoadingShield dùng chung)
    │   ├── three-vortex.js      (★ ver 1, ★★ ver 2)
    │   ├── state-and-video-bg.js (★★★★★ ver 5, ★★★★★★ ver 6 — handleVideoBackground viết lại, bám nhạc không bám màn hình; ★★★★★★★ ver 7 — validate định dạng video lúc upload)
    │   ├── subtitles.js         (★★★★★ ver 5 — persist subtitles khi Apply)
    │   ├── equalizer-settings.js (★ ver 1, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — nạp/đồng bộ keepScreenOn; ★★★★★★★ ver 7 — backup config sang IndexedDB debounce + fallback phục hồi khi mất localStorage)
    │   ├── subtitle-display.js
    │   ├── wakelock.js          (★★★★★ ver 5, ★★★★★★ ver 6 — gate theo keepScreenOn, resume AudioContext khi visible)
    │   ├── color-utils.js       (★★★★★★ ver 6 — nền đen thay transparent khi bật video, chống chớp trắng)
    │   ├── canvas-scene-setup.js (★ ver 1, ★★ ver 2, ★★★ ver 3, ★★★★ ver 4)
    │   ├── listen-stats.js      (★★★★★★ mới ở ver 6 — số lần nghe + thời gian nghe riêng từng bài, key {count,totalTime} trong meta.songStats)
    │   ├── player-controls.js   (★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — video bám theo nhạc, cộng dồn giờ nghe/bài, gate wake lock; ★★★★★★★ ver 7 — validate định dạng ảnh nền lúc upload)
    │   ├── audio-engine.js      (★★★★★★★ ver 7 — detectPitchYIN() dời sang pitch-worker.js; chỉ còn cầu nối postMessage/onmessage)
    │   ├── audio-analysis.js   (★★★★★★★ ver 7 — đọc kết quả pitch bất đồng bộ từ worker thay vì gọi hàm đồng bộ)
    │   ├── pitch-worker.js      (★★★★★★★ mới ở ver 7 — Web Worker thuần CPU cho thuật toán YIN, tách khỏi main thread/draw loop)
    │   ├── rubik-math.js
    │   ├── about-stats.js       (★★★★★ mới ở ver 5 — computeStats() cho About Drawer)
    │   ├── id3-export.js        (★★★★★ mới ở ver 5 — export/restore gắn tag mới qua ID3Writer; ảnh bìa sửa ở ver 8 tự được ghi vào APIC, không cần sửa file này)
    │   └── storage-manager.js   (★★★★★★ ver 6 — "Xoá hết" chỉ xoá bài hát, GIỮ ảnh/video nền)
    ├── playlist/                (★★★★★★ mới ở ver 6 — tách từ core/playlist.js cũ thành module nhiều file, kiểu object-function)
    │   ├── state.js             (state dùng chung: playlistOrder / displayOrder [hàng đợi phát] / renderOrder [danh sách hiển thị] tách rời)
    │   ├── order.js             (sort default/az/za — KHÔNG còn random; lọc tìm kiếm; pending-append hàng đợi khi đang phát; ★★★★★★★ ver 7 — applyNewSongsToDisplayOrder() dùng Set tra cứu O(1) thay .includes() O(n); ★★★★★★★★ ver 8 — matchesSearch() lọc thêm theo album)
    │   ├── render.js            (vẽ diff theo renderOrder; trạng thái rỗng #playlist-empty / #playlist-search-empty thuần theo dữ liệu)
    │   ├── loader.js            (đọc duration, nạp file mới, quét/khởi tạo playlist từ IndexedDB; ★★★★★★★ ver 7 — validate định dạng nhạc trước khi xử lý, Set tra cứu O(1) thay .includes() O(n) trong vòng lặp nạp file; ★★★★★★★★ ver 8 — tách `handleAudioFiles()` dùng chung cho input file rời + input "Chọn cả thư mục", thêm menu nhỏ cho nút Thêm nhạc)
    │   ├── actions.js           (playSong, xoá/sửa/info bài, menu thao tác — info hiện số lần nghe + giờ nghe riêng; ★★★★★★★ ver 7 — reset trạng thái pitch worker khi đổi bài; ★★★★★★★★ ver 8 — tab "Ảnh bìa" trong modal sửa: upload/xem trước/xóa cover, lưu cùng lúc với title/artist/album)
    │   └── main.js              (object `PlaylistMain`: initSortMenu + initSearch + init(); tự gọi init ở cuối)
    └── visualizers/
        ├── draw-helpers.js      (★★★ ver 3, ★★★★ ver 4)
        ├── draw-visualizer.js   (★ ver 1, ★★ ver 2, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — thêm loadSongStats() lúc khởi động)
        └── types/               (★★★★ mới ở ver 4 — mỗi visual một file riêng)
            ├── bar.js              (visual "Bar": kiểu Phản chiếu cánh bướm + kiểu Thác đổ)
            ├── lightning.js
            ├── rubik.js
            ├── vortex.js           (phần update mỗi khung hình; khởi tạo vẫn ở three-vortex.js)
            ├── black-hole.js
            └── rain.js             (★★★★★★ ver 6 — Rain Street để video nền hiện xuyên qua trời)
```

(★ = có thay đổi ở ver 1, ★★ = thêm ở ver 2, ★★★ = thêm ở ver 3, ★★★★ = thêm
ở ver 4, ★★★★★ = thêm ở ver 5, ★★★★★★ = thêm ở ver 6, ★★★★★★★ = thêm ở
ver 7, ★★★★★★★★ = thêm ở ver 8; file không đánh dấu giữ nguyên 100% so với
bản chia module gốc.)

> **Lưu ý ver 8:** `js/components/settings-drawer.js` KHÔNG còn chứa HTML
> trực tiếp — toàn bộ nội dung gốc được tách sang thư mục
> `js/components/settings/` (5 file), mỗi file giữ ĐÚNG NGUYÊN HTML của 1
> section, đã kiểm chứng output ghép lại giống 100% bản trước khi tách
> (xem mục 5 trong [changelog/v8.md](./changelog/v8.md)). Biến
> `TPL_SETTINGS_DRAWER` mà `main.js` dùng được GIỮ NGUYÊN TÊN.

> **Lưu ý ver 6:** `js/core/playlist.js` (bản ver 5) ĐÃ BỊ XOÁ — toàn bộ nội
> dung được tách sang thư mục `js/playlist/` (6 file). Mọi tên biến/hàm global
> cũ (`playlistOrder`, `displayOrder`, `playSong`, `renderPlaylistDiff`,
> `initPlaylistFromDB`, `currentKey`...) được GIỮ NGUYÊN nên các file khác
> không phải sửa; chỉ thêm khái niệm mới `renderOrder` (danh sách hiển thị,
> tách khỏi hàng đợi phát).

## Thứ tự nạp script — QUAN TRỌNG, không thay đổi

`index.html` nạp script theo đúng 4 bước, không được đảo:

0. **CDN trong `<head>`**: Tailwind, jsmediatags, NoSleep.js, Three.js (như cũ)
   + **idb-keyval** (wrapper IndexedDB) và **browser-id3-writer** (ghi ID3 tag
   mới lúc Export) — thêm ở ver 5.
1. **components/*.js** — chỉ định nghĩa biến `TPL_...` (chuỗi HTML), chưa
   đụng vào DOM. **Từ ver 8:** 5 file trong `components/settings/` PHẢI nạp
   TRƯỚC `components/settings-drawer.js` — file đó giờ chỉ là object điều
   phối `SettingsDrawer.build()` ghép 5 biến `TPL_SETTINGS_*` (định nghĩa ở
   5 file con) lại thành `TPL_SETTINGS_DRAWER`, gọi đồng bộ ngay khi nạp.
2. **main.js** — chèn toàn bộ `TPL_...` vào `<div id="app-root">`. Sau bước
   này, mọi phần tử có `id="..."` mới thực sự tồn tại trong DOM.
3. **core/*.js** — các file này gọi `document.getElementById(...)` ngay khi
   được nạp, nên phải chạy sau bước 2. Thứ tự giữa các file trong `core/`
   cũng giữ nguyên như trong file gốc vì có phụ thuộc biến/hàm giữa chúng.
   Từ ver 5: `db.js` và `loading-shield-util.js` nạp ngay sau `dom-refs.js` —
   cần `#loading-shield`/`#loading-text` đã có trong DOM, và phải có mặt
   TRƯỚC các file `js/playlist/*.js`/`equalizer-settings.js`/`subtitles.js`/
   `state-and-video-bg.js`/`about-stats.js`/`id3-export.js` vì các file đó
   gọi hàm helper định nghĩa trong 2 file này. Từ ver 6: `listen-stats.js`
   nạp ngay sau `db.js`, và 6 file `js/playlist/*.js` nạp theo đúng thứ tự
   `state → order → render → loader → actions → main` (file sau dùng hàm/biến
   của file trước; `main.js` tự gọi `PlaylistMain.init()` ở cuối), đặt TRƯỚC
   `player-controls.js`. **Từ ver 7:** `upload-validation.js` nạp ngay sau
   `db.js` (cùng nhóm "helper sớm" như `loading-shield-util.js`) — định nghĩa
   `validateAudioFile()`/`validateImageFile()`/`validateVideoFile()`, phải có
   mặt TRƯỚC `js/playlist/loader.js` (validate nhạc), `player-controls.js`
   (validate ảnh nền) và `state-and-video-bg.js` (validate video nền).
4. **visualizers/draw-helpers.js**, rồi **visualizers/types/\*.js** (mỗi
   visual một file, không phụ thuộc thứ tự lẫn nhau), rồi cuối cùng
   **visualizers/draw-visualizer.js** — file này gọi tới các hàm `draw*`
   định nghĩa trong `types/`, nên phải nạp sau cùng. Nó cũng còn chứa dòng
   `document.addEventListener('DOMContentLoaded', async () => { await
   loadConfig(); updateSubToggleUI(); await loadSongStats(); await
   initPlaylistFromDB(); })` ở cuối cùng — đây là điểm khởi động thực sự của
   toàn bộ app. Từ ver 5, `loadConfig()` là `async` (đọc ảnh/video nền từ
   IndexedDB) và có `initPlaylistFromDB()` (đọc lại playlist đã lưu, render
   danh sách ngay khi mở trang). Từ ver 6 có thêm `loadSongStats()` (đọc
   thống kê nghe theo từng bài trước khi render playlist). Từ ver 7,
   `loadConfig()` còn có thể `await getMeta('configBackup')` (đọc IndexedDB)
   nếu localStorage rỗng — xem mục riêng trong changelog/v7.md.

> **Lưu ý riêng cho `js/core/pitch-worker.js` (mới ở ver 7):** đây KHÔNG nằm
> trong danh sách `<script src="...">` ở trên — nó được nạp bằng
> `new Worker('js/core/pitch-worker.js')` ngay trong `audio-engine.js`
> (`initPitchWorker()`), chạy trên 1 thread hoàn toàn riêng biệt, không chia
> sẻ global scope với các file `core/*.js` khác. Đường dẫn `'js/core/...'`
> trong `new Worker(...)` resolve theo base URL của `index.html`, giống mọi
> đường dẫn tương đối khác trong project — không tương đối theo file JS gọi
> nó. Đây vẫn là *classic Worker* (không `type: 'module'`) để chạy được qua
> `file://`, đồng bộ với chủ trương "không build step, không ES6 module" của
> toàn bộ project (xem mục *Vì sao không dùng ES6 module ở đây?* phía trên).

## Cách dùng

Mở `index.html` bằng double-click (hoặc kéo vào trình duyệt), hoặc deploy
lên GitHub Pages / bất kỳ static host nào (khuyến nghị từ ver 5 vì IndexedDB
hoạt động ổn định hơn theo origin `https://` so với `file://`). Ứng dụng cần
kết nối Internet ở lần mở đầu để tải các thư viện qua CDN (Tailwind,
jsmediatags, NoSleep.js, Three.js, idb-keyval, browser-id3-writer).

**Lưu ý quan trọng (ver 5):** nhạc/tag/cover/phụ đề/ảnh-video nền giờ lưu
trong IndexedDB của trình duyệt — gắn theo từng trình duyệt + thiết bị cụ
thể, không tự đồng bộ qua thiết bị khác, và có thể bị hệ điều hành tự dọn
khi thiết bị thiếu dung lượng. Xem mục "Cảnh báo" trong About Drawer
(Cài đặt → Về trình phát) để biết chi tiết.

**Lưu ý mới (ver 6):** "Xoá hết dữ liệu" trong Quản lý dung lượng giờ **chỉ
xoá bài hát** — ảnh/video nền KHÔNG còn bị xoá theo. Xem
[changelog/v6.md](./changelog/v6.md) (mục 7) để biết lý do.

**Lưu ý mới (ver 8):** ảnh bìa chỉnh trong tab "Ảnh bìa" của modal "Sửa
thông tin bài hát" được lưu CÙNG record bài hát trong IndexedDB (field
`cover`, đã tồn tại từ ver 5) — không phải lưu riêng. Đổi ảnh bìa ở đây
hoàn toàn tương đương với việc bài hát có ảnh bìa mới ngay từ lúc nạp file;
"Xuất tệp" (mục Sửa/Thông tin → Xuất tệp) sẽ ghi đúng ảnh đó vào tag APIC.

## Muốn sửa gì thì sửa ở đâu?

| Muốn sửa... | Vào file... |
|---|---|
| Giao diện danh sách bài hát | `js/components/playlist-view.js` |
| Logo "SAV" góc trái Playlist (wordmark, hover trượt chữ ngang) | `js/components/playlist-view.js` (khối `#sav-logo`, thuần CSS `max-width` transition theo từng `<span>` chữ thường) |
| Tab "Ảnh bìa" trong modal sửa thông tin (upload/xem trước/xóa cover) | `js/components/playlist-view.js` (HTML 2 tab trong `#song-edit-modal`), `js/playlist/actions.js` (logic `setSongEditTab`/lưu) |
| Menu "Chọn file nhạc / Chọn cả thư mục" cho nút Thêm nhạc | `js/components/playlist-view.js` (HTML `#upload-action-menu`), `js/playlist/loader.js` (mở/đóng menu, `handleAudioFiles()` dùng chung cho 2 input) |
| Giao diện ngăn cài đặt — khung ngoài + thứ tự ghép section | `js/components/settings-drawer.js` (object điều phối `SettingsDrawer`) |
| Giao diện ngăn cài đặt — nội dung từng khối (Playlist & Nền / Visualizer / Audio EQ / Phụ đề / Khác) | `js/components/settings/*.js` (1 file = 1 khối, xem bảng cấu trúc thư mục) |
| Visual "Bar" (kiểu Phản chiếu cánh bướm / kiểu Thác đổ) | `js/visualizers/types/bar.js` |
| Visual "Rain" (kiểu Trôi cửa kính / kiểu Mưa phố, đèn đường, hàng rào) | `js/visualizers/types/rain.js` |
| Visual "Rubik" (phóng to/thu nhỏ theo beat, xoay tự thân + xoay lớp theo pitch) | `js/visualizers/types/rubik.js` (map nốt→trục/lớp ở `RUBIK_NOTE_TO_TURN` trong `js/core/dom-refs.js`) |
| Visual Lightning / Black Hole | `js/visualizers/types/lightning.js`, `black-hole.js` (tương ứng) |
| Vòng lặp render chính, thêm visual mới vào bảng dispatch | `js/visualizers/draw-visualizer.js` (object `VISUALIZER_DRAWERS`) |
| Hàm vẽ dùng chung (giọt nước, khung kính, nốt nhạc bay lên) | `js/visualizers/draw-helpers.js` |
| Logic phát nhạc, next/prev, shuffle | `js/playlist/actions.js` (playSong), `js/playlist/order.js` (hàng đợi/shuffle), `js/core/player-controls.js` (next/prev) |
| Lưu trữ IndexedDB (nhạc/tag/cover/sub/ảnh-video nền), slugify/resolve key | `js/core/db.js` |
| Validate định dạng file upload (nhạc/ảnh nền/video nền/ảnh bìa bài hát) | `js/core/upload-validation.js` (`validateAudioFile`/`validateImageFile`/`validateVideoFile`) |
| Che màn hình khi xử lý (nạp nhạc/chuyển bài/lưu ảnh nền/lưu ảnh bìa...) | `js/core/loading-shield-util.js` (hàm `withLoadingShield`) |
| Sửa tag/info/ảnh bìa/export gắn tag mới của 1 bài | `js/playlist/actions.js` (modal sửa — tab Thông tin + tab Ảnh bìa; modal info — số lần nghe + giờ nghe), `js/core/id3-export.js` (export, tự ghi `record.cover` vào APIC) |
| Sắp xếp danh sách / ô tìm kiếm (lọc theo tên/nghệ sĩ/album) / tách danh-sách-hiển-thị khỏi hàng-đợi-phát | `js/playlist/order.js` (sort + `matchesSearch`), `js/playlist/render.js` (vẽ + trạng thái rỗng), `js/playlist/main.js` (gắn menu sort + ô tìm kiếm) |
| Số lần nghe / thời gian nghe riêng từng bài | `js/core/listen-stats.js` (lưu `meta.songStats`), cộng dồn ở `js/core/player-controls.js` (timeupdate) |
| Giữ màn hình sáng (wake lock) / cố giữ nhạc chạy nền | `js/core/wakelock.js` (gate theo `vizConfig.keepScreenOn`, resume AudioContext khi quay lại tab), toggle UI ở `js/components/settings/misc.js` |
| Video nền (bật/tắt, gán src, chống chớp trắng) | `js/core/state-and-video-bg.js` (hàm `handleVideoBackground`) |
| "Xoá hết dữ liệu" / tải nhạc về rồi xoá | `js/core/storage-manager.js` (hàm `clearAllStoredData`), UI ở `js/components/storage-drawer.js` |
| Thống kê "Về trình phát" (About Drawer) | `js/core/about-stats.js`, `js/components/about-drawer.js` |
| Hiện/ẩn các khối setting theo kiểu visualizer/kiểu Bar đang chọn | `js/core/player-controls.js` (hàm `updateTypeUI`, `updateBarStyleUI`) |
| Equalizer, cấu hình lưu localStorage | `js/core/equalizer-settings.js`, UI ở `js/components/settings/audio-eq.js` |
| Phụ đề (.srt) — logic | `js/core/subtitles.js`, `js/core/subtitle-display.js`; style khung/chữ — UI ở `js/components/settings/subtitle-style.js` |
| Hiệu ứng Vortex (Three.js) — khởi tạo rings/bars/wave, camera | `js/core/three-vortex.js` (khởi tạo) + `js/visualizers/types/vortex.js` (cập nhật mỗi khung hình) |
| Khởi tạo đèn đường/hàng rào/mưa phố, mặt đất an toàn dưới control bar | `js/core/canvas-scene-setup.js` (hàm `generateStreetScene`, `getPlayerBarSafeHeight`) |
| Phát hiện pitch (nốt nhạc YIN), nốt MIDI trung bình động dùng cho Rubik | `js/core/audio-analysis.js` (hàm `updateStatsDashboard`), `js/core/audio-engine.js` + `js/core/pitch-worker.js` (thuật toán `detectPitchYIN` chạy trên Worker) |
| Thêm trường cấu hình mới (lưu vào `vizConfig`) | `js/core/config.js` (giá trị mặc định) + `js/core/equalizer-settings.js` (nạp lúc `loadConfig`) |
| Màu sắc, nền | `js/core/color-utils.js` |
| Toàn bộ màu sắc/giao diện CSS, theme kính mờ (`.glass-panel`/`.glass-modal`/`.drawer-glass`) | `css/styles.css` |

## Quy ước BẮT BUỘC khi viết / sửa một Visual (★★★★★★ ver 6)

Mọi visual trong `js/visualizers/types/*.js` PHẢI hỗ trợ đầy đủ 4 nhóm cấu hình
chung dưới đây. Đây là hợp đồng chung — visual nào bỏ sót sẽ bị coi là lỗi:

1. **Video nền (`vizConfig.videoBgEnabled`)** — khi BẬT, visual KHÔNG được tô
   một lớp nền đục phủ kín canvas (sky/background fill) đè lên video. Hãy bọc
   mọi lệnh `fillRect(0,0,canvas.width,canvas.height)` mang tính "nền" trong
   `if (!vizConfig.videoBgEnabled) { ... }` để video hiện xuyên qua (mẫu: cả
   `drawRainGlass` lẫn `drawRainStreet` trong `rain.js`). Các phần tử tiền cảnh
   (thanh, hạt, đèn, mặt đất...) vẫn vẽ đè bình thường lên trên video.
2. **Màu nền (`vizConfig.bgColor`)** — khi KHÔNG dùng video, nền phải theo
   `bgColor` người dùng chọn (qua `updateDOMBackground()` cho body, và/hoặc lệnh
   fill nền trong chính visual).
3. **Chế độ màu (`vizConfig.mode` = `solid` | `dynamic` | `rainbow/auto`)** —
   màu của các phần tử vẽ phải lấy từ helper màu chung (`getComputedColor()` /
   `interpolateColor()` / `vizConfig.solidColor` / `dynA`-`dynB`) thay vì hard-code,
   để nhất quán với lựa chọn của người dùng.
4. **Hiệu năng (`vizConfig.quality` + `PERFORMANCE_PROFILES`)** — số lượng phần
   tử (hạt, thanh, tia...) phải co giãn theo `perf` được truyền vào hàm vẽ, để
   máy yếu vẫn chạy mượt.

Khi thêm visual mới: đăng ký hàm vẽ vào `VISUALIZER_DRAWERS` trong
`draw-visualizer.js`, thêm tên `type` vào `MODES` (`config.js`), và tự kiểm 4
mục trên trước khi coi là hoàn tất.
