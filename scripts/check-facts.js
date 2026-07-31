#!/usr/bin/env node
/**
 * LUOI CANH SO LIEU - Tram Dung Chill
 * ===================================
 * Muc dich: bat cac con so tren website mau thuan voi nguon chuan.
 *
 * Vi sao can: so danh gia Google, so mon, gia, gio mo cua... nam rai rac
 * hang chuc file. Sua 1 cho quen 1 cho -> Google va AI (ChatGPT, Claude,
 * Perplexity) doc phai so cu roi noi sai voi khach.
 *
 * Cach chay:  node scripts/check-facts.js
 * Thoat 0 = sach. Thoat 1 = co so sai (in ro file:dong).
 *
 * Nguon chuan: data/facts.json
 * Rieng SO MON: khong khai tay - script tu dem tu data/menu-data.js.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Thu muc bo qua:
//  - dist/    : file may sinh tu js/, kiem ban goc la du
//  - scripts/ : khong phuc vu nguoi doc (robots.txt da Disallow), va chu thich
//               trong script co nhac lai so CU cho muc dich lich su -> bao oan
//  - docs, plans, dev : tai lieu noi bo, robots.txt da Disallow
const SKIP_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'assets', '.claude',
  'scripts', 'docs', 'plans', 'dev',
]);
// File bo qua: chinh nguon chuan (khop hien nhien, kiem se vo nghia)
const SKIP_FILES = new Set([path.join('data', 'facts.json')]);
const EXTS = new Set(['.html', '.js', '.txt', '.json']);

const errors = [];
const warnings = [];

function fail(msg) {
  console.error('\nLOI NGHIEM TRONG: ' + msg);
  process.exit(2);
}

// ---------------------------------------------------------------- nguon chuan
let FACTS;
try {
  FACTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'facts.json'), 'utf8'));
} catch (e) {
  fail('khong doc duoc data/facts.json — ' + e.message);
}

// ------------------------------------------------- dem so mon that tu menu-data
function demSoMon() {
  const src = fs.readFileSync(path.join(ROOT, 'data', 'menu-data.js'), 'utf8');
  let MENU_CATEGORIES, MENU_ITEMS;
  try {
    ({ MENU_CATEGORIES, MENU_ITEMS } = new Function(
      src + '; return { MENU_CATEGORIES, MENU_ITEMS };'
    )());
  } catch (e) {
    fail('khong doc duoc data/menu-data.js — ' + e.message);
  }
  if (!Array.isArray(MENU_CATEGORIES) || !MENU_ITEMS) {
    fail('data/menu-data.js thieu MENU_CATEGORIES hoac MENU_ITEMS');
  }
  const ten = new Set();
  for (const c of MENU_CATEGORIES) {
    for (const it of MENU_ITEMS[c.id] || []) {
      if (it && it.name) ten.add(it.name.trim().toLowerCase());
    }
  }
  if (ten.size === 0) fail('dem duoc 0 mon tu menu-data.js — chac chan sai');
  return ten.size;
}

const SO_MON = demSoMon();

// ------------------------------------------------------------------ tien ich
/** So kieu Viet: 6816 -> "6.816" */
function dinhDangVN(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
/** So kieu Anh: 6816 -> "6,816" */
function dinhDangEN(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
/** Bo dau phan cach: "6.816" | "6,816" -> 6816 */
function boPhanCach(s) {
  return parseInt(String(s).replace(/[.,\s]/g, ''), 10);
}
function soDong(noiDung, viTri) {
  return noiDung.slice(0, viTri).split('\n').length;
}

function liet_ke_file(dir, ra) {
  for (const ten of fs.readdirSync(dir)) {
    const day_du = path.join(dir, ten);
    const rel = path.relative(ROOT, day_du);
    let st;
    try { st = fs.statSync(day_du); } catch { continue; }
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(ten)) continue;
      liet_ke_file(day_du, ra);
    } else if (EXTS.has(path.extname(ten)) && !SKIP_FILES.has(rel)) {
      ra.push(day_du);
    }
  }
  return ra;
}

