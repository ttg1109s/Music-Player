# Plan ver 12 — "Multi Media (Song First)"

> Đây là PLAN — chưa code gì. Mục đích: dịch yêu cầu thô thành việc cụ thể, đối chiếu đúng kiến
> trúc hiện có (`event-bus-flow.md`, `core-function-conventions.md`, `where-to-edit.md`,
> `lang/lang.js`), và liệt kê rõ những chỗ CHƯA đủ thông tin để code ngay — tránh vừa code vừa đoán.

## 0. Nguyên tắc bắt buộc — áp dụng cho MỌI mục bên dưới, không ngoại lệ

Trước khi viết bất kỳ dòng code nào của plan này:

1. **Kiến trúc `/event/`** — mọi hành vi bấm nút/đổi input đi qua đúng
   `listener → bus → router → (core thẳng | workflow | VirtualMachineState)` (xem
   `event-bus-flow.md`). Tính năng mới = cụm mới hoặc mở rộng cụm cũ, KHÔNG viết tắt qua listener.
2. **Core/nghiệp vụ** — mọi function core MỚI (bất kể thuộc hạ tầng hay tính năng) tuân 4 rule ở
   `core-function-conventions.md`: đơn tuyến, không tự đọc `appState`, core-gọi-core chỉ hợp lệ
   khi dùng return value (log `sender/callTo/request`), set/mutate state phải log
   `writer/page/content`. Không có ngoại lệ "vì đây là tính năng mới nên thôi".
3. **`lang/lang.js`** — MỌI text hiển thị cho người dùng qua `t()`/`tFormat()`, namespace theo
   đúng tên biến `TPL_*` (bỏ tiền tố `TPL_`, camelCase). Không hardcode chuỗi tiếng Việt/Anh thẳng
   trong template hay core.
4. **`where-to-edit.md`** — thêm 1 cụm nghiệp vụ mới bắt buộc đủ 3 file (`router`/`listener`, thêm
   `workflow` nếu cần) + đăng ký đúng thứ tự `<script>` cuối `index.html`.

## 1. Đặt tên & phạm vi

- **Tên bản: ver 12 — "Multi Media (Song First)"** — đổi tiêu đề trang + `changelog-index.md`.
- **`changelog/v12.md` rút gọn còn đúng mục 1–3** (Vấn đề xuất phát / Giải pháp / Vì sao an toàn
  khi nạp mà chưa dùng — phần hạ tầng `block.js`/`virtual-machine-state.js`/`operation.js`) +
  **thêm các mục mới cho tính năng Multi Media** dưới đây. Mục 4–7 cũ (chi tiết `index.html`,
  tóm tắt `core-function-conventions.md`/`core-legacy-audit.md`/`folder-structure.md`) **bỏ khỏi
  v12.md** — nội dung đó đã có nguyên vẹn ở đúng file riêng của nó (`script-load-order.md`,
  `core-function-conventions.md`, `core-legacy-audit.md`, `folder-structure.md`), không cần
  chép lại trong changelog nữa, chỉ cần 1 dòng trỏ link.

## 2. Tổng quan hạ tầng mới cần thêm (dùng chung cho mọi mục a-e)

| Loại | Thêm gì |
|---|---|
| IndexedDB (`core/db.js`) | `DB_VERSION` 3→4, thêm store `folders`, `images`, `albums`, `documents` (idempotent trong `onupgradeneeded`, giống cách `languages` được thêm ở `DB_VERSION` 2→3) |
| `service/state.js` | Key `appState` mới (ví dụ `activePlayListFolder`, `selectionMode`, `selectedSongKeys`, `readerConfig`, `slideshowConfig`, `activeBackgroundAlbum`...) + `CONST` mới (mặc định slideshow, mặc định reader...) — liệt kê đầy đủ ở từng mục bên dưới |
| `event/` | Cụm mới: `fileManager` (điều hướng), `fileManagerSong`, `fileManagerImage`, `fileManagerAlbum`, `fileManagerText`, `reader` — xem lý do tách ở mục 4 |
| `lang/` | Patch file MỚI `lang/patch/patch-file-manager.js` (namespace `fileManager.*`, `reader.*`) — 5 patch cũ → 6, cập nhật comment đầu `lang.js` + `index.html` |
| CSS | **[Đã chốt]** tách file mới theo domain, không gộp `style.css` nữa — bắt đầu `assets/css/slideshow.css` cho mục 4.b3, chính thức phá quy ước "1 file CSS duy nhất" giữ từ ver 5 (chủ động, ghi lại ở đây để `folder-structure.md`/`why-no-es6-module.md` cập nhật theo khi code thật) |
| Thư viện CDN mới | **[Cần chốt]** trình soạn thảo văn bản (mục 4.b4) + đọc nội dung `.docx` (mục 4.b4/4.e) — xem lựa chọn đề xuất ở đó |

