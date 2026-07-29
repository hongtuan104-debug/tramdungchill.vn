#!/usr/bin/env node
/**
 * BÁO CHO MÁY TÌM KIẾM BIẾT TRANG VỪA ĐỔI — qua IndexNow
 * ------------------------------------------------------
 * ⚠️ NÓI THẲNG CHO KHỎI KỲ VỌNG SAI:
 *   - Google KHÔNG dùng IndexNow. Lệnh "ping sitemap" của Google cũng đã bị
 *     khai tử từ 2023. Với Google chỉ còn cách để nó tự vào — sitemap có
 *     lastmod đúng đã là thứ tốt nhất mình làm được.
 *   - Bing, Yandex, Seznam, Naver, Yep thì có dùng.
 * Vậy vì sao vẫn đáng làm: Bing là kho dữ liệu cho ChatGPT Search và Copilot.
 * Đúng mục tiêu GEO của tiệm — được máy AI nhắc tên khi khách hỏi.
 *
 * Chìa khoá (key) của IndexNow là CÔNG KHAI theo thiết kế — nó nằm ở file
 * <key>.txt ngay gốc web để máy tìm kiếm vào đọc mà đối chiếu. Không phải mật
 * khẩu, để trong repo công khai là đúng.
 *
 * CÁCH CHẠY
 *   node scripts/bao-indexnow.js                          đọc danh sách URL từ
 *                                                          biến FILE_URL_DOI
 *   node scripts/bao-indexnow.js https://... https://...   báo tay vài URL
 *   node scripts/bao-indexnow.js --tat-ca                  báo hết URL trong sitemap
 *   node scripts/bao-indexnow.js --kiem-tra                chỉ in ra, không gửi
 *
 * MÃ THOÁT
 *   0 = gửi xong, hoặc không có URL nào cần báo
 *   1 = gửi hỏng sau khi đã thử lại — báo to cho chủ biết, không nuốt im lặng
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.resolve(__dirname, '..');
const MIEN_DAY_DU = 'https://tramdungchill.vn';
const TEN_MIEN = 'tramdungchill.vn';
const DIA_CHI_API = 'https://api.indexnow.org/indexnow';
const SO_LAN_THU = 3;

const doiSo = process.argv.slice(2);
const CHI_XEM = doiSo.includes('--kiem-tra');
const TAT_CA = doiSo.includes('--tat-ca');
const urlTruyenTay = doiSo.filter((d) => d.startsWith('http'));

/**
 * Tìm chìa khoá từ chính tên file <key>.txt ở gốc repo — để chìa khoá chỉ tồn
 * tại ở MỘT chỗ, khỏi cảnh sửa file này quên sửa file kia.
 */
function timChiaKhoa() {
  const ungVien = fs.readdirSync(GOC).filter((f) => /^[0-9a-f]{8,128}\.txt$/i.test(f));
  if (ungVien.length === 0) {
    console.error('❌ Không thấy file chìa khoá IndexNow ở gốc repo (dạng <key>.txt).');
    process.exit(1);
  }
  if (ungVien.length > 1) {
    console.error(`❌ Có ${ungVien.length} file chìa khoá ở gốc repo: ${ungVien.join(', ')}`);
    console.error('   Chỉ được để đúng một cái, không thì máy tìm kiếm đối chiếu lung tung.');
    process.exit(1);
  }
  const ten = ungVien[0];
  const khoaTheoTen = ten.replace(/\.txt$/i, '');
  const khoaTrongFile = fs.readFileSync(path.join(GOC, ten), 'utf8').trim();
  if (khoaTheoTen !== khoaTrongFile) {
    console.error(`❌ Tên file (${khoaTheoTen}) khác nội dung bên trong (${khoaTrongFile}).`);
    console.error('   IndexNow bắt buộc hai cái phải giống hệt nhau.');
    process.exit(1);
  }
  return { khoa: khoaTheoTen, viTri: `${MIEN_DAY_DU}/${ten}` };
}

