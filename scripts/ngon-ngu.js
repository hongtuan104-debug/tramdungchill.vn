/***
 * scripts/ngon-ngu.js — cấu hình web đa ngôn ngữ (21/10/2026, sếp Tuấn: "bài viết được dịch sẵn chứ
 * không phải Google dịch, nhiều ngôn ngữ lên").
 *
 * Tiếng Việt là bản GỐC ở địa chỉ cũ. Mỗi thứ tiếng khác là một bản dịch sẵn ở thư mục riêng
 * (/en/, /zh/…), do scripts/dich-trang.js sinh từ trang tiếng Việt + từ điển data/ban-dich/<mã>.json.
 * Google lập chỉ mục được từng thứ tiếng (trước đó nút EN đổi chữ bằng JS trên cùng URL nên Google
 * chỉ thấy tiếng Việt — xem mục hreflang trong CLAUDE.md).
 *
 * Dùng chung cho: dich-trang.js (sinh trang), generate-blog-pages.js (sitemap), cap-nhat-lastmod.js
 * (ngày sửa), seo-geo-verify.js (máy canh R33).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MIEN = 'https://tramdungchill.vn';

/* Thứ tự = thứ tự trong ô chọn ngôn ngữ. hreflang/htmlLang theo tài liệu Google (zh-Hans = Trung giản thể).
   "ten" viết bằng chính thứ tiếng đó (khách tìm tiếng của mình chứ không đọc tên tiếng Việt). */
const NGON_NGU = [
    { ma: 'vi', ten: 'Tiếng Việt', ngan: 'VI', html: 'vi', hreflang: 'vi', og: 'vi_VN', chuNgonNgu: 'Ngôn ngữ' },
    { ma: 'en', ten: 'English', ngan: 'EN', html: 'en', hreflang: 'en', og: 'en_US', chuNgonNgu: 'Language' },
    { ma: 'zh', ten: '中文', ngan: '中', html: 'zh-Hans', hreflang: 'zh-Hans', og: 'zh_CN', chuNgonNgu: '语言' },
    { ma: 'ko', ten: '한국어', ngan: '한', html: 'ko', hreflang: 'ko', og: 'ko_KR', chuNgonNgu: '언어' },
    { ma: 'ja', ten: '日本語', ngan: '日', html: 'ja', hreflang: 'ja', og: 'ja_JP', chuNgonNgu: '言語' },
    { ma: 'ru', ten: 'Русский', ngan: 'RU', html: 'ru', hreflang: 'ru', og: 'ru_RU', chuNgonNgu: 'Язык' },
    { ma: 'th', ten: 'ไทย', ngan: 'TH', html: 'th', hreflang: 'th', og: 'th_TH', chuNgonNgu: 'ภาษา' }
];
const MA_DICH = NGON_NGU.filter((n) => n.ma !== 'vi').map((n) => n.ma);   // thư mục bản dịch
const THEO_MA = Object.fromEntries(NGON_NGU.map((n) => [n.ma, n]));
const RE_THU_MUC_DICH = new RegExp('^(?:' + MA_DICH.join('|') + ')(?:/|$)');

/** 'zh-Hans' → 'zh'; 'vi-VN' → 'vi'. */
function maTuLang(lang) {
    const m = String(lang || 'vi').toLowerCase().split('-')[0];
    return THEO_MA[m] ? m : 'vi';
}

/* Phông cho chữ không phải Latin. Phông tự chứa (Inter/Playfair/Dancing Script) chỉ có Latin + tiếng
   Việt, nên chữ Hán/Hàn/Thái rơi về phông máy. Phải chọn phông theo ĐÚNG thứ tiếng: cùng một chữ Hán,
   tiếng Trung và tiếng Nhật vẽ khác nhau. Khai bằng :root:lang(…) (độ đặc hiệu 0,2,0) để thắng :root của
   style.css bất kể thứ tự nạp. Tiếng Nga dùng Arial/Roboto có sẵn chữ Kirin qua 'Inter Fallback'. */
