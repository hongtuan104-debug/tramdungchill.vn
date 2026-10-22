#!/usr/bin/env node
/**
 * kiem-so-dien-thoai.js — chạy thử js/so-dien-thoai.js (22/10/2026): số Việt, số có mã nước, số nội địa nước ngoài
 * không mã (phải bị chặn + đoán đúng nước), số Việt gõ sai (KHÔNG được đoán sang nước ngoài trên trang tiếng Việt).
 * Chạy trên CẢ mã gốc lẫn mã đã qua đúng hàm nén của bundle-js.js — bộ nén dò chuỗi thô, cắt nhầm là im lặng.
 *   node scripts/kiem-so-dien-thoai.js        (thoát mã 1 nếu có ca sai)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const goc = fs.readFileSync(path.join(ROOT, 'js/so-dien-thoai.js'), 'utf8');

// Lấy đúng hàm minify() trong bundle-js.js (file đó chạy build khi require nên không require được)
const bundleSrc = fs.readFileSync(path.join(ROOT, 'scripts/bundle-js.js'), 'utf8');
const mMin = bundleSrc.match(/function minify\(source\) \{[\s\S]*?\n\}\n/);
if (!mMin) { console.error('Không tìm thấy hàm minify() trong bundle-js.js'); process.exit(1); }
const minify = vm.runInNewContext('(' + mMin[0] + ')');
const daNen = minify(goc);

function nap(src) {
    const ctx = { navigator: { languages: [] }, Intl };
    vm.runInNewContext(src + '\n;this.SDT = SoDienThoai;', ctx);
    return ctx.SDT;
}

// [mô tả, số khách gõ, vùng trình duyệt, tiếng trang, kỳ vọng]
// kỳ vọng: { loai, so? } hoặc { loai:'sai', goiY: '+…' (gợi ý ĐẦU TIÊN) | null (không gợi ý) }
const CA = [
    // ── Số Việt: giữ y như trước ──
    ['VN di động', '0901234567', '', 'vi', { loai: 'vn', so: '0901234567' }],
    ['VN có dấu cách', '090 123 4567', '', 'vi', { loai: 'vn', so: '0901234567' }],
    ['VN có chấm', '0901.234.567', '', 'vi', { loai: 'vn', so: '0901234567' }],
    ['VN +84', '+84 90 123 4567', '', 'vi', { loai: 'vn', so: '0901234567' }],
    ['VN 84…', '84901234567', '', 'vi', { loai: 'vn', so: '0901234567' }],
    ['VN 0084…', '0084901234567', '', 'vi', { loai: 'vn', so: '0901234567' }],
    ['VN đầu 03', '0355123456', '', 'vi', { loai: 'vn', so: '0355123456' }],
    ['VN đầu 05', '0523456789', '', 'vi', { loai: 'vn', so: '0523456789' }],
    ['VN đầu 07', '0779123456', '', 'vi', { loai: 'vn', so: '0779123456' }],
    ['VN đầu 08', '0812345678', '', 'vi', { loai: 'vn', so: '0812345678' }],
    ['VN máy bàn', '028 3812 3456', '', 'vi', { loai: 'vn', so: '02838123456' }],
    ['VN trên trang EN (khách dùng SIM Việt)', '0901234567', 'GB', 'en', { loai: 'vn', so: '0901234567' }],
    // ── Số có mã nước: giữ "+" ──
    ['MY +60', '+60 17-523 3899', '', 'vi', { loai: 'quocte', so: '+60175233899', hienThi: '+60 175233899' }],
    ['MY 0060', '0060175233899', '', 'en', { loai: 'quocte', so: '+60175233899' }],
    ['SG +65', '+65 8123 4567', '', 'en', { loai: 'quocte', so: '+6581234567', hienThi: '+65 81234567' }],
    ['KR +82', '+82 10 1234 5678', '', 'ko', { loai: 'quocte', so: '+821012345678' }],
    ['US +1', '+1 (415) 555-0123', '', 'en', { loai: 'quocte', so: '+14155550123', hienThi: '+1 4155550123' }],
    ['KH +855', '+855 12 333 922', '', 'en', { loai: 'quocte', so: '+85512333922', hienThi: '+855 12333922' }],
    // ── Số nội địa nước ngoài KHÔNG mã nước: chặn + đoán ──
    ['Sandra 21/10 (MY 017) trang Việt', '0175233899', '', 'vi', { loai: 'sai', goiY: '+60175233899' }],
    ['Sandra 21/10, máy vùng GB', '0175233899', 'GB', 'vi', { loai: 'sai', goiY: '+60175233899' }],
    ['MY 012 (đơn 25/07, 05/08)', '0123456789', '', 'vi', { loai: 'sai', goiY: '+60123456789' }],
    ['MY 016 (đơn 20/09)', '0161234567', '', 'vi', { loai: 'sai', goiY: '+60161234567' }],
    ['MY 011 (11 số)', '01112345678', '', 'en', { loai: 'sai', goiY: '+601112345678' }],
    ['MY vùng MY', '0175233899', 'MY', 'en', { loai: 'sai', goiY: '+60175233899' }],
    ['KR 010 (đơn 09/09)', '010-1234-5678', '', 'vi', { loai: 'sai', goiY: '+821012345678' }],
    ['AU 04 (đơn 06/08, 15/10)', '0412 345 678', '', 'vi', { loai: 'sai', goiY: '+61412345678' }],
    ['JP 090 trang EN', '090-1234-5678', '', 'en', { loai: 'sai', goiY: '+819012345678' }],
    ['GB 07 trang EN', '07911 123456', '', 'en', { loai: 'sai', goiY: '+447911123456' }],
    ['PH 09 11 số trang EN', '0917 123 4567', '', 'en', { loai: 'sai', goiY: '+639171234567' }],
    ['ID 08 12 số', '0812-3456-7890', '', 'en', { loai: 'sai', goiY: '+6281234567890' }],
    ['TH 06', '061 234 5678', '', 'th', { loai: 'sai', goiY: '+66612345678' }],
    ['SG 8 số không mã', '8123 4567', '', 'en', { loai: 'sai', goiY: '+6581234567' }],
    ['CN 138 không vùng', '138 0013 8000', '', 'zh', { loai: 'sai', goiY: '+8613800138000' }],
    ['CN 138 vùng CN', '13800138000', 'CN', 'zh', { loai: 'sai', goiY: '+8613800138000' }],
    ['US 10 số vùng US', '(415) 555-0123', 'US', 'en', { loai: 'sai', goiY: '+14155550123' }],
    ['SG gõ mã thiếu +', '6581234567', '', 'en', { loai: 'sai', goiY: '+6581234567' }],
    ['MY gõ mã thiếu +', '60175233899', '', 'en', { loai: 'sai', goiY: '+60175233899' }],
    ['KR gõ mã thiếu +', '821012345678', '', 'ko', { loai: 'sai', goiY: '+821012345678' }],
    ['DE vùng DE', '0151 23456789', 'DE', 'en', { loai: 'sai', goiY: '+4915123456789' }],
    // ── Máy để vùng US (khách châu Á dùng máy tiếng Anh-Mỹ): số có số 0 đầu KHÔNG được đoán thành +1 (lỗi bắt bằng E2E 22/10) ──
    ['KR 010 trang Hàn, máy vùng US', '010-1234-5678', 'US', 'ko', { loai: 'sai', goiY: '+821012345678' }],
    ['MY 017 trang EN, máy vùng US', '0175233899', 'US', 'en', { loai: 'sai', goiY: '+60175233899' }],
    ['AU 04 trang EN, máy vùng US', '0412 345 678', 'US', 'en', { loai: 'sai', goiY: '+61412345678' }],
    ['JP 090 trang EN, máy vùng US', '090-1234-5678', 'US', 'en', { loai: 'sai', goiY: '+819012345678' }],
    ['CN 138 trang Trung, máy vùng US', '138 0013 8000', 'US', 'zh', { loai: 'sai', goiY: '+8613800138000' }],
    ['US gõ cả mã 1 quên +, máy vùng US', '1 415 555 0123', 'US', 'en', { loai: 'sai', goiY: '+14155550123' }],
    ['MY gõ cả mã 60 quên +, máy vùng MY', '60 17 523 3899', 'MY', 'en', { loai: 'sai', goiY: '+60175233899' }],
    ['10 số mã vùng Mỹ sai (101…), máy vùng US', '1012345678', 'US', 'en', { loai: 'sai', goiY: null }],
    ['RU 8 912…, máy vùng RU', '8 912 345 67 89', 'RU', 'ru', { loai: 'sai', goiY: '+79123456789' }],
    // ── Số Việt gõ sai: KHÔNG đoán sang nước ngoài trên trang tiếng Việt (kể cả máy vùng US) ──
    ['VN thiếu 1 số', '090123456', '', 'vi', { loai: 'sai', goiY: null }],
    ['VN thừa 1 số', '09012345678', '', 'vi', { loai: 'sai', goiY: null }],
    ['VN thừa 1 số, máy vùng US', '09012345678', 'US', 'vi', { loai: 'sai', goiY: null }],
    ['VN thiếu 1 số, máy vùng US', '090123456', 'US', 'vi', { loai: 'sai', goiY: null }],
    ['VN số cũ 0168 (trước 2018)', '01689123456', '', 'vi', { loai: 'sai', goiY: null }],
    ['rác', 'abc', '', 'vi', { loai: 'sai', goiY: null }],
    ['rỗng', '', '', 'vi', { loai: 'sai', goiY: null }],
    ['+84 sai độ dài', '+84 90 123', '', 'vi', { loai: 'sai', goiY: null }],
    // ── Ca bắt được ở vòng soát chéo 22/10 (đã tái hiện + thẩm định) ──
    ['VN quên số 0 đầu, trang Việt', '90 123 4567', '', 'vi', { loai: 'vn', so: '0901234567' }],
    ['VN quên 0, trang Việt, máy vùng VN', '90 123 4567', 'VN', 'vi', { loai: 'vn', so: '0901234567' }],
    ['VN quên 0, trang Việt, máy vùng US', '39 123 4567', 'US', 'vi', { loai: 'vn', so: '0391234567' }],
    ['VN quên 0, trang Việt, máy vùng AU', '52 345 6789', 'AU', 'vi', { loai: 'vn', so: '0523456789' }],
    ['VN quên 0, trang EN → gợi ý +84 trước', '90 123 4567', '', 'en', { loai: 'sai', goiY: '+84901234567' }],
    ['VN quên 0, trang EN máy vùng AU → +84 trước', '90 123 4567', 'AU', 'en', { loai: 'sai', goiY: '+84901234567' }],
    ['VN gõ + thiếu 84', '+901234567', '', 'vi', { loai: 'vn', so: '0901234567' }],
    ['VN gõ thừa 00', '00983123456', '', 'vi', { loai: 'vn', so: '0983123456' }],
    ['VN +84 kèm số 0 thừa', '+84 0901 234 567', '', 'en', { loai: 'vn', so: '0901234567' }],
    ['VN chữ số toàn khổ (bộ gõ Nhật/Trung)', '０９０１２３４５６７', '', 'ja', { loai: 'vn', so: '0901234567' }],
    ['VN dán kèm ký tự ẩn', '0901​234‑567', '', 'vi', { loai: 'vn', so: '0901234567' }],
    ['KR +82 010 (thừa số 0 trung kế)', '+82 010-1234-5678', '', 'ko', { loai: 'quocte', so: '+821012345678', hienThi: '+82 1012345678' }],
    ['KR 0082 010', '0082 010 1234 5678', '', 'ko', { loai: 'quocte', so: '+821012345678' }],
    ['GB +44 (0)7', '+44 (0) 7911 123456', '', 'en', { loai: 'quocte', so: '+447911123456' }],
    ['AU +61 04', '+61 0412 345 678', '', 'en', { loai: 'quocte', so: '+61412345678' }],
    ['MY +60 017', '+60 017 523 3899', '', 'en', { loai: 'quocte', so: '+60175233899' }],
    ['IT giữ số 0', '+39 06 1234 5678', '', 'en', { loai: 'quocte', so: '+390612345678' }],
    ['CN máy bàn Bắc Kinh', '+86 10 1234 5678', '', 'zh', { loai: 'quocte', so: '+861012345678' }],
    ['MY (+60) trong ngoặc', '(+60) 17 523 3899', '', 'en', { loai: 'quocte', so: '+60175233899' }],
    ['SG +65 thiếu số', '+65 8123 456', '', 'en', { loai: 'sai', goiY: null }],
    ['00 + số quá ngắn', '0012345678', '', 'en', { loai: 'sai', goiY: null }],
    ['CN 139 trang Trung, máy vùng US → +86', '139 1234 5678', 'US', 'zh', { loai: 'sai', goiY: '+8613912345678' }],
    ['CN 139 trang EN, máy vùng US → +1 (mơ hồ có chủ ý: vùng Mỹ thắng)', '139 1234 5678', 'US', 'en', { loai: 'sai', goiY: '+13912345678' }],
    ['số Mỹ 10 số không vùng: KHÔNG đoán Thuỵ Sĩ +41', '415 555 0123', '', 'en', { loai: 'sai', goiY: null }],
];

let loi = 0, dem = 0;
for (const [ten, SDT] of [['mã gốc', nap(goc)], ['mã đã nén', nap(daNen)]]) {
    for (const [mo, vao, vung, lang, ky] of CA) {
        dem++;
        const kq = SDT.phanTich(vao, vung, lang);
        let ok = kq.loai === ky.loai;
        if (ok && ky.so) ok = kq.so === ky.so;
        if (ok && ky.hienThi) ok = kq.hienThi === ky.hienThi;
        if (ok && ky.loai === 'sai') ok = ky.goiY === null ? kq.goiY.length === 0 : (kq.goiY[0] && kq.goiY[0].so === ky.goiY);
        if (!ok) { loi++; console.log('✗ [' + ten + '] ' + mo + ' — "' + vao + '" vùng=' + (vung || '-') + ' trang=' + lang + ' → ' + JSON.stringify(kq) + ' · cần ' + JSON.stringify(ky)); }
    }
}
// Câu báo: có thay {nuoc} {so}, trang Việt kèm câu tiếng Anh
const SDT = nap(goc);
const bao = SDT.cauBao(SDT.phanTich('0175233899', '', 'vi'), 'vi');
const baoOk = /Malaysia/.test(bao) && /\+60 175233899/.test(bao) && /This looks like a Malaysia number/.test(bao) && !/\{nuoc\}|\{so\}/.test(bao);
if (!baoOk) { loi++; console.log('✗ câu báo gợi ý trang Việt: ' + JSON.stringify(bao)); }
const baoEn = SDT.cauBao(SDT.phanTich('abc', '', 'en'), 'en');
if (!/\+65 8123 4567|country/.test(baoEn)) { loi++; console.log('✗ câu báo trang EN: ' + JSON.stringify(baoEn)); }
// Mạo từ tiếng Anh: "an Australia", "a Malaysia", "a United States" — chạy với chữ tiếng Anh thật của trang EN (t() giả lập)
const ctxEn = { navigator: { languages: [] }, Intl, t: (k, d) => (k === 'notify.phone_goi_y' ? 'This looks like a {nuoc} number — we added the country code: {so}. Please check it and submit again.' : d) };
vm.runInNewContext(goc + '\n;this.SDT = SoDienThoai;', ctxEn);
const MAO_TU = [['0412345678', 'an Australia number'], ['0175233899', 'a Malaysia number'], ['(415) 555-0123', 'a United States number']];
for (const [so, can] of MAO_TU) {
    const vung = so.startsWith('(') ? 'US' : '';
    const c = ctxEn.SDT.cauBao(ctxEn.SDT.phanTich(so, vung, 'en'), 'en');
    if (!c.includes(can)) { loi++; console.log('✗ mạo từ: "' + so + '" → ' + JSON.stringify(c) + ' · cần "' + can + '"'); }
}
const baoViAu = SDT.cauBao(SDT.phanTich('0412345678', '', 'vi'), 'vi');
if (!/This looks like an Australia number/.test(baoViAu)) { loi++; console.log('✗ mạo từ dòng tiếng Anh trang Việt: ' + JSON.stringify(baoViAu)); }
// Khách Việt gõ sai số trên trang Việt: ĐÚNG câu cũ ngắn, không nhắc số nước ngoài, không tiếng Anh (chủ dặn 22/10)
const CAU_CU = 'Số điện thoại không hợp lệ (cần 10 số)!';
for (const so of ['090123456', '09012345678', '0901 234 56', '01689123456']) {
    const c = SDT.cauBao(SDT.phanTich(so, 'US', 'vi'), 'vi');
    if (c !== CAU_CU) { loi++; console.log('✗ câu báo khách Việt gõ sai "' + so + '": ' + JSON.stringify(c) + ' · cần đúng câu cũ'); }
}
// Số trông như NƯỚC NGOÀI trên trang Việt mà không đoán được nước: vẫn có hướng dẫn mã nước + 1 dòng tiếng Anh
const baoNgoai = SDT.cauBao(SDT.phanTich('415 555 0123', '', 'vi'), 'vi');
if (!/ghi kèm mã nước/.test(baoNgoai) || !/Foreign number\?/.test(baoNgoai)) { loi++; console.log('✗ câu báo số nước ngoài trang Việt: ' + JSON.stringify(baoNgoai)); }
console.log((loi ? '✗ ' : '✓ ') + (dem - loi) + '/' + dem + ' ca đạt (mã gốc + mã đã nén)' + (loi ? ' · ' + loi + ' ca SAI' : '') + ' · câu báo: ' + (baoOk ? 'đạt' : 'SAI'));
console.log('  ví dụ câu báo trang Việt: ' + bao.replace(/\n/g, ' ⏎ '));
process.exit(loi ? 1 : 0);
