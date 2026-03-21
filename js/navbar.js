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

    function closeMenu() {
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('open');
        if (navOverlay) navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function openMenu() {
        navToggle.classList.add('active');
        navToggle.setAttribute('aria-expanded', 'true');
        navMenu.classList.add('open');
        if (navOverlay) navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
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
