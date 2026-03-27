/* ============================================
   Tram Dung Chill - App Entry Point
   Async entry point with page detection
   ============================================ */

// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
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

    // Page-specific initialization
    if (page === 'index') {
        if (typeof initPreloader === 'function') initPreloader();
        if (typeof initHeroSlider === 'function') initHeroSlider();
        if (typeof initHeroParticles === 'function') initHeroParticles();
        if (typeof renderMenu === 'function') renderMenu();
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
        if (typeof renderMenuPage === 'function') renderMenuPage();
    }
});
