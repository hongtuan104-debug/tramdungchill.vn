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

// ── R5c. Thẻ <title> không được chứa "..." do site tự cắt ────────────────
// Generator từng ghép "{title cắt 60 ký tự} — Trạm Dừng Chill Đà Lạt" nên
// 86/143 bài có dấu ba chấm giữa title, nuốt mất keyword ở đuôi.
{
    const dir = path.join(ROOT, "blog");
    const posts = fs.readdirSync(dir).filter((f) => f.endsWith(".html"));
    const bad = [];
    for (const f of posts) {
        const t = (fs.readFileSync(path.join(dir, f), "utf8").match(/<title>([^<]+)<\/title>/) || [])[1] || "";
        if (t.includes("...")) bad.push(f.replace(".html", ""));
    }
    add("Thẻ <title> blog không bị cắt cụt bằng \"...\"", bad.length === 0,
        bad.length ? bad.length + " bài bị cắt (" + bad.slice(0, 3).join(", ") + ")"
                   : posts.length + " bài giữ title đầy đủ");
}

// ── R5d. Tín hiệu ngôn ngữ phải nhất quán trên từng bài ──────────────────
// <html lang> nằm trong accessibility tree (screen reader chọn giọng theo nó).
// Trước đây template hardcode lang="vi" nên 2 bài tiếng Anh tự mâu thuẫn với
// hreflang="en" + schema inLanguage="en" của chính mình, và hiện nav/CTA tiếng Việt.
{
    const dir = path.join(ROOT, "blog");
    const posts = fs.readdirSync(dir).filter((f) => f.endsWith(".html"));
    const VN_UI = ["Trang chủ", "Thực đơn", "Câu hỏi thường gặp", "Bài viết liên quan", "Đặt bàn ngay"];
    const bad = [];
    for (const f of posts) {
        const s = fs.readFileSync(path.join(dir, f), "utf8");
        const lang = (s.match(/<html lang="([^"]+)"/) || [])[1];
        const hre = (s.match(/hreflang="([^"]+)"/) || [])[1];
        const inl = (s.match(/"inLanguage":\s*"([^"]+)"/) || [])[1];
        const og = (s.match(/og:locale" content="([^"]+)"/) || [])[1];
        if (lang !== hre || lang !== inl || og !== (lang === "en" ? "en_US" : "vi_VN")) {
            bad.push(f.replace(".html", "") + " (lang=" + lang + " hreflang=" + hre + " schema=" + inl + " og=" + og + ")");
            continue;
        }
        if (lang === "en") {
            const body = (s.split(/<body[^>]*>/)[1] || "").replace(/<script[\s\S]*?<\/script>/g, "");
            const leak = VN_UI.filter((k) => body.includes(k));
            if (leak.length) bad.push(f.replace(".html", "") + " còn UI tiếng Việt: " + leak.join(","));
        }
    }
    add("Tín hiệu ngôn ngữ nhất quán (html lang · hreflang · og · schema · UI)",
        bad.length === 0,
        bad.length ? bad.slice(0, 3).join(" | ") : posts.length + " bài nhất quán");
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
    const FAQ_PAGES = [
        "index.html", "menu.html", "duong-di/index.html",
        "dip/san-tau-da-lat.html", "dip/sinh-nhat.html",
        "dip/team-building.html", "dip/cau-hon-hen-ho.html"
    ];
    const strip = (x) => x.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

    const bad = [];
    let totalQ = 0;
    for (const p of FAQ_PAGES) {
        const s = fs.readFileSync(path.join(ROOT, p), "utf8");
        const domQ = [...s.matchAll(/<summary>\s*<h3[^>]*>([\s\S]*?)<\/h3>\s*<\/summary>/g)].map((m) => strip(m[1]));

        let schemaQ = null;
        for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
            try {
                const j = JSON.parse(m[1]);
                if (j["@type"] === "FAQPage") schemaQ = (j.mainEntity || []).map((q) => q.name);
            } catch (e) { /* đã báo ở R6 */ }
        }

        if (domQ.length === 0) { bad.push(p + ": không có FAQ hiển thị"); continue; }
        if (schemaQ === null) { bad.push(p + ": có text nhưng thiếu FAQPage schema"); continue; }
        const onlySchema = schemaQ.filter((q) => !domQ.includes(q));
        const onlyDom = domQ.filter((q) => !schemaQ.includes(q));
        if (onlySchema.length || onlyDom.length) {
            bad.push(p + ": chỉ-schema " + onlySchema.length + " / chỉ-DOM " + onlyDom.length);
        }
        totalQ += domQ.length;
    }
    add("FAQPage schema khớp 1:1 với text hiển thị (mọi trang)", bad.length === 0,
        bad.length ? bad.join(" | ") : FAQ_PAGES.length + " trang · " + totalQ + " câu, khớp hoàn toàn");
}

// ── R7b. Không trang nào bị mất schema ngoài FAQPage ─────────────────────
// Chốt chặn cho lỗi từng gặp: regex gỡ FAQPage cũ nuốt nhầm Restaurant/Menu.
{
    const EXPECTED = {
        "index.html": ["Restaurant,LocalBusiness", "WebSite", "BreadcrumbList", "WebPage", "FAQPage"],
        "menu.html": ["Menu", "BreadcrumbList", "FAQPage"],
        "dip/san-tau-da-lat.html": ["WebPage", "BreadcrumbList", "FAQPage"],
        "dip/sinh-nhat.html": ["WebPage", "BreadcrumbList", "Service", "FAQPage"],
        "dip/team-building.html": ["WebPage", "BreadcrumbList", "FAQPage"],
        "dip/cau-hon-hen-ho.html": ["WebPage", "BreadcrumbList", "FAQPage"]
    };
    const bad = [];
    for (const [p, want] of Object.entries(EXPECTED)) {
        const s = fs.readFileSync(path.join(ROOT, p), "utf8");
        const got = [];
        for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
            try {
                const t = JSON.parse(m[1])["@type"];
                got.push(Array.isArray(t) ? t.join(",") : t);
            } catch (e) { got.push("PARSE-ERR"); }
        }
        const missing = want.filter((t) => !got.includes(t));
        if (missing.length) bad.push(p + " thiếu " + missing.join(","));
    }
    add("Không trang nào mất schema (Restaurant/Menu/WebPage/Breadcrumb)",
        bad.length === 0,
        bad.length ? bad.join(" | ") : Object.keys(EXPECTED).length + " trang giữ đủ schema");
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

// ── R8b. Fan-out trên các trang tiền (menu / đường đi / 4 landing dịp) ───
{
    const PAGES = [
        "menu.html", "duong-di/index.html",
        "dip/san-tau-da-lat.html", "dip/sinh-nhat.html",
        "dip/team-building.html", "dip/cau-hon-hen-ho.html"
    ];
    const TOPICS = {
        "địa chỉ": /Huỳnh Tấn Phát/i,
        "khoảng cách": /\b7\s*km\b/i,
        "giờ mở": /15:00/,
        "giá": /95\.000/,
        "đỗ xe": /đỗ xe|đậu xe|bãi đỗ|bãi đậu/i,
        "mái che/mưa": /mái che|trời mưa/i,
        "thanh toán": /chuyển khoản/i,
        "đặt bàn": /đặt bàn/i
    };
    const bad = [];
    for (const p of PAGES) {
        const s = fs.readFileSync(path.join(ROOT, p), "utf8");
        const body = (s.split(/<body[^>]*>/)[1] || "")
            .replace(/<script[\s\S]*?<\/script>/g, "")
            .replace(/<style[\s\S]*?<\/style>/g, "");
        const missing = Object.entries(TOPICS).filter(([, re]) => !re.test(body)).map(([k]) => k);
        if (missing.length) bad.push(p + " thiếu " + missing.join(","));
    }
    add("Fan-out trên trang tiền (menu · đường đi · 4 landing dịp)",
        bad.length === 0,
        bad.length ? bad.join(" | ") : PAGES.length + " trang đủ " + Object.keys(TOPICS).length + " chủ đề");
}

// ── R8c. Fan-out trên các bài blog ĐANG INDEX (trang được crawl thật) ────
{
    const dir = path.join(ROOT, "blog");
    const indexed = fs.readdirSync(dir).filter((f) => f.endsWith(".html")).filter((f) => {
        const m = fs.readFileSync(path.join(dir, f), "utf8").match(/name="robots" content="([^"]+)"/);
        return m && !/noindex/i.test(m[1]);
    });
    // "95[.,]000" — bài tiếng Việt viết 95.000, bài tiếng Anh viết 95,000
    const TOPICS = {
        "giá": /95[.,]000/,
        "địa chỉ": /Huỳnh Tấn Phát/i,
        "giờ mở": /15:00/,
        "khoảng cách": /\b7\s*km\b/i,
        "đỗ xe": /đỗ xe|đậu xe|bãi đỗ|parking/i
    };
    const bad = [];
    for (const f of indexed) {
        const body = (fs.readFileSync(path.join(dir, f), "utf8").split(/<body[^>]*>/)[1] || "")
            .replace(/<script[\s\S]*?<\/script>/g, "")
            .replace(/<style[\s\S]*?<\/style>/g, "");
        const missing = Object.entries(TOPICS).filter(([, re]) => !re.test(body)).map(([k]) => k);
        if (missing.length) bad.push(f.replace(".html", "") + " thiếu " + missing.join(","));
    }
    add("Fan-out trên " + indexed.length + " bài blog đang index",
        bad.length === 0,
        bad.length ? bad.slice(0, 4).join(" | ") : indexed.length + " bài đủ " + Object.keys(TOPICS).length + " chủ đề");
}

