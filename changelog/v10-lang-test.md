# Changelog — v10-lang-test: khung đa ngôn ngữ (i18n) cho toàn bộ app, English làm gốc, áp dụng thật vào mọi template/JS, thêm UI chọn/upload/xóa ngôn ngữ trong Settings.

> **⚠️ CẢNH BÁO (cùng tinh thần `v10-mini-not-full-fix.md`):** log này CHƯA qua test
> Playwright/browser thật — chỉ kiểm chứng bằng `node --check` (cú pháp) + test harness
> `vm`/`require` (mock IndexedDB, mock `idbKeyval`) cho phần logic thuần (`validateLanguagePack`,
> `saveLanguagePack`, `applySavedLanguage`, `listAvailableLanguages`, build template ra đúng
> HTML mong đợi). CHƯA test trên app thật chạy qua `file://` trong trình duyệt — cụ thể là CHƯA
> xác nhận: UI Settings mục "Ngôn ngữ" hiển thị/bấm đúng, upload file `.json` thật qua input,
> IndexedDB store `languages` mới (DB_VERSION 2→3) tự nâng cấp đúng trên DB cũ đã có dữ liệu thật
> (chỉ test bằng DB giả lập từ đầu, chưa test trên DB v2 có sẵn `songs`), và đặc biệt CHƯA xác
> nhận **`new Audio()`/`AudioContext`/canvas visualizer không bị ảnh hưởng gì** bởi việc `lang.js`
> giờ nạp NGAY ĐẦU `<body>` (trước cả `components/*.js`) — thay đổi thứ tự nạp script DUY NHẤT
> trong cả project, rủi ro cao nhất của bản này. Coi đây là bản "khung đã chạy đúng về logic",
> chưa phải bản chốt để dùng thật. Xem mục "Nợ kỹ thuật" ở cuối file.

---

## 1. Quyết định kiến trúc — vì sao English làm gốc, không phải tiếng Việt

**Bối cảnh:** yêu cầu ban đầu là "chuyển toàn bộ text sang JSON, có `lang.js` khai báo ngôn ngữ
mặc định". Bản đầu tiên đặt `vi` làm ngôn ngữ gốc (đúng theo `<html lang="vi">` của project), kèm
`en` cứng trong cùng file — nhưng bị chỉ ra 2 vấn đề:

1. **Lẫn lộn vai trò:** nếu cả `vi` và `en` đều nằm cứng trong `lang.js`, không có ranh giới rõ
   ràng "đây là dữ liệu gốc bất biến" với "đây là 1 bản dịch như mọi bản dịch khác do người dùng
   tự cung cấp" — sẽ rối khi cần build cơ chế diff/merge cho ngôn ngữ do người dùng upload.
2. **Khó kiểm tra cache:** vì `vi` là default và là text gốc đã quen mắt, khó phân biệt bằng mắt
   liệu cơ chế `t()` đã thực sự chạy hay trình duyệt đang hiển thị cache file `.js` cũ.

**Quyết định cuối:** `en` (311 key) nằm **cứng trong RAM** ngay trong `js/core/lang.js`
(`LANG_EN_KEYS`) — không qua fetch, không qua IndexedDB, luôn có sẵn làm điểm tựa/fallback cuối
cùng VÀ là nguồn key chuẩn duy nhất để validate mọi ngôn ngữ khác. **Mọi ngôn ngữ khác (kể cả
tiếng Việt) đều là dữ liệu do người dùng tự upload** — project chạy qua `file://`, không tự
`fetch()` được file json nào khác ngoài chính nó, nên không có ngôn ngữ "có sẵn cài cứng" nào khác
ngoài `en`. `lang/vi.json` (file mới, xem mục 4) chỉ là 1 bản mẫu để Giang tự test cơ chế upload —
**không** được app tự động nạp lúc khởi động.

