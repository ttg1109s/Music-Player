/**
 * State playlist/subtitle bổ sung + sự kiện đổi chế độ xem playlist (grid/list) + xử lý video nền (handleVideoBackground và các listener liên quan).
 * (Trích từ file gốc, dòng 273-314 trong khối <script>)
 */

        let subtitles = []; let isSubtitlesEnabled = true; let activeSubIds = new Set(); let editingSubId = null;
        let currentCalculatedBpm = "---";

        let isShuffle = false, shuffleIndices = [], repeatMode = 0;
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
            renderPlaylistFull(); // layout grid/list khác cấu trúc node hoàn toàn -> vẽ lại từ đầu, không diff
        });

        btnReturnVisual.addEventListener('click', () => { if(currentKey) switchToVisualizer(); });

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
            // QUY TẮC v6:
            //  - Video nền BẬT/TẮT chỉ phụ thuộc cấu hình + trạng thái NHẠC, KHÔNG phụ thuộc đang ở
            //    màn Playlist hay Visualizer. Mở Playlist KHÔNG còn làm dừng video nữa (Playlist nằm
            //    đè z-[60] lên trên nên tự che video, không cần dừng — trước đây dừng video là can
            //    thiệp phi chức năng).
            //  - src của video chỉ gán 1 LẦN (hoặc khi URL đổi) -> Next/Prev KHÔNG nạp lại video.
            //  - Nền đen cưỡng chế phía sau + fade video lên khi đã có khung hình thật -> bỏ hẳn cú
            //    "lóe trắng" lúc video đang nạp.
            if (vizConfig.videoBgEnabled && vizConfig.videoBgUrl) {
                document.body.style.backgroundColor = '#000000'; // nền đen cưỡng chế sau video
                bgVideoElement.classList.remove('hidden');

                if (bgVideoElement.getAttribute('src') !== vizConfig.videoBgUrl) {
                    bgVideoElement.style.opacity = '0'; // giữ ẩn cho tới khi có hình -> không chớp trắng
                    bgVideoElement.src = vizConfig.videoBgUrl;
                    const fadeVideoIn = () => { bgVideoElement.style.opacity = '1'; };
                    bgVideoElement.addEventListener('loadeddata', fadeVideoIn, { once: true });
                    bgVideoElement.addEventListener('playing', fadeVideoIn, { once: true });
                } else {
                    bgVideoElement.style.opacity = '1';
                }

                // Phát/dừng video CHỈ bám theo nhạc: nhạc đang phát -> video chạy; nhạc dừng -> video dừng.
                if (!audioPlayer.paused) { bgVideoElement.play().catch(() => {}); } else { bgVideoElement.pause(); }
            } else {
                bgVideoElement.style.opacity = '0';
                bgVideoElement.pause();
                setTimeout(() => {
                    if (!vizConfig.videoBgEnabled) { bgVideoElement.classList.add('hidden'); bgVideoElement.removeAttribute('src'); bgVideoElement.src = ''; }
                }, 500);
                updateDOMBackground();
            }
        }

        videoEnableToggle.addEventListener('change', (e) => {
            vizConfig.videoBgEnabled = e.target.checked;
            if (!vizConfig.videoBgEnabled) {
                withLoadingShield("Đang xóa video nền...", async () => {
                    await delMeta('videoBg');
                    if (vizConfig.videoBgUrl && vizConfig.videoBgUrl.startsWith('blob:')) URL.revokeObjectURL(vizConfig.videoBgUrl);
                    vizConfig.videoBgUrl = ''; vizConfig.videoHideVisual = false; videoHideVisualToggle.checked = false;
                    handleVideoBackground(); saveConfig();
                });
            } else { handleVideoBackground(); saveConfig(); }
        });
        videoHideVisualToggle.addEventListener('change', (e) => { vizConfig.videoHideVisual = e.target.checked; saveConfig(); });
        videoUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            e.target.value = '';
            withLoadingShield("Đang lưu video nền...", async () => {
                await setMeta('videoBg', file);
                if (vizConfig.videoBgUrl && vizConfig.videoBgUrl.startsWith('blob:')) URL.revokeObjectURL(vizConfig.videoBgUrl);
                vizConfig.videoBgUrl = URL.createObjectURL(file);
                vizConfig.videoBgEnabled = true; videoEnableToggle.checked = true;
                handleVideoBackground(); saveConfig();
            });
        });