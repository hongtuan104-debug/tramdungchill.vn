/* ============================================
   Tram Dung Chill - Utility Functions
   ============================================ */

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
    if (btn) {
        btn.addEventListener('click', () => {
            document.getElementById('successModal').classList.remove('active');
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

    var reviewUrl = SITE_CONFIG.social.googleMaps;

    if (typeof qrcode !== 'undefined') {
        var qr = qrcode(0, 'M');
        qr.addData(reviewUrl);
        qr.make();

        var imgTag = qr.createImgTag(5, 10);
        container.innerHTML = imgTag;
        var qrImg = container.querySelector('img');
        if (qrImg) {
            qrImg.style.borderRadius = '8px';
            qrImg.alt = 'QR Code đánh giá Google Maps Trạm Dừng Chill';
        }
    } else {
        container.innerHTML =
            '<div style="padding:20px;text-align:center;background:#f5f5f5;border-radius:12px;">'
            + '<p style="font-size:0.85rem;color:#666;margin-bottom:10px;">Quét mã QR hoặc</p>'
            + '<a href="' + reviewUrl + '" target="_blank" rel="noopener" style="color:#C8572A;font-weight:600;text-decoration:underline;">Bấm vào đây để đánh giá</a>'
            + '</div>';
    }
}
