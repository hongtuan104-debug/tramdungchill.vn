/**
 * van-tay.js — cách tính ?v=<md5> dùng chung.
 *
 * Tách riêng vì vân tay được sinh ở HAI nơi và chúng PHẢI ra cùng một chuỗi:
 *   - scripts/toi-uu-tai-trang.js  gắn ?v= vào <script src> trong HTML
 *   - scripts/cap-nhat-sw.js       viết đúng URL đó vào STATIC_ASSETS của sw.js
 * Lệch thuật toán giữa hai bên thì bản precache trỏ vào URL không ai gọi —
 * tải về rồi vứt đi, đúng bài học v9 với style.min.css.
 *
 * md5 cắt 8 ký tự: đủ để nội dung khác nhau ra mã khác nhau, ngắn cho dễ đọc
 * lúc soi HTML. Không dùng cho mục đích bảo mật.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const nho = new Map();

/** Băm nội dung một file. Trả null nếu file không tồn tại (đừng làm hỏng link). */
function bamFile(duongDan) {
    if (nho.has(duongDan)) return nho.get(duongDan);
    let v = null;
    try {
        v = crypto.createHash("md5").update(fs.readFileSync(duongDan)).digest("hex").slice(0, 8);
    } catch (e) {
        v = null;
    }
    nho.set(duongDan, v);
    return v;
}

/**
 * Các thư mục chứa JS nội bộ được nạp thẳng bằng <script src>.
 * dist/ = bundle build ra · js/ = script nguồn · data/ = dữ liệu dạng .js
 * components/ KHÔNG có ở đây: layout-loader nạp bằng fetch chứ không qua thẻ.
 */
const THU_MUC_JS = "(?:dist|js|data)";

/** Regex bắt <script ... src="[../]dist|js|data/ten.js[?v=cu]"> */
function regexScriptJS() {
    return new RegExp(
        '(<script\\b[^>]*\\ssrc=")((?:\\.\\./)*' + THU_MUC_JS + '/[A-Za-z0-9._-]+\\.js)(\\?v=[a-f0-9]+)?(")',
        "gi");
}

/**
 * Vân tay cho phông tự chứa (14/09/2026, CLAUDE.md bug #27).
 * Mọi chỗ gọi assets/fonts/<ten>.woff2 — url() trong dist/*.css, thẻ preload trong HTML,
 * @font-face inline (review-qr.html), template bài blog — PHẢI mang CÙNG một ?v=: lệch
 * là trình duyệt coi preload và CSS là hai URL khác nhau, tải phông hai lần.
 * Băm theo file thật trong thư mục phông nên chỉ cần tên file, không phụ thuộc
 * đường dẫn tương đối của trang ("../assets/fonts/x" hay "assets/fonts/x" ra cùng mã).
 * Vì sao cần: muốn trình duyệt giữ phông lâu (bộ nhớ đệm >= 30 ngày) thì URL phải đổi
 * khi nội dung đổi — mà cat-phong.js viết lại phông mỗi khi bộ ký tự site đổi, tên
 * file vẫn y nguyên. Không vân tay thì khách cũ giữ bản phông thiếu glyph mới.
 * @param {string} text  nội dung HTML/CSS
 * @param {string} thuMucPhong  đường dẫn tuyệt đối tới assets/fonts
 */
function ganVanTayPhong(text, thuMucPhong) {
    return text.replace(/((?:\.\.\/)*\/?assets\/fonts\/([A-Za-z0-9._-]+\.woff2))(\?v=[a-f0-9]+)?/g, (m, duong, ten) => {
        const v = bamFile(path.join(thuMucPhong, ten));
        return v ? duong + "?v=" + v : m;   // file chưa có — để nguyên, đừng làm hỏng link
    });
}

module.exports = { bamFile, regexScriptJS, THU_MUC_JS, ganVanTayPhong };
