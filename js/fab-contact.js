/* ============================================
   Floating Contact Buttons - Tram Dung Chill
   Tu dong inject FAB lien he tren moi trang
   ============================================ */

(function() {
    'use strict';

    // Detect if we're in a subdirectory (blog posts)
    var isSubdir = window.location.pathname.indexOf('/blog/') !== -1;
    var prefix = isSubdir ? '../' : '';

    // Phone & Zalo from SITE_CONFIG if available, otherwise fallback
    var phone = '0989765070';
    var zaloUrl = 'https://zalo.me/0989765070';
    var fbUrl = 'https://www.facebook.com/tiemnuongtramdungchill';

    if (typeof SITE_CONFIG !== 'undefined') {
        phone = SITE_CONFIG.contact.phone || phone;
        zaloUrl = 'https://zalo.me/' + (SITE_CONFIG.contact.zaloNumber || phone);
        fbUrl = (SITE_CONFIG.social && SITE_CONFIG.social.facebook) || fbUrl;
    }

    var fabHTML = ''
        + '<div class="fab-contact" id="fabContact">'
        +   '<div class="fab-options">'
        +     '<a href="' + zaloUrl + '" target="_blank" rel="noopener" class="fab-option fab-opt-zalo" title="Chat Zalo">'
        +       '<span class="fab-opt-zalo-icon">Zalo</span>'
        +       '<span>Zalo</span>'
        +     '</a>'
        +     '<a href="tel:' + phone + '" class="fab-option fab-opt-phone" title="Gọi ngay">'
        +       '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'
        +       '<span>Gọi ngay</span>'
        +     '</a>'
        +     '<a href="' + fbUrl + '" target="_blank" rel="noopener" class="fab-option fab-opt-fb" title="Facebook">'
        +       '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>'
        +       '<span>Facebook</span>'
        +     '</a>'
        +   '</div>'
        +   '<button class="fab-main" id="fabMainBtn" aria-label="Liên hệ">'
        +     '<svg class="fab-main-icon fab-icon-contact" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
        +     '<svg class="fab-main-icon fab-icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        +   '</button>'
        + '</div>';

    // Inject when DOM is ready
    function injectFab() {
        // Don't inject if already present
        if (document.getElementById('fabContact')) return;

        // Remove old fabContainer if present (index.html has one)
        var oldFab = document.getElementById('fabContainer');
        if (oldFab) oldFab.remove();

        document.body.insertAdjacentHTML('beforeend', fabHTML);

        var fabEl = document.getElementById('fabContact');
        var fabBtn = document.getElementById('fabMainBtn');

        if (!fabBtn || !fabEl) return;

        // Toggle open/close
        fabBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            fabEl.classList.toggle('open');
        });

        // Close when clicking outside
        document.addEventListener('click', function(e) {
            if (!fabEl.contains(e.target)) {
                fabEl.classList.remove('open');
            }
        });

        // Show after scrolling 200px (or immediately on short pages)
        function checkScroll() {
            var show = window.scrollY > 200 || document.body.scrollHeight <= window.innerHeight + 400;
            fabEl.classList.toggle('visible', show);
        }

        var ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    checkScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        // Initial check
        checkScroll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectFab);
    } else {
        injectFab();
    }
})();
