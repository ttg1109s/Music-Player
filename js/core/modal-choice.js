/**
 * modal-choice.js — Hàm dùng CHUNG để hiện 1 modal hỏi quyết định (text + N nút tuỳ biến), dùng
 * được cho NHIỀU tình huống khác nhau trong app (không riêng 1 case cụ thể nào).
 *
 * Ý TƯỞNG (theo đúng yêu cầu): KHÔNG dựng sẵn HTML cố định trong template tĩnh (kiểu
 * `playback-error-modal` ở playlist-view.js) — vì modal loại này không phải lúc nào cũng xuất
 * hiện, không cần giữ DOM tồn tại sẵn suốt đời app. Thay vào đó, `modalChoice()` tự DỰNG DOM
 * động ngay lúc gọi, gắn vào `document.body` (NGOÀI #app-root, không phụ thuộc timing mount của
 * main.js), và TỰ XOÁ HẲN khỏi DOM ngay sau khi người dùng chọn 1 nút — tiết kiệm RAM, không có
 * gì "treo" trong cây DOM giữa các lần dùng.
 *
 * CÁCH DÙNG:
 *   modalChoice(text, buttons)
 *     - text: chuỗi nội dung hỏi (hỗ trợ HTML đơn giản, ví dụ in đậm tên bài hát bằng <b>).
 *     - buttons: mảng các nút, mỗi nút { label, className, onClick }.
 *         - label:     chữ hiện trên nút.
 *         - className: class Tailwind cho riêng nút đó (màu sắc/kiểu — tự quyết định theo ngữ
 *                      cảnh dùng, ví dụ nút huỷ màu xám, nút phá hoại màu đỏ, nút chính màu xanh).
 *         - onClick:   hàm chạy khi bấm nút đó. Modal LUÔN tự đóng + xoá DOM ngay sau khi 1 nút
 *                      được bấm, TRƯỚC khi gọi onClick (đồng bộ) — đảm bảo onClick có thể tự do
 *                      mở modal/shield khác ngay trong nó mà không bị modal cũ còn sót lại.
 *   modalChoice(text, buttons, options?)
 *     - options.title: tiêu đề ngắn phía trên (tuỳ chọn, ví dụ "Đang phát tiếp?"). Nếu không cung
 *       cấp, modal chỉ hiện đúng `text` không có tiêu đề riêng.
 *     - options.dismissOnOverlayClick: true (mặc định false) cho phép bấm ra ngoài để đóng — gọi
 *       nút cuối cùng trong `buttons` (coi là hành động "huỷ"/mặc định an toàn nhất). Mặc định
 *       false vì hầu hết các quyết định loại này (xoá file, chọn tiếp tục nghe...) không nên đóng
 *       nhầm khi lỡ tay chạm ra ngoài.
 *   Mỗi phần tử trong `buttons` còn hỗ trợ thêm (tuỳ chọn, dùng khi cần khoá tạm 1 nút lúc mới mở
 *   modal — ví dụ chờ dữ liệu nào đó load xong mới cho bấm):
 *     - disabled:  true để nút này bắt đầu ở trạng thái khoá (disabled, thêm class mờ + cursor
 *                  not-allowed) — code gọi tự chịu trách nhiệm mở khoá lại sau (querySelector nút
 *                  qua dataset đã gán, xem `dataset` dưới đây).
 *     - dataset:   object {key: value} gán thẳng vào btnEl.dataset — dùng để code BÊN NGOÀI
 *                  modalChoice() (sau khi modal đã mở) có thể querySelector lại đúng nút cần mở
 *                  khoá/đổi trạng thái, vì modalChoice() không trả ra ref tới từng btnEl.
 *
 * KHÔNG dùng chung cơ chế với loading-shield (`withLoadingShield`, `js/core/loading-shield-util.js`)
 * — đã kiểm tra: loading-shield chỉ là spinner + 1 dòng text, không có chỗ cho nút bấm nào, sửa nó
 * để nhồi thêm nút sẽ làm rối mục đích gốc (chỉ để "che màn hình lúc xử lý xong dữ liệu trong bao
 * lâu", không phải hỏi quyết định). modalChoice() vì vậy là 1 component HOÀN TOÀN riêng, độc lập,
 * không đụng gì tới loading-shield.js/loading-shield-util.js.
 *
 * z-[130]: đứng trên mọi modal tĩnh hiện có (song-edit-modal/song-info-modal/playback-error-modal
 * đều z-[120]/z-[125]) — modal loại "quyết định" này cần luôn nổi trên cùng nếu cả 2 cùng xuất
 * hiện — nhưng vẫn DƯỚI loading-shield (z-[200], xem loading-shield.js) vì shield là trạng thái
 * "đang xử lý dữ liệu", ưu tiên cao hơn mọi hộp thoại hỏi người dùng.
 */
        function modalChoice(text, buttons, options) {
            options = options || {};
            // Tự đóng modalChoice cũ (nếu lỡ có, hiếm khi xảy ra vì mỗi lần đều xoá hẳn DOM ngay
            // sau khi chọn) — phòng trường hợp gọi modalChoice() chồng lệnh trước khi cái cũ đóng.
            const stale = document.getElementById('modal-choice-overlay');
            if (stale) stale.remove();

            const overlay = document.createElement('div');
            overlay.id = 'modal-choice-overlay';
            overlay.className = 'fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-center justify-center px-5';

            const card = document.createElement('div');
            card.className = 'bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-sm p-5 shadow-2xl flex flex-col gap-4';

            if (options.title) {
                const titleEl = document.createElement('h3');
                titleEl.className = 'text-base font-bold text-white';
                titleEl.textContent = options.title;
                card.appendChild(titleEl);
            }

            const textEl = document.createElement('p');
            textEl.className = 'text-sm text-slate-300 leading-relaxed';
            textEl.innerHTML = text; // cho phép <b>/<br> đơn giản (ví dụ in đậm tên bài hát) — nội dung luôn do code app tự dựng, không lấy trực tiếp từ input người dùng chưa qua escape
            textEl.id = 'modal-choice-text'; // cho phép code bên ngoài cập nhật lại nội dung sau khi mở (ví dụ thay tiêu đề tạm bằng tên bài thật khi load xong)
            card.appendChild(textEl);

            const buttonRow = document.createElement('div');
            buttonRow.className = 'flex gap-3 mt-1';

            function closeModal() {
                overlay.remove(); // xoá hẳn khỏi DOM ngay khi đóng — không giữ lại để tiết kiệm RAM
            }

            (buttons || []).forEach((btnDef) => {
                const btnEl = document.createElement('button');
                btnEl.className = btnDef.className || 'flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors';
                btnEl.textContent = btnDef.label;
                if (btnDef.dataset) Object.keys(btnDef.dataset).forEach(k => { btnEl.dataset[k] = btnDef.dataset[k]; });
                if (btnDef.disabled) {
                    btnEl.disabled = true;
                    btnEl.classList.add('opacity-40', 'cursor-not-allowed');
                }
                btnEl.addEventListener('click', () => {
                    closeModal();
                    if (typeof btnDef.onClick === 'function') btnDef.onClick();
                });
                buttonRow.appendChild(btnEl);
            });

            card.appendChild(buttonRow);
            overlay.appendChild(card);

            if (options.dismissOnOverlayClick) {
                overlay.addEventListener('click', (e) => {
                    if (e.target !== overlay) return; // chỉ tính click ĐÚNG lên overlay, không phải lên card/nút bên trong
                    const fallbackBtn = buttons && buttons[buttons.length - 1];
                    closeModal();
                    if (fallbackBtn && typeof fallbackBtn.onClick === 'function') fallbackBtn.onClick();
                });
            }

            document.body.appendChild(overlay);
            return closeModal; // trả về hàm đóng, phòng trường hợp code gọi cần tự đóng modal sớm hơn (hiếm dùng)
        }
