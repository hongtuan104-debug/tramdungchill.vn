#!/usr/bin/env node
/**
 * ĐO SỐ KHÁCH VÀO WEBSITE — tramdungchill.vn
 * ------------------------------------------------------------------
 * VÌ SAO CÓ FILE NÀY
 *   Web đã cắm 5 công cụ đo (Google Analytics, Google Ads, Meta Pixel,
 *   TikTok Pixel, Microsoft Clarity) nhưng KHÔNG có cách nào ĐỌC số ra.
 *   Mỗi lần hỏi "web có bao nhiêu khách" là phải mở trình duyệt xem tay,
 *   nên chẳng ai xem, nên không ai biết việc mình làm có ăn thua gì không.
 *
 * NÓ LÀM GÌ
 *   Dùng chìa khoá máy (service account) của chính chủ để gọi thẳng
 *   Google, lấy về:
 *     - Google Analytics : bao nhiêu người vào, xem bao nhiêu trang,
 *                          vào từ đâu, xem trang nào nhiều nhất
 *     - Search Console   : gõ từ khoá gì thì thấy quán, hiện ra bao nhiêu
 *                          lần, bao nhiêu người bấm vào, đứng hạng mấy
 *
 * 🔑 QUAN TRỌNG — VÌ SAO KHÔNG DÙNG THƯ VIỆN NGOÀI
 *   Kho website này là web tĩnh, không có node_modules. Nên file tự ký
 *   giấy thông hành (JWT) bằng bộ mã có sẵn của Node. Không cài gì thêm.
 *
 * CÁCH CHẠY
 *   node scripts/do-khach-vao-web.js            → 28 ngày gần nhất
 *   node scripts/do-khach-vao-web.js --ngay 90  → 90 ngày gần nhất
 *   node scripts/do-khach-vao-web.js --kiem-tra → chỉ kiểm quyền, không lấy số
 *
 * MÃ THOÁT
 *   0 = lấy được số
 *   1 = chưa có quyền / chưa bật API — in ra ĐÚNG việc cần làm, không đoán
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const MIEN = 'https://tramdungchill.vn/';
const DUONG_CHIA_KHOA = [
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
  path.join(os.homedir(), '.claude', 'google-credentials.json'),
].filter(Boolean);

const doiSo = process.argv.slice(2);
const CHI_KIEM = doiSo.includes('--kiem-tra');
const SO_NGAY = (() => {
  const i = doiSo.indexOf('--ngay');
  const n = i >= 0 ? parseInt(doiSo[i + 1], 10) : 28;
  return Number.isFinite(n) && n > 0 && n <= 365 ? n : 28;
})();

// ── Giấy thông hành ──────────────────────────────────────────────────────
function docChiaKhoa() {
  for (const p of DUONG_CHIA_KHOA) {
    if (p && fs.existsSync(p)) return { duong: p, khoa: JSON.parse(fs.readFileSync(p, 'utf8')) };
  }
  return null;
}

function b64url(x) {
  return Buffer.from(x).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Tự ký giấy thông hành rồi đổi lấy vé vào cửa.
 * Xin ĐÚNG hai quyền CHỈ-ĐỌC — không xin quyền ghi, để lỡ lộ cũng không sửa được gì.
 */
async function layVe(khoa) {
  const scope = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly',
  ].join(' ');

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(
    JSON.stringify({
      iss: khoa.client_email,
      scope,
      aud: khoa.token_uri,
      iat: now,
      exp: now + 3600,
    })
  );
  const chuKy = crypto
    .createSign('RSA-SHA256')
    .update(`${header}.${claim}`)
    .sign(khoa.private_key)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(khoa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claim}.${chuKy}`,
    }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.access_token) {
    return { loi: `đổi vé hỏng (HTTP ${res.status}): ${j.error_description || j.error || 'không rõ'}` };
  }
  return { ve: j.access_token };
}

async function goi(url, ve, than) {
  const res = await fetch(url, {
    method: than ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${ve}`, 'Content-Type': 'application/json' },
    body: than ? JSON.stringify(than) : undefined,
  });
  const text = await res.text();
  let j;
  try {
    j = JSON.parse(text);
  } catch {
    j = { raw: text.slice(0, 300) };
  }
  return { ok: res.ok, ma: res.status, j };
}

// ── Dịch lỗi Google sang tiếng người ─────────────────────────────────────
function dichLoi(ma, j, ten) {
  const msg = (j && j.error && (j.error.message || j.error.status)) || j?.raw || '';
  if (/has not been used|is disabled|SERVICE_DISABLED/i.test(msg)) {
    const link = (msg.match(/https:\/\/console\.developers\.google\.com\S*/) || [])[0];
    return {
      viec: `Bật ${ten} cho dự án Google`,
      cach: link ? `Mở đường dẫn này rồi bấm ENABLE:\n        ${link}` : 'Vào Google Cloud Console → APIs & Services → bật API này',
    };
  }
  if (ma === 403) {
    return {
      viec: `Cấp quyền XEM cho chìa khoá máy trong ${ten}`,
      cach: 'Thêm địa chỉ thư máy (in ở trên) làm người xem — xem hướng dẫn cuối bài',
    };
  }
  if (ma === 401) return { viec: 'Chìa khoá không hợp lệ', cach: 'Kiểm lại file chìa khoá' };
  return { viec: `${ten} trả lỗi ${ma}`, cach: msg.slice(0, 200) || 'không rõ' };
}

