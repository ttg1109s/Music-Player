/**
 * Khởi tạo AudioContext, chuỗi xử lý EQ (BiquadFilter nối tiếp), cầu nối Worker nhận diện cao độ YIN.
 * (Trích từ file gốc, dòng 973-1015 trong khối <script>)
 *
 * PITCH WORKER (v7): detectPitchYIN() đã dời sang js/core/pitch-worker.js, chạy trên thread riêng
 * — xem audio-analysis.js để biết cách kết quả bất đồng bộ được tiêu thụ. Khu vực dưới đây chỉ còn
 * lại "cầu nối": khởi tạo 1 Worker duy nhất, gửi buffer (transfer, không copy) kèm reqId, và giữ
 * lại kết quả mới nhất hợp lệ cho audio-analysis.js đọc.
 */
        let pitchWorker = null;
        let pitchWorkerBusy = false;       // true khi đang có 1 request bay tới worker, chưa có hồi đáp
        let pitchReqCounter = 0;           // tăng dần — đối chiếu reqId để loại bỏ hồi đáp cũ/lạc (hiếm, do giật khung)
        let latestPitchFrequency = -1;     // kết quả YIN mới nhất nhận được từ worker (-1 = chưa phát hiện được)
        let latestPitchReqId = -1;

        function initPitchWorker() {
            if (pitchWorker) return;
            try {
                pitchWorker = new Worker('js/core/pitch-worker.js');
                pitchWorker.onmessage = function(e) {
                    const { frequency, reqId } = e.data;
                    // Chỉ nhận kết quả nếu nó MỚI HƠN reqId đã ghi nhận gần nhất — phòng trường hợp
                    // hiếm 2 message bay đồng thời (giật khung) trả về không đúng thứ tự gửi.
                    if (reqId >= latestPitchReqId) { latestPitchReqId = reqId; latestPitchFrequency = frequency; }
                    pitchWorkerBusy = false;
                };
                pitchWorker.onerror = function(err) {
                    console.error('[audio-engine] Lỗi pitch-worker, tắt phát hiện cao độ:', err);
                    pitchWorker = null; pitchWorkerBusy = false;
                };
            } catch (err) {
                console.error('[audio-engine] Không tạo được pitch-worker (trình duyệt không hỗ trợ Worker qua file://?):', err);
                pitchWorker = null;
            }
        }

        /**
         * Gửi 1 khung pitchTimeDomainArray sang worker để phân tích — KHÔNG chờ kết quả (bất đồng
         * bộ). Bỏ qua nếu worker đang bận (request trước chưa hồi đáp) để hàng đợi message không bị
         * dồn lúc máy yếu — kết quả vẫn dùng tạm giá trị cũ (latestPitchFrequency), độ trễ thêm tối
         * đa vài khung hình, không gây lệch cảm nhận được (xem thảo luận độ trễ ở audio-analysis.js).
         *
         * QUAN TRỌNG — phải CLONE trước khi transfer: pitchTimeDomainArray là buffer TÁI SỬ DỤNG
         * (ghi đè mỗi frame bởi analyserPitch.getFloatTimeDomainData), nếu transfer thẳng buffer gốc
         * thì nó sẽ bị "neutered" (mất quyền sở hữu) ngay sau lần gửi đầu tiên và toàn bộ frame sau
         * sẽ ghi vào một buffer đã chết.
         */
        function requestPitchDetection(buf, sampleRate) {
            if (!pitchWorker) { initPitchWorker(); if (!pitchWorker) return; }
            if (pitchWorkerBusy) return;
            pitchWorkerBusy = true;
            const clone = buf.slice(); // Float32Array.slice() cấp ArrayBuffer MỚI, an toàn để transfer
            pitchReqCounter++;
            pitchWorker.postMessage({ buf: clone, sampleRate, reqId: pitchReqCounter }, [clone.buffer]);
        }

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

                initPitchWorker();
                allocateBuffers(); resizeCanvas(); drawVisualizer(); updateDOMBackground();
            } else if (audioContext.state === 'suspended') audioContext.resume();
        }

