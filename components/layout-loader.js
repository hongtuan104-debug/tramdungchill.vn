/* ============================================
   Layout Loader - Tram Dung Chill
   Load shared nav + footer tu components/
   ============================================ */

function detectCurrentPage() {
    var path = window.location.pathname;
    if (path.indexOf('menu') !== -1) return 'menu';
    if (path.indexOf('blog') !== -1) return 'blog';
    if (path.indexOf('404') !== -1) return '404';
    if (path.indexOf('review-qr') !== -1) return 'review-qr';
    return 'index';
}

async function loadLayout() {
    var page = detectCurrentPage();

    // Load nav
    var navPlaceholder = document.getElementById('nav-placeholder');
    if (navPlaceholder) {
        try {
            var navResponse = await fetch('components/nav.html');
            var navHtml = await navResponse.text();
            navPlaceholder.outerHTML = navHtml;

            // Fix nav links for index page (use hash-only links)
            if (page === 'index') {
                document.querySelectorAll('[data-home-href]').forEach(function(el) {
                    el.setAttribute('href', el.getAttribute('data-home-href'));
                });
            }

            // Add scrolled class on sub-pages (navbar always solid)
            if (page !== 'index') {
                var navbar = document.getElementById('navbar');
                if (navbar) navbar.classList.add('scrolled');
            }

            // Highlight active nav link
            document.querySelectorAll('.nav-link[data-page]').forEach(function(link) {
                if (link.getAttribute('data-page') === page) {
                    link.classList.add('active');
                }
            });

            // On index, mark "Trang chu" as active
            if (page === 'index') {
                var homeLink = document.querySelector('.nav-link[data-page="index"]');
                if (homeLink) homeLink.classList.add('active');
            }
        } catch (err) {
            console.warn('Failed to load nav:', err);
        }
    }

    // Load footer
    var footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        try {
            var footerFile = (page === 'index') ? 'components/footer.html' : 'components/footer-simple.html';
            var footerResponse = await fetch(footerFile);
            var footerHtml = await footerResponse.text();
            footerPlaceholder.outerHTML = footerHtml;
        } catch (err) {
            console.warn('Failed to load footer:', err);
        }
    }
}
