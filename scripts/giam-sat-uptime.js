#!/usr/bin/env node
/**
 * GIÁM SÁT UPTIME — web + đường nhận đơn đặt bàn
 * -----------------------------------------------
 * Vì sao cần: trước 19/10/2026 không máy nào canh web liên tục — web sập, form
 * đặt bàn rớt (bug #4) hay VPS báo Zalo chết thì chỉ biết khi có người tình cờ
 * phát hiện. Googlebot gặp lỗi 5xx / quá thời gian, nhất là ở robots.txt, là
 * giảm nhịp crawl.
 *
 * Mỗi lượt (workflow giam-sat-uptime.yml, ~15 phút/lần) gọi thử 8 mục. Mục nào
 * hỏng 3 lần liền (cách nhau 20 giây) mới tính là hỏng — một cú chớp mạng không
 * đáng báo. Báo động = mở một issue "[giam-sat] Sự cố: …" trong repo, gắn tên
 * chủ repo → GitHub gửi email. Lên lại thì bình luận "đã lên lại" + đóng issue.
 * Có secret ZALO_WEBHOOK_URL/ZALO_WEBHOOK_SECRET thì nhắn Zalo thêm (cùng cặp
 * secret với canh-bai-cu.js); không có thì thôi, email vẫn đi.
 *
 * Kèm 2 lời nhắc (cũng bằng issue): chứng chỉ HTTPS còn < 20 ngày (GitHub vốn tự
 * gia hạn từ lúc còn ~30 ngày — tụt dưới 20 là có chuyện) · tên miền còn ≤ 30
 * ngày. Hạn tên miền .vn KHÔNG tra tự động được (không có RDAP, iNET chặn API)
 * nên ghi tay ở HAN_TEN_MIEN — gia hạn xong thì sửa ngày ở đó.
 *
 * Giới hạn phải biết: máy kiểm chạy trên chính GitHub. GitHub sập toàn bộ thì
 * nó sập theo và không báo được; lịch chạy của Actions có lúc trễ cả tiếng.
 * Muốn lớp độc lập hẳn thì thêm UptimeRobot — xem docs/giam-sat-uptime.md.
 *
 * CÁCH CHẠY
 *   node scripts/giam-sat-uptime.js --thu    chỉ kiểm và in ra, không đụng GitHub/Zalo
 *   node scripts/giam-sat-uptime.js          (trong Actions) kiểm + mở/đóng issue
 *
 * BIẾN MÔI TRƯỜNG (Actions tự có GITHUB_TOKEN, GITHUB_REPOSITORY)
 *   ZALO_WEBHOOK_URL, ZALO_WEBHOOK_SECRET    tuỳ chọn
 *
 * MÃ THOÁT
 *   0 = kiểm xong (kể cả khi web đang hỏng — báo động nằm ở issue)
 *   1 = không mở/đóng được issue → cố tình rớt để GitHub gửi mail thay
 */

'use strict';

const fs = require('fs');
const path = require('path');
const tls = require('tls');

const GOC = path.resolve(__dirname, '..');
const MIEN = 'tramdungchill.vn';
const CHU_REPO = 'hongtuan104-debug';
const TIEN_TO = '[giam-sat]';
const CHI_THU = process.argv.includes('--thu');

// Đọc ở iNET 06/10/2026. Gia hạn xong thì sửa dòng này, issue nhắc tự đóng.
const HAN_TEN_MIEN = '2026-12-13';
const NHAC_TEN_MIEN_TRUOC = 30;
const NHAC_CHUNG_CHI_DUOI = 20;

const SO_LAN_THU = 3;
const CHO_GIUA_LAN = 20000;
const HET_GIO = 30000;
const UA = 'TDC-giam-sat-uptime/1.0 (+https://github.com/hongtuan104-debug/tramdungchill.vn)';

/** Địa chỉ Apps Script lấy từ đúng chỗ form đặt bàn dùng — đổi deployment là máy kiểm theo. */
function diaChiAppsScript() {
  const cfg = fs.readFileSync(path.join(GOC, 'data/site-config.js'), 'utf8');
  const m = cfg.match(/webhookUrl:\s*'([^']+)'/);
  if (!m) throw new Error('Không đọc được webhookUrl trong data/site-config.js');
  return m[1];
}

