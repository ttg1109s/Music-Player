# Changelog — Ver 7 (mới nhất): Tách YIN sang Web Worker, dọn 2 chỗ O(n²), khoá định dạng file upload, chống mất cấu hình khi localStorage bị xoá.

> Vòng này tập trung vào hiệu năng và độ bền dữ liệu, không thêm visual/tính
> năng UI mới: thuật toán nhận diện cao độ (YIN) nặng nhất trong draw loop được
> đẩy ra một thread riêng; 2 điểm tăng trưởng O(n²) khi playlist lớn được sửa
> thành O(n); 3 nơi nhận file từ người dùng (nhạc, ảnh nền, video nền) giờ
> kiểm tra định dạng thật ở tầng JS thay vì chỉ dựa vào gợi ý `accept=""` của
> input; và cấu hình (`vizConfig`) giờ có thêm một bản sao lưu debounce trong
> IndexedDB để tự phục hồi nếu trình duyệt xoá mất `localStorage`.

---

## 1. Thuật toán nhận diện cao độ YIN chạy trên Web Worker riêng

**Vấn đề gốc rễ:** `detectPitchYIN()` là thuật toán O(halfLen²) — với
`fftSizePitch = 2048` thì `halfLen = 1024`, tức khoảng **1 triệu phép
trừ-bình-phương MỖI KHUNG HÌNH**. Hàm này được gọi đồng bộ ngay trong
`updateStatsDashboard()`, mà hàm đó lại được gọi ngay trong `drawVisualizer()`
— vòng lặp `requestAnimationFrame` chính của toàn app — TRƯỚC khi canvas được
vẽ. Nói cách khác, phần tính toán nặng nhất trong cả app đang tranh CPU trực
tiếp với việc vẽ hình mỗi khung hình, dễ gây giật ở những đoạn nhạc có cao độ
rõ (giọng hát, nhạc cụ đơn).

**Giải pháp — tách hẳn ra thread riêng (chấp nhận độ phức tạp cao hơn để giảm
độ trễ/giật tối đa):**

- **`js/core/pitch-worker.js` (file mới):** chứa nguyên thuật toán
  `detectPitchYIN()` — copy y nguyên, KHÔNG sửa logic — và một `self.onmessage`
  nhận `{ buf, sampleRate, reqId }`, trả về `{ frequency, reqId }`. Toàn bộ
  input/output là dữ liệu số thuần (không đụng DOM/Canvas/Three.js) nên an
  toàn để chuyển sang thread khác mà không cần `OffscreenCanvas`.
- **`audio-engine.js`:** `detectPitchYIN()` bị xoá khỏi đây, thay bằng một
  "cầu nối" 3 phần:
  - `initPitchWorker()` — khởi tạo `new Worker('js/core/pitch-worker.js')`
    đúng 1 lần (classic Worker, KHÔNG `type: 'module'`, để chạy được qua
    `file://` — đồng bộ với chủ trương "không build step" của project).
  - `requestPitchDetection(buf, sampleRate)` — gửi 1 khung dữ liệu sang worker,
    KHÔNG chờ kết quả (bất đồng bộ thật). Có cờ `pitchWorkerBusy`: nếu request
    trước chưa hồi đáp thì bỏ qua gửi tiếp — tránh dồn hàng đợi message lúc máy
    yếu, lúc đó vẫn dùng tạm `latestPitchFrequency` (giá trị gần nhất worker đã
    trả) cho tới khi có kết quả mới.
  - **Điểm kỹ thuật quan trọng nhất:** `pitchTimeDomainArray` là buffer
    **tái sử dụng** (bị `analyserPitch.getFloatTimeDomainData()` ghi đè mỗi
    khung hình). Nếu `postMessage` transfer thẳng buffer gốc, nó sẽ bị
    "neutered" (mất quyền sở hữu) ngay sau lần gửi đầu tiên — mọi khung sau sẽ
    ghi dữ liệu vào một buffer đã chết. Giải pháp: `buf.slice()` cấp một
    `ArrayBuffer` MỚI mỗi lần gửi, rồi transfer ownership của **bản clone**
    (`postMessage(data, [clone.buffer])`) — tránh structured-clone copy ~8KB
    mỗi khung hình (rẻ hơn nhiều so với copy ngầm), mà vẫn giữ buffer gốc sống
    nguyên để frame kế tiếp ghi tiếp.
  - `reqId` tăng dần mỗi lần gửi, đối chiếu lúc nhận hồi đáp — phòng trường hợp
    hiếm 2 message bay chồng nhau (giật khung) trả về không đúng thứ tự gửi,
    worker cũ trả chậm sẽ bị bỏ qua nếu đã có `reqId` mới hơn.
