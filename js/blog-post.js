/* ============================================
   Blog Post — Client-side script
   Individual blog post page interactions
   formatDateVi() is in utils.js (shared)
   ============================================ */

(function() {
    'use strict';

    /* ------------------------------------------
       Auto-scheduling gate
       If publish date is in the future, hide content
       ------------------------------------------ */
    function checkPublishDate() {
        const article = document.querySelector('.blog-post-body[data-publish-date]');
        if (!article) return;

        const publishDate = article.getAttribute('data-publish-date');
        const today = new Date().toISOString().slice(0, 10);

        if (publishDate > today) {
            // Hide article content
            article.innerHTML = '<div class="blog-unpublished">' +
                '<h2>Bài viết chưa được xuất bản</h2>' +
                '<p>Bài viết này sẽ được xuất bản vào ngày ' + (typeof formatDateVi === 'function' ? formatDateVi(publishDate) : publishDate) + '. Vui lòng quay lại sau.</p>' +
                '<a href="../blog.html">&larr; Quay lại Blog</a>' +
                '</div>';

            // Hide hero image and header excerpt
            const hero = document.querySelector('.blog-post-hero');
            if (hero) hero.style.display = 'none';

            const footer = document.querySelector('.blog-post-footer');
            if (footer) footer.style.display = 'none';

            // Set meta robots noindex
            const robotsMeta = document.querySelector('meta[name="robots"]');
            if (robotsMeta) {
                robotsMeta.setAttribute('content', 'noindex, nofollow');
            } else {
                const meta = document.createElement('meta');
                meta.name = 'robots';
                meta.content = 'noindex, nofollow';
                document.head.appendChild(meta);
            }
        }
    }

    /* ------------------------------------------
       Share buttons
       Facebook, Zalo, Copy link with SVG icons
       ------------------------------------------ */
    function initShareButtons() {
        const shareContainer = document.getElementById('blogShareButtons');
        if (!shareContainer) return;

        const url = window.location.href;

        // Facebook share
        const fbBtn = document.createElement('a');
        fbBtn.className = 'blog-share-btn blog-share-fb';
        fbBtn.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
        fbBtn.target = '_blank';
        fbBtn.rel = 'noopener';
        fbBtn.setAttribute('aria-label', 'Facebook');
        fbBtn.title = 'Facebook';
        fbBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>';

        // Zalo share
        const zaloBtn = document.createElement('a');
        zaloBtn.className = 'blog-share-btn blog-share-zalo';
        zaloBtn.href = 'https://zalo.me/share?url=' + encodeURIComponent(url);
        zaloBtn.target = '_blank';
        zaloBtn.rel = 'noopener';
        zaloBtn.setAttribute('aria-label', 'Zalo');
        zaloBtn.title = 'Zalo';
        zaloBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 14.5h-2l3.5-5H10V9h4v2.5l-3.5 5zm6 0h-2l3.5-5H16V9h4v2.5l-3.5 5z"/></svg>';

        // Copy link
        const copyBtn = document.createElement('button');
        copyBtn.className = 'blog-share-btn blog-share-copy';
        copyBtn.setAttribute('aria-label', 'Copy link');
        copyBtn.title = 'Sao chép link';
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        copyBtn.addEventListener('click', function() {
            const btn = this;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(function() {
                    btn.classList.add('copied');
                    setTimeout(function() { btn.classList.remove('copied'); }, 2000);
                });
            } else {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = url;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    btn.classList.add('copied');
                    setTimeout(function() { btn.classList.remove('copied'); }, 2000);
                } catch (e) { /* silently fail */ }
                document.body.removeChild(textarea);
            }
        });

        shareContainer.appendChild(fbBtn);
        shareContainer.appendChild(zaloBtn);
        shareContainer.appendChild(copyBtn);
    }

    /* ------------------------------------------
       Init on DOM ready
       ------------------------------------------ */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            checkPublishDate();
            initShareButtons();
        });
    } else {
        checkPublishDate();
        initShareButtons();
    }
})();
