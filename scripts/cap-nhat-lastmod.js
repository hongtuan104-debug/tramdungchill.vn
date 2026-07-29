#!/usr/bin/env node
/**
 * CẬP NHẬT NGÀY SỬA CỦA TRANG — chỉ khi nội dung chữ thật sự đổi
 * ---------------------------------------------------------------
 * Vì sao cần: ngày sửa đang khai TAY ở 3 chỗ và rất dễ quên:
 *   1. <lastmod> trong sitemap.xml
 *   2. "dateModified" trong schema JSON-LD của trang
 *   3. dòng chữ "Cập nhật 16/06/2026" hiển thị cho khách đọc
 * Quên sửa là Google tưởng trang đứng yên. (Ngày 29/07/2026: 12 trang trụ cột
 * khai 16/06 trong khi nội dung đã sửa cuối tháng 7.)
 *
 * Vì sao KHÔNG lấy thẳng ngày commit git: mỗi lần sửa CSS, đổi tên class, sửa
 * chú thích… git đều ghi ngày mới. Khai ngày mới mà chữ trên trang y hệt là
 * "làm mới giả" — Google nói rõ đừng làm vậy. Nên script chỉ so phần chữ mà
 * người đọc thật sự nhìn thấy: bỏ <script>, <style>, chú thích HTML và mọi thẻ.
 * Bỏ <script> cũng đồng thời bỏ luôn khối JSON-LD chứa dateModified — nếu không
 * thì đổi ngày lại làm dấu vân đổi theo, thành vòng lặp tự kích.
 *
 * Chỉ xét 21 trang nằm trong sitemap.xml (những trang đang cho Google lập chỉ
 * mục). 122 bài mỏng đã gắn noindex thì không đụng tới.
 *
 * CÁCH CHẠY
 *   node scripts/cap-nhat-lastmod.js              chạy thật (CI dùng cái này)
 *   node scripts/cap-nhat-lastmod.js --kiem-tra   chỉ xem, không ghi gì
 *   node scripts/cap-nhat-lastmod.js --khoi-tao   lần đầu: dò lịch sử git để
 *                                                 đặt lại ngày cho ĐÚNG, thay
 *                                                 vì gán đại ngày hôm nay
 *
 * MÃ THOÁT
 *   0 = xong (kể cả khi không có gì đổi)
 *   1 = sai cấu trúc (sitemap trỏ file không tồn tại, thiếu sitemap…) — lỗi
 *       thật, cần người sửa, không được nuốt.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const GOC = path.resolve(__dirname, '..');
const FILE_SITEMAP = path.join(GOC, 'sitemap.xml');
const FILE_DAU_VAN = path.join(GOC, 'data', 'dau-van-noi-dung.json');
const MIEN = 'https://tramdungchill.vn';

/** Số commit gần nhất được dò khi chạy --khoi-tao. */
const SO_COMMIT_DO = 40;

const doiSo = process.argv.slice(2);
const CHI_XEM = doiSo.includes('--kiem-tra');
const KHOI_TAO = doiSo.includes('--khoi-tao');

// ─────────────────────────── ngày giờ Việt Nam ───────────────────────────
// Lấy ngày theo múi giờ VN, KHÔNG cộng trừ 7 tiếng bằng tay (kiểu đó hay bị
// cộng hai lần khi máy chạy đã ở múi giờ khác).
function ngayHomNayVN() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

/** '2026-07-29' → '29/07/2026' (kiểu hiển thị cho khách đọc). */
function kieuNgayVN(iso) {
  const [nam, thang, ngay] = iso.split('-');
  return `${ngay}/${thang}/${nam}`;
}

// ─────────────────────────── dấu vân nội dung ───────────────────────────
/**
 * Rút phần CHỮ của trang — thứ mà người đọc hoặc máy tìm kiếm thật sự đọc:
 *   1. tiêu đề <title>
 *   2. các thẻ meta mang chữ (mô tả, og:, twitter:) — bỏ qua preload/CSS/icon
 *   3. khối schema JSON-LD (Google đọc nó, nên đổi số trong đó LÀ đổi nội dung)
 *   4. chữ trong <body>
 * Bỏ: chú thích HTML, <style>, và mã JavaScript thường — đổi mấy thứ đó không
 * phải "cập nhật bài".
 *
 * ⚠️ Phải cắt MỌI chỗ ghi ngày-đã-sửa ra khỏi phép so, gồm hai chỗ:
 *   - "dateModified" trong schema
 *   - dòng hiển thị <span class="blog-updated">Cập nhật 27/07/2026</span>
 * Không cắt thì chính việc đóng dấu ngày lại bị đếm là "có người sửa bài" →
 * lần chạy sau đổi ngày tiếp, thành vòng lặp tự kích. Riêng chế độ --khoi-tao
 * còn tệ hơn: nó dò lịch sử git, thấy đúng cái commit đóng dấu ngày rồi tưởng
 * đó là ngày sửa nội dung.
 * Ngày ĐĂNG (<time datetime>) thì GIỮ trong phép so — đó là dữ kiện thật của
 * bài, đổi nó là đổi nội dung.
 */
