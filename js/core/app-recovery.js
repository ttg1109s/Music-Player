/**
 * App Recovery (ver 10 refine, bổ sung) — xử lý 2 nút trong Settings > "Khắc phục sự cố" (xem
 * js/components/settings/misc.js): "Khởi động lại app" và "Khôi phục cài đặt mặc định". Dành cho
 * lúc trình phát gặp lỗi/hành vi không bình thường mà người dùng không biết chỉnh gì khác ngoài
 * tự bấm F5 — cho họ 1 lối thoát rõ ràng, có xác nhận trước khi thực hiện.
 *
 * "Khởi động lại app": xoá hết state RAM TẠM (resume snapshot + cờ trong localStorage — xem
 * resume-state-storage.js) rồi location.reload() — KHÔNG đụng tới nhạc/playlist (IndexedDB) hay
 * vizConfig (localStorage cấu hình chính). Mục đích: nếu app đang ở trạng thái lỗi vì còn sót cờ/
 * snapshot resume cũ hỏng (ví dụ do thao tác bất thường nào đó để lại), nút này đảm bảo dọn sạch
 * đúng những gì có thể gây kẹt, không phải mất hẳn dữ liệu người dùng.
 *
 * "Khôi phục cài đặt mặc định": CHỈ reset vizConfig (màu sắc/hiệu ứng/EQ/kiểu hiển thị/auto-switch-
 * visual/v.v.) về DEFAULT_VIZ_CONFIG (config.js) — GIỮ NGUYÊN nhạc/playlist đã upload (IndexedDB
 * 'songs' store không bị đụng tới gì cả). Sau khi reset, vẫn cần reload để toàn bộ UI tự đồng bộ
 * lại đúng theo đúng luồng loadConfig() bình thường (tránh phải tự viết lại logic đồng bộ UI cho
 * từng control rải rác khắp nhiều file settings/*.js).
 *
 * PHẢI nạp SAU: dom-refs.js (cần btnRestartApp/btnRestoreDefaults) + main.js (HTML thật đã chèn
 * vào DOM lúc đó) + resume-state-storage.js (cần clearResumeFlag/clearResumeStateFromLocalStorage),
 * config.js (cần DEFAULT_VIZ_CONFIG/vizConfig), equalizer-settings.js (cần saveConfig()),
 * modal-choice.js (cần modalChoice()). Chạy trực tiếp ở top-level (không bọc trong DOMContentLoaded
 * riêng) — đúng pattern about-stats.js/id3-export.js, vì các script core đều nạp sau main.js.
 */
        if (typeof btnRestartApp !== 'undefined' && btnRestartApp) {
            btnRestartApp.addEventListener('click', () => {
                modalChoice(
                    t('common.appRecovery.restartBody'),
                    [
                        {
                            label: t('common.cancel'),
                            className: 'flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors',
                            onClick: () => {}
                        },
                        {
                            label: t('common.appRecovery.restartConfirmBtn'),
                            className: 'flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold transition-colors',
                            onClick: () => {
                                // Dọn sạch state RAM TẠM (resume snapshot + cờ) — KHÔNG đụng tới
                                // vizConfig ('visualMasterConfigV21') hay bất kỳ key khác trong
                                // localStorage. Dùng trực tiếp tên hàm đã khai báo ở
                                // resume-state-storage.js, không hard-code lại tên key ở đây.
                                if (typeof clearResumeFlag === 'function') clearResumeFlag();
                                if (typeof clearResumeStateFromLocalStorage === 'function') clearResumeStateFromLocalStorage();
                                location.reload();
                            }
                        }
                    ],
                    { title: t('common.appRecovery.restartTitle') }
                );
            });
        }

        if (typeof btnRestoreDefaults !== 'undefined' && btnRestoreDefaults) {
            btnRestoreDefaults.addEventListener('click', () => {
                modalChoice(
                    t('common.appRecovery.restoreDefaultsBody'),
                    [
                        {
                            label: t('common.cancel'),
                            className: 'flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors',
                            onClick: () => {}
                        },
                        {
                            label: t('common.appRecovery.restoreDefaultsConfirmBtn'),
                            className: 'flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold transition-colors',
                            onClick: () => {
                                // CHỈ reset vizConfig — không đụng resume snapshot/cờ (không liên
                                // quan), không đụng IndexedDB 'songs' (nhạc/playlist giữ nguyên).
                                vizConfig = { ...DEFAULT_VIZ_CONFIG };
                                saveConfig();
                                location.reload(); // để toàn bộ UI tự đồng bộ lại đúng qua loadConfig() bình thường
                            }
                        }
                    ],
                    { title: t('common.appRecovery.restoreDefaultsTitle') }
                );
            });
        }
