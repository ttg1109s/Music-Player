/**
 * event/router/visualizer-control-center.js — Router tên "visualizerControlCenter".
 *
 * QUY TẮC RẼ NHÁNH:
 *   - returnToVisualizer/controlCenter.toggle/controlCenter.overlayClick/controlCenter.gridClick/
 *     visualEnable.change CHỈ CẦN 1 hàm core -> gọi THẲNG.
 *   - videoEnable.change/videoUpload.change CẦN shield/modal -> giao workflow.
 * KHÔNG giữ state context riêng.
 */
const routerVisualizerControlCenter = (() => {
    function handle(msg) {
        switch (msg.type) {

            case 'visualizerControlCenter.returnToVisualizer.click':
                returnToVisualizer();
                break;

            case 'visualizerControlCenter.toggle.click':
                toggleControlCenter();
                break;

            case 'visualizerControlCenter.overlay.click':
                closeControlCenter();
                break;

            case 'visualizerControlCenter.gridClick':
                handleControlCenterGridClick(msg.payload.target);
                break;

            case 'visualizerControlCenter.videoEnable.change': {
                if (msg.payload.checked) {
                    enableVideoBackground();
                } else {
                    workflowVisualizerControlCenter.disableVideoBackground();
                }
                break;
            }

            case 'visualizerControlCenter.visualEnable.change':
                setVisualEnabled(msg.payload.checked);
                break;

            case 'visualizerControlCenter.videoUpload.change':
                workflowVisualizerControlCenter.uploadVideoBackground({ file: msg.payload.file });
                break;

            default:
                console.warn(`[routerVisualizerControlCenter] msg.type không xác định: "${msg.type}"`, msg);
        }
    }

    return { handle };
})();

eventBus.register('visualizerControlCenter', routerVisualizerControlCenter);
