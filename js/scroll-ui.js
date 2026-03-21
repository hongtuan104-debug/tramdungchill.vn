/* ============================================
   Tram Dung Chill - Scroll Effects
   ============================================ */

function initScrollReveal() {
    const selectors = [
        '.exp-card', '.section-header', '.booking-info',
        '.booking-form-wrapper', '.map-wrapper', '.review-wrapper',
        '.occasions-banner', '.qr-card'
    ];

    const elements = document.querySelectorAll(selectors.join(', '));
    elements.forEach(el => el.classList.add('reveal'));

    const gridItems = document.querySelectorAll('.menu-item, .gallery-item');
    gridItems.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const parent = entry.target.parentElement;
                const isGridChild = parent && (parent.classList.contains('menu-grid') || parent.classList.contains('gallery-grid'));
                const delay = isGridChild ? Array.from(parent.children).indexOf(entry.target) * 40 : 0;

                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
    gridItems.forEach(el => observer.observe(el));
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function initScrollUI() {
    const navbar = document.getElementById('navbar');
    const fab = document.getElementById('fabContainer');
    const backToTop = document.getElementById('backToTop');
    const sections = document.querySelectorAll('section[id]');

    let ticking = false;

    function onScroll() {
        const scrollY = window.scrollY;

        if (navbar) navbar.classList.toggle('scrolled', scrollY > 60);
        if (fab) fab.classList.toggle('visible', scrollY > 400);
        if (backToTop) backToTop.classList.toggle('visible', scrollY > 800);

        const offset = scrollY + 120;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const link = document.querySelector('.nav-link[href="#' + id + '"]');
            if (link) {
                link.classList.toggle('active', offset >= top && offset < top + height);
            }
        });

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    onScroll();
}
