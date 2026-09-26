/* ============================================
   Thanh "Đặt bàn online" dính đáy + nút lên đầu trang cho các trang con
   (Thực đơn, Blog, Đường đi, tác giả, 4 trang dịp) — 26/09/2026, sếp Tuấn duyệt.
   Trang chủ có sẵn thanh trong HTML (sticky-tiktok.js lo); 141 bài blog có bản riêng
   trong templates/blog-post.html vì bài không nạp common.min.js.

   TẠO BẰNG JS, không viết vào HTML: chữ của thanh nằm trong HTML là lọt vào dấu vân
   nội dung của cap-nhat-lastmod.js → các trang này bị đóng dấu "Cập nhật" + báo
   IndexNow oan (CLAUDE.md #30, #47). CSS có sẵn trong style.css: thanh ẩn sẵn
   (translateY 100%) nên không xô bố cục; body.sticky-bar-active đẩy nút nổi lên.
   Chỉ đọc scrollY trong sự kiện cuộn, không đọc lúc tải trang (bug #26).
   ============================================ */
function initThanhDatBan() {
    if (document.getElementById('stickyBookBar')) return;   // trang chủ tự có thanh riêng

    // 4 trang dịp có form ngay trên trang → dẫn tới form đó; trang khác dẫn về form trang chủ.
    const formTrang = document.getElementById('booking-form');
    const dich = (window.TRANSLATIONS && window.TRANSLATIONS[document.documentElement.lang]) || null;
    const chu = function (khoa, macDinh) { return (dich && dich[khoa]) || macDinh; };

    const thanh = document.createElement('div');
    thanh.className = 'sticky-book-bar';
    thanh.id = 'stickyBookBar';
    // data-i18n để khách bấm EN là applyTranslations() đổi chữ luôn (trang dịp không nạp bản dịch → giữ tiếng Việt)
    thanh.innerHTML = '<div class="sticky-book-info">' +
        '<div class="sticky-book-title" data-i18n="sticky.title">' + chu('sticky.title', 'Đặt bàn online') + '</div>' +
        '<div class="sticky-book-sub" data-i18n="sticky.sub">' + chu('sticky.sub', 'Setup miễn phí • Phản hồi 15 phút') + '</div></div>' +
        '<a href="' + (formTrang ? '#booking-form' : '/#booking') + '" class="sticky-book-btn">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
        '<span data-i18n="sticky.cta">' + chu('sticky.cta', 'Đặt Bàn') + '</span></a>';
    document.body.appendChild(thanh);

    let lenDau = document.getElementById('backToTop');
    if (!lenDau) {
        lenDau = document.createElement('button');
        lenDau.type = 'button';
        lenDau.className = 'back-to-top';
        lenDau.id = 'backToTop';
        lenDau.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Back to top' : 'Lên đầu trang');
        lenDau.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>';
        document.body.appendChild(lenDau);
        lenDau.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }

    // Khối mời đặt bàn của chính trang đang hiện thì ẩn thanh, khỏi hai lời mời chồng nhau
    // (như trang chủ ẩn thanh khi khối đặt bàn hiện). Trang Đường đi không có khối này.
    const khoiMoi = formTrang || document.querySelector('.menu-cta, .blog-cta, .author-cta');
    let khoiHien = false, dangHien = null, choKhung = false;

    function capNhat() {
        const y = window.scrollY;
        const hien = y > 600 && !khoiHien;
        if (hien !== dangHien) {
            dangHien = hien;
            thanh.classList.toggle('visible', hien);
            document.body.classList.toggle('sticky-bar-active', hien);
        }
        lenDau.classList.toggle('visible', y > 800);
        choKhung = false;
    }

    if (khoiMoi && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
            khoiHien = es[es.length - 1].isIntersecting;
            if (dangHien !== null) capNhat();   // chưa cuộn lần nào thì thôi, khỏi đọc scrollY lúc tải
        }).observe(khoiMoi);
    }
    window.addEventListener('scroll', function () {
        if (choKhung) return;
        choKhung = true;
        requestAnimationFrame(capNhat);
    }, { passive: true });
}
