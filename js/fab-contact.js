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

    // Build Zalo URL với pre-fill message mang tag nguồn (#tt_main / #fb / #gmb ...)
    // để NV đọc tin nhắn biết ngay khách từ kênh nào, không cần hỏi.
    function buildZaloUrlWithSource(phoneNumber) {
        let tag = '';
        try {
            const src = (typeof getSourceForTag === 'function') ? getSourceForTag() : null;
            tag = (typeof buildSourceTag === 'function' && src) ? buildSourceTag(src) : '';
        } catch (e) {}
        const msg = tag
            ? 'Em muốn đặt bàn ở Trạm Dừng Chill ' + tag
            : 'Em muốn đặt bàn ở Trạm Dừng Chill';
        return 'https://zalo.me/' + phoneNumber + '?text=' + encodeURIComponent(msg);
    }

    // Phone & Zalo from SITE_CONFIG if available, otherwise fallback
    let phone = '0989765070';
    let zaloPhone = '0989765070';
    let fbUrl = 'https://www.facebook.com/tiemnuongtramdungchill';

    if (typeof SITE_CONFIG !== 'undefined') {
        phone = SITE_CONFIG.contact.phone || phone;
        zaloPhone = SITE_CONFIG.contact.zaloNumber || phone;
        fbUrl = (SITE_CONFIG.social && SITE_CONFIG.social.facebook) || fbUrl;
    }

    function buildFabDOM() {
        const container = document.createElement('div');
        container.className = 'fab-contact';
        container.id = 'fabContact';

        const options = document.createElement('div');
        options.className = 'fab-options';

        // Zalo — build URL động với tag nguồn tại lúc click (source có thể update sau khi user duyệt)
        const zaloLink = document.createElement('a');
        zaloLink.href = buildZaloUrlWithSource(zaloPhone);
        zaloLink.target = '_blank';
        zaloLink.rel = 'noopener';
        zaloLink.className = 'fab-option fab-opt-zalo';
        zaloLink.title = 'Chat Zalo';
        zaloLink.innerHTML = '<span class="fab-opt-zalo-icon">Zalo</span><span>Zalo</span>';
        zaloLink.addEventListener('click', function() {
            // Refresh URL ngay trước khi mở (trong case user vừa đổi nguồn / navigate)
            zaloLink.href = buildZaloUrlWithSource(zaloPhone);
            trackEvent('click_zalo', 'fab');
        });
        options.appendChild(zaloLink);

        // Phone
        const phoneLink = document.createElement('a');
        phoneLink.href = 'tel:' + phone;
        phoneLink.className = 'fab-option fab-opt-phone';
        phoneLink.title = 'Gọi ngay';
        phoneLink.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>Gọi ngay</span>';
        phoneLink.addEventListener('click', function() { trackEvent('click_phone', 'fab'); });
        options.appendChild(phoneLink);

        // Facebook
        const fbLink = document.createElement('a');
        fbLink.href = fbUrl;
        fbLink.target = '_blank';
        fbLink.rel = 'noopener';
        fbLink.className = 'fab-option fab-opt-fb';
        fbLink.title = 'Facebook';
        fbLink.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg><span>Facebook</span>';
        fbLink.addEventListener('click', function() { trackEvent('click_facebook', 'fab'); });
        options.appendChild(fbLink);

        container.appendChild(options);

        // Main button
        const mainBtn = document.createElement('button');
        mainBtn.className = 'fab-main';
        mainBtn.id = 'fabMainBtn';
        mainBtn.setAttribute('aria-label', 'Liên hệ');
        mainBtn.innerHTML = '<svg class="fab-main-icon fab-icon-contact" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><svg class="fab-main-icon fab-icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        container.appendChild(mainBtn);

        return container;
    }

    // Inject when DOM is ready
    function injectFab() {
        // Don't inject if already present
        if (document.getElementById('fabContact')) return;

        // Remove old fabContainer if present (index.html has one)
        const oldFab = document.getElementById('fabContainer');
        if (oldFab) oldFab.remove();

        const fabEl = buildFabDOM();
        document.body.appendChild(fabEl);

        const fabBtn = document.getElementById('fabMainBtn');
        if (!fabBtn || !fabEl) return;

        // Toggle open/close
        fabBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            fabEl.classList.toggle('open');
        });

        // Close when clicking outside
        document.addEventListener('click', function(e) {
            if (!fabEl.contains(e.target)) {
                fabEl.classList.remove('open');
            }
        });

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
           ở dưới. Thêm một phép đo vào vòng cuộn là dựng lại đúng 200ms đã gỡ. */
        const khoiDatBan = document.getElementById('booking');
        if (khoiDatBan && 'IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                const dangHien = entries[0].isIntersecting;
                fabEl.classList.toggle('in-booking', dangHien);
                if (dangHien) fabEl.classList.remove('open');   // đang mở thì đóng luôn
            }).observe(khoiDatBan);
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
