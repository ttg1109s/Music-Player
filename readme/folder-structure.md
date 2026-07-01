# Cấu trúc thư mục

> Viết lại toàn bộ ở ver 11 — bản trước liệt kê theo `js/components/`, `js/core/`, `js/playlist/`,
> `js/visualizers/` đã LỖI THỜI HOÀN TOÀN (thư mục `js/` không còn tồn tại từ đợt tách `lang/`
> batch i18n; `playlist/`/`visualizers/` sau đó dời vào trong `core/`). Cây bên dưới lấy trực tiếp
> từ `find` chạy trên source thật, không gõ tay lại từ trí nhớ — 110 file `.js`, khớp `index.html`.
>
> **Đổi quy ước đánh dấu:** từ ver 11, thay vì cộng thêm 1 ★ cho mỗi bản (đã lên tới 11 sao ở batch
> i18n, khó đọc), file thay đổi/mới ở ver 11 đánh `[v11]`. Lịch sử ★ ver 1–10 + batch i18n GIỮ
> NGUYÊN như cũ (xem chú thích cuối) cho các file không đổi gì thêm ở ver 11.

```
visual-master/
├── README.md                    ← file này (đã dời ra root ở ver 11, trước đó nằm lạc trong readme/)
├── readme/
│   ├── changelog-index.md
│   ├── folder-structure.md      ← file bạn đang đọc
│   ├── script-load-order.md
│   ├── usage.md
│   ├── visual-conventions.md
│   ├── where-to-edit.md
│   ├── why-no-es6-module.md
│   └── changelog/
│       ├── v1.md … v9.md
│       ├── v10.md, v10-mini-not-full-fix.md, v10-lang-test.md
│       └── v11.md               ← [v11] hoàn tất event bus + State tập trung + 3 lỗi nhỏ
├── index.html                   ← Mở file này để chạy ứng dụng
├── favicon.png
├── main.js                      ← chèn toàn bộ TPL_* (components/) vào #app-root
│
├── assets/
│   └── css/
│       └── style.css            (toàn bộ CSS, 1 file duy nhất, không đổi cấu trúc từ ver 5)
│
├── lang/                        (batch i18n — đa ngôn ngữ)
│   ├── lang.js                  — gộp 5 patch bằng Object.assign(), định nghĩa t()/tFormat()/
│   │                              validateLanguagePack()/saveLanguagePack()/applySavedLanguage()/
│   │                              listAvailableLanguages()/applyLanguageToDom(). Nạp NGAY ĐẦU
│   │                              <body>, TRƯỚC TOÀN BỘ components/*.js (xem script-load-order.md)
│   ├── language-settings.js     — xử lý UI section "Ngôn ngữ": renderLanguageOptions(), listener
│   │                              chọn/upload/xóa (đã migrate qua kiến trúc /event/ ở ver 11, cụm
│   │                              `languageSettings` patch 7 — file này giờ chỉ còn phần LOGIC
│   │                              gọi bởi router, không tự addEventListener nữa)
│   └── patch/                   — 5 file default-key tiếng Anh, viết .js (không .json — file://
│       ├── patch-common.js         không fetch() được file tĩnh). Thứ tự nội bộ không quan trọng,
│       ├── patch-playlist.js       cả 5 PHẢI nạp TRƯỚC lang.js. vi.json mẫu không còn trong repo
│       ├── patch-settings-misc.js  này (tự upload qua Settings > Ngôn ngữ khi cần).
│       ├── patch-subtitle-settings.js
│       └── patch-visualizer.js
│
├── components/                  (chỉ định nghĩa biến TPL_* — chuỗi HTML, KHÔNG đụng DOM)
│   ├── loading-shield.js
│   ├── playlist-view.js         — logo "SAV" (hover JS toggle), 2 tab modal sửa bài (Thông tin/
│   │                              Ảnh bìa), menu "Chọn file/Chọn cả thư mục"
│   ├── visualizer-overlay.js    — Control Center 6 icon (Đổi hiệu ứng/Phụ đề/Cài đặt/Trộn bài/
│   │                              Lặp lại/Thống kê) + #btn-back-playlist tách riêng; đã qua t()
│   │                              [v11: bản CŨ trùng tên TPL_VISUALIZER_OVERLAY từng bị lạc ở
│   │                              core/visualizer-overlay.js — đã XOÁ, đây là bản DUY NHẤT còn lại]
│   ├── subtitle-modal.js
│   ├── subtitle-settings-drawer.js
│   ├── bottom-player.js
│   ├── settings/                — 6 section HTML tách rời (mỗi file 1 biến TPL_SETTINGS_*)
│   │   ├── playlist-background.js  (Video BG, ảnh nền, kiểu xem, sắp xếp)
│   │   ├── visualizer-geometry-color.js (chất lượng render, hình học, màu sắc, toggle Hiện Visual)
│   │   ├── audio-eq.js             (volume, preset EQ, dải tần số thủ công)
│   │   ├── subtitle-style.js       (style khung/chữ phụ đề)
│   │   ├── misc.js                 (giữ màn hình sáng, About Drawer, Khắc phục sự cố)
│   │   └── language.js             (chọn/upload/xóa ngôn ngữ — đặt SAU CÙNG)
│   ├── settings-drawer.js       — object điều phối SettingsDrawer.build() ghép 6 biến TPL_SETTINGS_*
│   ├── about-drawer.js
│   ├── storage-drawer.js
│   └── visualizer-settings-drawer.js  (Chất lượng/Hình học-Màu sắc/Tự động đổi hiệu ứng)
│
├── core/                        (hàm thuần + STATE — gọi document.getElementById ngay khi nạp)
│   ├── config.js                — EQ_FREQS/EQ_LABELS (2 hằng KHÔNG thuộc CONST, giữ local), global
│   │                              error handler (window 'error'/'unhandledrejection'),
│   │                              saveConfig()/loadConfig() [v11: APP_CONFIG/PERFORMANCE_PROFILES/
│   │                              EQ_PRESETS/MODES/DEFAULT_VIZ_CONFIG/AUTO_SWITCH_VISUAL_MIN_SECONDS/
│   │                              DEFAULT_VINYL đã XOÁ khỏi đây, đọc qua CONST.xxx (service/state.js)]
│   ├── dom-refs.js               — mọi document.getElementById(...), RUBIK_NOTE_TO_TURN
│   ├── sav-logo.js               — setSavLogoExpanded(), gọi bởi event/router/sav-logo.js
│   ├── task-manager.js           — class Loop/TaskManager, instance global taskManager
│   ├── db.js                     — IndexedDB (idb-keyval), store songs/meta/languages, cơ chế tự
│   │                              phát hiện + tự mở lại connection khi trình duyệt tự đóng
│   ├── resume-state-storage.js   — lưu/đọc state phát nhạc (localStorage) khi tab ẩn, gồm cả vị
│   │                              trí video nền (videoCurrentTime, khôi phục qua 'loadedmetadata')
│   ├── upload-validation.js      — validateAudioFile/ImageFile/VideoFile
│   ├── listen-stats.js           — số lần nghe/thời gian nghe riêng từng bài (debounce qua taskManager)
│   ├── loading-shield-util.js    — withLoadingShield() dùng chung, cờ isShieldBusy
│   ├── three-vortex.js           — khởi tạo Three.js scene cho visual Vortex
│   ├── state-and-video-bg.js     — handleVideoBackground(), mở/đóng Control Center
│   ├── equalizer.js              — [v11 Group A] tách từ equalizer-settings.js cũ; slider EQ dùng
│   │                              1 listener DELEGATION trên eqSlidersWrapper (event/listener/
│   │                              equalizer-settings.js) thay 10 listener rời trong vòng lặp cũ
│   ├── tab-hide-reload.js        — [v11] triggerHideAndReload(): lưu state + reload ngay khi ẩn
│   │                              tab thật (phân biệt F5/đóng tab qua debounce 50ms +
│   │                              beforeunload); tách từ wakelock.js (cũ)
│   ├── wakelock.js               — requestWakeLock()/releaseWakeLock() (API thuần + NoSleep.js
│   │                              fallback) + 2 bootstrap listener xin quyền lần đầu tương tác
│   │                              [v11: đã dọn — chỉ còn đúng phần wake lock, mọi thứ khác đã tách
│   │                              sang tab-hide-reload.js/app-cleanup.js/event/tab.js; noSleep
│   │                              (từng bị lạc trong core/subtitle/subtitle-display.js) đã chuyển
│   │                              về đây — xem changelog/v11.md mục 1]
│   ├── color-utils.js
│   ├── canvas-scene-setup.js     — generateStreetScene(), getPlayerBarSafeHeight()
│   ├── playlist/                 (tách từ core/playlist.js cũ ver 6, kiểu object-function)
│   │   ├── state.js                 — [v11] hầu như toàn bộ state đã dời sang service/state.js,
│   │   │                              CHỈ CÒN 2 hàm tiện ích formatTime()/normalizeSongName()
│   │   ├── order.js                 — sort default/az/za, lọc tìm kiếm, pending-append
│   │   ├── render.js                — vẽ diff theo renderOrder, trạng thái rỗng
│   │   ├── loader.js                — đọc duration, nạp file mới, quét playlist từ IndexedDB
│   │   ├── actions.js               — playSong, xoá/sửa/info bài, menu thao tác
│   │   └── main.js                  — object PlaylistMain: initSortMenu + initSearch + initViewMode
│   ├── player-controls.js        — next/prev/shuffle/repeat, showResumeChoiceModal(); [ver 8]
│   │                              tách phần hiển thị Visualizer sang core/visualizer/visualizer-display.js
│   ├── audio-engine.js           — AudioContext, khởi tạo pitch worker
│   ├── app-cleanup.js            — [v11] executeAppCleanup(): dọn animation loop/AudioContext/
│   │                              object URL/flush listen-stats/wake lock khi tab ĐÓNG THẬT (F5/
│   │                              điều hướng) — gọi từ event/tab.js 'beforeunload'
│   ├── stats-panel-toggle.js     — toggle ẩn/hiện dải BPM/Pitch/Energy
│   ├── audio-analysis.js         — updateStatsDashboard() (BPM/Pitch/Energy)
│   ├── rubik-math.js
│   ├── about-stats.js            — computeStats() cho About Drawer
│   ├── app-recovery.js           — Khởi động lại app / Khôi phục cài đặt mặc định
│   ├── id3-export.js             — export/restore gắn tag ID3Writer, ảnh bìa vào APIC
│   ├── storage-manager.js        — clearAllStoredData(), cờ isDestructiveTaskInProgress
│   ├── modal-choice.js           — modalChoice(text, buttons, options?) dùng chung mọi modal hỏi
│   │                              quyết định; 2 listener click (nút/overlay) KHÔNG qua bus — hạ
│   │                              tầng dùng chung cho mọi nghiệp vụ, không riêng cụm nào
│   ├── pitch-worker.js           — Web Worker thuần cho thuật toán YIN, KHÔNG nằm trong danh sách
│   │                              <script> (nạp bằng new Worker(...) trong audio-engine.js)
│   ├── subtitle/
│   │   ├── subtitles.js             — logic .srt: parse/import/export/auto-timing
│   │   ├── subtitle-style-settings.js — [v11 Group A] style khung/chữ, migrate qua /event/
│   │   └── subtitle-display.js      — render active subtitle block theo currentTime
│   └── visualizer/
│       ├── visualizer-display.js    — cấu hình hiển thị (màu/EQ mode/bar style/vortex style/rain
│       │                              style/blur nền...), tách từ player-controls.js
│       ├── visualizer-misc-settings.js — [v11 Group A] mở/đóng drawer Visualizer/Subtitle, đổi
│       │                              kiểu hiệu ứng, giữ màn hình sáng
│       ├── draw-helpers.js          — hàm vẽ dùng chung (giọt nước, khung kính, nốt nhạc bay)
│       ├── draw-visualizer.js       — vòng lặp render chính, object VISUALIZER_DRAWERS, và dòng
│       │                              document.addEventListener('DOMContentLoaded', ...) — ĐIỂM
│       │                              KHỞI ĐỘNG THỰC SỰ của toàn app
│       └── types/                   — mỗi visual 1 file riêng
│           ├── bar.js                  (Phản chiếu cánh bướm / Thác đổ)
│           ├── lightning.js
│           ├── rubik.js                (map nốt→trục/lớp ở RUBIK_NOTE_TO_TURN, dom-refs.js)
│           ├── vortex.js               (update mỗi khung hình; khởi tạo ở three-vortex.js)
│           ├── black-hole.js
│           └── rain.js                 (kiểu Trôi cửa kính / Mưa phố)
│
├── service/
│   ├── state.js                  — [v11] STATE_SCHEMA (96 key) + class AppState (get/set/mutate,
│   │                              validate kiểu, skipCheck cho hot path) + CONST (16 hằng, ĐÃ
│   │                              migrate 100% — 93 chỗ dùng CONST.xxx thật trên 18 file khác nhau)
│   ├── adapter/                  — scaffolding TƯƠNG LAI cho native adapter bridge, CHƯA có code
│   │   ├── android/                 thật, chỉ giữ chỗ thư mục
│   │   ├── ios/
│   │   └── windows/
│   └── contact/                  — scaffolding TƯƠNG LAI, chưa có code thật
│
└── event/                        (kiến trúc listener → bus → router → workflow → core, [v11] HOÀN
    │                              TẤT cho toàn bộ 14 cụm — xem changelog/v11.md mục 2 + script-
    │                              load-order.md để biết thứ tự nạp bắt buộc)
    ├── bus.js                    — eventBus: register(name, router) / send(msg), NO-OP + console.warn
    │                              nếu router chưa đăng ký, KHÔNG throw
    ├── store.js                  — class EventStore: "state context" RIÊNG của từng router (khác
    │                              phạm vi với service/state.js — xem changelog/v11.md mục 3)
    ├── tab.js                    — 3 lifecycle listener KHÔNG qua bus (visibilitychange/pagehide/
    │                              beforeunload) — nạp CUỐI CÙNG trong toàn bộ /event/
    ├── listener/                 — 14 file, chỉ eventBus.send(msg), không chứa logic (119 listener)
    ├── router/                   — 14 file, tự eventBus.register() lúc nạp, quyết định gọi thẳng
    │                              core hay giao cho workflow
    └── workflow/                 — 6 file (chỉ 6/14 cụm cần — nghiệp vụ >1 hàm core hoặc có
                                   withLoadingShield/alertModal): settings-misc, playlist,
                                   visualizer-display, language-settings, subtitle-modal,
                                   visualizer-control-center
```