function layDanhSachUrl() {
  if (urlTruyenTay.length > 0) return urlTruyenTay;

  if (TAT_CA) {
    const xml = fs.readFileSync(path.join(GOC, 'sitemap.xml'), 'utf8');
    return (xml.match(/<loc>([^<]*)<\/loc>/g) || []).map((m) => m.replace(/<\/?loc>/g, '').trim());
  }

  const file = process.env.FILE_URL_DOI || path.join(os.tmpdir(), 'url-da-doi.txt');
  if (!fs.existsSync(file)) {
    console.log(`Không thấy ${file} — coi như không có URL nào cần báo.`);
    return [];
  }
  return fs.readFileSync(file, 'utf8').split('\n').map((d) => d.trim()).filter(Boolean);
}

async function guiMotLan(than) {
  const traLoi = await fetch(DIA_CHI_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(than),
  });
  const noiDung = await traLoi.text().catch(() => '');
  return { ma: traLoi.status, noiDung: noiDung.slice(0, 500) };
}

async function main() {
  const url = layDanhSachUrl();
  if (url.length === 0) {
    console.log('✅ Không có trang nào đổi — khỏi báo.');
    return;
  }

  const ngoaiMien = url.filter((u) => !u.startsWith(MIEN_DAY_DU));
  if (ngoaiMien.length > 0) {
    console.error(`❌ Có URL không thuộc ${TEN_MIEN}: ${ngoaiMien.join(', ')}`);
    console.error('   IndexNow sẽ trả 422. Sửa danh sách trước đã.');
    process.exit(1);
  }

  const { khoa, viTri } = timChiaKhoa();
  const than = { host: TEN_MIEN, key: khoa, keyLocation: viTri, urlList: url };

  console.log(`Báo ${url.length} trang cho IndexNow (Bing/Yandex/Seznam/Naver — Google không dùng):`);
  url.forEach((u) => console.log(`   ${u}`));
  console.log(`Chìa khoá đối chiếu tại: ${viTri}\n`);

  if (CHI_XEM) {
    console.log('(chế độ --kiem-tra: không gửi)');
    console.log(JSON.stringify(than, null, 2));
    return;
  }

  let cuoiCung = null;
  for (let lan = 1; lan <= SO_LAN_THU; lan++) {
    try {
      const kq = await guiMotLan(than);
      cuoiCung = kq;
      // 200 = nhận rồi. 202 = nhận rồi, đang chờ đối chiếu chìa khoá.
      if (kq.ma === 200 || kq.ma === 202) {
        console.log(`✅ IndexNow nhận (mã ${kq.ma}).`);
        if (kq.ma === 202) {
          console.log('   Mã 202 = đang đợi nó vào đọc file chìa khoá. Bình thường ở lần báo đầu tiên.');
        }
        return;
      }
      // Mấy mã này thử lại không cứu được — sai chìa khoá / sai URL.
      if (kq.ma === 400 || kq.ma === 403 || kq.ma === 422) break;
      console.error(`   Lần ${lan}: mã ${kq.ma}, thử lại…`);
    } catch (e) {
      cuoiCung = { ma: 0, noiDung: e.message };
      console.error(`   Lần ${lan}: gọi hỏng (${e.message}), thử lại…`);
    }
    if (lan < SO_LAN_THU) await new Promise((r) => setTimeout(r, 3000 * lan));
  }

  console.error(`\n❌ Báo IndexNow không thành. Mã cuối: ${cuoiCung ? cuoiCung.ma : 'không rõ'}`);
  if (cuoiCung && cuoiCung.noiDung) console.error(`   Nó trả về: ${cuoiCung.noiDung}`);
  console.error('   Ý nghĩa: 403 = chìa khoá không đọc được ở gốc web · 422 = URL không thuộc miền');
  console.error('            429 = báo quá dày · 0 = không gọi ra được mạng ngoài');
  console.error('   Ngày sửa trên site VẪN đúng — chỉ là máy tìm kiếm chưa được báo sớm.');
  process.exit(1);
}

main();
