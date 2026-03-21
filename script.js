/* ============================================
   TRẠM DỪNG CHILL - Premium JavaScript
   All bugs fixed: timezone, regex, preloader,
   lightbox alt, scroll perf, aria, Zalo
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initNavbar();
    initHeroSlider();
    initHeroParticles();
    initMenuTabs();
    initGalleryLightbox();
    initBookingForm();
    initScrollReveal();
    initSmoothScroll();
    initScrollUI();
    initQRCode();
    initModalClose();
    setMinDate();
    setCurrentYear();
});

/* ============================================
   MODAL CLOSE BUTTON
   ============================================ */
function initModalClose() {
    const btn = document.getElementById('closeModalBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            document.getElementById('successModal').classList.remove('active');
        });
    }
}

/* ============================================
   PRELOADER (fixed race condition)
   ============================================ */
function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    let fallbackTimer = setTimeout(() => {
        preloader.classList.add('hidden');
    }, 3000);

    window.addEventListener('load', () => {
        clearTimeout(fallbackTimer);
        setTimeout(() => preloader.classList.add('hidden'), 600);
    });
}

/* ============================================
   NAVBAR (with aria-expanded + overlay)
   ============================================ */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navOverlay = document.getElementById('navOverlay');

    if (!navbar || !navToggle || !navMenu) return;

    function closeMenu() {
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('open');
        if (navOverlay) navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function openMenu() {
        navToggle.classList.add('active');
        navToggle.setAttribute('aria-expanded', 'true');
        navMenu.classList.add('open');
        if (navOverlay) navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    navToggle.addEventListener('click', () => {
        navMenu.classList.contains('open') ? closeMenu() : openMenu();
    });

    if (navOverlay) {
        navOverlay.addEventListener('click', closeMenu);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Consolidated scroll handler registered in initScrollUI()
}

/* ============================================
   HERO SLIDER with time indicator
   ============================================ */
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.time-dot');
    if (slides.length <= 1) return;

    let current = 0;
    const total = slides.length;
    let timer;

    function goToSlide(index) {
        slides[current].classList.remove('active');
        if (dots[current]) dots[current].classList.remove('active');
        current = index % total;
        slides[current].classList.add('active');
        if (dots[current]) dots[current].classList.add('active');
    }

    function startTimer() {
        timer = setInterval(() => goToSlide(current + 1), 7000);
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            clearInterval(timer);
            goToSlide(parseInt(dot.dataset.slide));
            startTimer();
        });
    });

    startTimer();
}

/* ============================================
   HERO PARTICLES (with reduced motion check)
   ============================================ */
function initHeroParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;

    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const count = window.innerWidth < 768 ? 12 : 25;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.setProperty('--duration', (4 + Math.random() * 6) + 's');
        particle.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
        particle.style.setProperty('--dy', (Math.random() * 60 - 30) + 'px');
        particle.style.animationDelay = Math.random() * 5 + 's';
        const size = (2 + Math.random() * 3) + 'px';
        particle.style.width = size;
        particle.style.height = size;
        container.appendChild(particle);
    }
}

/* ============================================
   MENU TABS
   ============================================ */
function initMenuTabs() {
    const tabs = document.querySelectorAll('.menu-tab');
    const panels = document.querySelectorAll('.menu-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            const panel = document.getElementById(target);
            if (panel) panel.classList.add('active');
        });
    });

    // Set initial aria-selected
    tabs.forEach(t => t.setAttribute('aria-selected', t.classList.contains('active') ? 'true' : 'false'));
}

/* ============================================
   GALLERY LIGHTBOX (with alt text + null checks)
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

    // Touch swipe (fixed: clientX + prevent scroll)
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

/* ============================================
   BOOKING FORM → Zalo + Webhook
   (fixed: timezone, regex, dead code, error log)
   ============================================ */
function initBookingForm() {
    const form = document.getElementById('bookingForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Validation
        if (!data.name || !data.phone || !data.date || !data.time || !data.guests) {
            showNotification('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
            return;
        }

        // Phone validation (Vietnamese: 10 digits starting with 0)
        const cleanPhone = data.phone.replace(/[\.\s\-]/g, '');
        if (!/^0[0-9]{9}$/.test(cleanPhone)) {
            showNotification('Số điện thoại không hợp lệ (cần 10 số)!', 'error');
            return;
        }

        // Show loading
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        submitBtn.disabled = true;

        // Format message
        const message = formatZaloMessage(data);

        // Try sending via webhook (Google Apps Script, Formspree, etc.)
        const webhookUrl = form.dataset.webhook;
        if (webhookUrl) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: data.name,
                        phone: data.phone,
                        date: data.date,
                        time: data.time,
                        guests: data.guests,
                        occasion: data.occasion || '',
                        note: data.note || '',
                        message: message,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (err) {
                console.warn('Webhook failed:', err);
            }
        }

        // Open Zalo
        const zaloUrl = `https://zalo.me/0989765070?text=${encodeURIComponent(message)}`;

        setTimeout(() => {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;

            const modal = document.getElementById('successModal');
            if (modal) modal.classList.add('active');
            form.reset();

            window.open(zaloUrl, '_blank', 'noopener,noreferrer');
        }, 1000);
    });
}

