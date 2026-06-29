/**
 * event/listener/subtitle-modal.js — TẤT CẢ listener của cụm "subtitleModal".
 *
 * 3 nút Sửa/Lưu/Xóa (render động trong renderSubList()) dùng 1 LISTENER DELEGATION DUY NHẤT trên
 * subListContainer (phần tử cố định, sống suốt đời trang) — đọc data-action/data-sub-id qua
 * e.target.closest(), KHÔNG gắn add/removeEventListener riêng cho mỗi item render ra (xem mục
 * 2b.8 plan.md).
 *
 * btnSubtitle/btnCloseSubModal (mở/đóng modal) — MỚI thêm vào đây, TRƯỚC ĐÂY "lạc" trong
 * core/equalizer-settings.js (đã xoá).
 */
if (btnSubtitle) {
    btnSubtitle.addEventListener('click', () => {
        eventBus.send({ router: 'subtitleModal', type: 'subtitleModal.openModal.click', payload: {} });
    });
}

if (btnCloseSubModal) {
    btnCloseSubModal.addEventListener('click', () => {
        eventBus.send({ router: 'subtitleModal', type: 'subtitleModal.closeModal.click', payload: {} });
    });
}

if (subListContainer) {
    subListContainer.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        const action = target.dataset.action;
        const id = target.dataset.subId;
        if (action === 'edit-sub') {
            eventBus.send({ router: 'subtitleModal', type: 'subtitleModal.editSub.click', payload: { id } });
        } else if (action === 'save-sub') {
            eventBus.send({ router: 'subtitleModal', type: 'subtitleModal.saveSub.click', payload: { id } });
        } else if (action === 'delete-sub') {
            eventBus.send({ router: 'subtitleModal', type: 'subtitleModal.deleteSub.click', payload: { id } });
        }
    });
}

if (btnAutoTiming) {
    btnAutoTiming.addEventListener('click', () => {
        eventBus.send({ router: 'subtitleModal', type: 'subtitleModal.autoTiming.click', payload: {} });
    });
}

if (btnAddSub) {
    btnAddSub.addEventListener('click', () => {
        eventBus.send({ router: 'subtitleModal', type: 'subtitleModal.addLine.click', payload: {} });
    });
}

if (btnExportSrt) {
    btnExportSrt.addEventListener('click', () => {
        eventBus.send({ router: 'subtitleModal', type: 'subtitleModal.exportSrt.click', payload: {} });
    });
}

if (srtUpload) {
    srtUpload.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        eventBus.send({ router: 'subtitleModal', type: 'subtitleModal.importSrt.change', payload: { file } });
    });
}

if (btnApplySub) {
    btnApplySub.addEventListener('click', () => {
        eventBus.send({ router: 'subtitleModal', type: 'subtitleModal.apply.click', payload: {} });
    });
}