Default tạm thời cho bản test này: `currentLangCode = 'en'` (`lang.js`, dòng khai báo) — để thấy
ngay UI đổi hẳn sang tiếng Anh, chắc chắn cơ chế đã chạy thật (không phải cache cũ). Đổi lại `'vi'`
làm default chỉ cần sửa giá trị khởi tạo của biến này — **nhưng vì `vi` không còn nằm cứng trong
RAM, đổi default sang `'vi'` nghĩa là phải tự `fetch()`/nạp sẵn `vi.json` vào IndexedDB lúc khởi
động lần đầu (chưa làm ở bản này) — nếu không, default `'vi'` sẽ không tìm thấy gì trong
IndexedDB và tự rơi về `en`.**

## 2. `js/core/lang.js` (mới) — bộ điều phối i18n trung tâm

**Cấu trúc:**
- `LANG_EN_KEYS` — object phẳng `"namespace.key": "value"`, 311 key.
- **Quy ước namespace:** tiền tố của mỗi key = tên biến `TPL_*` của chính file
  component/template chứa nó, bỏ `TPL_` rồi camelCase (ví dụ `TPL_SETTINGS_PLAYLIST_BG` ->
  `settingsPlaylistBg`). Namespace `common.*` dành riêng cho text runtime rời rạc phát sinh ở
  `core/*.js`+`playlist/*.js` (alert, label dựng động...), không gắn cố định với 1 template HTML
  cụ thể nào. Toàn bộ bảng tra cứu namespace nằm trong comment đầu file.
- **Quy ước placeholder:** key có chỗ cần chèn biến dùng `{n}`, `{done}`, `{total}`, `{message}`...
  — thay thế bằng `tFormat()`, KHÔNG dùng template literal dựng sẵn trong `lang.js` (giữ file này
  là dữ liệu thuần, không có code phát sinh chuỗi).

**Engine (đọc RAM, không cần IndexedDB):**
- `t(key, fallback?)` — tra theo `activeLangKeys` hiện tại -> không có thì fallback về
  `LANG_EN_KEYS` -> không có nữa thì trả về `fallback` hoặc chính `key` (không bao giờ hiện
  `"undefined"` ra UI dù thiếu key nào).
- `tFormat(key, vars)` — như `t()`, thay `{name}` bằng `vars.name` (string replace toàn bộ, không
  regex).

**Quản lý ngôn ngữ khác (cần `db.js`, xem mục 3 — nhưng định nghĩa hàm không cần `db.js` có mặt
ngay lúc parse, chỉ cần có mặt lúc hàm thực sự được GỌI):**
- `validateLanguagePack(rawKeys)` — đối chiếu 1 object key->value thô với `LANG_EN_KEYS`: key
  thiếu hoặc value không phải `string` -> lấy từ `LANG_EN_KEYS`; key thừa (không có trong
  `LANG_EN_KEYS`) -> cắt bỏ hẳn. Kết quả luôn có đúng 311 key, không hơn không kém.
- `saveLanguagePack(parsedJson)` — nhận object đã `JSON.parse()`, validate `meta.code` (string
  non-empty) + toàn bộ `keys` qua `validateLanguagePack()`, lưu IndexedDB store `languages` (key =
  `meta.code` — upload lại cùng mã GHI ĐÈ bản cũ, không tạo trùng). Trả về `{ok, code, name}` hoặc
  `{ok:false, reason}`.
- `applySavedLanguage(code)` — đổi `activeLangKeys`: `code='en'` quay về `LANG_EN_KEYS` ngay
  (không đọc IndexedDB); mã khác đọc từ store `languages`, không tìm thấy thì trả `false` (giữ
  nguyên ngôn ngữ hiện tại).
- `listAvailableLanguages()` — `en` (luôn đứng đầu) + mọi mã đã có trong IndexedDB.
- `applyLanguageToDom()` — quét `[data-i18n]`/`[data-i18n-title]`/`[data-i18n-placeholder]` trong
  DOM, gán lại theo `t()` — dùng để đổi ngôn ngữ KHÔNG CẦN reload trang.

