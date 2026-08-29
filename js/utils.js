/* ============================================
   Tram Dung Chill - Utility Functions
   ============================================ */

/**
 * Đọc nguồn truy cập: URL param → localStorage (30 ngày) → referrer → direct.
 * Bản rút gọn (không persist) — dùng cho FAB và các trang không có booking.js.
 */
function getSourceForTag() {
    try {
        const params = new URLSearchParams(window.location.search);
        const utm = params.get('utm_source');
        if (utm) return { source: utm, campaign: params.get('utm_campaign') || '' };
        if (params.get('ttclid')) return { source: 'tiktok_ads', campaign: '' };
        if (params.get('fbclid')) return { source: 'facebook_ads', campaign: '' };
        if (params.get('gclid')) return { source: 'google_ads', campaign: '' };
        const last = localStorage.getItem('tdc_source_last');
        if (last) {
            const obj = JSON.parse(last);
            if (obj && obj.ts && Date.now() - obj.ts < 30 * 24 * 60 * 60 * 1000) {
                return { source: obj.source || '', campaign: obj.campaign || '' };
            }
        }
        const ref = (document.referrer || '').toLowerCase();
        if (/tiktok\.com/.test(ref)) return { source: 'tiktok_organic', campaign: '' };
        if (/facebook\.com|fb\.com|l\.facebook/.test(ref)) return { source: 'facebook_organic', campaign: '' };
        if (/maps\.app\.goo\.gl|maps\.google|google\.[a-z.]+\/maps/.test(ref)) return { source: 'google_maps', campaign: '' };
        if (/instagram\.com/.test(ref)) return { source: 'instagram_organic', campaign: '' };
        if (/google\.[a-z.]+/.test(ref)) return { source: 'google_organic', campaign: '' };
        if (/zalo\.[a-z]+/.test(ref)) return { source: 'zalo', campaign: '' };
        if (/youtube\.com|youtu\.be/.test(ref)) return { source: 'youtube', campaign: '' };
        return { source: 'direct', campaign: '' };
    } catch (e) {
        return { source: '', campaign: '' };
    }
}

/**
 * Convert source → hashtag text chèn vào Zalo message để NV biết kênh.
 * Ví dụ: tiktok_organic + campaign=botoc → "#tt_botoc"
 */
function buildSourceTag(src) {
    const s = (src && src.source || '').toLowerCase();
    const c = (src && src.campaign || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (s === 'tiktok_organic' || s === 'tiktok') return c ? '#tt_' + c : '#tt';
    if (s === 'tiktok_ads') return c ? '#ttads_' + c : '#ttads';
    if (s === 'facebook_organic' || s === 'facebook') return c ? '#fb_' + c : '#fb';
    if (s === 'facebook_ads') return c ? '#fbads_' + c : '#fbads';
    if (s === 'google_maps' || s === 'gmb') return '#gmb';
    if (s === 'google_ads') return '#gads';
    if (s === 'google_organic') return '#gseo';
    if (s === 'zalo') return '#zalo';
    if (s === 'instagram_organic' || s === 'instagram') return '#ig';
    if (s === 'youtube') return '#yt';
    if (s === 'direct') return '#direct';
    return s ? '#' + s.replace(/[^a-z0-9_-]/g, '_') : '';
}

/**
 * Track contact click events — fire GA4 + Meta Pixel + TikTok Pixel.
 * Auto-attaches to all tel:, zalo.me, facebook, maps links on the page.
 *
 * Why: pixel Meta/TikTok cần "Contact" event để biết quảng cáo ra khách.
 * Trước đây chỉ fire GA4 → FB/TikTok Ads Manager không thấy conversion → optimize sai.
 */
function initContactTracking() {
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href') || '';
        let action = '';
        let category = '';

        if (href.startsWith('tel:')) { action = 'click_phone'; category = 'phone'; }
        else if (href.indexOf('zalo.me') !== -1) { action = 'click_zalo'; category = 'zalo'; }
        else if (href.indexOf('facebook.com') !== -1 && link.closest('.fab-contact') === null) { action = 'click_facebook'; category = 'facebook'; }
        else if (href.indexOf('maps.app.goo.gl') !== -1 || href.indexOf('google.com/maps') !== -1) { action = 'click_directions'; category = 'maps'; }
        else return;

        if (typeof gtag === 'function') {
            gtag('event', action, { event_category: 'contact', event_label: 'page_link' });
        }
        // Contact = conversion signal cho FB/TikTok ads optimization
        if ((category === 'zalo' || category === 'phone') && typeof fbq === 'function') {
            fbq('track', 'Contact', { content_category: category });
        }
        if ((category === 'zalo' || category === 'phone') && typeof ttq !== 'undefined' && ttq.track) {
            ttq.track('Contact', { content_type: category });
        }
    });
}