// ── R8d. Citation nguồn uy tín trên bài pillar (Princeton GEO: cite +115%) ──
// Chỉ đếm link ra ngoài trong <article>, và chặn domain lạ — rải citation bừa
// là pattern spam Google nêu đích danh từ 05/2026.
{
    const ALLOWED = /^https:\/\/(vi|en)\.wikipedia\.org\//;
    const dir = path.join(ROOT, "blog");
    const indexed = fs.readdirSync(dir).filter((f) => f.endsWith(".html")).filter((f) => {
        const m = fs.readFileSync(path.join(dir, f), "utf8").match(/name="robots" content="([^"]+)"/);
        return m && !/noindex/i.test(m[1]);
    });

    let withCite = 0;
    const offDomain = [];
    for (const f of indexed) {
        const art = (fs.readFileSync(path.join(dir, f), "utf8").match(/<article[\s\S]*?<\/article>/) || [""])[0];
        const ext = [...art.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1])
            .filter((u) => !/tramdungchill\.vn|facebook|instagram|tiktok|youtube|threads|zalo|goo\.gl|google\.com/i.test(u));
        if (ext.length) withCite++;
        for (const u of ext) if (!ALLOWED.test(u)) offDomain.push(f.replace(".html", "") + " → " + u.slice(0, 50));
    }

    const ok = withCite >= 5 && offDomain.length === 0;
    add("Citation nguồn uy tín trên bài pillar (domain đã whitelist)", ok,
        offDomain.length ? "domain ngoài whitelist: " + offDomain.slice(0, 3).join(", ")
                         : withCite + "/" + indexed.length + " bài có citation Wikipedia");
}