## 3. Đổi cấu trúc About/Storage hiện có (mục a)

`core/storage-manager.js` hiện chỉ quản lý MỘT loại tài sản (bài hát, qua `clearAllStoredData()`,
cờ `isDestructiveTaskInProgress`), gắn trong About/Settings (`settingsMisc` → nhánh
`storageDrawer`). Kéo ra thành mục riêng **File Manager → Song**:

- **Không cần UI list bài hát riêng** — dùng lại UI Playlist hiện có (đúng ý bác) — File Manager
  → Song chỉ còn: thống kê dung lượng (tái dùng `computeStats()`/`about-stats.js` phần liên quan
  song) + quản lý **Folder** (mục b1).
- `core/storage-manager.js` cần **tổng quát hoá** — hiện chỉ biết xoá "songs" store; giờ File
  Manager có thêm Ảnh/Văn bản cũng cần "xoá hết" riêng từng loại (mục b2/b4) → cân nhắc: giữ
  `clearAllStoredData()` chỉ cho song (không đổi hành vi cũ), thêm hàm core riêng
  `clearAllImages()`/`clearAllDocuments()` (đơn tuyến, đúng Rule 1 — KHÔNG gộp chung 1 hàm rẽ
  nhánh theo "loại tài sản nào").
- Cụm event: tách hẳn khỏi `settingsMisc` (nhánh `storageDrawer` cũ) → cụm mới `fileManagerSong`.
  **[Cần chốt]** cụm `settingsMisc` sau khi rút `storageDrawer` ra có còn đáng giữ tên
  `settingsMisc` không, hay đổi tên luôn (rút gọn chỉ còn `aboutDrawer`+`appRecovery`).

## 4. File Manager

### 4.b1 — Song → Folder + scoping playlist + chọn nhiều

**Folder:**
- Store mới `folders` (id, name, danh sách `songKey`). Core mới: `createFolder(name)`,
- `appState` mới: `activePlayListFolder` (`null`/`undefined` = tất cả bài, hoặc `folderId`) —
  đổi tên từ `activeSongFolder` cho khớp đúng thuật ngữ bác dùng.

**Scoping — CHỐT theo đúng thiết kế bác mô tả, và đây chính là ví dụ ÁP DỤNG THẬT của
`VirtualMachineState`** (đúng nguyên tắc bắt buộc ở mục 0 — không phải tự ý thêm):
```js
// trong router cụm playlist (hoặc listener boot), thay vì if/else load
const folder = appState.get('activePlayListFolder');
VirtualMachineState.run([
    { state: folder, operation: 'in',    value: [null, undefined], callback: () => loadAllSongs() },
    { state: folder, operation: 'notIn', value: [null, undefined], callback: () => loadSongsFromFolder(folder) },
]);
```
2 rule loại trừ nhau tự nhiên (1 biến không thể vừa `null` vừa có giá trị) nên dù
`VirtualMachineState` chạy tất cả rule khớp, ở đây luôn chỉ đúng 1 rule khớp — không risk double-load.
`core/playlist/{order,actions,render,main}.js` **không cần đổi gì** — làm việc trên cache đã có
sẵn, không biết cache đó full hay đã scoped. Chỉ chỗ gọi nạp (loader.js/router) đổi.

