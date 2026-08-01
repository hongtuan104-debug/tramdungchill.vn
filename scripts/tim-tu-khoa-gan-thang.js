#!/usr/bin/env node
/**
 * TÌM TỪ KHOÁ "GẦN THẮNG" — tramdungchill.vn
 * ------------------------------------------------------------------
 * VÌ SAO CÓ FILE NÀY
 *   Đo ngày 01/08/2026: 100% từ khoá mang khách về đều là người ĐÃ BIẾT TÊN
 *   quán ("trạm dừng chill…"). Người chưa biết thì gõ "quán nướng đà lạt",
 *   "quán nướng view đẹp"… và quán KHÔNG có mặt.
 *
 *   Nhưng "không có mặt" và "có mặt ở trang 3" là hai chuyện khác hẳn nhau.
 *   Câu đang đứng hạng 12 thì đẩy lên trang 1 rẻ hơn nhiều so với câu đứng
 *   hạng 60. File này chỉ ra ĐÚNG những câu đang gần thắng, để khỏi đoán.
 *
 * NÓ LÀM GÌ
 *   Kéo TOÀN BỘ câu người ta gõ mà web mình có hiện ra (Search Console giữ
 *   16 tháng), tách riêng câu có tên quán và câu KHÔNG có tên quán, rồi xếp
 *   câu không-tên-quán theo mức độ đáng đánh.
 *
 * CÁCH CHẠY
 *   node scripts/tim-tu-khoa-gan-thang.js            90 ngày gần nhất
 *   node scripts/tim-tu-khoa-gan-thang.js --ngay 180
 *   node scripts/tim-tu-khoa-gan-thang.js --tat-ca   in cả câu có tên quán
 *
 * ⚠️ Cần chìa khoá máy đã được cấp quyền xem Search Console — xem
 *    docs/do-khach-vao-web.md nếu chạy ra lỗi quyền.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const TRANG_WEB = 'https://tramdungchill.vn/';
const DUONG_CHIA_KHOA = [
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
  path.join(os.homedir(), '.claude', 'google-credentials.json'),
].filter(Boolean);

/**
 * Cách nhận ra "câu có tên quán". Bỏ dấu rồi so, vì khách gõ đủ kiểu:
 * "tram dung chill", "trạm dừng chill", "tramdungchill", "trạm dừng chill đà lạt".
 */
const TU_TEN_QUAN = ['tram dung chill', 'tramdungchill', 'tram dung chil', 'trang dung chill', 'tram dung chill'];

const doiSo = process.argv.slice(2);
const IN_TAT_CA = doiSo.includes('--tat-ca');
const SO_NGAY = (() => {
  const i = doiSo.indexOf('--ngay');
  const n = i >= 0 ? parseInt(doiSo[i + 1], 10) : 90;
  return Number.isFinite(n) && n > 0 && n <= 480 ? n : 90;
})();

const boDau = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

const laTenQuan = (q) => {
  const t = boDau(q).replace(/\s+/g, ' ');
  const lien = t.replace(/\s/g, '');
  return TU_TEN_QUAN.some((k) => t.includes(k) || lien.includes(k.replace(/\s/g, '')));
};

