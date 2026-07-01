# Changelog — v10 mini-fix (chưa test đủ kỹ để coi là final, còn nợ kỹ thuật)

> **⚠️ CẢNH BÁO:** log này KHÁC các bản `v1.md`...`v10.md` ở chỗ — những bản đó
> đều được viết test harness (Node `vm`) + kiểm chứng kỹ trước khi coi là xong.
> Các fix trong log này được làm nhanh theo từng yêu cầu nhỏ liên tiếp, MỘT SỐ
> đã được test bằng Playwright thực tế (ghi rõ ở từng mục), MỘT SỐ CHƯA — và ít
> nhất 1 mục (video nền) đã xác nhận CHƯA chạy đúng. Coi đây là tập hợp các fix
> đang dở, không phải bản chốt. Xem mục "Nợ kỹ thuật" ở cuối file.

## 1. Logo "SAV" không bấm được trên mobile (đã test bằng Playwright)

**Triệu chứng báo:** trên mobile, bấm logo lần đầu hoạt động nhưng bấm lại thì
không ăn nữa, có lúc trang còn bị zoom vào. Mở Settings/chuyển sang Visualizer
rồi quay lại cũng làm logo mất khả năng bấm.

**Nguyên nhân thật:** logo dùng THUẦN CSS `:hover`/`group-hover` để mở/thu chữ.
Logo là `<div>` chữ thường (không phải `<button>`/`<a>`), không có thuộc tính
`touch-action` riêng — mobile Safari/Chrome có thể hiểu lầm 1 chạm vào nó là
tín hiệu "double-tap vào đoạn văn bản" và ZOOM trang vào đúng vùng đó (tính
năng "double-tap to zoom paragraph" của WebKit), khớp đúng triệu chứng "bấm bị
zoom". Sau khi trang zoom, toạ độ chạm các lần sau lệch khỏi vị trí logo thật.

**Đã thử và loại bỏ:** ban đầu nghi ngờ do animation/`taskManager`/z-index của
`#player-container` che logo — đã viết test harness dựng app thật bằng
Playwright (build CSS Tailwind thật từ class list, mock IndexedDB/Three.js)
để xác nhận KHÔNG phải do z-index hay race condition timer.

**Cách sửa:** bỏ hẳn CSS `:hover`/`group-hover`, chuyển sang JS:
- Desktop (chuột thật, phát hiện qua `matchMedia('(hover:hover) and
  (pointer:fine)')`): `mouseenter`/`mouseleave` — giữ đúng cảm giác hover cũ.
- Mobile/cảm ứng: `click` để toggle mở/thu trên chính logo, CỘNG THÊM 1
  listener `click` ở cấp `document` (capture không cần, dùng `stopPropagation()`
  trên logo) để TỰ THU LẠI khi bấm ra ngoài — đúng cảm giác "mất hover" mà
  không cần bấm lại đúng logo mới thu được (yêu cầu bổ sung sau khi fix lần 1).
  Đã nghiên cứu xác nhận: mobile KHÔNG có khái niệm "rời chuột", `mouseleave`
  không bao giờ tự bắn ra khi tap sang chỗ khác trên cảm ứng, nên phải dùng
  pattern "click ra ngoài tự đóng" giống dropdown/menu, không phải mouseleave.
- Thêm `touch-action: manipulation` trực tiếp trên `#sav-logo` làm lớp chặn
  double-tap-zoom thứ 2 ở tầng trình duyệt.

File sửa: `js/components/playlist-view.js`, `js/core/dom-refs.js`.

## 2. Tự động đổi hiệu ứng — vị trí UI + khoá nút "Đổi hiệu ứng" (đã test)

**Yêu cầu:**
- (a) Card "Tự động đổi hiệu ứng" đang nằm sai vị trí (Settings chính) — gộp
  vào trong drawer "Tùy chỉnh Visualizer" cùng nhóm Chất lượng Render/Hình
  học/Màu sắc.
- (b) Khi tính năng này BẬT, nút "Đổi hiệu ứng" (`#btn-cycle-mode`, Control
  Center) phải KHOÁ HẲN — bấm không có tác dụng (tránh xung đột đổi tự động
  vs đổi tay). Trước đó nút luôn hoạt động bất kể auto-switch bật/tắt.

