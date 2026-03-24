/* ============================================
   Tram Dung Chill - Gallery Lazy Loading & Lightbox
   ============================================ */

/**
 * IntersectionObserver-based lazy loading for all images with data-src.
 * Swaps data-src into src when image enters viewport, then adds .loaded
 * class for the fade-in effect.
 */
function initLazyImages() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    if (!lazyImages.length) return;

    // Check for IntersectionObserver support
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');

                img.addEventListener('load', function () {
                    img.classList.add('loaded');
                }, { once: true });

                // If already cached by the browser
                if (img.complete) {
                    img.classList.add('loaded');
                }

                obs.unobserve(img);
            });
        }, {
            rootMargin: '200px 0px', // start loading 200px before viewport
            threshold: 0.01
        });

        lazyImages.forEach(function (img) {
            observer.observe(img);
        });
    } else {
        // Fallback: load all images immediately for older browsers
        lazyImages.forEach(function (img) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            img.addEventListener('load', function () {
                img.classList.add('loaded');
            }, { once: true });
            if (img.complete) {
                img.classList.add('loaded');
            }
        });
    }
}

/**
 * Gallery lightbox with navigation, keyboard, and touch swipe support.
 */
function initGalleryLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const img = lightbox.querySelector('.lightbox-img');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    const currentEl = document.getElementById('lightboxCurrent');
    const totalEl = document.getElementById('lightboxTotal');

    if (!img || !closeBtn || !prevBtn || !nextBtn) return;

    const items = document.querySelectorAll('.gallery-item');
    const images = [];
    let currentIndex = 0;

    items.forEach(function (item, i) {
        const imgEl = item.querySelector('img');
        if (imgEl) {
            // Use data-src (original URL) if available, otherwise fall back to src
            var fullSrc = imgEl.dataset.src || imgEl.src;
            images.push({ src: fullSrc, alt: imgEl.alt || 'Ảnh tại Trạm Dừng Chill' });
            item.addEventListener('click', function () {
                currentIndex = i;
                showImage();
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }
    });

    if (totalEl) totalEl.textContent = images.length;

    function showImage() {
        if (!images[currentIndex]) return;
        img.src = images[currentIndex].src;
        img.alt = images[currentIndex].alt;
        if (currentEl) currentEl.textContent = currentIndex + 1;
    }

    function close() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });

    prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showImage();
    });

    nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % images.length;
        showImage();
    });

    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') prevBtn.click();
        if (e.key === 'ArrowRight') nextBtn.click();
    });

    // Touch swipe
    var touchStartX = 0;
    lightbox.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener('touchmove', function (e) {
        e.preventDefault();
    }, { passive: false });

    lightbox.addEventListener('touchend', function (e) {
        var diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? nextBtn.click() : prevBtn.click();
        }
    });
}