// ── R8e. Số món quảng cáo không được vượt số món thật trong menu ─────────
// Site từng ghi "khoảng 100 món" ở 8 chỗ trong khi menu-data.js chỉ có 73 và
// trang menu cũng chỉ liệt kê 73 — nội dung không khớp thứ khách nhìn thấy.
{
    let real = 0;
    try {
        const vm = require("vm");
        const sb = {};
        vm.runInNewContext(
            fs.readFileSync(path.join(ROOT, "data/menu-data.js"), "utf8") +
            "\n;this.C = MENU_CATEGORIES; this.I = MENU_ITEMS;", sb);
        for (const c of sb.C) real += (sb.I[c.id] || []).length;
    } catch (e) { real = 0; }

    const offenders = [];
    if (real > 0) {
        for (const f of files) {
            const s = fs.readFileSync(f, "utf8");
            for (const m of s.matchAll(/(khoảng |hơn |gần |~|over |about )?([0-9]{2,3})\+? (?:món|dishes)\b/gi)) {
                const n = parseInt(m[2], 10);
                // chỉ soi các con số ở tầm "tổng menu" (>= 60); số nhỏ hơn thường là nhóm con
                if (n >= 60 && n > real) {
                    offenders.push(rel(f) + ": \"" + m[0].trim() + "\" > " + real);
                }
            }
        }
    }
    add("Số món quảng cáo ≤ số món thật trong menu-data.js",
        real > 0 && offenders.length === 0,
        real === 0 ? "không đọc được menu-data.js"
                   : (offenders.length ? offenders.slice(0, 3).join(" | ")
                                       : "menu thật " + real + " món, không chỗ nào thổi phồng"));
}

