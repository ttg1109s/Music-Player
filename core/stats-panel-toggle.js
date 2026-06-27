/**
 * Stats Panel Toggle (ver 10 refine, bổ sung) — toggle ẩn/hiện dải BPM/Pitch/Energy (#stats-panel,
 * xem visualizer-overlay.js) qua nút mới trong Control Center (#btn-toggle-stats-panel).
 *
 * QUAN TRỌNG — TẠM DỪNG UPDATE DOM, KHÔNG TẠM DỪNG TOÀN BỘ TÍNH TOÁN: khi ẩn dải này, audio-analysis.js
 * (updateStatsDashboard(), chạy mỗi frame trong vòng lặp render chính) sẽ KHÔNG còn ghi
 * statBpm/statNote/statEnergy.textContent — đỡ phần thao tác DOM vô nghĩa khi không ai nhìn thấy
 * dải đó. NHƯNG hàm đó còn tính toán logic khác được CÁC VISUALIZER KHÁC dùng (rubikPitchAvg,
 * currentCalculatedBpm, beatTimes, fluxHistory...) — nếu tạm dừng nguyên cả hàm,
 * visual Rubik (xoay theo nốt nhạc trung bình động) sẽ ngưng hoạt động đúng dù không liên quan gì
 * tới việc dải số liệu có hiện hay không. Vì vậy biến isStatsPanelVisible CHỈ là 1 cờ ĐƠN GIẢN mà
 * audio-analysis.js tự đọc trước mỗi dòng ghi .textContent — không đụng/không bọc gì khác trong
 * luồng tính toán của hàm đó.
 *
 * Trạng thái ẨN/HIỆN không lưu vào vizConfig (không cần persist qua reload — đây là tuỳ chọn xem
 * tạm trong 1 phiên, giống độ scroll hay panel nào đang mở, không phải 1 cấu hình lâu dài).
 *
 * PHẢI nạp TRƯỚC audio-analysis.js (file đó đọc isStatsPanelVisible) — xem index.html. Cần
 * dom-refs.js đã chạy (statsPanel/btnToggleStatsPanel/iconStatsPanelVisible/iconStatsPanelHidden).
 */
        /** true = dải BPM/Pitch/Energy đang hiện (mặc định) — audio-analysis.js đọc cờ này trước
         * mỗi lần ghi DOM text, KHÔNG đụng gì tới phần tính toán logic khác trong hàm đó. */
        let isStatsPanelVisible = true;

        if (typeof btnToggleStatsPanel !== 'undefined' && btnToggleStatsPanel) {
            btnToggleStatsPanel.addEventListener('click', () => {
                isStatsPanelVisible = !isStatsPanelVisible;
                if (typeof statsPanel !== 'undefined' && statsPanel) statsPanel.classList.toggle('hidden', !isStatsPanelVisible);
                if (typeof iconStatsPanelVisible !== 'undefined' && iconStatsPanelVisible) iconStatsPanelVisible.classList.toggle('hidden', !isStatsPanelVisible);
                if (typeof iconStatsPanelHidden !== 'undefined' && iconStatsPanelHidden) iconStatsPanelHidden.classList.toggle('hidden', isStatsPanelVisible);
                // Khi ẨN trở lại: đưa 3 ô số liệu về "---"/"0%" ngay lúc ẩn (không để giá trị cũ
                // đứng yên "đông cứng" — dù không ai nhìn thấy lúc panel đang ẩn, vẫn nên sạch sẽ
                // đúng trạng thái ban đầu nếu HIỆN LẠI ngay sau đó trước khi audio-analysis.js kịp
                // ghi giá trị mới — tránh nhấp nháy 1 khung hình giá trị cũ từ trước khi ẩn).
                if (!isStatsPanelVisible) {
                    if (typeof statBpm !== 'undefined' && statBpm) statBpm.textContent = '---';
                    if (typeof statNote !== 'undefined' && statNote) statNote.textContent = '---';
                    if (typeof statEnergy !== 'undefined' && statEnergy) statEnergy.textContent = '0%';
                }
            });
        }
