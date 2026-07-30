/**
 * toi-uu-tai-trang.js
 * Hai việc nhỏ nhưng ảnh hưởng trực tiếp tới tốc độ tải và tới việc người dùng
 * có thấy bản CSS mới hay không.
 *
 * 1) PRECONNECT cho domain script bên thứ ba chạy NGAY lúc tải trang.
 *    Meta Pixel (connect.facebook.net), TikTok Pixel (analytics.tiktok.com) và
 *    Clarity (clarity.ms) đều tải script ngay. Thiếu preconnect thì mỗi domain
 *    phải làm lại DNS → TCP → TLS từ đầu, trên mạng di động mất cỡ 100–300ms
 *    mỗi cái. Chỉ thêm cho domain TẢI SCRIPT, không thêm cho facebook.com hay
 *    instagram.com vì chúng chỉ là link, preconnect vào đó là mở kết nối vô ích.
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

// domain TẢI SCRIPT ngay lúc load → đáng preconnect
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
const VER = crypto.createHash("md5").update(fs.readFileSync(cssPath)).digest("hex").slice(0, 8);

let addedPre = 0, addedVer = 0, touched = 0;
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

for (const f of allHtml(ROOT)) {
    const before = fs.readFileSync(f, "utf8");
    let s = before;

    // ── 1. preconnect
    const missing = SCRIPT_HOSTS.filter((h) =>
        h.when.test(s) && !new RegExp('rel="preconnect"[^>]*' + h.host.replace(/\./g, "\\.")).test(s));
    if (missing.length) {
        const tags = missing.map((h) =>
            '    <link rel="preconnect" href="https://' + h.host + '" crossorigin>').join("\n");
        // chèn ngay sau preconnect đã có, hoặc trước </head>
        if (/<link rel="preconnect"[^>]*>/.test(s)) {
            s = s.replace(/(<link rel="preconnect"[^>]*>)(?![\s\S]*<link rel="preconnect")/,
                "$1\n" + tags.replace(/^\s+/, ""));
        } else {
            s = s.replace(/([ \t]*)<\/head>/, tags + "\n$1</head>");
        }
        addedPre += missing.length;
    }

    // ── 2. vân tay cho link CSS nội bộ chưa có ?v=
    s = s.replace(/href="((?:\.\.\/)?dist\/style\.min\.css)(\?v=[^"]*)?"/g, (m, p1) => {
        addedVer++;
        return 'href="' + p1 + "?v=" + VER + '"';
    });

    if (s !== before) {
        fs.writeFileSync(f, s, "utf8");
        touched++;
        console.log("  ✓ " + rel(f));
    }
}

console.log("\nVân tay CSS: " + VER);
console.log("  thêm " + addedPre + " thẻ preconnect · gắn ?v= cho " + addedVer + " link CSS");
console.log("  " + touched + " trang được cập nhật");
