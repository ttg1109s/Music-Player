/**
 * event/router/stats-panel.js — Router cho cụm "Stats Panel Toggle" (dải BPM/Pitch/Energy).
 *
 * Chỉ 1 msg.type, chỉ cần đúng 1 hàm core (toggleStatsPanelVisibility(), xem
 * core/stats-panel-toggle.js) -> gọi THẲNG, KHÔNG có event/workflow/stats-panel.js (đúng mục 2
 * quy tắc 2: nghiệp vụ chỉ cần 1 hàm core thì router tự gọi thẳng, bỏ qua workflow hoàn toàn).
 * KHÔNG giữ state context riêng (isStatsPanelVisible là global ở core, không phải state context
 * của router — xem mục 2b.1).
 */
const routerStatsPanel = (() => {
    function handle(msg) {
        switch (msg.type) {
            case 'statsPanel.toggle.click':
                toggleStatsPanelVisibility();
                break;
            default:
                console.warn(`[routerStatsPanel] msg.type không xác định: "${msg.type}"`, msg);
        }
    }

    return { handle };
})();

eventBus.register('statsPanel', routerStatsPanel);
