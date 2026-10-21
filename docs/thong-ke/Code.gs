/**
 * Thống kê truy cập tramdungchill.vn — web app Apps Script cấp số GA4 cho trang https://tramdungchill.vn/quan-tri/
 * Chép kiến trúc trang /quan-tri/ của xomleo.vn (quán cùng chủ, dựng 16/10/2026), đổi mã đo + sự kiện theo web này.
 *
 * Bản này nằm trong repo CÔNG KHAI để theo dõi thay đổi. KHÔNG ghi mật mã hay mã riêng nào vào đây:
 * mọi thứ riêng để ở Cài đặt dự án → Thuộc tính tập lệnh (Script properties):
 *   MAT_MA           mật mã vào trang /quan-tri/ (≥ 10 ký tự)
 *   GA4_PROPERTY_ID  số hiệu property GA4 (hàm kiemTra() tự tìm và tự ghi)
 *
 * Cần bật 2 dịch vụ nâng cao (Dịch vụ → +): Google Analytics Data API, Google Analytics Admin API.
 * Triển khai: Ứng dụng web, Thực thi với tư cách = Tôi, Ai có quyền truy cập = Bất kỳ ai.
 * Hướng dẫn đầy đủ: docs/thong-ke/HUONG-DAN.md
 *
 * Vì sao "Bất kỳ ai": trang tramdungchill.vn gọi bằng fetch, không mang đăng nhập Google theo. Lớp bảo vệ là
 * MAT_MA (so sánh qua SHA-256) + giới hạn 15 lần sai mỗi 15 phút cho cả script.
 * Script chỉ trả số tổng hợp (lượt xem, nguồn, trang, hành động), không có dữ liệu cá nhân nào.
 *
 * ⚠️ Đây là dự án Apps Script RIÊNG — KHÔNG dán vào dự án nhận đơn đặt bàn (deployment AKfycbz46uJ…).
 * Thêm dịch vụ Analytics vào dự án đó là phải cấp quyền lại + triển khai bản mới, lỡ tay là đơn đặt bàn rớt.
 */

const MA_DO_LUONG = 'G-2VFBZDY6CD';   // luồng web của tramdungchill.vn (docs/do-luong.md mục 1)
const PHIEN_BAN = '2026-10-16-tdc';
const KY_HOP_LE = [7, 28, 90];
// Đúng hợp đồng sự kiện ở docs/do-luong.md mục 3. Đơn đặt bàn = conversion_event_submit_lead_form (chỉ nổ khi
// đơn ĐÃ LƯU được, không tính đơn trùng — CLAUDE.md #35, #37). generate_lead chỉ có ở trang chủ nên không dùng.
// click_whatsapp: trang dịch sẵn tiếng nước ngoài dùng WhatsApp thay Zalo (21/10/2026)
const SU_KIEN = ['conversion_event_submit_lead_form', 'click_phone', 'click_zalo', 'click_whatsapp', 'click_facebook', 'click_directions'];
const SU_KIEN_DON = 'conversion_event_submit_lead_form';
const SAI_TOI_DA = 15;                  // lần sai mỗi cửa sổ 15 phút, tính chung cả script
const LUU_TAM_GIAY = 900;               // số liệu GA4 lưu tạm 15 phút (đỡ tốn hạn mức)

function doGet() {
  return traJson_({ ok: true, phienBan: PHIEN_BAN });
}