**Vị trí nạp trong `index.html` — thay đổi cấu trúc lớn nhất của bản này:** `lang.js` nạp **ngay
đầu `<body>`, TRƯỚC TOÀN BỘ `components/*.js`** (bước 1 của thứ tự nạp gốc, xem
`readme/script-load-order.md`) — vì các template `TPL_*` gọi `t()` NGAY LÚC PARSE (template
literal cấp module, chạy đồng bộ ngay khi file được nạp, sớm hơn rất nhiều so với
`DOMContentLoaded`). Đây là lý do `t()`/`tFormat()` PHẢI tách biệt hoàn toàn khỏi `db.js` lúc định
nghĩa — `db.js` nạp sau đó nhiều (bước 3), nhưng các hàm cần nó
(`saveLanguagePack`/`applySavedLanguage`/`listAvailableLanguages`) chỉ thực sự gọi tới
`getLanguagePack`/`setLanguagePack`/... lúc người dùng tương tác (luôn sau khi toàn bộ trang đã
nạp xong), nên không vướng lỗi "gọi hàm chưa tồn tại".

## 3. `js/core/db.js` — thêm store `languages`

`DB_VERSION` 2 -> 3 để `onupgradeneeded` chạy lại, tự bổ sung store `languages` còn thiếu cho DB
cũ (v1/v2) — idempotent, **không đụng/không mất** dữ liệu `songs`/`meta` đã có (logic
`if (!db.objectStoreNames.contains(...))` giữ nguyên đúng pattern cũ, chỉ thêm 1 dòng check mới
cho store mới). Thêm 4 hàm CRUD: `getLanguagePack`/`setLanguagePack`/`deleteLanguagePack`/
`getAllLanguageCodes` — cùng pattern `makeStoreAccessor()` đã có sẵn cho `songsStore`/`metaStore`.

`en` **không** có record trong store này — nó không qua IndexedDB (xem mục 1, 2).

## 4. `lang/vi.json` (mới) — file ngôn ngữ mẫu để test cơ chế upload

Cấu trúc bắt buộc cho MỌI file ngôn ngữ người dùng upload (không riêng `vi.json` này):

```json
{
  "meta": { "code": "vi", "name": "Tiếng Việt" },
  "keys": { "playlistView.heading": "Bài hát", ... }
}
```

`meta.code` dùng làm key IndexedDB + hiển thị trong `<select>` (qua `meta.name`). `keys` — đúng
311 key khớp 100% với `LANG_EN_KEYS` (đã verify bằng script đối chiếu, xem mục "Đã kiểm chứng").
File này được dịch tay theo đúng nghĩa gốc tiếng Việt project đã dùng trước batch này, **không**
phải máy dịch ngược từ bản `en`.

Đây CHỈ là file mẫu nằm trong repo để Giang tự tải lên test qua UI Settings — app **không** tự
fetch/nạp file này lúc khởi động (xem mục 1).

## 5. UI Settings — section "Ngôn ngữ" (mới)

**`js/components/settings/language.js`** (mới, `TPL_SETTINGS_LANGUAGE`) — đặt SAU CÙNG trong
`SettingsDrawer.build()` (`settings-drawer.js`, sau section "Khác") vì là tính năng mới thêm,
không xáo trộn vị trí 5 section gốc. Icon "globe" (vòng kinh độ/vĩ độ), màu `cyan` (chưa dùng ở
section nào khác, xem khảo sát màu trước khi chọn). 3 phần:
- `<select id="setting-language-select">` — dựng `<option>` bằng JS (không hard-code tĩnh, vì danh
  sách phụ thuộc dữ liệu người dùng đã upload).
- Nút "Tải lên ngôn ngữ mới (.json)" — label bọc input ẩn, đúng pattern `setting-bg-upload`/
  `setting-video-upload` đã dùng ổn định ở `playlist-background.js` (input file cần click NATIVE
  thật qua label, không gọi `.click()` bằng JS).
- Nút "Xóa ngôn ngữ này" — chỉ HIỆN khi ngôn ngữ đang chọn KHÁC `en` (English luôn có sẵn, không
  thể xóa) — ẩn/hiện do JS tự bật/tắt theo lựa chọn hiện tại trong `<select>`.

