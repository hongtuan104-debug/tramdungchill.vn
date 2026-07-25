/**
 * generate-blog-links.js — Sinh danh sách link tĩnh của toàn bộ bài blog
 * vào khối <noscript> trong blog.html.
 *
 * Vì sao: blog.html render danh sách bài bằng JavaScript (blog-renderer.js).
 * AI bot (GPTBot/ClaudeBot/PerplexityBot) KHÔNG chạy JS → không thấy bài nào.
 * Khối <noscript> tĩnh này giúp bot & crawler không-JS phát hiện đủ 143 bài.
 * Người dùng thường không bị ảnh hưởng (vẫn thấy grid đẹp render bằng JS).
 *
 * Cách chạy:  node scripts/generate-blog-links.js
 * Nên chạy mỗi khi thêm/xoá bài blog (sau generate-blog-pages.js).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function loadBlogTitles() {
  const map = {};
  try {
    const src = fs.readFileSync(path.join(ROOT, 'data', 'blog-data.js'), 'utf8');
    const arts = new Function(src + '\n;return typeof BLOG_ARTICLES!=="undefined"?BLOG_ARTICLES:[];')();
    for (const a of arts) if (a && a.id) map[a.id] = a.title || a.id;
  } catch (e) {
    console.warn('⚠️  Không đọc được blog-data.js:', e.message);
  }
  return map;
}

function titleFromFile(file) {
  try {
    const html = fs.readFileSync(file, 'utf8');
    const m = html.match(/<title>([^<]*)<\/title>/i);
    if (m) return m[1].split('|')[0].split('—')[0].trim();
  } catch (e) { /* bỏ qua */ }
  return null;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function build() {
  const titles = loadBlogTitles();
  const blogDir = path.join(ROOT, 'blog');
  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html')).sort();

  const items = files.map(f => {
    const id = f.replace(/\.html$/, '');
    const title = titles[id] || titleFromFile(path.join(blogDir, f)) || id;
    return `                        <li><a href="blog/${f}">${esc(title)}</a></li>`;
  }).join('\n');

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
  console.log(`✅ blog.html: đã ghi ${files.length} link tĩnh vào <noscript>.`);
}

build();
