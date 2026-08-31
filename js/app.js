/* ============================================
   Tram Dung Chill - App Entry Point
   Async entry point with page detection
   ============================================ */

/* Đăng ký service worker — CHỜ trang tải xong đã.

   Bản cũ gọi register() ngay ở thân script, tức chạy ngay khi common.min.js
   thực thi (trước cả DOMContentLoaded). Sự kiện install của SW liền chạy
   cache.addAll(STATIC_ASSETS) — đo thật ngày 31/08/2026 là 600 KB — giành băng
   thông với ảnh hero, phông và CSS ngay giữa lúc trình duyệt đang vẽ khung hình
   đầu. Trên 4G chậm của PageSpeed, 600 KB ăn gần 3 giây băng thông.

   Nay đợi 'load' rồi mới đăng ký, và còn nhường thêm một khe rảnh nữa. Khách
   vẫn được đúng lợi ích cũ (chạy offline, vào lại nhanh) — chỉ là dọn kho lúc
   trang đã vẽ xong thay vì tranh chỗ lúc đang vẽ. */
if ('serviceWorker' in navigator) {
    var dangKySW = function () {
        var khiRanh = window.requestIdleCallback || function (fn) { return setTimeout(fn, 200); };
        khiRanh(function () {
            navigator.serviceWorker.register('/sw.js').catch(function () {});
        }, { timeout: 3000 });
    };
    if (document.readyState === 'complete') dangKySW();
    else window.addEventListener('load', dangKySW, { once: true });
}

document.addEventListener('DOMContentLoaded', async function() {
    const page = detectCurrentPage();

    // Load shared layout (nav + footer)
    await loadLayout();

    // Init i18n first (sets document.documentElement.lang)
    if (typeof initI18n === 'function') initI18n();

    // Generate Schema.org JSON-LD (after i18n so t() uses correct lang)
    if (typeof generateSchemas === 'function') generateSchemas();

    // Init shared modules
    initNavbar();
    initScrollProgress();
    if (typeof setCurrentYear === 'function') setCurrentYear();
    if (typeof initContactTracking === 'function') initContactTracking();
    if (typeof getTrafficSource === 'function') getTrafficSource();

    // Page-specific initialization
    if (page === 'index') {
        if (typeof initHeroVideo === 'function') initHeroVideo();
        if (typeof initHeroParticles === 'function') initHeroParticles();
        if (typeof initLazyImages === 'function') initLazyImages();
        if (typeof initGalleryLightbox === 'function') initGalleryLightbox();
        if (typeof initBookingForm === 'function') initBookingForm();
        if (typeof initScrollReveal === 'function') initScrollReveal();
        if (typeof initSmoothScroll === 'function') initSmoothScroll();
        if (typeof initScrollUI === 'function') initScrollUI();
        if (typeof initQRCode === 'function') initQRCode();
        if (typeof initModalClose === 'function') initModalClose();
        if (typeof setMinDate === 'function') setMinDate();
    } else if (page === 'blog') {
        if (typeof renderBlog === 'function') renderBlog();
    } else if (page === 'menu') {
        if (typeof initMenuFlipbook === 'function') initMenuFlipbook();
    }
});
