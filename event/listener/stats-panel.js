/**
 * event/listener/stats-panel.js — Đăng ký DOM listener cho cụm "Stats Panel Toggle".
 *
 * Chỉ gửi message qua eventBus, KHÔNG biết/không quan tâm nội dung nghiệp vụ bên trong. Dùng
 * biến DOM có sẵn từ dom-refs.js (btnToggleStatsPanel), không tự document.getElementById().
 */
if (typeof btnToggleStatsPanel !== 'undefined' && btnToggleStatsPanel) {
    btnToggleStatsPanel.addEventListener('click', () => {
        eventBus.send({ router: 'statsPanel', type: 'statsPanel.toggle.click', payload: {} });
    });
}