// ── R8e2. Không gán cho quán món KHÔNG có trong menu ─────────────────────
// Mục R8e chỉ chặn THỔI PHỒNG SỐ LƯỢNG, không đối chiếu TÊN MÓN — nên suốt một
// thời gian dài site ghi "lẩu nấm 85-120K/nồi", "bò Mỹ", "tôm sú", "set combo
// 600K" trong khi menu-data.js không có món nào như vậy và lẩu rẻ nhất là 300K.
// Nặng nhất: FAQ schema của index.html và menu.html (Google hiển thị thẳng trong
// kết quả tìm kiếm) liệt kê tôm sú, sò điệp, lẩu Thái, lẩu riêu cua, cá hồi.
// Dọn ngày 30/07/2026. Mục này chặn tái diễn.
//
// Cách kiểm: chỉ soi câu có nhắc "Trạm Dừng Chill" — bài nói về ẩm thực Đà Lạt
// nói chung được phép nhắc món quán không bán.
{
    // món hay bị bịa, đã đối chiếu là KHÔNG có trong menu-data.js
    const CAM = [
        "bò mỹ", "bò úc", "ribeye", "sirloin", "tôm sú", "mực ống", "mực lá",
        "sò điệp", "nghêu", "cá basa", "cá hồi", "lẩu nấm", "lẩu thái",
        "lẩu riêu cua", "lẩu kim chi", "gà nướng mật ong", "gà nướng sả",
        "nấm nướng", "đậu hũ nướng",
    ];
    const files = [];
    for (const d of ["blog", "dip"]) {
        const dir = path.join(ROOT, d);
        if (fs.existsSync(dir)) {
            for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".html"))) files.push(path.join(dir, f));
        }
    }
    for (const f of ["index.html", "menu.html"]) {
        const p = path.join(ROOT, f);
        if (fs.existsSync(p)) files.push(p);
    }

    // Soi 2 vùng riêng, KHÔNG soi cả <head>: các thẻ meta nằm sát nhau nên tách
    // câu qua chúng sẽ dính nhầm (tiêu đề bài "Cá Tầm, Cá Hồi Nướng" là nói về
    // cá Đà Lạt nói chung, không phải khai quán có món đó).
    const vungSoi = (html) => {
        const v = [];
        const than = html.match(/<article[\s\S]*?<\/article>/) || html.match(/<main[\s\S]*?<\/main>/);
        if (than) v.push(than[0].replace(/<script[\s\S]*?<\/script>/g, " "));
        // câu hỏi/đáp trong FAQPage schema — chỗ Google hiển thị thẳng ra SERP
        for (const m of html.matchAll(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
            if (!/FAQPage/.test(m[1])) continue;
            for (const t of m[1].matchAll(/"(?:name|text)"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) v.push(t[1]);
        }
        return v;
    };

    const bad = [];
    for (const f of files) {
        const html = fs.readFileSync(f, "utf8");
        for (const vung of vungSoi(html)) {
            const plain = vung.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
            for (const cau of plain.split(/(?<=[.!?])\s+/)) {
                if (!/Trạm Dừng Chill/i.test(cau)) continue;
                const low = cau.toLowerCase();
                for (const mon of CAM) {
                    if (low.includes(mon)) {
                        bad.push(rel(f) + ': "' + mon + '" — ' + cau.trim().slice(0, 60));
                        break;
                    }
                }
            }
        }
    }
    add("Không gán cho quán món không có trong menu",
        bad.length === 0,
        bad.length ? bad.slice(0, 3).join(" | ")
                   : files.length + " trang · không chỗ nào gán món lạ cho quán");
}

// ── R8f. Meta description không được khai giá món lẻ như "giá quán" ──────
// Bug thật đo được 19/06/2026: hỏi ChatGPT/Perplexity "giá bao nhiêu một người"
// thì AI trả lời "29.000đ" — vì og/twitter description của menu.html ghi
// "Giá từ 29.000đ" (giá đồ uống rẻ nhất). AI đọc thẳng meta tag làm giá quán,
// JSON-LD priceRange đúng cũng không thắng nổi.
{
    const PRICE_TAGS = /<meta[^>]*(?:name="(?:description|twitter:description)"|property="og:description")[^>]*content="([^"]*)"/gi;
    const offenders = [];
    for (const f of files) {
        const s = fs.readFileSync(f, "utf8");
        for (const m of s.matchAll(PRICE_TAGS)) {
            const c = m[1];
            if (!/[Gg]iá|price/i.test(c)) continue;
            // bắt "giá từ 29.000đ" / "từ 10K" — con số nhỏ đứng ở vai trò "giá quán"
            const low = c.match(/(?:giá\s+)?từ\s+([0-9]{1,3})(?:[.,]000)?\s*[KkĐđ]/i);
            if (low && parseInt(low[1], 10) < 95) {
                offenders.push(rel(f) + ': "' + low[0] + '"');
            }
        }
    }
    add("Meta description không khai giá món lẻ thành giá/người",
        offenders.length === 0,
        offenders.length ? offenders.slice(0, 3).join(" | ")
                         : "mọi meta mô tả dùng mức chi 95.000–300.000đ/người");
}

