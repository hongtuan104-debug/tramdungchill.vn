/* ============================================
   Sticky Booking Bar + TikTok Gallery Lazy Load
   ============================================ */

(function() {
    'use strict';

    // === STICKY BOOKING BAR ===
    function initStickyBar() {
        var bar = document.getElementById('stickyBookBar');
        if (!bar) return;

        var hero = document.querySelector('.hero');
        var heroHeight = hero ? hero.offsetHeight : 600;
        var bookingSection = document.getElementById('booking');
        var lastScroll = 0;

        function handleScroll() {
            var scrollY = window.pageYOffset;
            var bookingTop = bookingSection ? bookingSection.offsetTop - 200 : Infinity;

            // Show after scroll past 60% of hero, hide when in booking section
            if (scrollY > heroHeight * 0.6 && scrollY < bookingTop) {
                bar.classList.add('visible');
            } else {
                bar.classList.remove('visible');
            }
            lastScroll = scrollY;
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
    }

    // === TIKTOK GALLERY: Lazy load + autoplay on view ===
    function initTikTokGallery() {
        var videos = document.querySelectorAll('.tiktok-video');
        if (!videos.length) return;

        // Load video sources when in viewport
        var loadObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var video = entry.target;
                    var source = video.querySelector('source[data-src]');
                    if (source) {
                        source.src = source.dataset.src;
                        video.load();
                        source.removeAttribute('data-src');
                    }
                    loadObserver.unobserve(video);
                }
            });
        }, { rootMargin: '200px' });

        // Autoplay when fully visible (mobile-friendly)
        var playObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                var video = entry.target;
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    video.play().catch(function() {});
                } else {
                    video.pause();
                }
            });
        }, { threshold: [0, 0.5, 1] });

        videos.forEach(function(video) {
            loadObserver.observe(video);
            playObserver.observe(video);

            // Hover to play (desktop)
            var item = video.closest('.tiktok-item');
            if (item) {
                item.addEventListener('mouseenter', function() {
                    video.play().catch(function() {});
                });
                item.addEventListener('mouseleave', function() {
                    video.currentTime = 0;
                });
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initStickyBar();
            initTikTokGallery();
        });
    } else {
        initStickyBar();
        initTikTokGallery();
    }
})();