// Từ khoá chỉ trang THẬT mới có — trang đỗ tên miền hay bản build hỏng vẫn có
// thể trả 200. Đã thử 19/10/2026: trang 404 của site không chứa từ khoá nào.
function danhSachMuc() {
  return [
    { ten: 'Trang chủ', url: `https://${MIEN}/`, tuKhoa: 'id="bookingForm"' },
    { ten: 'Thực đơn', url: `https://${MIEN}/menu.html`, tuKhoa: 'MENU_FLIPBOOK:START' },
    { ten: 'Bài blog', url: `https://${MIEN}/blog/nuong-bbq-ngam-xe-lua.html`, tuKhoa: 'blog-post-body' },
    { ten: 'robots.txt', url: `https://${MIEN}/robots.txt`, tuKhoa: `Sitemap: https://${MIEN}/sitemap.xml` },
    { ten: 'sitemap.xml', url: `https://${MIEN}/sitemap.xml`, tuKhoa: '<urlset' },
    // doGet chỉ trả một dòng JSON — không ghi Sheet, không gửi Telegram.
    // Chỉ chứng minh deployment còn sống + còn quyền "Bất kỳ ai", KHÔNG chứng minh ghi đơn chạy.
    { ten: 'Form đặt bàn (Apps Script)', url: diaChiAppsScript(), tuKhoa: '"status":"ok"' },
    { ten: 'App nhận đơn', url: `https://app.${MIEN}/` },
    // Không có trang kiểm sức khoẻ: GET / trả 404, nhưng tiêu đề CORS mang
    // x-webhook-token là của đúng chương trình zalo-webhook (cổng 3457 cạnh bên là
    // dịch vụ khác, trả 404 với tiêu đề khác) → chứng minh tiến trình pm2 còn sống.
    // KHÔNG chứng minh OpenClaw → nhóm Zalo chạy.
    { ten: 'VPS báo Zalo', url: 'http://14.225.224.28:3456/', canTieuDe: ['access-control-allow-headers', 'x-webhook-token'] },
  ];
}

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

function gioVN(d = new Date()) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(d);
}

function ngayHomNayVN() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

/** Số ngày từ hôm nay tới `iso`. Tính theo mốc trưa UTC để khỏi lệch múi giờ. */
function soNgayToi(iso, homNay) {
  const moc = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), 12);
  return Math.round((moc(iso) - moc(homNay)) / 86400000);
}

const ngayVN = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

async function kiemHttp(muc) {
  const res = await fetch(muc.url, {
    headers: { 'user-agent': UA },
    redirect: 'follow',
    signal: AbortSignal.timeout(HET_GIO),
  });
  const than = await res.text();
  if (muc.canTieuDe) {
    const [ten, chua] = muc.canTieuDe;
    if (res.status >= 500) return `mã ${res.status}`;
    return (res.headers.get(ten) || '').toLowerCase().includes(chua) ? null : `trả ${res.status} nhưng không phải chương trình webhook (thiếu ${chua})`;
  }
  if (!res.ok) {
    const chan = res.headers.get('cf-mitigated') ? ' — Cloudflare đang chặn máy kiểm, có thể web vẫn chạy' : '';
    return `mã ${res.status}${chan}`;
  }
  if (muc.tuKhoa && !than.includes(muc.tuKhoa)) return `trả ${res.status} nhưng thiếu từ khoá ${muc.tuKhoa}`;
  return null;
}

async function kiemMot(muc) {
  let loi = null;
  for (let lan = 1; lan <= SO_LAN_THU; lan++) {
    const batDau = Date.now();
    try {
      loi = await kiemHttp(muc);
    } catch (e) {
      loi = e.name === 'TimeoutError' ? `quá ${HET_GIO / 1000} giây không trả lời` : `lỗi mạng (${e.cause?.code || e.message})`;
    }
    if (!loi) return { ten: muc.ten, ok: true, ms: Date.now() - batDau, lanThu: lan };
    if (lan < SO_LAN_THU) await ngu(CHO_GIUA_LAN);
  }
  return { ten: muc.ten, ok: false, loi, lanThu: SO_LAN_THU };
}

