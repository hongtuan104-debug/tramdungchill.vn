/**
 * fix-blog-heading-levels.js
 * Sửa nhảy cấp heading trong data/blog-data.js.
 *
 * Vì sao: template blog đặt tiêu đề bài ở <h1>, nhưng body bài dùng <h3> cho
 * mục chính nên chuỗi thành h1 → h3. Google (10/07/2026) nêu agentic AI đọc
 * trang qua DOM + accessibility tree; heading nhảy cấp làm hỏng cây mục lục,
 * và AI Overviews cần heading rõ để trích đúng đoạn.
 *
 * Quy tắc áp dụng cho từng bài, duyệt tuần tự:
 *   - <h3> KHÔNG bắt đầu bằng "N." / "N)"  → nâng thành <h2> (mục chính)
 *   - <h3> dạng "1. Tên quán"             → giữ <h3> NẾU đã có <h2> trước đó
 *                                            trong cùng bài; nếu chưa thì nâng h2
 *     (một mục con không thể đứng trước mọi mục cha)
 *
 * Chạy: node scripts/fix-blog-heading-levels.js [--dry]
 * Sau đó PHẢI chạy: node scripts/generate-blog-pages.js
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data/blog-data.js");
const DRY = process.argv.includes("--dry");

let src = fs.readFileSync(DATA, "utf8");

// Bắt từng khối `body: \`...\`` — body không chứa backtick lồng (đã kiểm chứng bên dưới)
const BODY_RE = /(\bbody:\s*`)([\s\S]*?)(`\s*[,}])/g;

let bodies = 0;
let promoted = 0;
let keptSub = 0;
const perArticle = [];

const out = src.replace(BODY_RE, (whole, open, body, close) => {
    bodies++;
    let seenH2 = false;
    let localPromoted = 0;
    let localKept = 0;

    const newBody = body.replace(/<h3>([\s\S]*?)<\/h3>/g, (m, inner) => {
        const text = inner.replace(/<[^>]+>/g, "").trim();
        const isNumbered = /^[0-9]+[.)]\s/.test(text);

        if (isNumbered && seenH2) {
            localKept++;
            return m; // mục con hợp lệ dưới một h2 đã có
        }
        seenH2 = true;
        localPromoted++;
        return "<h2>" + inner + "</h2>";
    });

    promoted += localPromoted;
    keptSub += localKept;
    perArticle.push({ promoted: localPromoted, kept: localKept });
    return open + newBody + close;
});

// ── Kiểm chứng trước khi ghi ────────────────────────────────────────────
const before = { h2: (src.match(/<h2>/g) || []).length, h3: (src.match(/<h3>/g) || []).length };
const after = { h2: (out.match(/<h2>/g) || []).length, h3: (out.match(/<h3>/g) || []).length };

console.log("Quét " + bodies + " body bài viết");
console.log("  <h3> → <h2> (mục chính) : " + promoted);
console.log("  giữ <h3> (mục con có cha): " + keptSub);
console.log("  h2: " + before.h2 + " → " + after.h2 + "   h3: " + before.h3 + " → " + after.h3);

if (before.h2 + before.h3 !== after.h2 + after.h3) {
    console.error("LỖI: tổng số heading thay đổi — dừng, không ghi file.");
    process.exit(1);
}
if (/<\/h2>/.test(out) && (out.match(/<h2>/g) || []).length !== (out.match(/<\/h2>/g) || []).length) {
    console.error("LỖI: thẻ h2 không cân bằng — dừng, không ghi file.");
    process.exit(1);
}
if ((out.match(/<h3>/g) || []).length !== (out.match(/<\/h3>/g) || []).length) {
    console.error("LỖI: thẻ h3 không cân bằng — dừng, không ghi file.");
    process.exit(1);
}

if (DRY) {
    console.log("\n(--dry: không ghi file)");
} else {
    fs.writeFileSync(DATA, out, "utf8");
    console.log("\nĐã ghi data/blog-data.js — nhớ chạy: node scripts/generate-blog-pages.js");
}
