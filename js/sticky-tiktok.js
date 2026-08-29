/* ============================================
   Sticky Booking Bar + TikTok Gallery Lazy Load
   ============================================ */

(function() {
    'use strict';

    // === STICKY BOOKING BAR ===
    function initStickyBar() {
        var bar = document.getElementById('stickyBookBar');
        if (!bar) return;

        /* Chiều cao hero + mốc khối đặt bàn — đo một lần rồi dùng lại.
           Bản cũ đọc hero.offsetHeight ngay lúc DOMContentLoaded, đúng lúc bố cục
           còn bẩn nên phải tính lại cả trang: PageSpeed 29/08/2026 tính riêng
           dòng đó 52ms — nặng nhất trong nhóm "buộc chỉnh lại luồng".
           Còn offsetTop thì bản cũ đọc lại MỖI sự kiện cuộn, mà ngay dưới nó lại
           ghi class vào <body> — làm bẩn toàn trang rồi lần cuộn sau đọc lại,
           thành ra bắt tính lại bố cục liên tục suốt lúc cuộn. */
        var geo = cachedLayout(function () {
            var hero = document.querySelector('.hero');
            var booking = document.getElementById('booking');
            return {
                heroHeight: hero ? hero.offsetHeight : 600,
                bookingTop: booking ? booking.offsetTop - 200 : Infinity
            };
        });

        var shown = null;
        function apply(show) {
            if (show === shown) return;   // ghi lại class y hệt cũng làm bẩn bố cục
            shown = show;
            bar.classList.toggle('visible', show);
            document.body.classList.toggle('sticky-bar-active', show);
        }

        // Show after scroll past 60% of hero, hide when in booking section
        function handleScroll() {
            var scrollY = window.pageYOffset;
            /* Ở đỉnh trang thì chắc chắn ẩn — thoát sớm, khỏi đo gì. Nhờ vậy lượt
               tải đầu (Lighthouse đo ở đỉnh) không phải tính lại bố cục lần nào. */
            if (scrollY === 0) { apply(false); return; }
            var g = geo.get();
            apply(scrollY > g.heroHeight * 0.6 && scrollY < g.bookingTop);
        }

        var ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () { handleScroll(); ticking = false; });
        }, { passive: true });
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

                    /* Ảnh poster cũng phải hoãn: trình duyệt tải poster NGAY cả khi
                       preload="none". Ba poster TikTok nặng 503 KB mà nằm tận 28-30%
                       trang — tải sớm chỉ tranh băng thông với ảnh hero, đẩy LCP lên.
                       Nên trong HTML để data-poster, tới đây mới gán thật. */
                    if (video.dataset.poster) {
                        video.poster = video.dataset.poster;
                        video.removeAttribute('data-poster');
                    }

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
