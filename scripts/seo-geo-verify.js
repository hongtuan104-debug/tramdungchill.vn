/**
 * seo-geo-verify.js
 * Kiểm tra các điều kiện SEO + GEO 2026 mà site PHẢI giữ, theo hướng dẫn chính chủ
 * Google "Optimizing your website for generative AI features" (10/07/2026).
 *
 * Chạy: node scripts/seo-geo-verify.js
 * Thoát khác 0 nếu có mục FAIL → dùng được trong pre-commit / CI.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
// templates/ chứa {{PLACEHOLDER}} nên JSON-LD chưa parse được — và robots.txt
// đã Disallow /templates/, nên không nằm trong phạm vi kiểm tra.
const SKIP_DIRS = /^(node_modules|\.git|dist|docs|plans|dev|templates)$/;

function allHtml(dir, acc) {
    acc = acc || [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) {
            if (!SKIP_DIRS.test(e.name)) allHtml(path.join(dir, e.name), acc);
        } else if (e.name.endsWith(".html")) {
            acc.push(path.join(dir, e.name));
        }
    }
    return acc;
}

const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");
const files = allHtml(ROOT);

// Các trang "chính" cần chuẩn a11y đầy đủ (blog dùng template riêng, kiểm tách)
const KEY_PAGES = [
    "index.html", "menu.html", "blog.html", "duong-di/index.html",
    "dip/san-tau-da-lat.html", "dip/sinh-nhat.html",
    "dip/team-building.html", "dip/cau-hon-hen-ho.html"
];

const results = [];
const add = (name, ok, detail) => results.push({ name, ok, detail });

// ── R1. Điều kiện CỨNG của AI Overviews: không thẻ chặn snippet ──────────
{
    const offenders = [];
    for (const f of files) {
        const s = fs.readFileSync(f, "utf8");
        if (/\b(nosnippet|max-snippet|noarchive|noimageindex)\b|data-nosnippet/.test(s)) {
            offenders.push(rel(f));
        }
    }
    add("Không thẻ chặn snippet (nosnippet/max-snippet/data-nosnippet)",
        offenders.length === 0,
        offenders.length ? offenders.slice(0, 5).join(", ") : files.length + " trang sạch");
}

// ── R2. Trang chủ + trang tiền phải index được ───────────────────────────
{
    const bad = [];
    for (const p of KEY_PAGES) {
        const s = fs.readFileSync(path.join(ROOT, p), "utf8");
        const m = s.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
        if (m && /noindex/i.test(m[1])) bad.push(p + " → " + m[1]);
    }
    add("Trang chính đều index được", bad.length === 0,
        bad.length ? bad.join(", ") : KEY_PAGES.length + " trang index,follow");
}

// ── R3. Landmark <main> cho accessibility tree ───────────────────────────
{
    const bad = [];
    for (const p of KEY_PAGES) {
        const s = fs.readFileSync(path.join(ROOT, p), "utf8");
        const o = (s.match(/<main[\s>]/g) || []).length;
        const c = (s.match(/<\/main>/g) || []).length;
        if (o !== 1 || c !== 1) bad.push(p + " (" + o + "/" + c + ")");
    }
    add("Mỗi trang chính có đúng 1 <main>", bad.length === 0,
        bad.length ? bad.join(", ") : KEY_PAGES.length + " trang đạt");
}

// ── R4. Không dùng <div onclick> thay cho nút/link thật ──────────────────
{
    const offenders = [];
    for (const f of files) {
        const s = fs.readFileSync(f, "utf8");
        if (/<div[^>]*\sonclick=/i.test(s)) offenders.push(rel(f));
    }
    add("Không có <div onclick> (nút/link phải là element thật)",
        offenders.length === 0,
        offenders.length ? offenders.slice(0, 5).join(", ") : "sạch");
}

// ── R5. Heading không nhảy cấp trên trang chính ──────────────────────────
{
    const bad = [];
    for (const p of KEY_PAGES) {
        const s = fs.readFileSync(path.join(ROOT, p), "utf8");
        const levels = [...s.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1]);
        if (levels.filter((l) => l === 1).length !== 1) {
            bad.push(p + ": " + levels.filter((l) => l === 1).length + " thẻ h1");
            continue;
        }
        for (let i = 1; i < levels.length; i++) {
            if (levels[i] - levels[i - 1] > 1) {
                bad.push(p + ": h" + levels[i - 1] + " → h" + levels[i]);
                break;
            }
        }
    }
    add("Heading: đúng 1 h1, không nhảy cấp", bad.length === 0,
        bad.length ? bad.join("; ") : KEY_PAGES.length + " trang đạt");
}

// ── R5b. Blog: <main> + heading không nhảy cấp (143 trang sinh từ template) ──
{
    const dir = path.join(ROOT, "blog");
    const posts = fs.readdirSync(dir).filter((f) => f.endsWith(".html"));
    let noMain = 0;
    const skips = [];
    for (const f of posts) {
        const s = fs.readFileSync(path.join(dir, f), "utf8");
        if (!/<main[\s>]/.test(s)) noMain++;
        const lv = [...s.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1]);
        for (let i = 1; i < lv.length; i++) {
            if (lv[i] - lv[i - 1] > 1) { skips.push(f + " h" + lv[i - 1] + "→h" + lv[i]); break; }
        }
    }
    add("Blog: mọi bài có <main> và heading không nhảy cấp",
        noMain === 0 && skips.length === 0,
        (noMain || skips.length)
            ? "thiếu main: " + noMain + " · nhảy cấp: " + skips.length + " (" + skips.slice(0, 3).join(", ") + ")"
            : posts.length + " bài đạt");
}

// ── R6. JSON-LD phải parse được ──────────────────────────────────────────
{
    let total = 0;
    const bad = [];
    for (const f of files) {
        const s = fs.readFileSync(f, "utf8");
        for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
            total++;
            try { JSON.parse(m[1]); } catch (e) { bad.push(rel(f)); }
        }
    }
    add("Mọi khối JSON-LD parse được", bad.length === 0,
        bad.length ? [...new Set(bad)].slice(0, 5).join(", ") : total + " khối hợp lệ");
}

// ── R7. FAQPage schema khớp 1:1 với text hiển thị (quy tắc cốt lõi) ──────
{
    const s = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    const strip = (x) => x.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

    const domQ = [...s.matchAll(/<summary><h3[^>]*>([\s\S]*?)<\/h3><\/summary>/g)].map((m) => strip(m[1]));

    let schemaQ = [];
    for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
        try {
            const j = JSON.parse(m[1]);
            if (j["@type"] === "FAQPage") schemaQ = (j.mainEntity || []).map((q) => q.name);
        } catch (e) { /* đã báo ở R6 */ }
    }

    const onlySchema = schemaQ.filter((q) => !domQ.includes(q));
    const onlyDom = domQ.filter((q) => !schemaQ.includes(q));
    const ok = domQ.length > 0 && onlySchema.length === 0 && onlyDom.length === 0;
    add("FAQPage schema khớp 1:1 với text hiển thị", ok,
        ok ? domQ.length + " câu, khớp hoàn toàn"
           : "chỉ-trong-schema: " + onlySchema.length + ", chỉ-trong-DOM: " + onlyDom.length);
}

