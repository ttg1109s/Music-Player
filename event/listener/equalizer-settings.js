/**
 * event/listener/equalizer-settings.js — TẤT CẢ listener của cụm "equalizerSettings".
 *
 * 1 delegation duy nhất trên eqSlidersWrapper (phần tử cha cố định) — bắt tất cả sự kiện
 * 'input' từ 10 slider con (.eq-slider), đọc data-index để xác định băng tần.
 * Thay cho 10 listener riêng lẻ gắn trong vòng lặp initEQSliders() (đã xoá).
 *
 * NẠP SAU: core/dom-refs.js (eqSlidersWrapper), event/bus.js,
 *           event/router/equalizer-settings.js.
 */
if (eqSlidersWrapper) {
    eqSlidersWrapper.addEventListener('input', (e) => {
        const slider = e.target.closest('.eq-slider');
        if (!slider) return;
        const index = parseInt(slider.dataset.index, 10);
        if (isNaN(index)) return;
        const value = parseFloat(slider.value);
        eventBus.send({
            router: 'equalizerSettings',
            type: 'equalizerSettings.band.input',
            payload: { index, value }
        });
    });
}
