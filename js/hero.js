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
   Mobile giữ poster hero-sunset.jpg (232 KB) — nhẹ hơn 15 lần, vẫn đúng khung hình. */
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

function initHeroParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const count = window.innerWidth < 768 ? 12 : 25;

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
        container.appendChild(particle);
    }
}
