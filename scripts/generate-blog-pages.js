/***
* generate-blog-pages.js
* Generates individual blog post HTML pages from blog-data.js
* Zero npm dependencies - only Node built-ins (fs, path, vm)
*/

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data", "blog-data.js");
const TEMPLATE_FILE = path.join(ROOT, "templates", "blog-post.html");
const BLOG_DIR = path.join(ROOT, "blog");
const SITEMAP = path.join(ROOT, "sitemap.xml");
const SITE_URL = "https://tramdungchill.vn";
const TODAY = new Date().toISOString().slice(0, 10);
// Helpers

function htmlEncode(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function stripHtml(html) {
    return String(html).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function truncate(str, maxLen) {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 3).replace(/\s+\S*$/, "") + "...";
}

function formatDateVI(dateStr) {
    const p = dateStr.split("-");
    return p[2] + "/" + p[1] + "/" + p[0];
}

function readingTime(html) {
    const text = stripHtml(html);
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
}
function fixAssetPaths(body) {
    return body
        .replace(/src="assets\//g, 'src="../assets/')
        .replace(/href="index\.html/g, 'href="../index.html')
        .replace(/href="menu\.html/g, 'href="../menu.html')
        .replace(/href="blog\.html/g, 'href="../blog.html');
}
function blogPostingSchema(article, excerptClean) {
    // E-E-A-T: tác giả là Person nếu bài có _author (trụ cột), mặc định Organization
    var author = article._author
        ? {
            "@type": "Person",
            "name": article._author.name,
            "jobTitle": article._author.role || undefined,
            "worksFor": { "@type": "Organization", "name": "Tiệm Nướng Trạm Dừng Chill", "url": SITE_URL }
        }
        : { "@type": "Organization", "name": "Tiệm Nướng Trạm Dừng Chill", "url": SITE_URL };
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": SITE_URL + "/blog/" + article.id + ".html#article",
        "headline": article.title,
        "description": truncate(excerptClean, 160),
        "image": SITE_URL + "/" + article.image,
        "datePublished": article.date,
        "dateModified": article._dateModified || article.date,
        "author": author,
        "publisher": {
            "@type": "Organization",
            "name": "Tiệm Nướng Trạm Dừng Chill",
            "url": SITE_URL,
            "logo": {
                "@type": "ImageObject",
                "url": SITE_URL + "/assets/images/logo-gold.svg"
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": SITE_URL + "/blog/" + article.id + ".html"
        },
        "articleSection": article.category,
        "wordCount": stripHtml(article.body).split(/\s+/).filter(Boolean).length,
        "inLanguage": article._lang || "vi"
    }, null, 4);
}

// FAQPage JSON-LD (chỉ trụ cột có _faq). Trả về cả khối <script> hoặc rỗng.
function faqSchemaBlock(article) {
    if (!article._faq || !article._faq.length) return "";
    var json = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": article._faq.map(function (f) {
            return {
                "@type": "Question",
                "name": f.q,
                "acceptedAnswer": { "@type": "Answer", "text": f.a }
            };
        })
    }, null, 4);
    return '<script type="application/ld+json">\n    ' + json + '\n    </script>';
}

// FAQ hiển thị dạng HTML (để người + AI đọc được, không cần JS)
function faqHtml(article) {
    if (!article._faq || !article._faq.length) return "";
    var items = article._faq.map(function (f) {
        return '<div class="blog-faq-item"><h3>' + htmlEncode(f.q) + '</h3><p>' + f.a + '</p></div>';
    }).join("\n");
    return '\n<section class="blog-faq"><h2>' + ui(article).faq + '</h2>\n' + items + '\n</section>';
}

// Chuỗi giao diện theo ngôn ngữ bài. Trước đây nav/breadcrumb/CTA/FAQ đều cứng
// tiếng Việt, nên 2 bài tiếng Anh hiện "Trang chủ / Thực đơn / Đặt bàn ngay" —
// vừa khó hiểu với khách nước ngoài (CTA không đọc được thì không có chuyển đổi),
// vừa sai accessibility tree vì trang khai lang="en" mà nội dung lại tiếng Việt.
var UI = {
    vi: {
        home: "Trang chủ", menu: "Thực đơn", blog: "Blog", book: "Đặt bàn",
        read: "phút đọc", related: "Bài viết liên quan", faq: "Câu hỏi thường gặp",
        ctaTitle: "Đặt Bàn Trạm Dừng Chill",
        ctaSub: "Nướng BBQ view hoàng hôn + xe lửa — trải nghiệm chỉ có tại Đà Lạt",
        ctaBtn: "Đặt bàn ngay →",
        byline: "Đội ngũ Trạm Dừng Chill · Tiệm Nướng Trạm Dừng Chill",
        updated: "Cập nhật", prev: "Bài trước", next: "Bài sau"
    },
    en: {
        home: "Home", menu: "Menu", blog: "Blog", book: "Book a table",
        read: "min read", related: "Related articles", faq: "Frequently asked questions",
        ctaTitle: "Book a table at Trạm Dừng Chill",
        ctaSub: "Grilled BBQ with sunset and vintage train views — only in Da Lat",
        ctaBtn: "Book now →",
        byline: "The Trạm Dừng Chill team · Tiệm Nướng Trạm Dừng Chill",
        updated: "Updated", prev: "Previous", next: "Next"
    }
};
function ui(article) { return UI[article._lang === "en" ? "en" : "vi"]; }

