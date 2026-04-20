/* ============================================
   Layout Loader - Tram Dung Chill
   Load shared nav + footer tu components/
   ============================================ */

function detectCurrentPage() {
    const path = window.location.pathname;
    if (path.indexOf('menu') !== -1) return 'menu';
    if (path.indexOf('/blog/') !== -1 && path.indexOf('blog.html') === -1) return 'blog-post';
    if (path.indexOf('blog') !== -1) return 'blog';
    if (path.indexOf('404') !== -1) return '404';
    if (path.indexOf('review-qr') !== -1) return 'review-qr';
    if (path.indexOf('/duong-di/') !== -1) return 'duong-di';
    return 'index';
}

async function loadLayout() {
    const page = detectCurrentPage();
    const pathname = window.location.pathname;
    const isSubdir = pathname.indexOf('/blog/') !== -1 || pathname.indexOf('/duong-di/') !== -1;
    const prefix = isSubdir ? '../' : '';

    // Load nav
    const navPlaceholder = document.getElementById('nav-placeholder');
    if (navPlaceholder) {
        try {
            const navResponse = await fetch(prefix + 'components/nav.html');
            const navHtml = await navResponse.text();
            navPlaceholder.outerHTML = navHtml;

            // Fix nav links for index page (use hash-only links)
            if (page === 'index') {
                document.querySelectorAll('[data-home-href]').forEach(function(el) {
                    el.setAttribute('href', el.getAttribute('data-home-href'));
                });
            }

            // Add scrolled class on sub-pages (navbar always solid)
            if (page !== 'index') {
                const navbar = document.getElementById('navbar');
                if (navbar) navbar.classList.add('scrolled');
            }

            // Fix nav/footer link hrefs when on a blog post (subdirectory) page
            if (isSubdir) {
                document.querySelectorAll('.nav-menu a, .nav-logo, .footer a').forEach(function(el) {
                    const href = el.getAttribute('href');
                    if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('../') && !href.startsWith('tel:') && !href.startsWith('mailto:')) {
                        el.setAttribute('href', '../' + href);
                    }
                });
            }

            // Highlight active nav link (blog-post highlights blog)
            const activePage = (page === 'blog-post') ? 'blog' : page;
            document.querySelectorAll('.nav-link[data-page]').forEach(function(link) {
                if (link.getAttribute('data-page') === activePage) {
                    link.classList.add('active');
                }
            });

            // On index, mark "Trang chu" as active
            if (page === 'index') {
                const homeLink = document.querySelector('.nav-link[data-page="index"]');
                if (homeLink) homeLink.classList.add('active');
            }
        } catch (err) {
            console.warn('Failed to load nav:', err);
        }
    }

    // Load footer
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        try {
            const footerFile = (page === 'index') ? 'components/footer.html' : 'components/footer-simple.html';
            const footerResponse = await fetch(prefix + footerFile);
            const footerHtml = await footerResponse.text();
            footerPlaceholder.outerHTML = footerHtml;
        } catch (err) {
            console.warn('Failed to load footer:', err);
        }
    }
}
