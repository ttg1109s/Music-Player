/**
 * State playlist/subtitle bổ sung + sự kiện đổi chế độ xem playlist (grid/list) + xử lý video nền (handleVideoBackground và các listener liên quan).
 * (Trích từ file gốc, dòng 273-314 trong khối <script>)
 */

        let subtitles = []; let isSubtitlesEnabled = true; let currentActiveSubIndex = -1; let editingSubId = null;
        let subtitlesBySongId = {}; 
        let currentCalculatedBpm = "---";

        let playlist = [], currentIndex = -1, isShuffle = false, shuffleIndices = [], repeatMode = 0; 
        window.currentMediaSessionCover = null; window.lastValidNoteStr = null; window.lastValidNoteTime = 0; window.lastValidMidiNote = null;

        btnToggleView.addEventListener('click', () => {
            isGridView = !isGridView;
            if (isGridView) {
                iconGridView.classList.add('hidden'); iconListView.classList.remove('hidden');
                playlistContainer.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-6 px-5 pb-32';
            } else {
                iconGridView.classList.remove('hidden'); iconListView.classList.add('hidden');
                playlistContainer.className = 'flex flex-col pb-32';
            }
            renderPlaylist();
        });

        btnReturnVisual.addEventListener('click', () => { if(currentIndex > -1) switchToVisualizer(); });

        function handleVideoBackground() {
            if (vizConfig.videoBgEnabled && vizConfig.videoBgUrl) {
                bgVideoElement.src = vizConfig.videoBgUrl; bgVideoElement.classList.remove('hidden'); bgVideoElement.style.opacity = '1'; document.body.style.backgroundColor = 'transparent'; 
                if (!audioPlayer.paused) { bgVideoElement.play().catch(() => {}); } else { bgVideoElement.pause(); }
            } else {
                bgVideoElement.style.opacity = '0';
                setTimeout(() => { bgVideoElement.classList.add('hidden'); bgVideoElement.src = ""; }, 500);
                updateDOMBackground();
            }
        }

        videoEnableToggle.addEventListener('change', (e) => { vizConfig.videoBgEnabled = e.target.checked; handleVideoBackground(); saveConfig(); });
        videoHideVisualToggle.addEventListener('change', (e) => { vizConfig.videoHideVisual = e.target.checked; saveConfig(); });
        videoUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            if (vizConfig.videoBgUrl && vizConfig.videoBgUrl.startsWith('blob:')) URL.revokeObjectURL(vizConfig.videoBgUrl);
            vizConfig.videoBgUrl = URL.createObjectURL(file);
            if(vizConfig.videoBgEnabled) handleVideoBackground(); saveConfig(); 
        });