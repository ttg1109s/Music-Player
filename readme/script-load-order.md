# Thứ tự nạp script — QUAN TRỌNG, không thay đổi

`index.html` nạp script theo đúng 5 bước, không được đảo:

0. **CDN trong `<head>`**: Tailwind, jsmediatags, NoSleep.js, Three.js (như cũ)
   + **idb-keyval** (wrapper IndexedDB) và **browser-id3-writer** (ghi ID3 tag
   mới lúc Export) — thêm ở ver 5.
0.5. **`js/core/lang.js`** (mới ở batch i18n) — nạp NGAY ĐẦU `<body>`, TRƯỚC
   TOÀN BỘ `components/*.js` ở bước 1. Đây là TRƯỜNG HỢP DUY NHẤT 1 file
   `core/*.js` nạp TRƯỚC bước 1 (component) — lý do: các template `TPL_*` ở
   bước 1 gọi `t()`/`tFormat()` NGAY LÚC PARSE (template literal cấp module,
   chạy đồng bộ ngay khi file được nạp, sớm hơn cả `DOMContentLoaded`), nên
   2 hàm đó phải tồn tại sẵn trước khi bất kỳ file component nào chạy.
   `lang.js` tự đứng độc lập, KHÔNG cần `db.js`/DOM có mặt lúc định nghĩa —
   các hàm cần IndexedDB (`saveLanguagePack`/`applySavedLanguage`/
   `listAvailableLanguages`) chỉ thực sự gọi tới khi người dùng tương tác
   (luôn sau khi `db.js` ở bước 3 đã nạp xong từ lâu).
1. **components/*.js** — chỉ định nghĩa biến `TPL_...` (chuỗi HTML), chưa
   đụng vào DOM. **Từ ver 8:** 5 file trong `components/settings/` PHẢI nạp
   TRƯỚC `components/settings-drawer.js` — file đó giờ chỉ là object điều
   phối `SettingsDrawer.build()` ghép 5 biến `TPL_SETTINGS_*` (định nghĩa ở
   5 file con) lại thành `TPL_SETTINGS_DRAWER`, gọi đồng bộ ngay khi nạp.
   **Từ batch i18n:** thêm `components/settings/language.js` (định nghĩa
   `TPL_SETTINGS_LANGUAGE`, section "Ngôn ngữ") vào CÙNG NHÓM 5 file trên,
   cũng PHẢI nạp TRƯỚC `settings-drawer.js` (giờ ghép 6 biến `TPL_SETTINGS_*`).
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
   **Từ ver 9:** `modal-choice.js` (hàm `modalChoice()` dùng chung cho mọi
   modal "hỏi quyết định" động) nạp NGAY SAU `dom-refs.js` — không cần ref
   DOM nào đặc biệt (tự dựng/xoá DOM riêng vào `document.body`), nhưng cần
   có mặt TRƯỚC `player-controls.js` vì `showResumeChoiceModal()` ở đó gọi
   `modalChoice()`. **Từ ver 10:** `task-manager.js` (lớp `Loop`/`TaskManager`,
   tạo instance global `taskManager`) nạp NGAY SAU `dom-refs.js`, TRƯỚC cả
   `modal-choice.js`/`db.js` — đây là file core PHẢI có mặt sớm nhất trong
   số các file mới, vì hầu hết file core khác gọi `taskManager.once()`/
   `addNew()` ngay khi gắn listener lúc parse (không phải lúc DOM ready).
   `auto-switch-visual.js` (logic Tự động đổi hiệu ứng) nạp SAU
   `player-controls.js` — cần `MODES`/`currentModeIndex`/`updateTypeUI`/
   `saveConfig`/`audioPlayer` đã có ref, và cần `taskManager` đã tồn tại.
   **Từ ver 10 mini-fix:** `resume-state-storage.js` nạp NGAY SAU `db.js`,
   TRƯỚC `wakelock.js` — file đó gọi `saveResumeStateToLocalStorage()`/
   `setResumeFlag()`/`clearResumeFlag()` ngay trong listener
   `visibilitychange`/`pagehide`/`beforeunload`. `app-recovery.js` và
   `stats-panel-toggle.js` nạp SAU `dom-refs.js`/`main.js` (cần ref DOM của
   nút mới + HTML thật đã chèn) — `stats-panel-toggle.js` còn phải nạp
   TRƯỚC `audio-analysis.js` (file đó đọc biến `isStatsPanelVisible`).
   **Từ batch i18n (⚠️ CHƯA test trên browser thật):** `language-settings.js`
   nạp SAU `app-recovery.js` (cùng nhóm "cần ref DOM của nút mới + HTML thật
   đã chèn" như `app-recovery.js`/`stats-panel-toggle.js` ở trên) — gọi
   `document.getElementById('setting-language-select'/'-upload'/'-delete')`
   ngay khi nạp, và cần `saveLanguagePack`/`applySavedLanguage`/
   `listAvailableLanguages` (từ `lang.js`, đã có từ bước 0.5) +
   `deleteLanguagePack` (từ `db.js`, bước 3 phía trên) + `modalChoice()`
   (từ `modal-choice.js`, đã nạp trước đó).
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
   nếu localStorage rỗng — xem mục riêng trong changelog/v7.md. **Từ ver 10
   mini-fix:** `checkPendingResumeStateOnBoot()` được gọi NGAY SAU
   `loadConfig()`, TRƯỚC `initPlaylistFromDB()` — modal "Tiếp tục nghe?"
   (nếu cờ resume đang bật) hiện song song với lúc playlist đang load ngầm,
   không đợi load xong mới thấy modal. Sau khi `initPlaylistFromDB()` xong,
   `enableResumeModalButtonsWhenPlaylistReady()` mở khoá 2 nút "Tiếp tục
   phát"/"Nghe lại" (đã bị disable tạm cho tới lúc đó).

> **Lưu ý riêng cho `js/core/pitch-worker.js` (mới ở ver 7):** đây KHÔNG nằm
> trong danh sách `<script src="...">` ở trên — nó được nạp bằng
> `new Worker('js/core/pitch-worker.js')` ngay trong `audio-engine.js`
> (`initPitchWorker()`), chạy trên 1 thread hoàn toàn riêng biệt, không chia
> sẻ global scope với các file `core/*.js` khác. Đường dẫn `'js/core/...'`
> trong `new Worker(...)` resolve theo base URL của `index.html`, giống mọi
> đường dẫn tương đối khác trong project — không tương đối theo file JS gọi
> nó. Đây vẫn là *classic Worker* (không `type: 'module'`) để chạy được qua
> `file://`, đồng bộ với chủ trương "không build step, không ES6 module" của
> toàn bộ project (xem [why-no-es6-module.md](./why-no-es6-module.md)).

> **⚠️ Lưu ý batch i18n — CHƯA test trên browser thật:** việc chèn `lang.js`
> vào bước 0.5 (trước cả bước 1) là thay đổi DUY NHẤT trong lịch sử project
> phá vỡ quy tắc "4 bước cố định" đã giữ nguyên từ ver 5 tới giờ. Mọi kiểm
> chứng cho bước này hiện chỉ chạy qua Node `vm`/`require` (mock `document`/
> `indexedDB`), CHƯA xác nhận trên trình duyệt thật rằng việc thêm 1 script
> chen vào trước `loading-shield.js` (file component đầu tiên) không gây
> tác dụng phụ nào với cách trình duyệt parse/thực thi các `<script>` tiếp
> theo. Xem mục "Nợ kỹ thuật" trong
> [changelog/v10-lang-test.md](../changelog/v10-lang-test.md).

← [Quay lại README](../README.md)
