/**
 * event/listener/auto-switch-visual.js — TẤT CẢ listener của cụm "autoSwitchVisual".
 *
 * KHÔNG cần cờ "chỉ gắn 1 lần" như _autoSwitchVisualUiBound cũ nữa — file /event/ này chỉ nạp
 * ĐÚNG 1 LẦN lúc khởi động app (khác initAutoSwitchVisualUI() ở core, vẫn được gọi lại mỗi lần
 * loadConfig() chỉ để ĐỒNG BỘ GIÁ TRỊ HIỂN THỊ, không gắn listener nữa).
 */
if (elAutoSwitchEnable) {
    elAutoSwitchEnable.addEventListener('change', (e) => {
        eventBus.send({ router: 'autoSwitchVisual', type: 'autoSwitchVisual.enable.change', payload: { checked: e.target.checked } });
    });
}

if (elAutoSwitchMode) {
    elAutoSwitchMode.addEventListener('change', (e) => {
        eventBus.send({ router: 'autoSwitchVisual', type: 'autoSwitchVisual.mode.change', payload: { value: e.target.value } });
    });
}

if (elAutoSwitchTimeMode) {
    elAutoSwitchTimeMode.addEventListener('change', (e) => {
        eventBus.send({ router: 'autoSwitchVisual', type: 'autoSwitchVisual.timeMode.change', payload: { value: e.target.value } });
    });
}

/** Factory: tạo handler riêng cho 1 field cụ thể — mỗi input gửi đúng fieldName của NÓ. */
function makeAutoSwitchSecondsInputListener(fieldName) {
    return (e) => {
        eventBus.send({
            router: 'autoSwitchVisual',
            type: 'autoSwitchVisual.secondsField.change',
            payload: { fieldName, rawValue: e.target.value, inputEl: e.target }
        });
    };
}

if (elAutoSwitchSecondsFixed) elAutoSwitchSecondsFixed.addEventListener('change', makeAutoSwitchSecondsInputListener('autoSwitchVisualSecondsFixed'));
if (elAutoSwitchSecondsRandom) elAutoSwitchSecondsRandom.addEventListener('change', makeAutoSwitchSecondsInputListener('autoSwitchVisualSecondsRandom'));
if (elAutoSwitchSecondsDuration) elAutoSwitchSecondsDuration.addEventListener('change', makeAutoSwitchSecondsInputListener('autoSwitchVisualSecondsDuration'));
