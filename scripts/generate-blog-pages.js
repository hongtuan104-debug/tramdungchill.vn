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
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": SITE_URL + "/blog/" + article.id + ".html#article",
        "headline": article.title,
        "description": truncate(excerptClean, 160),
        "image": SITE_URL + "/" + article.image,
        "datePublished": article.date,
        "dateModified": article.date,
        "author": {
            "@type": "Organization",
            "name": "Tiệm Nướng Trạm Dừng Chill",
            "url": SITE_URL
        },
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
        "inLanguage": "vi"
    }, null, 4);
}

function breadcrumbSchema(article) {
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Trang chủ",
                "item": SITE_URL + "/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
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

    console.log("Reading template...");
    const template = fs.readFileSync(TEMPLATE_FILE, "utf8");

    if (!fs.existsSync(BLOG_DIR)) {
        fs.mkdirSync(BLOG_DIR, { recursive: true });
    }

    // Sort published articles by date (newest first) for prev/next navigation
    const publishedForNav = articles
        .filter(a => a.date <= TODAY)
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

    function buildPrevLink(nav) {
        if (!nav || !nav.prev) return "";
        return '<a href="' + nav.prev.id + '.html" class="blog-nav-prev"><span class="nav-label">\u2190 B\u00e0i tr\u01b0\u1edbc</span><span class="nav-title">' + htmlEncode(nav.prev.title) + '</span></a>';
    }
    function buildNextLink(nav) {
        if (!nav || !nav.next) return "";
        return '<a href="' + nav.next.id + '.html" class="blog-nav-next"><span class="nav-label">B\u00e0i ti\u1ebfp \u2192</span><span class="nav-title">' + htmlEncode(nav.next.title) + '</span></a>';
    }

    // Build related posts for each article
    function buildRelatedPosts(currentArticle) {
        const publishedOthers = articles
            .filter(a => a.id !== currentArticle.id && a.date <= TODAY)
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
            const titleShort = truncate(article.title, 60);
            const imageAltEncoded = htmlEncode(article.imageAlt || article.title);
            const keywords = article.title.toLowerCase() + ", đà lạt, quán nướng, bbq";
            const dateVI = formatDateVI(article.date);
            const readTime = readingTime(article.body || "");
            const bodyFixed = fixAssetPaths(article.body || "");

            const image400w = article.image.replace(/\.(jpg|webp)$/i, '-400w.webp');
            const image800w = article.image.replace(/\.(jpg|webp)$/i, '-800w.webp');

            let html = template
                .replace(/{{TITLE_SHORT}}/g, titleShort)
                .replace(/{{TITLE}}/g, titleEncoded)
                .replace(/{{ID}}/g, article.id)
                .replace(/{{DATE_VI}}/g, dateVI)
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
                .replace(/{{READING_TIME}}/g, String(readTime))
                .replace(/{{PREV_LINK}}/g, buildPrevLink(navMap[article.id]))
                .replace(/{{NEXT_LINK}}/g, buildNextLink(navMap[article.id]))
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
        { loc: "/review-qr.html", lastmod: TODAY, changefreq: "monthly", priority: "0.5" }
    ];

    const publishedArticles = articles;

    function sitemapUrl(loc, lastmod, changefreq, priority) {
        const fullUrl = SITE_URL + loc;
        var lines = [
            "  <url>",
            "    <loc>" + fullUrl + "</loc>",
            "    <lastmod>" + lastmod + "</lastmod>",
            "    <changefreq>" + changefreq + "</changefreq>",
            "    <priority>" + priority + "</priority>",
            '    <xhtml:link rel="alternate" hreflang="vi" href="' + fullUrl + '"/>',
            '    <xhtml:link rel="alternate" hreflang="en" href="' + fullUrl + '"/>',
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
        sitemapLines.push(sitemapUrl("/blog/" + article.id + ".html", article.date, "monthly", "0.7"));
    }

    sitemapLines.push("</urlset>");
    var sitemap = sitemapLines.join("\n") + "\n";

    fs.writeFileSync(SITEMAP, sitemap, "utf8");
    console.log("Sitemap updated: " + staticPages.length + " static pages + " + publishedArticles.length + " published blog posts");
    console.log("Done!");

} catch (err) {
    console.error("Fatal error:", err.message);
    process.exit(1);
}