**Cách sửa:**
- Cắt nguyên Card "Tự động đổi hiệu ứng" khỏi
  `js/components/settings/visualizer-geometry-color.js`, dán vào
  `js/components/visualizer-settings-drawer.js`. Toàn bộ id/JS xử lý
  (`js/core/auto-switch-visual.js`) giữ nguyên — không quan tâm HTML nằm ở
  template nào.
- Thêm `updateCycleModeButtonState()` (`auto-switch-visual.js`) — đặt
  `btnCycleMode.disabled` THẬT (không chỉ CSS mờ) theo
  `vizConfig.autoSwitchVisualEnabled`, gọi mỗi khi cờ đó đổi (toggle bật/tắt,
  và mỗi lần `loadConfig()`/`initAutoSwitchVisualUI()` chạy lúc khởi động).
- `btnCycleMode` click listener (`player-controls.js`) tự kiểm tra
  `vizConfig.autoSwitchVisualEnabled` làm lớp chặn THỨ HAI (phòng trường hợp
  `.click()` gọi bằng JS từ nơi khác, không qua chuột/bàn phím thật).

File sửa: `js/components/settings/visualizer-geometry-color.js`,
`js/components/visualizer-settings-drawer.js`, `js/core/auto-switch-visual.js`,
`js/core/player-controls.js`.

## 3. Cơ chế "ẩn tab" — viết lại hoàn toàn (đã test nhiều vòng, còn nợ video)

Đây là phần thay đổi lớn nhất, đi qua NHIỀU lần thiết kế lại liên tiếp trong
cùng 1 phiên làm việc khi phát hiện thêm vấn đề mới. Tóm tắt diễn biến:

### 3.1. Vấn đề gốc: "lúc phát ra tiếng bình thường, lúc thì không"

Bản trước (ver 9/10): tab bị ẩn → `resetPlayerToIdle()` dừng nhạc + đưa UI về
Playlist, KHÔNG reload — app tiếp tục sống ở background. Quay lại tab → hỏi
"Tiếp tục nghe?" → gọi lại `playSong()` trên CHÍNH runtime cũ. Runtime đó
(AudioContext, IndexedDB connection, taskManager...) có thể đã bị trình duyệt/
hệ điều hành can thiệp không nhất quán trong lúc ẩn (suspend JS, đóng
AudioContext...) — logic ĐÚNG nhưng môi trường nó chạy trên có thể đã hỏng.

**Hướng sửa:** lưu state cần thiết vào `localStorage`, để trang RELOAD THẬT
(`location.reload()`) — runtime khởi tạo lại hoàn toàn sạch, không có gì sống
sót nửa vời từ phiên trước.

### 3.2. Race condition #1: modal mở ra rồi biến mất ngay

Bản đầu của hướng sửa trên: reload LÚC QUAY LẠI TAB (không phải lúc ẩn). Phát
hiện bug: listener `visibilitychange`/`pageshow` chạy NGAY KHI SCRIPT ĐƯỢC
PARSE — sớm hơn `DOMContentLoaded` (nơi xử lý + xoá cờ resume). Nếu trang vừa
load lại mà tự bắn `visibilitychange`='visible' (có thể xảy ra dù chẳng ai
"chuyển tab" thật), code thấy cờ VẪN CÒN → gọi `reload()` THÊM 1 LẦN NỮA giữa
lúc trang đang khởi động dở, hủy luôn modal vừa mở ra. **Đã sửa** bằng cờ
runtime `_wasHiddenThisSession` — chỉ coi là "tab vừa hiện lại" nếu phiên JS
hiện tại đã thực sự chứng kiến tab chuyển sang ẩn trước đó.

### 3.3. Yêu cầu mở rộng: lưu cả video nền + auto-switch-visual marks

Yêu cầu thêm: nếu video nền đang bật, phải lưu+phục hồi `currentTime` của nó;
nếu auto-switch-visual đang ở mode "Theo độ dài bài hát", phải lưu+phục hồi
đúng mảng marks (không để build lại mới, mất hết các mốc đã "nhớ" hiệu ứng của
đoạn đã nghe qua). Đồng thời: **toàn bộ** việc nạp lại RAM (kể cả shuffle/
repeat/displayOrder) CHỈ được áp dụng khi người dùng bấm "Tiếp tục phát"/"Nghe
lại" — chọn "Không" thì không áp gì cả, chỉ xoá snapshot.

