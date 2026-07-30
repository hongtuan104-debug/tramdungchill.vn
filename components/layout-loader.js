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

/* Sửa href BÊN TRONG một khối vừa chèn (nav hoặc footer) — không quét cả trang.
   Quét cả trang là sai: trang dịp (/dip/…) không có placeholder nào nhưng
   detectCurrentPage() vẫn trả 'index', nên footer tĩnh của nó sẽ bị đổi
   ../index.html thành #home và mọi link về trang chủ chết. */
function fixLinksIn(scope, page, isSubdir) {
    if (!scope) return;
    // Ở trang chủ: link về các mục trên chính trang này phải là neo, không phải
    // index.html#… (bấm vào là tải lại cả trang).
    if (page === 'index') {
        scope.querySelectorAll('[data-home-href]').forEach(function (el) {
            el.setAttribute('href', el.getAttribute('data-home-href'));
        });
    }
    // Trang nằm trong thư mục con: link tương đối phải lùi một cấp.
    if (isSubdir) {
        scope.querySelectorAll('a[href]').forEach(function (el) {
            const href = el.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('../') &&
                !href.startsWith('/') && !href.startsWith('tel:') && !href.startsWith('mailto:')) {
                el.setAttribute('href', '../' + href);
            }
        });
    }
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

            fixLinksIn(document.getElementById('navbar'), page, isSubdir);

            // Add scrolled class on sub-pages (navbar always solid)
            if (page !== 'index') {
                const navbar = document.getElementById('navbar');
                if (navbar) navbar.classList.add('scrolled');
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

    // Load footer — MỘT bản duy nhất cho mọi trang.
    // Trước đây chỉ trang chủ được footer đầy đủ, các trang khác nhận bản rút gọn
    // (footer-simple) không có địa chỉ, giờ mở cửa, không link tới trang dịp.
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        try {
            const footerResponse = await fetch(prefix + 'components/footer.html');
            const footerHtml = await footerResponse.text();
            footerPlaceholder.outerHTML = footerHtml;
            // Phải chạy SAU khi chèn: khối này chưa tồn tại lúc sửa link cho nav.
            fixLinksIn(document.querySelector('.footer'), page, isSubdir);
        } catch (err) {
            console.warn('Failed to load footer:', err);
        }
    }
}
