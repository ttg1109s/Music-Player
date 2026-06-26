/**
 * language-settings.js — Xử lý UI section "Ngôn ngữ" trong Settings (xem
 * js/components/settings/language.js). 3 việc: dựng <option> theo danh sách ngôn ngữ hiện có
 * (English cứng RAM + mọi ngôn ngữ đã upload trong IndexedDB), xử lý upload file .json mới (đọc +
 * validate + lưu qua saveLanguagePack() — lang.js), và xóa ngôn ngữ đang chọn (không cho xóa
 * English).
 *
 * PHẢI nạp SAU: dom-refs.js (cần settingLanguageSelect/settingLanguageUpload/settingLanguageDelete
 * đã có ref) + main.js (HTML thật đã chèn vào DOM), lang.js (cần saveLanguagePack/
 * applySavedLanguage/listAvailableLanguages/applyLanguageToDom/currentLangCode), db.js (cần
 * deleteLanguagePack), equalizer-settings.js KHÔNG cần (section này không đụng vizConfig),
 * modal-choice.js (cần modalChoice() để hỏi xác nhận trước khi xóa).
 */
        const settingLanguageSelect = document.getElementById('setting-language-select');
        const settingLanguageUpload = document.getElementById('setting-language-upload');
        const settingLanguageDelete = document.getElementById('setting-language-delete');

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

        if (settingLanguageSelect) {
            settingLanguageSelect.addEventListener('change', async (e) => {
                const code = e.target.value;
                const applied = await applySavedLanguage(code);
                if (applied) applyLanguageToDom();
                updateLanguageDeleteButtonVisibility();
            });
        }

        if (settingLanguageUpload) {
            settingLanguageUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                e.target.value = '';
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (evt) => {
                    let parsed;
                    try {
                        parsed = JSON.parse(evt.target.result);
                    } catch (err) {
                        alert(tFormat('settingsLanguage.upload.parseError', { message: err && err.message ? err.message : String(err) }));
                        return;
                    }
                    const result = await saveLanguagePack(parsed);
                    if (!result.ok) {
                        alert(t('settingsLanguage.upload.invalidFile'));
                        return;
                    }
                    await applySavedLanguage(result.code);
                    applyLanguageToDom();
                    await renderLanguageOptions();
                    alert(tFormat('settingsLanguage.upload.success', { name: result.name }));
                };
                reader.onerror = () => {
                    alert(tFormat('settingsLanguage.upload.parseError', { message: t('common.unknownError') }));
                };
                reader.readAsText(file);
            });
        }

        if (settingLanguageDelete) {
            settingLanguageDelete.addEventListener('click', () => {
                const code = settingLanguageSelect ? settingLanguageSelect.value : null;
                if (!code || code === 'en') { alert(t('settingsLanguage.cannotDeleteEnglish')); return; }
                const option = settingLanguageSelect.querySelector(`option[value="${code}"]`);
                const name = option ? option.textContent : code;
                modalChoice(
                    tFormat('settingsLanguage.delete.confirm', { name }),
                    [
                        {
                            label: t('common.cancel'),
                            className: 'flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition-colors',
                            onClick: () => {}
                        },
                        {
                            label: t('settingsLanguage.delete.label'),
                            className: 'flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold transition-colors',
                            onClick: async () => {
                                await deleteLanguagePack(code);
                                // Ngôn ngữ vừa xóa CHÍNH LÀ ngôn ngữ đang active -> quay về English
                                // ngay (không thể tiếp tục hiển thị 1 ngôn ngữ đã bị xóa khỏi DB).
                                if (currentLangCode === code) {
                                    await applySavedLanguage('en');
                                    applyLanguageToDom();
                                }
                                await renderLanguageOptions();
                            }
                        }
                    ],
                    { title: t('settingsLanguage.delete.label') }
                );
            });
        }

        // Dựng danh sách ngay khi script này nạp (không đợi mở Settings lần đầu) — section nằm
        // trong drawer ẨN SẴN lúc khởi động (display: none qua transform), nhưng <select> vẫn cần
        // có đúng <option> ngay từ đầu để hiện đúng giá trị nếu người dùng mở Settings ngay lập
        // tức sau khi trang load xong, không phải đợi 1 lượt click nào khác mới dựng.
        renderLanguageOptions();