**Cách làm:** `applyResumeStateToRam()` (mới) — gọi TRƯỚC `playSong()` trong
2 nhánh "Tiếp tục phát"/"Nghe lại" của `showResumeChoiceModal()`. Nhánh
"Không" gọi `discardPendingResumeState()` — không áp gì. Video: gán
`bgVideoElement.currentTime`, chờ `loadedmetadata` nếu video chưa sẵn sàng.
Auto-switch marks: đặt `window._resumeAutoSwitchVisualMarks`, đọc bởi
`startAutoSwitchVisualBranch()` để gán đè trực tiếp (không build mới).

**Race condition #2 phát hiện khi test:** event `'play'` của `audioPlayer`
bắn ra TRƯỚC `'loadedmetadata'` trong `playSong()` (xác nhận bằng test thực
tế, không phải suy đoán). Cả 2 event đều gọi đường dẫn dẫn tới
`startAutoSwitchVisualBranch()` — lần đầu (từ 'play') đọc đúng marks đã phục
hồi rồi xoá cờ (chỉ dùng 1 lần); lần 2 (từ 'loadedmetadata', qua
`onAutoSwitchVisualSongChanged()`) thấy cờ đã `null` → build lại mới, ĐÈ MẤT
marks vừa phục hồi đúng. **Đã sửa** bằng cờ `_lastMarksBuiltForKey` — chỉ
build/gán marks 1 lần cho mỗi bài, lần gọi thứ 2 (cùng bài) tự bỏ qua.

### 3.4. Yêu cầu sửa lại: tách cờ và snapshot, bỏ hành vi tự thân

Phát hiện vấn đề: localStorage LUÔN được lưu (kể cả snapshot lẫn cờ ngầm) —
nên ngay cả reload thông thường (F5 không liên quan gì ẩn tab) cũng có thể vô
tình hiện modal nếu còn sót dữ liệu cũ. **Yêu cầu:** tách `cờ` (quyết định DUY
NHẤT có hỏi hay không) khỏi `snapshot` (data). Cờ chỉ tắt khi modal được XỬ LÝ
XONG (1 trong 3 lựa chọn) — treo modal/F5 lại/ẩn-hiện nhiều lần đều không ảnh
hưởng. Đồng thời: BỎ HẾT hành vi "tự thân" cũ lúc ẩn tab (không tự
`resetPlayerToIdle()`/`forceBackToPlaylistUI()` nữa — reload thật tự dọn sạch
UI). Reload phải xảy ra NGAY lúc ẩn/chuyển tab (không đợi lúc quay lại). Modal
phải hỏi NGAY từ đầu lúc reload (song song lúc playlist đang load ngầm, không
đợi load xong) — nhưng nút "Tiếp tục phát"/"Nghe lại" tạm khoá tới khi
playlist load xong mới cho bấm.

**Cách làm:**
- `resume-state-storage.js`: viết lại — 2 key localStorage riêng:
  `sav_resumeFlag_v1` (cờ, chỉ chứa `'1'` hoặc không tồn tại) và
  `sav_pendingResumeState_v1` (snapshot data, không quyết định gì việc hiện
  modal). `checkPendingResumeStateOnBoot()` giờ CHỈ đọc cờ + hiện modal, KHÔNG
  áp gì vào RAM (việc áp dồn hết vào `applyResumeStateToRam()`).
- `wakelock.js`: viết lại hoàn toàn — `triggerHideAndReload()` (đổi tên từ
  `triggerHideReset()`) lưu state + pause audio + reload NGAY, không còn
  `resetPlayerToIdle()`/dọn UI thủ công nào.
- `player-controls.js`: XOÁ HẲN `resetPlayerToIdle()` (dead code, không còn ai
  gọi). `showResumeChoiceModal()` hiện NGAY với tiêu đề tạm (key thô) nếu
  playlist chưa load, 2 nút "Tiếp tục phát"/"Nghe lại" có `disabled: true` +
  `dataset.resumeNeedsPlaylist` (cần mở rộng `modalChoice()` để hỗ trợ 2
  thuộc tính này trên từng nút — xem `js/core/modal-choice.js`).
