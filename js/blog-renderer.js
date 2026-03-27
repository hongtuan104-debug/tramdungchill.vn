/* ============================================
   Blog Renderer - Tram Dung Chill
   Render bai viet tu data/blog-data.js
   Uses safe DOM methods — no innerHTML for data
   formatDateVi() is in utils.js (shared)
   ============================================ */

function renderBlog() {
    const grid = document.querySelector('.blog-grid');
    if (!grid || typeof BLOG_ARTICLES === 'undefined') return;

    grid.innerHTML = '';

    // Auto-schedule: only show articles with date <= today
    const today = new Date().toISOString().slice(0, 10);
    const articles = BLOG_ARTICLES.filter(function(a) { return a.date <= today; });

    articles.forEach(function(article) {
        grid.appendChild(buildBlogCard(article));
    });

    // Auto-insert share buttons
    initBlogShare();

    // Inject BlogPosting JSON-LD for each visible article (SEO rich snippets)
    injectBlogSchema(articles);

    // Init category filters
    initBlogFilters(articles);

    // Init search
    initBlogSearch();
}

function buildBlogCard(article) {
    const card = document.createElement('article');
    card.className = 'blog-card' + (article.featured ? ' blog-featured' : '');
    card.id = article.id;

    // Image container
    const imgDiv = document.createElement('div');
    imgDiv.className = 'blog-card-img';

    const img = document.createElement('img');
    img.src = article.image;
    img.srcset = article.image.replace(/\.(jpg|webp)$/i, '-400w.webp') + ' 400w, ' +
                 article.image.replace(/\.(jpg|webp)$/i, '-800w.webp') + ' 800w, ' +
                 article.image + ' 1200w';
    img.sizes = '(max-width:480px) 400px, (max-width:768px) 800px, 1200px';
    img.alt = article.imageAlt || '';
    img.loading = 'lazy';
    imgDiv.appendChild(img);

    if (article.badge) {
        const badgeEl = document.createElement('span');
        badgeEl.className = 'blog-badge';
        badgeEl.textContent = article.badge;
        imgDiv.appendChild(badgeEl);
    }

    card.appendChild(imgDiv);

    // Content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'blog-card-content';

    // Meta
    const metaDiv = document.createElement('div');
    metaDiv.className = 'blog-meta';

    const timeEl = document.createElement('time');
    timeEl.setAttribute('datetime', article.date);
    timeEl.textContent = formatDateVi(article.date);
    metaDiv.appendChild(timeEl);

    const catSpan = document.createElement('span');
    catSpan.className = 'blog-category';
    catSpan.textContent = article.category;
    metaDiv.appendChild(catSpan);

    contentDiv.appendChild(metaDiv);

    // Title
    const h2 = document.createElement('h2');
    const titleLink = document.createElement('a');
    titleLink.href = 'blog/' + article.id + '.html';
    titleLink.textContent = article.title;
    h2.appendChild(titleLink);
    contentDiv.appendChild(h2);

    // Excerpt (may contain safe HTML like <strong>)
    const excerptP = document.createElement('p');
    excerptP.textContent = article.excerpt.replace(/<[^>]*>/g, '');
    contentDiv.appendChild(excerptP);

    // Read more link
    const readMore = document.createElement('a');
    readMore.href = 'blog/' + article.id + '.html';
    readMore.className = 'blog-read-more';
    readMore.textContent = t('blog.readmore', 'Đọc tiếp →');
    contentDiv.appendChild(readMore);

    card.appendChild(contentDiv);
    return card;
}

function initBlogFilters(articles) {
    const filtersContainer = document.getElementById('blogFilters');
    if (!filtersContainer || !articles || !articles.length) return;

    // Extract unique categories
    const categoryMap = {};
    articles.forEach(function(a) {
        if (a.category && !categoryMap[a.category]) {
            categoryMap[a.category] = true;
        }
    });
    const categories = Object.keys(categoryMap).sort();

    // Build filter buttons with safe DOM methods
    filtersContainer.innerHTML = '';
    filtersContainer.setAttribute('role', 'group');
    filtersContainer.setAttribute('aria-label', t('blog.filters', 'Lọc theo danh mục'));

    const allBtn = document.createElement('button');
    allBtn.className = 'blog-filter-btn active';
    allBtn.setAttribute('data-category', 'all');
    allBtn.setAttribute('aria-pressed', 'true');
    allBtn.textContent = t('blog.all', 'Tất cả');
    filtersContainer.appendChild(allBtn);

    categories.forEach(function(cat) {
        const btn = document.createElement('button');
        btn.className = 'blog-filter-btn';
        btn.setAttribute('data-category', cat);
        btn.setAttribute('aria-pressed', 'false');
        btn.textContent = cat;
        filtersContainer.appendChild(btn);
    });

    // Cache card list for performance
    const cachedCards = document.querySelectorAll('.blog-card');

    // Add click handlers
    const buttons = filtersContainer.querySelectorAll('.blog-filter-btn');
    buttons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            buttons.forEach(function(b) {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            const selectedCategory = btn.getAttribute('data-category');

            cachedCards.forEach(function(card) {
                if (selectedCategory === 'all') {
                    card.classList.remove('hidden');
                    card.style.opacity = '0';
                    setTimeout(function() { card.style.opacity = '1'; }, 50);
                } else {
                    const cardCategory = card.querySelector('.blog-category');
                    const cardCatText = cardCategory ? cardCategory.textContent.trim() : '';
                    if (cardCatText === selectedCategory) {
                        card.classList.remove('hidden');
                        card.style.opacity = '0';
                        setTimeout(function() { card.style.opacity = '1'; }, 50);
                    } else {
                        card.classList.add('hidden');
                    }
                }
            });
        });
    });
}

