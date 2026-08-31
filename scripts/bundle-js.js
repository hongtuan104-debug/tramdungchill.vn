/***
 * bundle-js.js
 * Bundles and minifies JavaScript files for production.
 * Zero npm dependencies — only Node built-ins (fs, path).
 *
 * Output:
 *   dist/common.min.js  — shared modules (layout-loader, utils, schema-generator, navbar, i18n, scroll-ui, app)
 *   dist/index.min.js   — index page specific (hero, gallery, booking)
 *   dist/blog.min.js    — blog page specific (blog-renderer)
 *   dist/menu.min.js    — menu page specific (menu-flipbook)
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

// ── File groups ──────────────────────────────────────────────

const COMMON_FILES = [
    "components/layout-loader.js",
    "js/utils.js",
    "js/schema-generator.js",
    "js/navbar.js",
    "js/i18n.js",
    "js/scroll-ui.js",
    "js/fab-contact.js",
    "js/app.js"
];

const INDEX_FILES = [
    "js/hero.js",
    "js/gallery.js",
    "js/booking.js",
    "js/sticky-tiktok.js"
];

const BLOG_FILES = [
    "js/blog-renderer.js"
];

const MENU_FILES = [
    "js/menu-flipbook.js"
];

// ── Simple minifier (no npm deps) ───────────────────────────

function minify(source) {
    let out = source;

    // Remove multi-line comments (but keep conditional / license comments starting with /*!)
    out = out.replace(/\/\*(?!\!)[\s\S]*?\*\//g, "");

    // Remove single-line comments (careful not to strip URLs like https://)
    // Only remove // comments that appear at the start of a line or after whitespace/semicolons
    out = out.replace(/(^|[\s;,{}()])\/\/(?![\/\*]).*$/gm, "$1");

    // Collapse multiple blank lines into one newline
    out = out.replace(/\n{3,}/g, "\n\n");

    // Trim trailing whitespace on each line
    out = out.replace(/[ \t]+$/gm, "");

    // Collapse runs of spaces/tabs (but not newlines) into a single space
    out = out.replace(/[ \t]{2,}/g, " ");

    // Remove leading whitespace on each line (indentation)
    out = out.replace(/^[ \t]+/gm, "");

    // Remove empty lines
    out = out.replace(/^\s*\n/gm, "");

    return out.trim() + "\n";
}

// ── Concatenate & minify a list of relative paths ────────────

function bundle(files, outName) {
    const parts = [];
    for (const rel of files) {
        const abs = path.join(ROOT, rel);
        if (!fs.existsSync(abs)) {
            console.error("  WARNING: file not found — " + rel);
            continue;
        }
        const src = fs.readFileSync(abs, "utf8");
        // Add a separator comment so we can debug later
        parts.push("/* --- " + rel + " --- */");
        parts.push(src);
    }
    const concatenated = parts.join("\n");
    const minified = minify(concatenated);
    const outPath = path.join(DIST, outName);
    fs.writeFileSync(outPath, minified, "utf8");

    const origSize = Buffer.byteLength(concatenated, "utf8");
    const minSize = Buffer.byteLength(minified, "utf8");
    const pct = origSize ? Math.round((1 - minSize / origSize) * 100) : 0;
    console.log(
        "  " + outName + "  " +
        (origSize / 1024).toFixed(1) + " KB → " +
        (minSize / 1024).toFixed(1) + " KB  (" + pct + "% smaller)"
    );
    return outPath;
}

// ── Main ─────────────────────────────────────────────────────

console.log("Bundling JavaScript...");

if (!fs.existsSync(DIST)) {
    fs.mkdirSync(DIST, { recursive: true });
    console.log("  Created dist/ directory");
}

const outputs = [];
outputs.push(bundle(COMMON_FILES, "common.min.js"));
outputs.push(bundle(INDEX_FILES, "index.min.js"));
outputs.push(bundle(BLOG_FILES, "blog.min.js"));
outputs.push(bundle(MENU_FILES, "menu.min.js"));

// ── Syntax-check each bundle ─────────────────────────────────

console.log("\nVerifying syntax...");
const { execSync } = require("child_process");
let allOk = true;
for (const filePath of outputs) {
    try {
        execSync("node -c " + JSON.stringify(filePath), { stdio: "pipe" });
        console.log("  OK  " + path.basename(filePath));
    } catch (e) {
        console.error("  FAIL  " + path.basename(filePath));
        console.error(e.stderr ? e.stderr.toString() : e.message);
        allOk = false;
    }
}

if (!allOk) {
    console.error("\nSyntax errors found! Please fix before deploying.");
    process.exit(1);
}

console.log("\nDone! " + outputs.length + " JS bundles written to dist/");

// ── CSS Minification ─────────────────────────────────────────

console.log("\nMinifying CSS...");