**`js/core/language-settings.js`** (mới) — xử lý JS thật: `renderLanguageOptions()` (dựng lại
`<option>`, gọi lúc nạp script + sau mỗi lần upload/xóa thành công), listener `change` trên
`<select>` (gọi `applySavedLanguage()` + `applyLanguageToDom()` — đổi ngôn ngữ KHÔNG reload trang),
listener `change` trên input upload (đọc file qua `FileReader`, `JSON.parse()`, gọi
`saveLanguagePack()` + áp dụng ngay + thông báo), listener xóa (xác nhận qua `modalChoice()`, gọi
`deleteLanguagePack()` — nếu ngôn ngữ vừa xóa đang active thì tự quay về `en`).

## 6. Áp dụng `t()`/`tFormat()` thật vào toàn bộ template + JS động

Toàn bộ 17 file template (`components/` + `components/settings/`) và 12 file `core/`+`playlist/`
có text runtime (alert/modal/label dựng động) đã được sửa để gọi `t()`/`tFormat()` thay cho chuỗi
tiếng Việt hard-code — không còn 1 chuỗi UI tiếng Việt cứng nào sót lại trong code (đã quét lại
toàn bộ bằng regex tìm ký tự có dấu, chỉ còn comment kỹ thuật, không phải text hiển thị).

Mỗi vị trí trong template vừa có giá trị ban đầu = `${t('key')}` (để hiển thị đúng ngay từ lúc
script parse — không phải state rỗng chờ JS chạy), vừa có `data-i18n="key"` (để `applyLanguageToDom()`
quét lại được khi đổi ngôn ngữ không reload). Tổng cộng 208 attribute `data-i18n`/`data-i18n-title`/
`data-i18n-placeholder` rải trong các template.

File `js/core/visualizer-overlay.js` (đã ghi nhận là bản trùng/dư thừa, KHÔNG nằm trong
`<script src>` của `index.html`, xem nợ kỹ thuật mục 4 của `v10-mini-not-full-fix.md`) — **không
đụng tới** trong batch này, giữ đúng quyết định "dọn ở 1 lần sửa sau" đã ghi nhận trước đó.

## Đã kiểm chứng (chỉ qua `node --check` + test harness `vm`/`require` — CHƯA qua browser thật)

- `node --check` xác nhận cú pháp hợp lệ cho toàn bộ 34 file đã thêm/sửa.
- Đối chiếu bằng script: 303 key thực tế đang được gọi qua `t()`/`tFormat()` trong code đều đã
  khai báo trong `LANG_EN_KEYS`; `lang/vi.json` khớp 100% (311/311 key) với `LANG_EN_KEYS`, không
  thiếu không thừa.
- Build thử toàn bộ 17 biến `TPL_*` qua `vm.runInContext` (mock `document` không cần thiết ở bước
  này) — xác nhận không còn `${t(` chưa render sót lại trong HTML kết quả, text hiển thị đúng
  tiếng Anh theo default `en`.
- `validateLanguagePack()` test với object thiếu key/thừa key/value sai kiểu (number thay vì
  string) — xác nhận đúng hành vi: thiếu bù từ `en`, thừa bị cắt, sai kiểu coi như thiếu.
- `saveLanguagePack()` + `applySavedLanguage()` test full pipeline với chính file `lang/vi.json`
  thật (không phải dữ liệu giả lập) qua mock IndexedDB (đúng signature idb-keyval thật — nhận
  store dạng hàm `(txMode, callback) => Promise`, không phải object thường) — xác nhận: lưu đúng,
  áp dụng đúng (`t('playlistView.heading')` trả về `"Bài hát"` sau khi `applySavedLanguage('vi')`),
  key thiếu trong file tự fallback đúng về `en`, quay về `en` đúng, upload lại cùng mã `vi` GHI ĐÈ
  không tạo bản trùng trong `listAvailableLanguages()`, mã không tồn tại trả `false` và giữ nguyên
  ngôn ngữ hiện tại.

---

## Nợ kỹ thuật (chưa xong, cần làm tiếp)

