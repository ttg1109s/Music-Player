/**
 * event/store.js — Store trung tâm tối giản cho state context của kiến trúc /event/.
 *
 * BỐI CẢNH: project không dùng IIFE bọc từng file, nên mọi biến `let` khai báo ở top-level của
 * 1 file (vd `lastScanResults` cũ trong router/storage.js, hay `songEditCurrentKey` trong
 * playlist/actions.js) về mặt kỹ thuật JS đều là biến GLOBAL CHUNG — không có gì ngăn 1 file khác
 * vô tình đọc/ghi nhầm. EventStore không đổi điều đó (vẫn 1 instance sống suốt đời ứng dụng), mà
 * giải quyết vấn đề TỔ CHỨC: gom các field cùng 1 router vào ĐÚNG 1 object riêng (qua private
 * field `#state` của class, không export field đó ra ngoài), tránh việc rải state thành nhiều
 * biến `let` rời rạc dễ quên/dễ đặt trùng tên giữa các router khác nhau.
 *
 * PHẠM VI STATE NÊN ĐƯA VÀO ĐÂY: chỉ "state context" — dữ liệu nhớ giữa 2 lượt message liên tiếp
 * của 1 router (vd `lastScanResults`: quét xong nhớ kết quả, lượt bấm xoá sau dùng lại; hoặc
 * `songEditCurrentKey`: đang mở modal sửa bài nào). KHÔNG đưa các biến nghiệp vụ to toàn cục của
 * app (currentKey, playlistOrder, vizConfig...) vào đây — phạm vi đó NẰM NGOÀI patch này, để
 * chuyển đổi dần dần ở các cụm sau nếu cần.
 *
 * CÁCH DÙNG (mỗi router tự new 1 instance riêng, KHÔNG extends, vì state khác nhau hoàn toàn về
 * field giữa các router, không có hành vi cần override):
 *   const storageStore = new EventStore('storage');
 *   storageStore.set({ lastScanResults: [] });
 *   storageStore.get('lastScanResults');           // -> []
 *   storageStore.getAll();                          // -> { lastScanResults: [] }
 *   storageStore.reset();                           // xoá hết field của RIÊNG namespace này
 *
 * set() LUÔN MERGE từng phần (Object.assign), giống setState() của React — gọi set({a:1}) rồi
 * set({b:2}) thì state có cả a và b, KHÔNG bị mất a. Muốn xoá hẳn 1 field, set giá trị đó thành
 * undefined/null tường minh, hoặc gọi reset() để xoá toàn bộ namespace.
 *
 * TRÙNG TÊN NAMESPACE: nếu 2 router (hoặc 1 router tạo nhiều lần do lỗi nạp trùng file) cùng đặt
 * `new EventStore('storage')`, instance THỨ HAI trở đi tự đổi tên thành 'storage_2', 'storage_3'...
 * (console.warn để dễ dò) — KHÔNG ghi đè/dùng chung instance cũ, tránh mất state đang có của
 * instance trước một cách âm thầm.
 *
 * DEBUG TOÀN CẢNH: EventStore.getAllNamespaces() trả về snapshot state của MỌI router đã từng
 * new EventStore(...), gõ thẳng vào console trình duyệt lúc debug — không cần mở từng file router.
 *
 * NẠP NGAY SAU event/bus.js, TRƯỚC mọi event/workflow/event/router — router cần `EventStore` đã
 * tồn tại lúc khai báo `new EventStore(...)` ở top-level file của nó.
 */
class EventStore {
    static #registry = new Map(); // namespace (đã resolve trùng) -> instance

    #state = {};

    /** @param {string} namespace - tên gợi nhớ (thường trùng tên router, vd 'storage', 'playlist') */
    constructor(namespace) {
        this.namespace = EventStore.#resolveUniqueNamespace(namespace);
        EventStore.#registry.set(this.namespace, this);
    }

    static #resolveUniqueNamespace(base) {
        if (!EventStore.#registry.has(base)) return base;
        let i = 2;
        while (EventStore.#registry.has(`${base}_${i}`)) i++;
        console.warn(`[EventStore] Namespace "${base}" đã tồn tại — đổi instance mới thành "${base}_${i}". Kiểm tra lại có bị "new EventStore('${base}')" trùng lặp (nạp file 2 lần, hoặc đặt tên trùng router khác) không.`);
        return `${base}_${i}`;
    }

    /** Đọc 1 field. Trả `undefined` nếu chưa từng set(). */
    get(key) {
        return this.#state[key];
    }

    /** Trả bản sao toàn bộ state hiện tại của namespace này (không trả tham chiếu trực tiếp #state). */
    getAll() {
        return { ...this.#state };
    }

    /**
     * Merge từng phần vào state hiện tại (Object.assign), giống setState() của React.
     * @param {Object} partialUpdate
     * @returns {Object} toàn bộ state SAU khi merge (để tiện log/debug ngay tại chỗ gọi nếu cần)
     */
    set(partialUpdate) {
        Object.assign(this.#state, partialUpdate);
        return this.getAll();
    }

    /** Xoá toàn bộ field của RIÊNG namespace này (không ảnh hưởng namespace khác). */
    reset() {
        this.#state = {};
    }

    /** Debug: snapshot state của MỌI router đã từng new EventStore(...). */
    static getAllNamespaces() {
        const result = {};
        for (const [ns, store] of EventStore.#registry) result[ns] = store.getAll();
        return result;
    }
}
