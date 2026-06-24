/**
 * Utility dùng chung: withLoadingShield(text, fn) — che màn hình khi đang xử lý, tự khoá
 * mọi tác vụ chồng lệnh qua biến isShieldBusy (xem PLAN_INDEXEDDB.md mục 5).
 * PHẢI nạp sau khi #loading-shield/#loading-text đã có trong DOM (sau main.js, cùng nhóm
 * core đầu tiên — đặt cạnh db.js).
 */
        let isShieldBusy = false;
        const SHIELD_FADE_MS = 200; // khớp duration-200 trong CSS của #loading-shield

        async function withLoadingShield(text, fn) {
            if (isShieldBusy) return; // đang có tác vụ khác dùng shield — bỏ qua lệnh gọi chồng (im lặng)
            isShieldBusy = true;

            loadingText.textContent = text;
            loadingShield.classList.remove('opacity-0', 'pointer-events-none');
            loadingShield.classList.add('opacity-100', 'pointer-events-auto');

            try {
                return await fn();
            } finally {
                loadingShield.classList.remove('opacity-100');
                loadingShield.classList.add('opacity-0');
                // Chờ fade-out kết thúc HẲN rồi mới mở khoá — không cho thao tác tiếp trong lúc
                // đang còn mờ dần, chỉ mở khi đã tắt hoàn toàn.
                await new Promise(resolve => setTimeout(resolve, SHIELD_FADE_MS));
                loadingShield.classList.add('pointer-events-none');
                isShieldBusy = false;
            }
        }