const FILES = liet_ke_file(ROOT, []);
if (FILES.length === 0) fail('khong quet duoc file nao');

// ------------------------------------------------------------ dinh nghia phep kiem
/**
 * Moi phep kiem: quet toan bo file, moi lan khop thi goi kiemTra(giaTriBatDuoc).
 * kiemTra tra ve null = dat, tra ve chuoi = ly do sai.
 *
 * batBuocCoKhop: neu true ma quet ca repo khong khop lan nao -> bao loi
 * (mau do da ruong, khong duoc im lang cho qua).
 */
const PHEP_KIEM = [
  {
    ten: 'So danh gia Google trong JSON-LD ("reviewCount")',
    mau: /"reviewCount"\s*:\s*"?(\d+)"?/g,
    batBuocCoKhop: true,
    kiemTra: (m) => {
      const n = parseInt(m[1], 10);
      return n === FACTS.soDanhGiaGoogle
        ? null
        : `ghi ${n}, nguon chuan la ${FACTS.soDanhGiaGoogle}`;
    },
  },
  {
    ten: 'So danh gia trong data/schema-data.js (rating.count)',
    mau: /rating\s*:\s*\{[^}]*count\s*:\s*['"](\d+)['"]/g,
    batBuocCoKhop: false,
    kiemTra: (m) => {
      const n = parseInt(m[1], 10);
      return n === FACTS.soDanhGiaGoogle
        ? null
        : `ghi ${n}, nguon chuan la ${FACTS.soDanhGiaGoogle}`;
    },
  },
  {
    // Nhan lay so THAT tu facts.json, khong ghi cung: nhan tung ke "6.816"
    // trong khi nguon da len 6.889 (31/07/2026) — do nghe do ma tu noi sai so
    // thi nguoi doc mat long tin vao ca luoi.
    ten: `So danh gia dang chu tieng Viet ("${dinhDangVN(FACTS.soDanhGiaGoogle)} danh gia")`,
    // Yeu cau co chu "danh gia" ngay sau -> khong the khop nham "165000"
    mau: /(\d{1,3}(?:\.\d{3})+|\d{4,})\+?\s*(?:lượt\s+)?đánh giá/gi,
    batBuocCoKhop: true,
    kiemTra: (m) => {
      const n = boPhanCach(m[1]);
      return n === FACTS.soDanhGiaGoogle
        ? null
        : `ghi ${m[1]}, nguon chuan la ${dinhDangVN(FACTS.soDanhGiaGoogle)}`;
    },
  },
  {
    ten: `So danh gia dang chu tieng Anh ("${dinhDangEN(FACTS.soDanhGiaGoogle)} reviews")`,
    mau: /(\d{1,3}(?:,\d{3})+|\d{4,})\+?\s*(?:Google\s+)?reviews?\b/gi,
    batBuocCoKhop: false,
    kiemTra: (m) => {
      const n = boPhanCach(m[1]);
      return n === FACTS.soDanhGiaGoogle
        ? null
        : `ghi ${m[1]}, nguon chuan la ${dinhDangEN(FACTS.soDanhGiaGoogle)}`;
    },
  },
  {
    // Luoi vet cuoi. Hai phep tren doi chu "danh gia"/"reviews" dung ngay sau so,
    // nen truot cac cach viet khac: "nearly 6,000 guests", va meta description bi
    // cat cut thanh "nearly 6,000...". Phep nay bat so theo NGU CANH:
    //   - co tu dinh luong dung truoc (nearly / hon / khoang...), HOAC
    //   - co danh tu chi nguoi/luot dung sau (reviews / guests / khach...)
    // roi chi xet so CUNG TAM voi so danh gia that (chia 3 -> nhan 3).
    //
    // Vi sao phai gioi han tam: gia tien "95.000d" cung la mot so 5 chu so.
    // Lay tam theo so danh gia that (6.816 -> xet 2.272..20.448) thi 95.000
    // nam ngoai, khong bao oan; ma neu mai mot so danh gia len 15.000 thi
    // nguong tu gian ra theo, khong phai sua tay.
    ten: 'So danh gia theo ngu canh (bat ca "6,000 guests" va ban bi cat cut)',
    mau: new RegExp(
      '(?:nearly|over|about|almost|gần|hơn|khoảng|xấp xỉ)\\s+([0-9][0-9.,]{2,7})(\\s*(?:đ|₫|VND|k\\b)?)' +
        '|([0-9][0-9.,]{2,7})\\+?(?:</(?:strong|b|em|span)>)?\\s+' +
        '(?:lượt\\s+)?(?:Google\\s+)?(?:đánh giá|reviews?|guests?|khách)\\b',
      'gi'
    ),
    batBuocCoKhop: true,
    // "khach"/"guests"/"luot" con duoc dung cho SO LUOT KHACH, khong phai so danh gia
    // (vd: "Da co hon 10.000+ khach san tau thanh cong"). Nen chi xet khi co tin hieu
    // danh-gia dung gan ngay truoc do: "danh gia" / "sao" / "rated" / "stars".
    chiKhi: (noiDung, viTri) =>
      /(đánh giá|rated|star|sao\b|review)/i.test(
        noiDung.slice(Math.max(0, viTri - 100), viTri)
      ),
    kiemTra: (m) => {
      const duoiTien = (m[2] || '').trim();
      if (duoiTien) return null; // co duoi d/VND/k -> la gia tien, khong phai so danh gia
      const n = boPhanCach(m[1] || m[3]);
      const that = FACTS.soDanhGiaGoogle;
      if (!Number.isFinite(n) || n < that / 3 || n > that * 3) return null; // khac tam
      return n === that
        ? null
        : `ghi ${m[1] || m[3]}, nguon chuan la ${dinhDangVN(that)}`;
    },
  },
  {
    ten: 'Diem danh gia tong (chi trong khoi "aggregateRating")',
    mau: /"ratingValue"\s*:\s*"?([\d.]+)"?/g,
    batBuocCoKhop: true,
    // Chi xet khi nam trong aggregateRating. Review le co ratingValue "5" -> bo qua.
    chiKhi: (noiDung, viTri) =>
      /aggregateRating/.test(noiDung.slice(Math.max(0, viTri - 300), viTri)),
    kiemTra: (m) => {
      return m[1] === FACTS.diemDanhGiaGoogle
        ? null
        : `ghi ${m[1]}, nguon chuan la ${FACTS.diemDanhGiaGoogle}`;
    },
  },
  {
    ten: 'Khoang gia trong JSON-LD ("priceRange")',
    mau: /"priceRange"\s*:\s*"([^"]+)"/g,
    batBuocCoKhop: true,
    kiemTra: (m) =>
      m[1] === FACTS.priceRangeSchema
        ? null
        : `ghi "${m[1]}", nguon chuan la "${FACTS.priceRangeSchema}"`,
  },
  {
    ten: 'Gio mo cua trong JSON-LD ("opens")',
    mau: /"opens"\s*:\s*"([^"]+)"/g,
    batBuocCoKhop: true,
    kiemTra: (m) =>
      m[1] === FACTS.gioMoCua ? null : `ghi ${m[1]}, nguon chuan la ${FACTS.gioMoCua}`,
  },
  {
    ten: 'Gio dong cua trong JSON-LD ("closes")',
    mau: /"closes"\s*:\s*"([^"]+)"/g,
    batBuocCoKhop: true,
    kiemTra: (m) =>
      m[1] === FACTS.gioDongCua ? null : `ghi ${m[1]}, nguon chuan la ${FACTS.gioDongCua}`,
  },
  {
    ten: 'So dien thoai trong JSON-LD ("telephone")',
    mau: /"telephone"\s*:\s*"([^"]+)"/g,
    batBuocCoKhop: true,
    kiemTra: (m) =>
      m[1] === FACTS.dienThoaiSchema
        ? null
        : `ghi ${m[1]}, nguon chuan la ${FACTS.dienThoaiSchema}`,
  },
  {
    ten: 'Cau "hon N mon" / "tren N mon" (phai con dung khi menu doi)',
    mau: /(?:hơn|trên)\s*(\d{2,3})\s*món/gi,
    batBuocCoKhop: false,
    kiemTra: (m) => {
      const n = parseInt(m[1], 10);
      // Chi sai khi noi qua len. Noi it hon so that van la cau dung.
      return n <= SO_MON
        ? null
        : `noi "hon ${n} mon" nhung menu chi co ${SO_MON} mon — CAU NAY SAI`;
    },
  },
  {
    ten: 'Cau "khoang N mon" / "~N mon" (phai dung chinh xac)',
    mau: /(?:khoảng|xấp xỉ|~)\s*(\d{2,3})\s*món/gi,
    batBuocCoKhop: false,
    kiemTra: (m) => {
      const n = parseInt(m[1], 10);
      return n === SO_MON ? null : `ghi ${n} mon, menu that co ${SO_MON} mon`;
    },
  },
];

