/* ============================================
   Hoãn tải pixel đo lường tới khi khách thật sự dùng trang
   ============================================
   PageSpeed 31/07/2026: 4 pixel (GA4, Google Ads, Meta, TikTok, Clarity) ngốn
   ~1.344ms CPU và ~328 KiB JavaScript không dùng đến — nặng nhất trang chủ sau
   khi đã xử xong font và video.

   Cách làm: các khối pixel trong HTML để type="text/plain" nên trình duyệt KHÔNG
   chạy lúc tải trang. Đoạn này biến chúng thành <script> thật khi:
     - khách chạm / cuộn / bấm / gõ phím  (tương tác đầu tiên), HOẶC
     - sau khi trang tải xong + 2,5 giây  (chốt chặn)
   cái nào đến trước.

   ── Sửa 30/08/2026: giãn chốt chặn + bắn so le ──────────────────────────────
   Bản cũ đặt setTimeout(batPixel, 3000) tính từ lúc parse, rồi bật CẢ 5 script
   trong cùng một nhịp. Đo được (PageSpeed 30/08/2026, Moto G Power + 4G chậm):
   TBT 620ms, 11 tác vụ dài, 2,6 giây main-thread, 253 KiB JS không dùng đến —
   gần như toàn bộ là của bốn bên thứ ba này, vì JS nhà mình chỉ có 45 KB.

   Hai thay đổi:
   1. Chốt chặn đếm từ sự kiện 'load' chứ không từ lúc parse, nên pixel không
      còn giành CPU với ảnh hero (phần tử LCP) và với JS dựng trang.
   2. Mỗi pixel được bật trong một khe requestIdleCallback RIÊNG. Trước đây bốn
      bundle nặng cùng đổ bộ một lúc thành vài tác vụ dài; nay xen kẽ nên trình
      duyệt có khoảng thở giữa hai lần, TBT tính theo phần vượt 50ms của TỪNG
      tác vụ nên chia nhỏ là ăn điểm thật, không phải mẹo.

   Vì sao vẫn giữ được dữ liệu marketing:
   - Mọi hành vi đáng giá (đặt bàn, bấm gọi, mở Zalo, xem menu) đều CẦN tương
     tác — chạm đầu tiên bật pixel ngay, không qua chốt chặn.
   - Khách ở lại quá (load + 2,5s) mà không chạm gì vẫn được ghi PageView.
   - Khách đóng tab sớm: 'pagehide' bắn nốt phần còn lại, bỏ qua giãn cách.

   Muốn quay lại cách cũ: bỏ type="text/plain" data-tdc-lazy trong HTML là xong,
   không cần gỡ file này. */
(function () {
    var HOAN_SAU_LOAD = 2500;   // ms, chốt chặn tính từ sự kiện 'load'
    var daChay = false;
    var hangDoi = null;

    var khiRanh = window.requestIdleCallback || function (fn) { return setTimeout(fn, 1); };

    /* Biến một thẻ <script type="text/plain"> thành <script> thật.
       Đánh dấu tdcXong ngay tại đây: nếu khách đóng tab đúng lúc đang bắn so le
       thì batHet() bên dưới không bật lại thẻ đã bật (sẽ đếm PageView hai lần). */
    function bat(cu) {
        if (cu.dataset.tdcXong) return;
        cu.dataset.tdcXong = '1';
        var moi = document.createElement('script');
        // giữ nguyên mọi thuộc tính trừ cặp đánh dấu
        for (var j = 0; j < cu.attributes.length; j++) {
            var a = cu.attributes[j];
            if (a.name === 'type' || a.name === 'data-tdc-lazy') continue;
            moi.setAttribute(a.name, a.value);
        }
        if (cu.src) moi.src = cu.src;
        else moi.text = cu.textContent;
        cu.parentNode.insertBefore(moi, cu);
    }

    /* Lấy danh sách MỘT lần, theo đúng thứ tự trong tài liệu: khối cấu hình GA4
       nằm sau thẻ gtag/js nên phải giữ nguyên trật tự này. */
    function layHangDoi() {
        if (!hangDoi) {
            hangDoi = [].slice.call(document.querySelectorAll('script[data-tdc-lazy]'));
        }
        return hangDoi;
    }

    /* Bắn so le: mỗi lần rảnh chỉ bật đúng một pixel */
    function batPixel() {
        if (daChay) return;
        daChay = true;

        var ds = layHangDoi();
        var i = 0;
        (function ke() {
            if (i >= ds.length) return;
            bat(ds[i++]);
            khiRanh(ke, { timeout: 500 });
        })();
    }

    /* Khách rời trang: không còn gì để bảo vệ nữa, bắn hết một lượt */
    function batHet() {
        daChay = true;
        var ds = layHangDoi();
        for (var i = 0; i < ds.length; i++) bat(ds[i]);
    }

    var sk = ['pointerdown', 'touchstart', 'keydown', 'scroll', 'mousemove', 'wheel'];
    for (var k = 0; k < sk.length; k++) {
        window.addEventListener(sk[k], batPixel, { once: true, passive: true });
    }

    // Chốt chặn: đếm từ lúc trang tải xong, không phải từ lúc parse
    function hen() { setTimeout(batPixel, HOAN_SAU_LOAD); }
    if (document.readyState === 'complete') hen();
    else window.addEventListener('load', hen, { once: true });

    window.addEventListener('pagehide', batHet, { once: true });
})();
