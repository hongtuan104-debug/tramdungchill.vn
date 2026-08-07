/***
 * generate-menu-flipbook.js
 * Sinh HTML tĩnh của sách lật menu (26 trang ảnh) vào menu.html, giữa marker:
 *   <!-- MENU_FLIPBOOK:START -->  …  <!-- MENU_FLIPBOOK:END -->
 *
 * TẠI SAO SINH HTML TĨNH thay vì để JS dựng:
 *   - GPTBot/ClaudeBot/PerplexityBot phần lớn KHÔNG chạy JS → menu dựng bằng JS là
 *     vô hình với chúng. 26 thẻ <img alt="…"> nằm sẵn trong HTML thô thì Google Images
 *     index được, AI đọc được tên món trong alt.
 *   - Không JS (hoặc JS lỗi) khách vẫn cuộn xem đủ 26 trang dạng lưới — js/menu-flipbook.js
 *     chỉ NÂNG CẤP phần này thành sách lật, không phải điều kiện để nội dung tồn tại.
 *
 * AN TOÀN: chưa có ảnh WebP trong assets/menu-pages/ thì để trống vùng marker.
 *   Chèn HTML trỏ tới 26 ảnh chưa tồn tại = 26 lỗi 404 trên production.
 *
 * Nguồn dữ liệu: data/menu-pages.js + data/menu-pages-meta.json (do tao-anh-menu.js ghi).
 * Zero npm deps — chỉ Node built-ins.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const PAGES_DATA = path.join(ROOT, "data", "menu-pages.js");
const META_FILE = path.join(ROOT, "data", "menu-pages-meta.json");
const MENU_HTML = path.join(ROOT, "menu.html");
const IMG_DIR = path.join(ROOT, "assets", "menu-pages");

const START = "<!-- MENU_FLIPBOOK:START -->";
const END = "<!-- MENU_FLIPBOOK:END -->";

function loadPages() {
    const sandbox = {};
    vm.runInNewContext(fs.readFileSync(PAGES_DATA, "utf8"), sandbox);
    return sandbox;
}

function esc(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/* Vân tay theo nội dung file — thay ảnh mà giữ nguyên URL thì service worker
   (cache-first cho mọi thứ ngoài /assets/images/) và cache trình duyệt đều tiếp
   tục trả bản cũ; khách bấm Ctrl+F5 cũng không phá được lớp service worker.
   Đã dính đúng lỗi này ngày 07/08/2026 khi thay trang 01 và trang 10.
   Đổi ảnh → md5 đổi → URL đổi → không còn chỗ nào giữ được bản cũ. */
function fingerprint(absPath) {
    try {
        return crypto.createHash("md5").update(fs.readFileSync(absPath)).digest("hex").slice(0, 8);
    } catch (e) {
        return null;
    }
}