// Byline tác giả. Trụ cột: tác giả thật (_author). Còn lại: byline mặc định "Đội ngũ"
// (E-E-A-T: mọi bài đều có tín hiệu "ai viết"; schema vẫn để Organization — không bịa Person).
function bylineHtml(article) {
    if (!article._author) {
        return ' <span class="blog-byline">✍️ ' + ui(article).byline + '</span>';
    }
    var role = article._author.role ? ' · ' + htmlEncode(article._author.role) : "";
    return ' <span class="blog-byline">✍️ ' + htmlEncode(article._author.name) + role + '</span>';
}

function breadcrumbSchema(article) {
    // Tên chặng phải trùng breadcrumb hiển thị trên trang — bài tiếng Anh hiện
    // "Home › Blog" thì schema cũng phải vậy, không để lệch ngôn ngữ.
    var u = ui(article);
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": u.home,
                "item": SITE_URL + "/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": u.blog,
                "item": SITE_URL + "/blog.html"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": article.title,
                "item": SITE_URL + "/blog/" + article.id + ".html"
            }
        ]
    }, null, 4);
}

// Main

try {
    console.log("Reading blog data...");
    const dataSource = fs.readFileSync(DATA_FILE, "utf8");
    const sandbox = {};
    // Append assignment so `const BLOG_ARTICLES` (block-scoped) is exposed on sandbox
    vm.runInNewContext(dataSource + "\n;this.BLOG_ARTICLES = BLOG_ARTICLES;", sandbox);
    const articles = sandbox.BLOG_ARTICLES;

    if (!articles || !Array.isArray(articles)) {
        throw new Error("BLOG_ARTICLES not found or not an array");
    }
    console.log("Found " + articles.length + " articles in blog-data.js");

    // ---- Phase 2 SEO: gộp nội dung trụ cột + map noindex/canonical từ data/blog-seo.js ----
    var SEO = { pillars: {}, noindex: {} };
    var SEO_FILE = path.join(ROOT, "data", "blog-seo.js");
    if (fs.existsSync(SEO_FILE)) {
        var seoSandbox = {};
        vm.runInNewContext(fs.readFileSync(SEO_FILE, "utf8") + "\n;this.BLOG_SEO = BLOG_SEO;", seoSandbox);
        if (seoSandbox.BLOG_SEO) SEO = seoSandbox.BLOG_SEO;
    }
    var pillars = SEO.pillars || {};
    var noindexMap = SEO.noindex || {};

    var byId = {};
    articles.forEach(function (a) { byId[a.id] = a; });

    // (1) Gộp/override trụ cột; (2) append trụ cột MỚI chưa có trong blog-data
    Object.keys(pillars).forEach(function (pid) {
        var p = pillars[pid];
        var existing = byId[pid];
        if (existing) {
            if (p.title) existing.title = p.title;
            if (p.excerpt) existing.excerpt = p.excerpt;
            if (p.image) existing.image = p.image;
            if (p.imageAlt) existing.imageAlt = p.imageAlt;
            if (p.category) existing.category = p.category;
            if (p.body) existing.body = p.body;
            existing._faq = p.faq;
            existing._author = p.author;
            existing._dateModified = p.dateModified;
            existing._lang = p.lang;
            existing._pillar = true;
        } else {
            var na = {
                id: pid,
                title: p.title,
                category: p.category || "Blog",
                date: p.date,
                image: p.image,
                imageAlt: p.imageAlt || p.title,
                badge: p.badge || "",
                featured: !!p.featured,
                excerpt: p.excerpt,
                body: p.body,
                _faq: p.faq,
                _author: p.author,
                _dateModified: p.dateModified,
                _lang: p.lang,
                _pillar: true
            };
            articles.push(na);
            byId[pid] = na;
        }
    });

    // Đánh dấu indexable + canonical override cho mọi bài
    articles.forEach(function (a) {
        if (Object.prototype.hasOwnProperty.call(noindexMap, a.id)) {
            a._indexable = false;
            var target = noindexMap[a.id];
            a._canonical = target ? (SITE_URL + "/blog/" + target + ".html") : (SITE_URL + "/blog/" + a.id + ".html");
        } else {
            a._indexable = true;
            a._canonical = SITE_URL + "/blog/" + a.id + ".html";
        }
    });
    var idxCount = articles.filter(function (a) { return a._indexable; }).length;
    console.log("Sau gộp SEO: " + articles.length + " bài (" + Object.keys(pillars).length + " trụ cột, " + Object.keys(noindexMap).length + " bài noindex, " + idxCount + " bài index được)");

    console.log("Reading template...");
    const template = fs.readFileSync(TEMPLATE_FILE, "utf8");

    if (!fs.existsSync(BLOG_DIR)) {
        fs.mkdirSync(BLOG_DIR, { recursive: true });
    }

    // Sort published articles by date (newest first) for prev/next navigation
    const publishedForNav = articles
        .filter(a => a.date <= TODAY && a._indexable !== false)
        .sort((a, b) => b.date.localeCompare(a.date));

    // Build a map: articleId -> { prev (older), next (newer) }
    const navMap = {};
    for (let i = 0; i < publishedForNav.length; i++) {
        const curr = publishedForNav[i];
        const newer = i > 0 ? publishedForNav[i - 1] : null;
        const older = i < publishedForNav.length - 1 ? publishedForNav[i + 1] : null;
        navMap[curr.id] = {
            prev: older ? { id: older.id, title: older.title } : null,
            next: newer ? { id: newer.id, title: newer.title } : null
        };
    }

    function buildPrevLink(nav, article) {
        if (!nav || !nav.prev) return "";
        return '<a href="' + nav.prev.id + '.html" class="blog-nav-prev"><span class="nav-label">\u2190 ' + ui(article).prev + '</span><span class="nav-title">' + htmlEncode(nav.prev.title) + '</span></a>';
    }
    function buildNextLink(nav, article) {
        if (!nav || !nav.next) return "";
        return '<a href="' + nav.next.id + '.html" class="blog-nav-next"><span class="nav-label">' + ui(article).next + ' \u2192</span><span class="nav-title">' + htmlEncode(nav.next.title) + '</span></a>';
    }

    // Build related posts for each article
    function buildRelatedPosts(currentArticle) {
        const publishedOthers = articles
            .filter(a => a.id !== currentArticle.id && a.date <= TODAY && a._indexable !== false)
            .sort((a, b) => b.date.localeCompare(a.date));

        // Same category first
        const sameCategory = publishedOthers.filter(a => a.category === currentArticle.category);
        const otherCategory = publishedOthers.filter(a => a.category !== currentArticle.category);

        const related = [];
        for (let i = 0; i < sameCategory.length && related.length < 3; i++) {
            related.push(sameCategory[i]);
        }
        for (let i = 0; i < otherCategory.length && related.length < 3; i++) {
            related.push(otherCategory[i]);
        }

        if (related.length === 0) return "";

        return related.map(function(a) {
            return '<a href="' + a.id + '.html" class="blog-related-card">' +
                '<img src="../' + a.image + '" alt="' + htmlEncode(a.imageAlt || a.title) + '" loading="lazy">' +
                '<div class="blog-related-info">' +
                '<span class="blog-category">' + a.category + '</span>' +
                '<h3>' + htmlEncode(a.title) + '</h3>' +
                '</div></a>';
        }).join("\n                ");
    }

    let generated = 0;
    let errors = 0;

    for (const article of articles) {
        try {
            const excerptClean = stripHtml(article.excerpt || "");
            const metaDesc = htmlEncode(truncate(excerptClean, 160));
            const titleEncoded = htmlEncode(article.title);
            // titleShort chỉ dùng cho breadcrumb (chỗ hẹp, cắt là hợp lý).
            const titleShort = truncate(article.title, 60);
            // Thẻ <title> thì KHÔNG được cắt: trước đây template ghép
            // "{titleShort} — Trạm Dừng Chill Đà Lạt" nên 86/143 bài có dấu "..."
            // ngay giữa title, nuốt mất keyword ở đuôi. Nay: title ngắn thì thêm
            // hậu tố thương hiệu, title đã dài thì để nguyên vẹn, không hậu tố.
            const BRAND = " — Trạm Dừng Chill Đà Lạt";
            const titleTag = htmlEncode(
                article.title.length + BRAND.length <= 65
                    ? article.title + BRAND
                    : article.title
            );
            const imageAltEncoded = htmlEncode(article.imageAlt || article.title);
            const keywords = article.title.toLowerCase() + ", đà lạt, quán nướng, bbq";
            const dateVI = formatDateVI(article.date);
            const readTime = readingTime(article.body || "");
            // Hiển thị "Cập nhật {ngày}" khi bài có dateModified thật khác ngày đăng (freshness E-E-A-T).
            const updatedHtml = (article._dateModified && article._dateModified !== article.date)
                ? ' · <span class="blog-updated">' + ui(article).updated + ' ' + formatDateVI(article._dateModified) + '</span>'
                : '';
            const bodyFixed = fixAssetPaths((article.body || "") + faqHtml(article));

            const image400w = article.image.replace(/\.(jpg|webp)$/i, '-400w.webp');
            const image800w = article.image.replace(/\.(jpg|webp)$/i, '-800w.webp');

            let html = template
                .replace(/{{TITLE_TAG}}/g, titleTag)
                .replace(/{{TITLE_SHORT}}/g, titleShort)
                .replace(/{{TITLE}}/g, titleEncoded)
                .replace(/{{ID}}/g, article.id)
                .replace(/{{DATE_VI}}/g, dateVI)
                .replace(/{{UPDATED}}/g, updatedHtml)
                .replace(/{{DATE}}/g, article.date)
                .replace(/{{CATEGORY}}/g, article.category)
                .replace(/{{IMAGE_ALT}}/g, imageAltEncoded)
                .replace(/{{IMAGE_400W}}/g, image400w)
                .replace(/{{IMAGE_800W}}/g, image800w)
                .replace(/{{IMAGE}}/g, article.image)
                .replace(/{{META_DESCRIPTION}}/g, metaDesc)
                .replace(/{{KEYWORDS}}/g, keywords)
                .replace(/{{EXCERPT_CLEAN}}/g, excerptClean)
                .replace(/{{BODY}}/g, bodyFixed)
                .replace(/{{JSON_LD_BLOGPOSTING}}/g, blogPostingSchema(article, excerptClean))
                .replace(/{{JSON_LD_BREADCRUMB}}/g, breadcrumbSchema(article))
                .replace(/{{JSON_LD_FAQ}}/g, faqSchemaBlock(article))
                .replace(/{{ROBOTS}}/g, article._indexable === false ? "noindex, follow" : "index, follow")
                .replace(/{{CANONICAL_HREF}}/g, article._canonical)
                .replace(/{{HREFLANG_LANG}}/g, article._lang === "en" ? "en" : "vi")
                // Bài tiếng Anh phải khai lang="en": <html lang> nằm trong accessibility
                // tree (screen reader chọn giọng đọc theo nó) và là tín hiệu ngôn ngữ
                // Google đọc. Trước đây hardcode "vi" nên 2 bài EN tự mâu thuẫn với
                // chính hreflang="en" và schema inLanguage="en" của mình.
                .replace(/{{T_HOME}}/g, ui(article).home)
                .replace(/{{T_MENU}}/g, ui(article).menu)
                .replace(/{{T_BLOG}}/g, ui(article).blog)
                .replace(/{{T_BOOK}}/g, ui(article).book)
                .replace(/{{T_READ}}/g, ui(article).read)
                .replace(/{{T_RELATED}}/g, ui(article).related)
                .replace(/{{T_CTA_TITLE}}/g, ui(article).ctaTitle)
                .replace(/{{T_CTA_SUB}}/g, ui(article).ctaSub)
                .replace(/{{T_CTA_BTN}}/g, ui(article).ctaBtn)
                .replace(/{{HTML_LANG}}/g, article._lang === "en" ? "en" : "vi")
                .replace(/{{OG_LOCALE}}/g, article._lang === "en" ? "en_US" : "vi_VN")
                .replace(/{{BYLINE}}/g, bylineHtml(article))
                .replace(/{{READING_TIME}}/g, String(readTime))
                .replace(/{{PREV_LINK}}/g, buildPrevLink(navMap[article.id], article))
                .replace(/{{NEXT_LINK}}/g, buildNextLink(navMap[article.id], article))
                .replace(/{{PREV_TITLE}}/g, navMap[article.id] && navMap[article.id].prev ? htmlEncode(navMap[article.id].prev.title) : "")
                .replace(/{{NEXT_TITLE}}/g, navMap[article.id] && navMap[article.id].next ? htmlEncode(navMap[article.id].next.title) : "")
                .replace(/{{RELATED_POSTS}}/g, buildRelatedPosts(article));

            const outPath = path.join(BLOG_DIR, article.id + ".html");
            fs.writeFileSync(outPath, html, "utf8");
            generated++;
        } catch (err) {
            console.error("Error generating " + article.id + ": " + err.message);
            errors++;
        }
    }

    console.log("Generated " + generated + " blog pages in blog/");
    if (errors > 0) console.error(errors + " errors encountered");

    // Regenerate sitemap.xml
    console.log("Regenerating sitemap.xml...");

    const staticPages = [
        { loc: "/", lastmod: TODAY, changefreq: "weekly", priority: "1.0" },
        { loc: "/blog.html", lastmod: TODAY, changefreq: "daily", priority: "0.9" },
        { loc: "/menu.html", lastmod: TODAY, changefreq: "weekly", priority: "0.8" },
        { loc: "/dip/san-tau-da-lat.html", lastmod: TODAY, changefreq: "monthly", priority: "0.8" },
        { loc: "/dip/cau-hon-hen-ho.html", lastmod: TODAY, changefreq: "monthly", priority: "0.8" },
        { loc: "/dip/sinh-nhat.html", lastmod: TODAY, changefreq: "monthly", priority: "0.8" },
        { loc: "/dip/team-building.html", lastmod: TODAY, changefreq: "monthly", priority: "0.8" },
        { loc: "/duong-di/", lastmod: TODAY, changefreq: "monthly", priority: "0.6" }
        // review-qr.html là noindex,nofollow (trang tiện ích QR) → KHÔNG đưa vào sitemap.
    ];

    // Chỉ xuất sitemap bài đã tới ngày (date<=hôm nay) VÀ còn index (loại future + noindex)
    const publishedArticles = articles.filter(a => a.date <= TODAY && a._indexable !== false);

    function sitemapUrl(loc, lastmod, changefreq, priority) {
        const fullUrl = SITE_URL + loc;
        var lines = [
            "  <url>",
            "    <loc>" + fullUrl + "</loc>",
            "    <lastmod>" + lastmod + "</lastmod>",
            "    <changefreq>" + changefreq + "</changefreq>",
            "    <priority>" + priority + "</priority>",
            '    <xhtml:link rel="alternate" hreflang="vi" href="' + fullUrl + '"/>',
            '    <xhtml:link rel="alternate" hreflang="x-default" href="' + fullUrl + '"/>',
            "  </url>"
        ];
        return lines.join("\n");
    }

    var sitemapLines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">'
    ];

    for (const page of staticPages) {
        sitemapLines.push(sitemapUrl(page.loc, page.lastmod, page.changefreq, page.priority));
    }

    for (const article of publishedArticles) {
        sitemapLines.push(sitemapUrl("/blog/" + article.id + ".html", article._dateModified || article.date, "monthly", article._pillar ? "0.8" : "0.7"));
    }

    sitemapLines.push("</urlset>");
    var sitemap = sitemapLines.join("\n") + "\n";

    fs.writeFileSync(SITEMAP, sitemap, "utf8");
    console.log("Sitemap updated: " + staticPages.length + " static pages + " + publishedArticles.length + " published blog posts");

    // Regenerate blog-data-light.js — CHỈ bài còn index (trang blog index không liệt kê bài đã noindex)
    var LIGHT_FILE = path.join(ROOT, "data", "blog-data-light.js");
    var lightArr = articles
        .filter(function (a) { return a._indexable !== false; })
        .sort(function (a, b) { return b.date.localeCompare(a.date); })
        .map(function (a) {
            return {
                id: a.id,
                title: a.title,
                category: a.category,
                date: a.date,
                image: a.image,
                imageAlt: a.imageAlt || a.title,
                badge: a.badge || "",
                featured: !!a.featured,
                excerpt: a.excerpt || "",
                tags: a.tags || []
            };
        });
    var lightOut = "/* Blog listing data (lightweight — no body). Auto-sinh bởi generate-blog-pages.js — KHÔNG sửa tay. */\n" +
        "const BLOG_ARTICLES = " + JSON.stringify(lightArr, null, 2) + ";\n";
    fs.writeFileSync(LIGHT_FILE, lightOut, "utf8");
    console.log("blog-data-light.js updated: " + lightArr.length + " bài hiển thị trên trang blog");
    console.log("Done!");

} catch (err) {
    console.error("Fatal error:", err.message);
    process.exit(1);
}
