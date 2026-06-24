/**
 * State playlist/subtitle bổ sung + sự kiện đổi chế độ xem playlist (grid/list) + xử lý video nền (handleVideoBackground và các listener liên quan).
 * (Trích từ file gốc, dòng 273-314 trong khối <script>)
 */

        let subtitles = []; let isSubtitlesEnabled = true; let activeSubIds = new Set(); let editingSubId = null;
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

        // Khi đóng drawer Cài đặt: nếu người dùng đã bật "Sử dụng Video Background" nhưng CHƯA
        // chọn video nào (vizConfig.videoBgUrl rỗng) thì tự tắt lại — tránh trạng thái "on" ảo
        // không có video thật phía sau. "Video phủ kín, tạm dừng Visual" phụ thuộc vào video bg
        // đang bật nên cũng phải tắt theo.
        function validateVideoBgOnClose() {
            if (vizConfig.videoBgEnabled && !vizConfig.videoBgUrl) {
                vizConfig.videoBgEnabled = false; vizConfig.videoHideVisual = false;
                videoEnableToggle.checked = false; videoHideVisualToggle.checked = false;
                handleVideoBackground(); saveConfig();
            }
        }

        function handleVideoBackground() {
            // Video nền chỉ được hiện khi đang ở màn Visualizer — Playlist có nền/ảnh nền riêng
            // của nó (#playlist-bg), Video nền KHÔNG được làm nền cho Playlist. Kiểm tra ngay tại
            // đây (không chỉ ở nơi gọi) để dù toggle/upload video được bấm lúc đang mở Cài đặt từ
            // màn Playlist, video cũng không bị hiện ra phía sau Playlist.
            const isOnPlaylistScreen = !playlistView.classList.contains('-translate-y-full');
            if (vizConfig.videoBgEnabled && vizConfig.videoBgUrl && !isOnPlaylistScreen) {
                bgVideoElement.src = vizConfig.videoBgUrl; bgVideoElement.classList.remove('hidden'); bgVideoElement.style.opacity = '1'; document.body.style.backgroundColor = 'transparent'; 
                if (!audioPlayer.paused) { bgVideoElement.play().catch(() => {}); } else { bgVideoElement.pause(); }
            } else {
                bgVideoElement.style.opacity = '0';
                setTimeout(() => { bgVideoElement.classList.add('hidden'); bgVideoElement.src = ""; }, 500);
                if (!isOnPlaylistScreen) updateDOMBackground();
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