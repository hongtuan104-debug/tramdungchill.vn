/***
 * scripts/dich/gieo-tieng-anh.js — nạp bản tiếng Anh SẴN CÓ trong data/translations.js (nút EN cũ, 311 khoá)
 * vào từ điển data/ban-dich/en.json. Chạy MỘT lần khi dựng web đa ngôn ngữ (21/10/2026); chạy lại cũng
 * không hại (câu đã có trong từ điển thì giữ nguyên, không ghi đè).
 *
 * Bỏ qua câu tiếng Anh có chữ "Zalo": trang tiếng nước ngoài đổi kênh liên hệ sang WhatsApp (sếp chốt
 * 21/10/2026) nên mấy câu đó phải dịch lại.
 *
 *   node scripts/dich/gieo-tieng-anh.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const P = require('./phan-tich');
const N = require('../ngon-ngu');
const kiem = require('./kiem-ban-dich');

const ctx = {};
vm.runInNewContext(fs.readFileSync(path.join(N.ROOT, 'data/translations.js'), 'utf8') + '\n;this.T = TRANSLATIONS;', ctx);
const T = ctx.T;
const cau = (html) => P.CO_CHU.test(html) ? P.tachCau(P.phanTich('<div>' + html + '</div>')).map((it) => it.khoa) : [];

const tuDien = N.docTuDien('en');
let them = 0, giu = 0, bo = [];
for (const k of Object.keys(T.vi)) {
    if (T.en[k] === undefined) continue;
    const a = cau(T.vi[k]), b = cau(T.en[k]);
    if (a.length !== b.length) { bo.push([k, 'số câu lệch ' + a.length + '/' + b.length]); continue; }
    a.forEach((goc, i) => {
        const d = b[i];
        if (/zalo/i.test(d)) { bo.push([k, 'nhắc Zalo']); return; }
        const loi = kiem.kiemCau('en', goc, d);
        if (loi.length) { bo.push([k, loi.join('; ')]); return; }
        if (tuDien[goc] !== undefined) { giu++; return; }
        tuDien[goc] = d;
        them++;
    });
}
N.ghiTuDien('en', tuDien);
console.log('en: thêm ' + them + ' câu từ translations.js · đã có ' + giu + ' · bỏ ' + bo.length);
bo.forEach(([k, l]) => console.log('   - ' + k + ': ' + l));