/** Máy kiểm tự mất mạng thì mọi mục đều đỏ — đừng báo động nhầm. */
async function mayKiemConMang() {
  for (let lan = 1; lan <= SO_LAN_THU; lan++) {
    try {
      const res = await fetch('https://www.google.com/generate_204', { signal: AbortSignal.timeout(HET_GIO) });
      if (res.status === 204) return true;
    } catch { /* thử lại */ }
    if (lan < SO_LAN_THU) await ngu(CHO_GIUA_LAN);
  }
  return false;
}

function soNgayChungChi() {
  return new Promise((xong) => {
    const s = tls.connect({ host: MIEN, port: 443, servername: MIEN, timeout: 15000 }, () => {
      const het = s.getPeerCertificate().valid_to;
      s.end();
      xong(het ? Math.floor((new Date(het) - Date.now()) / 86400000) : null);
    });
    s.once('timeout', () => { s.destroy(); xong(null); });
    s.once('error', () => xong(null));
  });
}

// ─── Issue: mở khi hỏng, đóng khi lên lại ──────────────────────────────────

function ghClient() {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) throw new Error('Thiếu GITHUB_REPOSITORY / GITHUB_TOKEN (chạy ngoài Actions thì dùng --thu)');
  const goi = async (method, duong, body) => {
    const res = await fetch(`https://api.github.com/repos/${repo}${duong}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'user-agent': UA,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`GitHub API ${method} ${duong} → ${res.status} ${await res.text()}`);
    return res.json();
  };
  return {
    async dangMo() {
      const ds = await goi('GET', '/issues?state=open&per_page=100&creator=' + encodeURIComponent('github-actions[bot]'));
      return ds.filter((i) => !i.pull_request && i.title.startsWith(TIEN_TO));
    },
    tao: (title, body) => goi('POST', '/issues', { title, body }),
    sua: (so, duLieu) => goi('PATCH', `/issues/${so}`, duLieu),
    binhLuan: (so, body) => goi('POST', `/issues/${so}/comments`, { body }),
    dong: (so) => goi('PATCH', `/issues/${so}`, { state: 'closed', state_reason: 'completed' }),
  };
}

async function nhanZalo(tinNhan) {
  const diaChi = process.env.ZALO_WEBHOOK_URL;
  const matKhau = process.env.ZALO_WEBHOOK_SECRET;
  if (!diaChi || !matKhau) return 'chưa cài secret Zalo — chỉ báo qua email';
  try {
    const res = await fetch(diaChi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: matKhau, message: tinNhan }),
      signal: AbortSignal.timeout(HET_GIO),
    });
    return res.ok ? 'đã nhắn Zalo' : `nhắn Zalo hỏng (mã ${res.status})`;
  } catch (e) {
    return `nhắn Zalo hỏng (${e.message})`;
  }
}

const DAU_HONG = /<!-- dang-hong: (.*?) -->/;

function bangKetQua(ketQua) {
  const dong = ['| Mục | Trạng thái |', '|---|---|'];
  for (const k of ketQua) dong.push(`| ${k.ten} | ${k.ok ? `✅ ${k.ms} ms` : `🔴 ${k.loi}`} |`);
  return dong.join('\n');
}

const HUONG_DAN = [
  '**Làm gì bây giờ** (chi tiết: `docs/giam-sat-uptime.md`, mục "Khi nhận báo động")',
  '1. Mở thử bằng 4G trên điện thoại — sập thật hay chỉ máy kiểm thấy.',
  '2. Trang web hỏng: xem githubstatus.com (Pages) và cloudflarestatus.com; vừa đổi gì trên Cloudflare thì quay lại bước trước.',
  '3. Form đặt bàn hỏng: Apps Script → Triển khai → deployment `AKfycbz46uJ…` còn quyền "Bất kỳ ai" không.',
  '4. App nhận đơn hỏng: dashboard Vercel. VPS hỏng: `pm2 status` trên VPS.',
].join('\n');

/**
 * Quyết định mở / sửa / đóng issue. Tách riêng để thử được bằng client giả.
 * Trả về danh sách việc đã làm (để in log).
 */
async function xuLy({ ketQua, ngayChungChi, homNay, gh, zalo, bayGio = new Date() }) {
  const viec = [];
  const mo = await gh.dangMo();
  const suCo = mo.find((i) => i.title.startsWith(`${TIEN_TO} Sự cố`));
  const hong = ketQua.filter((k) => !k.ok);
  const tap = hong.map((k) => k.ten).join(', ');

  if (hong.length > 0 && !suCo) {
    const kenh = await zalo(`🔴 Web Trạm Dừng Chill có sự cố (${gioVN(bayGio)}): ${tap}. Chi tiết trong email GitHub.`);
    await gh.tao(`${TIEN_TO} Sự cố: ${tap}`, [
      `@${CHU_REPO} máy giám sát thấy **${hong.length}/${ketQua.length} mục hỏng** lúc ${gioVN(bayGio)} (giờ VN), mỗi mục đã thử ${SO_LAN_THU} lần.`,
      '', bangKetQua(ketQua), '', HUONG_DAN, '',
      `Lên lại thì issue này tự đóng. Zalo: ${kenh}.`,
      `<!-- dang-hong: ${tap} -->`,
    ].join('\n'));
    viec.push(`mở issue sự cố (${tap})`);
  } else if (hong.length > 0 && suCo) {
    const cu = ((suCo.body || '').match(DAU_HONG) || [])[1];
    if (cu !== tap) {
      await gh.sua(suCo.number, {
        title: `${TIEN_TO} Sự cố: ${tap}`,
        body: (suCo.body || '').replace(DAU_HONG, `<!-- dang-hong: ${tap} -->`),
      });
      await gh.binhLuan(suCo.number, `Danh sách mục hỏng đổi lúc ${gioVN(bayGio)}: **${tap}**\n\n${bangKetQua(ketQua)}`);
      viec.push(`cập nhật issue #${suCo.number} (${cu} → ${tap})`);
    } else {
      viec.push(`issue #${suCo.number} vẫn mở, không đổi`);
    }
  } else if (suCo) {
    const phut = Math.round((bayGio - new Date(suCo.created_at)) / 60000);
    const kenh = await zalo(`✅ Web Trạm Dừng Chill đã lên lại (${gioVN(bayGio)}), sự cố kéo dài khoảng ${phut} phút.`);
    await gh.binhLuan(suCo.number, `✅ Cả ${ketQua.length} mục đã lên lại lúc ${gioVN(bayGio)} — sự cố kéo dài khoảng **${phut} phút** (tính từ lúc máy kiểm phát hiện). Zalo: ${kenh}.`);
    await gh.dong(suCo.number);
    viec.push(`đóng issue #${suCo.number} sau ${phut} phút`);
  }

  // Nhắc chứng chỉ — null nghĩa là không đọc được, việc đó các mục trang web đã báo.
  const nhacCC = mo.find((i) => i.title.startsWith(`${TIEN_TO} Nhắc: chứng chỉ`));
  if (ngayChungChi != null && ngayChungChi < NHAC_CHUNG_CHI_DUOI && !nhacCC) {
    await gh.tao(`${TIEN_TO} Nhắc: chứng chỉ HTTPS còn ${ngayChungChi} ngày`, [
      `@${CHU_REPO} chứng chỉ HTTPS của ${MIEN} còn **${ngayChungChi} ngày**.`,
      'GitHub Pages (hoặc Cloudflare nếu đã bật mây cam) vốn tự gia hạn từ lúc còn ~30 ngày — tụt dưới 20 ngày là quá trình tự gia hạn đang kẹt.',
      'Kiểm: `node scripts/kiem-cloudflare.js`; xem GitHub → Settings → Pages có báo lỗi chứng chỉ / DNS không.',
    ].join('\n'));
    viec.push(`mở nhắc chứng chỉ (${ngayChungChi} ngày)`);
  } else if (ngayChungChi != null && ngayChungChi >= NHAC_CHUNG_CHI_DUOI && nhacCC) {
    await gh.binhLuan(nhacCC.number, `✅ Chứng chỉ đã gia hạn — còn ${ngayChungChi} ngày.`);
    await gh.dong(nhacCC.number);
    viec.push(`đóng nhắc chứng chỉ #${nhacCC.number}`);
  }

  // Nhắc tên miền — hạn ghi tay, nên tiêu đề mang ngày để biết đang nhắc hạn nào.
  const conLai = soNgayToi(HAN_TEN_MIEN, homNay);
  const nhacTM = mo.find((i) => i.title.startsWith(`${TIEN_TO} Nhắc: tên miền`));
  if (conLai <= NHAC_TEN_MIEN_TRUOC && !nhacTM) {
    await gh.tao(`${TIEN_TO} Nhắc: tên miền hết hạn ${ngayVN(HAN_TEN_MIEN)}`, [
      `@${CHU_REPO} tên miền **${MIEN}** hết hạn **${ngayVN(HAN_TEN_MIEN)}** — còn **${conLai} ngày**.`,
      'Hết hạn là cả web biến mất khỏi Google lẫn khách. Gia hạn ở iNET (nên gia hạn nhiều năm + bật tự gia hạn).',
      `Gia hạn xong: sửa \`HAN_TEN_MIEN\` trong \`scripts/giam-sat-uptime.js\` sang ngày hết hạn mới rồi đẩy lên — issue này tự đóng.`,
    ].join('\n'));
    viec.push(`mở nhắc tên miền (còn ${conLai} ngày)`);
  } else if (conLai > NHAC_TEN_MIEN_TRUOC && nhacTM) {
    await gh.binhLuan(nhacTM.number, `✅ Hạn tên miền đã cập nhật thành ${ngayVN(HAN_TEN_MIEN)} (còn ${conLai} ngày).`);
    await gh.dong(nhacTM.number);
    viec.push(`đóng nhắc tên miền #${nhacTM.number}`);
  }

  return viec;
}

