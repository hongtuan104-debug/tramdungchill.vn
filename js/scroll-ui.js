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

    /* Vị trí các mục và link nav tương ứng — đo một lần thay vì mỗi khung hình.
       Bản cũ trong onScroll đọc offsetTop rồi ghi class rồi lại đọc offsetTop
       của mục sau… mỗi vòng lặp là một lần bắt trình duyệt tính lại bố cục cả
       trang, nhân với số mục, nhân với mỗi khung hình cuộn. Còn querySelector
       tra link cũng lặp lại y hệt dù kết quả không bao giờ đổi. */
    const layout = cachedLayout(function () {
        const out = [];
        sections.forEach(section => {
            const id = section.getAttribute('id');
            const link = document.querySelector('.nav-link[href="#' + id + '"]');
            if (!link) return;
            out.push({ link: link, top: section.offsetTop, height: section.offsetHeight });
        });
        return out;
    });

    /* Nav đã mang sẵn "scrolled" trong HTML (generate-nav.js nướng cho mọi trang con)
       thì luôn nền đặc — không được gỡ khi khách cuộn về đầu trang. Sửa 14/09/2026:
       detectCurrentPage() không biết /tac-gia/ nên trả 'index', app.js chạy
       initScrollUI trên trang tác giả và cuộn ngược lên đầu là nav mất nền. Chỉ
       nav trong suốt của trang chủ mới được bật/tắt theo vị trí cuộn. */
    const navLuonDac = !!(navbar && navbar.classList.contains('scrolled'));

    function onScroll() {
        const scrollY = window.scrollY;

        // ĐỌC hết trước, GHI hết sau — xen kẽ mới là thứ đẻ ra reflow.
        const items = layout.get();

        if (navbar && !navLuonDac) navbar.classList.toggle('scrolled', scrollY > 60);
        if (fab) fab.classList.toggle('visible', scrollY > 400);
        if (backToTop) backToTop.classList.toggle('visible', scrollY > 800);

        const offset = scrollY + 120;
        items.forEach(item => {
            item.link.classList.toggle('active', offset >= item.top && offset < item.top + item.height);
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

    /* KHÔNG gọi onScroll() lúc tải trang (14/09/2026, CLAUDE.md bug #26).
       13/09 đã hoãn nó qua một khung hình, nhưng trace 4G chậm vẫn bắt được 1–2ms ép
       bố cục (CSS async/phông về làm bẩn bố cục ngay trước lúc hẹn giờ chạy). Mà ở
       đầu trang nó chẳng đổi gì: navbar chưa "scrolled", FAB/nút lên đầu đang ẩn, và
       link "Trang chủ" đã mang sẵn class active trong HTML (generate-nav.js nướng).
       Tải lại giữa trang / mở bằng #neo: trình duyệt bắn 'scroll' → bộ nghe trên lo. */

    // Lazy load Google Maps iframe when scrolled into view
    const mapEmbed = document.getElementById('mapEmbed');
    if (mapEmbed && mapEmbed.dataset.src) {
        const mapObserver = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting) {
                const iframe = document.createElement('iframe');
                iframe.src = mapEmbed.dataset.src;
                iframe.width = '100%';
                iframe.height = '100%';
                iframe.style.border = '0';
                iframe.allowFullscreen = true;
                iframe.loading = 'lazy';
                iframe.referrerPolicy = 'no-referrer-when-downgrade';
                iframe.title = 'Bản đồ Tiệm Nướng Trạm Dừng Chill';
                mapEmbed.innerHTML = '';
                mapEmbed.appendChild(iframe);
                mapObserver.disconnect();
            }
        }, { rootMargin: '200px' });
        mapObserver.observe(mapEmbed);
    }
}