// ── R8. Bộ câu hỏi query fan-out phải có text đọc được trên trang chủ ────
{
    const s = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    // Chỉ lấy phần <body>, và bỏ mọi khối <script> để không tính nhầm schema
    const body = (s.split(/<body[^>]*>/)[1] || "")
        .replace(/<script[\s\S]*?<\/script>/g, "");
    const TOPICS = {
        "địa chỉ": /Huỳnh Tấn Phát/i,
        "khoảng cách trung tâm": /\b7\s*km\b/i,
        "giờ mở cửa": /15:00/,
        "giá": /95\.000|95,000/,
        "đặt bàn": /đặt bàn/i,
        "đỗ xe": /đỗ xe|đậu xe|bãi đỗ/i,
        "trẻ em / gia đình": /trẻ nhỏ|trông giúp bé|gia đình/i,
        "trong nhà / ngoài trời": /mái che|ngoài trời/i,
        "nhóm đông": /team building|nhóm đông|100 khách/i,
        "thú cưng": /thú cưng/i,
        "thanh toán": /chuyển khoản/i,
        "menu tiếng Anh": /tiếng Anh/i
    };
    const missing = Object.entries(TOPICS).filter(([, re]) => !re.test(body)).map(([k]) => k);
    add("Fan-out: mọi chủ đề có text đọc được trên trang chủ",
        missing.length === 0,
        missing.length ? "THIẾU: " + missing.join(", ")
                       : Object.keys(TOPICS).length + "/" + Object.keys(TOPICS).length + " chủ đề có text");
}

