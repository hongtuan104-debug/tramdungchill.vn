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
    // 23/09/2026 — sếp Tuấn bảo thay TOÀN BỘ ảnh cũ bằng bộ ảnh Canon "Viết Báo" (Drive, gửi 22/09). Bảng chỉ còn
    // ảnh đang dùng, MỖI ẢNH MỘT DÒNG: tên ảnh cắt lấy theo tên file (duongDanAnhCat), hai dòng cùng tên là ghi đè nhau.
    // khung "bai" = og + 16:9 + 4:3 + 1:1 (ảnh đại diện bài index) · khung "og" = chỉ 1200x630 (trang tĩnh).
    // Ảnh cắt cũ (hero-sunset, gallery-N, view-*, mon-nuong-*…) vẫn để trên đĩa, không trang nào gọi nữa.
    { goc: "assets/images/cap-doi-bien-cau-hon-da-lat.jpg", khung: "og", tam: { og: [0.5, 0] } },          // dip/cau-hon-hen-ho — giữ dòng chữ vàng trên vách
    { goc: "assets/images/quan-nuong-da-lat-dong-khach-ve-dem.jpg", khung: "bai", tam: { og: [0.5, 0] } }, // dip/team-building + bài quan-an-gia-dinh-da-lat — máy tự cắt mất chữ đèn
    { goc: "assets/images/tau-lua-da-lat-duoi-lan-can-quan.jpg", khung: "bai" },                         // dip/san-tau-da-lat + nuong-bbq-ngam-xe-lua (+ bản EN)
    { goc: "assets/images/ban-tiec-trang-tri-hoang-hon-da-lat.jpg", khung: "bai", tam: { og: [0.5, 0] } }, // dip/sinh-nhat + setup-sinh-nhat-mien-phi-da-lat — giữ trời hoàng hôn
    { goc: "assets/images/blog/hoang-hon-nha-long-da-lat.webp", khung: "bai" },                          // cam-trai-da-lat + og 5 trang tĩnh (index · menu · blog · đường đi · tác giả)
    { goc: "assets/images/blog/nhom-ban-an-nuong-da-lat-buoi-toi.webp", khung: "bai" },                  // team-building-da-lat
    { goc: "assets/images/blog/coi-xay-gio-cam-tu-cau-da-lat.webp", khung: "bai" },                      // da-lat-mua-nao-dep-nhat
    { goc: "assets/images/blog/cong-tre-tram-dung-chill-da-lat.webp", khung: "bai", tam: { "1x1": [0.45, 0.5] } }, // da-lat-cho-nguoi-nuoc-ngoai — vuông: giữ người + cổng
    { goc: "assets/images/blog/lau-hai-san-hoang-hon-da-lat.webp", khung: "bai" },                       // lau-nuong-da-lat-mua-lanh
    { goc: "assets/images/blog/hai-san-view-nha-long-da-lat-ve-dem.webp", khung: "bai" },                // quan-nuong-da-lat-view-nha-long
    { goc: "assets/images/blog/cap-doi-ngam-hoang-hon-nha-long-da-lat.webp", khung: "bai" },             // hen-ho-da-lat
    { goc: "assets/images/blog/co-gai-vay-trang-vuon-cam-tu-cau-da-lat.webp", khung: "bai" },            // dac-san-da-lat-mua-ve
    { goc: "assets/images/blog/cong-tron-nha-long-ban-ngay-da-lat.webp", khung: "bai" },                 // lich-trinh-da-lat-3-ngay-2-dem
    { goc: "assets/images/blog/cap-doi-ban-lau-nuong-da-lat.webp", khung: "bai", tam: { "1x1": [0.53, 0.5] } }, // mon-nuong-ngon-nhat-da-lat — vuông: giữ cả hai người
    { goc: "assets/images/blog/tau-lua-da-lat-sang-den-ve-dem.webp", khung: "bai" },                     // da-lat-ve-dem-di-dau
    { goc: "assets/images/blog/cong-tron-hoang-hon-da-lat.webp", khung: "bai" },                         // an-vat-da-lat-buoi-toi
    // Bản BLOG (ngang 1200x800), KHÔNG phải bản gốc cùng tên ở assets/images/ — bản đó là poster hero dọc 1200x1802
    { goc: "assets/images/blog/co-gai-ngam-hoang-hon-nha-long-da-lat.webp", khung: "bai", tam: { "1x1": [0.47, 0.5] } }, // an-nuong-da-lat-bao-nhieu-tien — vuông: giữ người + bảng chữ
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