- **`audio-analysis.js`:** thay lời gọi đồng bộ `detectPitchYIN(...)` bằng
  `requestPitchDetection(...)` (gửi đi, không chờ) rồi đọc NGAY
  `latestPitchFrequency` (kết quả mới nhất worker đã trả, có thể là của vài
  khung trước) — toàn bộ logic xử lý kết quả (map ra nốt MIDI, debounce 250ms
  giữ nốt cũ khi mất tín hiệu, cập nhật `rubikPitchAvg` cho visual Rubik) giữ
  nguyên 100%, chỉ đổi NGUỒN của biến `frequency`.
- **`playlist/actions.js` (`playSong`):** thêm reset
  `latestPitchFrequency = -1` cùng các biến `lastValidNoteStr` /
  `lastValidMidiNote` / `rubikPitchHistory` khi đổi bài — vì worker là bất
  đồng bộ, nếu không reset có thể hiện sót nốt nhạc của bài VỪA đổi trong vài
  chục ms đầu (kết quả cũ "đang bay" lúc người dùng bấm Next/Prev).

**Độ trễ thêm ra do Worker — đã cân nhắc kỹ, không gây giật/lệch cảm nhận
được:** kết quả pitch giờ trễ thêm khoảng 1–3 khung hình (~16–50ms ở 60fps) so
với cách cũ (đồng bộ, cùng khung). Nhưng thuật toán YIN BẢN THÂN đã cần buffer
đầy `fftSizePitch = 2048` mẫu (~46ms ở 44.1kHz) để có kết quả — tức độ trễ vốn
dĩ đã tồn tại ở mức đó từ trước; vài chục ms thêm từ Worker chỉ là cộng dồn
trên nền trễ đã có, không phải trễ mới xuất hiện từ chỗ tức thời. Cơ chế
debounce 250ms (`lastValidNoteStr`/`lastValidNoteTime`) vốn được thiết kế để
che khoảng trống lúc YIN không phát hiện được, giờ cũng tự nhiên che luôn độ
trễ vài khung của Worker mà không cần thêm code riêng.

## 2. Sửa 2 điểm O(n²) khi playlist lớn

Rà soát toàn bộ vòng lặp lặp lại theo frame/event (draw loop, nạp file, sort,
DOM diff...) tìm thấy đúng 2 chỗ có độ tăng trưởng O(n²) thật — cả hai đều do
dùng `Array.prototype.includes()` (O(n)) NGAY TRONG một vòng lặp khác:

- **`playlist/order.js` — `applyNewSongsToDisplayOrder()`:** trước đây gọi
  `displayOrder.includes(k)` cho mỗi key trong `newKeys` →
  O(newKeys.length × displayOrder.length). Sửa: dựng 1 `Set` từ `displayOrder`
  TRƯỚC vòng lặp, tra cứu qua `.has()` (O(1)/lần), đồng bộ thêm vào Set ngay
  khi `push` key mới vào mảng → tổng chi phí còn O(newKeys.length +
  displayOrder.length).
