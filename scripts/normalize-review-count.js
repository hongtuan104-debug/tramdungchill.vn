/**
 * normalize-review-count.js
 * Chuẩn hoá số lượt đánh giá Google trên TOÀN SITE về một con số duy nhất.
 *
 * Vì sao cần: Google yêu cầu structured data phải khớp nội dung nhìn thấy được.
 * Site đang có 2 con số song song (≈6.000 ở blog cũ, 6.500 ở trang chủ + schema),
 * nên aggregateRating không khớp text — đúng loại mismatch bị coi là spammy
 * structured data.
 *
 * Chạy:  node scripts/normalize-review-count.js [số]
 * Mặc định 6500 (con số trang chủ + schema đang khai).
 * Khi số review Google thật đổi, chạy lại với số mới — ví dụ:
 *        node scripts/normalize-review-count.js 7200
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
// Bỏ qua scripts/ — nếu không, script sẽ sửa chính comment của mình.
const SKIP_DIRS = /^(node_modules|\.git|dist|docs|plans|dev|scripts)$/;

const TARGET = parseInt(process.argv[2] || "6500", 10);
if (!Number.isFinite(TARGET) || TARGET < 100) {
    console.error("Số không hợp lệ: " + process.argv[2]);
    process.exit(1);
}

// 6500 → "6.500" (kiểu VN) và "6,500" (kiểu EN)
const vn = TARGET.toLocaleString("vi-VN");
const en = TARGET.toLocaleString("en-US");

function allFiles(dir, acc) {
    acc = acc || [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (!SKIP_DIRS.test(e.name)) allFiles(p, acc);
        } else if (/\.(html|js)$/.test(e.name)) {
            acc.push(p);
        }
    }
    return acc;
}

let filesChanged = 0;
let hits = 0;

for (const f of allFiles(ROOT)) {
    const before = fs.readFileSync(f, "utf8");
    let s = before;

    // 1. Text tiếng Việt. CHỈ thay con số và hạ "gần/khoảng" thành "hơn" khi từ đó
    //    nằm ngay trước số. KHÔNG tự chèn thêm từ định lượng — nhiều chỗ trong site
    //    viết "Hơn <em>6.500 lượt đánh giá</em>", chèn thêm sẽ thành "Hơn hơn".
    s = s.replace(
        /(gần |hơn |khoảng )?([0-9][0-9.]{2,6})\+? (lượt )?đánh giá/gi,
        (m, pre, _num, luot) => {
            hits++;
            const keep = pre ? (/gần|khoảng/i.test(pre) ? "hơn " : pre) : "";
            return keep + vn + " " + (luot || "") + "đánh giá";
        }
    );

    // 2. Text tiếng Anh — cùng nguyên tắc.
    s = s.replace(
        /(nearly |over |about |almost )?([0-9][0-9,]{2,6})\+? reviews/gi,
        (m, pre) => {
            hits++;
            const keep = pre ? (/nearly|about|almost/i.test(pre) ? "over " : pre) : "";
            return keep + en + " reviews";
        }
    );

    // 3. Schema aggregateRating
    s = s.replace(
        /("reviewCount"\s*:\s*)"?[0-9]+"?/g,
        (m, key) => { hits++; return key + '"' + TARGET + '"'; }
    );

    if (s !== before) {
        fs.writeFileSync(f, s, "utf8");
        filesChanged++;
    }
}

console.log("Chuẩn hoá số đánh giá về " + vn + " (schema: " + TARGET + ")");
console.log("  " + hits + " chỗ sửa trong " + filesChanged + " file.");
console.log("\n⚠ Nhớ đối chiếu với số thật trên Google Business Profile.");
console.log("  Số trên website phải khớp GBP — chạy lại script với số đúng nếu lệch.");
