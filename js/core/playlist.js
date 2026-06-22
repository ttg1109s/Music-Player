/**
 * Quản lý danh sách phát: định dạng thời gian, nạp file nhạc (đọc tag mp3 bằng jsmediatags), trộn bài, render danh sách, xóa bài, phát bài hát theo index.
 * (Trích từ file gốc, dòng 672-801 trong khối <script>)
 */
        function formatTime(seconds) {
            if (isNaN(seconds)) return "0:00";
            const min = Math.floor(seconds / 60); const sec = Math.floor(seconds % 60); return `${min}:${sec < 10 ? '0' : ''}${sec}`;
        }

        fileInput.addEventListener('change', async function(e) {
            const files = Array.from(e.target.files); if (files.length === 0) return;
            playlistEmpty.classList.add('hidden'); loadingShield.classList.remove('hidden');

            for(let i = 0; i < files.length; i++) {
                let file = files[i]; loadingText.textContent = `Đang nạp ${i + 1} / ${files.length}...`;
                let songObj = { id: Date.now() + i, file: file, title: file.name.replace(/\.[^/.]+$/, ""), artist: "Đang phân tích...", cover: DEFAULT_VINYL };

                await new Promise(resolve => {
                    if (window.jsmediatags) {
                        jsmediatags.read(file, {
                            onSuccess: function(tag) {
                                if(tag.tags.title) songObj.title = tag.tags.title;
                                if(tag.tags.artist) songObj.artist = tag.tags.artist; else songObj.artist = "Không rõ nghệ sĩ";
                                if (tag.tags.picture) {
                                    const data = tag.tags.picture.data;
                                    const format = tag.tags.picture.format;
                                    const byteArray = new Uint8Array(data);
                                    const blob = new Blob([byteArray], { type: format });
                                    songObj.cover = URL.createObjectURL(blob);
                                }
                                resolve();
                            },
                            onError: function() { songObj.artist = "Âm thanh cục bộ"; resolve(); }
                        });
                    } else { songObj.artist = "Âm thanh cục bộ"; resolve(); }
                });

                playlist.push(songObj); if(i % 10 === 0 || i === files.length - 1) { renderPlaylist(); await new Promise(r => setTimeout(r, 10)); }
            }
            updateShuffleArray(); loadingShield.classList.add('hidden'); loadingText.textContent = "Đang xử lý..."; 
        });

        function updateShuffleArray() {
            shuffleIndices = Array.from({length: playlist.length}, (_, i) => i);
            if (isShuffle) {
                for (let i = shuffleIndices.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffleIndices[i], shuffleIndices[j]] = [shuffleIndices[j], shuffleIndices[i]];
                }
            }
        }

        function renderPlaylist() {
            playlistContainer.innerHTML = '';
            playlist.forEach((song, idx) => {
                let isPlaying = (idx === currentIndex); let isActuallyPlaying = isPlaying && !audioPlayer.paused;
                let deleteBtnHtml = `<button onclick="event.stopPropagation(); removeSong(${idx})" class="p-2 text-slate-400 hover:text-rose-500 transition-colors z-10" title="Xóa bài"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>`;
                let eqIconHtml = isActuallyPlaying ? `<div class="flex items-end gap-[2px] h-3 w-3"><div class="w-[3px] bg-sky-400 eq-1"></div><div class="w-[3px] bg-sky-400 eq-2"></div><div class="w-[3px] bg-sky-400 eq-3"></div></div>` : (isPlaying ? `<div class="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_5px_rgba(14,165,233,0.8)]"></div>` : '');
                let itemHtml = '';
                
                if (isGridView) {
                    itemHtml = `
                        <div onclick="playSong(${idx})" class="flex flex-col cursor-pointer active:scale-[0.98] transition-transform group relative w-full">
                            <div class="w-full aspect-square relative mb-2.5">
                                <img src="${song.cover}" class="w-full h-full rounded-2xl object-cover shadow-lg">
                                ${isPlaying ? `<div class="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center backdrop-blur-[2px]">${eqIconHtml}</div>` : ''}
                                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">${deleteBtnHtml}</div>
                            </div>
                            <h3 class="text-white text-[15px] font-semibold leading-tight line-clamp-1 px-1">${song.title}</h3>
                            <p class="text-slate-400 text-[13px] font-medium line-clamp-1 px-1 mt-0.5">${song.artist}</p>
                        </div>`;
                } else {
                    itemHtml = `
                        <div onclick="playSong(${idx})" class="flex items-center gap-4 px-5 py-3 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer w-full group border-b border-white/5">
                            <img src="${song.cover}" class="w-12 h-12 rounded-lg flex-shrink-0 object-cover shadow-md">
                            <div class="flex-grow flex flex-col justify-center overflow-hidden gap-0.5">
                                <div class="flex items-center gap-2"><h3 class="text-[16px] leading-tight font-semibold truncate ${isPlaying ? 'text-sky-300' : 'text-slate-100'}">${song.title}</h3>${isPlaying ? eqIconHtml : ''}</div>
                                <p class="text-[13px] text-slate-400 truncate font-medium">${song.artist}</p>
                            </div>
                            <div class="opacity-0 group-hover:opacity-100 transition-opacity">${deleteBtnHtml}</div>
                        </div>`;
                }
                playlistContainer.insertAdjacentHTML('beforeend', itemHtml);
            });
            if (currentIndex > -1) btnReturnVisual.classList.remove('hidden'); else btnReturnVisual.classList.add('hidden');
        }

        window.removeSong = function(index) {
            if (index === currentIndex) return; 
            let wasPlaying = !audioPlayer.paused; if (wasPlaying) audioPlayer.pause(); 
            loadingText.textContent = "Đang xóa..."; loadingShield.classList.remove('hidden'); 
            setTimeout(() => {
                playlist.splice(index, 1); if (currentIndex > index) currentIndex--;
                updateShuffleArray(); renderPlaylist();
                if (playlist.length === 0) playlistEmpty.classList.remove('hidden');
                loadingShield.classList.add('hidden'); loadingText.textContent = "Đang xử lý...";
                if (wasPlaying && playlist.length > 0) audioPlayer.play();
            }, 400); 
        };

        window.playSong = function(index) {
            requestWakeLock();
            if (index === currentIndex) { switchToVisualizer(); if (audioPlayer.paused) audioPlayer.play(); return; }
            if (index < 0 || index >= playlist.length) return;

            if (currentIndex > -1 && playlist[currentIndex]) { subtitlesBySongId[playlist[currentIndex].id] = subtitles; }

            currentIndex = index; let song = playlist[currentIndex];

            playerTitle.textContent = song.title; playerArtist.textContent = song.artist; 
            recordContainer.innerHTML = `<img id="record-art" src="${song.cover}" class="w-full h-full rounded-full object-cover shadow-lg relative z-20 ${audioPlayer.paused ? 'paused' : 'animate-spin-slow'}" alt="Record"><div class="absolute inset-0 m-auto w-3 h-3 bg-slate-900 rounded-full border border-slate-700 z-30"></div>`;

            if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
            currentObjectURL = URL.createObjectURL(song.file); audioPlayer.src = currentObjectURL; 
            
            if ('mediaSession' in navigator) {
                if (window.currentMediaSessionCover) { URL.revokeObjectURL(window.currentMediaSessionCover); window.currentMediaSessionCover = null; }
                let artworkArray = [];
                if (song.cover !== DEFAULT_VINYL) {
                    window.currentMediaSessionCover = dataURItoBlobUrl(song.cover);
                    if (window.currentMediaSessionCover) artworkArray = [{ src: window.currentMediaSessionCover, sizes: '512x512', type: 'image/jpeg' }];
                }
                navigator.mediaSession.metadata = new MediaMetadata({ title: song.title || "Visual Master", artist: song.artist || "Unknown Artist", artwork: artworkArray });
            }

            audioPlayer.play(); switchToVisualizer(); renderPlaylist(); 
            beatTimes = []; fluxHistory = []; currentCalculatedBpm = "---"; statBpm.textContent = "---"; statNote.textContent = "---"; 
            raindrops = []; ripples = []; glassStaticDrops = []; glassStreaks = []; activeLightnings = []; starFlashes = [];
            setupAudioContext(); updateTypeUI(); 

            subtitles = subtitlesBySongId[song.id] ? subtitlesBySongId[song.id].slice() : [];
            currentActiveSubIndex = -1; resetAutoSub(); renderSubList(); subtitleDisplay.classList.add('opacity-0');
        }

