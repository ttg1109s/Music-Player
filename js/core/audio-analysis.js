/**
 * Tính màu sắc theo dữ liệu tần số (getComputedColor) & cập nhật bảng thống kê BPM / Pitch / Energy.
 * (Trích từ file gốc, dòng 1016-1065 trong khối <script>)
 */
        function getComputedColor(i, totalLength, dataValue) {
            if (vizConfig.mode === 'dynamic') return { fill: interpolateColor(vizConfig.dynA, vizConfig.dynB, i / totalLength), glow: interpolateColor(vizConfig.dynA, vizConfig.dynB, i / totalLength) };
            else if (vizConfig.mode === 'gradient') {
                let baseHue = (globalHueOffset + (i / totalLength) * 240) % 360; 
                let finalHue = (baseHue + (dataValue / 255) * 80) % 360; let lightness = 40 + (dataValue / 255) * 30;
                return { fill: `hsla(${finalHue}, ${70 + (dataValue/255)*30}%, ${lightness}%, 0.9)`, glow: `hsl(${finalHue}, 100%, ${lightness+15}%)` };
            } else return { fill: vizConfig.solidColor, glow: vizConfig.solidColor };
        }

        function updateStatsDashboard(bufferLength) {
            const now = Date.now();
            let totalAmplitude = 0; let currentFlux = 0;
            for(let i=0; i<bufferLength; i++) {
                totalAmplitude += vizDataArray[i]; let diff = vizDataArray[i] - previousSpectrumArray[i];
                if (diff > 0) currentFlux += diff; previousSpectrumArray[i] = vizDataArray[i]; 
            }
            
            let energyPercent = Math.min(100, Math.round(((totalAmplitude / bufferLength) / 255) * 100 * 1.5)); 
            statEnergy.textContent = energyPercent + '%'; 
            
            let isPlaying = !audioPlayer.paused && audioPlayer.currentTime > 0;

            if(isPlaying) {
                fluxHistory.push(currentFlux); if(fluxHistory.length > 45) fluxHistory.shift(); 
                let sumFlux = 0; for (let i=0; i<fluxHistory.length; i++) sumFlux += fluxHistory[i];
                runningFluxMean = sumFlux / fluxHistory.length; let fluxThreshold = runningFluxMean * 1.3;

                if (currentFlux > fluxThreshold && currentFlux > 150 && (now - lastBeatTime > APP_CONFIG.bpmMinWaitTime)) {
                    if (lastBeatTime > 0) { beatTimes.push(now - lastBeatTime); if (beatTimes.length > 5) beatTimes.shift(); }
                    lastBeatTime = now;
                    if (beatTimes.length >= 2) {
                        let avgInterval = beatTimes.reduce((a, b) => a + b) / beatTimes.length;
                        let calcBpm = Math.round(60000 / avgInterval);
                        if (calcBpm > 40 && calcBpm < 220) currentCalculatedBpm = calcBpm;
                    }
                }
                statBpm.textContent = currentCalculatedBpm;

                if (energyPercent > 1) { 
                    analyserPitch.getFloatTimeDomainData(pitchTimeDomainArray);
                    // v7: YIN chạy trên Worker riêng (xem audio-engine.js) — gửi buffer đi (không
                    // chờ), rồi dùng NGAY kết quả mới nhất worker đã trả (latestPitchFrequency, có
                    // thể trễ vài khung hình so với buffer vừa gửi). Độ trễ này cộng dồn trên nền trễ
                    // vốn có của YIN (cần buffer ~46ms mới phân tích được) nên không cảm nhận được.
                    requestPitchDetection(pitchTimeDomainArray, audioContext.sampleRate);
                    let frequency = latestPitchFrequency;
                    if (frequency > 0) {
                        let midiNote = Math.round(12 * Math.log2(frequency / 440)) + 69;
                        if (midiNote > 0 && midiNote < 128) {
                            window.lastValidNoteStr = `${noteNames[midiNote % 12]}${Math.floor(midiNote / 12) - 1}`; window.lastValidNoteTime = now; statNote.textContent = window.lastValidNoteStr;
                            window.lastValidMidiNote = midiNote;
                            // Cập nhật pha tham chiếu (nốt trung bình động) cho visual Rubik — xoay tự
                            // thân sẽ so nốt hiện tại với pha này để quyết định nhanh/chậm.
                            rubikPitchHistory.push(midiNote); if (rubikPitchHistory.length > 30) rubikPitchHistory.shift();
                            rubikPitchAvg = rubikPitchHistory.reduce((a, b) => a + b, 0) / rubikPitchHistory.length;
                        }
                    } else if (window.lastValidNoteStr && (now - window.lastValidNoteTime < 250)) { statNote.textContent = window.lastValidNoteStr;
                    } else { statNote.textContent = "---"; }
                } else { statNote.textContent = "---"; }
            } else { currentCalculatedBpm = "---"; statBpm.textContent = "---"; statNote.textContent = "---"; }
        }