/**
 * event/router/visualizer-misc-settings.js — Router tên "visualizerMiscSettings".
 *
 * Xử lý 6 listener từ core/visualizer/visualizer-misc-settings.js (đã dọn sạch):
 *   - 4 nút mở/đóng drawer Visualizer Settings / Subtitle Settings
 *   - visualizerTypeSelect.change (đổi kiểu hiệu ứng)
 *   - keepScreenOnToggle.change (bật/tắt giữ màn hình sáng)
 *
 * Toàn bộ 6 msg.type chỉ cần gọi thẳng hàm core — KHÔNG có shield/modal — không cần workflow.
 *
 * NẠP SAU: event/bus.js, core/visualizer/visualizer-display.js (updateTypeUI),
 *           core/config.js (saveConfig, vizConfig, MODES, currentModeIndex),
 *           core/wakelock.js (requestWakeLock, releaseWakeLock).
 * NẠP TRƯỚC: event/listener/visualizer-misc-settings.js.
 */
const routerVisualizerMiscSettings = (() => {
    /** @param {import('../bus.js').EventMessage} msg */
    function handle(msg) {
        switch (msg.type) {

            // ── Drawer Visualizer Settings ───────────────────────────────────
            case 'visualizerMiscSettings.openVisualizerDrawer.click':
                drawerVisualizerSettings.classList.remove('translate-y-full');
                break;

            case 'visualizerMiscSettings.closeVisualizerDrawer.click':
                drawerVisualizerSettings.classList.add('translate-y-full');
                break;

            // ── Drawer Subtitle Settings ─────────────────────────────────────
            case 'visualizerMiscSettings.openSubtitleDrawer.click':
                drawerSubtitleSettings.classList.remove('translate-y-full');
                break;

            case 'visualizerMiscSettings.closeSubtitleDrawer.click':
                drawerSubtitleSettings.classList.add('translate-y-full');
                break;

            // ── Đổi kiểu hiệu ứng ───────────────────────────────────────────
            case 'visualizerMiscSettings.visualizerType.change': {
                const idx = MODES.indexOf(msg.payload.value);
                if (idx === -1) break;
                currentModeIndex = idx;
                updateTypeUI();
                saveConfig();
                break;
            }

            // ── Giữ màn hình sáng ────────────────────────────────────────────
            case 'visualizerMiscSettings.keepScreenOn.change': {
                vizConfig.keepScreenOn = msg.payload.checked;
                saveConfig();
                if (vizConfig.keepScreenOn) {
                    if (typeof audioPlayer !== 'undefined' && !audioPlayer.paused) requestWakeLock();
                } else {
                    releaseWakeLock();
                }
                break;
            }

            default:
                console.warn(`[routerVisualizerMiscSettings] msg.type không xác định: "${msg.type}"`, msg);
        }
    }

    return { handle };
})();

eventBus.register('visualizerMiscSettings', routerVisualizerMiscSettings);
