#!/usr/bin/env node
/**
 * CẬP NHẬT NGÀY SỬA CỦA TRANG — chỉ khi nội dung chữ thật sự đổi
 * ---------------------------------------------------------------
 * Vì sao cần: ngày sửa đang khai TAY ở 4 chỗ và rất dễ quên:
 *   1. <lastmod> trong sitemap.xml
 *   2. "dateModified" trong schema JSON-LD của trang
 *   3. dòng chữ "Cập nhật 16/06/2026" hiển thị cho khách đọc
 *   4. "dateModified" trong data/blog-seo.js — NGUỒN mà scripts/generate-blog-pages.js
 *      đọc lại mỗi lần dựng bài
 * Quên sửa là Google tưởng trang đứng yên. (Ngày 29/07/2026: 12 trang trụ cột
 * khai 16/06 trong khi nội dung đã sửa cuối tháng 7.)
 *
 * ⚠️ CHỖ 4 LÀ BẮT BUỘC, ĐỪNG BỎ. Trước 31/07/2026 script chỉ ghi 3 chỗ đầu,
 * nên mỗi lần có người chạy `node scripts/generate-blog-pages.js` sau con bot
 * này là ngày bị KÉO LÙI về giá trị cũ trong blog-seo.js — âm thầm, không một
 * dòng cảnh báo, và sau đó 3 chỗ lại khớp nhau nên soát cũng không ra.
 * (Đã dính thật: quan-nuong-da-lat-view-nha-long, 30/07 → 27/07.)
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
const vm = require('vm');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const GOC = path.resolve(__dirname, '..');
const FILE_SITEMAP = path.join(GOC, 'sitemap.xml');
const FILE_DAU_VAN = path.join(GOC, 'data', 'dau-van-noi-dung.json');
const FILE_SEO = path.join(GOC, 'data', 'blog-seo.js');
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
    .replace(/"dateModified"\s*:\s*"[^"]*"\s*,?/g, ' ')
    // Bỏ mọi địa chỉ web trong schema. Đường dẫn file là chuyện xếp kho, không
    // phải chuyện người đọc đọc gì — sửa đường dẫn ảnh/logo mà bị tính là "bài
    // vừa cập nhật" thì 143 trang bị đóng dấu oan. Phần CHỮ trong schema (mô tả,
    // tên món, con số) vẫn giữ nguyên trong phép so.
    .replace(/"https?:\/\/[^"]*"/g, '""');

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

// ─────────────────── đóng ngày ngược vào NGUỒN data/blog-seo.js ───────────────────
/** 'https://tramdungchill.vn/blog/abc.html' → 'abc'. Trang không phải bài blog → null. */
function maBaiTuUrl(loc) {
  const m = loc.match(/\/blog\/([^/]+)\.html$/);
  return m ? m[1] : null;
}

/**
 * Ghi ngày sửa vào ĐÚNG khối của từng bài trong data/blog-seo.js.
 *
 * ⚠️ Vì sao phải cắt theo RANH GIỚI KHỐI chứ không dò thẳng "dateModified" ngay
 * sau tên bài: thứ tự trường trong mỗi khối KHÔNG cố định (bài
 * quan-an-gia-dinh-da-lat để dateModified ngay sau "lang", bài
 * top-quan-nuong-da-lat để sau "author"). Dò kiểu lười `[\s\S]*?` mà gặp bài
 * thiếu trường là nó chạy tuột sang bài kế rồi sửa nhầm ngày của bài đó.
 *
 * Mốc một bài trụ cột = dòng thụt đúng 4 dấu cách, giá trị là một khối `{`.
 * Mục trong `noindex` cũng thụt 4 dấu cách nhưng giá trị là chuỗi nên không dính.
 *
 * Trả { raMoi, thieu } — `thieu` là mã những bài KHÔNG đặt được ngày (không có
 * khối trong pillars, hoặc khối không có ô "dateModified").
 */
function ganNgayVaoNguon(noiDung, ngayTheoMa) {
  const moc = [...noiDung.matchAll(/^ {4}"([^"]+)"\s*:\s*\{[ \t]*$/gm)]
    .map((m) => ({ ma: m[1], dau: m.index }));
  moc.forEach((k, i) => { k.het = i + 1 < moc.length ? moc[i + 1].dau : noiDung.length; });

  const thieu = [];
  const manh = [];
  let cuoi = 0;

  // Đi theo thứ tự xuất hiện trong file để nối chuỗi một lượt, không lệch chỉ số.
  for (const k of moc) {
    if (!ngayTheoMa.has(k.ma)) continue;
    const khoi = noiDung.slice(k.dau, k.het);
    if (!/"dateModified"\s*:\s*"\d{4}-\d{2}-\d{2}"/.test(khoi)) { thieu.push(k.ma); continue; }
    manh.push(noiDung.slice(cuoi, k.dau));
    manh.push(khoi.replace(
      /("dateModified"\s*:\s*")\d{4}-\d{2}-\d{2}(")/,
      `$1${ngayTheoMa.get(k.ma)}$2`,
    ));
    cuoi = k.het;
  }
  manh.push(noiDung.slice(cuoi));

  const coKhoi = new Set(moc.map((k) => k.ma));
  for (const ma of ngayTheoMa.keys()) if (!coKhoi.has(ma)) thieu.push(ma);

  return { raMoi: manh.join(''), thieu };
}

