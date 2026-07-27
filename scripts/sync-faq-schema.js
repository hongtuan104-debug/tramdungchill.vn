/**
 * sync-faq-schema.js
 * Sinh khối FAQPage JSON-LD TỪ section #faq hiển thị trên mỗi trang.
 *
 * Vì sao: Google (10/07/2026) grounding AI Overviews / AI Mode lấy nội dung từ
 * TRANG, không lấy riêng từ schema; và structured data bắt buộc phải khớp nội
 * dung nhìn thấy được. Sinh schema từ chính DOM là cách duy nhất đảm bảo hai
 * bên không bao giờ lệch nhau.
 *
 * Cách dùng: sửa nội dung trong <section id="faq"> của trang, rồi chạy
 *   node scripts/sync-faq-schema.js
 * ĐỪNG sửa tay khối JSON-LD FAQPage — nó sẽ bị ghi đè.
 *
 * Trang nào không có section #faq thì bỏ qua.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://tramdungchill.vn";

// trang → URL công khai (dùng cho @id)
const PAGES = [
    { file: "index.html", url: SITE + "/" },
    { file: "menu.html", url: SITE + "/menu.html" },
    { file: "duong-di/index.html", url: SITE + "/duong-di/" },
    { file: "dip/san-tau-da-lat.html", url: SITE + "/dip/san-tau-da-lat.html" },
    { file: "dip/sinh-nhat.html", url: SITE + "/dip/sinh-nhat.html" },
    { file: "dip/team-building.html", url: SITE + "/dip/team-building.html" },
    { file: "dip/cau-hon-hen-ho.html", url: SITE + "/dip/cau-hon-hen-ho.html" }
];

const strip = (s) => s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const indent = (s, pad) => s.split("\n").map((l) => pad + l).join("\n");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Marker để nhận diện khối do script này sinh, ghi đè đúng chỗ ở lần chạy sau.
const START = "<!-- FAQ_JSONLD:START (sinh bởi scripts/sync-faq-schema.js — đừng sửa tay) -->";
const END = "<!-- FAQ_JSONLD:END -->";

let totalPages = 0;
let totalQ = 0;
const report = [];

for (const page of PAGES) {
    const abs = path.join(ROOT, page.file);
    if (!fs.existsSync(abs)) { report.push("  ⚠ không có file: " + page.file); continue; }

    let html = fs.readFileSync(abs, "utf8");

    const section = html.match(/<section[^>]*id="faq"[^>]*>[\s\S]*?<\/section>/);
    if (!section) { report.push("  –  bỏ qua (chưa có section #faq): " + page.file); continue; }

    const pairs = [];
    const re = /<summary>\s*<h3[^>]*>([\s\S]*?)<\/h3>\s*<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>/g;
    let m;
    while ((m = re.exec(section[0])) !== null) {
        pairs.push({ q: strip(m[1]), a: strip(m[2]) });
    }
    if (pairs.length === 0) { report.push("  ⚠ có #faq nhưng không trích được câu nào: " + page.file); continue; }

    const json = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": page.url + "#faq",
        inLanguage: "vi",
        mainEntity: pairs.map((p) => ({
            "@type": "Question",
            name: p.q,
            acceptedAnswer: { "@type": "Answer", text: p.a }
        }))
    };

    const block = START + "\n" +
        '<script type="application/ld+json">\n' +
        JSON.stringify(json, null, 4) + "\n" +
        "</script>\n" +
        END;

    const markerRe = new RegExp(esc(START) + "[\\s\\S]*?" + esc(END));

    if (markerRe.test(html)) {
        html = html.replace(markerRe, block);
    } else {
        // Lần đầu trên trang này: gỡ khối FAQPage viết tay (kèm comment mô tả nếu có)
        // rồi chèn khối sinh tự động vào cuối <head>.
        //
        // QUAN TRỌNG — "(?:(?!<\/script>)[\s\S])*?" là tempered dot: nó không cho
        // phép vượt qua thẻ </script>. Nếu dùng [\s\S]*? trần, regex sẽ khớp từ
        // khối JSON-LD ĐẦU TIÊN của trang cho tới chữ "FAQPage" ở khối cuối, nuốt
        // sạch Restaurant/Menu/WebPage/BreadcrumbList nằm giữa.
        const TEMPERED = "(?:(?!<\\/script>)[\\s\\S])*?";
        const handWritten = new RegExp(
            "[ \\t]*(?:<!--[^\\n]*FAQ[^\\n]*-->[ \\t]*\\n)?" +
            "[ \\t]*<script type=\"application/ld\\+json\">" + TEMPERED +
            "\"@type\"\\s*:\\s*\"FAQPage\"" + TEMPERED + "</script>[ \\t]*\\n?",
            "g"
        );

        const removed = (html.match(handWritten) || []).length;
        html = html.replace(handWritten, "");

        // Chốt an toàn: chỉ được mất đúng số khối FAQPage, không mất khối nào khác.
        const countTypes = (s) => {
            const out = [];
            for (const mm of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
                try { out.push(JSON.parse(mm[1])["@type"]); } catch (e) { out.push("ERR"); }
            }
            return out;
        };
        const wasTypes = countTypes(fs.readFileSync(abs, "utf8"));
        const nowTypes = countTypes(html);
        const expected = wasTypes.filter((t) => t !== "FAQPage").length;
        if (nowTypes.length !== expected) {
            console.error("  ✗ DỪNG — gỡ nhầm schema ở " + page.file +
                ": trước " + JSON.stringify(wasTypes) + " → sau " + JSON.stringify(nowTypes));
            process.exitCode = 1;
            continue;
        }
        if (removed === 0) report.push("     (chưa có FAQPage cũ — chỉ thêm mới)");

        html = html.replace(/([ \t]*)<\/head>/, indent(block, "    ") + "\n$1</head>");
    }

    fs.writeFileSync(abs, html, "utf8");
    totalPages++;
    totalQ += pairs.length;
    report.push("  ✓  " + page.file.padEnd(28) + pairs.length + " câu");
}

console.log("Đồng bộ FAQPage schema từ DOM hiển thị:");
report.forEach((r) => console.log(r));
console.log("\n" + totalPages + " trang · " + totalQ + " câu hỏi — schema khớp 1:1 với text trên trang.");