function formatZaloMessage(data) {
    const occasionMap = {
        'birthday': 'Sinh nhật',
        'anniversary': 'Kỷ niệm',
        'date': 'Hẹn hò',
        'gathering': 'Họp mặt bạn bè',
        'company': 'Công ty / team',
        'other': 'Khác'
    };

    // Fixed: parse date without timezone issue
    const [y, m, d] = data.date.split('-');
    const dateStr = `${d}/${m}/${y}`;

    let msg = `--- ĐẶT BÀN ONLINE ---\n`;
    msg += `Tên: ${data.name}\n`;
    msg += `SĐT: ${data.phone}\n`;
    msg += `Ngày: ${dateStr}\n`;
    msg += `Giờ: ${data.time}\n`;
    msg += `Số khách: ${data.guests}\n`;
    if (data.occasion) msg += `Dịp: ${occasionMap[data.occasion] || data.occasion}\n`;
    if (data.note) msg += `Ghi chú: ${data.note}\n`;
    msg += `---\nĐặt qua website tramdungchill.vn`;

    return msg;
}

function setMinDate() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.setAttribute('min', `${yyyy}-${mm}-${dd}`);
    }
}

function setCurrentYear() {
    const el = document.getElementById('currentYear');
    if (el) el.textContent = new Date().getFullYear();
}

/* ============================================
   NOTIFICATION
   ============================================ */
function showNotification(message, type = 'success') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = type === 'success' ? '\u2713' : '\u2717';
    const msg = document.createElement('span');
    msg.className = 'toast-msg';
    msg.textContent = message;
    toast.appendChild(icon);
    toast.appendChild(msg);

    Object.assign(toast.style, {
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: '4000',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 24px',
        borderRadius: '12px',
        background: type === 'success' ? '#065F46' : '#991B1B',
        color: '#fff',
        fontSize: '0.95rem',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        transform: 'translateX(120%)',
        transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
        maxWidth: '400px',
    });

    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });

    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

/* ============================================
   QR CODE for Google Maps Review
   ============================================ */
function initQRCode() {
    const container = document.getElementById('qrCode');
    if (!container) return;

    const reviewUrl = 'https://maps.app.goo.gl/LYKSGggSms2nwTWq7';

    if (typeof qrcode !== 'undefined') {
        const qr = qrcode(0, 'M');
        qr.addData(reviewUrl);
        qr.make();

        const imgTag = qr.createImgTag(5, 10);
        container.innerHTML = imgTag;
        const qrImg = container.querySelector('img');
        if (qrImg) {
            qrImg.style.borderRadius = '8px';
            qrImg.alt = 'QR Code đánh giá Google Maps Trạm Dừng Chill';
        }
    } else {
        container.innerHTML = `
            <div style="padding:20px;text-align:center;background:#f5f5f5;border-radius:12px;">
                <p style="font-size:0.85rem;color:#666;margin-bottom:10px;">Quét mã QR hoặc</p>
                <a href="${reviewUrl}" target="_blank" rel="noopener" style="color:#C8572A;font-weight:600;text-decoration:underline;">Bấm vào đây để đánh giá</a>
            </div>
        `;
    }
}

/* ============================================
   SCROLL REVEAL (optimized selector)
   ============================================ */
function initScrollReveal() {
    const selectors = [
        '.exp-card', '.section-header', '.booking-info',
        '.booking-form-wrapper', '.map-wrapper', '.review-wrapper',
        '.occasions-banner', '.qr-card'
    ];

    const elements = document.querySelectorAll(selectors.join(', '));
    elements.forEach(el => el.classList.add('reveal'));

    // Separate observer for grid items (staggered)
    const gridItems = document.querySelectorAll('.menu-item, .gallery-item');
    gridItems.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const parent = entry.target.parentElement;
                const isGridChild = parent && (parent.classList.contains('menu-grid') || parent.classList.contains('gallery-grid'));
                const delay = isGridChild ? Array.from(parent.children).indexOf(entry.target) * 40 : 0;

                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
    gridItems.forEach(el => observer.observe(el));
}

/* ============================================
   SMOOTH SCROLL
   ============================================ */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/* ============================================
   CONSOLIDATED SCROLL UI
   (navbar, active link, FAB, back-to-top)
   Uses rAF throttle for performance
   ============================================ */
function initScrollUI() {
    const navbar = document.getElementById('navbar');
    const fab = document.getElementById('fabContainer');
    const backToTop = document.getElementById('backToTop');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let ticking = false;

    function onScroll() {
        const scrollY = window.scrollY;

        // Navbar background
        if (navbar) navbar.classList.toggle('scrolled', scrollY > 60);

        // FAB visibility
        if (fab) fab.classList.toggle('visible', scrollY > 400);

        // Back to top
        if (backToTop) backToTop.classList.toggle('visible', scrollY > 800);

        // Active nav link
        const offset = scrollY + 120;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-link[href="#${id}"]`);
            if (link) {
                link.classList.toggle('active', offset >= top && offset < top + height);
            }
        });

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });

    // Back to top click
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Initial state
    onScroll();
}