- `draw-visualizer.js`: gọi `checkPendingResumeStateOnBoot()` NGAY SAU
  `loadConfig()`, KHÔNG đợi `initPlaylistFromDB()`. Sau khi playlist load
  xong, gọi `enableResumeModalButtonsWhenPlaylistReady()` — mở khoá 2 nút đó,
  cập nhật lại tiêu đề đúng tên bài, và tự đóng modal nếu bài đã bị xoá.

### 3.5. Race condition #3: F5 thủ công cũng bị hiểu lầm là "ẩn tab"

Phát hiện khi test: khi đang nghe nhạc và người dùng TỰ F5/reload tay (không
ẩn tab thật), trình duyệt CŨNG bắn `visibilitychange`='hidden' ngay trước lúc
unload (đúng theo spec Page Visibility API — trang luôn chuyển 'hidden' trước
khi unload, bất kể lý do unload là gì). Hệ thống hiểu lầm F5 thành "ẩn tab
thật", lưu snapshot + hỏi "Tiếp tục nghe?" sau khi F5 xong — KHÔNG đúng ý
(F5 thủ công không nên hỏi gì cả).

**Đã nghiên cứu:** xác nhận KHÔNG có cách phân biệt 100% đáng tin cậy chỉ dựa
vào thứ tự `visibilitychange`/`pagehide`/`beforeunload` (thứ tự không cố định
giữa các trình duyệt/tình huống — xem thảo luận W3C page-visibility#39).

**Cách sửa (dựa trên đo thời gian tương đối):** trì hoãn việc lưu/reload
trong `triggerHideAndReload()` bằng `setTimeout` 50ms (`HIDE_RELOAD_DEBOUNCE_MS`)
sau khi `visibilitychange`/`pagehide` bắn ra. Nếu `'beforeunload'` bắn ra
TRONG khoảng chờ đó (đặt cờ `_isRealUnloadHappening = true`) → đây là F5/đóng
tab/điều hướng THẬT → HUỶ BỎ toàn bộ (không lưu, không reload). Nếu không có
`beforeunload` nào trong khoảng đó → ẩn tab thật (trang vẫn sống) → tiến hành
lưu + reload như thiết kế.

**Đã test xác nhận (Playwright):**
- F5 thủ công lúc đang phát nhạc → KHÔNG lưu, KHÔNG hiện modal sau reload. ✅
- Ẩn tab thật (chỉ `visibilitychange`, không có unload theo sau) → lưu +
  reload + hiện modal đúng. ✅
- Treo modal rồi F5 lại (cờ vẫn `true`) → modal hiện lại đúng. ✅
- Xử lý xong modal (bấm 1 trong 3 nút) rồi F5 lại → cờ đã `null` → không hiện
  modal nữa. ✅
- Bài đã lưu bị xoá khỏi playlist trước khi quay lại → modal tự đóng, cờ tự
  xoá (`enableResumeModalButtonsWhenPlaylistReady()`). ✅
- Auto-switch-visual marks phục hồi đúng (giữ giá trị đã lưu, không bị build
  lại mới) sau khi sửa race condition #2 ở mục 3.3. ✅

File sửa: `js/core/resume-state-storage.js` (viết lại hoàn toàn),
`js/core/wakelock.js` (viết lại hoàn toàn), `js/core/player-controls.js`
(xoá `resetPlayerToIdle()`, sửa `showResumeChoiceModal()`),
`js/core/modal-choice.js` (thêm `disabled`/`dataset`),
`js/visualizers/draw-visualizer.js` (đổi thứ tự gọi lúc khởi động),
`js/core/auto-switch-visual.js` (cờ `_lastMarksBuiltForKey`).

## 4. Settings → "Khắc phục sự cố" (chưa test bằng Playwright, chỉ kiểm syntax)

Thêm section mới trong Settings (`js/components/settings/misc.js`) với 2 nút:

- **"Khởi động lại app"** — xoá cờ + snapshot resume trong localStorage rồi
  `location.reload()`. KHÔNG đụng `vizConfig`/IndexedDB (nhạc/playlist/cài đặt
  giữ nguyên). Dành cho lúc trình phát treo/kẹt/hành vi bất thường.
- **"Khôi phục cài đặt mặc định"** — CHỈ reset `vizConfig = {...DEFAULT_VIZ_CONFIG}`
  rồi `saveConfig()` + reload. GIỮ NGUYÊN nhạc/playlist đã upload (IndexedDB
  'songs' store không bị đụng). Cả 2 nút đều hỏi xác nhận qua `modalChoice()`
  trước khi thực hiện.

File mới: `js/core/app-recovery.js`. File sửa:
`js/components/settings/misc.js`, `js/core/dom-refs.js` (thêm 2 ref nút).

## 5. Control Center — toggle ẩn/hiện dải BPM/Pitch/Energy (đã test cơ bản)

Thêm nút thứ 6 vào grid Control Center (5→6 cột) — toggle ẩn/hiện
`#stats-panel` (dải BPM/Pitch/Energy đè trên visualizer). Khi ẩn: TẠM DỪNG
việc ghi `statBpm`/`statNote`/`statEnergy.textContent` trong
`updateStatsDashboard()` (`audio-analysis.js`), nhưng GIỮ NGUYÊN phần tính
toán logic phía sau (`beatTimes`/`fluxHistory`/`currentCalculatedBpm`/
`rubikPitchAvg`) — các giá trị này được visual Rubik dùng để xoay theo nốt
nhạc, phải tiếp tục chạy đúng bất kể dải số liệu có hiện hay không. Đã test
xác nhận: sau khi ẩn, DOM text đứng yên ở `---`/`0%`, nhưng `rubikPitchAvg`
vẫn tiếp tục được tính (kiểu `number`, không phải `undefined`).

File mới: `js/core/stats-panel-toggle.js`. File sửa:
`js/components/visualizer-overlay.js` (thêm nút + 2 icon vào grid),
`js/core/dom-refs.js` (thêm ref), `js/core/audio-analysis.js` (bọc điều kiện
`isStatsPanelVisible` quanh các dòng ghi DOM text).

---

## Nợ kỹ thuật (chưa xong, cần làm tiếp)

1. **Video nền chưa khôi phục đúng `currentTime` sau khi quay lại tab.**
   Phát hiện: video không pause CÙNG LÚC với audio khi tab bị ẩn (chỉ có
   `audioPlayer.pause()`, không có `bgVideoElement.pause()` tương ứng ở
   `wakelock.js`), nên video tiếp tục phát/loop trong suốt khoảng thời gian từ
   lúc lưu `currentTime` tới lúc reload thật xảy ra → giá trị lưu được không
   khớp với lúc thực sự dừng. **Đã thử sửa lần 1:** thêm
   `bgVideoElement.pause()` ngay sau `audioPlayer.pause()` trong
   `triggerHideAndReload()`, và đổi thứ tự — pause CẢ HAI trước, rồi mới đọc
   `currentTime` để lưu (thay vì lưu trước pause sau như bản cũ). Tuy nhiên
   theo yêu cầu của người dùng, vấn đề này **vẫn chưa được xác nhận đã hết**
   — tạm dừng ở đây, để fix tiếp ở phiên sau. Xem `js/core/wakelock.js`,
   hàm `triggerHideAndReload()`.
2. **Phần lớn các fix trong mục 3, 4, 5 ở trên mới chỉ qua 1 vòng test bằng
   Playwright trên localhost (Chromium headless), CHƯA test trên thiết bị
   thật/trình duyệt thật (đặc biệt iOS Safari — nơi `visibilitychange`/
   `pagehide` được biết là không đáng tin cậy như trên desktop).** Một số
   test dùng stub/mock cho IndexedDB, video, audio — có thể chưa phản ánh hết
   các trường hợp biên thật (mạng chậm, file thật lớn, nhiều bài trong
   playlist, v.v.).
3. **Mục 4 (Khởi động lại app / Khôi phục cài đặt mặc định) chưa có bất kỳ
   bài test Playwright nào** — chỉ mới qua `node --check` (syntax) và đọc lại
   code thủ công.
4. File `js/core/visualizer-overlay.js` (KHÔNG nằm trong danh sách
   `<script src="...">` của `index.html` — chỉ còn
   `js/components/visualizer-overlay.js` được nạp) là bản trùng/dư thừa từ
   trước, KHÔNG được đồng bộ theo các thay đổi ở mục 5 phía trên. Không ảnh
   hưởng runtime (không được nạp), nhưng nên dọn hẳn ở 1 lần sửa sau để tránh
   nhầm lẫn khi đọc code.

← [Quay lại README](../../README.md) · [Mục lục changelog](../changelog-index.md)
