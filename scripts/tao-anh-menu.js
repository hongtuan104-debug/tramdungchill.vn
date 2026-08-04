/***
 * tao-anh-menu.js
 * Đổi tên ảnh menu theo chuẩn SEO + xuất WebP nhiều kích cỡ cho sách lật (flipbook).
 *
 * CÁCH DÙNG
 *   1. Copy 26 ảnh gốc vào  assets/menu-pages/_goc/
 *      Đặt tên có số thứ tự: 1.jpg, 2.jpg … 26.jpg  (hoặc 01.png, 02.png…).
 *      Thứ tự đúng = bìa → 24 trang món → trang cảm ơn/QR.
 *   2. node scripts/tao-anh-menu.js
 *   3. node scripts/bundle-js.js      (chèn flipbook vào menu.html + vân tay CSS)
 *
 * Script ĐỌC THỨ TỰ TỪ SỐ trong tên file, không dựa vào thứ tự thư mục —
 * "10.jpg" nằm trước "2.jpg" khi sắp chữ cái, đủ để hoán vị cả cuốn menu.
 *
 * Xuất ra assets/menu-pages/:
 *   <slug>-560.webp / -1000.webp / -1600.webp   (srcset cho từng trang)
 *   <slug>-200.webp                              (ảnh nhỏ trong bảng mục lục)
 * và data/menu-pages-meta.json — kích thước THẬT của từng trang.
 *   Meta này để HTML ghi đúng width/height: đặt sai tỉ lệ là trang giật (CLS)
 *   đúng như lỗi placeholder SVG đã sửa ngày 03/08/2026.
 *
 * Ảnh gốc trong _goc/ KHÔNG commit lên git (đã thêm vào .gitignore) — chỉ bản WebP
 * mới lên web, tránh phình repo vài chục MB PNG.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

let sharp;
try {
    sharp = require("sharp");
} catch (e) {
    console.error("Thiếu thư viện sharp. Chạy: npm install sharp");
    process.exit(1);
}

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "assets", "menu-pages", "_goc");
const OUT_DIR = path.join(ROOT, "assets", "menu-pages");
const META_FILE = path.join(ROOT, "data", "menu-pages-meta.json");
const PAGES_DATA = path.join(ROOT, "data", "menu-pages.js");

const QUALITY = 76;          // ảnh menu nền gỗ tối, nhiều nhiễu — 76 vẫn đọc rõ chữ
const VALID_EXT = /\.(jpe?g|png|webp|tiff?)$/i;

// ── Đọc danh sách trang từ data/menu-pages.js ───────────────
function loadPages() {
    const sandbox = {};
    vm.runInNewContext(fs.readFileSync(PAGES_DATA, "utf8"), sandbox);
    return {
        pages: sandbox.MENU_PAGES,
        sizes: sandbox.MENU_PAGE_SIZES,
        thumb: sandbox.MENU_PAGE_THUMB
    };
}

// ── Ghép ảnh gốc với số trang ───────────────────────────────
function mapSources(files, pageCount) {
    const numbered = [];
    const unnumbered = [];

    files.forEach(function (f) {
        const m = path.basename(f).match(/\d+/);
        if (m) numbered.push({ file: f, n: parseInt(m[0], 10) });
        else unnumbered.push(f);
    });

    // Đủ số 1..N và không trùng → tin vào số trong tên file
    const seen = new Set();
    const allValid = numbered.length === files.length &&
        numbered.every(function (x) {
            if (x.n < 1 || x.n > pageCount || seen.has(x.n)) return false;
            seen.add(x.n);
            return true;
        });

    if (allValid) {
        return numbered.sort(function (a, b) { return a.n - b.n; });
    }

    if (unnumbered.length) {
        console.warn("  ⚠ Có file không mang số thứ tự: " + unnumbered.join(", "));
    } else {
        console.warn("  ⚠ Số trong tên file không phải dãy 1.." + pageCount + " liền mạch.");
    }
    console.warn("  → Dùng thứ tự sắp xếp tên file thay thế. KIỂM LẠI BẢNG DƯỚI trước khi build.");

    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    return files.slice().sort(collator.compare).map(function (f, i) {
        return { file: f, n: i + 1 };
    });
}

async function main() {
    const { pages, sizes, thumb } = loadPages();

    if (!fs.existsSync(SRC_DIR)) {
        fs.mkdirSync(SRC_DIR, { recursive: true });
        console.log("Đã tạo thư mục: assets/menu-pages/_goc/");
        console.log("→ Copy " + pages.length + " ảnh menu gốc vào đó (đặt tên 1..." + pages.length + "), rồi chạy lại lệnh này.");
        return;
    }

    const files = fs.readdirSync(SRC_DIR).filter(function (f) { return VALID_EXT.test(f); });

    if (!files.length) {
        console.log("Chưa có ảnh nào trong assets/menu-pages/_goc/");
        console.log("→ Copy " + pages.length + " ảnh menu gốc vào đó (đặt tên 1..." + pages.length + "), rồi chạy lại lệnh này.");
        return;
    }

    console.log("Tìm thấy " + files.length + " ảnh gốc (cần " + pages.length + ").");
    if (files.length !== pages.length) {
        console.warn("  ⚠ LỆCH SỐ LƯỢNG — trang thiếu ảnh sẽ bị bỏ qua, trang thừa không có chỗ trong data/menu-pages.js.");
    }

    const mapped = mapSources(files, pages.length);
    const meta = {};
    let written = 0;

    for (const item of mapped) {
        const page = pages.find(function (p) { return p.n === item.n; });
        if (!page) {
            console.warn("  ⚠ Bỏ qua " + item.file + " — không có trang số " + item.n + " trong data/menu-pages.js");
            continue;
        }

        const srcPath = path.join(SRC_DIR, item.file);
        const img = sharp(srcPath, { limitInputPixels: false });
        const info = await img.metadata();

        meta[page.slug] = { w: info.width, h: info.height, n: page.n };

        const targets = sizes.concat([thumb]);
        for (const w of targets) {
            const outPath = path.join(OUT_DIR, page.slug + "-" + w + ".webp");
            // Không phóng to quá ảnh gốc — chỉ tốn dung lượng, không thêm chi tiết
            const targetW = Math.min(w, info.width);
            await sharp(srcPath, { limitInputPixels: false })
                .resize({ width: targetW, withoutEnlargement: true })
                .webp({ quality: w === thumb ? 62 : QUALITY, effort: 5 })
                .toFile(outPath);
            written++;
        }

        const kb = (fs.statSync(path.join(OUT_DIR, page.slug + "-1000.webp")).size / 1024).toFixed(0);
        console.log(
            "  " + String(page.n).padStart(2, "0") + "  " + item.file +
            "  →  " + page.slug + "-*.webp  (" + info.width + "×" + info.height + ", bản 1000w " + kb + " KB)"
        );
    }

    fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2) + "\n", "utf8");

    const totalBytes = fs.readdirSync(OUT_DIR)
        .filter(function (f) { return f.endsWith(".webp"); })
        .reduce(function (s, f) { return s + fs.statSync(path.join(OUT_DIR, f)).size; }, 0);

    console.log("\nXong: " + written + " file WebP, tổng " + (totalBytes / 1024 / 1024).toFixed(1) + " MB.");
    console.log("Đã ghi data/menu-pages-meta.json (kích thước thật từng trang).");
    console.log("→ Chạy tiếp: node scripts/bundle-js.js");
}

main().catch(function (e) {
    console.error("tao-anh-menu lỗi:", e.message);
    process.exit(1);
});