function minifyCSS(source) {
    let out = source;
    // Remove CSS comments
    out = out.replace(/\/\*[\s\S]*?\*\//g, "");
    // Remove newlines
    out = out.replace(/\n/g, "");
    // Collapse whitespace
    out = out.replace(/\s{2,}/g, " ");
    // Remove spaces around CSS punctuation
    out = out.replace(/\s*([{}:;,>~+])\s*/g, "$1");
    // Remove trailing semicolons before }
    out = out.replace(/;}/g, "}");
    // Remove leading/trailing whitespace
    out = out.trim();
    return out + "\n";
}

// style.min.css  — dùng cho trang chủ, menu, blog index, các landing dịp.
// blog-post.min.css — style cho NỘI DUNG bài viết. Trước đây css/blog-post.css
//   nằm trong repo nhưng KHÔNG file nào nạp: template bài chỉ <link> tới
//   css/style.css, mà file đó không hề chứa .blog-post-body. Hệ quả là 64
//   selector định dạng h2/h3/đoạn văn/danh sách/bảng trong bài đều vô hiệu,
//   nội dung bài rơi về style mặc định của trình duyệt.
const CSS_BUNDLES = [
    { src: "style.css", out: "style.min.css" },
    { src: "blog-post.css", out: "blog-post.min.css" }
];

for (const b of CSS_BUNDLES) {
    const cssFile = path.join(ROOT, "css", b.src);
    if (!fs.existsSync(cssFile)) {
        console.error("  WARNING: khong tim thay css/" + b.src);
        continue;
    }
    const cssSource = fs.readFileSync(cssFile, "utf8");
    const cssMinified = minifyCSS(cssSource);
    fs.writeFileSync(path.join(DIST, b.out), cssMinified, "utf8");

    const cssOrig = Buffer.byteLength(cssSource, "utf8");
    const cssMin = Buffer.byteLength(cssMinified, "utf8");
    const cssPct = cssOrig ? Math.round((1 - cssMin / cssOrig) * 100) : 0;
    console.log(
        "  " + b.out + "  " +
        (cssOrig / 1024).toFixed(1) + " KB → " +
        (cssMin / 1024).toFixed(1) + " KB  (" + cssPct + "% smaller)"
    );
}

// ── Footer dùng chung cho mọi trang ──────────────────────────────
// Chạy ở đây để không ai quên: footer nằm trong 7 file (component + template bài
// + 404 + 4 trang dịp), sửa tay từng file là cách cũ đã đẻ ra 5 footer lệch nhau.
// Nướng thanh nav vào 4 trang còn nạp nav lúc chạy (index/menu/blog/đường-đi).
// Phải chạy TRƯỚC generate-footer.js: cả hai cùng sửa các file đó, chạy sau thì
// bản đọc vào của script kia đã cũ.
console.log("");
console.log("Đồng bộ nav...");
try {
    require("child_process").execSync("node " + JSON.stringify(path.join(__dirname, "generate-nav.js")), { stdio: "inherit" });
} catch (e) {
    console.error("  Bước này lỗi (khong chan build): " + e.message);
}

console.log("\nĐồng bộ footer...");
try {
    require("child_process").execSync("node " + JSON.stringify(path.join(__dirname, "generate-footer.js")), { stdio: "inherit" });
} catch (e) {
    console.error("  Bước này lỗi (khong chan build): " + e.message);
}

// ── Preconnect + vân tay CSS cho các trang tĩnh ──────────────────
// Chạy SAU khi có dist/style.min.css để băm được nội dung. Không có bước này
// thì sửa CSS xong người dùng vẫn thấy bản cũ trong cache.
console.log("\nGắn preconnect + vân tay CSS...");
try {
    require("child_process").execSync("node " + JSON.stringify(path.join(__dirname, "toi-uu-tai-trang.js")), { stdio: "inherit" });
} catch (e) {
    console.error("  Bước này lỗi (khong chan build): " + e.message);
}

// ── Sinh menu.html (JSON-LD MenuItem + danh sach mon tinh) tu data/menu-data.js ──
console.log("\nGenerating menu.html (schema + static list)...");
try {
    require("./generate-menu").generateMenu();
} catch (e) {
    console.error("  Menu generation failed (khong chan build): " + e.message);
}

// ── Chen quyen menu anh (26 trang) vao menu.html ────────────────
// Chay SAU generate-menu de khong bi ghi de lan nhau (hai script sua cung file,
// moi script chi dong vao vung marker cua minh).
console.log("\nChen quyen menu anh (flipbook)...");
try {
    const flip = require("./generate-menu-flipbook");
    flip.generateMenuFlipbook();
    flip.generateMenuPreview();
} catch (e) {
    console.error("  Flipbook generation failed (khong chan build): " + e.message);
}

console.log("\nAll done!");
