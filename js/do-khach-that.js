/* ============================================
   Đo Core Web Vitals của KHÁCH THẬT (RUM) → sự kiện GA4
   ============================================
   Thêm 15/09/2026 — checklist #13 mục 103 "bổ sung RUM khi thiếu dữ liệu CrUX".

   Vì sao cần, dù đã có CrUX:
   - CrUX chỉ có số gộp 28 ngày. Site ít khách nên hầu hết URL không có số riêng,
     chỉ còn số chung cả origin — không biết trang chủ, menu hay bài blog kéo xuống.
   - CrUX không nói phần tử nào, script nào gây chậm. INP điện thoại đang trượt
     (260ms, CrUX 13/09/2026) mà máy làm việc chỉ tái hiện bằng giả lập; nghi phạm
     chính (cú chạm đầu trùng lúc pixel vừa bật) chưa có số từ máy khách.

   Cách làm: thư viện web-vitals 6.2.2 bản attribution của Google (js/vendor/, chép
   nguyên từ npm) + file này, bundle-js.js ghép thành dist/do-khach-that.min.js.
   lazy-tracking.js chèn nó SAU khi pixel đã bật (khách chạm/cuộn, hoặc load + 6s)
   nên lúc tải trang không thêm byte hay tác vụ nào — PageSpeed không thấy nó.
   Thư viện đọc PerformanceObserver với cờ buffered nên nạp muộn vẫn lấy đủ LCP,
   CLS và cú chạm đầu tiên.

   Hạn chế đã biết (đọc số cho đúng):
   - Khách rời trang trước khi pixel bật thì không có số (cùng nhóm mất PageView).
   - Trang đang bị ẩn (khách chuyển tab) lúc thư viện nạp thì không có LCP.
   - Mỗi chỉ số gửi MỘT lần cho mỗi lượt xem (lần báo đầu tiên, thường là lúc khách
     rời hoặc ẩn trang). Nhờ vậy đếm sự kiện theo metric_rating ra đúng "bao nhiêu
     phần trăm lượt xem đạt Tốt" (mục 98). Đổi lại, cú chạm chậm SAU khi khách quay
     lại tab không được tính → INP ở đây có thể thấp hơn CrUX một chút.
   - Chỉ gửi tới GA4 G-2VFBZDY6CD (send_to): không có send_to thì gtag gửi cả sang
     Google Ads AW-18038463990, lẫn vào dữ liệu remarketing.

   Đọc số trong GA4: sự kiện LCP / INP / CLS / TTFB, chiều "Danh mục thiết bị" để tách
   điện thoại với máy tính (mục 101), cắt theo metric_rating và nhom_trang. Tham số
   tuỳ chỉnh phải đăng ký trong Quản trị → Định nghĩa tuỳ chỉnh mới hiện trong báo
   cáo, và chỉ tính từ lúc đăng ký. Máy canh: R8u trong seo-geo-verify.js. */
(function () {
    var wv = window.webVitals;
    if (!wv || window.__tdcDoKhachThat) return;
    window.__tdcDoKhachThat = true;

    var daGui = {};

    function nhomTrang() {
        var p = location.pathname;
        // GitHub Pages trả 404.html NGAY TẠI URL hỏng — nhìn đường dẫn dễ tưởng là bài blog
        if (document.querySelector('h1.error-title')) return 'loi-404';
        if (p === '/' || p === '/index.html') return 'trang-chu';
        if (p === '/menu' || p === '/menu.html') return 'menu';
        if (p === '/blog' || p === '/blog.html') return 'blog';
        if (p.indexOf('/blog/') === 0) return 'bai-blog';
        if (p.indexOf('/dip/') === 0) return 'trang-dip';
        if (p.indexOf('/duong-di') === 0) return 'duong-di';
        if (p.indexOf('/tac-gia/') === 0) return 'tac-gia';
        return 'khac';
    }
    var NHOM = nhomTrang();

    function ms(n) { return typeof n === 'number' ? Math.round(n) : undefined; }

    // GA4 cắt giá trị tham số ở 100 ký tự; bộ chọn CSS cụ thể nhất nằm ở cuối nên giữ phần đuôi
    function duoi(s) { return s ? String(s).slice(-100) : undefined; }

    // Ví dụ: "connect.facebook.net/fbevents.js DOMWindow.onclick input-delay 180ms"
    function tomTatScript(t) {
        if (!t || !t.entry) return undefined;
        var e = t.entry, nguon;
        try {
            var u = new URL(e.sourceURL);
            nguon = (u.host === location.host ? '' : u.host) + u.pathname.replace(/^.*\//, '/');
        } catch (x) {
            nguon = '(inline)';
        }
        return [nguon, e.invoker || e.invokerType, t.subpart, Math.round(t.intersectingDuration) + 'ms']
            .join(' ').slice(0, 100);
    }

    function gui(m) {
        if (typeof window.gtag !== 'function' || daGui[m.id]) return;
        daGui[m.id] = 1;
        var a = m.attribution || {};
        var laCLS = m.name === 'CLS';
        var p = {
            send_to: 'G-2VFBZDY6CD',
            value: Math.round(laCLS ? m.value * 1000 : m.value),   // CLS nhân 1000 cho thành số nguyên
            metric_id: m.id,
            metric_value: laCLS ? Math.round(m.value * 10000) / 10000 : Math.round(m.value),
            metric_rating: m.rating,
            nhom_trang: NHOM,
            navigation_type: m.navigationType
        };
        if (m.name === 'LCP') {
            p.debug_target = duoi(a.target);
            p.debug_ttfb = ms(a.timeToFirstByte);
            p.debug_load_delay = ms(a.resourceLoadDelay);
            p.debug_load_time = ms(a.resourceLoadDuration);
            p.debug_render_delay = ms(a.elementRenderDelay);
        } else if (m.name === 'INP') {
            p.debug_target = duoi(a.interactionTarget);
            p.debug_type = a.interactionType;
            p.debug_load_state = a.loadState;
            p.debug_input_delay = ms(a.inputDelay);
            p.debug_processing = ms(a.processingDuration);
            p.debug_presentation = ms(a.presentationDelay);
            p.debug_script = tomTatScript(a.longestScript);
        } else if (laCLS) {
            p.debug_target = duoi(a.largestShiftTarget);
            p.debug_load_state = a.loadState;
        } else if (m.name === 'TTFB') {
            p.debug_dns = ms(a.dnsDuration);
            p.debug_connect = ms(a.connectionDuration);
            p.debug_request = ms(a.requestDuration);
        }
        window.gtag('event', m.name, p);
    }

    wv.onLCP(gui);
    wv.onINP(gui);
    wv.onCLS(gui);
    wv.onTTFB(gui);
})();