- **`playlist/loader.js` — vòng `for` nạp file mới:** trước đây gọi
  `playlistOrder.includes(key)` mỗi file đang xử lý →
  O(files.length × playlistOrder.length). Sửa tương tự: `Set` dựng 1 lần
  trước vòng lặp, đồng bộ ngay khi push — kể cả trường hợp 2 file TRÙNG TÊN
  trong CÙNG MỘT lượt chọn (Set phải nhận biết key đó NGAY ở vòng lặp kế tiếp,
  không chỉ ở cuối, để không hiểu sai 1 trong 2 file trùng thành "bài hoàn
  toàn mới").

Cả hai sửa đã được kiểm chứng giữ ĐÚNG 100% hành vi cũ qua fuzz test 200–300
trường hợp ngẫu nhiên (bao gồm case biên file trùng tên trong cùng batch nạp)
so sánh trực tiếp kết quả giữa bản cũ (`includes`) và bản mới (`Set`) — không
có sai khác nào.

> Các chỗ khác đã rà nhưng KHÔNG cần sửa vì đã dùng `Map`/`Set` đúng cách
> (`render.js`, `listen-stats.js`) hoặc quy mô quá nhỏ để đáng công sửa
> (`removeKeyFromDisplay`, EQ 10-band, `processSubtitles` theo `timeupdate`
> với playlist sub thực tế chỉ vài trăm dòng).

## 3. Khoá định dạng file ở cả 3 nơi nhận upload từ người dùng

**Vấn đề:** thuộc tính `accept=""` của `<input type="file">` chỉ là GỢI Ý cho
hộp thoại chọn file — người dùng vẫn chọn được "Tất cả file" rồi chọn bất kỳ
thứ gì (file đổi đuôi, file không liên quan...), và kéo-thả file vào input bỏ
qua hoàn toàn bộ lọc `accept`. Trước ver 7, validate THẬT ở tầng JS chưa tồn
tại cho cả 3 luồng upload.

**Giải pháp — `js/core/upload-validation.js` (file mới):** 3 hàm
`validateAudioFile()` / `validateImageFile()` / `validateVideoFile()`, dùng
chung 1 chiến lược 2 lớp (cùng tinh thần với `isQuickValidMime()` đã có sẵn ở
`db.js` cho riêng mp3, mở rộng ra cho đa định dạng):

1. **MIME type (`file.type`) có giá trị** → đối chiếu whitelist; sai thì
   **chặn dứt khoát**, không cho đuôi file "gỡ" lại (MIME sai rõ ràng là dấu
   hiệu file bị đổi đuôi giả mạo).
2. **MIME rỗng** (một số OS/browser không suy ra được MIME dù file hợp lệ) →
   fallback kiểm tra đuôi file qua whitelist riêng.

| Loại upload | Whitelist MIME | Whitelist đuôi | Áp dụng tại |
|---|---|---|---|
| (a) Nhạc | mpeg/mp3/wav/ogg/m4a/mp4/aac/flac/webm | mp3, wav, ogg, m4a, aac, flac, webm | `playlist/loader.js` |
| (b) Ảnh nền | **CHỈ** png, jpeg/jpg, webp | png, jpg, jpeg, webp | `core/player-controls.js` |
| (c) Video nền | mp4, webm, ogg, quicktime | mp4, webm, ogv, ogg, mov | `core/state-and-video-bg.js` |

- **(a) Nhạc:** lọc NGAY khi nhận `FileList` từ input, trước cả bước đọc thẻ
  ID3 (`jsmediatags`) — file không hợp lệ bị gom chung vào danh sách báo lỗi
  `failedFiles` hiện ở cuối (giống cách báo lỗi đã có), không hề được ghi vào
  IndexedDB.
- **(b) Ảnh nền / (c) Video nền:** chặn ngay đầu listener `change`, trước khi
  đụng tới `setMeta()`/`URL.createObjectURL()` — file sai định dạng bị từ chối
  kèm `alert()` giải thích, không ảnh hưởng tới ảnh/video nền đang dùng.
- **`index.html` + `settings-drawer.js`:** cập nhật `accept=""` của cả 3
  input khớp đúng whitelist thật (giảm khả năng người dùng chọn nhầm ngay từ
  hộp thoại OS — vẫn chỉ là lớp UI phụ, lớp chặn THẬT là JS).

## 4. Cấu hình tự phục hồi khi `localStorage` bị mất

**Vấn đề:** `vizConfig` (màu sắc, EQ, kiểu visual, style phụ đề...) chỉ được
lưu ở `localStorage`. Một số trình duyệt (đặc biệt Safari/iOS) có thể tự xoá
`localStorage` của site ít dùng để nhường chỗ cho dữ liệu khác, hoặc người
dùng xoá "Clear browsing data" mà không ngờ nó cũng xoá luôn cấu hình visual
— trong khi đó IndexedDB (nơi lưu nhạc/ảnh/video) thường KHÔNG bị xoá theo
cùng cơ chế đó.

**Giải pháp — 2 lớp lưu, vai trò khác nhau (`equalizer-settings.js`):**

- **localStorage vẫn là NGUỒN GHI CHÍNH** — giữ nguyên hành vi cũ, đồng bộ,
  tức thì. `saveConfig()` được gọi RẤT dày (mỗi lần kéo 1 slider màu/EQ/style
  phụ đề...), nên KHÔNG thể đổi thẳng sang ghi IndexedDB ở lớp này — sẽ tạo
  hàng trăm transaction/giây lúc người dùng kéo thanh trượt.
- **IndexedDB (`meta.configBackup`) là BẢN SAO LƯU, ghi DEBOUNCE 2 giây** —
  cùng cơ chế debounce đã có sẵn ở `listen-stats.js` (gom nhiều thay đổi liên
  tiếp thành 1 lần ghi). Mỗi lần `saveConfig()` chạy, nó vẫn ghi localStorage
  ngay (như cũ) NHƯNG chỉ "hẹn giờ" ghi backup sau 2 giây yên tĩnh —
  `bgImage`/`videoBgUrl` (các `blob:` URL chỉ sống đúng 1 session) bị loại trừ
  khỏi bản backup vì lưu lại là vô nghĩa, có thể trỏ tới URL đã chết ở session
  sau.
- **`loadConfig()` — luồng phục hồi:** nếu `localStorage.getItem(...)` trả về
  rỗng, thử đọc `meta.configBackup` từ IndexedDB; nếu có, GHI NGAY lại vào
  `localStorage` rồi tiếp tục nạp như luồng bình thường (mọi bước fix-up cấu
  hình cũ phía sau không đổi gì) — người dùng mở app lại thấy ĐÚNG cấu hình đã
  chỉnh trước đó, không bị reset về mặc định. Trường hợp CẢ HAI đều trống
  (máy/người dùng thực sự mới) thì dùng `DEFAULT_VIZ_CONFIG` như cũ, không có
  gì thay đổi.

Toàn bộ luồng (lưu song song, loại trừ blob URL, phục hồi đúng giá trị, ghi
lại localStorage sau phục hồi, case người dùng mới) đã được kiểm chứng qua mô
phỏng độc lập (localStorage + IndexedDB giả) trước khi áp dụng vào code thật.

---

### Tổng kết file thay đổi/thêm mới ver 7

- **Mới:** `js/core/pitch-worker.js`, `js/core/upload-validation.js`,
  `CHANGELOG_v7.md`.
- **Sửa:** `js/core/audio-engine.js`, `js/core/audio-analysis.js`,
  `js/playlist/actions.js`, `js/playlist/order.js`, `js/playlist/loader.js`,
  `js/core/player-controls.js`, `js/core/state-and-video-bg.js`,
  `js/core/equalizer-settings.js`, `js/components/settings-drawer.js`,
  `index.html`, `README.md`.
