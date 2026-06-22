/**
 * Khởi tạo AudioContext, chuỗi xử lý EQ (BiquadFilter nối tiếp), thuật toán nhận diện cao độ YIN.
 * (Trích từ file gốc, dòng 973-1015 trong khối <script>)
 */
        function setupAudioContext() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                source = audioContext.createMediaElementSource(audioPlayer);
                
                analyser = audioContext.createAnalyser(); analyser.fftSize = APP_CONFIG.fftSizeStandard;
                analyserPitch = audioContext.createAnalyser(); analyserPitch.fftSize = APP_CONFIG.fftSizePitch; 
                
                masterGainNode = audioContext.createGain(); masterGainNode.gain.value = vizConfig.volume / 100;

                let prevNode = source; eqBandNodes = [];
                EQ_FREQS.forEach(freq => {
                    let filter = audioContext.createBiquadFilter();
                    filter.type = "peaking"; filter.frequency.value = freq; filter.Q.value = 1; filter.gain.value = 0;
                    prevNode.connect(filter); prevNode = filter; eqBandNodes.push(filter);
                });
                
                applyEQPreset(vizConfig.eqMode);
                prevNode.connect(masterGainNode); masterGainNode.connect(analyser); masterGainNode.connect(analyserPitch); analyser.connect(audioContext.destination);

                allocateBuffers(); resizeCanvas(); drawVisualizer(); updateDOMBackground();
            } else if (audioContext.state === 'suspended') audioContext.resume();
        }

        function detectPitchYIN(buf, sampleRate) {
            const halfLen = Math.floor(buf.length / 2); let yinBuffer = new Float32Array(halfLen); let threshold = 0.15;
            yinBuffer[0] = 1; let runningSum = 0;
            for (let tau = 1; tau < halfLen; tau++) {
                let sum = 0; for (let j = 0; j < halfLen; j++) { let diff = buf[j] - buf[j + tau]; sum += diff * diff; }
                runningSum += sum; yinBuffer[tau] = sum * tau / (runningSum === 0 ? 1 : runningSum);
            }
            for (let tau = 2; tau < halfLen; tau++) {
                if (yinBuffer[tau] < threshold) {
                    while (tau + 1 < halfLen && yinBuffer[tau + 1] < yinBuffer[tau]) tau++;
                    return sampleRate / tau;
                }
            }
            let minTau = 2; let minVal = yinBuffer[2];
            for (let tau = 2; tau < halfLen; tau++) { if (yinBuffer[tau] < minVal) { minVal = yinBuffer[tau]; minTau = tau; } }
            if (minVal < 0.6) return sampleRate / minTau; 
            return -1;
        }