**Schema — CHỐT bản đơn giản hoá cuối (bỏ hẳn field `remove`, thêm counter `empty` để check
rỗng O(1) thay vì scan mảng):**
```
folder_song: {
    [folderId]: {
        list: [songKey, songKey, null, songKey, ...],  // null = lỗ do đã gỡ khỏi folder
        empty: number,                                  // đếm số lỗ null hiện có trong list
    }
}
songs record thêm field:
    folder: { [folderId]: position }   // number thẳng, KHÔNG object {position,remove} nữa
```
Đúng lý do bác chỉ ra: bản thân **sự TỒN TẠI của key `folder[folderId]`** trên record bài hát đã
đủ để biết "bài này đã từng được thêm vào folder này chưa" — không cần cờ `remove` riêng; trạng
thái "đang ở trong hay đã bị gỡ" đọc thẳng từ `list[position]` (`null` = đã gỡ, có giá trị = đang
ở trong), không lưu trùng lặp 2 nơi.

- **Thêm vào folder:**
  - `songRecord.folder[folderId]` **chưa tồn tại** → lần đầu tuyệt đối: `position =
    list.length`, `list.push(songKey)`, `songRecord.folder[folderId] = position`. **KHÔNG đổi
    `empty`** (đúng ý bác — chèn hoàn toàn mới không liên quan số lỗ).
  - **Đã tồn tại** (`position = songRecord.folder[folderId]`) → đã từng thêm trước đây:
    - `list[position] === null` (đang bị gỡ) → tái điền: `list[position] = songKey`,
      `empty--`.
    - `list[position] !== null` (đang ở trong rồi) → không làm gì, tránh thêm trùng.
- **Gỡ khỏi folder:** `position = songRecord.folder[folderId]`; nếu tồn tại và
  `list[position] !== null` → `list[position] = null`, `empty++`.
- **Check folder rỗng hoàn toàn (O(1), không scan mảng):** `folder_song[folderId].empty ===
  folder_song[folderId].list.length`.
- **Đọc danh sách bài của 1 folder** (bước nạp): `list.filter(k => k != null)`.

**2 ngữ cảnh xoá HOÀN TOÀN KHÁC NHAU — đúng ý bác chỉ ra, sửa lại hiểu nhầm của em trước đó:**

1. **"Xoá bài khỏi Playlist"** (nút xoá chính trong Playlist, kể cả đang scoping theo folder hay
   không) = **LUÔN xoá thật khỏi store `songs`** — KHÔNG phải chỉ gỡ khỏi 1 folder. "Gỡ khỏi 1
   folder cụ thể" là 1 thao tác RIÊNG, chỉ có trong File Manager → Song → Folder — 2 ngữ cảnh khác
   nhau, không dùng chung 1 nút. Vì xoá thật, cascade: loop `songRecord.folder` (biết ngay MỌI
   folder nó từng thuộc), với mỗi `folderId` mà `list[position] !== null` thì tombstone
   (`list[position] = null`, `empty++`) — dọn sạch mọi tham chiếu trước khi xoá record `songs`.
2. **"Xoá 1 folder"** (File Manager → Song → Folder) — thứ tự bắt buộc: (a) loop
   `folder_song[folderId].list.filter(k => k != null)` lấy từng `songKey` còn đang ở trong, (b)
   với mỗi bài đó, **xoá hẳn key `folder[folderId]`** khỏi `songRecord.folder` (không phải set
   `null` — xoá luôn field, vì folder này sắp không tồn tại nữa, giữ lại vô nghĩa), (c) sau khi
   dọn xong toàn bộ bài, mới `delete folder_song[folderId]` (xoá cả object `{list, empty}`).

