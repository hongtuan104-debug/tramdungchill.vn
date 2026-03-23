/* ============================================
   Blog Post — Client-side script
   Individual blog post page interactions
   ============================================ */

(function() {
    'use strict';

    /* ------------------------------------------
       Auto-scheduling gate
       If publish date is in the future, hide content
       ------------------------------------------ */
    function checkPublishDate() {
        var article = document.querySelector('.blog-post-body[data-publish-date]');
        if (!article) return;

        var publishDate = article.getAttribute('data-publish-date');
        var today = new Date().toISOString().slice(0, 10);

        if (publishDate > today) {
            // Hide article content
            article.innerHTML = '<div class="blog-unpublished">' +
                '<h2>Bài viết chưa được xuất bản</h2>' +
                '<p>Bài viết này sẽ được xuất bản vào ngày ' + formatDateVi(publishDate) + '. Vui lòng quay lại sau.</p>' +
                '<a href="../blog.html">&larr; Quay lại Blog</a>' +
                '</div>';

            // Hide hero image and header excerpt
            var hero = document.querySelector('.blog-post-hero');
            if (hero) hero.style.display = 'none';

            var footer = document.querySelector('.blog-post-footer');
            if (footer) footer.style.display = 'none';

            // Set meta robots noindex
            var robotsMeta = document.querySelector('meta[name="robots"]');
            if (robotsMeta) {
                robotsMeta.setAttribute('content', 'noindex, nofollow');
            } else {
                var meta = document.createElement('meta');
                meta.name = 'robots';
                meta.content = 'noindex, nofollow';
                document.head.appendChild(meta);
            }
        }
    }

    /* ------------------------------------------
       Format date to Vietnamese format (dd/mm/yyyy)
       ------------------------------------------ */
    function formatDateVi(dateStr) {
        var parts = dateStr.split('-');
        return parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    /* ------------------------------------------
       Share buttons
       Facebook, Zalo, Copy link with SVG icons
       ------------------------------------------ */
    function initShareButtons() {
        var shareContainer = document.getElementById('blogShareButtons');
        if (!shareContainer) return;

        var url = window.location.href;
        var title = document.title;

        // Facebook share
        var fbBtn = document.createElement('a');
        fbBtn.className = 'blog-share-btn blog-share-fb';
        fbBtn.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
        fbBtn.target = '_blank';
        fbBtn.rel = 'noopener';
        fbBtn.setAttribute('aria-label', 'Chia sẻ Facebook');
        fbBtn.title = 'Chia sẻ lên Facebook';
        fbBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>';

        // Zalo share
        var zaloBtn = document.createElement('a');
        zaloBtn.className = 'blog-share-btn blog-share-zalo';
        zaloBtn.href = 'https://zalo.me/share?url=' + encodeURIComponent(url);
        zaloBtn.target = '_blank';
        zaloBtn.rel = 'noopener';
        zaloBtn.setAttribute('aria-label', 'Chia sẻ Zalo');
        zaloBtn.title = 'Chia sẻ qua Zalo';
        zaloBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 14.5h-2l3.5-5H10V9h4v2.5l-3.5 5zm6 0h-2l3.5-5H16V9h4v2.5l-3.5 5z"/></svg>';

        // Copy link
        var copyBtn = document.createElement('button');
        copyBtn.className = 'blog-share-btn blog-share-copy';
        copyBtn.setAttribute('aria-label', 'Sao chép link');
        copyBtn.title = 'Sao chép link';
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        copyBtn.onclick = function() {
            var btn = this;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(function() {
                    btn.classList.add('copied');
                    setTimeout(function() { btn.classList.remove('copied'); }, 2000);
                });
            } else {
                // Fallback for older browsers
                var textarea = document.createElement('textarea');
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
        };

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