function docChiaKhoa() {
  for (const p of DUONG_CHIA_KHOA) if (p && fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  return null;
}
const b64 = (x) => Buffer.from(x).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function layVe(khoa) {
  const now = Math.floor(Date.now() / 1000);
  const h = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const c = b64(
    JSON.stringify({
      iss: khoa.client_email,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: khoa.token_uri,
      iat: now,
      exp: now + 3600,
    })
  );
  const s = crypto
    .createSign('RSA-SHA256').update(`${h}.${c}`).sign(khoa.private_key)
    .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const r = await fetch(khoa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${h}.${c}.${s}` }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(j.error_description || j.error || 'không đổi được vé');
  return j.access_token;
}

/** Search Console trả tối đa 25.000 dòng mỗi lần — lật trang cho hết. */
async function keoHet(ve, dimensions, tu, den) {
  const ra = [];
  for (let batDau = 0; ; batDau += 25000) {
    const r = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(TRANG_WEB)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${ve}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: tu, endDate: den, dimensions, rowLimit: 25000, startRow: batDau }),
      }
    );
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error?.message || `HTTP ${r.status}`);
    const rows = j.rows || [];
    ra.push(...rows);
    if (rows.length < 25000) break;
  }
  return ra;
}

const so = (n) => Number(n).toLocaleString('vi-VN');

function inNhom(ten, giaiThich, ds, gioiHan = 25) {
  console.log(`\n${'═'.repeat(78)}`);
  console.log(`  ${ten}   (${ds.length} câu)`);
  console.log(`  ${giaiThich}`);
  console.log('═'.repeat(78));
  if (!ds.length) return console.log('   (không có câu nào)');
  console.log('   hiện ra   bấm vào   hạng   câu người ta gõ');
  for (const r of ds.slice(0, gioiHan)) {
    console.log(
      `   ${so(r.impressions).padStart(7)}   ${so(r.clicks).padStart(7)}   ${r.position.toFixed(1).padStart(4)}   ${r.keys[0]}`
    );
  }
  if (ds.length > gioiHan) console.log(`   … còn ${ds.length - gioiHan} câu nữa`);
}

(async () => {
  const khoa = docChiaKhoa();
  if (!khoa) {
    console.error('❌ Không thấy chìa khoá máy. Xem docs/do-khach-vao-web.md');
    process.exit(1);
  }
  const ve = await layVe(khoa);

  const den = new Date();
  const tu = new Date(den.getTime() - SO_NGAY * 86400000);
  const iso = (d) => d.toISOString().slice(0, 10);

  console.log(`\n🔍 TỪ KHOÁ CỦA tramdungchill.vn — ${SO_NGAY} ngày gần nhất\n`);

  const cau = await keoHet(ve, ['query'], iso(tu), iso(den));
  if (!cau.length) {
    console.error('❌ Không có dữ liệu. Kiểm quyền Search Console.');
    process.exit(1);
  }

  const tenQuan = cau.filter((r) => laTenQuan(r.keys[0]));
  const nguoiLa = cau.filter((r) => !laTenQuan(r.keys[0]));

  const cong = (ds, f) => ds.reduce((a, r) => a + r[f], 0);

  console.log('── BỨC TRANH CHUNG ' + '─'.repeat(58));
  console.log(`   Tổng số câu web có hiện ra        : ${so(cau.length)}`);
  console.log(`   Tổng lượt hiện ra                 : ${so(cong(cau, 'impressions'))}`);
  console.log(`   Tổng lượt khách bấm vào           : ${so(cong(cau, 'clicks'))}\n`);
  console.log(`   → Câu CÓ tên quán   : ${String(tenQuan.length).padStart(5)} câu · ${so(cong(tenQuan, 'clicks'))} lượt bấm  (khách đã biết mình)`);
  console.log(`   → Câu KHÔNG tên quán: ${String(nguoiLa.length).padStart(5)} câu · ${so(cong(nguoiLa, 'clicks'))} lượt bấm  (người LẠ — chỗ còn đất)`);

  const tyLe = cong(cau, 'clicks') ? ((cong(nguoiLa, 'clicks') / cong(cau, 'clicks')) * 100).toFixed(1) : '0';
  console.log(`\n   Người lạ chiếm ${tyLe}% số lượt bấm vào web.`);

  // ── Xếp câu người-lạ theo mức đáng đánh ────────────────────────────────
  const sx = (a, b) => b.impressions - a.impressions;
  const trongKhoang = (lo, hi) => nguoiLa.filter((r) => r.position >= lo && r.position < hi).sort(sx);

  inNhom(
    '🥇 ĐÃ Ở TRANG 1 (hạng 1–10) — GIỮ, đừng phá',
    'Mấy câu này đang chạy tốt. Sửa bài liên quan phải cẩn thận.',
    trongKhoang(1, 10.5)
  );

  inNhom(
    '🎯 GẦN THẮNG NHẤT (hạng 11–20) — ĐÁNH CÁI NÀY TRƯỚC',
    'Đang ở đầu trang 2. Đẩy một chút là lọt trang 1. Rẻ nhất, nhanh nhất.',
    trongKhoang(10.5, 20.5)
  );

  inNhom(
    '🌱 CÒN XA NHƯNG NHIỀU NGƯỜI TÌM (hạng 21–50)',
    'Cần làm nội dung tử tế mới lên được, nhưng đáng vì lượng tìm lớn.',
    trongKhoang(20.5, 50.5),
    20
  );

  inNhom(
    '🧊 RẤT XA (hạng trên 50)',
    'Coi như chưa có mặt. Chỉ đánh nếu là câu cực đáng tiền.',
    trongKhoang(50.5, 9999),
    12
  );

  // ── Câu nào HIỆN NHIỀU MÀ KHÔNG AI BẤM ────────────────────────────────
  const hienMaKhongBam = nguoiLa
    .filter((r) => r.impressions >= 50 && r.clicks === 0 && r.position <= 20)
    .sort(sx);
  inNhom(
    '👀 HIỆN RA NHIỀU MÀ KHÔNG AI BẤM (hạng ≤20, ≥50 lần hiện, 0 bấm)',
    'Google có cho mình hiện, nhưng tiêu đề / dòng mô tả chưa đủ hấp dẫn để khách bấm.',
    hienMaKhongBam,
    15
  );

  // ── Trang nào đang gánh ────────────────────────────────────────────────
  const trang = await keoHet(ve, ['page'], iso(tu), iso(den));
  console.log(`\n${'═'.repeat(78)}\n  📄 TRANG NÀO ĐANG KÉO KHÁCH VỀ   (${trang.length} trang)\n${'═'.repeat(78)}`);
  console.log('   hiện ra   bấm vào   hạng   trang');
  for (const r of trang.sort((a, b) => b.clicks - a.clicks).slice(0, 15)) {
    const p = r.keys[0].replace('https://tramdungchill.vn', '') || '/';
    console.log(`   ${so(r.impressions).padStart(7)}   ${so(r.clicks).padStart(7)}   ${r.position.toFixed(1).padStart(4)}   ${p}`);
  }

  console.log(`\n${'═'.repeat(78)}`);
  console.log('  💡 ĐỌC THẾ NÀO');
  console.log('     "hiện ra" = số lần web mình xuất hiện trên Google cho câu đó');
  console.log('     "bấm vào" = trong số đó có bao nhiêu người thật sự bấm');
  console.log('     "hạng"    = trung bình đứng thứ mấy (1–10 là trang 1)');
  console.log('═'.repeat(78) + '\n');
})().catch((e) => {
  console.error('❌ Hỏng:', e.message);
  process.exit(1);
});
