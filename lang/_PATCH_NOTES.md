# Patch notes — tái cấu trúc /lang/ (Music Player v11)

## File MỚI (thêm vào project, copy đúng path tương đối trong zip này):
- lang/lang.js
- lang/language-settings.js
- lang/patch/patch-common.js
- lang/patch/patch-playlist.js
- lang/patch/patch-visualizer.js
- lang/patch/patch-subtitle-settings.js
- lang/patch/patch-settings-misc.js

## File ĐÃ SỬA (ghi đè lên file cùng tên trong project):
- index.html
  (chỉ sửa khối nạp i18n ở đầu <body>: thêm 5 dòng <script> patch trước lang.js, đổi
  src="js/core/lang.js" -> src="lang/lang.js", đổi src="js/core/language-settings.js" ->
  src="lang/language-settings.js". Không có thay đổi nào khác trong file này.)

## File CẦN TỰ XÓA tay khỏi project (không thể "xóa" qua zip patch):
- js/core/lang.js          (đã dời nội dung sang lang/lang.js + 5 file lang/patch/*.js)
- js/core/language-settings.js   (đã dời nguyên vẹn sang lang/language-settings.js)

## Đã kiểm chứng (xem test-lang.js, 42/42 PASS):
- 312 key trong LANG_EN_KEYS (gộp từ 5 patch bằng Object.assign) khớp NGUYÊN VẸN (không thiếu,
  không dư, không sai 1 ký tự nào) với object LANG_EN_KEYS gốc trong js/core/lang.js cũ.
- Thứ tự nạp giữa 5 file patch không ảnh hưởng kết quả (đã test nạp theo thứ tự XÁO TRỘN, không
  theo thứ tự filename).
- t(), tFormat(), validateLanguagePack(), saveLanguagePack(), applySavedLanguage(),
  listAvailableLanguages() hoạt động đúng 100% hành vi so với bản gốc.
- language-settings.js (đã dời sang /lang/) nạp sạch, không ReferenceError, renderLanguageOptions()
  vẫn tự render đúng <select> khi file vừa nạp.
- Toàn bộ 69 đường dẫn <script src="..."> trong index.html mới đều khớp đúng file tồn tại trên
  đĩa (lang/* ở vị trí mới, phần còn lại không đổi vị trí).
- Cấu trúc HTML không gãy: chính xác 76 cặp <script>...</script> hợp lệ trước và sau patch.

## CHƯA làm (nằm ngoài phạm vi cụm patch này — bàn riêng):
- Việc "đem /js/ về root" (core/, components/, playlist/, visualizers/ ra ngang hàng /lang/,
  /event/) — bạn đã chốt làm RIÊNG, SAU cụm /lang/ này, từng phần một.