function chuHienThi(html) {
  const goc = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/(<span class="blog-updated">)[^<]*(<\/span>)/g, '$1$2')
    // Khối "Bài viết liên quan" và thanh bài trước/bài sau là ĐIỀU HƯỚNG, do máy
    // dựng từ danh sách bài — không phải nội dung của bài này. Đăng một bài mới
    // là 25 bài cũ đổi khối đó; tính vào dấu vân thì cả 25 bài bị đóng dấu "vừa
    // cập nhật" trong khi chữ nghĩa không đổi một dòng.
    .replace(/<nav class="blog-post-nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<section class="blog-related">[\s\S]*?<\/section>/gi, ' ');

  const schema = (goc.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [])
    .map((k) => k.replace(/<script[^>]*>|<\/script>/gi, ''))
    .join('\n')
    .replace(/"dateModified"\s*:\s*"[^"]*"\s*,?/g, ' ');

  const s = goc
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');

  const tieuDe = (s.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || ['', ''])[1];

  const meta = (s.match(/<meta[^>]*>/gi) || [])
    .filter((the) => /\b(name|property)=["'][^"']*(description|title|keywords)[^"']*["']/i.test(the))
    .map((the) => (the.match(/\bcontent=["']([\s\S]*?)["']/i) || ['', ''])[1])
    .join('\n');

  const than = (s.match(/<body[^>]*>([\s\S]*)<\/body>/i) || ['', s])[1];
  const chu = than.replace(/<[^>]+>/g, ' ');

  return [tieuDe, meta, schema, chu]
    .join('\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function dauVan(html) {
  return crypto.createHash('sha1').update(chuHienThi(html), 'utf8').digest('hex');
}

// ─────────────────────────── đọc sitemap ───────────────────────────
/** Đường dẫn file trên đĩa ứng với một URL trong sitemap. */
function duongDanTuUrl(loc) {
  let duoi = loc.replace(MIEN, '').replace(/^\//, '');
  if (duoi === '' || duoi.endsWith('/')) duoi += 'index.html';
  return duoi;
}

function docSitemap() {
  if (!fs.existsSync(FILE_SITEMAP)) {
    loi(`Không thấy ${path.relative(GOC, FILE_SITEMAP)}`);
  }
  const xml = fs.readFileSync(FILE_SITEMAP, 'utf8');
  const khoi = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  const trang = khoi.map((b) => {
    const loc = (b.match(/<loc>([^<]*)<\/loc>/) || ['', ''])[1].trim();
    const lastmod = (b.match(/<lastmod>([^<]*)<\/lastmod>/) || ['', ''])[1].trim();
    return { loc, lastmod, duongDan: duongDanTuUrl(loc) };
  });
  if (trang.length === 0) loi('sitemap.xml không có <url> nào — sai cấu trúc.');
  return { xml, trang };
}

/** Ghi lastmod mới vào đúng khối <url> của những URL trong bảng `ngayMoi`. */
function ganLastmod(xml, ngayMoi) {
  return xml.replace(/<url>[\s\S]*?<\/url>/g, (khoi) => {
    const loc = (khoi.match(/<loc>([^<]*)<\/loc>/) || ['', ''])[1].trim();
    const ngay = ngayMoi.get(loc);
    if (!ngay) return khoi;
    if (/<lastmod>[^<]*<\/lastmod>/.test(khoi)) {
      return khoi.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${ngay}</lastmod>`);
    }
    // Khối chưa có <lastmod> thì chèn ngay sau </loc>, giữ nguyên thụt đầu dòng.
    return khoi.replace(/(<loc>[^<]*<\/loc>)([ \t]*\r?\n)([ \t]*)/, `$1$2$3<lastmod>${ngay}</lastmod>$2$3`);
  });
}

// ─────────────────────────── sửa ngày trong trang ───────────────────────────
/**
 * Đổi ngày sửa ở 2 chỗ trong file HTML:
 *   - "dateModified" trong mọi khối JSON-LD
 *   - dòng hiển thị <span class="blog-updated">Cập nhật 16/06/2026</span>
 *     (giữ nguyên chữ "Cập nhật"/"Updated", chỉ thay con số ngày)
 */
function ganNgaySua(html, ngayISO) {
  let ra = html.replace(
    /("dateModified"\s*:\s*")(\d{4}-\d{2}-\d{2})(")/g,
    `$1${ngayISO}$3`,
  );
  ra = ra.replace(
    /(<span class="blog-updated">[^<]*?)(\d{1,2}\/\d{1,2}\/\d{4})/g,
    (_, dau) => dau + kieuNgayVN(ngayISO),
  );
  return ra;
}

// ─────────────────────────── dò lịch sử git (--khoi-tao) ───────────────────────────
function chayGit(doiSoGit) {
  return execFileSync('git', doiSoGit, { cwd: GOC, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

/** Dấu vân của file tại một commit. Trả null nếu commit đó chưa có file. */
function dauVanTaiCommit(sha, duongDan) {
  try {
    return dauVan(chayGit(['show', `${sha}:${duongDan}`]));
  } catch (_) {
    return null;
  }
}

/**
 * Ngày mà nội dung CHỮ của trang đổi lần gần nhất — dò ngược lịch sử git.
 * Trả null nếu không dò được (file chưa từng vào git).
 */
function ngayDoiChuGanNhat(duongDan) {
  let dong;
  try {
    dong = chayGit(['log', '--format=%H %ad', '--date=short', '-n', String(SO_COMMIT_DO), '--', duongDan])
      .trim().split('\n').filter(Boolean);
  } catch (_) {
    return null;
  }
  if (dong.length === 0) return null;

  const moc = dong.map((d) => {
    const [sha, ngay] = d.split(' ');
    return { sha, ngay, van: dauVanTaiCommit(sha, duongDan) };
  });

  // moc[0] mới nhất. Ngày cần tìm = commit mới nhất mà dấu vân khác commit ngay
  // trước đó (cũ hơn) — tức lần cuối cùng chữ trên trang thật sự đổi.
  for (let i = 0; i < moc.length - 1; i++) {
    if (moc[i].van !== moc[i + 1].van) return moc[i].ngay;
  }
  // Cả cửa sổ dò không thấy chữ đổi → lấy commit cũ nhất trong cửa sổ.
  return moc[moc.length - 1].ngay;
}

// ─────────────────────────── phụ ───────────────────────────
function loi(thongDiep) {
  console.error(`\n❌ ${thongDiep}\n`);
  process.exit(1);
}

function docDauVanCu() {
  if (!fs.existsSync(FILE_DAU_VAN)) return null;
  try {
    return JSON.parse(fs.readFileSync(FILE_DAU_VAN, 'utf8')).trang || {};
  } catch (e) {
    loi(`Đọc ${path.relative(GOC, FILE_DAU_VAN)} hỏng: ${e.message}`);
  }
}

// ─────────────────────────── chạy ───────────────────────────
function main() {
  const homNay = ngayHomNayVN();
  const { xml, trang } = docSitemap();
  const vanCu = docDauVanCu();
  const lanDau = vanCu === null;

  if (KHOI_TAO) {
    console.log(`Chế độ KHỞI TẠO — dò tối đa ${SO_COMMIT_DO} commit gần nhất của từng trang.`);
  }
  console.log(`Soát ${trang.length} trang trong sitemap. Hôm nay (giờ VN): ${homNay}\n`);

  const vanMoi = {};
  const ngayMoi = new Map();   // loc → ngày ISO cần ghi vào sitemap
  const urlDaDoi = [];
  const banGhi = [];
  let soLech = 0;              // sitemap lệch schema do sửa tay — chỉ vá, không báo IndexNow

  for (const t of trang) {
    const duongDanDay = path.join(GOC, t.duongDan);
    if (!fs.existsSync(duongDanDay)) {
      loi(`sitemap trỏ tới ${t.loc} nhưng không có file ${t.duongDan}`);
    }
    const html = fs.readFileSync(duongDanDay, 'utf8');
    const van = dauVan(html);

    let ngayDat = null;
    let lyDo = 'giữ nguyên';

    if (KHOI_TAO) {
      const ngayThat = ngayDoiChuGanNhat(t.duongDan);
      if (ngayThat && ngayThat !== t.lastmod) {
        ngayDat = ngayThat;
        lyDo = `đặt lại theo lịch sử git (đang khai ${t.lastmod || 'trống'})`;
      } else {
        lyDo = `lịch sử git khớp (${t.lastmod})`;
      }
    } else if (lanDau) {
      // Chưa có bảng dấu vân → chỉ lập bảng, KHÔNG đổi ngày hàng loạt.
      lyDo = 'lần đầu lập bảng dấu vân';
    } else if (vanCu[t.loc] !== van) {
      ngayDat = homNay;
      lyDo = vanCu[t.loc] ? 'nội dung chữ đã đổi' : 'trang mới vào sitemap';
    }

    if (ngayDat) {
      const suaRoi = ganNgaySua(html, ngayDat);
      if (!CHI_XEM) fs.writeFileSync(duongDanDay, suaRoi);
      // Tính lại dấu vân SAU khi sửa: dòng "Cập nhật …" hiển thị cũng là chữ,
      // không lưu bản mới thì lần chạy sau lại tưởng có người sửa bài.
      vanMoi[t.loc] = dauVan(suaRoi);
      ngayMoi.set(t.loc, ngayDat);
      urlDaDoi.push(t.loc);
      banGhi.push(`  ✏️  ${t.duongDan}  ${t.lastmod || '—'} → ${ngayDat}   (${lyDo})`);
    } else {
      vanMoi[t.loc] = van;
      // Lưới an toàn: nội dung không đổi, nhưng nếu ai sửa tay làm sitemap lệch
      // với schema của chính trang đó thì kéo sitemap về khớp. Lấy schema làm
      // chuẩn vì máy tạo bài (generate-blog-pages.js) cũng dựng sitemap từ đó.
      const trongSchema = (html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/) || ['', ''])[1];
      if (trongSchema && trongSchema !== t.lastmod) {
        ngayMoi.set(t.loc, trongSchema);
        soLech++;
        banGhi.push(`  ⚠️  ${t.duongDan}  sitemap ${t.lastmod || '—'} lệch schema ${trongSchema} → kéo sitemap về khớp`);
      } else {
        banGhi.push(`  ·   ${t.duongDan}  ${t.lastmod || '—'}   (${lyDo})`);
      }
    }
  }

  console.log(banGhi.join('\n'));

  if (ngayMoi.size > 0 && !CHI_XEM) {
    fs.writeFileSync(FILE_SITEMAP, ganLastmod(xml, ngayMoi));
  }

  if (!CHI_XEM) {
    fs.mkdirSync(path.dirname(FILE_DAU_VAN), { recursive: true });
    fs.writeFileSync(
      FILE_DAU_VAN,
      JSON.stringify({
        _ghiChu: 'Dấu vân phần CHỮ HIỂN THỊ của từng trang trong sitemap. Máy tự ghi — đừng sửa tay. Xem scripts/cap-nhat-lastmod.js.',
        capNhatLuc: homNay,
        trang: vanMoi,
      }, null, 2) + '\n',
    );
  }

  // Danh sách URL đã đổi để bước sau báo IndexNow.
  const fileDanhSach = process.env.FILE_URL_DOI || path.join(os.tmpdir(), 'url-da-doi.txt');
  if (!CHI_XEM) fs.writeFileSync(fileDanhSach, urlDaDoi.join('\n') + (urlDaDoi.length ? '\n' : ''));

  console.log('');
  if (soLech > 0) {
    console.log(`⚠️  Vá ${soLech} chỗ sitemap lệch schema (do sửa tay). Không báo IndexNow cho mấy chỗ này vì nội dung không đổi.`);
  }
  if (urlDaDoi.length === 0) {
    console.log('✅ Không trang nào đổi nội dung — không đụng ngày.');
  } else {
    console.log(`✅ ${urlDaDoi.length} trang được đặt lại ngày sửa:`);
    urlDaDoi.forEach((u) => console.log(`   ${u}`));
    if (!CHI_XEM) console.log(`\nDanh sách URL ghi ở: ${fileDanhSach}`);
  }
  if (CHI_XEM) console.log('\n(chế độ --kiem-tra: không ghi file nào)');
}

main();
