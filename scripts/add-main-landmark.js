/**
 * add-main-landmark.js
 * Bọc nội dung chính của từng trang trong <main> — landmark bắt buộc của
 * accessibility tree. Google (10/07/2026) nêu rõ agentic AI đọc trang qua
 * screenshot + DOM + accessibility tree, nên thiếu <main> là mất tín hiệu
 * "đâu là nội dung, đâu là điều hướng".
 *
 * Idempotent: chạy lại trên file đã có <main> thì bỏ qua.
 * Chạy: node scripts/add-main-landmark.js
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// Mỗi trang: chèn <main> NGAY SAU dòng khớp `after`, và </main> NGAY TRƯỚC dòng khớp `before`.
const TARGETS = [
    // menu.html: <noscript> ở <head> viết inline một dòng nên không khớp regex này;
    // lần khớp đầu tiên chính là noscript của nav.
    { file: "menu.html", after: /^\s*<\/noscript>\s*$/, afterNth: 1, before: /^\s*<!-- Footer -->\s*$/ },
    { file: "blog.html", after: /^\s*<div id="nav-placeholder"><\/div>\s*$/, afterNth: 1, before: /^\s*<!-- Footer -->\s*$/ },
    { file: "dip/san-tau-da-lat.html", after: /^\s*<\/nav>\s*$/, afterNth: 1, before: /^\s*<footer class="dip-footer">/ },
    { file: "dip/sinh-nhat.html", after: /^\s*<\/nav>\s*$/, afterNth: 1, before: /^\s*<footer class="dip-footer">/ },
    { file: "dip/team-building.html", after: /^\s*<\/nav>\s*$/, afterNth: 1, before: /^\s*<footer class="dip-footer">/ },
    { file: "dip/cau-hon-hen-ho.html", after: /^\s*<\/nav>\s*$/, afterNth: 1, before: /^\s*<footer class="dip-footer">/ }
];

let changed = 0;
let skipped = 0;

for (const t of TARGETS) {
    const abs = path.join(ROOT, t.file);
    const src = fs.readFileSync(abs, "utf8");

    if (/<main[\s>]/.test(src)) {
        console.log("  bỏ qua (đã có <main>)  " + t.file);
        skipped++;
        continue;
    }

    const lines = src.split("\n");

    // Tìm dòng mở: lần khớp thứ afterNth của `after`
    let openAt = -1;
    let hit = 0;
    for (let i = 0; i < lines.length; i++) {
        if (t.after.test(lines[i])) {
            hit++;
            if (hit === t.afterNth) { openAt = i; break; }
        }
    }

    // Tìm dòng đóng: khớp `before` đầu tiên NẰM SAU openAt
    let closeAt = -1;
    for (let i = openAt + 1; i < lines.length; i++) {
        if (t.before.test(lines[i])) { closeAt = i; break; }
    }

    if (openAt === -1 || closeAt === -1) {
        console.error("  LỖI: không định vị được mốc chèn — " + t.file +
            " (openAt=" + openAt + ", closeAt=" + closeAt + ")");
        process.exitCode = 1;
        continue;
    }

    lines.splice(closeAt, 0, "    </main>", "");
    lines.splice(openAt + 1, 0, "", '    <main id="main-content">');

    fs.writeFileSync(abs, lines.join("\n"), "utf8");
    console.log("  ✓ " + t.file + "  (<main> dòng " + (openAt + 2) + ", </main> dòng " + (closeAt + 3) + ")");
    changed++;
}

console.log("\nXong: " + changed + " trang được bọc <main>, " + skipped + " bỏ qua.");