const PHONG = {
    zh: { than: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Noto Sans CJK SC", "Source Han Sans SC"',
        tieuDe: '"Songti SC", "Noto Serif SC", "Noto Serif CJK SC", "Source Han Serif SC", "PingFang SC", "Microsoft YaHei"' },
    ja: { than: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", YuGothic, Meiryo, "Noto Sans JP", "Noto Sans CJK JP"',
        tieuDe: '"Hiragino Mincho ProN", "Yu Mincho", YuMincho, "Noto Serif JP", "Noto Serif CJK JP", "Hiragino Sans", Meiryo' },
    ko: { than: '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Noto Sans CJK KR"',
        tieuDe: '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Noto Sans CJK KR"' },
    th: { than: '"Sukhumvit Set", Thonburi, "Leelawadee UI", Leelawadee, "Noto Sans Thai", Tahoma',
        tieuDe: '"Sukhumvit Set", Thonburi, "Leelawadee UI", Leelawadee, "Noto Sans Thai", Tahoma' }
};
function cssPhong(ma) {
    const p = PHONG[ma];
    if (!p) return '';
    const sel = ':root:lang(' + ma + ')';
    let css = sel + '{--font-body:"Inter","Inter Fallback",' + p.than + ',sans-serif;' +
        '--font-display:"Playfair Display","Playfair Fallback",' + p.tieuDe + ',serif;' +
        '--font-accent:"Dancing Script","Dancing Script Fallback",' + p.tieuDe + ',cursive}';
    // Chữ nghiêng giả của chữ Hán/Hàn/Thái rất xấu (trình duyệt tự nghiêng hình) → giữ đứng.
    css += ':lang(' + ma + ') :is(em,i,cite,blockquote){font-style:normal}';
    if (ma === 'ko') css += ':lang(ko) body{word-break:keep-all;overflow-wrap:anywhere}';
    if (ma === 'ja' || ma === 'zh') css += ':lang(' + ma + ') body{line-break:strict;overflow-wrap:anywhere}';
    return '<style id="phong-ngon-ngu">' + css + '</style>';
}

