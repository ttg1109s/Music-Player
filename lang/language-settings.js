/**
 * language-settings.js — 3 hàm core cho UI section "Ngôn ngữ" trong Settings (xem
 * js/components/settings/language.js): dựng <option> theo danh sách ngôn ngữ hiện có, xử lý
 * chọn ngôn ngữ trong <select>, xử lý upload file .json mới, xóa ngôn ngữ đang chọn.
 *
 * ÁP DỤNG /event/ (cụm "languageSettings"): `addEventListener` cũ đã CHUYỂN sang
 * event/listener/language-settings.js. Nhánh xóa cần modal xác nhận -> đặt ở
 * event/workflow/language-settings.js (core không biết modalChoice/alertModal tồn tại). DOM ref
 * (settingLanguageSelect/Upload/Delete) đã dọn về core/dom-refs.js.
 *
 * PHẢI nạp SAU: lang.js (cần saveLanguagePack/applySavedLanguage/listAvailableLanguages/
 * applyLanguageToDom/currentLangCode), db.js (cần deleteLanguagePack).
 */
        /**
         * Dựng lại toàn bộ <option> trong <select> theo danh sách ngôn ngữ hiện có (English +
         * mọi ngôn ngữ đã upload trong IndexedDB) — gọi lúc mở Settings lần đầu VÀ sau mỗi lần
         * upload/xóa thành công để danh sách luôn khớp dữ liệu thật.
         */
        async function renderLanguageOptions() {
            if (!settingLanguageSelect) return;
            const list = await listAvailableLanguages();
            settingLanguageSelect.innerHTML = '';
            for (const lang of list) {
                const opt = document.createElement('option');
                opt.value = lang.code;
                opt.textContent = lang.name;
                settingLanguageSelect.appendChild(opt);
            }
            settingLanguageSelect.value = currentLangCode;
            updateLanguageDeleteButtonVisibility();
        }

        /** Nút "Xóa ngôn ngữ này" chỉ hiện khi ngôn ngữ ĐANG CHỌN trong <select> khác 'en'. */
        function updateLanguageDeleteButtonVisibility() {
            if (!settingLanguageSelect || !settingLanguageDelete) return;
            const selected = settingLanguageSelect.value;
            settingLanguageDelete.classList.toggle('hidden', selected === 'en');
        }

        /** Core thuần: áp dụng ngôn ngữ vừa chọn trong <select>. */
        async function selectLanguage(code) {
            const applied = await applySavedLanguage(code);
            if (applied) applyLanguageToDom();
            updateLanguageDeleteButtonVisibility();
        }

        /** Core thuần: đọc + parse + lưu 1 file .json ngôn ngữ vừa upload, trả {status, ...} rõ
         *  ràng — KHÔNG tự alertModal (đặt ở workflow). resolve KHÔNG BAO GIỜ reject cho lỗi
         *  nghiệp vụ đã biết trước (parse lỗi/file không hợp lệ/đọc file lỗi). */
        function readAndSaveLanguageFile(file) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = async (evt) => {
                    let parsed;
                    try {
                        parsed = JSON.parse(evt.target.result);
                    } catch (err) {
                        resolve({ status: 'parseError', message: err && err.message ? err.message : String(err) });
                        return;
                    }
                    const result = await saveLanguagePack(parsed);
                    if (!result.ok) {
                        resolve({ status: 'invalidFile' });
                        return;
                    }
                    await applySavedLanguage(result.code);
                    applyLanguageToDom();
                    await renderLanguageOptions();
                    resolve({ status: 'success', name: result.name });
                };
                reader.onerror = () => {
                    resolve({ status: 'parseError', message: null }); // null -> workflow tự dùng t('common.unknownError')
                };
                reader.readAsText(file);
            });
        }

        /** Core thuần: thực thi xóa ngôn ngữ theo code đã xác nhận. */
        async function deleteLanguageByCode(code) {
            await deleteLanguagePack(code);
            // Ngôn ngữ vừa xóa CHÍNH LÀ ngôn ngữ đang active -> quay về English ngay (không thể
            // tiếp tục hiển thị 1 ngôn ngữ đã bị xóa khỏi DB).
            if (currentLangCode === code) {
                await applySavedLanguage('en');
                applyLanguageToDom();
            }
            await renderLanguageOptions();
        }

        // Dựng danh sách ngay khi script này nạp (không đợi mở Settings lần đầu) — section nằm
        // trong drawer ẨN SẴN lúc khởi động (display: none qua transform), nhưng <select> vẫn cần
        // có đúng <option> ngay từ đầu để hiện đúng giá trị nếu người dùng mở Settings ngay lập
        // tức sau khi trang load xong, không phải đợi 1 lượt click nào khác mới dựng.
        renderLanguageOptions();
