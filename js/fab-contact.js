/* ============================================
   Floating Contact Buttons - Tram Dung Chill
   Tu dong inject FAB lien he tren moi trang
   ============================================ */

(function() {
    'use strict';

    // Track click events via GA4 + Meta Pixel + TikTok Pixel (Contact = conversion signal)
    function trackEvent(action, source) {
        if (typeof gtag === 'function') {
            gtag('event', action, { event_category: 'contact', event_label: source });
        }
        if (typeof fbq === 'function') {
            fbq('track', 'Contact', { content_name: action, content_category: source });
        }
        if (typeof ttq !== 'undefined' && ttq.track) {
            ttq.track('Contact', { content_type: action });
        }
    }

    /* Trang tiếng nước ngoài (/en/, /zh/… — 21/10/2026): Zalo đổi thành WhatsApp cùng số hotline, vì
       khách Singapore, Malaysia, Hàn… ít ai có Zalo. Chữ lấy từ window.TRANSLATIONS của trang (trang
       dịch nạp dist/chu-<mã>.js); bài blog tiếng Việt không nạp bản dịch → dùng chữ mặc định. */
    const lang = (document.documentElement.lang || 'vi').toLowerCase().split('-')[0];
    const nuocNgoai = lang !== 'vi';
    function tt(khoa, macDinh) {
        const d = window.TRANSLATIONS && window.TRANSLATIONS[lang];
        return (d && d[khoa]) || macDinh;
    }

    // Build Zalo URL với pre-fill message mang tag nguồn (#tt_main / #fb / #gmb ...)
    // để NV đọc tin nhắn biết ngay khách từ kênh nào, không cần hỏi.
    function buildZaloUrlWithSource(phoneNumber) {
        let tag = '';
        try {
            let src = (typeof getSourceForTag === 'function') ? getSourceForTag() : null;
            // Khách từ QC Google sang trang khác trong cùng tab (URL hết tham số, referrer là chính web) → vẫn #google,
            // khớp mã ref=en_google của link Messenger (tuQuangCaoGoogle nhớ trong phiên)
            if (src && src.source === 'direct' && tuQuangCaoGoogle()) src = { source: 'google', campaign: '' };
            tag = (typeof buildSourceTag === 'function' && src) ? buildSourceTag(src) : '';
        } catch (e) {}
        const goc = tt('fab.msg', 'Em muốn đặt bàn ở Trạm Dừng Chill');
        const msg = tag ? goc + ' ' + tag : goc;
        if (nuocNgoai) return 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent(msg);
        return 'https://zalo.me/' + phoneNumber + '?text=' + encodeURIComponent(msg);
    }

    // Phone & Zalo from SITE_CONFIG if available, otherwise fallback
    let phone = '0989765070';
    let zaloPhone = '0989765070';
    let fbUrl = 'https://www.facebook.com/tiemnuongtramdungchill';
    let waPhone = '84989765070';

    if (typeof SITE_CONFIG !== 'undefined') {
        phone = SITE_CONFIG.contact.phone || phone;
        zaloPhone = SITE_CONFIG.contact.zaloNumber || phone;
        waPhone = SITE_CONFIG.contact.whatsapp || waPhone;
        fbUrl = (SITE_CONFIG.social && SITE_CONFIG.social.facebook) || fbUrl;
    }

    /* Đo tin nhắn từ quảng cáo Google tiếng Anh (23/10/2026). Trang đích QC (bài gốc tiếng Anh) ghi sẵn link
       Messenger ?ref=en_google. Khách KHÔNG đến từ quảng cáo trong phiên này (không gclid/gbraid/wbraid, không
       utm_source=google + utm_medium=cpc) → đổi mã thành en_web, để số tin nhắn "từ QC" không lẫn khách tự tìm thấy
       bài. Trang có link đó thì nút Facebook mở thẳng Messenger cùng mã (trước đây mở trang Facebook — tin nhắn bắt
       đầu từ đó không đếm được). */
    const REF_QC = 'ref=en_google';
    let linkMessenger = null;
    function tuQuangCaoGoogle() {
        let co = false;
        try {
            const q = new URLSearchParams(window.location.search);
            co = !!(q.get('gclid') || q.get('gbraid') || q.get('wbraid')) ||
                ((q.get('utm_source') || '').toLowerCase() === 'google' && (q.get('utm_medium') || '').toLowerCase() === 'cpc');
        } catch (e) { /* trình duyệt quá cũ không có URLSearchParams */ }
        // Lưu trữ bị chặn (chế độ riêng tư, trình duyệt trong app) thì vẫn giữ kết quả đọc từ URL ở trên
        try {
            if (co) sessionStorage.setItem('tdc_qc_google', '1');
            else co = sessionStorage.getItem('tdc_qc_google') === '1';
        } catch (e) { /* bỏ qua */ }
        return co;
    }
    function suaLinkMessenger() {
        const ds = document.querySelectorAll('a[href*="m.me/"][href*="' + REF_QC + '"]');
        if (!ds.length) return;
        const qc = tuQuangCaoGoogle();
        ds.forEach(function (a) {
            if (!qc) a.setAttribute('href', a.getAttribute('href').replace(REF_QC, 'ref=en_web'));
        });
        linkMessenger = ds[0].getAttribute('href');
    }

    /* Link WhatsApp viết sẵn trong THÂN BÀI hoặc CHÂN TRANG của trang tiếng nước ngoài (vd mục "How to book a table"):
       soạn sẵn câu chào + mã nguồn (#google…) giống nút nổi, để NV biết khách đến từ đâu. Chỉ link trỏ đúng số quán và
       chưa soạn sẵn chữ. CHỈ gán một lần lúc dựng trang, KHÔNG gán lại lúc bấm: nút "Open WhatsApp" của hộp thoại đặt
       bàn (#modalZaloBtn, booking.js) được ghi link mang nội dung đơn sau khi gửi form — gán lại lúc bấm là đè mất đơn
       (soát 23/10/2026). Không gắn bộ đếm: trang chính có bộ nghe chung (utils.js initContactTracking) đã đếm link
       này; trang blog không có bộ nghe chung nên bấm link trong bài không vào GA4 (như link gọi / Messenger trong bài). */
    function suaLinkWhatsApp() {
        if (!nuocNgoai) return;
        document.querySelectorAll('article a[href^="https://wa.me/' + waPhone + '"], footer a[href^="https://wa.me/' + waPhone + '"]').forEach(function (a) {
            if (a.closest('.fab-contact, .thanh-lien-he, .modal, #zaloQuickBook, #modalZaloBtn') || /[?&]text=/.test(a.getAttribute('href'))) return;
            a.href = buildZaloUrlWithSource(zaloPhone);
        });
    }

    // 3 link liên hệ (Zalo, Gọi, Facebook). "nguon" là nhãn đo lường: 'fab' (nút nổi) hoặc
    // 'thanh_dat_ban' (cụm nằm trong thanh "Đặt bàn online") — cùng sự kiện, khác vị trí bấm.
    function taoLienKet(nguon) {
        // Zalo — build URL động với tag nguồn tại lúc click (source có thể update sau khi user duyệt)
        const zaloLink = document.createElement('a');
        zaloLink.href = buildZaloUrlWithSource(zaloPhone);
        zaloLink.target = '_blank';
        zaloLink.rel = 'noopener';
        if (nuocNgoai) {
            // WhatsApp: biểu tượng SVG của bộ Simple Icons (CC0, không tải thêm gì), màu xanh nhận diện của WhatsApp
            const tenWa = tt('fab.whatsapp', 'Chat WhatsApp');
            zaloLink.className = 'fab-option fab-opt-wa';
            zaloLink.title = tenWa;
            zaloLink.setAttribute('aria-label', tenWa);
            zaloLink.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg><span>WhatsApp</span>';
        } else {
            zaloLink.className = 'fab-option fab-opt-zalo';
            zaloLink.title = 'Chat Zalo';
            zaloLink.setAttribute('aria-label', 'Chat Zalo');
            zaloLink.innerHTML = '<span class="fab-opt-zalo-icon">Zalo</span><span>Zalo</span>';
        }
        zaloLink.addEventListener('click', function() {
            // Refresh URL ngay trước khi mở (trong case user vừa đổi nguồn / navigate)
            zaloLink.href = buildZaloUrlWithSource(zaloPhone);
            trackEvent(nuocNgoai ? 'click_whatsapp' : 'click_zalo', nguon);
        });

        // Phone
        const goiNgay = tt('fab.call', 'Gọi ngay');
        const phoneLink = document.createElement('a');
        phoneLink.href = 'tel:' + (nuocNgoai ? '+' + waPhone : phone);
        phoneLink.className = 'fab-option fab-opt-phone';
        phoneLink.title = goiNgay;
        phoneLink.setAttribute('aria-label', goiNgay + ' ' + (nuocNgoai ? '+84 989 765 070' : phone));
        phoneLink.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>' + goiNgay + '</span>';
        phoneLink.addEventListener('click', function() { trackEvent('click_phone', nguon); });

        // Facebook
        const fbLink = document.createElement('a');
        fbLink.href = linkMessenger || fbUrl;
        fbLink.target = '_blank';
        fbLink.rel = 'noopener';
        fbLink.className = 'fab-option fab-opt-fb';
        fbLink.title = 'Facebook';
        fbLink.setAttribute('aria-label', 'Facebook');
        fbLink.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg><span>Facebook</span>';
        fbLink.addEventListener('click', function() { trackEvent('click_facebook', nguon); });

        return [zaloLink, phoneLink, fbLink];
    }

    function buildFabDOM() {
        const container = document.createElement('div');
        // 3 nut luon hien san, khong con nut tron bat/tat (26/09/2026, sep Tuan: de 3 nut nay ra man luon).
        // Dien thoai: nut tron chi co bieu tuong; may tinh: vien co chu (CSS .fab-mo-san trong style.css).
        container.className = 'fab-contact fab-mo-san';
        container.id = 'fabContact';

        const options = document.createElement('div');
        options.className = 'fab-options';
        options.id = 'fabOptions';
        options.setAttribute('role', 'group');
        options.setAttribute('aria-label', tt('fab.group', 'Liên hệ nhanh'));

        taoLienKet('fab').forEach(function (a) { options.appendChild(a); });

        container.appendChild(options);

        return container;
    }

    /* Cụm liên hệ nằm TRONG thanh "Đặt bàn online" (04/10/2026, sếp Tuấn chọn).
       Trên điện thoại 3 nút tròn nổi bên phải che ~40px mép phải của chữ suốt lúc cuộn. Khi thanh
       đặt bàn đã hiện, CSS (style.css, .thanh-lien-he) giấu nút nổi và hiện cụm này cạnh nút Đặt
       Bàn — 3 nút vẫn luôn trên màn mà không đè chữ. Đầu trang (chưa có thanh) vẫn là nút nổi.
       Thanh có nơi viết sẵn trong HTML (trang chủ), có nơi do JS tạo (thanh-dat-ban.js, mẫu bài
       blog) và có thể ra đời SAU script này → chưa thấy thì chờ bằng MutationObserver.
       Đo lường: event_label 'thanh_dat_ban'; .thanh-lien-he nằm trong CO_BO_DEM_RIENG (js/utils.js)
       để bộ nghe chung không đếm lần hai. */
    function ganVaoThanh() {
        function gan() {
            const thanh = document.getElementById('stickyBookBar');
            if (!thanh) return false;
            if (thanh.querySelector('.thanh-lien-he')) return true;
            const cum = document.createElement('div');
            cum.className = 'thanh-lien-he';
            cum.setAttribute('role', 'group');
            cum.setAttribute('aria-label', tt('fab.group', 'Liên hệ nhanh'));
            taoLienKet('thanh_dat_ban').forEach(function (a) { cum.appendChild(a); });
            thanh.insertBefore(cum, thanh.firstChild);
            return true;
        }
        if (gan() || typeof MutationObserver !== 'function') return;
        const mo = new MutationObserver(function () { if (gan()) mo.disconnect(); });
        mo.observe(document.body, { childList: true });
    }

    // Inject when DOM is ready
    function injectFab() {
        // Don't inject if already present
        if (document.getElementById('fabContact')) return;

        // Remove old fabContainer if present (index.html has one)
        const oldFab = document.getElementById('fabContainer');
        if (oldFab) oldFab.remove();

        suaLinkMessenger();   // trước buildFabDOM: nút Facebook lấy link Messenger đã chốt mã
        suaLinkWhatsApp();
        const fabEl = buildFabDOM();
        document.body.appendChild(fabEl);
        ganVaoThanh();

        if (!fabEl) return;

        /* "Trang có ngắn không" — lấy từ ResizeObserver, KHÔNG đọc scrollHeight (14/09/2026).
           Bản trước đo document.body.scrollHeight trong một requestIdleCallback lúc
           tải xong. Idle callback chạy được cả khi bố cục đang bẩn (CSS async vừa
           về, phông vừa đổi), nên phép đọc đó ép trình duyệt tính lại cả trang tại
           chỗ: trace có bóp mạng 4G chậm chấm bằng trace_engine của Lighthouse ra
           13–25ms "buộc chỉnh lại luồng" riêng dòng này. ResizeObserver đưa sẵn
           chiều cao body SAU bước tính bố cục của khung hình, không ép gì cả. */
        let trangNgan = false;

        // Hiện khi đã cuộn quá 200px, hoặc ngay từ đầu nếu trang ngắn
        function checkScroll() {
            const show = trangNgan || window.scrollY > 200;
            fabEl.classList.toggle('visible', show);
        }

        if (typeof ResizeObserver === 'function') {
            new ResizeObserver(function (entries) {
                const e = entries[0];
                const cao = e.borderBoxSize && e.borderBoxSize[0] ? e.borderBoxSize[0].blockSize : e.contentRect.height;
                const ngan = cao <= window.innerHeight + 400;
                if (ngan === trangNgan) return;   // trang dài từ đầu: không đọc gì thêm
                trangNgan = ngan;
                checkScroll();                    // bố cục vừa tính xong nên đọc scrollY ở đây không ép
            }).observe(document.body);
        }

        /* Khối đặt bàn đang trong tầm nhìn thì rút FAB đi.

           FAB neo cố định góc phải dưới (56px, z-index 999) còn nút "Gửi đặt bàn"
           trên mobile là width:100% — khi khách cuộn tới cuối form thì FAB nằm đè
           lên đúng góc phải nút Gửi (checklist Mobile #143). Thanh sticky đã tự ẩn
           ở khu này từ lâu (js/sticky-tiktok.js), riêng FAB thì chưa ai xử.

           Dùng IntersectionObserver chứ KHÔNG đo offsetTop trong sự kiện cuộn:
           observer không đọc số đo nào từ JS nên không buộc trình duyệt tính lại
           bố cục — đúng lý do đã phải hoãn checkScroll xuống requestIdleCallback
           ở dưới. Thêm một phép đo vào vòng cuộn là dựng lại đúng 200ms đã gỡ.
           04/10/2026: trang con cũng vậy — khối mời đặt bàn cuối trang Thực đơn / Blog / tác giả /
           bài blog và form trang dịp. Ở đó thanh đặt bàn tự ẩn nên nút nổi hiện lại và đè lên
           chính nút gọi / "Đặt bàn ngay" / nút gửi form của khối (đo iPhone SE 320px). Các khối
           này đã có sẵn nút gọi + đặt bàn, nên rút nút nổi đi như trang chủ. */
        const khoiDatBan = document.querySelectorAll('#booking, #booking-form, .menu-cta, .blog-cta, .author-cta, .blog-cta-cuoi');
        if (khoiDatBan.length && 'IntersectionObserver' in window) {
            const dangHien = new Set();
            const io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) dangHien.add(e.target); else dangHien.delete(e.target);
                });
                fabEl.classList.toggle('in-booking', dangHien.size > 0);
            });
            khoiDatBan.forEach(function (k) { io.observe(k); });
        }

        let ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    checkScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        /* KHÔNG còn lần đo đầu lúc tải trang (14/09/2026, CLAUDE.md bug #26).
           Ở đầu trang FAB vốn ẩn (CSS mặc định) — đúng rồi, khỏi đo. Trang ngắn thì
           ResizeObserver ở trên tự bật. Khách tải lại giữa trang hay mở bằng link
           #neo thì trình duyệt khôi phục vị trí cuộn và BẮN sự kiện 'scroll', bộ
           nghe bên trên tự cập nhật (đã kiểm bằng do-trang-thai.js).
           Lịch sử: 01/09/2026 gọi thẳng lúc dựng trang = 200ms ép bố cục; sau đó
           hoãn xuống requestIdleCallback nhưng idle vẫn có thể rơi đúng lúc bố cục
           bẩn, nên bỏ hẳn. */
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectFab);
    } else {
        injectFab();
    }
})();