/**
 * Escape HTML special characters to prevent XSS.
 * Use when inserting user/data strings into HTML attributes or text.
 */
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Translation helper — returns translated string or fallback.
 * Usage: t('booking.cta') or t('booking.cta', 'Đặt bàn')
 */
function t(key, fallback) {
    const lang = document.documentElement.lang || 'vi';
    if (window.TRANSLATIONS && TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
        return TRANSLATIONS[lang][key];
    }
    if (fallback !== undefined) return fallback;
    // Try Vietnamese as ultimate fallback
    if (window.TRANSLATIONS && TRANSLATIONS.vi && TRANSLATIONS.vi[key]) {
        return TRANSLATIONS.vi[key];
    }
    return key;
}

/**
 * Format ISO date string (YYYY-MM-DD) to Vietnamese format (DD/MM/YYYY).
 */
function formatDateVi(dateStr) {
    const parts = dateStr.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
}

/**
 * Đo layout một lần rồi dùng lại, thay vì đọc offsetTop/scrollHeight mỗi khung
 * hình cuộn.
 *
 * VÌ SAO: đọc offsetTop / offsetHeight / scrollHeight buộc trình duyệt tính lại
 * bố cục NGAY tại chỗ. Các hàm cuộn của mình đang làm đúng kiểu tệ nhất — ghi
 * class (làm bố cục bẩn) rồi đọc số đo (bắt tính lại), lặp trong vòng lặp. Mỗi
 * vòng là một lần tính lại cả trang. PageSpeed 29/08/2026 đo được 114ms "buộc
 * chỉnh lại luồng" trong JS của mình, trên tổng 256ms.
 *
 * Mà mấy số đó KHÔNG đổi trong lúc cuộn — chỉ đổi khi trang đổi chiều cao.
 * Nên đo một lần, dùng lại, và chỉ đo lại khi kích thước thật sự đổi.
 *
 * Dùng ResizeObserver chứ không phải sự kiện 'resize': nó bắt được MỌI thứ làm
 * trang cao lên (ảnh về, đổi ngôn ngữ, mở accordion, flipbook), còn 'resize'
 * chỉ nổ khi người dùng đổi cỡ cửa sổ.
 *
 * @param {Function} measure hàm đọc số đo — trả về giá trị gì cũng được
 * @returns {{get: Function, invalidate: Function}} get() trả số đo, đo lại nếu cũ
 */
function cachedLayout(measure) {
    let value = null;
    let fresh = false;
    function invalidate() { fresh = false; }

    if (typeof ResizeObserver === 'function') {
        // Callback chỉ bật cờ, không đụng DOM — không có nguy cơ lặp vô hạn.
        try { new ResizeObserver(invalidate).observe(document.body); } catch (e) { /* bỏ qua */ }
    } else {
        window.addEventListener('resize', invalidate, { passive: true });
    }
    // Chốt chặn: ảnh cuối cùng về cũng làm trang cao lên.
    window.addEventListener('load', invalidate);

    return {
        get: function () {
            if (!fresh) { value = measure(); fresh = true; }
            return value;
        },
        invalidate: invalidate
    };
}