function injectBlogSchema(articles) {
    const existing = document.getElementById('blog-schema-ld');
    if (existing) existing.remove();

    const schemaItems = articles.map(function(a) {
        const desc = a.excerpt.replace(/<[^>]*>/g, '').substring(0, 200);
        return {
            '@type': 'BlogPosting',
            'headline': a.title,
            'description': desc,
            'image': 'https://tramdungchill.vn/' + a.image,
            'datePublished': a.date,
            'dateModified': a.date,
            'author': {
                '@type': 'Organization',
                '@id': 'https://tramdungchill.vn/#restaurant',
                'name': 'Tiệm Nướng Trạm Dừng Chill'
            },
            'publisher': {
                '@type': 'Organization',
                '@id': 'https://tramdungchill.vn/#restaurant',
                'name': 'Tiệm Nướng Trạm Dừng Chill',
                'logo': {
                    '@type': 'ImageObject',
                    'url': 'https://tramdungchill.vn/assets/images/favicon-180.png'
                }
            },
            'mainEntityOfPage': {
                '@type': 'WebPage',
                '@id': 'https://tramdungchill.vn/blog/' + a.id + '.html'
            },
            'url': 'https://tramdungchill.vn/blog/' + a.id + '.html',
            'inLanguage': a.category === 'English' ? 'en' : 'vi',
            'articleSection': a.category,
            'keywords': a.title.toLowerCase()
        };
    });

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'blog-schema-ld';
    script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': schemaItems
    });
    document.head.appendChild(script);
}

function initBlogSearch() {
    const searchInput = document.getElementById('blogSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        const cards = document.querySelectorAll('.blog-card');
        cards.forEach(function(card) {
            const title = card.querySelector('h2') ? card.querySelector('h2').textContent.toLowerCase() : '';
            const excerpt = card.querySelector('p') ? card.querySelector('p').textContent.toLowerCase() : '';
            const category = card.querySelector('.blog-category') ? card.querySelector('.blog-category').textContent.toLowerCase() : '';
            const match = !query || title.indexOf(query) !== -1 || excerpt.indexOf(query) !== -1 || category.indexOf(query) !== -1;
            card.classList.toggle('hidden', !match);
        });
    });
}

function initBlogShare() {
    document.querySelectorAll('.blog-card').forEach(function(card) {
        const id = card.id;
        const url = 'https://tramdungchill.vn/blog/' + encodeURIComponent(id) + '.html';

        const shareDiv = document.createElement('div');
        shareDiv.className = 'blog-share';

        // Label
        const label = document.createElement('span');
        label.className = 'blog-share-label';
        label.textContent = t('blog.share', 'Chia sẻ:');
        shareDiv.appendChild(label);

        // Facebook share
        const fbLink = document.createElement('a');
        fbLink.className = 'blog-share-btn blog-share-fb';
        fbLink.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
        fbLink.target = '_blank';
        fbLink.rel = 'noopener';
        fbLink.setAttribute('aria-label', 'Facebook');
        fbLink.title = 'Facebook';
        fbLink.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>';
        shareDiv.appendChild(fbLink);

        // Zalo share
        const zaloLink = document.createElement('a');
        zaloLink.className = 'blog-share-btn blog-share-zalo';
        zaloLink.href = 'https://zalo.me/share?url=' + encodeURIComponent(url);
        zaloLink.target = '_blank';
        zaloLink.rel = 'noopener';
        zaloLink.setAttribute('aria-label', 'Zalo');
        zaloLink.title = 'Zalo';
        zaloLink.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 14.5h-2l3.5-5H10V9h4v2.5l-3.5 5zm6 0h-2l3.5-5H16V9h4v2.5l-3.5 5z"/></svg>';
        shareDiv.appendChild(zaloLink);

        // Copy link button (safe event listener, no inline onclick)
        const copyBtn = document.createElement('button');
        copyBtn.className = 'blog-share-btn blog-share-copy';
        copyBtn.setAttribute('aria-label', 'Copy link');
        copyBtn.title = t('blog.copylink', 'Sao chép link');
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        copyBtn.addEventListener('click', function() {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(function() {
                    copyBtn.classList.add('copied');
                    setTimeout(function() { copyBtn.classList.remove('copied'); }, 2000);
                });
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = url;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    copyBtn.classList.add('copied');
                    setTimeout(function() { copyBtn.classList.remove('copied'); }, 2000);
                } catch (e) { /* silently fail */ }
                document.body.removeChild(textarea);
            }
        });
        shareDiv.appendChild(copyBtn);

        const readMore = card.querySelector('.blog-read-more');
        if (readMore) {
            readMore.parentNode.insertBefore(shareDiv, readMore);
        }
    });
}
