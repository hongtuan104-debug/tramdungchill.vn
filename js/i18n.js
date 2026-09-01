/* ============================================
   I18N — Language Switcher (Premium)
   - Auto-detect browser language
   - Smooth fade transition
   - localStorage persistence
   ============================================ */

function initI18n() {
    const saved = localStorage.getItem('lang');
    // Always default to Vietnamese unless user explicitly chose English
    const lang = saved || 'vi';

    document.documentElement.lang = lang;
    applyTranslations(lang);
    setupLangToggle(lang);
}

function applyTranslations(lang) {
    if (!window.TRANSLATIONS || !TRANSLATIONS[lang]) return;
    const dict = TRANSLATIONS[lang];

    /* Chỉ ghi khi giá trị THẬT SỰ khác.

       Bản cũ gán innerHTML cho MỌI phần tử [data-i18n] ở mỗi lần tải trang —
       239 phần tử trên trang chủ — kể cả khi đang ở tiếng Việt và HTML tĩnh đã
       viết sẵn đúng chữ đó. Mỗi lần gán là phá rồi dựng lại cả một cây con, làm
       bẩn style + layout toàn trang. Đo 31/08/2026: common.min.js tốn 360ms CPU
       mà chỉ 7ms là chạy script — phần còn lại là style & layout do việc này đẻ
       ra, kéo theo cả 224ms "buộc chỉnh lại luồng" ở checkScroll() chạy ngay sau.

       Đối chiếu thật trên 4 trang: 288/296 phần tử vốn đã đúng chữ. Nay chỉ 8
       phần tử thực sự bị ghi. Đọc innerHTML có tốn CPU serialize nhưng KHÔNG làm
       bẩn layout, nên rẻ hơn ghi rất nhiều.

       Kết quả hiển thị giống hệt bản cũ — đây thuần là bỏ việc thừa, không đổi
       hành vi. (Chuyện 8 chỗ HTML lệch với translations.vi là bug riêng, xem
       mục "Bug đã fix" số 0 trong CLAUDE.md.) */

    // Text content
    const els = document.querySelectorAll('[data-i18n]');
    for (let i = 0; i < els.length; i++) {
        const key = els[i].getAttribute('data-i18n');
        if (dict[key] && els[i].innerHTML !== dict[key]) {
            els[i].innerHTML = dict[key];
        }
    }

    // Placeholders
    const phEls = document.querySelectorAll('[data-i18n-ph]');
    for (let i = 0; i < phEls.length; i++) {
        const key = phEls[i].getAttribute('data-i18n-ph');
        if (dict[key] && phEls[i].placeholder !== dict[key]) {
            phEls[i].placeholder = dict[key];
        }
    }
}

function setupLangToggle(currentLang) {
    const btn = document.getElementById('langToggle');
    if (!btn) return;

    updateLangButton(btn, currentLang);

    btn.addEventListener('click', function () {
        const newLang = document.documentElement.lang === 'vi' ? 'en' : 'vi';

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
    const globe = '<svg class="lang-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';

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
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;

    let ticking = false;

    /* Chiều cao cuộn được của trang — đo một lần thay vì mỗi khung hình.
       scrollHeight/clientHeight đều buộc tính lại bố cục, mà khung trước vừa ghi
       bar.style.width nên bố cục đang bẩn → lần đọc nào cũng tính lại thật.
       Trang không cao lên trong lúc cuộn, nên số này giữ nguyên được. */
    const docHeightCache = cachedLayout(function () {
        return document.documentElement.scrollHeight - document.documentElement.clientHeight;
    });

    function updateProgress() {
        const docHeight = docHeightCache.get();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = progress + '%';
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(updateProgress);
            ticking = true;
        }
    }, { passive: true });

    /* Lần gọi ĐẦU TIÊN — hoãn tới lúc trang rảnh, cùng lý do với
       js/fab-contact.js và js/sticky-tiktok.js: đọc scrollHeight/clientHeight/
       scrollY lúc bố cục còn bẩn là bắt trình duyệt tính lại cả trang ngay giữa
       lúc đang dựng. Ba chỗ này thay nhau gánh lần tính đầu — hoãn chỗ này thì
       chỗ kia lãnh, nên phải hoãn cả ba.

       Ở đỉnh trang progress = 0, mà .scroll-progress vốn đã khai width:0% trong
       CSS, nên lần gọi đầu chẳng đổi gì cả. */
    var doLanDau = function () {
        var khiRanh = window.requestIdleCallback || function (fn) { return setTimeout(fn, 200); };
        khiRanh(updateProgress, { timeout: 2000 });
    };
    if (document.readyState === 'complete') doLanDau();
    else window.addEventListener('load', doLanDau, { once: true });
}
