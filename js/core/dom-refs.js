/**
 * Tham chiếu các phần tử DOM (getElementById) + toàn bộ biến trạng thái runtime toàn cục (audio, hiệu ứng, rubik, mưa phố, vortex...).
 * QUAN TRỌNG: phải nạp SAU KHI các component HTML (playlist-view, settings-drawer, ...) đã được chèn vào DOM, nếu không getElementById sẽ trả về null.
 * (Trích từ file gốc, dòng 26-99 trong khối <script>)
 */
        let isGridView = false;

        const fileInput = document.getElementById('audio-upload'), audioPlayer = document.getElementById('audio-player');
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
        const btnToggleView = document.getElementById('btn-toggle-view'), iconGridView = document.getElementById('icon-grid-view'), iconListView = document.getElementById('icon-list-view');
        const btnCycleMode = document.getElementById('btn-cycle-mode'), modeBadge = document.getElementById('mode-badge');
        const qualitySelect = document.getElementById('setting-quality'), bgColorPicker = document.getElementById('bg-color-picker');
        const bgUploadInput = document.getElementById('setting-bg-upload'), bgBlurSlider = document.getElementById('setting-bg-blur'), valBgBlurDisplay = document.getElementById('val-bg-blur');
        const colorModeSelect = document.getElementById('setting-color-mode'), solidColorContainer = document.getElementById('solid-color-container'), solidColorPicker = document.getElementById('solid-color-picker'), solidColorText = document.getElementById('solid-color-text');
        const dynColorContainer = document.getElementById('dynamic-color-container'), dynColorA = document.getElementById('dyn-color-a'), dynColorB = document.getElementById('dyn-color-b');
        const maxHeightSlider = document.getElementById('setting-max-height'), barWidthSlider = document.getElementById('setting-bar-width'), valMaxDisplay = document.getElementById('val-max'), valWidthDisplay = document.getElementById('val-width');
        const blockGeometry = document.getElementById('block-geometry'), blockVortex = document.getElementById('block-vortex'), vortexStyleSelect = document.getElementById('setting-vortex-style');
        const blockRain = document.getElementById('block-rain'), rainStyleSelect = document.getElementById('setting-rain-style'), glassFlashToggle = document.getElementById('setting-glass-flash');
        const rainStreetOptions = document.getElementById('rain-street-options');
        const streetStandingSelect = document.getElementById('setting-street-standing');
        const blockBarStyle = document.getElementById('block-bar-style'), barStyleSelect = document.getElementById('setting-bar-style');
        
        const volumeSlider = document.getElementById('setting-volume'), valVolumeDisplay = document.getElementById('val-volume');
        const eqSelect = document.getElementById('setting-eq'), eqSlidersWrapper = document.getElementById('eq-sliders-wrapper');

        const videoEnableToggle = document.getElementById('setting-video-enable'), videoUploadInput = document.getElementById('setting-video-upload'), bgVideoElement = document.getElementById('bg-video');
        const videoHideVisualToggle = document.getElementById('setting-video-hide-visual');

        const btnSubtitle = document.getElementById('btn-subtitle'), subToggleBadge = document.getElementById('sub-toggle-badge');
        const subtitleModal = document.getElementById('subtitle-modal'), btnCloseSubModal = document.getElementById('btn-close-sub-modal');
        const srtUpload = document.getElementById('srt-upload'), btnApplySub = document.getElementById('btn-apply-sub');
        const btnToggleSub = document.getElementById('btn-toggle-sub'), btnAddSub = document.getElementById('btn-add-sub'), btnExportSrt = document.getElementById('btn-export-srt');
        const subtitleDisplay = document.getElementById('subtitle-display'), subLine1 = document.getElementById('sub-line-1'), subLine2 = document.getElementById('sub-line-2');
        const subListContainer = document.getElementById('sub-list-container'), subEmptyState = document.getElementById('sub-empty-state');
        const btnAutoTiming = document.getElementById('btn-auto-timing');
        let autoSubStartTime = null;

        let audioContext, analyser, analyserPitch, source, animationId;
        let masterGainNode; let eqBandNodes = []; 
        let isSeeking = false, dpr = 1, currentObjectURL = null, frameCounter = 0; 
        let smoothedBeatRadius = 0, smoothedEnergy = 0, globalHueOffset = 0, smoothedPitchY = 0, beatScale = 0;
        let vizDataArray, pitchTimeDomainArray, waveTimeDomainArray, previousSpectrumArray;
        let beatTimes = [], lastBeatTime = 0, fluxHistory = [], runningFluxMean = 0;

        let currentModeIndex = 0; 
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        let stars = [], tunnelAngle = 0;
        let starFlashes = []; 
        let rubikCubes = [], rubikRotX = 0, rubikRotY = 0, rubikAnim = { active: false, axis: 'x', layer: 0, angle: 0, dir: 1 };
        let raindrops = [], ripples = [], bgRaindrops = [];
        let glassStaticDrops = [], glassStreaks = [], cityBuildings = [];
        let activeLightnings = [];

        // Rain - Street scene (đèn đường, người đứng dưới đèn, mưa phố)
        let streetLamps = [], streetRain = [], streetStandees = [];
        let streetGroundY = 0; // mặt đất Street, luôn cao hơn vùng thanh điều khiển dưới cùng

        // ==========================================
        // KHỞI TẠO THREE.JS CHO VORTEX ENGINE MỚI
        // ==========================================
        let tScene, tCamera, tRenderer, tInitialized = false;
        
        // System variables cho Vortex Engine
        let tCurrentWarpZ = 0; 
