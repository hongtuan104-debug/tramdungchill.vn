/***
 * tao-anh-chia-se.js
 * Cắt ảnh NGANG cho mạng xã hội (og:image 1200×630) và cho schema bài viết (16:9 · 4:3 · 1:1).
 *
 * VÌ SAO (15/09/2026, checklist #11 mục 82 — sếp Tuấn duyệt):
 *  - og:image của trang chủ / menu / blog / đường đi / tác giả là hero-sunset.jpg DỌC 1200×1802, mà
 *    index/menu/blog lại khai og:image:width=1200 height=630. Facebook/Zalo cắt giữa ảnh dọc → còn lại
 *    mảng trời, mất người và bàn nướng. 4 bài index cũng dùng ảnh dọc (900×1200, 1182×2560, 1200×1600).
 *  - Tài liệu Article của Google khuyến nghị khai ảnh bài ở 3 tỉ lệ 16:9, 4:3, 1:1 để Google chọn đúng
 *    khung cho từng chỗ hiện; trước đó mỗi bài chỉ khai 1 ảnh gốc.
 *
 * CÁCH DÙNG — chạy tay khi thay ảnh đại diện, thêm bài index hoặc đổi og:image. KHÔNG nằm trong build:
 *   1. Thêm ảnh nguồn vào bảng ANH ("og" = chỉ ảnh chia sẻ; "bai" = ảnh chia sẻ + 3 tỉ lệ cho schema)
 *   2. node scripts/tao-anh-chia-se.js
 *   3. MỞ ẢNH RA XEM trong assets/images/chia-se/ — không đặt `tam` thì sharp tự chọn chỗ cắt ("attention"),
 *      có ảnh sẽ cắt hụt đầu người hay món ăn. Chỉnh `tam: [x, y]` (0–1 trên ảnh gốc) rồi chạy lại.
 *   4. node scripts/generate-blog-pages.js   (bài blog tự nhận ảnh cắt khi file tồn tại)
 *   Trang tĩnh (index, menu, blog, đường đi, tác giả, 4 trang dịp) khai og:image VIẾT TAY — đổi thì sửa HTML.
 *   Cần sharp: npm install --save-dev sharp
 *
 * Ảnh ra: assets/images/chia-se/<tên>-og.jpg · <tên>-16x9.webp · <tên>-4x3.webp · <tên>-1x1.webp
 * Không phóng to quá ảnh gốc: nguồn hẹp hơn 1200px thì ảnh ra hẹp theo (bảng in cỡ thật).
 * og:image để JPG vì không phải bot mạng xã hội nào cũng đọc WebP; ảnh schema để WebP (Google đọc được).
 * Máy canh: R22 trong seo-geo-verify.js.
 */

"use strict";

const fs = require("fs");
const path = require("path");

// sharp nạp trong main(), KHÔNG nạp ở đầu file: generate-blog-pages.js require file này để lấy
// duongDanAnhCat, mà máy chạy generator (hay CI) có thể không cài sharp.
let sharp;

const ROOT = path.resolve(__dirname, "..");
const RA = path.join(ROOT, "assets", "images", "chia-se");

