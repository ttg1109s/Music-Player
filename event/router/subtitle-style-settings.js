/**
 * event/router/subtitle-style-settings.js — Router tên "subtitleStyleSettings".
 *
 * Cả 9 msg.type đều chỉ cần ĐÚNG 1 hàm core (xem core/subtitle/subtitle-style-settings.js) ->
 * gọi THẲNG, KHÔNG có event/workflow/subtitle-style-settings.js. KHÔNG giữ state context riêng.
 */
const routerSubtitleStyleSettings = (() => {
    function handle(msg) {
        switch (msg.type) {
            case 'subtitleStyleSettings.enable.change':
                setSubtitlesEnabled(msg.payload.checked);
                break;
            case 'subtitleStyleSettings.bgColor.input':
                setSubtitleStyleBgColor(msg.payload.value);
                break;
            case 'subtitleStyleSettings.bgOpacity.input':
                setSubtitleStyleBgOpacity(msg.payload.rawValue);
                break;
            case 'subtitleStyleSettings.borderColor.input':
                setSubtitleStyleBorderColor(msg.payload.value);
                break;
            case 'subtitleStyleSettings.borderOpacity.input':
                setSubtitleStyleBorderOpacity(msg.payload.rawValue);
                break;
            case 'subtitleStyleSettings.borderWidth.input':
                setSubtitleStyleBorderWidth(msg.payload.rawValue);
                break;
            case 'subtitleStyleSettings.borderRadius.input':
                setSubtitleStyleBorderRadius(msg.payload.rawValue);
                break;
            case 'subtitleStyleSettings.textColor.input':
                setSubtitleStyleTextColor(msg.payload.value);
                break;
            case 'subtitleStyleSettings.fontSize.input':
                setSubtitleStyleFontSize(msg.payload.rawValue);
                break;
            case 'subtitleStyleSettings.lineHeight.input':
                setSubtitleStyleLineHeight(msg.payload.rawValue);
                break;
            case 'subtitleStyleSettings.letterSpacing.input':
                setSubtitleStyleLetterSpacing(msg.payload.rawValue);
                break;
            default:
                console.warn(`[routerSubtitleStyleSettings] msg.type không xác định: "${msg.type}"`, msg);
        }
    }

    return { handle };
})();

eventBus.register('subtitleStyleSettings', routerSubtitleStyleSettings);