/** Đọc lại file vừa dựng bằng chính lối máy tạo bài đọc, đối chiếu từng ngày. */
function kiemNguonSauKhiSua(raMoi, ngayTheoMa, soKhoiCu) {
  const hop = {};
  try {
    vm.runInNewContext(raMoi + '\n;this.BLOG_SEO = BLOG_SEO;', hop);
  } catch (e) {
    return `data/blog-seo.js sau khi sửa KHÔNG đọc được nữa: ${e.message}`;
  }
  const tru = (hop.BLOG_SEO || {}).pillars;
  if (!tru) return 'data/blog-seo.js sau khi sửa không còn khối pillars';
  if (Object.keys(tru).length !== soKhoiCu) {
    return `số bài trụ cột đổi từ ${soKhoiCu} thành ${Object.keys(tru).length} — sửa hỏng file`;
  }
  for (const [ma, ngay] of ngayTheoMa) {
    if (!tru[ma]) return `mất bài ${ma} khỏi pillars sau khi sửa`;
    if (tru[ma].dateModified !== ngay) {
      return `bài ${ma} đáng lẽ ${ngay} nhưng đọc lại ra ${tru[ma].dateModified}`;
    }
  }
  return null;
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
  const ghiSau = [];           // [đường dẫn, nội dung] — chỉ ghi sau khi kiểm xong nguồn
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
      // Gom lại, ghi ở cuối. Phải đợi kiểm xong data/blog-seo.js mới được ghi:
      // ghi HTML rồi mới phát hiện nguồn không nhận được ngày là để lại đúng cái
      // lệch mà bản vá này sinh ra để dẹp.
      ghiSau.push([duongDanDay, suaRoi]);
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

  // ── Đóng ngày mới ngược vào NGUỒN data/blog-seo.js ──
  // Bắt buộc, và phải làm TRƯỚC mọi lệnh ghi khác: thiếu bước này thì lần kế có
  // ai chạy generate-blog-pages.js là ngày bị kéo lùi về giá trị cũ, âm thầm.
  const ngayNguon = new Map();
  for (const [loc, ngay] of ngayMoi) {
    const ma = maBaiTuUrl(loc);
    if (ma) ngayNguon.set(ma, ngay);
  }

  let nguonMoi = null;
  if (ngayNguon.size > 0) {
    const nguonCu = fs.readFileSync(FILE_SEO, 'utf8');
    const soKhoiCu = (nguonCu.match(/^ {4}"[^"]+"\s*:\s*\{[ \t]*$/gm) || []).length;
    const { raMoi, thieu } = ganNgayVaoNguon(nguonCu, ngayNguon);

    if (thieu.length) {
      loi(
        `${thieu.length} bài đổi ngày nhưng KHÔNG có ô "dateModified" trong data/blog-seo.js: ` +
        `${thieu.join(', ')}\n   Thêm ô đó vào khối của bài rồi chạy lại. Bỏ qua là ngày sẽ bị ` +
        'generate-blog-pages.js kéo lùi, không ai thấy. (Chưa ghi file nào.)',
      );
    }
    // Thay ngày ISO bằng ngày ISO thì độ dài file KHÔNG được đổi — lệch là sửa trúng chỗ khác.
    if (raMoi.length !== nguonCu.length) {
      loi(`sửa data/blog-seo.js làm đổi độ dài file (${nguonCu.length} → ${raMoi.length}) — dừng, chưa ghi file nào.`);
    }
    const hong = kiemNguonSauKhiSua(raMoi, ngayNguon, soKhoiCu);
    if (hong) loi(`${hong} — dừng, chưa ghi file nào.`);

    nguonMoi = raMoi;
  }

  if (!CHI_XEM) {
    if (nguonMoi !== null) fs.writeFileSync(FILE_SEO, nguonMoi);
    for (const [duongDanDay, noiDung] of ghiSau) fs.writeFileSync(duongDanDay, noiDung);
  }

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
  if (ngayNguon.size > 0) {
    console.log(`📌 Đóng ngày mới vào nguồn data/blog-seo.js cho ${ngayNguon.size} bài — máy tạo bài dựng lại sẽ ra đúng ngày này.`);
  }
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
