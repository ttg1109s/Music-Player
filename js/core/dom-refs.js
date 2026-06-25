/**
 * Tham chiếu các phần tử DOM (getElementById) + toàn bộ biến trạng thái runtime toàn cục (audio, hiệu ứng, rubik, mưa phố, vortex...).
 * QUAN TRỌNG: phải nạp SAU KHI các component HTML (playlist-view, settings-drawer, ...) đã được chèn vào DOM, nếu không getElementById sẽ trả về null.
 * (Trích từ file gốc, dòng 26-99 trong khối <script>)
 */
        let isGridView = false;

        const fileInput = document.getElementById('audio-upload'), audioPlayer = document.getElementById('audio-player');
        // Input "Chọn cả thư mục" (ver 8 refine) — cùng xử lý chung qua handleAudioFiles() ở
        // playlist/loader.js, chỉ khác cách mở hộp thoại (webkitdirectory). Nút "Thêm nhạc" giờ mở
        // 1 menu nhỏ (#upload-action-menu) cho người dùng chọn 1 trong 2 input này.
        const folderInput = document.getElementById('audio-upload-folder');
        const btnUploadAudio = document.getElementById('btn-upload-audio'), uploadActionMenu = document.getElementById('upload-action-menu');
        const canvas = document.getElementById('visualizer'), ctx = canvas.getContext('2d');
        const playlistView = document.getElementById('playlist-view'), visualizerUI = document.getElementById('visualizer-ui'), playerContainer = document.getElementById('player-container');
        const playlistBg = document.getElementById('playlist-bg');
        const playlistEmpty = document.getElementById('playlist-empty'), playlistContainer = document.getElementById('playlist-container');
        const btnBackPlaylist = document.getElementById('btn-back-playlist'), loadingShield = document.getElementById('loading-shield'), loadingText = document.getElementById('loading-text');
        const btnReturnVisual = document.getElementById('btn-return-visual');
        
        const playPauseBtn = document.getElementById('play-pause-btn'), iconPlay = document.getElementById('icon-play'), iconPause = document.getElementById('icon-pause');
        const btnPrev = document.getElementById('btn-prev'), btnNext = document.getElementById('btn-next');
        const btnShuffle = document.getElementById('btn-shuffle'), btnRepeat = document.getElementById('btn-repeat'), repeatBadge = document.getElementById('repeat-badge');
        const progressBar = document.getElementById('progress-bar');
        const currentTimeDisplay = document.getElementById('current-time'), durationTimeDisplay = document.getElementById('duration-time');
        const playerTitle = document.getElementById('player-title'), playerArtist = document.getElementById('player-artist');
        const recordArt = document.getElementById('record-art'), recordContainer = document.getElementById('record-container');
        const statBpm = document.getElementById('stat-bpm'), statNote = document.getElementById('stat-note'), statEnergy = document.getElementById('stat-energy');
        
        const drawerSettings = document.getElementById('drawer-settings'), btnSettings = document.getElementById('btn-settings'), btnSettingsPlaylist = document.getElementById('btn-settings-playlist'), closeDrawer = document.getElementById('close-drawer');
        // Logo "SAV" góc trái Playlist (đối xứng với cụm icon góc phải) — hiệu ứng trượt chữ khi
        // hover/unhover xử lý THUẦN BẰNG CSS (transition max-width ở chính class trong HTML, xem
        // playlist-view.js), không cần xử lý JS nào ở đây. Khai báo ref dù không dùng trực tiếp,
        // để nhất quán với quy ước "mọi #id quan trọng đều có ref ở dom-refs.js" của project.
        const savLogo = document.getElementById('sav-logo');
        const btnToggleView = document.getElementById('btn-toggle-view'), iconGridView = document.getElementById('icon-grid-view'), iconListView = document.getElementById('icon-list-view');
        const btnCycleMode = document.getElementById('btn-cycle-mode'), modeBadge = document.getElementById('mode-badge');
        const qualitySelect = document.getElementById('setting-quality'), bgColorPicker = document.getElementById('bg-color-picker');
        const bgUploadInput = document.getElementById('setting-bg-upload'), bgBlurSlider = document.getElementById('setting-bg-blur'), valBgBlurDisplay = document.getElementById('val-bg-blur');
        const bgImageEnableToggle = document.getElementById('setting-bg-image-enable');
        const colorModeSelect = document.getElementById('setting-color-mode'), solidColorContainer = document.getElementById('solid-color-container'), solidColorPicker = document.getElementById('solid-color-picker'), solidColorText = document.getElementById('solid-color-text');
        const dynColorContainer = document.getElementById('dynamic-color-container'), dynColorA = document.getElementById('dyn-color-a'), dynColorB = document.getElementById('dyn-color-b');
        const maxHeightSlider = document.getElementById('setting-max-height'), barWidthSlider = document.getElementById('setting-bar-width'), valMaxDisplay = document.getElementById('val-max'), valWidthDisplay = document.getElementById('val-width');
        const blockMaxHeight = document.getElementById('block-max-height'), blockBarWidth = document.getElementById('block-bar-width');
        const blockVortex = document.getElementById('block-vortex'), vortexStyleSelect = document.getElementById('setting-vortex-style');
        const blockRain = document.getElementById('block-rain'), rainStyleSelect = document.getElementById('setting-rain-style'), glassFlashToggle = document.getElementById('setting-glass-flash');
        const blockBarStyle = document.getElementById('block-bar-style'), barStyleSelect = document.getElementById('setting-bar-style');
        const barMirrorOptions = document.getElementById('bar-mirror-options');
        const mirrorCountSlider = document.getElementById('setting-mirror-count'), valMirrorCountDisplay = document.getElementById('val-mirror-count');
        
        const volumeSlider = document.getElementById('setting-volume'), valVolumeDisplay = document.getElementById('val-volume');
        const eqSelect = document.getElementById('setting-eq'), eqSlidersWrapper = document.getElementById('eq-sliders-wrapper');

        const videoEnableToggle = document.getElementById('setting-video-enable'), videoUploadInput = document.getElementById('setting-video-upload'), bgVideoElement = document.getElementById('bg-video');
        // "Tắt Visual" (ver 8 refine) — ĐỘC LẬP khỏi nhóm Video Background, đặt thành mục cài đặt
        // riêng (xem js/components/settings/playlist-background.js). id mới `setting-visual-enable`.
        const visualEnabledToggle = document.getElementById('setting-visual-enable');
        const keepScreenOnToggle = document.getElementById('setting-keep-screen-on');

        const btnSubtitle = document.getElementById('btn-subtitle'), subToggleBadge = document.getElementById('sub-toggle-badge');
        const subtitleModal = document.getElementById('subtitle-modal'), btnCloseSubModal = document.getElementById('btn-close-sub-modal');
        const srtUpload = document.getElementById('srt-upload'), btnApplySub = document.getElementById('btn-apply-sub');
        const btnAddSub = document.getElementById('btn-add-sub'), btnExportSrt = document.getElementById('btn-export-srt');
        const subtitleDisplay = document.getElementById('subtitle-display'), subtitleFrame = document.getElementById('subtitle-frame'), subActiveLines = document.getElementById('sub-active-lines');
        const subListContainer = document.getElementById('sub-list-container'), subEmptyState = document.getElementById('sub-empty-state');
        const btnAutoTiming = document.getElementById('btn-auto-timing');
        const iconAutoTimingIdle = document.getElementById('icon-auto-timing-idle'), iconAutoTimingRecording = document.getElementById('icon-auto-timing-recording');
        let autoSubStartTime = null;

        // Toggle "Hiện phụ đề" (ver 8 refine) — chuyển từ #btn-toggle-sub trong modal sub về đây,
        // lưu vào vizConfig.subtitlesEnabled (xem equalizer-settings.js).
        const settingSubtitlesEnabled = document.getElementById('setting-subtitles-enabled');
        const settingSubBgColor = document.getElementById('setting-sub-bg-color'), settingSubBgOpacity = document.getElementById('setting-sub-bg-opacity'), valSubBgOpacity = document.getElementById('val-sub-bg-opacity');
        const settingSubBorderColor = document.getElementById('setting-sub-border-color'), settingSubBorderOpacity = document.getElementById('setting-sub-border-opacity'), valSubBorderOpacity = document.getElementById('val-sub-border-opacity');
        const settingSubBorderWidth = document.getElementById('setting-sub-border-width'), valSubBorderWidth = document.getElementById('val-sub-border-width');
        const settingSubBorderRadius = document.getElementById('setting-sub-border-radius'), valSubBorderRadius = document.getElementById('val-sub-border-radius');
        const settingSubTextColor = document.getElementById('setting-sub-text-color');
        const settingSubFontSize = document.getElementById('setting-sub-font-size'), valSubFontSize = document.getElementById('val-sub-font-size');
        const settingSubLineHeight = document.getElementById('setting-sub-line-height'), valSubLineHeight = document.getElementById('val-sub-line-height');
        const settingSubLetterSpacing = document.getElementById('setting-sub-letter-spacing'), valSubLetterSpacing = document.getElementById('val-sub-letter-spacing');

        let audioContext, analyser, analyserPitch, source, animationId;
        let masterGainNode; let eqBandNodes = []; 
        let isSeeking = false, dpr = 1, currentObjectURL = null, currentCoverObjectURL = null, frameCounter = 0; 
        let smoothedBeatRadius = 0, smoothedEnergy = 0, globalHueOffset = 0, smoothedPitchY = 0, beatScale = 0;
        let vizDataArray, pitchTimeDomainArray, previousSpectrumArray;
        let beatTimes = [], lastBeatTime = 0, fluxHistory = [], runningFluxMean = 0;

        let currentModeIndex = 0; 
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        let stars = [], tunnelAngle = 0;
        let starFlashes = []; 
        let rubikCubes = [], rubikRotX = 0, rubikRotY = 0, rubikAnim = { active: false, axis: 'x', layer: 0, angle: 0, dir: 1 };
        // Xoay TỰ THÂN của khối Rubik theo pitch (nốt nhạc):
        //   - rubikPitchHistory/rubikPitchAvg: nốt MIDI trung bình động gần đây, dùng làm "pha"
        //     tham chiếu — nốt hiện tại thấp hơn pha thì xoay chậm lại, cao hơn thì xoay nhanh lên.
        //   - rubikSelfSpinDirX/Y: hướng xoay tự thân (1 hoặc -1) của mỗi trục, chọn ngẫu nhiên một
        //     lần khi khởi động rồi giữ cố định (chỉ tốc độ đổi theo nhạc, hướng không đảo liên tục).
        let rubikPitchHistory = [], rubikPitchAvg = 0;
        let rubikSelfSpinDirX = Math.random() > 0.5 ? 1 : -1, rubikSelfSpinDirY = Math.random() > 0.5 ? 1 : -1;
        // Xoay LỚP (kiểu 2) theo nốt cụ thể: mỗi 1 trong 12 nốt (C..B) map cố định ra 1 cặp
        // (trục x/y/z, lớp -1/0/1) — khi phát hiện nốt mới (đổi so với nốt vừa rồi) và năng lượng
        // nhạc đủ cao, kích hoạt lượt xoay lớp tương ứng thay cho chọn random như trước.
        const RUBIK_NOTE_TO_TURN = [
            { axis: 'x', layer: -1 }, { axis: 'x', layer:  0 }, { axis: 'x', layer:  1 }, // C, C#, D
            { axis: 'y', layer: -1 }, { axis: 'y', layer:  0 }, { axis: 'y', layer:  1 }, // D#, E, F
            { axis: 'z', layer: -1 }, { axis: 'z', layer:  0 }, { axis: 'z', layer:  1 }, // F#, G, G#
            { axis: 'x', layer: -1 }, { axis: 'y', layer:  1 }, { axis: 'z', layer:  0 }  // A, A#, B
        ];
        let rubikLastTurnNote = null;
        let raindrops = [], ripples = [], bgRaindrops = [];
        let glassStaticDrops = [], glassStreaks = [], cityBuildings = [];
        let activeLightnings = [];

        // Rain - Street scene (đèn đường, hàng rào công viên, mưa phố)
        let streetLamps = [], streetRain = [];
        let streetGroundY = 0; // mặt đất Street, luôn cao hơn vùng thanh điều khiển dưới cùng

        // ==========================================
        // KHỞI TẠO THREE.JS CHO VORTEX ENGINE MỚI
        // ==========================================
        let tScene, tCamera, tRenderer, tInitialized = false;
        
        // System variables cho Vortex Engine
        let tCurrentWarpZ = 0; 