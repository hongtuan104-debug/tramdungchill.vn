/**
 * generate-blog-links.js — Sinh danh sách link tĩnh (noscript) các bài blog ĐANG INDEX
 * vào blog.html, khớp đúng với danh sách render bằng JS.
 *
 * Vì sao: blog.html render danh sách bài bằng JavaScript (blog-renderer.js đọc
 * data/blog-data-light.js). AI bot (GPTBot/ClaudeBot/PerplexityBot) không chạy JS
 * → không thấy bài nào. Khối <noscript> tĩnh này giúp bot & crawler không-JS thấy.
 *
 * NGUỒN = data/blog-data-light.js (CHỈ chứa bài _indexable, đã lọc 122 bài noindex prune).
 * → noscript phản ánh ĐÚNG danh sách user thấy, KHÔNG surface bài đã noindex.
 *
 * Cách chạy: node scripts/generate-blog-links.js
 * Nên chạy SAU generate-blog-pages.js (script đó cập nhật blog-data-light.js + sitemap.xml).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function loadLightArticles() {
  const src = fs.readFileSync(path.join(ROOT, 'data', 'blog-data-light.js'), 'utf8');
  return new Function(src + '\n;return typeof BLOG_ARTICLES!=="undefined"?BLOG_ARTICLES:[];')();
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function build() {
  const arts = loadLightArticles();
  const items = arts
    .map((a) => `                        <li><a href="blog/${a.id}.html">${esc(a.title)}</a></li>`)
    .join('\n');

  const block = `<!-- BLOG-LINKS:START -->\n${items}\n                        <!-- BLOG-LINKS:END -->`;

  const blogHtmlPath = path.join(ROOT, 'blog.html');
  let html = fs.readFileSync(blogHtmlPath, 'utf8');
  const re = /<!-- BLOG-LINKS:START -->[\s\S]*?<!-- BLOG-LINKS:END -->/;
  if (!re.test(html)) {
    console.error('❌ Không tìm thấy marker <!-- BLOG-LINKS:START/END --> trong blog.html');
    process.exit(1);
  }
  html = html.replace(re, block);
  fs.writeFileSync(blogHtmlPath, html, 'utf8');
  console.log(`✅ blog.html: đã ghi ${arts.length} link tĩnh (bài đang index) vào <noscript>.`);
}

build();
