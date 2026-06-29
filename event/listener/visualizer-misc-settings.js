/**
 * event/listener/visualizer-misc-settings.js — TẤT CẢ listener của cụm
 * "visualizerMiscSettings".
 *
 * NẠP SAU: core/dom-refs.js (biến DOM), event/bus.js, event/router/visualizer-misc-settings.js.
 */

// ── Drawer Visualizer Settings ───────────────────────────────────────────────
if (btnOpenVisualizerSettings) {
    btnOpenVisualizerSettings.addEventListener('click', () => {
        eventBus.send({ router: 'visualizerMiscSettings', type: 'visualizerMiscSettings.openVisualizerDrawer.click', payload: {} });
    });
}

if (btnBackVisualizerSettings) {
    btnBackVisualizerSettings.addEventListener('click', () => {
        eventBus.send({ router: 'visualizerMiscSettings', type: 'visualizerMiscSettings.closeVisualizerDrawer.click', payload: {} });
    });
}

// ── Drawer Subtitle Settings ─────────────────────────────────────────────────
if (btnOpenSubtitleSettings) {
    btnOpenSubtitleSettings.addEventListener('click', () => {
        eventBus.send({ router: 'visualizerMiscSettings', type: 'visualizerMiscSettings.openSubtitleDrawer.click', payload: {} });
    });
}

if (btnBackSubtitleSettings) {
    btnBackSubtitleSettings.addEventListener('click', () => {
        eventBus.send({ router: 'visualizerMiscSettings', type: 'visualizerMiscSettings.closeSubtitleDrawer.click', payload: {} });
    });
}

// ── Đổi kiểu hiệu ứng ───────────────────────────────────────────────────────
if (typeof visualizerTypeSelect !== 'undefined' && visualizerTypeSelect) {
    visualizerTypeSelect.addEventListener('change', (e) => {
        eventBus.send({ router: 'visualizerMiscSettings', type: 'visualizerMiscSettings.visualizerType.change', payload: { value: e.target.value } });
    });
}

// ── Giữ màn hình sáng ────────────────────────────────────────────────────────
if (typeof keepScreenOnToggle !== 'undefined' && keepScreenOnToggle) {
    keepScreenOnToggle.addEventListener('change', (e) => {
        eventBus.send({ router: 'visualizerMiscSettings', type: 'visualizerMiscSettings.keepScreenOn.change', payload: { checked: e.target.checked } });
    });
}