function doPost(e) {
  let yc;
  try { yc = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return traJson_({ loi: 'yeu-cau-hong' }); }
  const tt = PropertiesService.getScriptProperties();
  const matMa = tt.getProperty('MAT_MA');
  const propertyId = tt.getProperty('GA4_PROPERTY_ID');
  if (!matMa || !propertyId) return traJson_({ loi: 'chua-cai-dat' });

  const cache = CacheService.getScriptCache();
  const khoaSai = 'sai-' + Math.floor(Date.now() / 900000);
  const sai = Number(cache.get(khoaSai) || 0);
  if (sai >= SAI_TOI_DA) return traJson_({ loi: 'tam-khoa' });
  if (!bangNhau_(String(yc.matMa || ''), matMa)) {
    cache.put(khoaSai, String(sai + 1), 900);
    Utilities.sleep(1000);
    return traJson_({ loi: 'sai-mat-ma' });
  }

  const ky = KY_HOP_LE.indexOf(Number(yc.ky)) >= 0 ? Number(yc.ky) : 28;
  try {
    // Trang tự cập nhật mục "Ngay lúc này" mỗi phút bằng { chi: 'tgt' } — không kéo lại cả báo cáo kỳ
    if (yc.chi === 'tgt') return traJson_({ thoiGianThuc: thoiGianThuc_(propertyId, cache) });
    const khoa = 'so-' + ky;
    let so = JSON.parse(cache.get(khoa) || 'null');
    if (!so) {
      so = tongHop_(propertyId, ky);
      try { cache.put(khoa, JSON.stringify(so), LUU_TAM_GIAY); } catch (err) { /* quá 100 KB thì thôi không lưu tạm */ }
    }
    so.thoiGianThuc = thoiGianThuc_(propertyId, cache);
    so.online = so.thoiGianThuc.n30;
    return traJson_(so);
  } catch (err) {
    return traJson_({ loi: 'ga4', chiTiet: String((err && err.message) || err).slice(0, 300) });
  }
}

// ---------- GA4 ----------

function tongHop_(propertyId, ky) {
  const ten = 'properties/' + propertyId;
  const nay = { startDate: (ky - 1) + 'daysAgo', endDate: 'today', name: 'nay' };
  const truoc = { startDate: (2 * ky - 1) + 'daysAgo', endDate: ky + 'daysAgo', name: 'truoc' };
  const ds = (...cac) => cac.map((name) => ({ name }));
  const giam = (metricName) => [{ metric: { metricName }, desc: true }];
  const chiDon = { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: SU_KIEN_DON } } };

  // batchRunReports nhận tối đa 5 báo cáo mỗi lô
  const lo1 = AnalyticsData.Properties.batchRunReports({ requests: [
    { dateRanges: [nay, truoc], metrics: ds('activeUsers', 'newUsers', 'sessions', 'engagedSessions', 'screenPageViews', 'userEngagementDuration') },
    { dateRanges: [nay], dimensions: ds('date'), metrics: ds('activeUsers', 'screenPageViews'), orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 400 },
    { dateRanges: [nay, truoc], dimensions: ds('sessionSource', 'sessionMedium'), metrics: ds('sessions', 'activeUsers'), orderBys: giam('sessions'), limit: 80 },
    { dateRanges: [nay], dimensions: ds('pagePath'), metrics: ds('screenPageViews', 'activeUsers'), orderBys: giam('screenPageViews'), limit: 20 },
    { dateRanges: [nay, truoc], dimensions: ds('eventName'), metrics: ds('eventCount'),
      dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: SU_KIEN } } } },
  ] }, ten);
  const lo2 = AnalyticsData.Properties.batchRunReports({ requests: [
    { dateRanges: [nay], dimensions: ds('deviceCategory'), metrics: ds('activeUsers'), orderBys: giam('activeUsers') },
    { dateRanges: [nay], dimensions: ds('city'), metrics: ds('activeUsers'), orderBys: giam('activeUsers'), limit: 12 },
    { dateRanges: [nay], dimensions: ds('hour'), metrics: ds('activeUsers'), orderBys: [{ dimension: { dimensionName: 'hour' } }], limit: 24 },
    // Đơn đặt bàn đến từ nguồn nào, gửi ở trang nào (sổ đo lường: GA4 trả lời "khách đến từ đâu, trang nào ra đơn")
    { dateRanges: [nay], dimensions: ds('sessionSource', 'sessionMedium'), metrics: ds('eventCount'), dimensionFilter: chiDon, orderBys: giam('eventCount'), limit: 40 },
    { dateRanges: [nay], dimensions: ds('pagePath'), metrics: ds('eventCount'), dimensionFilter: chiDon, orderBys: giam('eventCount'), limit: 10 },
  ] }, ten);
  const r1 = lo1.reports || [], r2 = lo2.reports || [];

  const tong = {};
  for (const x of bang_(r1[0])) {
    tong[x.dateRange || 'nay'] = {
      nguoi: x.activeUsers || 0, nguoiMoi: x.newUsers || 0, phien: x.sessions || 0, phienTuongTac: x.engagedSessions || 0,
      luotXem: x.screenPageViews || 0, giayTuongTac: x.userEngagementDuration || 0,
    };
  }
  return {
    phienBan: PHIEN_BAN,
    capNhat: new Date().toISOString(),
    ky: ky,
    tong: tong,
    theoNgay: bang_(r1[1]).map((x) => ({ ngay: x.date, nguoi: x.activeUsers || 0, luotXem: x.screenPageViews || 0 })),
    nguon: bang_(r1[2]).map((x) => ({ nguon: x.sessionSource, kenh: x.sessionMedium, ky: x.dateRange || 'nay', phien: x.sessions || 0, nguoi: x.activeUsers || 0 })),
    trang: bang_(r1[3]).map((x) => ({ duong: x.pagePath, luotXem: x.screenPageViews || 0, nguoi: x.activeUsers || 0 })),
    hanhDong: bang_(r1[4]).map((x) => ({ su: x.eventName, ky: x.dateRange || 'nay', lan: x.eventCount || 0 })),
    thietBi: bang_(r2[0]).map((x) => ({ loai: x.deviceCategory, nguoi: x.activeUsers || 0 })),
    thanhPho: bang_(r2[1]).map((x) => ({ ten: x.city, nguoi: x.activeUsers || 0 })),
    theoGio: bang_(r2[2]).map((x) => ({ gio: Number(x.hour), nguoi: x.activeUsers || 0 })),
    donTheoNguon: bang_(r2[3]).map((x) => ({ nguon: x.sessionSource, kenh: x.sessionMedium, don: x.eventCount || 0 })),
    donTheoTrang: bang_(r2[4]).map((x) => ({ duong: x.pagePath, don: x.eventCount || 0 })),
  };
}

