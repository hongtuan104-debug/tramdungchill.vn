/* ============================================
   Tram Dung Chill - Gallery Lightbox
   ============================================ */

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

    items.forEach((item, i) => {
        const imgEl = item.querySelector('img');
        if (imgEl) {
            images.push({ src: imgEl.src, alt: imgEl.alt || 'Ảnh tại Trạm Dừng Chill' });
            item.addEventListener('click', () => {
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
    lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });

    prevBtn.addEventListener('click', e => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showImage();
    });

    nextBtn.addEventListener('click', e => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % images.length;
        showImage();
    });

    document.addEventListener('keydown', e => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') prevBtn.click();
        if (e.key === 'ArrowRight') nextBtn.click();
    });

    // Touch swipe
    let touchStartX = 0;
    lightbox.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener('touchmove', e => {
        e.preventDefault();
    }, { passive: false });

    lightbox.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? nextBtn.click() : prevBtn.click();
        }
    });
}
