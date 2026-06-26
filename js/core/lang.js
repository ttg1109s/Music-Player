/**
 * lang.js — Bộ điều phối đa ngôn ngữ (i18n) cho toàn bộ app.
 *
 * KIẾN TRÚC (đã chốt lại sau khi review batch đầu):
 *   - `en` (tiếng Anh) là NGÔN NGỮ GỐC/DEFAULT — nằm CỨNG trong RAM, ngay trong file này, dưới
 *     dạng 1 const object duy nhất (LANG_EN_KEYS). KHÔNG fetch, KHÔNG qua IndexedDB — luôn có sẵn
 *     ngay từ dòng đầu tiên app chạy, làm điểm tựa/fallback cuối cùng, và là NGUỒN KEY CHUẨN để
 *     validate mọi ngôn ngữ khác (diff: key thừa bị cắt, key thiếu lấy từ đây, value không phải
 *     string cũng coi là thiếu).
 *   - MỌI ngôn ngữ khác (kể cả tiếng Việt) đều là dữ liệu do NGƯỜI DÙNG TỰ UPLOAD (file .json) —
 *     project chạy qua `file://`, không tự fetch() được file tĩnh nào khác ngoài chính nó, nên
 *     không có ngôn ngữ "có sẵn cài cứng" nào khác ngoài en. File .json chuẩn (vd vi.json) sẽ được
 *     cung cấp qua 1 đường link tải riêng (README/changelog) — người dùng tự tải về rồi upload lại
 *     qua UI Settings, không tự động nạp.
 *   - Ngôn ngữ đã upload được lưu trong IndexedDB, store `languages` (xem db.js,
 *     getLanguagePack/setLanguagePack/deleteLanguagePack/getAllLanguageCodes) — key = mã ngôn ngữ
 *     lấy từ field `meta.code` trong chính file JSON, value = bản đã validate (đã cắt key thừa +
 *     bù key thiếu từ en + loại value không phải string). Upload lại CÙNG mã code đã có sẵn ->
 *     GHI ĐÈ (chèn lên) bản cũ, không tạo trùng.
 *
 * FILE JSON NGƯỜI DÙNG UPLOAD — cấu trúc bắt buộc:
 *   {
 *     "meta": { "code": "vi", "name": "Tiếng Việt" },
 *     "keys": { "playlistView.heading": "Bài hát", ... }
 *   }
 *   - meta.code: mã ngôn ngữ ngắn (vd "vi", "fr", "ja") — dùng làm key IndexedDB + dùng trong
 *     <select> chọn ngôn ngữ (batch UI chọn ngôn ngữ sẽ làm sau).
 *   - meta.name: tên hiển thị cho người dùng chọn (vd "Tiếng Việt").
 *   - keys: object phẳng "namespace.key" -> "chuỗi đã dịch". Namespace theo đúng tên biến TPL_*
 *     của file component/template chứa nó (bỏ "TPL_", camelCase) — xem LANG_EN_KEYS dưới đây để
 *     biết đầy đủ danh sách namespace + toàn bộ key chuẩn (đây chính là "đề bài" để dịch).
 *
 * VALIDATE LÚC NẠP (saveLanguagePack()) — ÁP DỤNG CHO MỌI FILE UPLOAD:
 *   1. Key có trong LANG_EN_KEYS nhưng KHÔNG có trong file upload, HOẶC có nhưng value không phải
 *      kiểu string -> lấy giá trị tương ứng từ LANG_EN_KEYS (coi như "thiếu").
 *   2. Key có trong file upload nhưng KHÔNG có trong LANG_EN_KEYS -> CẮT BỎ hẳn (không lưu — cho
 *      nhẹ data, tránh rác tích lũy qua nhiều phiên bản app).
 *   3. Kết quả sau validate luôn có ĐÚNG NGUYÊN VẸN bộ key giống LANG_EN_KEYS, không hơn không kém.
 *
 * Nạp NGAY SAU config.js, TRƯỚC mọi file components/core/playlist khác dùng hàm t()/tFormat().
 * PHẢI nạp SAU db.js nếu muốn dùng các hàm saveLanguagePack/applySavedLanguage/deleteLanguagePack
 * (cần getLanguagePack/setLanguagePack/deleteLanguagePack/getAllLanguageCodes) — nhưng t()/tFormat()
 * tự chạy được ngay cả khi gọi TRƯỚC db.js, vì 2 hàm đó chỉ đọc RAM (activeLangKeys), không đụng
 * IndexedDB.
 */

        /**
         * LANG_EN_KEYS — NGÔN NGỮ GỐC, NẰM CỨNG TRONG RAM. Đây là nguồn key chuẩn duy nhất của
         * toàn app — mọi ngôn ngữ khác được validate (diff) dựa trên chính object này.
         *
         * Namespace = tên biến TPL_* của file component/template chứa key đó, bỏ "TPL_" + camelCase
         * (vd TPL_SETTINGS_PLAYLIST_BG -> "settingsPlaylistBg"). Namespace "common" dành cho text
         * runtime rời rạc phát sinh ở core/*.js + playlist/*.js (alert, label dựng động...), không
         * gắn cố định với 1 template HTML cụ thể.
         */
        const LANG_EN_KEYS = {
            // ===================== COMMON (runtime rời rạc, core/* + playlist/*) =====================
            'common.unit.hour': 'h',
            'common.unit.minute': 'min',
            'common.unit.second': 'sec',
            'common.unknownArtist': 'Unknown artist',
            'common.untitled': '(Untitled)',
            'common.empty': '—',
            'common.unknownError': 'Unknown error',

            'common.listenTime.hourMinute': '{h}h {m}m',
            'common.listenTime.minuteSecond': '{m}m {s}s',
            'common.listenTime.secondOnly': '{s}s',
            'common.listenTime.zero': '0 sec',
            'common.durationLong.hourMinute': '{h}h {m}m',
            'common.durationLong.minuteOnly': '{m}m',

            'common.song.untitled': '(Untitled)',
            'common.song.unknownArtist': 'Unknown artist',

            'common.upload.failedList': 'Failed to load {n} file(s):\n\n{list}',
            'common.upload.shieldBusy': 'Another task is in progress, please wait and try adding music again.',
            'common.upload.genericError': 'An unexpected error occurred while loading music:\n\n{message}',
            'common.upload.folderEmpty': "Couldn't read any files from the selected folder. It may be empty, or the browser/device blocked folder access.",
            'common.upload.folderError': 'An error occurred while loading the music folder:\n\n{message}',
            'common.upload.fileError': 'An error occurred while loading the music file:\n\n{message}',
            'common.upload.loadingProgress': 'Loading {done} / {total}...',
            'common.upload.notFound': "Couldn't read this song, the data may have been deleted.",

            'common.playSong.error': 'Error playing this song:\n\n{message}',
            'common.playSong.notFound': "Couldn't read this song, the data may have been deleted.",
            'common.songEdit.notFound': "Couldn't read this song, the data may be corrupted.",
            'common.songEdit.defaultTitle': '(Untitled)',
            'common.songEdit.defaultArtist': 'Unknown artist',

            'common.subtitle.exportEmpty': 'No subtitles to export yet!',

            'common.export.notFound': "Couldn't read this song, the data may be corrupted.",
            'common.export.tagWriteFailed': "Couldn't write the tag to the file, exporting the original file instead.",

            'common.storage.zipLibMissing': 'The JSZip library failed to load (check your network connection to the CDN).',
            'common.storage.noSongsToDownload': 'No songs to download yet.',
            'common.storage.zipBuildError': "Couldn't build the zip file: {message}",
            'common.storage.zippingProgress': 'Packing zip file ({percent}%)...',
            'common.storage.zippingStart': 'Packing zip file (0%)...',
            'common.storage.deletingData': 'Deleting data...',
            'common.storage.downloadThenClearConfirm': 'Download all music as a zip file, then DELETE all SONGS from this device? (Background image/video is kept.) The delete action cannot be undone once the download finishes.',
            'common.storage.downloadThenClearDone': 'Zip file downloaded and all songs deleted. Background image/video is kept.',
            'common.storage.clearNoDownloadConfirm': 'Delete all SONGS saved on this device? (Background image/video is kept.) This action CANNOT be undone.',
            'common.storage.clearNoDownloadDone': 'All songs deleted. Background image/video is kept.',
            'common.storage.scanning': 'Scanning data...',
            'common.storage.scanningProgress': 'Scanning {n} / {total}...',
            'common.storage.scanNoneFound': 'No broken files found — all data is valid.',
            'common.storage.scanFoundCount': 'Found {n} problematic file(s):',
            'common.storage.scanReasonBrokenBlob': 'No file data (empty blob)',
            'common.storage.scanReasonBadMime': 'Not a valid mp3 format (MIME: "{mime}")',
            'common.storage.scanReasonBadMimeEmpty': '(empty)',
            'common.storage.scanReasonNoDecode': "Browser couldn't read/decode the audio content",
            'common.storage.scanReasonKeptFromError': 'Playback error — chose to "Keep" for later',
            'common.storage.deleteBrokenConfirm': 'Delete the {n} broken file(s) found? This cannot be undone.',
            'common.storage.deletingBroken': 'Deleting broken files...',
            'common.storage.deleteBrokenDone': 'Broken files deleted.',
            'common.playlist.cleaningUpPrevious': 'Cleaning up unfinished data from last session...',

            'common.loading.deleting': 'Deleting...',
            'common.loading.switchingSong': 'Switching song...',
            'common.loading.savingInfo': 'Saving info...',
            'common.loading.savingVideoBg': 'Saving background video...',
            'common.loading.savingImageBg': 'Saving background image...',
            'common.loading.exportingFile': 'Exporting file...',
            'common.loading.deletingVideoBg': 'Removing background video...',
            'common.loading.deletingImageBg': 'Removing background image...',
            'common.loading.generic': 'Processing...',

            'common.validate.unsupportedMime': 'Unsupported format ({mime}). Only {typeLabel} is accepted.',
            'common.validate.unsupportedMimeUnknown': 'unknown',
            'common.validate.unknownFormat': 'Could not determine the format of file "{filename}". Only {typeLabel} is accepted.',
            'common.validate.typeLabel.audio': 'music files (mp3, wav, ogg, m4a, aac, flac)',
            'common.validate.typeLabel.image': 'PNG, JPG, or WEBP images',
            'common.validate.typeLabel.video': 'MP4, WEBM, OGG, or MOV videos',

            'common.fatalError.alert': 'An unexpected error occurred ({context}). Please reload the page (F5).\n\nDetails: {message}',

            'common.appRecovery.restartTitle': 'Restart app',
            'common.appRecovery.restartBody': 'Restart the app? The player will reload from scratch. Your music, playlist, and saved settings will NOT be lost.',
            'common.appRecovery.restartConfirmBtn': 'Restart',
            'common.appRecovery.restoreDefaultsTitle': 'Restore default settings',
            'common.appRecovery.restoreDefaultsBody': 'Restore default settings? Colors, effects, EQ, and all other display customizations will return to their original defaults. Your uploaded music and playlist will NOT be deleted.',
            'common.appRecovery.restoreDefaultsConfirmBtn': 'Restore defaults',
            'common.cancel': 'Cancel',
            'common.btn.upload': 'Upload',

            'common.resumeModal.title': 'Resume playback?',
            'common.resumeModal.question': 'Do you want to resume playing <b>{title}</b>?',
            'common.resumeModal.btnNo': 'No',
            'common.resumeModal.btnResume': 'Resume',
            'common.resumeModal.btnRestart': 'Restart',

            // ===================== playlistView <- js/components/playlist-view.js =====================
            'playlistView.logo.title': 'Simple Audio Visualizer',
            'playlistView.btnReturnVisual.title': 'Now playing (return)',
            'playlistView.btnUploadAudio.title': 'Add music',
            'playlistView.btnSettings.title': 'Settings',
            'playlistView.heading': 'Songs',
            'playlistView.search.placeholder': 'Search songs, artists, albums...',
            'playlistView.search.clear.title': 'Clear search',
            'playlistView.btnPlay': 'Play',
            'playlistView.btnShuffleAll': 'Shuffle',
            'playlistView.empty.noSongs': 'No songs yet. Add some music to get started.',
            'playlistView.empty.noSearchResults': 'No matching songs found.',
            'playlistView.loading.generic': 'Loading data...',
            'playlistView.loading.withCount': 'Loading {done} / {total} songs...',
            'playlistView.songEdit.title': 'Edit song info',
            'playlistView.songEdit.tabInfo': 'Info',
            'playlistView.songEdit.tabCover': 'Cover',
            'playlistView.songEdit.fieldTitle': 'Title',
            'playlistView.songEdit.fieldArtist': 'Artist',
            'playlistView.songEdit.fieldAlbum': 'Album',
            'playlistView.songEdit.coverAlt': 'Cover art',
            'playlistView.songEdit.coverChoose': 'Choose image',
            'playlistView.songEdit.coverRemove': 'Remove cover',
            'playlistView.songEdit.coverHint': 'Accepts PNG, JPG or WEBP. The image is stored with the song in IndexedDB and written to the APIC tag on export.',
            'playlistView.songEdit.btnCancel': 'Cancel',
            'playlistView.songEdit.btnSave': 'Save',
            'playlistView.songInfo.title': 'Song info',
            'playlistView.songInfo.fieldTitle': 'Title',
            'playlistView.songInfo.fieldArtist': 'Artist',
            'playlistView.songInfo.fieldAlbum': 'Album',
            'playlistView.songInfo.fieldDuration': 'Duration',
            'playlistView.songInfo.fieldPlayCount': 'Play count',
            'playlistView.songInfo.fieldPlayCountValue': '{n} times',
            'playlistView.songInfo.fieldListened': 'Listened',
            'playlistView.songInfo.btnExport': 'Export file',
            'playlistView.songInfo.btnClose': 'Close',
            'playlistView.songInfo.empty': '—',
            'playlistView.uploadMenu.pickFiles': 'Choose music files',
            'playlistView.uploadMenu.pickFolder': 'Choose a folder',
            'playlistView.songMenu.title': 'Options',
            'playlistView.songMenu.info': 'Info',
            'playlistView.songMenu.edit': 'Edit info',
            'playlistView.songMenu.export': 'Export file',
            'playlistView.songMenu.delete': 'Delete song',
            'playlistView.playbackError.title': "Can't play this song",
            'playlistView.playbackError.body': 'The file data may be corrupted or in an unsupported format. Keep it for later (in Storage Management) or delete it now?',
            'playlistView.playbackError.btnKeep': 'Keep',
            'playlistView.playbackError.btnDelete': 'Delete now',

            // ===================== visualizerOverlay <- js/components/visualizer-overlay.js =====================
            'visualizerOverlay.btnBackPlaylist.title': 'Back to list',
            'visualizerOverlay.btnControlCenter.title': 'Quick controls',
            'visualizerOverlay.cycleMode.title': 'Change effect',
            'visualizerOverlay.cycleMode.label': 'Effect',
            'visualizerOverlay.subtitle.title': 'Subtitles',
            'visualizerOverlay.subtitle.label': 'Subtitles',
            'visualizerOverlay.settings.title': 'Settings',
            'visualizerOverlay.settings.label': 'Settings',
            'visualizerOverlay.shuffle.title': 'Shuffle',
            'visualizerOverlay.shuffle.label': 'Shuffle',
            'visualizerOverlay.repeat.title': 'Repeat',
            'visualizerOverlay.repeat.label': 'Repeat',
            'visualizerOverlay.statsToggle.title': 'Show/hide BPM-Pitch-Energy',
            'visualizerOverlay.statsToggle.label': 'Stats',

            // ===================== subtitleModal <- js/components/subtitle-modal.js =====================
            'subtitleModal.title': 'Manage Subtitles',
            'subtitleModal.btnClose': 'Close',
            'subtitleModal.btnUpload.title': 'Upload a (.srt) file',
            'subtitleModal.btnAutoTiming.title': 'Auto Timing',
            'subtitleModal.btnAddSub.title': 'Add subtitle line',
            'subtitleModal.btnApplySub.title': 'Apply & replay',
            'subtitleModal.listHeading': 'Lines:',
            'subtitleModal.btnExportSrt': 'Export .SRT file',
            'subtitleModal.listEmpty': 'No subtitles yet',
            'subtitleModal.editor.placeholder': 'Enter subtitle text...',
            'subtitleModal.editor.btnSave': 'Save',
            'subtitleModal.editor.btnDelete': 'Delete',
            'subtitleModal.newLine.defaultText': 'New subtitle line...',
            'subtitleModal.autoTiming.defaultText': '(Enter text...)',

            // ===================== bottomPlayer <- js/components/bottom-player.js =====================
            'bottomPlayer.noSongSelected': 'No song selected',
            'bottomPlayer.btnPrev.title': 'Previous',
            'bottomPlayer.btnNext.title': 'Next',

            // ===================== settingsDrawer <- js/components/settings-drawer.js =====================
            'settingsDrawer.title': 'System Settings',

            // ===================== settingsPlaylistBg <- js/components/settings/playlist-background.js =====================
            'settingsPlaylistBg.sectionTitle': 'Playlist & Background',
            'settingsPlaylistBg.viewMode.label': 'View',
            'settingsPlaylistBg.viewMode.list': 'List',
            'settingsPlaylistBg.viewMode.grid': 'Grid',
            'settingsPlaylistBg.sortMode.label': 'Sort',
            'settingsPlaylistBg.sortMode.default': 'Default (recently added)',
            'settingsPlaylistBg.sortMode.az': 'Name A → Z',
            'settingsPlaylistBg.sortMode.za': 'Name Z → A',
            'settingsPlaylistBg.videoEnable.label': 'Use Video Background',
            'settingsPlaylistBg.videoEnable.hint': 'Replace any background with a video',
            'settingsPlaylistBg.videoEnable.choose': 'Choose video',
            'settingsPlaylistBg.bgImage.label': 'Playlist background image',
            'settingsPlaylistBg.bgImage.choose': 'Change image',
            'settingsPlaylistBg.bgImageEnable.label': 'Use playlist background image',
            'settingsPlaylistBg.bgBlur.label': 'Background blur',

            // ===================== settingsVisualizer <- js/components/settings/visualizer-geometry-color.js =====================
            'settingsVisualizer.sectionTitle': 'Visualizer',
            'settingsVisualizer.type.label': 'Effect type',
            'settingsVisualizer.type.bar': 'Bar',
            'settingsVisualizer.type.lightning': 'Lightning',
            'settingsVisualizer.type.rubik': 'Rubik',
            'settingsVisualizer.type.vortex': 'Vortex (Tunnel)',
            'settingsVisualizer.type.blackHole': 'Black Hole',
            'settingsVisualizer.type.rain': 'Rain',
            'settingsVisualizer.openDrawer.label': 'Customize Visualizer',
            'settingsVisualizer.openDrawer.hint': 'Render quality, per-effect geometry, colors, auto-switch effect',
            'settingsVisualizer.visualEnable.label': 'Show visual',
            'settingsVisualizer.visualEnable.hint': 'Turn off to show only the background (video/image/color), hiding the visualizer effect without touching Video Background.',

            // ===================== settingsAudioEq <- js/components/settings/audio-eq.js =====================
            'settingsAudioEq.sectionTitle': 'Audio & Equalizer',
            'settingsAudioEq.volume.label': 'Master volume',
            'settingsAudioEq.mode.label': 'Equalizer mode',
            'settingsAudioEq.mode.flat': 'Default (Flat)',
            'settingsAudioEq.mode.bassBoost': 'Bass boost',
            'settingsAudioEq.mode.pop': 'Pop',
            'settingsAudioEq.mode.rock': 'Rock',
            'settingsAudioEq.mode.acoustic': 'Acoustic',
            'settingsAudioEq.mode.electronic': 'Electronic (EDM)',
            'settingsAudioEq.mode.manual': 'Manual',
            'settingsAudioEq.manualHeading': 'Frequency bands (Hz)',

            // ===================== settingsSubtitleStyle <- js/components/settings/subtitle-style.js =====================
            'settingsSubtitleStyle.sectionTitle': 'Subtitles',
            'settingsSubtitleStyle.enable.label': 'Show subtitles',
            'settingsSubtitleStyle.enable.hint': "Turn off to hide the subtitle box during playback, without deleting what you've written.",
            'settingsSubtitleStyle.openDrawer.label': 'Customize',
            'settingsSubtitleStyle.openDrawer.hint': 'Box background/border color, text color, font size, line/letter spacing',

            // ===================== settingsMisc <- js/components/settings/misc.js =====================
            'settingsMisc.sectionTitle': 'Other',
            'settingsMisc.keepScreenOn.label': 'Keep screen on',
            'settingsMisc.keepScreenOn.hint': 'Prevents the screen from turning off during playback. Turn off to save battery (music still tries to keep playing in the background).',
            'settingsMisc.openAbout.label': 'About the player',
            'settingsMisc.troubleshootTitle': 'Troubleshooting',
            'settingsMisc.restartApp.label': 'Restart app',
            'settingsMisc.restartApp.hint': 'Use this if the player freezes, gets stuck, or behaves abnormally. Does not affect saved music/playlist/settings.',
            'settingsMisc.restoreDefaults.label': 'Restore default settings',
            'settingsMisc.restoreDefaults.hint': 'Resets colors, effects, EQ, and other display customizations to defaults. Does NOT delete uploaded music/playlist.',

            // ===================== visualizerSettingsDrawer <- js/components/visualizer-settings-drawer.js =====================
            'visualizerSettingsDrawer.backToSettings.title': 'Back to Settings',
            'visualizerSettingsDrawer.title': 'Customize Visualizer',
            'visualizerSettingsDrawer.geometrySectionTitle': 'Visualizer geometry',
            'visualizerSettingsDrawer.quality.label': 'Render quality',
            'visualizerSettingsDrawer.quality.high': 'High (smooth)',
            'visualizerSettingsDrawer.quality.medium': 'Medium',
            'visualizerSettingsDrawer.quality.low': 'Low (lightweight)',
            'visualizerSettingsDrawer.maxHeight.label': 'Max height',
            'visualizerSettingsDrawer.barWidth.label': 'Bar thickness (px)',
            'visualizerSettingsDrawer.vortexStyle.label': 'Vortex tunnel style',
            'visualizerSettingsDrawer.vortexStyle.rings': 'Light rings',
            'visualizerSettingsDrawer.vortexStyle.bars': '3D bar segments (Equalizer)',
            'visualizerSettingsDrawer.vortexStyle.wave': 'Wave noise (fade)',
            'visualizerSettingsDrawer.barStyle.label': 'Bar style',
            'visualizerSettingsDrawer.barStyle.mirror': 'Mirror (butterfly)',
            'visualizerSettingsDrawer.barStyle.cascade': 'Cascade',
            'visualizerSettingsDrawer.mirrorCount.label': 'Number of bars (per side)',
            'visualizerSettingsDrawer.rainStyle.label': 'Rain effect style',
            'visualizerSettingsDrawer.rainStyle.glass': 'Drips on glass',
            'visualizerSettingsDrawer.rainStyle.street': 'Street & park rain',
            'visualizerSettingsDrawer.glassFlash.label': 'Flash (glass & street lights)',
            'visualizerSettingsDrawer.colorSectionTitle': 'Visualizer colors',
            'visualizerSettingsDrawer.bgColor.label': 'Black background color',
            'visualizerSettingsDrawer.colorMode.label': 'Waveform color mode',
            'visualizerSettingsDrawer.colorMode.solid': 'Solid color',
            'visualizerSettingsDrawer.colorMode.dynamic': '2-color blend',
            'visualizerSettingsDrawer.colorMode.gradient': 'Music-driven gradient',
            'visualizerSettingsDrawer.solidColor.label': 'Choose a solid color',
            'visualizerSettingsDrawer.dynamicColor.label': 'Choose 2 blend colors',
            'visualizerSettingsDrawer.autoSwitchSectionTitle': 'Auto-switch effect',
            'visualizerSettingsDrawer.autoSwitchEnable.label': 'Enable auto-switch',
            'visualizerSettingsDrawer.autoSwitchEnable.hint': 'Automatically switches to a different effect after a set interval, no manual taps needed. While enabled, the "Change effect" button in the Visualizer Control Center is temporarily locked (to avoid conflicting with manual switching).',
            'visualizerSettingsDrawer.autoSwitchMode.label': 'Switch order',
            'visualizerSettingsDrawer.autoSwitchMode.sequential': 'Sequential',
            'visualizerSettingsDrawer.autoSwitchMode.random': 'Random',
            'visualizerSettingsDrawer.autoSwitchTimeMode.label': 'Switch timing',
            'visualizerSettingsDrawer.autoSwitchTimeMode.fixed': 'Fixed',
            'visualizerSettingsDrawer.autoSwitchTimeMode.random': 'Random within a range',
            'visualizerSettingsDrawer.autoSwitchTimeMode.duration': 'Based on song length',
            'visualizerSettingsDrawer.autoSwitchFixed.label': 'Switch every (seconds), minimum 10s',
            'visualizerSettingsDrawer.autoSwitchRandom.label': 'Random from 10s up to (seconds)',
            'visualizerSettingsDrawer.autoSwitchDuration.label': 'Divide song length by (minimum 10s)',
            'visualizerSettingsDrawer.autoSwitchDuration.hint': 'Time between switches = song length / the number entered, recalculated for each song. The system caps this at half the song length, ensuring at least one switch happens during playback. Seeking forward/back still remembers the correct effect for each segment.',

            // ===================== subtitleSettingsDrawer <- js/components/subtitle-settings-drawer.js =====================
            'subtitleSettingsDrawer.backToSettings.title': 'Back to Settings',
            'subtitleSettingsDrawer.title': 'Customize Subtitles',
            'subtitleSettingsDrawer.sectionTitle': 'Subtitle box & text',
            'subtitleSettingsDrawer.bgColor.label': 'Box background color',
            'subtitleSettingsDrawer.bgOpacity.label': 'Background opacity',
            'subtitleSettingsDrawer.borderColor.label': 'Box border color',
            'subtitleSettingsDrawer.borderOpacity.label': 'Border opacity',
            'subtitleSettingsDrawer.borderWidth.label': 'Border thickness (px)',
            'subtitleSettingsDrawer.borderRadius.label': 'Box corner radius (px)',
            'subtitleSettingsDrawer.textColor.label': 'Subtitle text color',
            'subtitleSettingsDrawer.fontSize.label': 'Font size (px)',
            'subtitleSettingsDrawer.lineHeight.label': 'Line height',
            'subtitleSettingsDrawer.letterSpacing.label': 'Letter spacing (px)',

            // ===================== aboutDrawer <- js/components/about-drawer.js =====================
            'aboutDrawer.backToSettings.title': 'Back to Settings',
            'aboutDrawer.title': 'About the player',
            'aboutDrawer.statsSectionTitle': 'Statistics',
            'aboutDrawer.statTotalSongs': 'Total songs',
            'aboutDrawer.statTotalDuration': 'Total song length',
            'aboutDrawer.statListenSeconds': 'Total listening time',
            'aboutDrawer.storageSectionTitle': 'Storage',
            'aboutDrawer.openStorage.label': 'Storage Management',
            'aboutDrawer.openStorage.hint': 'Storage used, free up space, clean up broken files',
            'aboutDrawer.introSectionTitle': 'About',
            'aboutDrawer.introBody': 'This music player & visualizer runs entirely in your browser (client-side): there is no server, and none of your files are uploaded anywhere. All music, cover art, subtitles, and background images/videos are stored locally on your device.',
            'aboutDrawer.warningSectionTitle': 'About stored data',
            'aboutDrawer.warning.deviceBound': 'Data is tied to <strong class="text-amber-300">this specific browser + device</strong> — it does not sync across other devices or browsers.',
            'aboutDrawer.warning.osCleanup': "The operating system may automatically clear data when the device is low on storage, especially on mobile. iOS Safari has its own data-clearing policy if the page hasn't been added to the Home Screen.",
            'aboutDrawer.warning.offline': '<strong class="text-amber-300">About offline use:</strong> saved data does NOT disappear when offline. The real issue is that without an internet connection to reload the page from scratch, there\'s no way to open the app and access that data. The player doesn\'t use a Service Worker yet (to keep development speed up), so this risk still exists — you should be aware of it.',
            'aboutDrawer.warning.recommendation': '<strong class="text-amber-300">Recommendation:</strong> keep your original mp3 files elsewhere too (Google Drive, your computer...). Treat this as a convenient cache, not your primary storage.',

            // ===================== storageDrawer <- js/components/storage-drawer.js =====================
            'storageDrawer.backToAbout.title': 'Back to About',
            'storageDrawer.title': 'Storage Management',
            'storageDrawer.statsSectionTitle': 'Statistics',
            'storageDrawer.statTotalSongs': 'Total songs',
            'storageDrawer.statTotalBytes': 'Storage used',
            'storageDrawer.freeSpaceSectionTitle': 'Free up storage',
            'storageDrawer.downloadThenClear.label': 'Download all files (.zip) then delete',
            'storageDrawer.downloadThenClear.hint': 'Packs all original music into one zip file to download, then deletes everything from this device',
            'storageDrawer.clearNoDownload.label': 'Delete everything, no download',
            'storageDrawer.clearNoDownload.hint': 'Deletes all saved songs (background image/video is kept) — CANNOT be undone',
            'storageDrawer.brokenSectionTitle': 'Corrupted data',
            'storageDrawer.scanBroken.label': 'Scan & clean broken files',
            'storageDrawer.scanBroken.hint': "Finds songs whose data isn't a valid mp3 or can't be played, asks before deleting",
            'storageDrawer.btnDeleteBroken': 'Delete these broken files',
            'storageDrawer.btnDismissScan': 'Dismiss',

            // ===================== loadingShield <- js/components/loading-shield.js =====================
            'loadingShield.text': 'Processing...',

            // ===================== settingsLanguage <- js/components/settings/language.js (mới) =====================
            'settingsLanguage.sectionTitle': 'Language',
            'settingsLanguage.select.label': 'Display language',
            'settingsLanguage.upload.label': 'Upload a new language (.json)',
            'settingsLanguage.delete.label': 'Delete this language',
            'settingsLanguage.delete.confirm': 'Delete language "{name}"? After deleting, the app will switch back to English.',
            'settingsLanguage.upload.invalidFile': 'Invalid language file: missing "meta.code" or malformed JSON.',
            'settingsLanguage.upload.success': 'Added language "{name}" and applied it.',
            'settingsLanguage.upload.parseError': "Couldn't read this JSON file:\n\n{message}",
            'settingsLanguage.cannotDeleteEnglish': 'English (the original language) is always available and cannot be deleted.',
        };

        /**
         * ENGINE I18N — tối giản, không phụ thuộc framework.
         *
         * currentLangCode: mã ngôn ngữ đang active. 'en' nghĩa là đang dùng LANG_EN_KEYS trực tiếp
         * (không qua IndexedDB). Mã khác ('vi', 'fr'...) nghĩa là activeLangKeys đã được nạp từ
         * IndexedDB qua applySavedLanguage().
         *
         * activeLangKeys: object key->value đang dùng để tra cứu. Khởi tạo = LANG_EN_KEYS ngay tại
         * đây (không đợi DOMContentLoaded/IndexedDB) vì nhiều file template (TPL_*) gọi t() ngay
         * lúc parse (template literal cấp module, chạy trước DOMContentLoaded).
         */
        let currentLangCode = 'en';
        let activeLangKeys = LANG_EN_KEYS;

        /**
         * t(key, fallback?) — tra cứu giá trị đã dịch theo currentLangCode hiện tại.
         * Không tìm thấy key trong ngôn ngữ active -> fallback về LANG_EN_KEYS (nguồn chuẩn luôn
         * đầy đủ) -> fallback cuối cùng là chính `key` truyền vào (hoặc `fallback` nếu có cung
         * cấp) để không bao giờ hiện "undefined" ra UI dù thiếu key nào.
         */
        function t(key, fallback) {
            if (activeLangKeys && Object.prototype.hasOwnProperty.call(activeLangKeys, key)) return activeLangKeys[key];
            if (Object.prototype.hasOwnProperty.call(LANG_EN_KEYS, key)) return LANG_EN_KEYS[key];
            return fallback !== undefined ? fallback : key;
        }

        /**
         * tFormat(key, vars) — như t(), nhưng thay thế placeholder kiểu "{name}" bằng giá trị
         * tương ứng trong object `vars`. Ví dụ: tFormat('common.upload.loadingProgress', {done: 1, total: 5})
         * -> "Loading 1 / 5..." (en) hoặc bản dịch tương ứng của ngôn ngữ active.
         */
        function tFormat(key, vars) {
            let str = t(key);
            if (vars) {
                for (const k of Object.keys(vars)) {
                    str = str.split('{' + k + '}').join(vars[k]);
                }
            }
            return str;
        }

        /**
         * validateLanguagePack(rawKeys) — đối chiếu object key->value thô (vd parse từ file JSON
         * người dùng upload) với LANG_EN_KEYS (nguồn chuẩn), trả về 1 object MỚI ĐÃ VALIDATE:
         *   - Key có trong LANG_EN_KEYS nhưng rawKeys thiếu, HOẶC rawKeys có nhưng value không
         *     phải string -> lấy giá trị từ LANG_EN_KEYS.
         *   - Key có trong rawKeys nhưng KHÔNG có trong LANG_EN_KEYS -> bị cắt bỏ hẳn, không đưa
         *     vào kết quả.
         * Kết quả luôn có ĐÚNG NGUYÊN VẸN bộ key giống LANG_EN_KEYS, không hơn không kém.
         */
        function validateLanguagePack(rawKeys) {
            const safeRaw = (rawKeys && typeof rawKeys === 'object') ? rawKeys : {};
            const result = {};
            for (const key of Object.keys(LANG_EN_KEYS)) {
                const val = safeRaw[key];
                result[key] = (typeof val === 'string') ? val : LANG_EN_KEYS[key];
            }
            return result;
        }

        /**
         * saveLanguagePack(parsedJson) — nhận object đã JSON.parse() từ file người dùng upload,
         * kiểm tra cấu trúc bắt buộc (meta.code dạng string non-empty), validate toàn bộ `keys`
         * qua validateLanguagePack(), rồi lưu vào IndexedDB store `languages` (key = meta.code —
         * upload lại cùng mã sẽ GHI ĐÈ bản cũ, không tạo trùng).
         *
         * Trả về Promise<{ok: true, code, name}> nếu thành công, hoặc Promise<{ok: false, reason}>
         * nếu cấu trúc file không hợp lệ (thiếu meta.code, hoặc meta.code rỗng/không phải string).
         * KHÔNG tự áp dụng ngôn ngữ vừa lưu — gọi applySavedLanguage(code) riêng nếu muốn dùng ngay.
         */
        async function saveLanguagePack(parsedJson) {
            const meta = parsedJson && parsedJson.meta;
            const code = meta && typeof meta.code === 'string' ? meta.code.trim() : '';
            if (!code) return { ok: false, reason: 'invalid_meta_code' };
            const name = (meta && typeof meta.name === 'string' && meta.name.trim()) ? meta.name.trim() : code;
            const validatedKeys = validateLanguagePack(parsedJson && parsedJson.keys);
            const pack = { meta: { code, name }, keys: validatedKeys };
            await setLanguagePack(code, pack);
            return { ok: true, code, name };
        }

        /**
         * applySavedLanguage(code) — đổi ngôn ngữ active sang 1 mã đã có trong IndexedDB (hoặc
         * 'en' để quay về default cứng trong RAM, không cần đọc IndexedDB).
         * Trả về true nếu áp dụng thành công, false nếu code='en' (luôn thành công thật ra, xem
         * dưới) hoặc không tìm thấy record tương ứng trong IndexedDB (giữ nguyên ngôn ngữ hiện tại).
         * KHÔNG tự gọi applyLanguageToDom() — nơi gọi (UI chọn ngôn ngữ, batch sau) tự gọi nối tiếp
         * nếu cần cập nhật DOM ngay không reload.
         */
        async function applySavedLanguage(code) {
            if (code === 'en') {
                currentLangCode = 'en';
                activeLangKeys = LANG_EN_KEYS;
                return true;
            }
            const pack = await getLanguagePack(code);
            if (!pack || !pack.keys) return false;
            currentLangCode = code;
            activeLangKeys = pack.keys;
            return true;
        }

        /** deleteLanguagePack đã có sẵn ở db.js (xoá thẳng record IndexedDB theo mã) — KHÔNG định
         * nghĩa lại ở đây để tránh trùng tên. Nơi gọi (UI chọn ngôn ngữ) tự quyết định gọi
         * applySavedLanguage('en') SAU KHI xoá nếu ngôn ngữ đang active chính là mã vừa bị xoá. */

        /**
         * listAvailableLanguages() — liệt kê toàn bộ ngôn ngữ có thể chọn: luôn có 'en' (cứng RAM,
         * đứng đầu danh sách) + mọi mã đã lưu trong IndexedDB. Trả về mảng [{code, name}, ...].
         */
        async function listAvailableLanguages() {
            const result = [{ code: 'en', name: 'English' }];
            const codes = await getAllLanguageCodes();
            for (const code of codes) {
                const pack = await getLanguagePack(code);
                if (pack && pack.meta) result.push({ code: pack.meta.code || code, name: pack.meta.name || code });
            }
            return result;
        }

        /**
         * applyLanguageToDom() — quét toàn bộ DOM hiện tại, áp lại bản dịch cho mọi phần tử có
         * đánh dấu data-i18n (text node), data-i18n-title (thuộc tính title), data-i18n-placeholder
         * (thuộc tính placeholder). Gọi sau applySavedLanguage() để cập nhật UI đã render mà không
         * cần reload trang (batch UI chọn ngôn ngữ sau sẽ dùng hàm này).
         */
        function applyLanguageToDom() {
            document.querySelectorAll('[data-i18n]').forEach((el) => {
                el.textContent = t(el.getAttribute('data-i18n'));
            });
            document.querySelectorAll('[data-i18n-title]').forEach((el) => {
                el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
                el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
            });
        }