// ── R9. Mọi key data-i18n đều có bản dịch vi + en ────────────────────────
{
    const src = fs.readFileSync(path.join(ROOT, "data/translations.js"), "utf8");
    let T;
    try {
        // eslint-disable-next-line no-eval
        T = eval(src + "; TRANSLATIONS");
    } catch (e) {
        T = null;
    }
    if (!T) {
        add("Bản dịch i18n đầy đủ", false, "không đọc được translations.js");
    } else {
        const used = new Set();
        for (const p of KEY_PAGES) {
            const s = fs.readFileSync(path.join(ROOT, p), "utf8");
            for (const m of s.matchAll(/data-i18n="([^"]+)"/g)) used.add(m[1]);
        }
        const missVi = [...used].filter((k) => !(k in T.vi));
        const missEn = [...used].filter((k) => !(k in T.en));
        add("Bản dịch i18n đầy đủ cho mọi data-i18n",
            missVi.length === 0 && missEn.length === 0,
            (missVi.length || missEn.length)
                ? "thiếu vi: " + missVi.slice(0, 6).join(",") + " | thiếu en: " + missEn.slice(0, 6).join(",")
                : used.size + " key đủ cả vi/en");
    }
}

// ── R10. TRANSLATIONS phải khai bằng var (const làm hỏng language switcher) ──
{
    const src = fs.readFileSync(path.join(ROOT, "data/translations.js"), "utf8");
    add("TRANSLATIONS khai bằng var (không phải const)",
        /^var TRANSLATIONS/m.test(src),
        /^var TRANSLATIONS/m.test(src) ? "đúng" : "PHẢI dùng var — const không tạo window property");
}

// ── R11. Số lượng đánh giá phải nhất quán giữa text và schema ────────────
{
    const shown = {};
    const schema = {};
    for (const f of files) {
        const s = fs.readFileSync(f, "utf8");
        for (const m of s.matchAll(/(gần |hơn |khoảng )?([0-9][0-9.,]{2,6})\+? (?:lượt )?(?:đánh giá|reviews?)/gi)) {
            const n = m[2].replace(/[.,]/g, "");
            shown[n] = (shown[n] || 0) + 1;
        }
        for (const m of s.matchAll(/"reviewCount"\s*:\s*"?([0-9]+)/g)) {
            schema[m[1]] = (schema[m[1]] || 0) + 1;
        }
    }
    const shownVals = Object.keys(shown).filter((n) => +n >= 1000);
    const schemaVals = Object.keys(schema);
    const consistent = shownVals.length <= 1 &&
        schemaVals.every((v) => shownVals.length === 0 || shownVals.includes(v));
    add("Số lượt đánh giá nhất quán (text ↔ schema)", consistent,
        consistent ? "một con số duy nhất: " + (shownVals[0] || schemaVals[0])
                   : "text: " + shownVals.join("/") + " · schema: " + schemaVals.join("/"));
}

// ── In kết quả ───────────────────────────────────────────────────────────
console.log("\n🔎 SEO + GEO VERIFY — tramdungchill.vn");
console.log("   Chuẩn: Google AI optimization guide (10/07/2026)\n");

let fails = 0;
for (const r of results) {
    if (!r.ok) fails++;
    console.log("  " + (r.ok ? "✅" : "❌") + "  " + r.name);
    console.log("        " + r.detail);
}

console.log("\n  " + (results.length - fails) + "/" + results.length + " mục PASS" +
    (fails ? "  —  " + fails + " mục cần sửa" : "  —  tất cả đạt"));

process.exit(fails ? 1 : 0);
