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

module.exports = { bamFile, regexScriptJS, THU_MUC_JS };
