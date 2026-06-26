# Muốn sửa gì thì sửa ở đâu?

| Muốn sửa... | Vào file... |
|---|---|
| Giao diện danh sách bài hát | `js/components/playlist-view.js` |
| Logo "SAV" góc trái Playlist (wordmark, mở/thu chữ ngang) | `js/components/playlist-view.js` (khối `#sav-logo`, các `<span>` chữ thường); JS toggle ở `js/core/dom-refs.js` — desktop dùng `mouseenter`/`mouseleave`, mobile dùng `click` + tap-ra-ngoài-tự-thu, `touch-action: manipulation` chặn double-tap-zoom (xem changelog mini-fix, đã đổi từ CSS `:hover` thuần sang JS) |
| Tab "Ảnh bìa" trong modal sửa thông tin (upload/xem trước/xóa cover) | `js/components/playlist-view.js` (HTML 2 tab trong `#song-edit-modal`), `js/playlist/actions.js` (logic `setSongEditTab`/lưu) |
| Menu "Chọn file nhạc / Chọn cả thư mục" cho nút Thêm nhạc | `js/components/playlist-view.js` (HTML `#upload-action-menu`), `js/playlist/loader.js` (mở/đóng menu, `handleAudioFiles()` dùng chung cho 2 input) |
| Modal hỏi quyết định dùng chung (text + N nút tuỳ biến, tự dựng/xoá DOM động) | `js/core/modal-choice.js` (hàm `modalChoice(text, buttons, options?)` — xem comment đầu file; từ ver 10 mini-fix hỗ trợ thêm `disabled`/`dataset` trên từng nút) |
| Modal "Tiếp tục nghe?" lúc khởi động lại trang sau khi tab bị ẩn | `js/core/player-controls.js` (`showResumeChoiceModal()`, `lastStoppedKey`/`lastStoppedTime`), `js/core/resume-state-storage.js` (lưu/đọc state qua localStorage, cờ + snapshot TÁCH RIÊNG, `checkPendingResumeStateOnBoot()`/`applyResumeStateToRam()`/`discardPendingResumeState()`), `js/core/wakelock.js` (phát hiện ẩn tab thật vs F5, reload ngay lúc ẩn) |
| Mọi timer lặp/bắn-một-lần (interval, timeout, debounce, throttle) | `js/core/task-manager.js` (instance global `taskManager` — `addNew`/`once`/`pause`/`resume`/`kill`/`isTaskRunning`, xem comment đầu file để biết cách dùng) |
| "Xoá hết dữ liệu" / tải nhạc về rồi xoá / an toàn khi bị gián đoạn lúc xoá | `js/core/storage-manager.js` (hàm `clearAllStoredData`, cờ `isDestructiveTaskInProgress` + `meta.clearingInProgress`), UI ở `js/components/storage-drawer.js`, resume-on-boot ở `js/playlist/loader.js` (`initPlaylistFromDB`) |
| Đưa UI về màn Playlist (dùng chung giữa nút Quay lại / Clear All) | `js/core/player-controls.js` (hàm `forceBackToPlaylistUI()` — từ ver 10 mini-fix KHÔNG còn gọi lúc ẩn tab, chỉ còn dùng cho Clear All) |
| Khởi động lại app / Khôi phục cài đặt mặc định (Settings → "Khắc phục sự cố") | `js/core/app-recovery.js` (2 handler, mỗi nút hỏi xác nhận qua `modalChoice()` trước khi thực hiện), UI ở `js/components/settings/misc.js` |
| Toggle ẩn/hiện dải BPM/Pitch/Energy trong Control Center | `js/core/stats-panel-toggle.js` (cờ `isStatsPanelVisible`), UI nút ở `js/components/visualizer-overlay.js` (`#btn-toggle-stats-panel`), `js/core/audio-analysis.js` (tôn trọng cờ khi ghi DOM text, GIỮ NGUYÊN phần tính toán logic cho Rubik) |
| Đa ngôn ngữ (i18n) — bộ điều phối, dịch text, ngôn ngữ gốc/fallback | `js/core/lang.js` (⚠️ CHƯA test browser thật — xem changelog/v10-lang-test.md). `LANG_EN_KEYS` = English, cứng RAM, gốc/fallback duy nhất. Hàm `t(key, fallback?)`/`tFormat(key, vars)` dùng ở MỌI nơi cần hiển thị text — không hard-code chuỗi tiếng Việt/tiếng Anh trực tiếp trong code nữa |
| Đa ngôn ngữ — thêm/sửa 1 key dịch | `js/core/lang.js` (`LANG_EN_KEYS`, namespace = tên biến `TPL_*` của file chứa key đó, bỏ `TPL_` + camelCase; xem comment đầu file để biết bảng tra cứu đầy đủ + quy ước placeholder `{n}`/`{name}`) |
| Đa ngôn ngữ — UI chọn/upload/xóa ngôn ngữ trong Settings | `js/components/settings/language.js` (HTML section "Ngôn ngữ"), `js/core/language-settings.js` (xử lý JS: `renderLanguageOptions()`, listener chọn/upload/xóa) |
| Đa ngôn ngữ — lưu trữ ngôn ngữ đã upload (IndexedDB) | `js/core/db.js` (store `languages` mới, `DB_VERSION` 2→3, 4 hàm CRUD `getLanguagePack`/`setLanguagePack`/`deleteLanguagePack`/`getAllLanguageCodes`) |
| Đa ngôn ngữ — file ngôn ngữ mẫu để test upload (tiếng Việt) | `lang/vi.json` (đúng format `{meta:{code,name}, keys:{...}}` — KHÔNG tự nạp lúc khởi động, chỉ để tự upload qua Settings → Ngôn ngữ) |
| Kiểu xem (Danh sách/Lưới) + Sắp xếp Playlist | `js/components/settings/playlist-background.js` (HTML 2 `<select>`), `js/playlist/main.js` (`PlaylistMain.initViewMode()`/`initSortMenu()`) |
| Tự động đổi hiệu ứng Visualizer theo thời gian | `js/core/auto-switch-visual.js` (2 nhánh cơ chế — xem comment đầu file để biết sự khác biệt giữa "Cố định"/"Ngẫu nhiên" và "Theo độ dài bài hát"; từ ver 10 mini-fix có thêm `updateCycleModeButtonState()` khoá nút `#btn-cycle-mode` khi đang bật, và cờ `_lastMarksBuiltForKey` chống build lại marks 2 lần do race condition 'play'/'loadedmetadata'), UI ở `js/components/visualizer-settings-drawer.js` (card "Tự động đổi hiệu ứng", đã CHUYỂN từ Settings chính vào đây) |
| Giao diện ngăn cài đặt — khung ngoài + thứ tự ghép section | `js/components/settings-drawer.js` (object điều phối `SettingsDrawer`) |
| Giao diện ngăn cài đặt — nội dung từng khối (Playlist & Nền / Visualizer / Audio EQ / Phụ đề / Khác) | `js/components/settings/*.js` (1 file = 1 khối, xem bảng cấu trúc thư mục) |
| Giao diện drawer "Tùy chỉnh Visualizer" (Chất lượng Render/Hình học/Màu sắc/Tự động đổi hiệu ứng) | `js/components/visualizer-settings-drawer.js` |
| Visual "Bar" (kiểu Phản chiếu cánh bướm / kiểu Thác đổ) | `js/visualizers/types/bar.js` |
| Visual "Rain" (kiểu Trôi cửa kính / kiểu Mưa phố, đèn đường, hàng rào) | `js/visualizers/types/rain.js` |
| Visual "Rubik" (phóng to/thu nhỏ theo beat, xoay tự thân + xoay lớp theo pitch) | `js/visualizers/types/rubik.js` (map nốt→trục/lớp ở `RUBIK_NOTE_TO_TURN` trong `js/core/dom-refs.js`) |
| Visual Lightning / Black Hole | `js/visualizers/types/lightning.js`, `black-hole.js` (tương ứng) |
| Vòng lặp render chính, thêm visual mới vào bảng dispatch | `js/visualizers/draw-visualizer.js` (object `VISUALIZER_DRAWERS`; từ ver 10 mini-fix còn gọi `checkPendingResumeStateOnBoot()` ngay sau `loadConfig()`) |
| Hàm vẽ dùng chung (giọt nước, khung kính, nốt nhạc bay lên) | `js/visualizers/draw-helpers.js` |
| Logic phát nhạc, next/prev, shuffle | `js/playlist/actions.js` (playSong), `js/playlist/order.js` (hàng đợi/shuffle), `js/core/player-controls.js` (next/prev) |
| Lưu trữ IndexedDB (nhạc/tag/cover/sub/ảnh-video nền), slugify/resolve key | `js/core/db.js` |
| Lưu/đọc state phát nhạc qua localStorage khi tab bị ẩn (resume state) | `js/core/resume-state-storage.js` (xem comment đầu file: cờ `sav_resumeFlag_v1` vs snapshot `sav_pendingResumeState_v1` TÁCH RIÊNG, video nền + auto-switch-visual marks cũng được lưu/phục hồi — video còn nợ kỹ thuật, xem changelog mini-fix) |
| Validate định dạng file upload (nhạc/ảnh nền/video nền/ảnh bìa bài hát) | `js/core/upload-validation.js` (`validateAudioFile`/`validateImageFile`/`validateVideoFile`) |
| Che màn hình khi xử lý (nạp nhạc/chuyển bài/lưu ảnh nền/lưu ảnh bìa...) | `js/core/loading-shield-util.js` (hàm `withLoadingShield`) |
| Sửa tag/info/ảnh bìa/export gắn tag mới của 1 bài | `js/playlist/actions.js` (modal sửa — tab Thông tin + tab Ảnh bìa; modal info — số lần nghe + giờ nghe), `js/core/id3-export.js` (export, tự ghi `record.cover` vào APIC) |
| Thuật toán sort (default/az/za) / ô tìm kiếm (lọc theo tên/nghệ sĩ/album) / tách danh-sách-hiển-thị khỏi hàng-đợi-phát | `js/playlist/order.js` (sort + `matchesSearch`), `js/playlist/render.js` (vẽ + trạng thái rỗng), `js/playlist/main.js` (gắn UI sort/kiểu xem + ô tìm kiếm) |
| Số lần nghe / thời gian nghe riêng từng bài | `js/core/listen-stats.js` (lưu `meta.songStats`), cộng dồn ở `js/core/player-controls.js` (timeupdate) |
| Giữ màn hình sáng (wake lock) / ẩn tab bị ẩn (reload + resume state) | `js/core/wakelock.js` (gate theo `vizConfig.keepScreenOn`; từ ver 10 mini-fix VIẾT LẠI HOÀN TOÀN luồng ẩn tab — xem changelog mini-fix), toggle UI ở `js/components/settings/misc.js` |
| Video nền (bật/tắt, gán src, chống chớp trắng) | `js/core/state-and-video-bg.js` (hàm `handleVideoBackground`) — **lưu ý:** việc khôi phục đúng `currentTime` video sau khi quay lại tab CHƯA hoạt động đúng, xem mục nợ kỹ thuật trong [changelog/v10-mini-not-full-fix.md](../changelog/v10-mini-not-full-fix.md) |
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

← [Quay lại README](../README.md)
