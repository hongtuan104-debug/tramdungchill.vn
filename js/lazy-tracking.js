/* ============================================
   Hoãn tải pixel đo lường tới khi khách thật sự dùng trang
   ============================================
   PageSpeed 31/07/2026: 4 pixel (GA4, Google Ads, Meta, TikTok, Clarity) ngốn
   ~1.344ms CPU và ~328 KiB JavaScript không dùng đến — nặng nhất trang chủ sau
   khi đã xử xong font và video.

   Cách làm: các khối pixel trong HTML để type="text/plain" nên trình duyệt KHÔNG
   chạy lúc tải trang. Đoạn này biến chúng thành <script> thật khi:
     - khách chạm / cuộn / bấm / gõ phím  (tương tác đầu tiên), HOẶC
     - sau 3 giây                          (chốt chặn)
   cái nào đến trước.

   Vì sao vẫn giữ được dữ liệu marketing:
   - Mọi hành vi đáng giá (đặt bàn, bấm gọi, mở Zalo, xem menu) đều CẦN tương
     tác — pixel đã bật trước khi những việc đó xảy ra.
   - Khách ở lại quá 3 giây mà không chạm gì vẫn được ghi PageView.
   - Chỉ mất trường hợp: vào rồi thoát trong dưới 3 giây và không chạm gì. Nhóm
     đó không phải khách tiềm năng, và Meta/GA cũng thường tính là bounce.

   Muốn quay lại cách cũ: bỏ type="text/plain" data-tdc-lazy trong HTML là xong,
   không cần gỡ file này. */
(function () {
    var daChay = false;

    function batPixel() {
        if (daChay) return;
        daChay = true;

        var ds = document.querySelectorAll('script[data-tdc-lazy]');
        for (var i = 0; i < ds.length; i++) {
            var cu = ds[i];
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
    }

    var sk = ['pointerdown', 'touchstart', 'keydown', 'scroll', 'mousemove', 'wheel'];
    for (var k = 0; k < sk.length; k++) {
        window.addEventListener(sk[k], batPixel, { once: true, passive: true });
    }
    setTimeout(batPixel, 3000);

    // Khách rời trang sớm: cố bật nốt để không mất hẳn lượt xem
    window.addEventListener('pagehide', batPixel, { once: true });
})();
