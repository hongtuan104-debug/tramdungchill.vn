/* ============================================
   Tram Dung Chill - Navigation
   ============================================ */

function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navOverlay = document.getElementById('navOverlay');

    if (!navbar || !navToggle || !navMenu) return;

    let scrollY = 0;

    function closeMenu() {
        // Menu chưa mở (máy tính, bấm link nav) thì không làm gì: scrollTo ở dưới sẽ kéo
        // trang về đầu trước khi trượt tới neo. Giống dongMenu() của bài blog và 404.
        if (!navMenu.classList.contains('open')) return;
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('open');
        if (navOverlay) navOverlay.classList.remove('active');
        document.body.classList.remove('menu-open');
        document.body.style.top = '';
        // Trả về chỗ cũ NGAY, không trượt: html có scroll-behavior:smooth nên scrollTo(0, y)
        // trượt từ đầu trang xuống, khách thấy trang chạy và bấm sớm thì dừng hụt chỗ.
        // Giống bản trong templates/blog-post.html và 404.html.
        window.scrollTo({ top: scrollY, behavior: 'instant' });
    }

    function openMenu() {
        scrollY = window.scrollY;
        navToggle.classList.add('active');
        navToggle.setAttribute('aria-expanded', 'true');
        navMenu.classList.add('open');
        if (navOverlay) navOverlay.classList.add('active');
        document.body.classList.add('menu-open');
        document.body.style.top = `-${scrollY}px`;
    }

    navToggle.addEventListener('click', () => {
        navMenu.classList.contains('open') ? closeMenu() : openMenu();
    });

    if (navOverlay) {
        navOverlay.addEventListener('click', closeMenu);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // ESC đóng menu — trên mobile .nav-menu phủ kín inset:0, mà trước 08/09/2026
    // chỉ đóng được bằng chuột (nút toggle / overlay / bấm một link). Khách dùng
    // bàn phím phải Tab ngược về đúng nút hamburger mới thoát được lớp phủ.
    // Lightbox ảnh (gallery.js) và menu lật (menu-flipbook.js) đều đã nghe ESC,
    // nên thiếu ở đây còn là bất nhất ngay trong cùng site.
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('open')) {
            closeMenu();
            navToggle.focus();   // trả tiêu điểm về chỗ khách vừa rời đi
        }
    });
}