// ── R8g. KHÔNG được khai quán có lối vào cho xe lăn ──────────────────────
// Sếp Tuấn xác nhận 29/07/2026: quán có bậc thềm/dốc khó, xe lăn vào không
// tiện. Đây không phải chuyện điểm SEO — người dùng xe lăn lọc đúng tiêu chí
// đó rồi đi 7 km lên Trại Mát mới biết không vào được. Chốt chặn ở đây để
// không ai (kể cả AI viết bài) vô tình thêm vào schema hay nội dung.
{
    const CLAIMS = /wheelchair|xe lăn|người khuyết tật|accessible entrance|isAccessibleForFree/i;
    const offenders = [];
    for (const f of files) {
        const s = fs.readFileSync(f, "utf8");
        for (const m of s.matchAll(/[^\n<>]{0,60}(wheelchair[^\n<>]{0,40}|xe lăn[^\n<>]{0,40})/gi)) {
            // bỏ qua chính dòng chú thích trong tài liệu/script
            if (/KHÔNG|không tiện|bậc thềm|đừng/i.test(m[0])) continue;
            if (CLAIMS.test(m[0])) offenders.push(rel(f) + ': "' + m[0].trim().slice(0, 60) + '"');
        }
    }
    add("Không khai sai quán có lối vào cho xe lăn",
        offenders.length === 0,
        offenders.length ? offenders.slice(0, 3).join(" | ")
                         : "không trang nào khai thuộc tính tiếp cận sai");
}

// ── R8h. Mọi ảnh/video khai trong JSON-LD phải có file thật ──────────────
// Schema trỏ ảnh 404 thì Google bỏ qua cả khối, và với VideoObject thì mất
// luôn suất rich result. Lỗi này đã xảy ra thật: publisher.logo trỏ
// logo-gold.svg — file không tồn tại — được chép nguyên từ generator cũ sang
// khối VideoObject mới mà không ai kiểm.
{
    const missing = new Set();
    let checked = 0;
    for (const f of files) {
        const s = fs.readFileSync(f, "utf8");
        for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
            let j;
            try { j = JSON.parse(m[1]); } catch (e) { continue; }
            for (const mm of JSON.stringify(j).matchAll(
                /https:\/\/tramdungchill\.vn\/([\w\/.-]+\.(?:jpg|jpeg|png|webp|svg|mp4))/g)) {
                checked++;
                if (!fs.existsSync(path.join(ROOT, mm[1]))) missing.add(rel(f) + " → " + mm[1]);
            }
        }
    }
    add("Ảnh/video khai trong JSON-LD đều có file thật",
        missing.size === 0,
        missing.size ? [...missing].slice(0, 3).join(" | ")
                     : checked + " tham chiếu, không cái nào 404");
}

