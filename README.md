# Audio Visualizer - Master Edition

Bản chia nhỏ của file `VM_4.html` gốc (2032 dòng, 1 file duy nhất) thành các
file CSS / JS / "component" HTML riêng biệt, **không dùng ES6 module**
(`import`/`export`) — toàn bộ vẫn dùng `<script src="...">` thông thường để
chạy được trực tiếp khi mở `index.html` bằng cách double-click (file://),
không cần server, không cần build step.

Ngoài việc chia module, project đã qua nhiều lượt cải tiến tính năng/visual.
Bản hiện tại (**ver 6**) tập trung dọn lỗi vặt còn sót lại từ ver 5 (sort,
trạng thái rỗng, video nền chớp/khựng), tách lại file `playlist.js` quá khổ,
thêm ô tìm kiếm + thống kê nghe theo từng bài, và mày mò chuyện giữ nhạc chạy
nền trên điện thoại. Chi tiết đầy đủ ở mục
[Changelog ver 6](#changelog-ver-6-fix-các-lỗi-vớ-va-vớ-vẩn-đáng-nhẽ-không-nên-có)
dưới đây. Ver 5 trước đó là thay đổi lớn nhất — toàn bộ playlist (nhạc, tag,
cover, phụ đề, ảnh/video nền) persist qua **IndexedDB**. Lịch sử các bản cũ
hơn nằm ở changelog riêng từng bản.

- [CHANGELOG_v6.md](./CHANGELOG_v6.md) (nội dung đầy đủ cũng được gộp vào README này, mục cuối)
- [CHANGELOG_v5.md](./CHANGELOG_v5.md)
- [CHANGELOG_v4.md](./CHANGELOG_v4.md)
- [CHANGELOG_v3.md](./CHANGELOG_v3.md)
- [CHANGELOG_v2.md](./CHANGELOG_v2.md)
- [CHANGELOG_v1.md](./CHANGELOG_v1.md)

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
├── CHANGELOG_v1.md
├── CHANGELOG_v2.md
├── CHANGELOG_v3.md
├── CHANGELOG_v4.md
├── CHANGELOG_v5.md
├── CHANGELOG_v6.md
├── PLAN_INDEXEDDB.md         ← tài liệu thiết kế gốc của ver 5
├── index.html                  ← Mở file này để chạy ứng dụng
├── css/
│   └── styles.css               (toàn bộ CSS gốc, không đổi)
└── js/
    ├── components/
    │   ├── loading-shield.js    (★★★★★ ver 5 — đổi cơ chế ẩn/hiện sang opacity)
    │   ├── playlist-view.js     (★★★★★ ver 5, ★★★★★★ ver 6 — ô tìm kiếm, z-index, bỏ sort random)
    │   ├── visualizer-overlay.js
    │   ├── subtitle-modal.js
    │   ├── bottom-player.js
    │   ├── settings-drawer.js   (★ ver 1, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — toggle "Giữ màn hình sáng")
    │   ├── storage-drawer.js    (★★★★★★ ver 6 — mô tả nút xoá: chỉ xoá bài hát)
    │   └── about-drawer.js      (★★★★★ mới ở ver 5 — thống kê, giới thiệu, cảnh báo IndexedDB)
    ├── main.js                  (★★★★★ ver 5 — ghép thêm TPL_ABOUT_DRAWER)
    ├── core/
    │   ├── config.js            (★ ver 1, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — thêm keepScreenOn)
    │   ├── dom-refs.js          (★ ver 1, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — ref keepScreenOnToggle)
    │   ├── db.js                (★★★★★ mới ở ver 5 — IndexedDB: slugify/resolveKey/CRUD)
    │   ├── loading-shield-util.js (★★★★★ mới ở ver 5 — withLoadingShield dùng chung)
    │   ├── three-vortex.js      (★ ver 1, ★★ ver 2)
    │   ├── state-and-video-bg.js (★★★★★ ver 5, ★★★★★★ ver 6 — handleVideoBackground viết lại, bám nhạc không bám màn hình)
    │   ├── subtitles.js         (★★★★★ ver 5 — persist subtitles khi Apply)
    │   ├── equalizer-settings.js (★ ver 1, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — nạp/đồng bộ keepScreenOn)
    │   ├── subtitle-display.js
    │   ├── wakelock.js          (★★★★★ ver 5, ★★★★★★ ver 6 — gate theo keepScreenOn, resume AudioContext khi visible)
    │   ├── color-utils.js       (★★★★★★ ver 6 — nền đen thay transparent khi bật video, chống chớp trắng)
    │   ├── canvas-scene-setup.js (★ ver 1, ★★ ver 2, ★★★ ver 3, ★★★★ ver 4)
    │   ├── listen-stats.js      (★★★★★★ mới ở ver 6 — số lần nghe + thời gian nghe riêng từng bài, key {count,totalTime} trong meta.songStats)
    │   ├── player-controls.js   (★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — video bám theo nhạc, cộng dồn giờ nghe/bài, gate wake lock)
    │   ├── audio-engine.js
    │   ├── audio-analysis.js
    │   ├── rubik-math.js
    │   ├── about-stats.js       (★★★★★ mới ở ver 5 — computeStats() cho About Drawer)
    │   ├── id3-export.js        (★★★★★ mới ở ver 5 — export/restore gắn tag mới qua ID3Writer)
    │   └── storage-manager.js   (★★★★★★ ver 6 — "Xoá hết" chỉ xoá bài hát, GIỮ ảnh/video nền)
    ├── playlist/                (★★★★★★ mới ở ver 6 — tách từ core/playlist.js cũ thành module nhiều file, kiểu object-function)
    │   ├── state.js             (state dùng chung: playlistOrder / displayOrder [hàng đợi phát] / renderOrder [danh sách hiển thị] tách rời)
    │   ├── order.js             (sort default/az/za — KHÔNG còn random; lọc tìm kiếm; pending-append hàng đợi khi đang phát)
    │   ├── render.js            (vẽ diff theo renderOrder; trạng thái rỗng #playlist-empty / #playlist-search-empty thuần theo dữ liệu)
    │   ├── loader.js            (đọc duration, nạp file mới, quét/khởi tạo playlist từ IndexedDB)
    │   ├── actions.js           (playSong, xoá/sửa/info bài, menu thao tác — info hiện số lần nghe + giờ nghe riêng)
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
ở ver 4, ★★★★★ = thêm ở ver 5, ★★★★★★ = thêm ở ver 6; file không đánh dấu giữ
nguyên 100% so với bản chia module gốc.)

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
   đụng vào DOM.
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
   `player-controls.js`.
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
   thống kê nghe theo từng bài trước khi render playlist).

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
xoá bài hát** — ảnh/video nền KHÔNG còn bị xoá theo. Xem mục Changelog ver 6
bên dưới (mục 7) để biết lý do.

## Muốn sửa gì thì sửa ở đâu?

| Muốn sửa... | Vào file... |
|---|---|
| Giao diện danh sách bài hát | `js/components/playlist-view.js` |
| Giao diện ngăn cài đặt (kiểu Bar, số lượng thanh/độ to vòng tròn, kiểu mưa...) | `js/components/settings-drawer.js` |
| Visual "Bar" (kiểu Phản chiếu cánh bướm / kiểu Thác đổ) | `js/visualizers/types/bar.js` |
| Visual "Rain" (kiểu Trôi cửa kính / kiểu Mưa phố, đèn đường, hàng rào) | `js/visualizers/types/rain.js` |
| Visual "Rubik" (phóng to/thu nhỏ theo beat, xoay tự thân + xoay lớp theo pitch) | `js/visualizers/types/rubik.js` (map nốt→trục/lớp ở `RUBIK_NOTE_TO_TURN` trong `js/core/dom-refs.js`) |
| Visual Lightning / Black Hole | `js/visualizers/types/lightning.js`, `black-hole.js` (tương ứng) |
| Vòng lặp render chính, thêm visual mới vào bảng dispatch | `js/visualizers/draw-visualizer.js` (object `VISUALIZER_DRAWERS`) |
| Hàm vẽ dùng chung (giọt nước, khung kính, nốt nhạc bay lên) | `js/visualizers/draw-helpers.js` |
| Logic phát nhạc, next/prev, shuffle | `js/playlist/actions.js` (playSong), `js/playlist/order.js` (hàng đợi/shuffle), `js/core/player-controls.js` (next/prev) |
| Lưu trữ IndexedDB (nhạc/tag/cover/sub/ảnh-video nền), slugify/resolve key | `js/core/db.js` |
| Che màn hình khi xử lý (nạp nhạc/chuyển bài/lưu ảnh nền...) | `js/core/loading-shield-util.js` (hàm `withLoadingShield`) |
| Sửa tag/info/export gắn tag mới của 1 bài | `js/playlist/actions.js` (modal sửa/info — info hiện số lần nghe + giờ nghe), `js/core/id3-export.js` (export) |
| Sắp xếp danh sách / ô tìm kiếm / tách danh-sách-hiển-thị khỏi hàng-đợi-phát | `js/playlist/order.js` (sort + lọc), `js/playlist/render.js` (vẽ + trạng thái rỗng), `js/playlist/main.js` (gắn menu sort + ô tìm kiếm) |
| Số lần nghe / thời gian nghe riêng từng bài | `js/core/listen-stats.js` (lưu `meta.songStats`), cộng dồn ở `js/core/player-controls.js` (timeupdate) |
| Giữ màn hình sáng (wake lock) / cố giữ nhạc chạy nền | `js/core/wakelock.js` (gate theo `vizConfig.keepScreenOn`, resume AudioContext khi quay lại tab), toggle UI ở `js/components/settings-drawer.js` |
| Video nền (bật/tắt, gán src, chống chớp trắng) | `js/core/state-and-video-bg.js` (hàm `handleVideoBackground`) |
| "Xoá hết dữ liệu" / tải nhạc về rồi xoá | `js/core/storage-manager.js` (hàm `clearAllStoredData`), UI ở `js/components/storage-drawer.js` |
| Thống kê "Về trình phát" (About Drawer) | `js/core/about-stats.js`, `js/components/about-drawer.js` |
| Hiện/ẩn các khối setting theo kiểu visualizer/kiểu Bar đang chọn | `js/core/player-controls.js` (hàm `updateTypeUI`, `updateBarStyleUI`) |
| Equalizer, cấu hình lưu localStorage | `js/core/equalizer-settings.js` |
| Phụ đề (.srt) | `js/core/subtitles.js`, `js/core/subtitle-display.js` |
| Hiệu ứng Vortex (Three.js) — khởi tạo rings/bars/wave, camera | `js/core/three-vortex.js` (khởi tạo) + `js/visualizers/types/vortex.js` (cập nhật mỗi khung hình) |
| Khởi tạo đèn đường/hàng rào/mưa phố, mặt đất an toàn dưới control bar | `js/core/canvas-scene-setup.js` (hàm `generateStreetScene`, `getPlayerBarSafeHeight`) |
| Phát hiện pitch (nốt nhạc YIN), nốt MIDI trung bình động dùng cho Rubik | `js/core/audio-analysis.js` (hàm `updateStatsDashboard`), `js/core/audio-engine.js` (hàm `detectPitchYIN`) |
| Thêm trường cấu hình mới (lưu vào `vizConfig`) | `js/core/config.js` (giá trị mặc định) + `js/core/equalizer-settings.js` (nạp lúc `loadConfig`) |
| Màu sắc, nền | `js/core/color-utils.js` |
| Toàn bộ màu sắc/giao diện CSS | `css/styles.css` |

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

---

## Changelog ver 6: "Fix các lỗi vớ va vớ vẩn đáng nhẽ không nên có."

> Vòng này không thêm tính năng hoành tráng, chủ yếu là **dọn dẹp những lỗi lẽ
> ra không nên tồn tại**: sort không áp dụng ngay, menu sort bị che, ô "chưa có
> bài hát" hiện sai lúc đang có bài, mở Playlist làm khựng video nền, chuyển bài
> lóe trắng video... Nhân tiện tách lại file `playlist.js` quá khổ, thêm ô tìm
> kiếm, thống kê nghe theo từng bài, và mày mò chuyện giữ nhạc chạy nền trên điện
> thoại.

### 1. Tách rời "DANH SÁCH HIỂN THỊ" và "HÀNG ĐỢI PHÁT" (gốc rễ của nhiều lỗi)

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

→ Khắc phục trực tiếp lỗi sort không áp dụng ngay lúc nạp/upload/đang phát:
nay sau mỗi lần thêm bài luôn gọi `recomputeRenderOrder()` +
`renderPlaylistDiff()`, danh sách hiển thị sắp lại tức thì.

### 2. Sửa loạt lỗi giao diện Playlist

- **Menu sort bị che / bỏ "Ngẫu nhiên":** header playlist nâng từ `z-10`
  lên `z-20`, menu sort nâng lên `z-50` nên không bị các lớp khác đè lên nữa.
  Bỏ luôn lựa chọn sort **"Ngẫu nhiên"** (random) — giờ chỉ còn *Mặc định (mới
  thêm)* / *Tên A → Z* / *Tên Z → A*. Cấu hình cũ lỡ lưu `random` sẽ tự quy về
  `az` (hàm `setDisplaySortMode` từ chối thẳng giá trị `random`).
- **"Chưa có bài hát nào" hiện sai:** trạng thái rỗng giờ tính THUẦN theo
  dữ liệu (`liveKeys().length`), gom vào một hàm `updateEmptyState()` được gọi ở
  cuối mọi lần render. Có 2 trạng thái rỗng tách biệt: `#playlist-empty` (thư
  viện trống thật) và `#playlist-search-empty` (có bài nhưng tìm kiếm không khớp).

### 3. Ô tìm kiếm bài hát (mới)

- Thêm ô tìm kiếm ngay trong header Playlist (`#playlist-search-input` + nút xoá
  `#playlist-search-clear`). Lọc theo **tên bài + nghệ sĩ**, có chuẩn hoá bỏ dấu
  tiếng Việt nên gõ "anna" hay "ÁNH" đều khớp tự nhiên.
- Tìm kiếm CHỈ lọc danh sách hiển thị — **không đụng** tới hàng đợi phát đang
  chạy (đang nghe bài gì vẫn nguyên, Next/Prev không bị ô tìm kiếm ảnh hưởng).

### 4. Video nền: bám theo NHẠC, không bám theo màn hình

Trước đây mở/đóng Playlist gọi `handleVideoBackground()` để dừng/ẩn video — một
can thiệp phi chức năng khiến mở Playlist lúc đang nghe làm **khựng video**.

- Việc bật/tắt & phát/dừng video giờ **chỉ phụ thuộc cấu hình + trạng thái phát
  nhạc**. Playlist nằm đè (`z-[60]`) lên trên nên tự che video — không cần dừng.
- **Không lóe trắng khi chuyển bài:** `src` của video chỉ gán **một
  lần** (hoặc khi URL đổi thật) nên Next/Prev **không nạp lại** video. Phía sau
  video luôn ép **nền đen cưỡng chế**, video giữ `opacity:0` cho tới khi có khung
  hình thật (`loadeddata`/`playing`) rồi mới fade lên → bỏ hẳn cú chớp trắng.
- `color-utils.js` cũng đổi: khi bật video nền, body để **`#000000`** thay vì
  `transparent` (transparent để lộ nền trắng mặc định của trang → chính là thủ
  phạm gây chớp).

### 5. Mọi visual phải "trong suốt" với video nền — sửa Rain Street

- `drawRainStreet` trước đây luôn tô một lớp trời (sky gradient) phủ kín canvas,
  che mất video nền. Nay lớp này được bọc trong `if (!vizConfig.videoBgEnabled)`
  (giống `drawRainGlass` đã làm), nên khi bật video, cảnh công viên (đất, đèn,
  hàng rào, mưa) vẫn vẽ đè nhưng **video hiện xuyên qua phần trời**.
- README bổ sung mục "Quy ước BẮT BUỘC khi viết/sửa một Visual" (xem mục phía
  trên) — mọi visual phải hỗ trợ đủ 4 nhóm: **video nền, màu nền, chế độ màu,
  hiệu năng**.

### 6. Thống kê nghe theo từng bài

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

### 7. "Xoá hết dữ liệu" CHỈ xoá bài hát, GIỮ LẠI ảnh/video nền

- `clearAllStoredData()` trước đây xoá cả `bgImage` + `videoBg` và reset các
  toggle — không hợp lý vì ảnh/video nền là thiết lập riêng, không thuộc "thư
  viện nhạc". Nay **chỉ xoá bài hát** (và `songStats`, `totalListenSeconds`),
  **giữ nguyên** ảnh/video nền + trạng thái bật/tắt của chúng.
- Cập nhật lại lời thoại 2 nút xoá + các hộp thoại xác nhận cho đúng ý nghĩa
  ("...ảnh/video nền vẫn được giữ lại").

### 8. Tách `playlist.js` thành module nhiều file

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

### 9. Giữ nhạc chạy nền trên điện thoại + tuỳ chọn giữ màn hình sáng

**Tuỳ chọn mới**

- Thêm toggle **"Giữ màn hình sáng"** (`vizConfig.keepScreenOn`, mặc định BẬT)
  trong Cài đặt → mục *Khác*. Khi tắt, app **không xin Wake Lock** nữa → màn hình
  tự tắt theo thiết lập hệ điều hành để tiết kiệm pin.
- `requestWakeLock()` nay tôn trọng cờ này (tắt thì nhả wake lock ngay).

**Cố gắng giữ nhạc chạy khi vào nền (best-effort)**

- Khi quay lại tab (`visibilitychange` → visible), nếu `AudioContext` bị hệ điều
  hành "suspend" thì **tự `resume()`** để tiếng trở lại ngay, không cần bấm play.
- Vẫn dùng **Media Session API** (đã có từ trước) để hiện điều khiển play/pause/
  next/prev ở màn khoá / trung tâm điều khiển.

**Giới hạn thành thật (đọc kỹ phần này)**

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

### Tóm tắt file thay đổi ở ver 6

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
- `README.md` (cấu trúc module mới + quy ước BẮT BUỘC cho visual + gộp changelog này)

**Xoá:**
- `js/core/playlist.js` (đã tách hết sang `js/playlist/`)
