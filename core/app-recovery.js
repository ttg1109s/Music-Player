/**
 * App Recovery (ver 10 refine, bổ sung) — 2 hàm core cho "Khởi động lại app" và "Khôi phục cài
 * đặt mặc định" (Settings > "Khắc phục sự cố", xem js/components/settings/misc.js). Dành cho lúc
 * trình phát gặp lỗi/hành vi không bình thường mà người dùng không biết chỉnh gì khác ngoài tự
 * bấm F5 — cho họ 1 lối thoát rõ ràng, có xác nhận trước khi thực hiện (modal ở tầng workflow,
 * xem event/workflow/settings-nav.js).
 *
 * executeRestartApp(): xoá hết state RAM TẠM (resume snapshot + cờ trong localStorage — xem
 * resume-state-storage.js) rồi reload — KHÔNG đụng tới nhạc/playlist (IndexedDB) hay vizConfig.
 *
 * executeRestoreDefaults(): CHỈ reset vizConfig về DEFAULT_VIZ_CONFIG (config.js) — GIỮ NGUYÊN
 * nhạc/playlist đã upload. Sau khi reset, vẫn cần reload để UI tự đồng bộ lại qua loadConfig().
 *
 * ÁP DỤNG /event/ (cụm "settingsNav"): `addEventListener`+`modalChoice()` cũ đã CHUYỂN sang
 * event/workflow/settings-nav.js (modal xác nhận đặt ở workflow, đúng quy tắc — core không biết
 * modalChoice tồn tại) + event/listener/settings-nav.js. 2 hàm dưới đây là core THUẦN: chỉ làm
 * đúng hành động (dọn state / reset config) + reload, không tự hỏi xác nhận gì cả.
 *
 * PHẢI nạp SAU: resume-state-storage.js (cần clearResumeFlag/clearResumeStateFromLocalStorage),
 * config.js (cần DEFAULT_VIZ_CONFIG/vizConfig), equalizer-settings.js (cần saveConfig()).
 */
        /** Core thuần: dọn state RAM tạm (resume) rồi reload. Không hỏi xác nhận gì ở đây. */
        function executeRestartApp() {
            if (typeof clearResumeFlag === 'function') clearResumeFlag();
            if (typeof clearResumeStateFromLocalStorage === 'function') clearResumeStateFromLocalStorage();
            location.reload();
        }

        /** Core thuần: reset vizConfig về default rồi reload. Không hỏi xác nhận gì ở đây. */
        function executeRestoreDefaults() {
            vizConfig = { ...DEFAULT_VIZ_CONFIG };
            saveConfig();
            location.reload();
        }
