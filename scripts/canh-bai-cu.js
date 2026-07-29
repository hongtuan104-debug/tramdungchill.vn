#!/usr/bin/env node
/**
 * CANH BÀI ĐỂ LÂU KHÔNG CẬP NHẬT
 * ------------------------------
 * Vì sao cần: bài để lâu quá thì Google hạ dần, mà chẳng ai báo. Tiệm có 21
 * trang đang cho Google lập chỉ mục — không ai nhớ nổi trang nào sửa lần cuối
 * hồi nào. Lưới này soát mỗi tháng một lần rồi nhắn Zalo cho chủ.
 *
 * Chỉ xét 21 trang trong sitemap.xml. 122 bài mỏng đã gắn noindex thì kệ —
 * cố ý không cho lập chỉ mục thì cũ hay mới không quan trọng.
 *
 * Ngày lấy theo thứ tự: "dateModified" trong schema của trang → nếu trang
 * không có schema thì lấy <lastmod> trong sitemap.
 *
 * CÁCH CHẠY
 *   node scripts/canh-bai-cu.js              soát rồi nhắn Zalo (nếu có secret)
 *   node scripts/canh-bai-cu.js --kiem-tra   chỉ soát và in ra, không nhắn
 *
 * BIẾN MÔI TRƯỜNG (đặt trong GitHub → Settings → Secrets)
 *   ZALO_WEBHOOK_URL     địa chỉ đầy đủ của endpoint nhắn tin
 *   ZALO_WEBHOOK_SECRET  mật khẩu của endpoint đó
 *   SO_NGAY_TOI_DA       ngưỡng, mặc định 180 ngày (~6 tháng)
 *
 * MÃ THOÁT
 *   0 = không có bài nào cũ, HOẶC có mà đã nhắn Zalo được
 *   1 = có bài cũ mà KHÔNG nhắn được (chưa cài secret / nhắn hỏng) — cố tình
 *       báo rớt để GitHub gửi mail, chứ không im lặng coi như xong.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const GOC = path.resolve(__dirname, '..');
const MIEN = 'https://tramdungchill.vn';
const SO_NGAY_TOI_DA = Number(process.env.SO_NGAY_TOI_DA || 180);
const CHI_XEM = process.argv.includes('--kiem-tra');

function ngayHomNayVN() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

/** Số ngày từ `iso` tới hôm nay. Tính theo mốc trưa UTC để khỏi lệch múi giờ. */
function soNgayTuHomNay(iso) {
  const moc = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), 12);
  return Math.round((moc(ngayHomNayVN()) - moc(iso)) / 86400000);
}

function duongDanTuUrl(loc) {
  let duoi = loc.replace(MIEN, '').replace(/^\//, '');
  if (duoi === '' || duoi.endsWith('/')) duoi += 'index.html';
  return duoi;
}

function docTrang() {
  const xml = fs.readFileSync(path.join(GOC, 'sitemap.xml'), 'utf8');
  const khoi = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  return khoi.map((b) => {
    const loc = (b.match(/<loc>([^<]*)<\/loc>/) || ['', ''])[1].trim();
    const lastmod = (b.match(/<lastmod>([^<]*)<\/lastmod>/) || ['', ''])[1].trim();
    const duongDan = duongDanTuUrl(loc);

    let ngay = lastmod;
    let nguon = 'sitemap';
    let tieuDe = duongDan;

    const dayDu = path.join(GOC, duongDan);
    if (fs.existsSync(dayDu)) {
      const html = fs.readFileSync(dayDu, 'utf8');
      const dm = html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/);
      if (dm) { ngay = dm[1]; nguon = 'schema'; }
      const td = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (td) tieuDe = td[1].replace(/\s+/g, ' ').trim();
    }
    return { loc, duongDan, ngay, nguon, tieuDe };
  }).filter((t) => t.loc);
}

/** Rút gọn tiêu đề cho tin nhắn Zalo khỏi dài lê thê. */
function tieuDeNgan(td) {
  const cat = td.split(/\s[—|]\s/)[0].trim();
  return cat.length > 60 ? cat.slice(0, 57) + '…' : cat;
}

