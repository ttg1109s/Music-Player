# Cấu trúc thư mục

```
visual-master/
├── README.md
├── readme/                      ← các phần tách riêng của README (file này)
├── changelog/
│   ├── v1.md
│   ├── v2.md
│   ├── v3.md
│   ├── v4.md
│   ├── v5.md
│   ├── v6.md
│   ├── v7.md
│   ├── v8.md
│   ├── v9.md
│   ├── v10.md
│   └── v10-mini-not-full-fix.md   ← log nhỏ, chưa test đủ để coi là final (xem mục cuối log)
├── index.html                  ← Mở file này để chạy ứng dụng
├── css/
│   └── styles.css               (toàn bộ CSS gốc, không đổi)
└── js/
    ├── components/
    │   ├── loading-shield.js    (★★★★★ ver 5 — đổi cơ chế ẩn/hiện sang opacity)
    │   ├── playlist-view.js     (★★★★★ ver 5, ★★★★★★ ver 6 — ô tìm kiếm, z-index, bỏ sort random; ★★★★★★★★ ver 8 — logo wordmark SAV trượt ngang, tab "Ảnh bìa" trong modal sửa thông tin, 2 modal thiết kế lại theo `glass-modal`, menu "Chọn file/Chọn cả thư mục"; ★★★★★★★★★★ ver 10 — xoá #btn-toggle-view, #btn-sort-display + dropdown khỏi header, dồn vào Settings; logo SAV chuyển từ hover CSS thuần sang JS toggle [tap/mouseenter-mouseleave] — xem changelog/v10-mini-not-full-fix.md)
    │   ├── visualizer-overlay.js   (★★★★★★★★★★ ver 10 refine — grid Control Center 5→6 icon, thêm toggle "Thống kê" ẩn/hiện dải BPM/Pitch/Energy)
    │   ├── subtitle-modal.js
    │   ├── bottom-player.js
    │   ├── settings/            (★★★★★★★★ mới ở ver 8 — 5 section HTML tách từ settings-drawer.js cũ)
    │   │   ├── playlist-background.js       (TPL_SETTINGS_PLAYLIST_BG — Video BG, ảnh nền Playlist + blur; ★★★★★★★★★★ ver 10 — thêm select "Kiểu xem"/"Sắp xếp", xoá section "Hiệu ứng Visualizer" riêng)
    │   │   ├── visualizer-geometry-color.js (TPL_SETTINGS_VISUALIZER — chất lượng render, hình học + màu sắc; ★★★★★★★★★★ ver 10 — gộp toggle "Hiện Visual" vào đây; card "Tự động đổi hiệu ứng" sau đó CHUYỂN sang visualizer-settings-drawer.js, xem changelog mini-fix)
    │   │   ├── audio-eq.js                  (TPL_SETTINGS_AUDIO_EQ — âm lượng, preset EQ, dải tần số thủ công)
    │   │   ├── subtitle-style.js            (TPL_SETTINGS_SUBTITLE_STYLE — style khung/chữ phụ đề)
    │   │   └── misc.js                      (TPL_SETTINGS_MISC — giữ màn hình sáng, mở About Drawer; ★★★★★★★★★★ ver 10 mini-fix — thêm section "Khắc phục sự cố": Khởi động lại app / Khôi phục cài đặt mặc định)
    │   ├── visualizer-settings-drawer.js (★★★★★★★★ ver 8 — drawer "Tùy chỉnh Visualizer"; ★★★★★★★★★★ ver 10 mini-fix — thêm card "Tự động đổi hiệu ứng", chuyển vào từ visualizer-geometry-color.js)
    │   ├── settings-drawer.js   (★ ver 1, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — toggle "Giữ màn hình sáng"; ★★★★★★★ ver 7 — accept= khớp whitelist ảnh/video; ★★★★★★★★ ver 8 — VIẾT LẠI HOÀN TOÀN: chỉ còn object điều phối `SettingsDrawer.build()` ghép 5 file trong settings/, không tự chứa HTML)
    │   ├── storage-drawer.js    (★★★★★★ ver 6 — mô tả nút xoá: chỉ xoá bài hát)
    │   └── about-drawer.js      (★★★★★ mới ở ver 5 — thống kê, giới thiệu, cảnh báo IndexedDB)
    ├── main.js                  (★★★★★ ver 5 — ghép thêm TPL_ABOUT_DRAWER)
    ├── core/
    │   ├── config.js            (★ ver 1, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — thêm keepScreenOn; ★★★★★★★★★★ ver 10 — hằng AUTO_SWITCH_VISUAL_MIN_SECONDS, 6 field cấu hình mới cho Tự động đổi hiệu ứng)
    │   ├── dom-refs.js          (★ ver 1, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — ref keepScreenOnToggle; ★★★★★★★★ ver 8 — ref savLogo, folderInput, btnUploadAudio, uploadActionMenu; ★★★★★★★★★★ ver 10 — xoá 3 ref btnToggleView/iconGridView/iconListView không còn dùng; ver 10 mini-fix — toggle logo SAV [click/mouseenter-mouseleave], ref btnRestartApp/btnRestoreDefaults, ref statsPanel/btnToggleStatsPanel/2 icon)
    │   ├── task-manager.js      (★★★★★★★★★★ mới ở ver 10 — lớp `Loop`/`TaskManager` quản lý TẬP TRUNG mọi setInterval/setTimeout của app, kể cả timeout bắn-1-lần qua `taskManager.once()`; instance global `taskManager` duy nhất)
    │   ├── auto-switch-visual.js (★★★★★★★★★★ mới ở ver 10 — Tự động đổi hiệu ứng Visualizer theo thời gian: 2 nhánh cơ chế khác hẳn nhau cho "Cố định"/"Ngẫu nhiên" [đồng hồ độc lập] vs "Theo độ dài bài hát" [mốc tuyệt đối theo currentTime, mỗi mốc tự nhớ visual]; ver 10 mini-fix — khoá #btn-cycle-mode khi auto-switch bật, sửa race condition 'play' bắn trước 'loadedmetadata' làm mất marks đã phục hồi)
    │   ├── modal-choice.js      (★★★★★★★★★ mới ở ver 9 — modalChoice(text, buttons, options?): hàm dùng CHUNG cho mọi modal "hỏi quyết định" tuỳ biến số nút/nhãn/hành động, tự dựng DOM động + tự xoá hẳn sau khi chọn, KHÔNG cần template HTML tĩnh riêng cho từng case; dùng cho modal "Tiếp tục nghe?" — xem player-controls.js; ver 10 mini-fix — hỗ trợ `disabled`/`dataset` trên từng nút)
    │   ├── db.js                (★★★★★ mới ở ver 5 — IndexedDB: slugify/resolveKey/CRUD; ★★★★★★★★★ ver 9 — viết lại cơ chế mở connection: tự phát hiện + tự mở lại connection mới khi trình duyệt tự đóng connection cũ qua 2 lớp bảo vệ (sự kiện `close` + retry trong `makeStoreAccessor()`) — fix gốc rễ lỗi "không ra tiếng" sau khi quay lại tab trên iOS)
    │   ├── resume-state-storage.js (★★★★★★★★★★ mới ở ver 10 mini-fix — lưu/đọc state phát nhạc qua localStorage khi tab ẩn, cờ + snapshot TÁCH RIÊNG; xem changelog mini-fix)
    │   ├── app-recovery.js      (★★★★★★★★★★ mới ở ver 10 mini-fix — xử lý "Khởi động lại app"/"Khôi phục cài đặt mặc định" trong Settings)
    │   ├── stats-panel-toggle.js (★★★★★★★★★★ mới ở ver 10 mini-fix — toggle ẩn/hiện dải BPM/Pitch/Energy trong Control Center)
    │   ├── upload-validation.js (★★★★★★★ mới ở ver 7 — validate MIME/đuôi file cho nhạc/ảnh nền/video nền; tái dùng ở ver 8 cho ảnh bìa bài hát)
    │   ├── loading-shield-util.js (★★★★★ mới ở ver 5 — withLoadingShield dùng chung; ★★★★★★★★★ ver 9 — console.warn khi bị chặn do isShieldBusy, dễ dò khi nghi ngờ bị "kẹt" khoá; ★★★★★★★★★★ ver 10 — setTimeout chờ fade-out chuyển sang taskManager.once())
    │   ├── three-vortex.js      (★ ver 1, ★★ ver 2)
    │   ├── state-and-video-bg.js (★★★★★ ver 5, ★★★★★★ ver 6 — handleVideoBackground viết lại, bám nhạc không bám màn hình; ★★★★★★★ ver 7 — validate định dạng video lúc upload; ★★★★★★★★★★ ver 10 — xoá listener btnToggleView [chuyển sang playlist/main.js], 1 setTimeout debounce chuyển sang taskManager.once())
    │   ├── subtitles.js         (★★★★★ ver 5 — persist subtitles khi Apply; ★★★★★★★★★★ ver 10 — 2 chỗ scroll-to-bottom chuyển sang taskManager.once())
    │   ├── equalizer-settings.js (★ ver 1, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — nạp/đồng bộ keepScreenOn; ★★★★★★★ ver 7 — backup config sang IndexedDB debounce + fallback phục hồi khi mất localStorage; ★★★★★★★★★★ ver 10 — migrate/validate 6 field Tự động đổi hiệu ứng, gọi initAutoSwitchVisualUI(), debounce scheduleConfigBackup() chuyển sang taskManager.once())
    │   ├── subtitle-display.js  (★★★★★★★★★★ ver 10 — timeout xoá active subtitle block chuyển sang taskManager.once())
    │   ├── wakelock.js          (★★★★★ ver 5, ★★★★★★ ver 6 — gate theo keepScreenOn, resume AudioContext khi visible; ★★★★★★★★★ ver 9 — thêm 'pagehide'/'pageshow' làm tín hiệu dự phòng cho 'visibilitychange' [không đáng tin cậy trên iOS]; ★★★★★★★★★★ ver 10 mini-fix — VIẾT LẠI HOÀN TOÀN luồng ẩn tab: reload NGAY lúc ẩn [không đợi quay lại], phân biệt F5 thủ công với ẩn tab thật qua debounce 50ms + tín hiệu beforeunload, pause audio+video TRƯỚC khi lưu state [nợ kỹ thuật: video vẫn lệch currentTime, xem log mini-fix])
    │   ├── color-utils.js       (★★★★★★ ver 6 — nền đen thay transparent khi bật video, chống chớp trắng)
    │   ├── canvas-scene-setup.js (★ ver 1, ★★ ver 2, ★★★ ver 3, ★★★★ ver 4)
    │   ├── listen-stats.js      (★★★★★★ mới ở ver 6 — số lần nghe + thời gian nghe riêng từng bài, key {count,totalTime} trong meta.songStats; ★★★★★★★★★★ ver 10 — debounce/throttle scheduleSongStatsSave() chuyển sang taskManager)
    │   ├── player-controls.js   (★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — video bám theo nhạc, cộng dồn giờ nghe/bài, gate wake lock; ★★★★★★★ ver 7 — validate định dạng ảnh nền lúc upload; ★★★★★★★★★ ver 9 — resetPlayerToIdle() chống gọi chồng + giải phóng cứng isShieldBusy + chuyển UI về Playlist + cache lastStoppedKey/lastStoppedTime; showResumeChoiceModal() mới (modal "Tiếp tục nghe?"); playPauseBtn/setupAudioContext resume cả AudioContext.state 'interrupted' [không chỉ 'suspended']; .catch() cho promise chain totalListenSeconds trong _listenTick(); ★★★★★★★★★★ ver 10 — tách forceBackToPlaylistUI() dùng chung với storage-manager.js; vá isShieldBusy ép cứng theo cờ isDestructiveTaskInProgress; _listenTickHandle chuyển sang Loop qua taskManager; móc auto-switch-visual vào listener play/pause/loadedmetadata; ver 10 mini-fix — XOÁ HẲN resetPlayerToIdle() [dead code, không còn ai gọi]; showResumeChoiceModal() hiện sớm + disable nút tạm chờ playlist load; khoá #btn-cycle-mode khi auto-switch bật)
    │   ├── audio-engine.js      (★★★★★★★ ver 7 — detectPitchYIN() dời sang pitch-worker.js; chỉ còn cầu nối postMessage/onmessage; ★★★★★★★★★ ver 9 — setupAudioContext() resume cả AudioContext.state 'interrupted' [trạng thái riêng của iOS Safari khi tab bị ẩn, khác 'suspended'])
    │   ├── audio-analysis.js   (★★★★★★★ ver 7 — đọc kết quả pitch bất đồng bộ từ worker thay vì gọi hàm đồng bộ; ★★★★★★★★★★ ver 10 mini-fix — tôn trọng cờ isStatsPanelVisible, bỏ ghi DOM text khi ẩn nhưng GIỮ NGUYÊN phần tính toán logic [rubikPitchAvg/currentCalculatedBpm])
    │   ├── pitch-worker.js      (★★★★★★★ mới ở ver 7 — Web Worker thuần CPU cho thuật toán YIN, tách khỏi main thread/draw loop)
    │   ├── rubik-math.js
    │   ├── about-stats.js       (★★★★★ mới ở ver 5 — computeStats() cho About Drawer)
    │   ├── id3-export.js        (★★★★★ mới ở ver 5 — export/restore gắn tag mới qua ID3Writer; ảnh bìa sửa ở ver 8 tự được ghi vào APIC, không cần sửa file này)
    │   └── storage-manager.js   (★★★★★★ ver 6 — "Xoá hết" chỉ xoá bài hát, GIỮ ảnh/video nền; ★★★★★★★★★★ ver 10 — clearAllStoredData() thêm cờ isDestructiveTaskInProgress + meta.clearingInProgress + gọi forceBackToPlaylistUI() + killAllAutoSwitchVisualTasks())
    ├── playlist/                (★★★★★★ mới ở ver 6 — tách từ core/playlist.js cũ thành module nhiều file, kiểu object-function)
    │   ├── state.js             (state dùng chung: playlistOrder / displayOrder [hàng đợi phát] / renderOrder [danh sách hiển thị] tách rời)
    │   ├── order.js             (sort default/az/za — KHÔNG còn random; lọc tìm kiếm; pending-append hàng đợi khi đang phát; ★★★★★★★ ver 7 — applyNewSongsToDisplayOrder() dùng Set tra cứu O(1) thay .includes() O(n); ★★★★★★★★ ver 8 — matchesSearch() lọc thêm theo album)
    │   ├── render.js            (vẽ diff theo renderOrder; trạng thái rỗng #playlist-empty / #playlist-search-empty thuần theo dữ liệu; ★★★★★★★★★★ ver 10 — 1 timeout fade-out chuyển sang taskManager.once())
    │   ├── loader.js            (đọc duration, nạp file mới, quét/khởi tạo playlist từ IndexedDB; ★★★★★★★ ver 7 — validate định dạng nhạc trước khi xử lý, Set tra cứu O(1) thay .includes() O(n) trong vòng lặp nạp file; ★★★★★★★★ ver 8 — tách `handleAudioFiles()` dùng chung cho input file rời + input "Chọn cả thư mục", thêm menu nhỏ cho nút Thêm nhạc; ★★★★★★★★★ ver 9 — try/catch quanh 2 listener 'change' + listener mở menu, alert() đúng nguyên văn lỗi thật khi có exception ngoài dự kiến; ★★★★★★★★★★ ver 10 — initPlaylistFromDB() thêm resume-on-boot check clearingInProgress; 2 race-timeout + timeout đóng menu chuyển sang taskManager)
    │   ├── actions.js           (playSong, xoá/sửa/info bài, menu thao tác — info hiện số lần nghe + giờ nghe riêng; ★★★★★★★ ver 7 — reset trạng thái pitch worker khi đổi bài; ★★★★★★★★ ver 8 — tab "Ảnh bìa" trong modal sửa: upload/xem trước/xóa cover, lưu cùng lúc với title/artist/album; ★★★★★★★★★ ver 9 — playSong() thêm .catch() làm lớp bảo vệ cuối, alert() lỗi thật nếu IndexedDB connection chết mà cả 2 lớp tự phục hồi ở db.js đều không cứu được)
    │   └── main.js              (object `PlaylistMain`: initSortMenu + initSearch + init(); tự gọi init ở cuối; ★★★★★★★★★★ ver 10 — initSortMenu() viết lại đọc/ghi qua <select> thay dropdown nổi; thêm initViewMode() mới [chuyển logic grid/list từ state-and-video-bg.js])
    └── visualizers/
        ├── draw-helpers.js      (★★★ ver 3, ★★★★ ver 4; ★★★★★★★★★★ ver 10 — timeout xoá note bay chuyển sang taskManager.once())
        ├── draw-visualizer.js   (★ ver 1, ★★ ver 2, ★★★ ver 3, ★★★★ ver 4, ★★★★★ ver 5, ★★★★★★ ver 6 — thêm loadSongStats() lúc khởi động; ★★★★★★★★★★ ver 10 mini-fix — checkPendingResumeStateOnBoot() gọi ngay sau loadConfig(), không đợi initPlaylistFromDB())
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
ver 7, ★★★★★★★★ = thêm ở ver 8, ★★★★★★★★★ = thêm ở ver 9, ★★★★★★★★★★ = thêm
ở ver 10 (bao gồm cả các mini-fix sau ver 10); file không đánh dấu giữ
nguyên 100% so với bản chia module gốc.)

> **Lưu ý ver 10 mini-fix:** xem [changelog/v10-mini-not-full-fix.md](../changelog/v10-mini-not-full-fix.md)
> để biết đầy đủ các thay đổi mới nhất — log này CHƯA được test đủ kỹ để
> coi là bản chốt (final), một số phần còn nợ kỹ thuật (đặc biệt: video nền
> chưa khôi phục đúng `currentTime` sau khi quay lại tab).

> **Lưu ý ver 10:** `js/core/task-manager.js` là instance global DUY NHẤT
> (`taskManager`) — mọi timer lặp/bắn-một-lần khác trong project PHẢI đăng ký
> qua đây, không tự gọi `setInterval`/`setTimeout` trần ở file mới nào nữa
> (xem comment đầu file để biết cách dùng `addNew`/`once`/`pause`/`resume`).

> **Lưu ý ver 8:** `js/components/settings-drawer.js` KHÔNG còn chứa HTML
> trực tiếp — toàn bộ nội dung gốc được tách sang thư mục
> `js/components/settings/` (5 file), mỗi file giữ ĐÚNG NGUYÊN HTML của 1
> section, đã kiểm chứng output ghép lại giống 100% bản trước khi tách
> (xem mục 5 trong [changelog/v8.md](../changelog/v8.md)). Biến
> `TPL_SETTINGS_DRAWER` mà `main.js` dùng được GIỮ NGUYÊN TÊN.

> **Lưu ý ver 6:** `js/core/playlist.js` (bản ver 5) ĐÃ BỊ XOÁ — toàn bộ nội
> dung được tách sang thư mục `js/playlist/` (6 file). Mọi tên biến/hàm global
> cũ (`playlistOrder`, `displayOrder`, `playSong`, `renderPlaylistDiff`,
> `initPlaylistFromDB`, `currentKey`...) được GIỮ NGUYÊN nên các file khác
> không phải sửa; chỉ thêm khái niệm mới `renderOrder` (danh sách hiển thị,
> tách khỏi hàng đợi phát).

← [Quay lại README](../README.md)