function buildFlipbookHtml(data, meta) {
    const dir = data.MENU_PAGE_DIR;
    const sizes = data.MENU_PAGE_SIZES;
    const groups = {};
    data.MENU_PAGE_GROUPS.forEach(function (g) { groups[g.id] = g; });

    const out = [];
    out.push('<section class="menu-flipbook-section" id="menu-anh">');
    out.push('    <div class="container">');
    out.push('        <div class="section-header">');
    out.push('            <span class="section-tag" data-i18n="flip.tag">Quyển menu</span>');
    out.push('            <h2 class="section-title" data-i18n="flip.title">Lật từng trang menu<br><em>như cầm quyển thật</em></h2>');
    out.push('            <p class="menu-flipbook-hint" data-i18n="flip.hint">Bấm vào mép trang để lật, hoặc dùng phím ← →. Trên điện thoại thì vuốt ngang. Bấm vào trang để phóng to đọc rõ.</p>');
    out.push('        </div>');
    out.push('');
    out.push('        <div class="flipbook" id="menuFlipbook" data-page-count="' + data.MENU_PAGES.length + '">');
    out.push('            <div class="flipbook-pages">');

    data.MENU_PAGES.forEach(function (p) {
        const m = meta[p.slug] || { w: 1058, h: 1500 };
        // Cỡ thật do tao-anh-menu.js ghi lại; khai cỡ không có file là trình duyệt
        // tải 404 hoặc tính sai độ phân giải cần dùng.
        const mySizes = m.sizes && m.sizes.length ? m.sizes : sizes;
        const biggest = mySizes[mySizes.length - 1];
        const urlOf = function (w) {
            const rel = dir + "/" + p.slug + "-" + w + ".webp";
            const v = fingerprint(path.join(ROOT, rel));
            return rel + (v ? "?v=" + v : "");
        };
        const srcset = mySizes.map(function (w) {
            return urlOf(w) + " " + w + "w";
        }).join(", ");
        const eager = p.n === 1;
        const g = groups[p.group];

        out.push('                <figure class="flip-page" data-page="' + p.n + '" data-group="' + esc(p.group) + '"' +
            (g ? ' data-group-label="' + esc(g.label) + '" data-group-i18n="' + esc(g.i18n) + '"' : '') + '>');
        out.push('                    <img src="' + urlOf(biggest) + '"');
        out.push('                         srcset="' + srcset + '"');
        out.push('                         sizes="(min-width: 900px) 46vw, 92vw"');
        out.push('                         width="' + m.w + '" height="' + m.h + '"');
        out.push('                         alt="' + esc(p.alt) + '"');
        out.push('                         loading="' + (eager ? "eager" : "lazy") + '" decoding="async"' +
            (eager ? ' fetchpriority="high"' : "") + '>');
        out.push('                    <figcaption class="flip-page-caption">Trang ' + p.n + "/" + data.MENU_PAGES.length +
            (g ? " — " + esc(g.label) : "") + '</figcaption>');
        out.push('                </figure>');
    });

    out.push('            </div>');
    out.push('        </div>');
    out.push('    </div>');
    out.push('</section>');
    return out.join("\n");
}

function generateMenuFlipbook() {
    const data = loadPages();
    const pages = data.MENU_PAGES;

    // Có đủ ảnh chưa? Kiểm bản 1000w của MỌI trang — thiếu một trang là sách thủng một tờ.
    const missing = pages.filter(function (p) {
        return !fs.existsSync(path.join(IMG_DIR, p.slug + "-1000.webp"));
    });

    let html = fs.readFileSync(MENU_HTML, "utf8");
    const s = html.indexOf(START);
    const e = html.indexOf(END);
    if (s === -1 || e === -1 || e < s) {
        console.error("  generate-menu-flipbook: KHONG tim thay marker MENU_FLIPBOOK trong menu.html -> bo qua");
        return;
    }

    let content;
    if (missing.length === pages.length) {
        content = "        <!-- Chua co anh menu. Copy anh goc vao assets/menu-pages/_goc/ roi chay:\n" +
            "             node scripts/tao-anh-menu.js && node scripts/bundle-js.js -->";
        console.log("  generate-menu-flipbook: chua co anh WebP nao -> de trong (khong sinh the img 404)");
    } else if (missing.length) {
        content = "        <!-- Thieu " + missing.length + "/" + pages.length + " trang anh -> tam de trong.\n" +
            "             Trang thieu: " + missing.map(function (p) { return p.n; }).join(", ") + " -->";
        console.error("  generate-menu-flipbook: THIEU " + missing.length + "/" + pages.length +
            " trang (" + missing.map(function (p) { return p.n; }).join(", ") + ") -> de trong, chay lai tao-anh-menu.js");
    } else {
        let meta = {};
        if (fs.existsSync(META_FILE)) {
            try {
                meta = JSON.parse(fs.readFileSync(META_FILE, "utf8"));
            } catch (err) {
                console.error("  generate-menu-flipbook: doc menu-pages-meta.json loi -> dung ti le mac dinh");
            }
        }
        content = buildFlipbookHtml(data, meta);
        console.log("  generate-menu-flipbook: chen " + pages.length + " trang menu anh vao menu.html");
    }

    html = html.slice(0, s + START.length) + "\n" + content + "\n    " + html.slice(e);
    fs.writeFileSync(MENU_HTML, html, "utf8");
}

module.exports = { generateMenuFlipbook };

if (require.main === module) {
    try {
        generateMenuFlipbook();
    } catch (e) {
        console.error("generate-menu-flipbook fatal:", e.message);
        process.exit(1);
    }
}