Còn lại — **UX khi đổi folder giữa lúc đang phát 1 bài không thuộc folder mới**, và **resume state
qua tab ẩn có cần lưu kèm `activePlayListFolder` không** — 2 câu này thuộc quyết định trải nghiệm,
chưa có trong mô tả kỹ thuật ở trên, vẫn cần bác chốt (đề xuất mặc định: KHÔNG cắt ngang bài đang
phát dù nó ngoài folder mới — chỉ áp scoping cho danh sách/hàng đợi kế tiếp — nếu đồng ý, resume
state NÊN lưu kèm `activePlayListFolder` để mở lại tab không bị lệch phạm vi).

**Chọn nhiều (checkbox mode) trong Playlist:**
- `appState` mới: `selectionMode` (boolean), `selectedSongKeys` (Set).
- UI: thêm icon "chọn nhiều" cạnh icon cài đặt trong `components/playlist-view.js`; bật lên hiện
  dấu tick từng bài + thanh hành động (huỷ + menu ba chấm).
- Menu ba chấm — workflow mới trong cụm `fileManagerSong` (hoặc `playlist`, cần chốt cụm nào sở
  hữu — xem câu hỏi cuối):
  1. **Phát bài đã chọn** — áp sort a-z/random NHƯNG chỉ trong tập đã chọn — tái dùng
     `core/playlist/order.js` (hàm sort sẵn có, chỉ đổi input là tập con thay vì toàn bộ).
  2. **Export ZIP** — workflow (cần shield, đúng tiêu chí Rule 3): loop `id3-export.js` (hàm export
     1 bài đã có) → gom `Blob` → `JSZip` (đã có sẵn trong CDN theo README) → tải xuống.
  3. **Thêm vào thư mục** — mở picker chọn folder (tái dùng UI folder ở b1) → `addSongsToFolder()`.
  4. **Xoá hàng loạt, loại trừ bài đang phát** — guard: nếu `songKey === currentKey` **[Cần chốt]**
     bỏ qua âm thầm (chỉ xoá phần còn lại) hay báo cho người dùng biết đã loại trừ bài nào?

### 4.b2 — Ảnh

- Store `images` (blob, filename, `addedAt`). Core: `saveImage(file)`, `deleteImage(key)`,
  `clearAllImages()` (không backup — khác `clearAllStoredData()` của song, đúng ý bác).
- UI dạng masonry (cao/rộng không đều nhưng luôn nằm trong chiều rộng màn hình) — **[Cần chốt]**
  pure CSS (`column-count`, không thêm thư viện) hay thêm 1 lib JS masonry qua CDN? Đề xuất pure
  CSS trước (đúng tinh thần "không build step, ít phụ thuộc" của project).
- Ấn ảnh → photo viewer full màn → "..." → xoá / thêm vào album.
- Lazy load bắt buộc (dùng chung với mục c/d — xem 4.c-d).
- Sort theo `addedAt` mới/cũ.

### 4.b3 — Album + Slideshow làm nền Visualizer

- Store `albums` (id, name, danh sách `imageKey`). Core: `createAlbum`, `deleteAlbum`,
  `renameAlbum`, `addImagesToAlbum`, `removeImagesFromAlbum` — mỗi hàm đơn tuyến riêng.
- **"Set for visual"**: tắt `vizConfig.visualEnabled`, pause video nền nếu đang bật
  (`core/state-and-video-bg.js`), rồi hiển thị slideshow album — về bản chất là **nguồn nền thứ 3**
  cạnh ảnh tĩnh/video hiện có. **[Cần chốt]** có tương thích/loại trừ lẫn nhau với ảnh nền
  (`bgImage`) và video nền (`videoBg`) hiện có không, hay 3 nguồn nền giờ là 1 nhóm chọn-1
  (radio), cần sửa lại luôn UI Settings phần "Video/Ảnh nền" cho nhất quán.
- `appState` mới: `activeBackgroundAlbum`, `slideshowConfig` ({mode: 'random'|'sequential',
  intervalSeconds (≥5, có max do người dùng đặt), transitionType}).
- Slideshow engine — 1 module core mới (`core/slideshow.js`?), chạy qua `taskManager` (đúng quy
  ước timer tập trung), đổi ảnh + toggle CSS class transition.