// Đổi một báo cáo GA4 thành mảng đối tượng { tenChieu: giá trị, tenChiSo: số }.
// Khi hỏi 2 khoảng ngày, GA4 tự thêm chiều "dateRange" (giá trị = name của khoảng) ở cuối.
function bang_(rep) {
  if (!rep) return [];
  const dh = (rep.dimensionHeaders || []).map((h) => h.name);
  const mh = (rep.metricHeaders || []).map((h) => h.name);
  return (rep.rows || []).map((r) => {
    const o = {};
    (r.dimensionValues || []).forEach((v, i) => { o[dh[i] || 'dateRange'] = v.value; });
    (r.metricValues || []).forEach((v, i) => { o[mh[i]] = Number(v.value); });
    return o;
  });
}

// Mục "Ngay lúc này" — giống báo cáo Tổng quan theo thời gian thực của GA4 (30 phút gần nhất). Lưu tạm 60 giây.
// Mỗi báo cáo chạy riêng: một báo cáo lỗi (vd. GA4 chưa hỗ trợ chiều firstUserSource ở thời gian thực) thì
// chỉ mục đó trống, phần còn lại vẫn hiện.
function thoiGianThuc_(propertyId, cache) {
  const daCo = cache.get('tgt');
  if (daCo) return JSON.parse(daCo);
  const ten = 'properties/' + propertyId;
  const p30 = [{ startMinutesAgo: 29, endMinutesAgo: 0 }];
  const chay = (body) => {
    try { return bang_(AnalyticsData.Properties.runRealtimeReport(body, ten)); } catch (err) { return null; }
  };
  const tong = (ds) => (ds && ds[0] ? ds[0].activeUsers || 0 : ds ? 0 : null);
  const giam = (metricName) => [{ metric: { metricName }, desc: true }];
  const theoPhut = chay({ dimensions: [{ name: 'minutesAgo' }], metrics: [{ name: 'activeUsers' }], minuteRanges: p30, limit: 30 });
  const trang = chay({ dimensions: [{ name: 'unifiedScreenName' }], metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }], minuteRanges: p30, orderBys: giam('screenPageViews'), limit: 10 });
  const thanhPho = chay({ dimensions: [{ name: 'city' }], metrics: [{ name: 'activeUsers' }], minuteRanges: p30, orderBys: giam('activeUsers'), limit: 10 });
  const nguon = chay({ dimensions: [{ name: 'firstUserSource' }], metrics: [{ name: 'activeUsers' }], minuteRanges: p30, orderBys: giam('activeUsers'), limit: 10 });
  const suKien = chay({ dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }], minuteRanges: p30,
    dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: SU_KIEN } } } });
  const kq = {
    luc: new Date().toISOString(),
    n30: tong(chay({ metrics: [{ name: 'activeUsers' }], minuteRanges: p30 })),
    n5: tong(chay({ metrics: [{ name: 'activeUsers' }], minuteRanges: [{ startMinutesAgo: 4, endMinutesAgo: 0 }] })),
    theoPhut: theoPhut && theoPhut.map((x) => ({ phut: Number(x.minutesAgo), nguoi: x.activeUsers || 0 })),
    trang: trang && trang.map((x) => ({ ten: x.unifiedScreenName, luotXem: x.screenPageViews || 0, nguoi: x.activeUsers || 0 })),
    thanhPho: thanhPho && thanhPho.map((x) => ({ ten: x.city, nguoi: x.activeUsers || 0 })),
    nguon: nguon && nguon.map((x) => ({ nguon: x.firstUserSource, nguoi: x.activeUsers || 0 })),
    suKien: suKien && suKien.map((x) => ({ su: x.eventName, lan: x.eventCount || 0 })),
  };
  try { cache.put('tgt', JSON.stringify(kq), 60); } catch (err) { /* bỏ qua */ }
  return kq;
}