// tam: [x, y] = điểm giữ ở giữa khung cắt, tính theo tỉ lệ 0–1 trên ảnh gốc. Dùng chung cho mọi tỉ lệ,
// hoặc khai riêng: tam: { og: [x, y], "1x1": [x, y] }. Không khai = sharp tự chọn.
const ANH = [
    // Trang tĩnh — og:image viết tay trong HTML
    { goc: "assets/images/hero-sunset.jpg", khung: "og" },          // index · menu · blog · đường đi · tác giả
    { goc: "assets/images/gallery-2.jpg", khung: "og" },            // dip/team-building
    { goc: "assets/images/gallery-3.jpg", khung: "og" },            // (cũ) dip/sinh-nhat tới 23/09/2026 — ảnh có nến
    { goc: "assets/images/gallery-4.jpg", khung: "og" },            // (cũ) dip/cau-hon-hen-ho tới 22/09/2026
    { goc: "assets/images/blog/view-xe-lua-1.jpg", khung: "og" },   // (cũ) dip/san-tau-da-lat — giữ vì bài noindex dùng chung ảnh
    // 22/09/2026 — bộ ảnh Canon "Viết Báo": hero + ảnh chia sẻ mới của 3 trang dịp
    { goc: "assets/images/cap-doi-bien-cau-hon-da-lat.jpg", khung: "og", tam: { og: [0.5, 0] } },        // dip/cau-hon-hen-ho — giữ dòng chữ vàng trên vách
    { goc: "assets/images/quan-nuong-da-lat-dong-khach-ve-dem.jpg", khung: "og", tam: { og: [0.5, 0] } },         // dip/team-building — máy tự cắt mất chữ đèn
    { goc: "assets/images/tau-lua-da-lat-duoi-lan-can-quan.jpg", khung: "og" },    // dip/san-tau-da-lat
    { goc: "assets/images/ban-tiec-trang-tri-hoang-hon-da-lat.jpg", khung: "og", tam: { og: [0.5, 0] } },  // dip/sinh-nhat (23/09/2026) — máy tự cắt mất trời hoàng hôn
    // Ảnh đại diện 18 bài đang index (nuong-bbq-ngam-xe-lua và bản tiếng Anh dùng chung view-xe-lua-11b)
    // Tâm cắt khai tay dưới đây đều đã duyệt bằng mắt 15/09/2026 — bản máy tự chọn cắt hụt người / mất toa tàu.
    { goc: "assets/images/blog/view-xe-lua-11b.webp", khung: "bai", tam: { og: [0.5, 0.62], "16x9": [0.5, 0.62] } },   // toa tàu + bảng + bàn ăn
    { goc: "assets/images/blog/view-nha-long-4.webp", khung: "bai" },
    { goc: "assets/images/blog/mon-nuong-4.webp", khung: "bai" },
    { goc: "assets/images/blog/view-nha-long-1.webp", khung: "bai" },
    { goc: "assets/images/blog/view-hoang-hon-21.webp", khung: "bai" },
    { goc: "assets/images/blog/mon-nuong-2.webp", khung: "bai" },
    { goc: "assets/images/blog/view-nha-long-1-v2.webp", khung: "bai", tam: { "1x1": [0.6, 0.5] } },                 // khung vuông giữ trọn người
    { goc: "assets/images/blog/mon-nuong-1.webp", khung: "bai" },
    { goc: "assets/images/blog/view-nha-long-1-v3.webp", khung: "bai", tam: { og: [0.5, 0], "16x9": [0.5, 0] } },    // không cắt đỉnh đầu
    { goc: "assets/images/blog/view-hoang-hon-1-v2.webp", khung: "bai" },
    { goc: "assets/images/blog/view-nha-long-1-v4.webp", khung: "bai", tam: { og: [0.5, 0], "16x9": [0.5, 0], "1x1": [0.62, 0.5] } },
    { goc: "assets/images/blog/setup-sinh-nhat-3.webp", khung: "bai", tam: { "1x1": [0.6, 0.5] } },                 // khung vuông giữ trọn người
    { goc: "assets/images/blog/mon-nuong-4-v3.webp", khung: "bai" },
    { goc: "assets/images/blog/view-nha-long-4-v3.webp", khung: "bai" },
    // Ảnh dọc 1182×2560: nửa trên là trời đen + bóng đèn, người và toa tàu sáng đèn nằm ở phần dưới
    { goc: "assets/images/blog/view-nha-long-3-v4.webp", khung: "bai", tam: { og: [0.5, 0.74], "16x9": [0.5, 0.74], "4x3": [0.5, 0.78], "1x1": [0.5, 0.74] } },
    { goc: "assets/images/blog/view-xe-lua-20.webp", khung: "bai" },
    { goc: "assets/images/blog/mon-nuong-4-v7.webp", khung: "bai" },
    // 22/09/2026 — 6 bài index đổi ảnh đại diện sang bộ ảnh Canon "Viết Báo" (trước đó 4 bài dùng chung
    // tấm bàn tiệc bóng bay, dù bài nói về team building / cắm trại / khách nước ngoài / view nhà lồng)
    { goc: "assets/images/blog/nhom-ban-an-nuong-da-lat-buoi-toi.webp", khung: "bai" },        // team-building-da-lat
    { goc: "assets/images/blog/coi-xay-gio-cam-tu-cau-da-lat.webp", khung: "bai" },          // da-lat-mua-nao-dep-nhat
    { goc: "assets/images/blog/hoang-hon-nha-long-da-lat.webp", khung: "bai" },     // cam-trai-da-lat
    { goc: "assets/images/blog/cong-tre-tram-dung-chill-da-lat.webp", khung: "bai", tam: { "1x1": [0.45, 0.5] } },  // da-lat-cho-nguoi-nuoc-ngoai — vuông: giữ người + cổng
    { goc: "assets/images/blog/lau-hai-san-hoang-hon-da-lat.webp", khung: "bai" },          // lau-nuong-da-lat-mua-lanh
    { goc: "assets/images/blog/hai-san-view-nha-long-da-lat-ve-dem.webp", khung: "bai" },  // quan-nuong-da-lat-view-nha-long
];

