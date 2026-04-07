/* ============================================
   Floating Contact Buttons - Tram Dung Chill
   Tu dong inject FAB lien he tren moi trang
   ============================================ */

(function() {
    'use strict';

    // Track click events via GA4 + Google Ads + Meta Pixel
    function trackEvent(action, source) {
        if (typeof gtag === 'function') {
            gtag('event', action, { event_category: 'contact', event_label: source });
        }
        // Meta Pixel — Contact event
        if (typeof fbq === 'function') {
            fbq('track', 'Contact', { content_name: action, content_category: source });
        }
    }

    // Phone & Zalo from SITE_CONFIG if available, otherwise fallback
    let phone = '0989765070';
    let zaloUrl = 'https://zalo.me/0989765070';
    let fbUrl = 'https://www.facebook.com/tiemnuongtramdungchill';

    if (typeof SITE_CONFIG !== 'undefined') {
        phone = SITE_CONFIG.contact.phone || phone;
        zaloUrl = 'https://zalo.me/' + (SITE_CONFIG.contact.zaloNumber || phone);
        fbUrl = (SITE_CONFIG.social && SITE_CONFIG.social.facebook) || fbUrl;
    }

    function buildFabDOM() {
        const container = document.createElement('div');
        container.className = 'fab-contact';
        container.id = 'fabContact';

        const options = document.createElement('div');
        options.className = 'fab-options';

        // Zalo
        const zaloLink = document.createElement('a');
        zaloLink.href = zaloUrl;
        zaloLink.target = '_blank';
        zaloLink.rel = 'noopener';
        zaloLink.className = 'fab-option fab-opt-zalo';
        zaloLink.title = 'Chat Zalo';
        zaloLink.innerHTML = '<span class="fab-opt-zalo-icon">Zalo</span><span>Zalo</span>';
        zaloLink.addEventListener('click', function() { trackEvent('click_zalo', 'fab'); });
        options.appendChild(zaloLink);

        // Phone
        const phoneLink = document.createElement('a');
        phoneLink.href = 'tel:' + phone;
        phoneLink.className = 'fab-option fab-opt-phone';
        phoneLink.title = 'Gọi ngay';
        phoneLink.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>Gọi ngay</span>';
        phoneLink.addEventListener('click', function() { trackEvent('click_phone', 'fab'); });
        options.appendChild(phoneLink);

        // Facebook
        const fbLink = document.createElement('a');
        fbLink.href = fbUrl;
        fbLink.target = '_blank';
        fbLink.rel = 'noopener';
        fbLink.className = 'fab-option fab-opt-fb';
        fbLink.title = 'Facebook';
        fbLink.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg><span>Facebook</span>';
        fbLink.addEventListener('click', function() { trackEvent('click_facebook', 'fab'); });
        options.appendChild(fbLink);

        container.appendChild(options);

        // Main button
        const mainBtn = document.createElement('button');
        mainBtn.className = 'fab-main';
        mainBtn.id = 'fabMainBtn';
        mainBtn.setAttribute('aria-label', 'Liên hệ');
        mainBtn.innerHTML = '<svg class="fab-main-icon fab-icon-contact" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><svg class="fab-main-icon fab-icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        container.appendChild(mainBtn);

        return container;
    }

    // Inject when DOM is ready
    function injectFab() {
        // Don't inject if already present
        if (document.getElementById('fabContact')) return;

        // Remove old fabContainer if present (index.html has one)
        const oldFab = document.getElementById('fabContainer');
        if (oldFab) oldFab.remove();

        const fabEl = buildFabDOM();
        document.body.appendChild(fabEl);

        const fabBtn = document.getElementById('fabMainBtn');
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
            const show = window.scrollY > 200 || document.body.scrollHeight <= window.innerHeight + 400;
            fabEl.classList.toggle('visible', show);
        }

        let ticking = false;
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
