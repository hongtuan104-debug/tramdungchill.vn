/***
 * scripts/dich/xuat-soat.js — xuất câu đã dịch có THUẬT NGỮ LẶP (tên món, nhóm món, dãy bàn, câu xác nhận đặt bàn…)
 * để soát cho một thứ tiếng dùng MỘT cách gọi (21/10/2026). Mỗi phần do một người dịch riêng làm, nên cùng
 * "Lẩu Gà Lá É" có thể ra 3–4 cách gọi khác nhau trên các trang.
 *
 *   node scripts/dich/xuat-soat.js <mã> [thư mục ra]
 * Ra <thư mục>/soat-<mã>.json theo đúng khuôn file xuất (cau: [{ id, goc, ngu_canh }]) + trường "dich_hien_tai".
 * Người soát nộp soat-<mã>.dich.json = { "<id>": "bản sửa" } CHỈ cho câu cần sửa; nạp bằng
 *   node scripts/dich-trang.js --nap <thư mục>/soat-<mã>.dich.json <mã>
 *
 * Lượt bổ sung: --tru <file soát đã làm> bỏ các câu đã có trong file đó, --ten <tên file> đổi tên file ra.
 * Khớp thuật ngữ KHÔNG phân biệt hoa thường (bản đầu phân biệt nên sót "Bò Tảng", "lẩu gà lá é" — người soát tiếng Nga phát hiện).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const N = require('../ngon-ngu');
const D = require('../dich-trang');

const thamSo = process.argv.slice(2);
const co = (ten) => { const i = thamSo.indexOf(ten); if (i < 0) return null; const v = thamSo[i + 1]; thamSo.splice(i, 2); return v; };
const fTru = co('--tru');
const tenRa = co('--ten');
const ma = thamSo[0];
const ra = thamSo[1] || path.join(N.ROOT, 'plans', 'ban-dich');
const daSoat = new Set(fTru ? JSON.parse(fs.readFileSync(fTru, 'utf8')).cau.map((c) => c.goc) : []);
if (!N.MA_DICH.includes(ma)) { console.error('Mã tiếng không hợp lệ: ' + ma); process.exit(1); }

const ctx = {};
vm.runInNewContext(fs.readFileSync(path.join(N.ROOT, 'data/menu-data.js'), 'utf8') + ';this.C=MENU_CATEGORIES;this.I=MENU_ITEMS;', ctx);
const THUAT_NGU = new Set();
for (const c of ctx.C) THUAT_NGU.add(c.label);
for (const id of Object.keys(ctx.I)) for (const m of ctx.I[id]) THUAT_NGU.add(m.name);
// cụm lặp quan trọng ngoài tên món
['dãy', 'Dãy', 'lan can', 'Khu K', 'xác nhận', 'Xác nhận', 'Zalo', 'phụ thu', 'Mùng', 'setup', 'Setup', 'cọc', 'bò tảng', 'Bò tảng',
    'nhà lồng', 'săn tàu', 'Săn tàu', 'tàu cổ', 'Trại Mát', 'quán cùng chủ', 'Xóm Lèo', 'Best Seller', 'signature', 'hoàng hôn',
    'Nhà Lồng', 'view', 'View', 'Đặt bàn', 'đặt bàn', 'hơn 70 món', 'Hơn 70 món'].forEach((t) => THUAT_NGU.add(t));
const ds = [...THUAT_NGU].filter(Boolean).map((t) => t.toLowerCase()).sort((a, b) => b.length - a.length);

const cau = [];
let id = 0;
for (const c of D.moiCau()) {
    if (c.langNguon === ma) continue;
    if (daSoat.has(c.khoa)) continue;
    const d = D.dich(ma, c.khoa);
    if (d === null) continue;
    const thuong = c.khoa.toLowerCase();
    if (!ds.some((t) => thuong.includes(t))) continue;
    cau.push({ id: ++id, goc: c.khoa, dich_hien_tai: d, ngu_canh: c.ngu });
}
fs.mkdirSync(ra, { recursive: true });
const f = path.join(ra, (tenRa || 'soat-' + ma) + '.json');
fs.writeFileSync(f, JSON.stringify({ ma, tieng: N.THEO_MA[ma].ten, cau }, null, 1) + '\n', 'utf8');
console.log(ma + ': ' + cau.length + ' câu có thuật ngữ lặp → ' + f);
