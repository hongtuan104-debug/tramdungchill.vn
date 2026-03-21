/* ============================================
   Tram Dung Chill - Hero Slider & Particles
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

function initHeroParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;

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