- **Transition — 7 loại cơ bản + mở rộng (đã chốt "cái nào tốt thì thêm"):**
  **Cơ bản (7):** fade (mờ chồng), slide trái→phải, slide phải→trái, zoom in (ảnh mới phóng to
  dần từ tâm), zoom out (ảnh mới thu nhỏ dần vào tâm), wipe (ảnh mới "kéo màn" che dần theo 1
  hướng), flip 3D quanh trục Y (`perspective` + `rotateY`, CSS thuần được, không cần WebGL).
  **Mở rộng thêm (đề xuất, đều khả thi CSS thuần, không cần lib):**
  - **Ken Burns** — pan + zoom rất chậm SUỐT thời gian hiển thị (không chỉ lúc chuyển) — rất hợp
    làm nền nhạc, cảm giác "sống" hơn ảnh đứng yên.
  - **Blur transition** — ảnh cũ mờ dần (`filter: blur()` tăng dần) trong lúc ảnh mới hiện ra nét
    dần, không cross-fade thẳng.
  - **Rotate nhẹ + fade** — ảnh mới xoay nhẹ vài độ + fade in cùng lúc, cảm giác "lật trang" nhẹ.
  - **Curtain (rèm)** — ảnh cũ tách đôi trái/phải kéo ra 2 bên lộ ảnh mới, khác wipe (wipe kéo 1
    hướng, curtain kéo 2 hướng đối xứng).
  - **Circle reveal** — ảnh mới lộ ra từ 1 vòng tròn phóng to dần từ tâm màn hình (`clip-path:
    circle()` — CSS thuần, hiệu ứng "ống kính mở" khá đẹp cho nhạc).
  - **Glitch nhẹ** — 1-2 khung hình dịch ngang ngẫu nhiên nhỏ + đổi màu nhẹ ngay lúc chuyển, hợp
    nhạc điện tử/mạnh. **[Cân nhắc]** dễ gây rối mắt nếu lạm dụng — nên để tần suất/độ mạnh thấp
    hoặc tách riêng thành 1 lựa chọn "phong cách năng động" thay vì mặc định.
  → Tổng ~13 kiểu, đều làm được bằng CSS transition/animation thuần (transform/opacity/filter/
  clip-path), không cần thêm thư viện JS animation nào.
- Cài đặt Slideshow đặt ở **File Manager → Ảnh → Cài đặt** (không phải Settings chính) — đúng ý
  bác, giữ nguyên.

### 4.b4 — Văn bản

- Store `documents` (blob hoặc text content, filename, `type` (`txt`/`docx`/`created`), `addedAt`).
- Upload `.txt`/`.docx` — lưu nguyên blob, KHÔNG parse nội dung lúc upload (đọc thật sự là việc
  của Reader, mục e).