/* ── Trang nguồn: mọi URL tiếng gốc trong sitemap (đang lập chỉ mục) ── */
function duongDanTuUrl(loc) {
    let p = loc.replace(MIEN, '').replace(/^\//, '');
    if (p === '' || p.endsWith('/')) p += 'index.html';
    return p;
}
function urlTuDuongDan(p) {
    p = p.replace(/\\/g, '/');
    if (p === 'index.html') return MIEN + '/';
    if (p.endsWith('/index.html')) return MIEN + '/' + p.slice(0, -'index.html'.length);
    return MIEN + '/' + p;
}
function laTrangDich(p) { return RE_THU_MUC_DICH.test(p.replace(/\\/g, '/').replace(/^\//, '')); }

/** Danh sách trang nguồn (tiếng Việt + 2 bài viết gốc tiếng Anh), đọc từ sitemap.xml. */
function trangNguon() {
    const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
    const ds = [];
    for (const m of sm.matchAll(/<loc>([^<]*)<\/loc>/g)) {
        const p = duongDanTuUrl(m[1]);
        if (laTrangDich(p)) continue;
        const abs = path.join(ROOT, p);
        if (!fs.existsSync(abs)) continue;
        const html = fs.readFileSync(abs, 'utf8');
        const lang = maTuLang((/<html[^>]*\blang="([^"]+)"/.exec(html) || [])[1]);
        ds.push({ duongDan: p, url: urlTuDuongDan(p), lang });
    }
    return ds;
}

/** Bản dịch của trang nguồn p sang mã ma: 'blog/x.html' → 'en/blog/x.html'. */
function duongDanDich(ma, p) { return ma + '/' + p; }

/* ── Ô chọn ngôn ngữ ──
   <details> để chạy được cả khi tắt JS (bấm là mở, không cần script). Nằm TRONG nav nên hàm dấu vân
   lastmod (bỏ qua <nav class="navbar|dip-nav">) không tính nó — đổi link ở đây không làm trang bị
   đóng dấu "Cập nhật". translate="no": tên các thứ tiếng không bao giờ được dịch. */
const MOC_DAU = '<!-- NGON-NGU:START (scripts/dich-trang.js sinh, đừng sửa tay) -->';
const MOC_CUOI = '<!-- NGON-NGU:END -->';
const GLOBE = '<svg class="lang-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';

/** lienKet: { vi: '/', en: '/en/', … } — mã nào thiếu thì về trang chủ thứ tiếng đó. */
function hopChonNgonNgu(maHienTai, lienKet) {
    const ht = THEO_MA[maHienTai] || THEO_MA.vi;
    const nhan = ht.chuNgonNgu + (ht.ma === 'en' ? '' : ' / Language') + ': ' + ht.ten;
    const li = NGON_NGU.filter((n) => n.ma === ht.ma || lienKet[n.ma] !== null).map((n) => {
        // null = thứ tiếng đó chưa có trang nào (đang dịch dở) → không hiện, khỏi dẫn khách vào trang 404
        const href = lienKet[n.ma] || (n.ma === 'vi' ? '/' : '/' + n.ma + '/');
        const ht2 = n.ma === ht.ma ? ' aria-current="true"' : '';
        return '<li><a href="' + href + '" hreflang="' + n.hreflang + '" lang="' + n.html + '"' + ht2 + '>' + n.ten + '</a></li>';
    }).join('');
    return MOC_DAU + '<details class="chon-ngon-ngu" translate="no"><summary class="lang-toggle" aria-label="' + nhan +
        '" title="' + nhan + '">' + GLOBE + '<span class="lang-text">' + ht.ngan + '</span></summary><ul class="ds-ngon-ngu">' +
        li + '</ul></details>' + MOC_CUOI;
}
const RE_HOP = /<!-- NGON-NGU:START[^>]*-->[\s\S]*?<!-- NGON-NGU:END -->/;

/* ── Từ điển ── */
const THU_MUC_TU_DIEN = path.join(ROOT, 'data', 'ban-dich');
function fileTuDien(ma) { return path.join(THU_MUC_TU_DIEN, ma + '.json'); }
function docTuDien(ma) {
    const f = fileTuDien(ma);
    if (!fs.existsSync(f)) return {};
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    return j.cau || {};
}
function ghiTuDien(ma, cau) {
    const sapXep = {};
    for (const k of Object.keys(cau).sort()) sapXep[k] = cau[k];
    fs.mkdirSync(THU_MUC_TU_DIEN, { recursive: true });
    const noiDung = JSON.stringify({
        _ghiChu: 'Từ điển dịch sẵn ' + THEO_MA[ma].ten + ' — khoá là câu tiếng gốc (thẻ thay bằng <a1>…), giá trị là bản dịch. ' +
            'Thêm/sửa bằng: node scripts/dich-trang.js --nap <file.json> ' + ma + '. Xem CLAUDE.md mục "Đa ngôn ngữ".',
        cau: sapXep
    }, null, 1) + '\n';
    // Ghi ra file tạm rồi đổi tên: đang có người mở đọc từ điển (Windows giữ khoá file) thì thử lại, không bao giờ
    // để lại file ghi dở — gặp lỗi "UNKNOWN: open" lúc nhiều người dịch cùng đọc ja.json (21/10/2026).
    const dich = fileTuDien(ma), tam = dich + '.tmp';
    fs.writeFileSync(tam, noiDung, 'utf8');
    for (let lan = 0; ; lan++) {
        try { fs.renameSync(tam, dich); return; }
        catch (e) {
            if (lan >= 20) throw e;
            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
        }
    }
}

/* Câu thuộc tin nhắn đặt bàn gửi cho QUÁN qua WhatsApp: nhân viên đọc → luôn tiếng Anh (sếp chốt
   21/10/2026: quán xác nhận khách nước ngoài bằng tin nhắn tiếng Anh). Trang tiếng Trung/Hàn… lấy
   bản tiếng Anh của đúng câu đó thay vì bản dịch thứ tiếng của trang. */
const LUON_TIENG_ANH = [
    /^\n*(Tên|SĐT|Ngày|Giờ|Số khách|Loại|Ghi chú|Công ty): $/,
    /^[^\p{L}]*ĐẶT (BÀN|TIỆC)/u,
    /^Không có$/,
    /^Em muốn đặt bàn ở Trạm Dừng Chill/
];
function laLuonTiengAnh(khoa) { return LUON_TIENG_ANH.some((re) => re.test(khoa)); }

/* Câu chỉ có tên riêng → giữ y nguyên ở mọi thứ tiếng, khỏi phải dịch. */
// "Zalo" cố ý KHÔNG có ở đây: trang tiếng nước ngoài đổi kênh liên hệ sang WhatsApp (sếp chốt 21/10/2026).
const GIU_NGUYEN = new Set(['Trạm Dừng Chill', 'Tiệm Nướng', 'TIỆM NƯỚNG', 'Tiệm Nướng Trạm Dừng Chill', 'Facebook',
    'TikTok', 'Instagram', 'Google Maps', 'YouTube', 'BBQ', 'Wi-Fi', 'WiFi']);

// ───────── liên hệ cho khách nước ngoài: WhatsApp thay Zalo, số có mã nước (sếp chốt 21/10/2026) ─────────
// Dùng ở hai nơi: trang dịch sẵn (dich-trang.js sinhTrang) và bài viết GỐC tiếng Anh ở /blog/ (cũng là trang cho khách
// nước ngoài, nhưng do generate-blog-pages.js sinh nên footer/khuôn bài vẫn mang link + icon Zalo).
// Icon WhatsApp (Simple Icons) — cùng hình với nút nổi trong js/fab-contact.js
const ICON_WHATSAPP = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
/**
 * Link Zalo của quán (thuộc tính href) → wa.me (bỏ tin điền sẵn tiếng Việt; trang dịch đã đổi trước kèm tin tiếng Anh) ·
 * trong thẻ <a> trỏ wa.me: icon chữ "Zalo" vẽ bằng <text> → icon WhatsApp, nhãn / aria-label / title "Zalo" → "WhatsApp" ·
 * tel:0989765070 → tel:+84… · số hiển thị "0989.765.070" → "+84 989 765 070". Chạy lại trên kết quả của chính nó không đổi gì.
 * Chỉ đụng thuộc tính href, KHÔNG đụng chuỗi JS (script nội tuyến tự ghép '…zalo.me/0989765070?text=' + tin).
 */
function lienHeNuocNgoai(html) {
    return html
        .replace(/href="https:\/\/zalo\.me\/0?989765070\/?(?:\?[^"]*)?"/g, 'href="https://wa.me/84989765070"')
        .replace(/(<a\s[^>]*href="https:\/\/wa\.me\/84989765070[^"]*"[^>]*>)([\s\S]*?)(<\/a>)/g, (m, mo, trong, dong) =>
            mo.replace(/(aria-label|title)="Zalo"/g, '$1="WhatsApp"') +
            trong.replace(/<svg\b[^>]*>\s*<text\b[^>]*>Zalo<\/text>\s*<\/svg>/g, ICON_WHATSAPP).replace(/\bZalo\b/g, 'WhatsApp') + dong)
        .replace(/href="tel:0989765070"/g, 'href="tel:+84989765070"')
        .split('0989.765.070').join('+84 989 765 070');
}

module.exports = {
    ROOT, MIEN, NGON_NGU, MA_DICH, THEO_MA, maTuLang, cssPhong, trangNguon, duongDanTuUrl, urlTuDuongDan, laTrangDich,
    duongDanDich, hopChonNgonNgu, RE_HOP, MOC_DAU, MOC_CUOI, docTuDien, ghiTuDien, fileTuDien, THU_MUC_TU_DIEN,
    laLuonTiengAnh, GIU_NGUYEN, lienHeNuocNgoai, ICON_WHATSAPP
};