1. **CHƯA test trên browser thật qua `file://`.** Toàn bộ kiểm chứng ở trên chạy bằng Node
   `vm`/`require`, mock `document`/`indexedDB`/`idbKeyval`. Rủi ro lớn nhất chưa loại trừ được:
   đổi vị trí nạp `lang.js` lên đầu `<body>` (trước mọi `components/*.js`, kể cả trước
   `audio-engine.js`/`canvas-scene-setup.js`/Three.js ở bước sau) có gây xung đột gì với cách
   trình duyệt thật parse/thực thi script tuần tự không — đặc biệt nếu có code nào ở các bước sau
   vô tình dựa vào thứ tự nạp cũ (trước khi `lang.js` chen vào đầu).
2. **Default `'vi'` chưa dùng được ngay** — như đã nói ở mục 1, vì `vi` không còn nằm cứng RAM,
   đổi `currentLangCode` thành `'vi'` mà không có cơ chế tự nạp `vi.json` vào IndexedDB lúc khởi
   động lần đầu (chưa viết) sẽ khiến app fallback về `en` (không tìm thấy gì trong store
   `languages`). Cần 1 trong 2 hướng ở phiên sau: (a) thêm bước tự động "nạp `vi.json` lần đầu nếu
   IndexedDB chưa có ngôn ngữ nào khác `en`", hoặc (b) Giang tự tay vào Settings upload
   `lang/vi.json` sau khi mở app lần đầu, rồi chọn nó trong `<select>` — cách này không cần sửa
   code gì thêm nhưng yêu cầu 1 bước tay mỗi khi setup máy/profile trình duyệt mới.
3. **UI Settings "Ngôn ngữ" CHƯA test bấm thật trên app** — `renderLanguageOptions()`/upload qua
   `<input type="file">` thật/xóa qua `modalChoice()` chỉ được suy luận đúng từ đọc code lại, chưa
   chạy qua 1 cú click nào trên trình duyệt thật.
4. **DB_VERSION 2->3 chưa test trên 1 DB v2 CÓ SẴN DỮ LIỆU THẬT** (bài hát/ảnh nền đã upload từ
   trước) — chỉ test bằng DB giả lập rỗng dựng từ đầu trong mock. Rủi ro thấp (logic
   `onupgradeneeded` chỉ thêm store mới, không đụng store cũ) nhưng chưa có bằng chứng thực tế.
5. **`common.unit.hour`/`common.unit.minute`/`common.unit.second`** (3 key trong `LANG_EN_KEYS`)
   hiện KHÔNG được code nào gọi tới trực tiếp (đã đối chiếu, xem mục "Đã kiểm chứng") — định nghĩa
   dự phòng từ thiết kế ban đầu, các chỗ hiển thị đơn vị thời gian thực tế đều dùng cụm có sẵn
   placeholder (`common.listenTime.*`/`common.durationLong.*`). Không gây lỗi gì (key dư không bị
   cắt vì không có cơ chế "unused key cleanup"), nhưng nên dọn ở 1 lần sửa sau nếu xác nhận chắc
   chắn không cần dùng riêng lẻ ở đâu.
6. **Tên file zip xuất ra (`nhac-da-luu-${dateStr}.zip`, `storage-manager.js`) CHƯA đổi theo ngôn
   ngữ** — quyết định có chủ đích giữ nguyên (tên file kỹ thuật, đổi theo ngôn ngữ có thể gây vấn
   đề ký tự đặc biệt trên một số hệ điều hành/trình duyệt khi tải file), nhưng ghi lại ở đây để
   Giang biết đây là lựa chọn có chủ đích, không phải sót.

---

## Tổng kết file thay đổi/thêm mới batch này

- **Mới:** `js/core/lang.js` (bộ điều phối i18n, xem mục 1–2), `js/core/language-settings.js`
  (xử lý UI chọn/upload/xóa ngôn ngữ, xem mục 5), `js/components/settings/language.js` (section
  "Ngôn ngữ" mới, xem mục 5), `lang/vi.json` (file ngôn ngữ mẫu để test, xem mục 4),
  `changelog/v10-lang-test.md` (file này).