// ------------------------------------------------------------------- chay quet
const soLanKhop = new Map(PHEP_KIEM.map((p) => [p.ten, 0]));

for (const duongDan of FILES) {
  let noiDung;
  try {
    noiDung = fs.readFileSync(duongDan, 'utf8');
  } catch {
    continue;
  }
  const rel = path.relative(ROOT, duongDan).replace(/\\/g, '/');

  for (const phep of PHEP_KIEM) {
    phep.mau.lastIndex = 0;
    let m;
    while ((m = phep.mau.exec(noiDung)) !== null) {
      if (phep.chiKhi && !phep.chiKhi(noiDung, m.index)) continue;
      soLanKhop.set(phep.ten, soLanKhop.get(phep.ten) + 1);
      const lyDo = phep.kiemTra(m);
      if (lyDo) {
        errors.push({ file: rel, dong: soDong(noiDung, m.index), phep: phep.ten, lyDo });
      }
    }
  }
}

// Mau do ruong = im lang cho qua. Phai bao.
for (const phep of PHEP_KIEM) {
  if (phep.batBuocCoKhop && soLanKhop.get(phep.ten) === 0) {
    errors.push({
      file: '(toan repo)',
      dong: 0,
      phep: phep.ten,
      lyDo: 'quet ca repo khong khop lan nao — mau do co the da hong, KHONG duoc coi la sach',
    });
  }
}

