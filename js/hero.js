/* ============================================
   Tram Dung Chill - Hero Slider & Particles
   ============================================ */

/* initHeroSlider() da bo ngay 30/08/2026.
   Khoi .hero-slider-mobile bi display:none o ca critical CSS lan style.css nen
   ba anh do chua tung hien thi; ham nay chi con doi mau ba cham .time-dot va
   nuoi mot setInterval 7 giay chay mai. Video + poster lo het phan nen hero. */

/* Video nền hero chỉ tải trên máy tính.
   File nặng 3,6 MB — trên mobile 4G chậm nó đẩy LCP lên 8,9 giây (PageSpeed
   31/07/2026). Ẩn bằng CSS không cứu được vì trình duyệt vẫn tải hết rồi mới ẩn,
   nên trong HTML thẻ <source> để data-src và chỉ gắn src thật ở đây.
   Mobile giữ poster ảnh dọc (bản .webp ~100 KB) — nhẹ hơn 15 lần, vẫn đúng khung hình. */
function initHeroVideo() {
    const video = document.querySelector('.hero-video');
    if (!video) return;
    const source = video.querySelector('source[data-src]');
    if (!source || source.src) return;

    if (!window.matchMedia('(min-width: 768px)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Khách đang dùng gói tiết kiệm dữ liệu thì cũng không tải
    const conn = navigator.connection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return;

    source.src = source.dataset.src;
    video.load();
    const played = video.play();
    if (played && played.catch) played.catch(function () {});
}

/* Hạt sáng bay trong hero — thuần trang trí.
   Sửa 13/09/2026: PageSpeed mobile báo "buộc chỉnh lại luồng" 112ms ngay dòng
   đọc window.innerWidth — hàm chạy lúc DOMContentLoaded, bố cục đang dang dở nên
   đọc số đo là trình duyệt phải tính lại bố cục tại chỗ. matchMedia cho đúng
   câu trả lời (innerWidth < 768 ≡ max-width: 767px) mà không ép tính bố cục.
   Việc tạo hạt cũng hoãn tới lúc trang rảnh: 12–25 thẻ có animation chen vào
   đúng lúc trang đang dựng chỉ thêm việc cho main thread, còn khách không thấy
   khác gì nếu hạt hiện muộn vài trăm ms. */
function initHeroParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const taoHat = function () {
        const count = window.matchMedia('(max-width: 767px)').matches ? 12 : 25;
        const frag = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.setProperty('--duration', (4 + Math.random() * 6) + 's');
            particle.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
            particle.style.setProperty('--dy', (Math.random() * 60 - 30) + 'px');
            particle.style.animationDelay = Math.random() * 5 + 's';
            const size = (2 + Math.random() * 3) + 'px';
            particle.style.width = size;
            particle.style.height = size;
            frag.appendChild(particle);
        }
        container.appendChild(frag);
    };
    const khiRanh = window.requestIdleCallback || function (fn) { return setTimeout(fn, 1500); };
    khiRanh(taoHat, { timeout: 3000 });
}

/* Lop wow vung dem (anh den thung lung "tho", sao bang, than hong, doi troi theo cuon) chi chay khi khach
   cuon GAN section do. Cho chay tu luc tai trang thi lan ve dau cham ~1,2s va Speed Index 3,1 -> 4,9s
   (Lighthouse 26/09/2026) du cac section nam tan cuoi trang. CSS chi gan animation cho section co class
   dem-chay (xem khoi LOP WOW trong style.css). IntersectionObserver khong ep tinh bo cuc (bug #26); cuon xa
   thi go class de may yeu khong phai chay animation ngoai man hinh. */
function initDemKhiGan() {
    const ids = ['gallery', 'tiktok', 'review', 'booking'];
    const els = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
        els.forEach(function (el) { el.classList.add('dem-chay'); });
        return;
    }
    const io = new IntersectionObserver(function (ds) {
        ds.forEach(function (d) { d.target.classList.toggle('dem-chay', d.isIntersecting); });
    }, { rootMargin: '300px 0px' });
    els.forEach(function (el) { io.observe(el); });
}