// ---------- tiện ích ----------

function bangNhau_(a, b) {
  const bam = (s) => Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8);
  const ha = bam(a), hb = bam(b);
  let khac = 0;
  for (let i = 0; i < ha.length; i++) khac |= ha[i] ^ hb[i];
  return khac === 0;
}

function traJson_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- chạy tay trong trình soạn thảo: chọn kiemTra rồi bấm Chạy ----------

function kiemTra() {
  const tt = PropertiesService.getScriptProperties();
  let propertyId = tt.getProperty('GA4_PROPERTY_ID');

  if (!propertyId) {
    console.log('Đang tìm property GA4 có luồng web ' + MA_DO_LUONG + '…');
    const tom = AnalyticsAdmin.AccountSummaries.list({ pageSize: 200 });
    for (const tk of tom.accountSummaries || []) {
      for (const ps of tk.propertySummaries || []) {
        const luong = AnalyticsAdmin.Properties.DataStreams.list(ps.property, { pageSize: 50 });
        for (const s of luong.dataStreams || []) {
          const ma = s.webStreamData && s.webStreamData.measurementId;
          console.log('  ' + ps.displayName + ' (' + ps.property + '): ' + (ma || 'không phải luồng web'));
          if (ma === MA_DO_LUONG) propertyId = ps.property.split('/')[1];
        }
      }
    }
    if (!propertyId) {
      throw new Error('Tài khoản Google đang mở dự án này không xem được property chứa ' + MA_DO_LUONG +
        '. Mở dự án bằng tài khoản quản trị GA4 của quán, hoặc thêm tài khoản này vào GA4 với quyền Người xem.');
    }
    tt.setProperty('GA4_PROPERTY_ID', propertyId);
    console.log('Đã lưu GA4_PROPERTY_ID = ' + propertyId);
  } else {
    console.log('GA4_PROPERTY_ID đã có: ' + propertyId);
  }

  const matMa = tt.getProperty('MAT_MA');
  if (!matMa || matMa.length < 10) {
    throw new Error('Chưa có MAT_MA hoặc ngắn hơn 10 ký tự. Vào Cài đặt dự án → Thuộc tính tập lệnh, thêm MAT_MA.');
  }

  const so = tongHop_(propertyId, 7);
  const t = so.tong.nay || {};
  const don = so.donTheoNguon.reduce((s, x) => s + x.don, 0);
  console.log('Lấy thử 7 ngày: ' + (t.nguoi || 0) + ' người truy cập, ' + (t.luotXem || 0) + ' lượt xem trang, ' +
    don + ' đơn đặt bàn, ' + so.trang.length + ' trang, ' + so.nguon.length + ' dòng nguồn.');
  const tgt = thoiGianThuc_(propertyId, CacheService.getScriptCache());
  console.log('Thời gian thực: ' + tgt.n30 + ' người trong 30 phút, ' + tgt.n5 + ' người trong 5 phút' +
    (tgt.nguon ? '' : ' (GA4 không cho xem nguồn ở thời gian thực — mục đó sẽ trống)') + '.');
  console.log('Xong. Bước tiếp: Triển khai → Tùy chọn triển khai mới → Ứng dụng web (xem HUONG-DAN.md).');
}
