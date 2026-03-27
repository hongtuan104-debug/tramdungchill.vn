/* ============================================
   Tram Dung Chill - Utility Functions
   ============================================ */

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

function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    let fallbackTimer = setTimeout(() => {
        preloader.classList.add('hidden');
    }, 3000);

    window.addEventListener('load', () => {
        clearTimeout(fallbackTimer);
        setTimeout(() => preloader.classList.add('hidden'), 600);
    });
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