/* Preloader là lớp phủ kín màn hình (fixed, inset:0, z-index 9999), nên LCP chỉ
   được tính TỪ LÚC nó biến mất — tức nó chính là thứ quyết định LCP, không phải
   ảnh hay video nền.

   Bản cũ đợi window.load rồi + 600ms, chốt chặn 3000ms. 'load' đợi MỌI tài nguyên
   xong, kể cả iframe Google Maps và 4 pixel bên thứ ba (GA4, Meta, TikTok,
   Clarity) — trên 4G chậm là rất lâu. Đo 31/07/2026: LCP 9,6 giây.

   Nay chỉ đợi đúng thứ quyết định khung hình đầu: ảnh nền hero. Xong ảnh là gỡ
   lớp phủ, không chờ pixel với bản đồ. Chốt chặn hạ còn 1200ms. */
function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    let xong = false;
    const an = function () {
        if (xong) return;
        xong = true;
        preloader.classList.add('hidden');
    };

    const hero = document.querySelector('.hero-video');
    const poster = hero && hero.getAttribute('poster');
    if (poster) {
        const img = new Image();
        img.onload = an;
        img.onerror = an;
        img.src = poster;
        if (img.complete) an();
    } else {
        an();
    }

    setTimeout(an, 1200);
}

function initModalClose() {
    const btn = document.getElementById('closeModalBtn');
    const modal = document.getElementById('successModal');
    if (btn && modal) {
        btn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
}

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-' + type;
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = type === 'success' ? '\u2713' : '\u2717';
    const msg = document.createElement('span');
    msg.className = 'toast-msg';
    msg.textContent = message;
    toast.appendChild(icon);
    toast.appendChild(msg);

    Object.assign(toast.style, {
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: '4000',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 24px',
        borderRadius: '12px',
        background: type === 'success' ? '#065F46' : '#991B1B',
        color: '#fff',
        fontSize: '0.95rem',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        transform: 'translateX(120%)',
        transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
        maxWidth: '400px',
    });

    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });

    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function setMinDate() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.setAttribute('min', yyyy + '-' + mm + '-' + dd);
    }
}

function setCurrentYear() {
    const el = document.getElementById('currentYear');
    if (el) el.textContent = new Date().getFullYear();
}

function initQRCode() {
    const container = document.getElementById('qrCode');
    if (!container) return;

    const reviewUrl = SITE_CONFIG.social.googleMaps;

    if (typeof qrcode !== 'undefined') {
        const qr = qrcode(0, 'M');
        qr.addData(reviewUrl);
        qr.make();

        const imgTag = qr.createImgTag(5, 10);
        container.innerHTML = imgTag;
        const qrImg = container.querySelector('img');
        if (qrImg) {
            qrImg.style.borderRadius = '8px';
            qrImg.alt = 'QR Code đánh giá Google Maps Trạm Dừng Chill';
        }
    } else {
        // Fallback: safe link using escapeHtml
        const fallbackDiv = document.createElement('div');
        Object.assign(fallbackDiv.style, { padding: '20px', textAlign: 'center', background: '#f5f5f5', borderRadius: '12px' });
        const p = document.createElement('p');
        Object.assign(p.style, { fontSize: '0.85rem', color: '#666', marginBottom: '10px' });
        p.textContent = 'Quét mã QR hoặc';
        const a = document.createElement('a');
        a.href = reviewUrl;
        a.target = '_blank';
        a.rel = 'noopener';
        Object.assign(a.style, { color: '#C8572A', fontWeight: '600', textDecoration: 'underline' });
        a.textContent = 'Bấm vào đây để đánh giá';
        fallbackDiv.appendChild(p);
        fallbackDiv.appendChild(a);
        container.appendChild(fallbackDiv);
    }
}
