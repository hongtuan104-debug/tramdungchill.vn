#!/usr/bin/env node
/**
 * Kiểm các khối mô tả dùng chung cho mọi kênh (docs/mo-ta-chung-cac-kenh.md).
 * Chạy tay trước khi dán lên Google Maps / Facebook / TikTok…:
 *   node scripts/kiem-mo-ta-kenh.js
 *
 * Mỗi khối trong file mở đầu bằng mốc <!-- KHOI <tên> max=<số> --> rồi tới khối ```text.
 * Kiểm: độ dài (đếm theo ký tự, bản dựng sẵn NFC) · chữ cấm (CLAUDE.md #16, #25, #39) ·
 * dữ kiện lệch (phường cũ, dấu phẩy trong tên phường, giờ 22h, SĐT lạ) · khối C không chứa link
 * (Google cấm URL trong ô mô tả Business Profile) · câu setup phải kèm tiền cọc.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'docs', 'mo-ta-chung-cac-kenh.md');
const md = fs.readFileSync(FILE, 'utf8');

const khoi = [...md.matchAll(/<!-- KHOI (\S+) max=(\d+) -->\s*```text\r?\n([\s\S]*?)```/g)]
    .map(m => ({ ten: m[1], max: +m[2], chu: m[3].replace(/\r/g, '').replace(/\n$/, '') }));

const LUAT = [
    [/duy nhất|số một|số 1\b|#1\b|No\.?\s?1\b|độc nhất|top 1\b|hạng 1\b|nhất Đà Lạt|(?:đẹp|ngon|rẻ|chill|rõ) nhất|triệu đô/i, 'chữ tự xưng độc quyền / "nhất" / "triệu đô" (sếp cấm 13/09/2026)'],
    [/\bunique\b|\bonly (?:restaurant|place)\b|\bbest\b/i, 'tự xưng độc quyền bản tiếng Anh'],
    [/hoa tươi|hoa hồng|\bnến\b|candle|\brose|fresh flower/i, 'setup hứa hoa tươi / hoa hồng / nến (bug #39)'],
    [/răng cưa|\brack\b|\bcog\b/i, 'đường sắt "răng cưa" (bug #16)'],
    [/17:15|17:30|18:35|19:20|20:40|\b5:30 PM/i, 'giờ từng chuyến tàu (sếp chỉ cho ghi khung 16:30 – 21:25)'],
    [/Phường\s*11\b|P\.\s*11\b|Ward\s*11\b/i, 'tên phường cũ'],
    [/Xuân Trường\s*,\s*Đà Lạt|Xuan Truong(?: Ward)?\s*,\s*Da ?Lat/i, 'tên phường viết dấu phẩy (đúng: "Xuân Trường - Đà Lạt")'],
    [/\b22h\b|22:00|10(?::00)?\s*PM/i, 'giờ đóng cửa 22h (đúng: 23:00)'],
    [/\d[.,]\d\s*\/\s*5|\d{1,2}[.,]\d{3}\s*(?:lượt|đánh giá|reviews)/i, 'số đánh giá (đổi hằng ngày — đừng ghi vào mô tả kênh)'],
    [/khoảng 100 món|hơn 80 món|gần 100 món/i, 'số món (viết "hơn 70 món")'],
    [/20\s*[–-]\s*100 khách/i, 'quy mô đoàn chưa xác nhận'],
    [/homestay|tramdungchill\.com|facebook\.com\/tramdungchill(?![a-z0-9_])|tên gần giống|similar names?/i, 'nhắc tới cơ sở khác cùng tên (sếp chốt 29/09/2026: không nhắc)'],
];

let loi = 0;
console.log(`Kiểm ${khoi.length} khối trong docs/mo-ta-chung-cac-kenh.md\n`);
for (const k of khoi) {
    const nfc = k.chu.normalize('NFC');
    const dem = [...nfc].length;
    const dem_x = [...nfc].reduce((t, c) => t + (c.codePointAt(0) > 0x2000 ? 2 : 1), 0);
    const van_de = [];
    if (dem > k.max) van_de.push(`dài ${dem} > ${k.max}`);
    for (const [re, ly_do] of LUAT) if (re.test(nfc)) van_de.push(ly_do);
    // SĐT: mọi dãy số dạng điện thoại phải là số của quán
    for (const m of nfc.matchAll(/(?:\+84|0)[\d .]{8,13}\d/g)) {
        if (m[0].replace(/\D/g, '').replace(/^84/, '0') !== '0989765070') van_de.push('SĐT lạ: ' + m[0]);
    }
    if (k.ten === 'C' && /https?:|www\.|\.vn\b/i.test(nfc)) van_de.push('khối Google Maps chứa link (Google cấm)');
    if (k.ten === 'C' && /\p{Extended_Pictographic}/u.test(nfc)) van_de.push('khối Google Maps có emoji (Google coi là ký tự trang trí "gimmicky")');
    if (/setup|decoration|trang trí/i.test(nfc) && !/200[.,]000/.test(nfc)) van_de.push('nhắc setup mà thiếu "cọc 200.000đ hoàn lại"');
    if (!k.ten.startsWith('TUY-CHON') && !/Xuân Trường - Đà Lạt|Xuan Truong - Da Lat|Đà Lạt|Da Lat/.test(nfc)) van_de.push('không có địa danh');

    const x = k.ten === 'A' ? ` · X đếm ~${dem_x}/160` : '';
    console.log(`${van_de.length ? '❌' : '✅'}  ${k.ten.padEnd(12)} ${String(dem).padStart(4)}/${k.max}${x}`);
    for (const v of van_de) console.log('      → ' + v);
    loi += van_de.length;
}
if (!khoi.length) { console.log('❌ không tìm thấy khối nào — mốc <!-- KHOI … --> bị sửa?'); loi++; }
console.log(loi ? `\n${loi} vấn đề cần sửa.` : '\nSạch — dán được lên mọi kênh.');
process.exit(loi ? 1 : 0);
