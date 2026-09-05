/**
 * toi-uu-tai-trang.js
 * Hai việc nhỏ nhưng ảnh hưởng trực tiếp tới tốc độ tải và tới việc người dùng
 * có thấy bản CSS mới hay không.
 *
 * 1) DNS-PREFETCH cho domain script bên thứ ba.
 *    Meta Pixel (connect.facebook.net), TikTok Pixel (analytics.tiktok.com) và
 *    Clarity (clarity.ms). Chỉ thêm cho domain TẢI SCRIPT, không thêm cho
 *    facebook.com hay instagram.com vì chúng chỉ là link.
 *
 *    Trước đây chỗ này dùng preconnect, và hồi đó là đúng: ba script ấy tải
 *    ngay lúc mở trang nên bắt tay sẵn TCP + TLS giúp tiết kiệm 100–300ms mỗi
 *    domain trên mạng di động.
 *
 *    Nhưng js/lazy-tracking.js đã hoãn cả ba tới khi khách chạm vào trang hoặc
 *    sau 3 giây. Preconnect vì thế quay ra hại: nó giành băng thông và socket
 *    ngay giây đầu — đúng lúc trình duyệt cần trọn đường truyền cho ảnh hero,
 *    tức phần tử LCP — rồi kết nối nằm không, thường bị đóng trước khi pixel
 *    kịp dùng. dns-prefetch giữ phần lợi thật (tra sẵn DNS) mà gần như miễn phí.
 *
 *    Nếu sau này bỏ hoãn pixel (gỡ data-tdc-lazy trong HTML) thì đổi ngược lại.
 *
 * 2) VÂN TAY CSS (?v=md5) cho các trang tĩnh.
 *    Trang bài blog đã có (generator lo), nhưng index/menu/blog/duong-di/dip thì
 *    chưa. Không có ?v= thì trình duyệt giữ CSS cũ trong cache — sửa CSS xong
 *    người dùng vẫn thấy bản trước. Đúng lỗi đã xảy ra thật với bảng giá trong
 *    bài blog: CSS đúng, markup đúng, mà màn hình vẫn hiện bản cũ.
 *
 * Chạy sau bundle-js.js (cần dist/style.min.css đã có để băm).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const SKIP_DIRS = /^(node_modules|\.git|dist|docs|plans|dev|templates|blog)$/;

// domain tải script bên thứ ba → đáng tra sẵn DNS
const SCRIPT_HOSTS = [
    { host: "connect.facebook.net", when: /connect\.facebook\.net/ },
    { host: "analytics.tiktok.com", when: /analytics\.tiktok\.com/ },
    { host: "www.clarity.ms", when: /clarity\.ms/ }
];

function allHtml(dir, acc) {
    acc = acc || [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (!SKIP_DIRS.test(e.name)) allHtml(p, acc);
        } else if (e.name.endsWith(".html")) acc.push(p);
    }
    return acc;
}

const cssPath = path.join(ROOT, "dist", "style.min.css");
if (!fs.existsSync(cssPath)) {
    console.error("Chưa có dist/style.min.css — chạy bundle-js.js trước.");
    process.exit(1);
}
// Van tay tinh RIENG cho tung bundle CSS. Dung chung mot ma thi sua
// dip-landing.css ma style.css khong doi se ra van tay y het — khach cu
// nap lai dung ban cu, dung kieu loi da tung giu anh menu cu truoc 07/08/2026.
const VERS = {};
for (const f of fs.readdirSync(path.join(ROOT, "dist"))) {
    if (!f.endsWith(".css")) continue;
    VERS[f] = crypto.createHash("md5")
        .update(fs.readFileSync(path.join(ROOT, "dist", f))).digest("hex").slice(0, 8);
}
const VER = VERS["style.min.css"];

let addedPre = 0, addedVer = 0, touched = 0;
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

for (const f of allHtml(ROOT)) {
    const before = fs.readFileSync(f, "utf8");
    let s = before;

    // ── 1. dns-prefetch (xem lý do đổi từ preconnect ở đầu file)
    // Dọn preconnect cũ do chính script này chèn ở các lần build trước.
    s = s.replace(
        new RegExp('[ \\t]*<link rel="preconnect" href="https://(?:' +
            SCRIPT_HOSTS.map((h) => h.host.replace(/\./g, "\\.")).join("|") +
            ')"[^>]*>\\r?\\n?', "g"),
        "");

    const missing = SCRIPT_HOSTS.filter((h) =>
        h.when.test(s) && !new RegExp('rel="dns-prefetch"[^>]*' + h.host.replace(/\./g, "\\.")).test(s));
    if (missing.length) {
        const tags = missing.map((h) =>
            '    <link rel="dns-prefetch" href="https://' + h.host + '">').join("\n");
        // chèn ngay sau dns-prefetch đã có, hoặc trước </head>
        if (/<link rel="dns-prefetch"[^>]*>/.test(s)) {
            s = s.replace(/(<link rel="dns-prefetch"[^>]*>)(?![\s\S]*<link rel="dns-prefetch")/,
                "$1\n" + tags.replace(/^\s+/, ""));
        } else {
            s = s.replace(/([ \t]*)<\/head>/, tags + "\n$1</head>");
        }
        addedPre += missing.length;
    }

    // ── 2. vân tay cho link CSS nội bộ chưa có ?v=
    s = s.replace(/href="((?:\.\.\/)?dist\/([a-z0-9.-]+\.min\.css))(\?v=[^"]*)?"/gi, (m, p1, ten) => {
        const v = VERS[ten];
        if (!v) return m;          // bundle chua sinh — de nguyen, dung lam hong link
        addedVer++;
        return 'href="' + p1 + "?v=" + v + '"';
    });

    if (s !== before) {
        fs.writeFileSync(f, s, "utf8");
        touched++;
        console.log("  ✓ " + rel(f));
    }
}

console.log("\nVân tay CSS: " + Object.keys(VERS).map((k) => k + "=" + VERS[k]).join(" · "));
console.log("  thêm " + addedPre + " thẻ preconnect · gắn ?v= cho " + addedVer + " link CSS");
console.log("  " + touched + " trang được cập nhật");