// Nguon chuan de lau ngay -> so danh gia Google chac chan da khac
if (FACTS.capNhatLanCuoi) {
  const ngay = Math.floor(
    (Date.now() - new Date(FACTS.capNhatLanCuoi + 'T00:00:00Z').getTime()) / 86400000
  );
  if (ngay > 60) {
    warnings.push(
      `data/facts.json cap nhat lan cuoi ${FACTS.capNhatLanCuoi} (${ngay} ngay truoc). ` +
        'So danh gia Google chac chan da tang — vao Google Business Profile xem so that roi sua lai.'
    );
  }
}

// ------------------------------------------------------------------- bao cao
console.log('LUOI CANH SO LIEU — Tram Dung Chill');
console.log('='.repeat(60));
console.log(`Quet ${FILES.length} file.`);
console.log(`So mon dem tu menu-data.js: ${SO_MON}`);
console.log(`So danh gia Google (nguon chuan): ${dinhDangVN(FACTS.soDanhGiaGoogle)}`);
console.log('');
console.log('So lan khop tung phep kiem:');
for (const phep of PHEP_KIEM) {
  console.log(`  ${String(soLanKhop.get(phep.ten)).padStart(4)}  ${phep.ten}`);
}

if (warnings.length) {
  console.log('');
  console.log('CANH BAO:');
  for (const w of warnings) console.log('  ! ' + w);
}

if (errors.length) {
  console.log('');
  console.log(`SAI SO LIEU — ${errors.length} cho:`);
  console.log('-'.repeat(60));
  for (const e of errors) {
    console.log(`  ${e.file}:${e.dong}`);
    console.log(`      ${e.phep}`);
    console.log(`      -> ${e.lyDo}`);
  }
  console.log('');
  console.log('Sua cho sai, hoac neu so MOI la dung thi cap nhat data/facts.json.');
  process.exit(1);
}

console.log('');
console.log('SACH — moi con so tren web khop nguon chuan.');
process.exit(0);
