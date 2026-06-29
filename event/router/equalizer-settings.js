/**
 * event/router/equalizer-settings.js — Router tên "equalizerSettings".
 *
 * Xử lý tương tác slider EQ (10 băng tần) qua delegation từ eqSlidersWrapper.
 * Chỉ có 1 msg.type duy nhất: 'equalizerSettings.band.input'.
 *
 * Gọi thẳng — không cần workflow (không có shield/modal).
 *
 * NẠP SAU: event/bus.js, core/config.js (vizConfig, saveConfig, eqBandNodes),
 *           core/dom-refs.js (eqSelect).
 * NẠP TRƯỚC: event/listener/equalizer-settings.js.
 */
const routerEqualizerSettings = (() => {
    /** @param {import('../bus.js').EventMessage} msg */
    function handle(msg) {
        switch (msg.type) {

            case 'equalizerSettings.band.input': {
                const { index, value } = msg.payload;
                const valEl = document.getElementById(`eq-val-${index}`);
                if (valEl) valEl.textContent = value > 0 ? `+${value}` : value;
                vizConfig.manualEq[index] = value;
                if (vizConfig.eqMode !== 'manual') {
                    vizConfig.eqMode = 'manual';
                    eqSelect.value = 'manual';
                }
                if (eqBandNodes[index]) eqBandNodes[index].gain.value = value;
                saveConfig();
                break;
            }

            default:
                console.warn(`[routerEqualizerSettings] msg.type không xác định: "${msg.type}"`, msg);
        }
    }

    return { handle };
})();

eventBus.register('equalizerSettings', routerEqualizerSettings);