// ── Chạy ─────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n📊 ĐO SỐ KHÁCH VÀO WEBSITE — tramdungchill.vn\n');

  const ck = docChiaKhoa();
  if (!ck) {
    console.error('❌ Không thấy file chìa khoá máy.');
    console.error('   Tìm ở: ' + DUONG_CHIA_KHOA.join(' · '));
    process.exit(1);
  }
  console.log(`🔑 Chìa khoá : ${ck.khoa.client_email}`);
  console.log(`   Dự án     : ${ck.khoa.project_id}\n`);

  const { ve, loi } = await layVe(ck.khoa);
  if (loi) {
    console.error(`❌ ${loi}`);
    process.exit(1);
  }
  console.log('✅ Đổi được vé vào cửa Google.\n');

  const conThieu = [];

  // ── Google Analytics: xem có quyền vào kho số nào không ────────────────
  console.log('── Google Analytics ' + '─'.repeat(52));
  let propertyId = process.env.GA4_PROPERTY_ID || null;

  const ds = await goi('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', ve);
  if (!ds.ok) {
    const d = dichLoi(ds.ma, ds.j, 'Google Analytics Admin API');
    console.log(`   ❌ Chưa vào được. ${d.viec}`);
    console.log(`      → ${d.cach}\n`);
    conThieu.push(d);
  } else {
    const tk = ds.j.accountSummaries || [];
    if (tk.length === 0) {
      console.log('   ⚠️  Vào được API nhưng KHÔNG thấy kho số nào.');
      console.log('      → Nghĩa là chìa khoá chưa được thêm làm người xem trong Google Analytics.\n');
      conThieu.push({
        viec: 'Thêm chìa khoá máy làm người xem trong Google Analytics',
        cach: `Analytics → Admin → Property Access Management → dấu + → dán ${ck.khoa.client_email} → chọn quyền Viewer`,
      });
    } else {
      for (const a of tk) {
        console.log(`   Tài khoản: ${a.displayName}`);
        for (const p of a.propertySummaries || []) {
          console.log(`      • ${p.displayName}  (${p.property})`);
          if (!propertyId) propertyId = p.property.replace('properties/', '');
        }
      }
      console.log('');
    }
  }

  // ── Lấy số thật ────────────────────────────────────────────────────────
  if (propertyId && !CHI_KIEM) {
    const soLieu = await goi(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      ve,
      {
        dateRanges: [{ startDate: `${SO_NGAY}daysAgo`, endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
        ],
      }
    );
    if (soLieu.ok) {
      const r = soLieu.j.rows?.[0]?.metricValues || [];
      const n = (i) => (r[i] ? Math.round(Number(r[i].value)) : 0);
      console.log(`   📈 ${SO_NGAY} ngày gần nhất:`);
      console.log(`      Người vào web      : ${n(0).toLocaleString('vi-VN')}`);
      console.log(`      Lượt truy cập      : ${n(1).toLocaleString('vi-VN')}`);
      console.log(`      Lượt xem trang     : ${n(2).toLocaleString('vi-VN')}`);
      console.log(`      Ngồi lại trung bình: ${Math.round(n(3))} giây\n`);

      // ── Câu quan trọng nhất: có ai LIÊN HỆ không ──────────────────────
      // Đếm lượt khách vào mà không biết mấy người bấm đặt bàn thì vô nghĩa.
      const VIEC = {
        conversion_event_submit_lead_form: 'Gửi form đặt bàn',
        click_phone: 'Bấm gọi điện',
        click_zalo: 'Bấm nhắn Zalo',
        click_directions: 'Bấm xem chỉ đường',
        form_start: 'Bắt đầu điền form (chưa chắc gửi)',
      };
      const ev = await goi(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        ve,
        {
          dateRanges: [{ startDate: `${SO_NGAY}daysAgo`, endDate: 'today' }],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: 40,
        }
      );
      if (ev.ok && ev.j.rows?.length) {
        const map = new Map(ev.j.rows.map((r) => [r.dimensionValues[0].value, Number(r.metricValues[1].value)]));
        console.log('   💬 Khách LIÊN HỆ quán (số người):');
        for (const [ma, nhan] of Object.entries(VIEC)) {
          if (map.has(ma)) console.log(`      ${String(map.get(ma)).padStart(6)}  ${nhan}`);
        }
        const dat = map.get('conversion_event_submit_lead_form') || 0;
        const nguoi = n(0);
        if (nguoi > 0) {
          console.log(`\n      → Cứ ${Math.round(nguoi / Math.max(dat, 1)).toLocaleString('vi-VN')} người vào web thì 1 người gửi form đặt bàn`);
          console.log(`        (${((dat / nguoi) * 100).toFixed(2)}%)\n`);
        }
      }

      for (const [ten, chieu, so] of [
        ['Khách đến từ đâu', 'sessionDefaultChannelGroup', 'sessions'],
        ['Trang được xem nhiều nhất', 'pagePath', 'screenPageViews'],
      ]) {
        const t = await goi(
          `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
          ve,
          {
            dateRanges: [{ startDate: `${SO_NGAY}daysAgo`, endDate: 'today' }],
            dimensions: [{ name: chieu }],
            metrics: [{ name: so }],
            orderBys: [{ metric: { metricName: so }, desc: true }],
            limit: 8,
          }
        );
        if (t.ok && t.j.rows?.length) {
          console.log(`   ${ten}:`);
          for (const row of t.j.rows) {
            const nhan = row.dimensionValues[0].value || '(không rõ)';
            console.log(`      ${String(row.metricValues[0].value).padStart(7)}  ${nhan}`);
          }
          console.log('');
        }
      }
    } else {
      const d = dichLoi(soLieu.ma, soLieu.j, 'Google Analytics Data API');
      console.log(`   ❌ ${d.viec}\n      → ${d.cach}\n`);
      conThieu.push(d);
    }
  }

  // ── Search Console ─────────────────────────────────────────────────────
  console.log('── Google Search Console ' + '─'.repeat(47));
  const sc = await goi('https://searchconsole.googleapis.com/webmasters/v3/sites', ve);
  if (!sc.ok) {
    const d = dichLoi(sc.ma, sc.j, 'Search Console API');
    console.log(`   ❌ Chưa vào được. ${d.viec}`);
    console.log(`      → ${d.cach}\n`);
    conThieu.push(d);
  } else {
    const sites = sc.j.siteEntry || [];
    const cua = sites.find((s) => s.siteUrl === MIEN || s.siteUrl === `sc-domain:tramdungchill.vn`);
    if (!cua) {
      console.log('   ⚠️  Vào được API nhưng chìa khoá chưa được thêm vào trang web nào.');
      console.log(`      → Search Console → Settings → Users and permissions → Add user`);
      console.log(`        dán ${ck.khoa.client_email}, chọn quyền Full hoặc Restricted\n`);
      conThieu.push({
        viec: 'Thêm chìa khoá máy vào Search Console',
        cach: `Search Console → Settings → Users and permissions → Add user → ${ck.khoa.client_email}`,
      });
    } else if (!CHI_KIEM) {
      const hom = new Date();
      const tu = new Date(hom.getTime() - SO_NGAY * 86400000);
      const iso = (d) => d.toISOString().slice(0, 10);
      const q = await goi(
        `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(cua.siteUrl)}/searchAnalytics/query`,
        ve,
        { startDate: iso(tu), endDate: iso(hom), dimensions: ['query'], rowLimit: 15 }
      );
      if (q.ok && q.j.rows?.length) {
        console.log(`   🔍 ${SO_NGAY} ngày — khách gõ gì thì thấy quán:\n`);
        console.log('      hiện ra   bấm vào   hạng    từ khoá');
        for (const r of q.j.rows) {
          console.log(
            `      ${String(r.impressions).padStart(7)}  ${String(r.clicks).padStart(7)}   ${r.position.toFixed(1).padStart(5)}   ${r.keys[0]}`
          );
        }
        const tong = q.j.rows.reduce((a, r) => ({ i: a.i + r.impressions, c: a.c + r.clicks }), { i: 0, c: 0 });
        console.log(`\n      Cộng ${q.j.rows.length} từ khoá đầu: hiện ra ${tong.i.toLocaleString('vi-VN')} lần, ${tong.c.toLocaleString('vi-VN')} người bấm vào\n`);
      } else {
        console.log('   (chưa có số liệu trong khoảng này)\n');
      }
    }
  }

  // ── Kết ────────────────────────────────────────────────────────────────
  if (conThieu.length) {
    console.log('═'.repeat(70));
    console.log(`\n🔴 CÒN ${conThieu.length} VIỆC PHẢI LÀM BẰNG TAY (Google bắt buộc, không tự làm được):\n`);
    conThieu.forEach((d, i) => {
      console.log(`   ${i + 1}. ${d.viec}`);
      console.log(`      ${d.cach}\n`);
    });
    console.log(`   Địa chỉ thư máy cần dán: ${ck.khoa.client_email}\n`);
    process.exit(1);
  }

  console.log('✅ Lấy số xong.\n');
})().catch((e) => {
  console.error('❌ Hỏng:', e.message);
  process.exit(1);
});