async function nhanZalo(tinNhan) {
  const diaChi = process.env.ZALO_WEBHOOK_URL;
  const matKhau = process.env.ZALO_WEBHOOK_SECRET;
  if (!diaChi || !matKhau) {
    console.error('⚠️  Chưa cài ZALO_WEBHOOK_URL / ZALO_WEBHOOK_SECRET → không nhắn được.');
    console.error('   Vào GitHub → Settings → Secrets and variables → Actions → New repository secret.');
    return false;
  }
  try {
    const traLoi = await fetch(diaChi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: matKhau, message: tinNhan }),
    });
    if (traLoi.ok) {
      console.log(`✅ Đã nhắn Zalo cho chủ tiệm (mã ${traLoi.status}).`);
      return true;
    }
    console.error(`❌ Nhắn Zalo hỏng — mã ${traLoi.status}.`);
    if (traLoi.status === 401) console.error('   401 = sai mật khẩu trong ZALO_WEBHOOK_SECRET.');
    if (traLoi.status === 404) console.error('   404 = sai đường dẫn trong ZALO_WEBHOOK_URL.');
    return false;
  } catch (e) {
    console.error(`❌ Không gọi được tới máy chủ Zalo: ${e.message}`);
    return false;
  }
}

function ghiTomTatChoGitHub(dong) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, dong.join('\n') + '\n');
}

async function main() {
  const trang = docTrang();
  if (trang.length === 0) {
    console.error('❌ sitemap.xml không có trang nào — sai cấu trúc.');
    process.exit(1);
  }

  const coNgay = trang.filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.ngay));
  const thieuNgay = trang.filter((t) => !/^\d{4}-\d{2}-\d{2}$/.test(t.ngay));

  const baiCu = coNgay
    .map((t) => ({ ...t, soNgay: soNgayTuHomNay(t.ngay) }))
    .filter((t) => t.soNgay > SO_NGAY_TOI_DA)
    .sort((a, b) => b.soNgay - a.soNgay);

  console.log(`Soát ${trang.length} trang trong sitemap · ngưỡng ${SO_NGAY_TOI_DA} ngày · hôm nay ${ngayHomNayVN()}\n`);
  coNgay
    .map((t) => ({ ...t, soNgay: soNgayTuHomNay(t.ngay) }))
    .sort((a, b) => b.soNgay - a.soNgay)
    .forEach((t) => {
      const dau = t.soNgay > SO_NGAY_TOI_DA ? '🔴' : '  ';
      console.log(`${dau} ${String(t.soNgay).padStart(4)} ngày  ${t.ngay} (${t.nguon})  ${t.duongDan}`);
    });

  if (thieuNgay.length > 0) {
    console.log('\n⚠️  Trang không đọc được ngày sửa (không có schema, sitemap cũng trống):');
    thieuNgay.forEach((t) => console.log(`   ${t.duongDan}`));
  }

  const tomTat = ['## Canh bài lâu chưa cập nhật', '',
    `- Soát: **${trang.length}** trang · ngưỡng **${SO_NGAY_TOI_DA}** ngày`,
    `- Quá hạn: **${baiCu.length}** trang`, ''];
  if (baiCu.length > 0) {
    tomTat.push('| Số ngày | Ngày sửa | Trang |', '|---:|---|---|');
    baiCu.forEach((t) => tomTat.push(`| ${t.soNgay} | ${t.ngay} | ${t.duongDan} |`));
  }
  ghiTomTatChoGitHub(tomTat);

  if (baiCu.length === 0) {
    console.log(`\n✅ Không trang nào quá ${SO_NGAY_TOI_DA} ngày.`);
    return;
  }

  const dong = [
    `🕸️ Website: ${baiCu.length} trang quá ${SO_NGAY_TOI_DA} ngày chưa cập nhật`,
    '',
  ];
  baiCu.slice(0, 15).forEach((t, i) => {
    dong.push(`${i + 1}. ${tieuDeNgan(t.tieuDe)} — ${t.soNgay} ngày`);
    dong.push(`   ${t.loc.replace('https://', '')}`);
  });
  if (baiCu.length > 15) dong.push(`… và ${baiCu.length - 15} trang nữa.`);
  dong.push('');
  dong.push('Bài để lâu quá thì Google hạ dần. Sửa số liệu / thêm ảnh mới / viết thêm đoạn rồi đẩy lên là ngày tự cập nhật.');
  const tinNhan = dong.join('\n');

  console.log('\n--- Tin nhắn sẽ gửi ---\n' + tinNhan + '\n-----------------------\n');

  if (CHI_XEM) {
    console.log('(chế độ --kiem-tra: không nhắn)');
    return;
  }

  const guiDuoc = await nhanZalo(tinNhan);
  if (!guiDuoc) {
    console.error('\n❌ Có bài cũ mà chưa báo được cho chủ → cố tình để workflow rớt cho GitHub gửi mail.');
    process.exit(1);
  }
}

main();
