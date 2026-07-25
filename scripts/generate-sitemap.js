/**
 * generate-sitemap.js — Tự sinh sitemap.xml ĐẦY ĐỦ từ file thật trên đĩa.
 *
 * Vì sao: sitemap trước đây maintain tay → chỉ có 15/143 bài blog, lastmod cũ.
 * Script này quét trực tiếp các file .html đã publish nên luôn phủ 100%.
 *
 * Cách chạy:  node scripts/generate-sitemap.js
 * Nên chạy sau khi thêm/sửa trang, trước khi git commit.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://tramdungchill.vn';
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// ── Lấy ngày đăng của từng bài blog từ blog-data.js (để lastmod trung thực) ──
function loadBlogDates() {
  const map = {};
  try {
    const src = fs.readFileSync(path.join(ROOT, 'data', 'blog-data.js'), 'utf8');
    // eval an toàn trong function scope để lấy mảng BLOG_ARTICLES
    const articles = new Function(src + '\n;return typeof BLOG_ARTICLES!=="undefined"?BLOG_ARTICLES:[];')();
    for (const a of articles) {
      if (a && a.id) map[a.id] = a.date || null;
    }
  } catch (e) {
    console.warn('⚠️  Không đọc được blog-data.js, dùng ngày hôm nay cho blog:', e.message);
  }
  return map;
}

// ── Cấu hình priority / changefreq cho từng nhóm ──
function meta(loc) {
  if (loc === `${BASE}/`) return { changefreq: 'weekly', priority: '1.0' };
  if (loc.endsWith('/blog.html')) return { changefreq: 'daily', priority: '0.9' };
  if (loc.endsWith('/menu.html')) return { changefreq: 'weekly', priority: '0.9' };
  if (loc.includes('/dip/')) return { changefreq: 'monthly', priority: '0.8' };
  if (loc.endsWith('/duong-di/')) return { changefreq: 'monthly', priority: '0.7' };
  if (loc.includes('/blog/')) return { changefreq: 'monthly', priority: '0.6' };
  if (loc.endsWith('/review-qr.html')) return { changefreq: 'yearly', priority: '0.3' };
  return { changefreq: 'monthly', priority: '0.5' };
}

function hreflang(loc) {
  // Bài tiếng Anh (suffix -en) khai báo en; còn lại vi
  return loc.endsWith('-en.html') ? 'en' : 'vi';
}

function urlBlock({ loc, lastmod }) {
  const m = meta(loc);
  const lang = hreflang(loc);
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${m.changefreq}</changefreq>
    <priority>${m.priority}</priority>
    <xhtml:link rel="alternate" hreflang="${lang}" href="${loc}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>
  </url>`;
}

function build() {
  const blogDates = loadBlogDates();
  const urls = [];

  // 1) Trang tĩnh chính (loại 404, file xác minh, dev/, các trang noindex)
  urls.push({ loc: `${BASE}/`, lastmod: TODAY });
  urls.push({ loc: `${BASE}/menu.html`, lastmod: TODAY });
  urls.push({ loc: `${BASE}/blog.html`, lastmod: TODAY });
  urls.push({ loc: `${BASE}/review-qr.html`, lastmod: TODAY });

  // 2) duong-di/ (index.html → URL dạng thư mục)
  if (fs.existsSync(path.join(ROOT, 'duong-di', 'index.html'))) {
    urls.push({ loc: `${BASE}/duong-di/`, lastmod: TODAY });
  }

  // 3) Landing dịp đặc biệt: dip/*.html
  const dipDir = path.join(ROOT, 'dip');
  if (fs.existsSync(dipDir)) {
    for (const f of fs.readdirSync(dipDir).filter(f => f.endsWith('.html')).sort()) {
      urls.push({ loc: `${BASE}/dip/${f}`, lastmod: TODAY });
    }
  }

  // 4) Toàn bộ bài blog thật trên đĩa: blog/*.html (nguồn chân lý → phủ 100%)
  const blogDir = path.join(ROOT, 'blog');
  let blogCount = 0;
  if (fs.existsSync(blogDir)) {
    for (const f of fs.readdirSync(blogDir).filter(f => f.endsWith('.html')).sort()) {
      const id = f.replace(/\.html$/, '');
      const lastmod = blogDates[id] || TODAY;
      urls.push({ loc: `${BASE}/blog/${f}`, lastmod });
      blogCount++;
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(urlBlock).join('\n')}
</urlset>
`;

  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  console.log(`✅ sitemap.xml đã tạo: ${urls.length} URL (trong đó ${blogCount} bài blog).`);
}

build();
