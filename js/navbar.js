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
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('open');
        if (navOverlay) navOverlay.classList.remove('active');
        document.body.classList.remove('menu-open');
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
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
