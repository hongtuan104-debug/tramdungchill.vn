/**
 * cap-nhat-sw.js — viết CACHE_NAME + STATIC_ASSETS vào sw.js.
 *
 * TẠI SAO PHẢI CÓ: từ 06/09/2026 các thẻ <script src> nội bộ mang ?v=<md5>
 * (scripts/toi-uu-tai-trang.js). Bộ xử lý fetch trong sw.js khớp URL CHÍNH XÁC
 * — caches.match(event.request) — nên nếu STATIC_ASSETS vẫn ghi '/dist/common.min.js'
 * trần trong khi trang thật gọi '/dist/common.min.js?v=ab12cd34' thì bản precache
 * không bao giờ được dùng: tải 46 KB về rồi vứt đi, và mất luôn khả năng mở
 * offline. Đúng bài học v9 đã dính một lần với style.min.css.
 *
 * TIỆN THỂ GIẢI LUÔN CHUYỆN BUMP TAY: CACHE_NAME nay là <tiền tố>-<hash nội dung>.
 * Tiền tố ('tdc-v13') vẫn đọc từ chính sw.js nên muốn bump thủ công cứ sửa như cũ;
 * phần hash tự đổi mỗi khi có file precache đổi nội dung. Chú thích v11 trong
 * sw.js ghi lại 3 commit đã quên bump — từ nay không quên được nữa.
 *
 * Chạy SAU toi-uu-tai-trang.js (cần dist/ đã bundle xong để băm).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { bamFile } = require("./van-tay");

const ROOT = path.resolve(__dirname, "..");
const SW = path.join(ROOT, "sw.js");

// Danh sách precache — nguồn chuẩn, sửa ở ĐÂY chứ không sửa trong sw.js.
// Đây đúng phần làm nên "vỏ offline" sau một lượt ghé (bài học v10/v11):
// HTML dự phòng + JS dùng chung + 3 file data nav/footer/schema cần để dựng trang.
// style.min.css KHÔNG nằm đây: trang nạp nó kèm ?v= riêng theo từng bundle CSS,
// còn bộ xử lý fetch vẫn cache lại lúc khách tải thật, nên precache chỉ tổ phí.
const TAI_SAN = [
    "/index.html",                  // HTML: network-first, không gắn vân tay
    "/dist/common.min.js",
    "/dist/index.min.js",
    "/data/site-config.js",
    "/data/translations.js",
    "/data/schema-data.js",
    "/manifest.json",
    "/assets/images/favicon.svg"
];

// Chỉ .js và .css mới gắn ?v=. HTML phải giữ URL trần (network-first, và
// caches.match('/index.html') ở nhánh dự phòng offline tìm đúng chuỗi này).
const CO_VAN_TAY = /\.(?:js|css)$/;

function chay() {
    if (!fs.existsSync(SW)) {
        console.error("  Không thấy sw.js — bỏ qua.");
        return;
    }
    const truoc = fs.readFileSync(SW, "utf8");

    const thieu = [];
    const dong = [];
    const deBam = [];
    for (const u of TAI_SAN) {
        const thuc = path.join(ROOT, u.replace(/^\//, "").split("?")[0]);
        if (!fs.existsSync(thuc)) { thieu.push(u); continue; }
        deBam.push(thuc);
        let url = u;
        if (CO_VAN_TAY.test(u)) {
            const v = bamFile(thuc);
            if (v) url = u + "?v=" + v;
        }
        dong.push("    '" + url + "'");
    }
    if (thieu.length) {
        // Không đưa vào precache thứ không tồn tại: cache.addAll() là all-or-nothing,
        // một URL 404 làm hỏng TOÀN BỘ bước install, service worker coi như chết.
        console.error("  ⚠ Bỏ qua (không thấy file): " + thieu.join(", "));
    }

    // Tiền tố giữ nguyên từ sw.js hiện tại → bump thủ công vẫn dùng được như cũ.
    const tienTo = (truoc.match(/const CACHE_NAME = '([a-z0-9-]*?tdc-v\d+)/) || [, "tdc-v13"])[1];
    const hash = crypto.createHash("md5")
        .update(deBam.map((p) => fs.readFileSync(p)).join(""))
        .digest("hex").slice(0, 8);
    const cacheName = tienTo + "-" + hash;

    const khoi =
        "/* SW-ASSETS:START — sinh bởi scripts/cap-nhat-sw.js, ĐỪNG sửa tay.\n" +
        "   Sửa danh sách precache trong chính script đó rồi chạy node scripts/bundle-js.js.\n" +
        "   URL kèm ?v= là BẮT BUỘC: bộ xử lý fetch bên dưới khớp URL chính xác, ghi\n" +
        "   URL trần trong khi trang gọi URL có vân tay = precache không bao giờ dùng được. */\n" +
        "const CACHE_NAME = '" + cacheName + "';\n" +
        "const STATIC_ASSETS = [\n" + dong.join(",\n") + "\n];\n" +
        "/* SW-ASSETS:END */";

    let sau;
    if (/\/\* SW-ASSETS:START[\s\S]*?\/\* SW-ASSETS:END \*\//.test(truoc)) {
        sau = truoc.replace(/\/\* SW-ASSETS:START[\s\S]*?\/\* SW-ASSETS:END \*\//, khoi);
    } else {
        // Lần đầu: thay đúng cặp khai báo cũ.
        const cu = /const CACHE_NAME = '[^']*';\s*\nconst STATIC_ASSETS = \[[\s\S]*?\n\];/;
        if (!cu.test(truoc)) {
            console.error("  Không tìm thấy khối CACHE_NAME/STATIC_ASSETS trong sw.js — bỏ qua.");
            return;
        }
        sau = truoc.replace(cu, khoi);
    }

    if (sau === truoc) {
        console.log("  sw.js đã đúng (" + cacheName + ")");
        return;
    }
    fs.writeFileSync(SW, sau, "utf8");
    console.log("  ✓ sw.js — " + cacheName + " · " + dong.length + " tài sản precache");
}

if (require.main === module) chay();
module.exports = { chay };
