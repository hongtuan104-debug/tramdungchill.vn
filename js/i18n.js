/* ============================================
   I18N — Language Switcher
   Doc TRANSLATIONS tu data/translations.js
   Luu ngon ngu vao localStorage
   ============================================ */

function initI18n() {
    var lang = localStorage.getItem('lang') || 'vi';
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
        var lang = document.documentElement.lang === 'vi' ? 'en' : 'vi';
        document.documentElement.lang = lang;
        localStorage.setItem('lang', lang);
        applyTranslations(lang);
        updateLangButton(btn, lang);
    });
}

function updateLangButton(btn, lang) {
    if (lang === 'vi') {
        btn.innerHTML = '<span class="lang-flag">EN</span>';
        btn.setAttribute('aria-label', 'Switch to English');
        btn.title = 'Switch to English';
    } else {
        btn.innerHTML = '<span class="lang-flag">VI</span>';
        btn.setAttribute('aria-label', 'Chuyển sang Tiếng Việt');
        btn.title = 'Chuyển sang Tiếng Việt';
    }
}
