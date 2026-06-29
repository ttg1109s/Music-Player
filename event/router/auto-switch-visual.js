/**
 * event/router/auto-switch-visual.js — Router tên "autoSwitchVisual".
 *
 * Cả 4 msg.type chỉ cần ĐÚNG 1 hàm core (setAutoSwitchVisualEnabled/Mode/TimeMode/SecondsField,
 * xem core/auto-switch-visual.js) -> gọi THẲNG, KHÔNG có event/workflow/auto-switch-visual.js.
 * KHÔNG giữ state context riêng.
 */
const routerAutoSwitchVisual = (() => {
    function handle(msg) {
        switch (msg.type) {
            case 'autoSwitchVisual.enable.change':
                setAutoSwitchVisualEnabled(msg.payload.checked);
                break;
            case 'autoSwitchVisual.mode.change':
                setAutoSwitchVisualMode(msg.payload.value);
                break;
            case 'autoSwitchVisual.timeMode.change':
                setAutoSwitchVisualTimeMode(msg.payload.value);
                break;
            case 'autoSwitchVisual.secondsField.change':
                setAutoSwitchVisualSecondsField(msg.payload.fieldName, msg.payload.rawValue, msg.payload.inputEl);
                break;
            default:
                console.warn(`[routerAutoSwitchVisual] msg.type không xác định: "${msg.type}"`, msg);
        }
    }

    return { handle };
})();

eventBus.register('autoSwitchVisual', routerAutoSwitchVisual);
