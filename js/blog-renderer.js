/* ============================================
   Blog Renderer - Tram Dung Chill
   Render bai viet tu data/blog-data.js
   ============================================ */

function formatDateVi(dateStr) {
    var parts = dateStr.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function renderBlog() {
    var grid = document.querySelector('.blog-grid');
    if (!grid || typeof BLOG_ARTICLES === 'undefined') return;

    grid.innerHTML = '';

    // Len lich tu dong: chi hien bai viet co date <= hom nay
    var today = new Date().toISOString().slice(0, 10);
    var articles = BLOG_ARTICLES.filter(function(a) { return a.date <= today; });

    articles.forEach(function(article) {
        var card = document.createElement('article');
        card.className = 'blog-card' + (article.featured ? ' blog-featured' : '');
        card.id = article.id;

        card.innerHTML =
            '<div class="blog-card-img">' +
                '<img src="' + article.image + '"' +
                ' srcset="' + article.image.replace(/\.(jpg|webp)$/i,'-400w.webp') + ' 400w, ' + article.image.replace(/\.(jpg|webp)$/i,'-800w.webp') + ' 800w, ' + article.image + ' 1200w"' +
                ' sizes="(max-width:480px) 400px, (max-width:768px) 800px, 1200px"' +
                ' alt="' + article.imageAlt + '" loading="lazy">' +
                (article.badge ? '<span class="blog-badge">' + article.badge + '</span>' : '') +
            '</div>' +
            '<div class="blog-card-content">' +
                '<div class="blog-meta">' +
                    '<time datetime="' + article.date + '">' + formatDateVi(article.date) + '</time>' +
                    '<span class="blog-category">' + article.category + '</span>' +
                '</div>' +
                '<h2><a href="blog/' + article.id + '.html">' + article.title + '</a></h2>' +
                '<p>' + article.excerpt + '</p>' +
                '<a href="blog/' + article.id + '.html" class="blog-read-more">Đọc tiếp →</a>' +
            '</div>';

        grid.appendChild(card);
    });

    // Auto-insert share buttons
    initBlogShare();

    // Inject BlogPosting JSON-LD for each visible article (SEO rich snippets)
    injectBlogSchema(articles);

    // Init category filters
    initBlogFilters(articles);
}

function initBlogFilters(articles) {
    var filtersContainer = document.getElementById('blogFilters');
    if (!filtersContainer || !articles || !articles.length) return;

    // Extract unique categories
    var categoryMap = {};
    articles.forEach(function(a) {
        if (a.category && !categoryMap[a.category]) {
            categoryMap[a.category] = true;
        }
    });
    var categories = Object.keys(categoryMap).sort();

    // Build filter buttons
    var html = '<button class="blog-filter-btn active" data-category="all">Tất cả</button>';
    categories.forEach(function(cat) {
        html += '<button class="blog-filter-btn" data-category="' + cat + '">' + cat + '</button>';
    });
    filtersContainer.innerHTML = html;

    // Add click handlers
    var buttons = filtersContainer.querySelectorAll('.blog-filter-btn');
    buttons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            // Update active state
            buttons.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');

            var selectedCategory = btn.getAttribute('data-category');
            var cards = document.querySelectorAll('.blog-card');

            cards.forEach(function(card) {
                if (selectedCategory === 'all') {
                    card.classList.remove('hidden');
                    card.style.opacity = '0';
                    setTimeout(function() { card.style.opacity = '1'; }, 50);
                } else {
                    var cardCategory = card.querySelector('.blog-category');
                    var cardCatText = cardCategory ? cardCategory.textContent.trim() : '';
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

    // Add transition for smooth fade
    document.querySelectorAll('.blog-card').forEach(function(card) {
        card.style.transition = 'opacity 0.3s ease';
    });
}

function injectBlogSchema(articles) {
    var existing = document.getElementById('blog-schema-ld');
    if (existing) existing.remove();

    var schemaItems = articles.map(function(a) {
        // Strip HTML tags from excerpt for description
        var desc = a.excerpt.replace(/<[^>]*>/g, '').substring(0, 200);
        return {
            '@type': 'BlogPosting',
            'headline': a.title,
            'description': desc,
            'image': 'https://tramdungchill.vn/' + a.image,
            'datePublished': a.date,
            'dateModified': a.date,
            'author': {
                '@type': 'Restaurant',
                '@id': 'https://tramdungchill.vn/#restaurant',
                'name': 'Tiệm Nướng Trạm Dừng Chill'
            },
            'publisher': {
                '@type': 'Restaurant',
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

    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'blog-schema-ld';
    script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': schemaItems
    });
    document.head.appendChild(script);
}

function initBlogShare() {
    document.querySelectorAll('.blog-card').forEach(function(card) {
        var id = card.id;
        var title = card.querySelector('h2 a') ? card.querySelector('h2 a').textContent : '';
        var url = 'https://tramdungchill.vn/blog/' + id + '.html';
        var shareDiv = document.createElement('div');
        shareDiv.className = 'blog-share';
        shareDiv.innerHTML = '<span class="blog-share-label">Chia s\u1ebb:</span>' +
            '<a class="blog-share-btn blog-share-fb" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '" target="_blank" rel="noopener" aria-label="Chia s\u1ebb Facebook" title="Chia s\u1ebb l\u00ean Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>' +
            '<a class="blog-share-btn blog-share-zalo" href="https://zalo.me/share?url=' + encodeURIComponent(url) + '" target="_blank" rel="noopener" aria-label="Chia s\u1ebb Zalo" title="Chia s\u1ebb qua Zalo"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 14.5h-2l3.5-5H10V9h4v2.5l-3.5 5zm6 0h-2l3.5-5H16V9h4v2.5l-3.5 5z"/></svg></a>' +
            '<button class="blog-share-btn blog-share-copy" onclick="navigator.clipboard.writeText(\'' + url + '\');this.classList.add(\'copied\');setTimeout(function(){document.querySelector(\'.copied\').classList.remove(\'copied\')},2000)" aria-label="Copy link" title="Sao ch\u00e9p link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>';
        var readMore = card.querySelector('.blog-read-more');
        if (readMore) {
            readMore.parentNode.insertBefore(shareDiv, readMore);
        }
    });
}
