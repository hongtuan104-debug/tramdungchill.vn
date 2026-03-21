/* ============================================
   I18N — Language Switcher (Premium)
   - Auto-detect browser language
   - Smooth fade transition
   - localStorage persistence
   ============================================ */

function initI18n() {
    var saved = localStorage.getItem('lang');
    var lang;

    if (saved) {
        lang = saved;
    } else {
        // Auto-detect: if browser is English, default to English
        var browserLang = (navigator.language || navigator.userLanguage || 'vi').toLowerCase();
        lang = browserLang.startsWith('en') ? 'en' : 'vi';
    }

    document.documentElement.lang = lang;
    applyTranslations(lang);
    setupLangToggle(lang);
}

function applyTranslations(lang) {
    if (!window.TRANSLATIONS || !TRANSLATIONS[lang]) return;
    var dict = TRANSLATIONS[lang];

    // Text content
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
        var key = els[i].getAttribute('data-i18n');
        if (dict[key]) {
            els[i].innerHTML = dict[key];
        }
    }

    // Placeholders
    var phEls = document.querySelectorAll('[data-i18n-ph]');
    for (var i = 0; i < phEls.length; i++) {
        var key = phEls[i].getAttribute('data-i18n-ph');
        if (dict[key]) {
            phEls[i].placeholder = dict[key];
        }
    }
}

function setupLangToggle(currentLang) {
    var btn = document.getElementById('langToggle');
    if (!btn) return;

    updateLangButton(btn, currentLang);

    btn.addEventListener('click', function () {
        var newLang = document.documentElement.lang === 'vi' ? 'en' : 'vi';

        // Smooth fade transition
        document.body.classList.add('lang-transitioning');

        setTimeout(function () {
            document.documentElement.lang = newLang;
            localStorage.setItem('lang', newLang);
            applyTranslations(newLang);
            updateLangButton(btn, newLang);

            // Remove transition class
            setTimeout(function () {
                document.body.classList.remove('lang-transitioning');
            }, 50);
        }, 200);
    });
}

function updateLangButton(btn, lang) {
    var globe = '<svg class="lang-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';

    if (lang === 'vi') {
        btn.innerHTML = globe + '<span class="lang-text">EN</span>';
        btn.setAttribute('aria-label', 'Switch to English');
        btn.title = 'Switch to English';
    } else {
        btn.innerHTML = globe + '<span class="lang-text">VI</span>';
        btn.setAttribute('aria-label', 'Chuyển sang Tiếng Việt');
        btn.title = 'Chuyển sang Tiếng Việt';
    }
}

/* ============================================
   SCROLL PROGRESS BAR
   ============================================ */
function initScrollProgress() {
    var bar = document.getElementById('scrollProgress');
    if (!bar) return;

    var ticking = false;

    function updateProgress() {
        var scrollTop = window.scrollY || document.documentElement.scrollTop;
        var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = progress + '%';
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(updateProgress);
            ticking = true;
        }
    }, { passive: true });

    updateProgress();
}
