/**
 * event/workflow/file-manager.js — "THẰNG THỰC THI CUỐI" của router "fileManager".
 *
 * Cả 3 method đều ≥2 lời gọi side-effect nối tiếp (đổi state + patch DOM, có nơi thêm refresh tab
 * Song) -> LUÔN workflow theo event-bus-flow.md mục 4B, dù đơn giản.
 *
 * refreshSongTab() (tab Song) gọi THẲNG sang workflowFileManagerSong — 2 workflow phối hợp trực
 * tiếp (không qua eventBus.send()) vì đây là 1 hành động UI gắn chặt duy nhất ("mở File Manager" =
 * "mở khung" + "nạp nội dung tab mặc định"), không phải 2 nghiệp vụ độc lập cần tách rời qua bus.
 */
const workflowFileManager = {

    /** Ứng với 'fileManager.open'. */
    async openFileManager() {
        setFileManagerOpen(true);
        showFileManagerOverlay();
        const tab = appState.get('fileManagerActiveTab');
        renderActiveFileManagerTab(tab);
        if (tab === 'song') await workflowFileManagerSong.refreshSongTab();
    },

    /** Ứng với 'fileManager.close'. */
    closeFileManager() {
        setFileManagerOpen(false);
        hideFileManagerOverlay();
    },

    /** Ứng với 'fileManager.tab.switch'.
     * @param {string} tab
     */
    async switchFileManagerTab(tab) {
        setFileManagerActiveTab(tab);
        renderActiveFileManagerTab(tab);
        if (tab === 'song') await workflowFileManagerSong.refreshSongTab();
    }
};