async function main() {
  const muc = danhSachMuc();
  const [ketQua, ngayChungChi] = await Promise.all([Promise.all(muc.map(kiemMot)), soNgayChungChi()]);
  const homNay = ngayHomNayVN();

  console.log(`Giám sát ${MIEN} · ${gioVN()} (giờ VN)\n`);
  for (const k of ketQua) {
    console.log(k.ok ? `✅ ${k.ten} — ${k.ms} ms${k.lanThu > 1 ? ` (lần ${k.lanThu})` : ''}` : `🔴 ${k.ten} — ${k.loi}`);
  }
  console.log(`\nChứng chỉ HTTPS: ${ngayChungChi == null ? 'không đọc được' : `còn ${ngayChungChi} ngày`}`);
  console.log(`Tên miền: hết hạn ${ngayVN(HAN_TEN_MIEN)} (ghi tay) — còn ${soNgayToi(HAN_TEN_MIEN, homNay)} ngày`);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, ['## Giám sát uptime', '', bangKetQua(ketQua), '',
      `Chứng chỉ còn ${ngayChungChi ?? '?'} ngày · tên miền còn ${soNgayToi(HAN_TEN_MIEN, homNay)} ngày`, ''].join('\n'));
  }

  if (CHI_THU) {
    console.log('\n(chế độ --thu: không mở/đóng issue, không nhắn Zalo)');
    return;
  }

  if (ketQua.some((k) => !k.ok) && !(await mayKiemConMang())) {
    console.log('\n⚠️  Máy kiểm không ra được Internet (google.com cũng không gọi được) → bỏ qua lượt này, không báo động.');
    return;
  }

  try {
    const viec = await xuLy({ ketQua, ngayChungChi, homNay, gh: ghClient(), zalo: nhanZalo });
    console.log('\n' + (viec.length ? viec.map((v) => `→ ${v}`).join('\n') : '→ không có gì phải báo'));
  } catch (e) {
    console.error(`\n❌ Không mở/đóng được issue: ${e.message}`);
    console.error('   Cố tình để workflow rớt cho GitHub gửi mail thay.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(`❌ ${e.stack || e.message}`);
    process.exit(1);
  });
}

module.exports = { xuLy, kiemMot, TIEN_TO, HAN_TEN_MIEN, NHAC_TEN_MIEN_TRUOC, NHAC_CHUNG_CHI_DUOI };