- "Tạo txt" — cần 1 trình soạn thảo. **[Cần chốt thư viện]** vì phải load qua CDN, không build
  step, không ES6 module — đề xuất 1 trong 2: (a) **Quill.js** (UMD/CDN sẵn, WYSIWYG đầy đủ, nặng
  hơn) hoặc (b) `contenteditable` thuần + toolbar tự viết (nhẹ, ít phụ thuộc, khớp tinh thần "ít
  thư viện ngoài" của project, nhưng phải tự làm nhiều hơn). Nghiêng về (b) trừ khi bác muốn
  WYSIWYG đầy đủ ngay từ đầu.
- Cho xoá/sửa/tải, **KHÔNG cho đọc trực tiếp trong File Manager** — đọc chỉ qua Reader (mục e).
  **[Cần chốt]** "sửa" áp dụng cho file `.txt`/`docx` ĐÃ UPLOAD hay chỉ file tự tạo bằng editor?
  Sửa nội dung 1 file `.docx` upload từ ngoài vào cần parse+re-encode định dạng docx thật (phức
  tạp hơn nhiều so với txt thuần) — đề xuất: **giai đoạn 1 chỉ hỗ trợ sửa file tự tạo (txt qua
  editor); file upload (txt/docx) chỉ đổi tên/xoá/tải, không sửa nội dung** — cần bác xác nhận.
- Không backup khi xoá hết, giống ảnh. Sort theo tên/ngày/loại.

### 4.c/4.d — Cover bài hát & Ảnh nền: thay upload bằng chọn từ **danh sách Ảnh** (b2, KHÔNG phải Album)

**[Sửa lại theo đúng ý bác]** — picker mở ra là lưới ẢNH phẳng (toàn bộ store `images`, giống hệt
UI mục b2), KHÔNG đi qua Album — Album (b3) chỉ dùng riêng cho slideshow nền, không liên quan
picker này.

Dùng **1 hàm/1 component chung**, chỉ khác tham số `target`:
```
openImagePicker({ target: 'songCover' | 'backgroundImage', onSelect(imageKey) })
```
- UI: mở overlay/modal hiển thị lưới ảnh phẳng (tái dùng UI mục b2, chế độ "chọn" thay vì "xem"),
  lazy-load.
- `target='songCover'` → gắn vào `record.cover` (giữ nguyên cơ chế cover hiện có ở
  `core/playlist/actions.js`, chỉ đổi NGUỒN ảnh từ file-upload-mới sang image-đã-có-trong-store).
- `target='backgroundImage'` → gắn vào `vizConfig.bgImage` (giữ nguyên cơ chế nền hiện có ở
  `core/color-utils.js`/`state-and-video-bg.js`, chỉ đổi nguồn).
- **[Cần chốt]** ảnh dùng làm cover/nền có tính là "đang dùng", cần giữ lại khi người dùng bấm
  "xoá hết ảnh" ở File Manager không, hay xoá hết là xoá thật kể cả đang được dùng làm cover/nền
  (dẫn tới cover/nền bị vỡ)?

### 4.e — Reader (đọc văn bản đè lên Visualizer)

- Thêm icon thứ 7 vào Control Center (`components/visualizer-overlay.js`, hiện có 6 icon: Đổi
  hiệu ứng/Phụ đề/Cài đặt/Trộn bài/Lặp lại/Thống kê) — cụm event mới `reader`.
- Mở overlay full màn, Z-INDEX trên cả visual lẫn nền ảnh/video — liệt kê file cần chọn từ store
  `documents` → nạp nội dung → hiển thị.
- `.docx` cần parse ra text/HTML để hiển thị — **[Cần chốt thư viện]** đề xuất **mammoth.js**
  (có bản UMD/CDN, chuyên convert docx → HTML, không cần build step) — dùng chung cho cả đọc ở
  Reader lẫn (nếu về sau mở "sửa file docx upload") ở mục b4.
- Cài đặt Reader (font, cỡ chữ, màu nền, màu chữ, độ trong suốt) đặt ở **File Manager → Văn bản →
  Cài đặt** (đúng ý bác) — `appState` mới `readerConfig`, lưu như `vizConfig` (persist qua
  `saveConfig()`-tương-tự hoặc gộp luôn vào `vizConfig`, **[Cần chốt]** tách riêng hay gộp).

## 5. Thứ tự triển khai đề xuất

1. Hạ tầng DB (`DB_VERSION` 4, 4 store mới) + `service/state.js` (key mới) — làm trước, mọi thứ
   khác phụ thuộc vào đây.
2. File Manager khung điều hướng (cụm `fileManager`) + File Manager → Song (b1, TRỪ phần scoping
   playlist — làm folder CRUD + chọn nhiều + export zip + move-to-folder trước, scoping sau).
3. Scoping playlist theo folder (rủi ro nhất — làm riêng, test kỹ, chốt 4 câu hỏi ở mục 4.b1
   trước khi đụng `core/playlist/*.js`).
4. File Manager → Ảnh (b2) + picker dùng chung cho cover/nền (c/d) — vì Album (b3) phụ thuộc UI
   ảnh đã có.
5. Album + Slideshow nền (b3) — sau khi chốt câu hỏi CSS/tương thích 3 nguồn nền.
6. File Manager → Văn bản (b4) — sau khi chốt thư viện editor.
7. Reader (e) — phụ thuộc b4 (cần có file để đọc) — sau khi chốt mammoth.js.

## 6. Tổng hợp toàn bộ câu hỏi cần chốt trước khi code (gom lại)

**Đã chốt trong đợt trao đổi này** (không hỏi lại, ghi lại để nhớ):
- 1 bài thuộc được **nhiều folder cùng lúc** — có, qua field `folder: {folderId: position}`
  (object số nguyên, KHÔNG có cờ `remove` riêng — trạng thái đọc thẳng từ `list[position]`).
- Cover/nền (c/d) chọn từ **danh sách Ảnh phẳng**, không qua Album.
- CSS: **tách file riêng theo domain** (không gộp `style.css` nữa) — bắt đầu từ slideshow, có thể
  áp dụng tiếp cho domain khác về sau (phá quy ước "1 file CSS" giữ từ ver 5 — chủ động, không
  phải sơ suất).
- **Gỡ khỏi folder dùng tombstone `null` trong `list`, KHÔNG `splice`** — hết rủi ro lệch index.
  Tái thêm cùng bài vào cùng folder tái dùng đúng `position` cũ. Thêm counter `empty` đếm số lỗ
  → check "folder rỗng hoàn toàn" bằng `empty === list.length`, O(1) không cần scan mảng.
- **"Xoá bài khỏi Playlist" LUÔN là xoá thật khỏi `songs`** (khác hẳn "gỡ khỏi 1 folder" — 2 ngữ
  cảnh/2 nút riêng biệt, folder chỉ là filter) — cascade tombstone mọi `folderId` còn trong
  `songRecord.folder` trước khi xoá record.
- **Xoá 1 folder** — thứ tự bắt buộc: dọn field `folder[folderId]` khỏi từng bài đang có trong
  `list` TRƯỚC, xong mới `delete folder_song[folderId]`.
- **Scoping áp dụng qua `VirtualMachineState`** (ví dụ thật đầu tiên của cơ chế này trong dự án) —
  `activePlayListFolder` null/undefined → `loadAllSongs()`; có giá trị → `loadSongsFromFolder()`.

**Còn mở, cần chốt trước khi code:**
1. Đổi folder lúc đang phát bài ngoài folder mới — đề xuất mặc định: KHÔNG cắt ngang, chỉ scoping
   cho hàng đợi kế tiếp — đồng ý không?
2. Theo câu 1 — nếu đồng ý, `resume-state-storage.js` nên lưu kèm `activePlayListFolder`?
3. Xoá 1 folder đang là `activePlayListFolder` — tự về "Tất cả bài" hay chặn xoá?
4. Xoá hàng loạt loại trừ bài đang phát — bỏ qua âm thầm hay báo người dùng?
5. Cụm `fileManagerSong` hay `playlist` sở hữu menu ba chấm (chọn nhiều)?
6. Masonry ảnh: pure CSS hay thêm lib?
7. 3 nguồn nền (ảnh/video/album-slideshow) — loại trừ lẫn nhau (radio) hay cho phép chồng?
8. Editor tạo txt: Quill.js (CDN, nặng hơn) hay contenteditable tự viết (nhẹ hơn, ít phụ thuộc)?
9. Sửa nội dung file txt/docx ĐÃ UPLOAD — có trong phạm vi ver 12 không, hay chỉ sửa file tự tạo?
10. Ảnh đang dùng làm cover/nền — giữ lại khi "xoá hết ảnh" hay xoá thật (vỡ cover/nền)?
11. `readerConfig` tách riêng hay gộp vào `vizConfig`?
12. `settingsMisc` sau khi rút `storageDrawer` ra — đổi tên cụm hay giữ nguyên?
13. `null` tombstone (đề xuất của em) hay `undefined`/sparse thật (đúng chữ bác dùng ban đầu) —
    xác nhận lại 1 lần cho chắc, vì đây là quyết định khó đổi ngược sau khi đã có dữ liệu thật.

← [Quay lại README](../README.md)
