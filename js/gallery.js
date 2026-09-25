/* ============================================
   Tram Dung Chill - Gallery Lazy Loading & Lightbox
   ============================================ */

/**
 * IntersectionObserver-based lazy loading for all images with data-src.
 * Swaps data-src into src when image enters viewport, then adds .loaded
 * class for the fade-in effect.
 */

/* Gắn data-srcset TRƯỚC data-src (thêm 13/09/2026, ảnh gallery WebP 480/800/1200).
   Hai thuộc tính gán trong cùng một nhịp nên trình duyệt chọn ảnh một lần theo
   srcset + sizes; gán src trước thì có máy kịp tải luôn bản 1200px rồi mới đổi. */
function ganNguonAnh(img) {
    if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
        img.removeAttribute('data-srcset');
    }
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
}

function initLazyImages() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    if (!lazyImages.length) return;

    // Check for IntersectionObserver support
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                const img = entry.target;
                ganNguonAnh(img);

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
            ganNguonAnh(img);
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

    const captionEl = document.getElementById('lightboxCaption');
    const items = document.querySelectorAll('.gallery-item');
    const images = [];
    let currentIndex = 0;
    let lastFocus = null;   // phần tử khách đứng trước khi mở, để trả tiêu điểm khi đóng

    /* Mở được bằng bàn phím (Tab tới ô ảnh rồi Enter/Space) — trước đây ô gallery
       chỉ là <figure> nhận click chuột. Chỉ GHI thuộc tính lúc khởi tạo, không đọc
       số đo bố cục nào (bug #26). Tên cho trình đọc màn hình trỏ vào chính
       figcaption (aria-labelledby) nên đổi ngôn ngữ là tên đổi theo. */
    items.forEach(function (item, i) {
        const imgEl = item.querySelector('img');
        if (imgEl) {
            // Use data-src (original URL) if available, otherwise fall back to src
            const fullSrc = imgEl.dataset.src || imgEl.src;
            const cap = item.querySelector('figcaption');
            images.push({ src: fullSrc, alt: imgEl.alt || 'Ảnh tại Trạm Dừng Chill', cap: cap });
            item.tabIndex = 0;
            item.setAttribute('role', 'button');
            item.setAttribute('aria-haspopup', 'dialog');
            if (cap) {
                if (!cap.id) cap.id = 'galleryCap' + (i + 1);
                item.setAttribute('aria-labelledby', cap.id);
            }
            item.addEventListener('click', function () { open(i); });
            item.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();   // Space mặc định cuộn trang
                    open(i);
                }
            });
        }
    });

    if (totalEl) totalEl.textContent = images.length;

    function open(i) {
        currentIndex = i;
        showImage();
        lastFocus = document.activeElement;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        focusKhiHien(closeBtn);
    }

    /* Nút Đóng thừa hưởng visibility:hidden của lớp phủ, lại có transition:all nên
       ngay lúc mở nó vẫn còn "hidden" thêm một nhịp và focus() bị bỏ qua. Thử lại vài
       lần cách nhau 50ms tới khi ăn. */
    function focusKhiHien(el) {
        let n = 0;
        (function thu() {
            el.focus();
            if (document.activeElement !== el && ++n < 10) setTimeout(thu, 50);
        })();
    }

    function showImage() {
        if (!images[currentIndex]) return;
        img.src = images[currentIndex].src;
        img.alt = images[currentIndex].alt;
        if (currentEl) currentEl.textContent = currentIndex + 1;
        if (captionEl) {
            const cap = images[currentIndex].cap;
            captionEl.textContent = cap ? cap.textContent.trim() : '';
        }
    }

    function close() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
        lastFocus = null;
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
    let touchStartX = 0;
    lightbox.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener('touchmove', function (e) {
        e.preventDefault();
    }, { passive: false });

    lightbox.addEventListener('touchend', function (e) {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? nextBtn.click() : prevBtn.click();
        }
    });
}
