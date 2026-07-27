/**
 * Đồng bộ FAQPage JSON-LD trong index.html cho khớp 1:1 với section #faq hiển thị.
 * Nguồn chân lý = text trong DOM. Script này đọc trực tiếp các cặp <h3>/<p>
 * trong section #faq rồi sinh lại schema, nên hai bên không thể lệch nhau.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const FILE = path.resolve("e:/tramdungchill.vn/tramdungchill.vn-main/index.html");
let html = fs.readFileSync(FILE, "utf8");

// ── 1. Trích các cặp Q/A từ DOM hiển thị ────────────────────────
const faqSection = html.match(/<section class="faq-section" id="faq">[\s\S]*?<\/section>/);
if (!faqSection) throw new Error("Không tìm thấy section #faq");

const pairs = [];
const re = /<summary><h3[^>]*>([\s\S]*?)<\/h3><\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>/g;
let m;
while ((m = re.exec(faqSection[0])) !== null) {
    const strip = (s) => s
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim();
    pairs.push({ q: strip(m[1]), a: strip(m[2]) });
}
if (pairs.length === 0) throw new Error("Không trích được cặp Q/A nào");

// ── 2. Sinh lại block FAQPage ───────────────────────────────────
const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": "https://tramdungchill.vn/#faq",
    "isPartOf": { "@id": "https://tramdungchill.vn/#webpage" },
    "inLanguage": "vi",
    mainEntity: pairs.map((p) => ({
        "@type": "Question",
        name: p.q,
        acceptedAnswer: { "@type": "Answer", text: p.a }
    }))
};

const indent = (s, pad) => s.split("\n").map((l) => pad + l).join("\n");
const newBlock =
    '    <!-- Schema.org JSON-LD: FAQPage — sinh tự động từ section #faq bởi\n' +
    '         scripts/sync-faq-schema.js. Mỗi câu ở đây ĐỀU có text hiển thị trên trang.\n' +
    '         Sửa nội dung ở section #faq rồi chạy lại script, đừng sửa tay khối này. -->\n' +
    '    <script type="application/ld+json">\n' +
    indent(JSON.stringify(faqJson, null, 4), "    ") + "\n" +
    "    </script>";

// ── 3. Thay thế block cũ ────────────────────────────────────────
const oldBlockRe = /[ \t]*<!-- Schema\.org JSON-LD: FAQPage -->\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/;
if (!oldBlockRe.test(html)) throw new Error("Không tìm thấy block FAQPage cũ");
html = html.replace(oldBlockRe, newBlock);

fs.writeFileSync(FILE, html, "utf8");
console.log("Đã đồng bộ FAQPage schema: " + pairs.length + " câu hỏi.");
pairs.forEach((p, i) => console.log("  " + (i + 1) + ". " + p.q));