// ── R8i. Mọi class trong template bài viết phải có CSS thật ──────────────
// Lỗi đã xảy ra: template dùng .nav-links và .blog-post-body nhưng KHÔNG file
// CSS nào định nghĩa chúng, nên nav dính liền một cục và thân bài rơi về style
// mặc định trình duyệt. Lưới cũ soi schema/ngày/ngôn ngữ/ảnh 404 — không mục
// nào biết trang trông ra sao, phải có người mở mắt nhìn mới thấy.
{
    const tpl = path.join(ROOT, "templates/blog-post.html");
    if (!fs.existsSync(tpl)) {
        add("Class trong template bài viết đều có CSS", false, "không thấy templates/blog-post.html");
    } else {
        const t = fs.readFileSync(tpl, "utf8");
        const cssFiles = ["css/style.css"].map((f) => path.join(ROOT, f))
            .filter((f) => fs.existsSync(f))
            .map((f) => fs.readFileSync(f, "utf8")).join("\n");
        const inline = (t.match(/<style>[\s\S]*?<\/style>/g) || []).join("");
        const classes = [...new Set(
            [...t.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/))
        )].filter((c) => c && !/^\{\{/.test(c));

        const missing = classes.filter((c) => !cssFiles.includes("." + c) && !inline.includes("." + c));
        add("Class trong template bài viết đều có CSS",
            missing.length === 0,
            missing.length ? "thiếu: " + missing.slice(0, 5).map((c) => "." + c).join(", ")
                           : classes.length + " class đều có định nghĩa");
    }
}

// ── R8j. Mọi id mà JS gọi phải tồn tại trong HTML ────────────────────────
// Bug thật: sau khi nav dựng lại theo components/nav.html, id "navLinks" biến
// mất nhưng script vẫn getElementById("navLinks") → addEventListener trên null
// → nút hamburger lỗi, MENU DI ĐỘNG KHÔNG MỞ trên cả 143 bài. Lưới cũ đối chiếu
// class với CSS nhưng chưa từng kiểm id mà JS gọi.
{
    const PAGES = ["index.html", "menu.html", "blog.html", "blog/top-quan-nuong-da-lat.html",
        "dip/san-tau-da-lat.html", "duong-di/index.html"];
    const bad = [];
    for (const p of PAGES) {
        const abs = path.join(ROOT, p);
        if (!fs.existsSync(abs)) continue;
        const s = fs.readFileSync(abs, "utf8");
        const ids = new Set([...s.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
        // chỉ soi script inline trong chính trang (bundle ngoài dùng cho nhiều trang)
        for (const sc of s.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
            for (const m of sc[1].matchAll(/getElementById\(\s*["']([^"']+)["']\s*\)/g)) {
                if (!ids.has(m[1])) bad.push(p + " → #" + m[1]);
            }
        }
    }
    add("id mà script inline gọi đều tồn tại trong HTML",
        bad.length === 0,
        bad.length ? [...new Set(bad)].slice(0, 4).join(" | ")
                   : PAGES.length + " trang không có id chết");
}

// ── R8k. Link CSS phải kèm ?v= khớp vân tay file thật ────────────────────
// Không có ?v= thì trình duyệt giữ CSS cũ trong cache: sửa CSS xong người dùng
// vẫn thấy bản trước. Đã xảy ra thật — bảng giá trong bài blog có CSS đúng,
// markup đúng, mà màn hình vẫn hiện bản cũ. Vân tay phải KHỚP md5 của file,
// nếu lệch thì có nghĩa ai đó sửa CSS mà chưa chạy lại build.
{
    const cssFile = path.join(ROOT, "dist/style.min.css");
    if (!fs.existsSync(cssFile)) {
        add("Link CSS kèm vân tay khớp file thật", false, "chưa có dist/style.min.css");
    } else {
        const want = require("crypto").createHash("md5")
            .update(fs.readFileSync(cssFile)).digest("hex").slice(0, 8);
        const bad = [];
        let checked = 0;
        for (const f of files) {
            const s = fs.readFileSync(f, "utf8");
            for (const m of s.matchAll(/href="(?:\.\.\/)?dist\/style\.min\.css(\?v=([^"]*))?"/g)) {
                checked++;
                if (!m[2]) bad.push(rel(f) + ": thiếu ?v=");
                else if (m[2] !== want) bad.push(rel(f) + ": ?v=" + m[2] + " ≠ " + want);
            }
        }
        add("Link CSS kèm vân tay khớp file thật", bad.length === 0,
            bad.length ? [...new Set(bad)].slice(0, 3).join(" | ")
                       : checked + " link CSS đều mang vân tay " + want);
    }
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
    // Quét cả data/*.js: blog-seo.js là NGUỒN sinh ra bài blog, schema-data.js
    // nuôi JSON-LD. Bản trước chỉ quét .html nên hai file này vô hình → lọt số cũ.
    const dataJs = fs.readdirSync(path.join(ROOT, "data"))
        .filter((n) => n.endsWith(".js"))
        .map((n) => path.join(ROOT, "data", n));
    for (const f of files.concat(dataJs)) {
        const s = fs.readFileSync(f, "utf8");
        // Cho phép thẻ đóng và MỘT từ đệm chen giữa số và chữ "đánh giá"/"reviews"
        // — thực tế site viết "6,000 Google reviews", bản trước đòi chữ phải dính
        // ngay sau dấu cách nên trượt hết, dẫn tới BÁO PASS OAN.
        for (const m of s.matchAll(
            /([0-9][0-9.,]{2,6})\+?(?:<\/(?:strong|b|em|span)>)?\s+(?:lượt\s+)?(?:Google\s+)?(?:đánh giá|reviews?)\b/gi
        )) {
            const n = m[1].replace(/[.,]/g, "");
            shown[n] = (shown[n] || 0) + 1;
        }
        // schema-data.js khai kiểu rating:{count:'6816'} chứ không phải JSON-LD
        for (const m of s.matchAll(/rating\s*:\s*\{[^}]*count\s*:\s*['"]([0-9]+)['"]/g)) {
            schema[m[1]] = (schema[m[1]] || 0) + 1;
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

// ── R12 + R13. Ngày tháng và sitemap phải khớp thực tế ───────────────────
// Bối cảnh 29/07/2026: bài "ăn nướng Đà Lạt bao nhiêu tiền" mở cho Google đọc,
// được link từ blog.html và là đích canonical của 7 bài gộp — nhưng khai ngày
// đăng 29/12/2026 (tương lai 5 tháng) nên máy tạo bài âm thầm loại nó khỏi
// sitemap. Không ai biết cho tới khi soát tay. Hai phép kiểm dưới bịt lỗ đó.
{
    // Mảnh giao diện dùng chung và file xác minh của Google không phải "trang".
    const KHONG_PHAI_TRANG = (p) =>
        p.startsWith("components/") || p === "404.html" || /^google[0-9a-z]+\.html$/i.test(p);

    const smText = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
    const trongSitemap = new Set(
        (smText.match(/<loc>([^<]*)<\/loc>/g) || [])
            .map((m) => m.replace(/<\/?loc>/g, "").replace("https://tramdungchill.vn/", ""))
            .map((d) => (d === "" || d.endsWith("/") ? d + "index.html" : d))
    );

    const homNay = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date());

    const thieuKhai = [];   // cho Google đọc mà không khai trong sitemap
    const khaiThua = [];    // chặn Google mà vẫn khai trong sitemap
    const ngayXau = [];     // ngày đăng ở tương lai / sửa trước khi đăng

    for (const f of files) {
        const p = rel(f);
        if (KHONG_PHAI_TRANG(p)) continue;
        const s = fs.readFileSync(f, "utf8");
        const m = s.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
        const chanGoogle = !!(m && /noindex/i.test(m[1]));
        const coKhai = trongSitemap.has(p);

        if (!chanGoogle && !coKhai) thieuKhai.push(p);
        if (chanGoogle && coKhai) khaiThua.push(p);

        const dp = (s.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/) || ["", ""])[1];
        const dm = (s.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/) || ["", ""])[1];
        // Ngày đăng ở tương lai chỉ là lỗi khi trang ĐANG cho Google đọc. Bài
        // đang noindex nằm trong lịch đăng dần thì để yên — đó là chủ ý.
        if (!chanGoogle && dp && dp > homNay) ngayXau.push(p + " đăng " + dp + " (tương lai)");
        // Sửa trước khi đăng thì vô lý ở mọi trang, kể cả trang đang noindex.
        if (dp && dm && dm < dp) ngayXau.push(p + " sửa " + dm + " trước khi đăng " + dp);
    }

    const soTrang = files.filter((f) => !KHONG_PHAI_TRANG(rel(f))).length;

    add("Trang cho Google đọc ↔ sitemap khớp nhau",
        thieuKhai.length === 0 && khaiThua.length === 0,
        (thieuKhai.length || khaiThua.length)
            ? [thieuKhai.length ? "thiếu khai: " + thieuKhai.slice(0, 5).join(", ") : "",
               khaiThua.length ? "khai thừa (đang noindex): " + khaiThua.slice(0, 5).join(", ") : ""]
                .filter(Boolean).join(" · ")
            : soTrang + " trang · " + trongSitemap.size + " URL trong sitemap, không lệch");

    add("Ngày đăng / ngày sửa hợp lệ",
        ngayXau.length === 0,
        ngayXau.length ? ngayXau.slice(0, 5).join(" · ") : soTrang + " trang, không trang nào khai ngày ở tương lai hay sửa-trước-khi-đăng");
}

// ── R14. Mọi ảnh / logo phải trỏ tới file CÓ THẬT ────────────────────────
// Bối cảnh 29/07/2026: `assets/images/logo-gold.svg` được khai trong
// publisher.logo của schema trên 143 bài — mà file đó CHƯA BAO GIỜ tồn tại,
// gọi ra 404. Kèm 18 tên ảnh blog bịa, cũng chưa từng có. Không ai thấy vì
// ảnh hỏng nằm giữa bài và logo thì chỉ máy tìm kiếm đọc.
//
// Hai chỗ dễ BÁO OAN đã xử:
//  1. components/*.html là MẢNH ghép — link bên trong tính theo trang chủ nhà,
//     không phải theo thư mục components/.
//  2. srcset tách bằng dấu phẩy, mà `data:image/svg+xml,%3Csvg…` cũng có phẩy
//     → phải loại data: TRƯỚC khi tách.
{
    const MIEN = "https://tramdungchill.vn/";
    const thieu = [];

    const giai = (tuTrang, duongDan) => {
        let d = String(duongDan).split("#")[0].split("?")[0].trim();
        if (!d) return null;
        if (/^data:/i.test(d)) return null;
        if (d.startsWith(MIEN)) d = "/" + d.slice(MIEN.length);
        else if (/^(https?:|\/\/|mailto:|tel:|javascript:)/i.test(d)) return null;
        const goc = tuTrang.startsWith("components/") ? "/" : "/" + path.posix.dirname(tuTrang);
        const ra = d.startsWith("/") ? d : path.posix.normalize(path.posix.join(goc, d));
        return ra.replace(/^\//, "");
    };

    for (const f of files) {
        const tu = rel(f);
        const s = fs.readFileSync(f, "utf8");

        for (const m of s.matchAll(/<(?:img|source)\b[^>]*\b(?:src|srcset)=["']([^"']+)["']/gi)) {
            if (/^\s*data:/i.test(m[1])) continue;
            for (const phan of m[1].split(",")) {
                const d = giai(tu, phan.trim().split(/\s+/)[0]);
                if (d && !fs.existsSync(path.join(ROOT, d))) thieu.push(tu + " → " + d);
            }
        }
        // Ảnh/logo khai trong schema cũng phải tải được, không thì rich result hỏng.
        for (const m of s.matchAll(/"(?:logo|image|contentUrl|thumbnailUrl)"\s*:\s*"([^"]+)"/g)) {
            const d = giai(tu, m[1]);
            if (d && /^assets\//.test(d) && !fs.existsSync(path.join(ROOT, d))) thieu.push(tu + " → " + d);
        }
    }

    const rieng = [...new Set(thieu.map((x) => x.split(" → ")[1]))];
    add("Mọi ảnh / logo trỏ tới file có thật", thieu.length === 0,
        thieu.length
            ? rieng.length + " file thiếu (" + rieng.slice(0, 4).join(", ") + ") · " + thieu.length + " chỗ gọi"
            : files.length + " trang · không chỗ nào gọi ảnh không tồn tại");
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