## Bảng 14 cụm `/event/` (ver 11)

Xem đầy đủ số liệu (số listener/cụm, có workflow hay không, đối chiếu `msg.type`) ở
[changelog/v11.md](./changelog/v11.md) mục 2 — không nhắc lại ở đây để tránh 2 nguồn dễ lệch nhau.

## Chú thích ★ (ver 1–10 + batch i18n, GIỮ NGUYÊN từ bản trước ver 11)

★ = ver 1, ★★ = ver 2, ★★★ = ver 3, ★★★★ = ver 4, ★★★★★ = ver 5, ★★★★★★ = ver 6, ★★★★★★★ = ver 7,
★★★★★★★★ = ver 8, ★★★★★★★★★ = ver 9, ★★★★★★★★★★ = ver 10 (bao gồm mini-fix), ★★★★★★★★★★★ = batch
i18n. Từ ver 11 trở đi dùng `[v11]` thay vì cộng thêm sao — xem đầu file.

> **Lưu ý quan trọng nhất của ver 11:** `js/` không còn tồn tại — mọi đường dẫn trong các file
> `readme/*.md` CŨ HƠN (viết trước ver 11) tham chiếu `js/core/...`/`js/components/...`/
> `js/playlist/...`/`js/visualizers/...` đều đã LỖI THỜI, chỉ còn giá trị lịch sử. Đường dẫn ĐÚNG
> hiện tại lấy từ cây thư mục ở trên.

← [Quay lại README](../README.md)
