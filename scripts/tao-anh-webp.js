/***
 * tao-anh-webp.js
 * Xuất WebP nhiều cỡ cho ảnh chụp trong assets/images/ để trang dùng srcset.
 *
 * VÌ SAO (13/09/2026): PageSpeed mobile báo "Cải thiện việc phân phối hình ảnh" —
 * gallery-1.jpg 153 KB, rộng 1200px, mà trên điện thoại chỉ hiện ~372px (×1,75 mật độ
 * điểm ảnh = 651px). Sáu ảnh gallery-*.jpg (105–294 KB) chỉ có đúng một bản JPG 1200px,
 * không WebP, không srcset, nên máy nào cũng tải bản to nhất.
 * Đổi sang WebP chất lượng 72 (đã mở ảnh ra so bằng mắt với bản gốc) + 3 cỡ:
 *   gallery-1: 153 KB JPG → 45 KB (800px, cỡ Moto G của PageSpeed chọn) · 21 KB (480px)
 *
 * CÁCH DÙNG — chạy tay khi thay/thêm ảnh, KHÔNG nằm trong build:
 *   1. Chép ảnh mới đè lên assets/images/gallery-N.jpg (giữ bản JPG: og:image và
 *      khối <noscript> vẫn dùng JPG — bot mạng xã hội không phải cái nào cũng đọc WebP)
 *   2. node scripts/tao-anh-webp.js
 *   3. node scripts/bundle-js.js   (vân tay + service worker)
 *   Cần thư viện sharp: npm install --save-dev sharp  (package.json bị gitignore,
 *   máy vừa clone sẽ chưa có — giống subset-font của cat-phong.js)
 *
 * Ảnh ra: assets/images/<tên>-480.webp / -800.webp / -1200.webp
 * Nơi dùng: index.html (3 thẻ trải nghiệm + 6 ô gallery, qua data-srcset mà
 * js/gallery.js gắn khi ảnh sắp vào màn hình) và nền hero của 4 trang dip/.
 * ⚠️ Ảnh gốc hẹp hơn 1200px thì KHÔNG đẻ bản -1200 (phóng to chỉ tốn byte) — khi đó
 * phải sửa srcset trong HTML theo cỡ thật, script sẽ in cảnh báo.
 */

"use strict";

const fs = require("fs");
const path = require("path");

let sharp;
try {
    sharp = require("sharp");
} catch (e) {
    console.error("Thiếu thư viện sharp. Chạy: npm install --save-dev sharp");
    process.exit(1);
}

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "assets", "images");

// 22/09/2026: thêm 6 ảnh bộ chụp Canon "Viết Báo" (sếp Tuấn gửi qua Drive). Ảnh mới đặt TÊN MỚI chứ
// không đè lên gallery-N: service worker giữ /assets/images/ kiểu cache-first, đè cùng tên là khách cũ
// còn thấy ảnh cũ; và gallery-N vẫn là hero của trang sinh nhật / ảnh chia sẻ của bài noindex.
const ANH = [
    "gallery-1", "gallery-2", "gallery-3", "gallery-4", "gallery-5", "gallery-6",
    // Quy ước tên (sếp Tuấn dặn 22/09/2026): tả đúng thứ trong ảnh + có "da-lat" để hợp SEO, mỗi tên
    // một lần, không nhồi. Không ghi điều ảnh không chứng minh được (vd. tàu "đang chạy", cổng "vào").
    "cap-doi-an-lau-canh-tau-lua-da-lat",   // thẻ "Khoảnh Khắc Săn Tàu" trang chủ
    "tau-lua-da-lat-sang-den-ve-dem",       // thẻ "Nhà Lồng Lên Đèn" trang chủ
    "cong-tron-hoang-hon-da-lat",           // ô gallery "Hoàng hôn"
    "quan-nuong-da-lat-dong-khach-ve-dem",  // ô gallery "Quán về đêm" + hero dip/team-building
    "tau-lua-da-lat-duoi-lan-can-quan",     // ô gallery "View xe lửa" + hero dip/san-tau-da-lat
    "cap-doi-bien-cau-hon-da-lat",          // hero dip/cau-hon-hen-ho
];
const CO = [480, 800, 1200];
const QUALITY = 72;

async function main() {
    let tong = 0, tongGoc = 0;
    for (const ten of ANH) {
        const goc = path.join(DIR, ten + ".jpg");
        if (!fs.existsSync(goc)) {
            console.warn("  ⚠ Không thấy " + ten + ".jpg — bỏ qua");
            continue;
        }
        const meta = await sharp(goc).metadata();
        const kbGoc = fs.statSync(goc).size / 1024;
        tongGoc += kbGoc;
        const dong = [ten.padEnd(10), (meta.width + "x" + meta.height).padEnd(9), kbGoc.toFixed(0).padStart(4) + " KB jpg →"];
        for (const w of CO) {
            if (w > meta.width) {
                console.warn("  ⚠ " + ten + ".jpg chỉ rộng " + meta.width + "px — không tạo bản " + w + "px, nhớ sửa srcset trong HTML");
                continue;
            }
            const ra = path.join(DIR, ten + "-" + w + ".webp");
            await sharp(goc).resize({ width: w }).webp({ quality: QUALITY, effort: 6 }).toFile(ra);
            const kb = fs.statSync(ra).size / 1024;
            if (w === 800) tong += kb;
            dong.push(w + "px " + kb.toFixed(0) + " KB");
        }
        console.log("  " + dong.join("  "));
    }
    console.log("\nBản 800px (cỡ điện thoại tầm trung tải) tổng " + tong.toFixed(0) + " KB, so với " + tongGoc.toFixed(0) + " KB JPG gốc.");
}

main().catch(function (e) {
    console.error(e);
    process.exit(1);
});