const KHUNG = {
    og: { w: 1200, h: 630, duoi: "jpg" },
    "16x9": { w: 1200, h: 675, duoi: "webp" },
    "4x3": { w: 1200, h: 900, duoi: "webp" },
    "1x1": { w: 1200, h: 1200, duoi: "webp" },
};

/** Đường dẫn (tính từ gốc repo, dấu /) của ảnh cắt. generate-blog-pages.js và seo-geo-verify.js gọi lại hàm này. */
function duongDanAnhCat(goc, loai) {
    const ten = path.posix.basename(goc).replace(/[.][a-z]+$/i, "");
    return "assets/images/chia-se/" + ten + "-" + loai + "." + KHUNG[loai].duoi;
}

async function cat(goc, loai, tam) {
    const k = KHUNG[loai];
    const src = path.join(ROOT, goc);
    const m = await sharp(src).metadata();
    const tiLe = k.w / k.h;
    // Khung cắt lớn nhất đúng tỉ lệ nằm gọn trong ảnh gốc
    let cw = m.width, ch = Math.round(m.width / tiLe);
    if (ch > m.height) { ch = m.height; cw = Math.round(m.height * tiLe); }
    const w = Math.min(k.w, cw), h = Math.round(w / tiLe);
    let p = sharp(src);
    if (tam) {
        const left = Math.max(0, Math.min(m.width - cw, Math.round(tam[0] * m.width - cw / 2)));
        const top = Math.max(0, Math.min(m.height - ch, Math.round(tam[1] * m.height - ch / 2)));
        p = p.extract({ left: left, top: top, width: cw, height: ch }).resize(w, h);
    } else {
        p = p.resize(w, h, { fit: "cover", position: sharp.strategy.attention });
    }
    p = k.duoi === "jpg" ? p.jpeg({ quality: 82, mozjpeg: true }) : p.webp({ quality: 78, effort: 6 });
    const ra = path.join(ROOT, duongDanAnhCat(goc, loai));
    await p.toFile(ra);
    return { w: w, h: h, kb: fs.statSync(ra).size / 1024 };
}

async function main() {
    try {
        sharp = require("sharp");
    } catch (e) {
        console.error("Thiếu thư viện sharp. Chạy: npm install --save-dev sharp");
        process.exit(1);
    }
    fs.mkdirSync(RA, { recursive: true });
    for (const anh of ANH) {
        if (!fs.existsSync(path.join(ROOT, anh.goc))) {
            console.warn("  ⚠ Không thấy " + anh.goc + " — bỏ qua");
            continue;
        }
        const loais = anh.khung === "bai" ? ["og", "16x9", "4x3", "1x1"] : ["og"];
        const dong = [path.posix.basename(anh.goc).padEnd(28)];
        for (const loai of loais) {
            const tam = Array.isArray(anh.tam) ? anh.tam : (anh.tam && anh.tam[loai]);
            const r = await cat(anh.goc, loai, tam);
            dong.push(loai + " " + r.w + "x" + r.h + " " + r.kb.toFixed(0) + "KB" + (tam ? "*" : ""));
        }
        console.log("  " + dong.join("  "));
    }
    console.log("\n(* = tâm cắt khai tay) — nhớ mở ảnh ra xem trước khi commit.");
}

module.exports = { ANH: ANH, KHUNG: KHUNG, duongDanAnhCat: duongDanAnhCat };

if (require.main === module) {
    main().catch(function (e) {
        console.error(e);
        process.exit(1);
    });
}
