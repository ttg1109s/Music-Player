/**
 * Logo "SAV" — mở/thu chữ khi hover (desktop, chuột thật) hoặc tap (mobile/cảm ứng).
 *
 * 2 CHIẾN LƯỢC LOẠI TRỪ NHAU, chọn lúc nạp trang qua matchMedia('(hover: hover) and (pointer:
 * fine)') — KHÔNG đổi lại khi xoay máy/đổi thiết bị input giữa phiên:
 *   - Desktop (hover thật): mouseenter/mouseleave, hover tự nhiên.
 *   - Mobile/cảm ứng: 'mouseleave' KHÔNG đáng tin trên cảm ứng (WebKit chỉ giả lập mouseenter khi
 *     tap, không bao giờ tự bắn mouseleave khi tap sang chỗ khác — xem WebKit bug #128534 về
 *     mouseenter không ổn định khi có touch listener). Dùng 'click' trên logo để TOGGLE, + 'click'
 *     ở CẤP DOCUMENT để tự thu khi bấm ra ngoài (cùng pattern overlay khác trong app).
 *
 * ÁP DỤNG /event/ (cụm "savLogo"): `addEventListener` cũ đã CHUYỂN sang event/listener/sav-logo.js
 * + event/router/sav-logo.js (gọi thẳng, không cần workflow). DOM ref (savLogo) lấy từ
 * core/dom-refs.js theo đúng quy ước.
 */
        const savLogoExpandSpans = savLogo ? Array.from(savLogo.querySelectorAll('.sav-logo-expand')) : [];

        /** Core thuần: mở/thu chữ logo theo giá trị `expand`. */
        function setSavLogoExpanded(expand) {
            if (!savLogo) return;
            appState.set('savLogoExpanded', expand);
            savLogoExpandSpans.forEach(span => {
                span.style.maxWidth = expand ? (span.dataset.expandWidth || '0') : '0';
            });
        }

        /** Core thuần: có phải thiết bị hover thật (desktop, chuột) không — dùng để router/listener
         *  quyết định gắn nhánh nào lúc nạp trang. */
        function hasRealHoverDevice() {
            return !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
        }
