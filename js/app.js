/* ============================================
   Tram Dung Chill - App Entry Point
   Async entry point with page detection
   ============================================ */

document.addEventListener('DOMContentLoaded', async function() {
    var page = detectCurrentPage();

    // Load shared layout (nav + footer)
    await loadLayout();

    // Generate Schema.org JSON-LD
    if (typeof generateSchemas === 'function') generateSchemas();

    // Init shared modules
    initNavbar();
    initScrollProgress();
    if (typeof initI18n === 'function') initI18n();
    if (typeof setCurrentYear === 'function') setCurrentYear();

    // Page-specific initialization
    if (page === 'index') {
        if (typeof initPreloader === 'function') initPreloader();
        if (typeof initHeroSlider === 'function') initHeroSlider();
        if (typeof initHeroParticles === 'function') initHeroParticles();
        if (typeof renderMenu === 'function') renderMenu();
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
