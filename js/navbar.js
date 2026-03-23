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
}