- **Sửa:**
  - `index.html` — thêm `<script src="js/core/lang.js">` NGAY ĐẦU `<body>`, trước toàn bộ
    `components/*.js` (mục 2); thêm `js/components/settings/language.js` vào nhóm settings (trước
    `settings-drawer.js`); thêm `js/core/language-settings.js` vào nhóm core (sau `app-recovery.js`).
  - `js/core/db.js` — `DB_VERSION` 2→3, thêm store `languages` + 4 hàm CRUD (mục 3).
  - `js/components/settings-drawer.js` — thêm `TPL_SETTINGS_LANGUAGE` vào `SettingsDrawer.build()`
    (sau cùng, sau section "Khác", mục 5); text node header gọi `t('settingsDrawer.title')`.
  - 16 file template còn lại trong `components/` + `components/settings/` (`playlist-view.js`,
    `visualizer-overlay.js`, `subtitle-modal.js`, `bottom-player.js`, `loading-shield.js`,
    `playlist-background.js`, `visualizer-geometry-color.js`, `audio-eq.js`, `subtitle-style.js`,
    `misc.js`, `about-drawer.js`, `storage-drawer.js`, `visualizer-settings-drawer.js`,
    `subtitle-settings-drawer.js`) — toàn bộ text tĩnh chuyển sang `${t('key')}` + `data-i18n`
    (mục 6).
  - `js/core/player-controls.js` — modal "Tiếp tục nghe?" (`showResumeChoiceModal()`,
    `updateResumeModalTitleIfPending()`) dùng `t()`/`tFormat()`; 2 chỗ `withLoadingShield()` title
    (lưu/xóa ảnh nền) dùng key `common.loading.*` (mục 6).
  - `js/core/app-recovery.js` — 2 modal xác nhận ("Khởi động lại app"/"Khôi phục cài đặt mặc
    định") dùng `t()` (mục 6).
  - `js/core/config.js` — `_reportFatalError()` dùng `tFormat()`, có guard fallback nếu `tFormat`
    chưa tồn tại lúc lỗi xảy ra (mục 6).
  - `js/core/subtitles.js` — toàn bộ text trong `innerHTML` (nút Lưu/Xóa, placeholder, default
    text dòng mới) + alert export rỗng dùng `t()` (mục 6).
  - `js/core/storage-manager.js` — toàn bộ confirm/alert/loading-text (download+clear, quét/xóa
    file lỗi) dùng `t()`/`tFormat()` (mục 6).
  - `js/core/upload-validation.js` — `validateFileType()`/`validateAudioFile()`/
    `validateImageFile()`/`validateVideoFile()` dùng `t()`/`tFormat()` cho thông báo lỗi format
    (mục 6).
  - `js/core/id3-export.js` — `exportSongWithTag()` dùng `t()` (mục 6).
  - `js/core/listen-stats.js` — `formatListenTime()` dùng `tFormat()` với cụm
    `common.listenTime.*` (mục 6).
  - `js/core/about-stats.js` — `formatDurationLong()` dùng `tFormat()` với cụm
    `common.durationLong.*` (mục 6).
  - `js/core/state-and-video-bg.js` — 2 chỗ `withLoadingShield()` title (lưu/xóa video nền) dùng
    key `common.loading.*` (mục 6).
  - `js/playlist/loader.js` — toàn bộ alert lỗi upload (file/thư mục/generic) + loading-text dùng
    `t()`/`tFormat()` (mục 6).
  - `js/playlist/actions.js` — alert lỗi `playSong()`, `newTag` default values, 3 chỗ
    `withLoadingShield()` title, toàn bộ `openSongInfoModal()` (label từng dòng thông tin) dùng
    `t()`/`tFormat()` (mục 6).
  - `js/playlist/render.js` — title nút mở menu (`songActionMenuButtonHtml()`),
    `updatePlaylistLoading()` dùng `t()`/`tFormat()` (mục 6).
