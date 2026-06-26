/**
 * event/bus.js — TỔNG ĐÀI trung tâm của toàn bộ kiến trúc /event/.
 *
 * NẠP ĐẦU TIÊN (trước cả core/workflow/router/listener) — mọi tầng phía sau đều cần
 * `eventBus` đã tồn tại để gọi `register()` (router) hoặc `send()` (listener).
 *
 * CƠ CHẾ (đã thống nhất):
 *   - Bus CHỈ giữ 1 danh sách "router nào đã đăng ký tên gì" — KHÔNG biết gì về nghiệp vụ.
 *   - Router PHẢI tự khai báo với bus lúc nạp: `eventBus.register('storage', routerStorage)`.
 *   - Listener gửi message qua `eventBus.send(msg)`, msg có shape cố định (xem CONTRACT dưới).
 *   - Bus tra `msg.router` trong danh sách đã đăng ký:
 *       - Có       -> chuyển NGUYÊN msg cho `router.handle(msg)` (bus KHÔNG bóc payload — mỗi
 *                     nghiệp vụ cần data khác nhau, để chính router tự tách).
 *       - Không có -> NO-OP (im lặng, không throw) — tránh 1 lỗi đánh máy tên router làm sập cả
 *                     ứng dụng; chỉ console.warn để dễ dò lúc dev.
 *
 * CONTRACT (hợp đồng) — mọi message gửi qua eventBus.send() PHẢI đúng shape:
 *   @typedef {Object} EventMessage
 *   @property {string} router  - tên router đã đăng ký (vd 'storage')
 *   @property {string} type    - tên hành vi cụ thể, namespace theo router (vd 'storage.deleteBroken.click')
 *   @property {Object} payload - dữ liệu kèm theo, router tự destructure theo nhu cầu riêng
 *
 * Router object PHẢI có dạng:
 *   @typedef {Object} EventRouter
 *   @property {(msg: EventMessage) => void} handle
 */
const eventBus = (() => {
    const routers = new Map(); // routerName -> routerObject

    /**
     * Router tự gọi hàm này lúc file router của nó được nạp — đăng ký tên + object xử lý.
     * @param {string} name
     * @param {EventRouter} routerObject - phải có method handle(msg)
     */
    function register(name, routerObject) {
        if (typeof routerObject?.handle !== 'function') {
            console.warn(`[eventBus] register("${name}") bị bỏ qua: routerObject không có method handle().`);
            return;
        }
        if (routers.has(name)) {
            console.warn(`[eventBus] register("${name}") ghi đè router đã đăng ký trước đó cùng tên — kiểm tra lại có bị nạp trùng file không.`);
        }
        routers.set(name, routerObject);
    }

    /**
     * Listener gọi hàm này để gửi message. Tra msg.router trong danh sách đã đăng ký.
     * @param {EventMessage} msg
     */
    function send(msg) {
        if (!msg || typeof msg.router !== 'string') {
            console.warn('[eventBus] send() bị bỏ qua: message thiếu field "router" hợp lệ.', msg);
            return;
        }
        const router = routers.get(msg.router);
        if (!router) {
            // NO-OP theo đúng quy ước — không throw, chỉ log để dễ dò lúc dev (vd router chưa nạp
            // xong do sai thứ tự <script>, hoặc đánh máy sai tên router).
            console.warn(`[eventBus] send() không tìm thấy router đã đăng ký tên "${msg.router}" — message bị bỏ qua (no-op).`, msg);
            return;
        }
        router.handle(msg);
    }

    return { register, send };
})();
