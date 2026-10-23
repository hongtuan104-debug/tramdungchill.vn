#!/usr/bin/env node
/***
 * dich-trang.js — sinh TRANG DỊCH SẴN cho 6 thứ tiếng (21/10/2026, sếp Tuấn: "bài viết được dịch sẵn
 * chứ không phải Google dịch, nhiều ngôn ngữ lên").
 *
 * Mỗi trang đang lập chỉ mục (đọc từ sitemap.xml) được dịch sang en, zh, ko, ja, ru, th và ghi ra
 * /<mã>/<đường dẫn cũ> — /en/, /en/menu.html, /zh/blog/hen-ho-da-lat.html… Trang dịch = trang tiếng
 * Việt ĐÃ BUILD XONG (đủ nav, footer, vân tay CSS/JS, critical CSS) + thay chữ theo từ điển
 * data/ban-dich/<mã>.json. Nên sửa giao diện / chữ tiếng Việt xong chỉ cần build lại là bản dịch
 * đi theo; câu tiếng Việt nào đổi thì máy báo "thiếu câu" ở đúng câu đó.
 *
 * Từ điển: khoá = câu tiếng gốc đã chuẩn hoá (thẻ nội dòng thay bằng <a1>…</a1>), giá trị = bản dịch.
 * Câu chỉ khác chữ số (ngày "Cập nhật", số đánh giá) tự suy từ bản dịch cũ, không phải dịch lại.
 *
 * Ngoài trang dịch, script còn: ghi dist/chu-<mã>.js (chữ JS gán lúc chạy: thông báo form, thanh đặt
 * bàn…), dist/bai-viet-<mã>.js (danh sách bài cho trang Blog), điền ô chọn ngôn ngữ trên MỌI trang
 * (cả trang tiếng Việt), và khai cụm hreflang hai chiều trong sitemap.xml (hreflang chỉ khai ở đó — R13d).
 *
 * CÁCH CHẠY
 *   node scripts/dich-trang.js                  sinh tất cả (bundle-js.js + generate-blog-pages.js gọi sẵn)
 *   node scripts/dich-trang.js --bao-cao        chỉ in câu còn thiếu theo thứ tiếng / trang, không ghi gì
 *   node scripts/dich-trang.js --xuat <mã> <thư mục>   xuất câu thiếu ra các file JSON để dịch
 *   node scripts/dich-trang.js --nap <file> <mã>       nạp bản dịch (kiểm chỗ giữ chỗ, chữ số, từ cấm)
 *
 * Trang dịch CHƯA có file mà còn thiếu câu → không sinh (khỏi đưa trang dở lên web). Trang ĐÃ có file
 * mà nay thiếu câu (tiếng Việt vừa đổi) → vẫn sinh lại, câu thiếu tạm lấy bản tiếng Anh, và máy canh
 * R33 trong seo-geo-verify.js báo đỏ cho tới khi dịch đủ — không để trang dịch giữ số liệu cũ.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const P = require('./dich/phan-tich');
const N = require('./ngon-ngu');
const mua = require('./mua-le');
const { bamFile } = require('./van-tay');

const ROOT = N.ROOT;
const MIEN = N.MIEN;
const VN = /[ạảãàáâậầấẩẫăắằặẳẵóòọõỏôộổỗồốơờớợởỡéèẻẹẽêếềệểễúùủũụưứừựửữíìỉĩịýỳỷỹỵđ]/i;
const BS = String.fromCharCode(92);

// ───────────────────────── dữ liệu nền ─────────────────────────
function docTranslations() {
    const ctx = {};
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'data/translations.js'), 'utf8') + '\n;this.T = TRANSLATIONS;', ctx);
    return ctx.T;
}
const TRANS = docTranslations();

/* Khoá bản dịch mà JS đọc lúc chạy (t('…'), TRANSLATIONS[lang]['…'], data-i18n do JS gắn): quét chuỗi
   trong js/*.js + mẫu bài blog, giữ chuỗi nào trùng tên khoá. Chỉ các khoá này đi vào dist/chu-<mã>.js
   và chỉ chúng được giữ data-i18n trên trang dịch (còn lại chữ đã dịch sẵn trong HTML). */
function khoaChayLuc() {
    const tap = new Set();
    const nguon = fs.readdirSync(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js')).map((f) => path.join(ROOT, 'js', f))
        .concat([path.join(ROOT, 'templates/blog-post.html')]);
    for (const f of nguon) {
        const s = fs.readFileSync(f, 'utf8');
        for (const m of s.matchAll(/['"]([a-z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+)['"]/g)) if (TRANS.vi[m[1]] !== undefined) tap.add(m[1]);
    }
    // chữ mùa đè lên các khoá này (data/mua-le.json)
    for (const t of mua.TEN_MUA) for (const k of Object.keys(mua.CAU_HINH[t].chu || {})) tap.add(k);
    return [...tap].sort();
}
const KHOA_CHAY = khoaChayLuc();

// ───────────────────────── tra từ điển ─────────────────────────
const TU_DIEN = {};
for (const ma of N.MA_DICH) TU_DIEN[ma] = N.docTuDien(ma);

const RE_SO = /\d+(?:[.,:\/]\d+)*/g;
const matNa = (k) => k.replace(RE_SO, '#');
const CHI_MUC = {};   // ma → (khoá đã che số → [khoá])
function chiMuc(ma) {
    if (CHI_MUC[ma]) return CHI_MUC[ma];
    const m = new Map();
    for (const k of Object.keys(TU_DIEN[ma]).sort()) {
        if (!/\d/.test(k)) continue;
        const mk = matNa(k);
        if (!m.has(mk)) m.set(mk, []);
        m.get(mk).push(k);
    }
    return (CHI_MUC[ma] = m);
}
/* Các cách viết một con số trong bản dịch: "7.344" tiếng Việt có thể thành "7,344" / "7344" / "7 344". */
function cachViet(so) {
    const ds = [so];
    if (/^\d{1,3}(\.\d{3})+$/.test(so)) { const tron = so.replace(/\./g, ''); ds.push(so.replace(/\./g, ','), tron, so.replace(/\./g, ' ')); }
    if (/^\d+,\d+$/.test(so)) ds.push(so.replace(',', '.'));
    if (/^\d+\.\d+$/.test(so) && !/^\d{1,3}(\.\d{3})+$/.test(so)) ds.push(so.replace('.', ','));
    return ds;
}
function doiCung(soCu, dangCu, soMoi) {
    // viết số mới theo đúng kiểu mà bản dịch đã viết số cũ
    if (dangCu === soCu) return soMoi;
    if (dangCu === soCu.replace(/\./g, ',')) return soMoi.replace(/\./g, ',');
    if (dangCu === soCu.replace(/\./g, '')) return soMoi.replace(/\./g, '');
    if (dangCu === soCu.replace(/\./g, ' ')) return soMoi.replace(/\./g, ' ');
    if (dangCu === soCu.replace(',', '.')) return soMoi.replace(',', '.');
    if (dangCu === soCu.replace('.', ',')) return soMoi.replace('.', ',');
    return soMoi;
}
/** Câu chỉ khác chữ số so với một câu đã dịch → thay số trong bản dịch cũ. */
function suyTheoSo(ma, khoa) {
    if (!/\d/.test(khoa)) return null;
    const ung = chiMuc(ma).get(matNa(khoa));
    if (!ung) return null;
    const soMoi = khoa.match(RE_SO);
    for (const cu of ung) {
        const soCu = cu.match(RE_SO);
        if (!soCu || soCu.length !== soMoi.length) continue;
        let dich = TU_DIEN[ma][cu];
        let viTri = 0, ok = true;
        for (let i = 0; i < soCu.length; i++) {
            let tim = -1, dang = null;
            for (const c of cachViet(soCu[i])) {
                const j = dich.indexOf(c, viTri);
                if (j !== -1 && (tim === -1 || j < tim)) { tim = j; dang = c; }
            }
            if (tim === -1) { ok = false; break; }
            const thay = soCu[i] === soMoi[i] ? dang : doiCung(soCu[i], dang, soMoi[i]);
            dich = dich.slice(0, tim) + thay + dich.slice(tim + dang.length);
            viTri = tim + thay.length;
        }
        if (ok) return dich;
    }
    return null;
}

/** Bản dịch của một câu, hoặc null. */
function dich(ma, khoa) {
    if (N.GIU_NGUYEN.has(khoa)) return khoa;
    // DICH_GIA=1: "bản dịch" giả «câu gốc» — chỉ để soát bộ sinh trang (link, JSON-LD, script) khi chưa có bản dịch thật.
    // Chạy xong PHẢI xoá thư mục en/ zh/… vừa sinh rồi chạy lại script này không có biến đó.
    if (process.env.DICH_GIA) return '«' + khoa + '»';
    if (ma !== 'en' && N.laLuonTiengAnh(khoa)) return dich('en', khoa);
    const d = TU_DIEN[ma][khoa];
    if (d !== undefined && d !== '') return d;
    return suyTheoSo(ma, khoa);
}

// ───────────────────────── tiền xử lý trang nguồn ─────────────────────────
function viTriToken(tokens) {
    const vt = [];
    let n = 0;
    for (const t of tokens) { vt.push(n); n += t.raw.length; }
    vt.push(n);
    return vt;
}

/* Đưa trang về đúng chữ KHÁCH ĐANG THẤY: trang nạp data/translations.js thì applyTranslations() ghi đè
   mọi [data-i18n] bằng bản dịch tiếng của trang ngay khi tải (bug #0) — nên câu gốc phải lấy từ đó,
   không từ HTML tĩnh (8 chỗ HTML tĩnh từng lệch bản dịch). Bỏ luôn những thứ chỉ của bản tiếng Việt. */
// Bài gốc tiếng Anh: trên đĩa có lúc đã qua suaBaiGocTiengAnh (WhatsApp, +84…), có lúc chưa (vừa được
// generate-blog-pages.js ghi lại) → áp CÙNG phép đổi liên hệ trước khi tách câu để khoá câu luôn như nhau.
function chuanBiNguon(html, lang) {
    const s = chuanBiNguon0(html, lang);
    return lang === 'en' ? N.lienHeNuocNgoai(s) : s;
}
function chuanBiNguon0(html, lang) {
    let s = html
        .replace(N.RE_HOP, '<!--NGON-NGU-->')
        .replace(/<!-- MUA:START[^>]*-->[\s\S]*?<!-- MUA:END -->/, '<!--MUA-->')
        // ngắt dòng h1 đo riêng cho chữ tiếng Việt (bug #29) — bản dịch dài ngắn khác hẳn
        .replace(/<br class="ngat-h1[^"]*">/g, '');
    const dict = TRANS[lang];
    if (!dict || !/data\/translations\.js/.test(s)) return s;
    const doc = P.phanTich(s);
    const vt = viTriToken(doc.tokens);
    const sua = [];
    (function tham(node) {
        for (const c of node.children || []) {
            if (c.type !== 'el') continue;
            const tok = doc.tokens[c.open];
            const k = P.layThuocTinh(tok, 'data-i18n');
            if (k && dict[k] !== undefined && c.close !== null && c.close !== undefined) {
                const trong = doc.tokens.slice(c.open + 1, c.close).map((t) => t.raw).join('');
                if (trong !== dict[k]) sua.push([vt[c.open + 1], vt[c.close], dict[k]]);
                continue;
            }
            tham(c);
        }
    })(doc.goc);
    doc.tokens.forEach((tok, i) => {
        const k = tok.t === 'open' && P.layThuocTinh(tok, 'data-i18n-ph');
        if (k && dict[k] !== undefined && P.layThuocTinh(tok, 'placeholder') !== dict[k]) {
            const t2 = Object.assign({}, tok, { attrs: tok.attrs.map((a) => Object.assign({}, a)) });
            P.datThuocTinh(t2, 'placeholder', dict[k]);
            sua.push([vt[i], vt[i + 1], t2.raw]);
        }
    });
    sua.sort((a, b) => b[0] - a[0]);
    for (const [a, b, moi] of sua) s = s.slice(0, a) + moi + s.slice(b);
    return s;
}

// ───────────────────────── câu trong JSON-LD + script nhúng ─────────────────────────
/* Thực thể dùng chung toàn site (một @id duy nhất — bug #11): GIỮ NGUYÊN y bản tiếng Việt, không dịch,
   không đổi URL. Hai định nghĩa khác chữ cho cùng @id là hai giá trị đánh nhau. */
const THUC_THE_CHUNG = new Set(['Restaurant', 'LocalBusiness', 'FoodEstablishment', 'Organization', 'WebSite', 'PostalAddress',
    'GeoCoordinates', 'Brand', 'Place']);
const ID_THUC_THE = /#(restaurant|website|organization|logo)$/;
const KHOA_JSON_DICH = new Set(['name', 'description', 'headline', 'alternativeHeadline', 'text', 'caption', 'articleSection',
    'keywords', 'jobTitle', 'abstract', 'disambiguatingDescription', 'reviewBody', 'about', 'category', 'genre', 'slogan']);
function loaiNode(o) {
    const t = o && o['@type'];
    return Array.isArray(t) ? t : (t ? [t] : []);
}
/** Duyệt JSON-LD; goi(giaTri, duongDan, cha, khoa) cho mỗi chuỗi cần dịch. Bỏ qua thực thể chung. */
function duyetJson(o, goi, laPerson) {
    if (Array.isArray(o)) { o.forEach((x, i) => { if (typeof x === 'string') { if (laPerson === 'mang') goi(x, o, i); } else duyetJson(x, goi); }); return; }
    if (!o || typeof o !== 'object') return;
    const loai = loaiNode(o);
    if (loai.some((t) => THUC_THE_CHUNG.has(t))) return;
    const person = loai.includes('Person');
    for (const k of Object.keys(o)) {
        const v = o[k];
        if (typeof v === 'string') {
            if (!KHOA_JSON_DICH.has(k)) continue;
            if (person && k === 'name') continue;
            if (!P.CO_CHU.test(v)) continue;
            goi(v, o, k);
        } else if (Array.isArray(v) && k === 'keywords') {
            v.forEach((x, i) => { if (typeof x === 'string' && P.CO_CHU.test(x)) goi(x, v, i); });
        } else if (v && typeof v === 'object') duyetJson(v, goi);
    }
}
function laScriptJsonLd(the) { return the && the.name === 'script' && /ld\+json/i.test(P.layThuocTinh(the, 'type') || ''); }
function laScriptDich(the) {
    if (!the || the.name !== 'script') return false;
    if (P.layThuocTinh(the, 'src') !== undefined) return false;
    const ty = (P.layThuocTinh(the, 'type') || '').toLowerCase();
    if (ty && ty !== 'text/javascript' && ty !== 'module') return false;     // JSON-LD, pixel hoãn (text/plain)
    return true;
}
/** Chuỗi có dấu tiếng Việt trong script nhúng (bỏ chú thích, bỏ đối số console.*). */
function chuoiJs(src) {
    const ds = [];
    let i = 0;
    while (i < src.length) {
        const c = src[i];
        if (c === '/' && src[i + 1] === '*') { const j = src.indexOf('*/', i + 2); i = j < 0 ? src.length : j + 2; continue; }
        if (c === '/' && src[i + 1] === '/' && src[i - 1] !== ':' && src[i - 1] !== BS) { const j = src.indexOf('\n', i); i = j < 0 ? src.length : j; continue; }
        if (c === '"' || c === "'" || c === '`') {
            let j = i + 1;
            while (j < src.length && src[j] !== c) { if (src[j] === BS) j++; j++; }
            const tho = src.slice(i + 1, j);
            const truoc = src.slice(Math.max(0, i - 30), i);
            if (VN.test(tho) && !/console\.\w+\(\s*$/.test(truoc) && !(c === '`' && tho.includes('${'))) {
                ds.push({ dau: i, cuoi: j + 1, q: c, gt: giaiMaJs(tho) });
            }
            i = j + 1;
            continue;
        }
        i++;
    }
    return ds;
}
function giaiMaJs(s) {
    let r = '';
    for (let i = 0; i < s.length; i++) {
        if (s[i] !== BS) { r += s[i]; continue; }
        const n = s[++i];
        if (n === 'n') r += '\n';
        else if (n === 't') r += '\t';
        else if (n === 'r') r += '\r';
        else if (n === 'u') { r += String.fromCharCode(parseInt(s.slice(i + 1, i + 5), 16)); i += 4; }
        else r += n;
    }
    return r;
}
function maHoaJs(s, q) {
    return s.split(BS).join(BS + BS).split(q).join(BS + q).replace(/\n/g, BS + 'n').replace(/\r/g, BS + 'r').replace(/\t/g, BS + 't');
}

/** Mọi câu của một trang (đã chuẩn bị): chữ + thuộc tính + title + JSON-LD + chuỗi script. */
function cauCuaTrang(htmlNguon) {
    const doc = P.phanTich(htmlNguon);
    const ds = P.tachCau(doc);
    doc.tokens.forEach((tok, idx) => {
        if (tok.t !== 'raw') return;
        const the = doc.tokens[idx - 1];
        if (laScriptJsonLd(the)) {
            let o;
            try { o = JSON.parse(tok.raw); } catch (e) { return; }
            duyetJson(o, (v) => ds.push({ loai: 'json', khoa: P.chuanHoa(v), tok: idx }));
        } else if (laScriptDich(the)) {
            for (const c of chuoiJs(tok.raw)) ds.push({ loai: 'js', khoa: c.gt, tok: idx });
        }
    });
    return { doc, ds };
}

// ───────────────────────── viết lại đường dẫn ─────────────────────────
function chuanDuongDan(pathname) {
    let p = decodeURIComponent(pathname).replace(/^\//, '');
    if (p === '' || p.endsWith('/')) p += 'index.html';
    return p;
}
function dangThuMuc(p) {
    if (p === 'index.html') return '';
    return p.endsWith('/index.html') ? p.slice(0, -'index.html'.length) : p;
}
const KHONG_DOI = /^(#|mailto:|tel:|sms:|javascript:|data:|whatsapp:|about:)/i;

/** Trả { url } hoặc { goLink: true } (link tới trang chưa có bản dịch → bỏ thẻ <a>, giữ chữ). */
function vietLaiUrl(url, ngC, kieu) {
    if (url === undefined || url === null) return null;
    const goc = url.trim();
    if (!goc || KHONG_DOI.test(goc)) return null;
    let u;
    try { u = new URL(goc, ngC.urlNguon); } catch (e) { return null; }
    if (/(^|\.)zalo\.me$/i.test(u.hostname) && /^\/0?989765070\/?$/.test(u.pathname)) {
        // Kênh liên hệ của quán → WhatsApp cùng số (sếp chốt 21/10/2026); tin nhắn điền sẵn luôn tiếng Anh
        const tin = u.searchParams.get('text');
        const tinDich = tin ? dich('en', P.chuanHoa(tin)) : null;
        return { url: 'https://wa.me/84989765070' + (tinDich ? '?text=' + encodeURIComponent(tinDich) : '') };
    }
    if (!/^(www\.)?tramdungchill\.vn$/i.test(u.hostname)) return null;
    // link sẵn trỏ bản dịch tiếng Anh (bài gốc tiếng Anh, sau suaBaiGocTiengAnh) → coi như trỏ trang nguồn
    const p = chuanDuongDan(u.pathname).replace(new RegExp('^(?:' + N.MA_DICH.join('|') + ')/'), '');
    const duoi = u.search + u.hash;
    if (ngC.coBanDich(p)) {
        const moi = '/' + ngC.ma + '/' + dangThuMuc(p) + duoi;
        return { url: kieu === 'tuyetDoi' ? MIEN + moi : moi };
    }
    const laTrang = /\.html$/.test(p);
    if (laTrang && kieu === 'link') return { goLink: true };
    const moi = '/' + dangThuMuc(p) + duoi;
    return { url: kieu === 'tuyetDoi' ? MIEN + moi : moi };
}
function vietLaiSrcset(gt, ngC) {
    return gt.split(',').map((phan) => {
        const m = /^(\s*)(\S+)(.*)$/.exec(phan);
        if (!m) return phan;
        const r = vietLaiUrl(m[2], ngC, 'tep');
        return m[1] + (r && r.url ? r.url : m[2]) + m[3];
    }).join(',');
}

// ───────────────────────── sinh một trang dịch ─────────────────────────
// Khoá từ điển cho bản dịch RÚT GỌN của meta description: "@meta " + câu gốc (R19: khung độ dài theo thứ tiếng)
const KHOA_META = '@meta ';
const VD_SO = { en: '+65 8123 4567', zh: '+65 8123 4567', ko: '+82 10 1234 5678', ja: '+81 90 1234 5678', ru: '+7 912 345 67 89', th: '+66 81 234 5678' };
const TT_URL = new Set(['href', 'src', 'data-src', 'poster', 'action', 'data-href']);
const TT_SRCSET = new Set(['srcset', 'data-srcset', 'imagesrcset']);

function sinhTrang(nguon, ma, ngC, chuan) {
    const { doc, ds } = chuan;
    const NG = N.THEO_MA[ma];
    const thieu = [];
    const layDich = (khoa) => {
        const d = dich(ma, khoa);
        if (d !== null) return d;
        thieu.push(khoa);
        return ma !== 'en' ? dich('en', khoa) : null;   // tạm lấy bản tiếng Anh; không có thì giữ chữ gốc
    };
    // FAQ trong JSON-LD = chữ trần của câu hiển thị → lấy luôn bản dịch câu đó (khỏi dịch hai lần)
    const tranCau = new Map();
    for (const it of ds) {
        if (it.loai !== 'chu') continue;
        const d = dich(ma, it.khoa);
        if (d !== null) tranCau.set(P.chuanHoa(it.khoa.replace(/<[^>]+>/g, '')), P.chuanHoa(d.replace(/<[^>]+>/g, '')));
    }
    const dichJson = (khoa) => {
        const d = dich(ma, khoa);
        if (d !== null) return d;
        if (tranCau.has(khoa)) return tranCau.get(khoa);
        thieu.push(khoa);
        return ma !== 'en' ? (dich('en', khoa) || tranCau.get(khoa) || null) : null;
    };

    // cặp thẻ mở/đóng của <a> để bỏ link khi cần
    const dongCua = new Map();
    (function tham(n) { for (const c of n.children || []) if (c.type === 'el') { if (c.name === 'a' && c.close !== null) dongCua.set(c.open, c.close); tham(c); } })(doc.goc);
    const boThe = new Set();
    let soGoLink = 0;

    const suaThe = (tok, idx) => {
        if (tok.t === 'close') { if (boThe.has(idx)) tok.raw = ''; return; }
        const sua = (ten, gt) => { P.datThuocTinh(tok, ten, gt); };
        const tt = (ten) => P.layThuocTinh(tok, ten);
        if (tok.name === 'html') { sua('lang', NG.html); return; }
        if (tok.name === 'link' && /(^|\s)canonical(\s|$)/i.test(tt('rel') || '')) { sua('href', ngC.urlDich); return; }
        if (tok.name === 'link' && /preload/i.test(tt('rel') || '') && /-vietnamese\.woff2/.test(tt('href') || '') && !/dancing-script/.test(tt('href') || '')) {
            tok.raw = ''; return;   // phông tiếng Việt: trang dịch gần như không dùng (logo Dancing Script thì vẫn cần)
        }
        if (tok.name === 'meta') {
            const prop = (tt('property') || tt('name') || '').toLowerCase();
            if (prop === 'og:url') { sua('content', ngC.urlDich); return; }
            if (prop === 'og:locale') { sua('content', NG.og); return; }
            return;
        }
        // Khách nước ngoài gọi bằng SIM nước ngoài: "0989…" không gọi được, phải có mã nước +84
        const hrefTel = tt('href');
        if (hrefTel && /^tel:0989765070$/.test(hrefTel)) sua('href', 'tel:+84989765070');
        const i18n = tt('data-i18n');
        if (i18n !== undefined && !KHOA_CHAY.includes(i18n)) sua('data-i18n', null);
        if (tt('data-i18n-ph') !== undefined) sua('data-i18n-ph', null);
        for (const a of [...tok.attrs]) {
            if (a.value === null) continue;
            const gt = P.giaiMa(a.value);
            if (TT_URL.has(a.name)) {
                const r = vietLaiUrl(gt, ngC, tok.name === 'a' && a.name === 'href' ? 'link' : 'tep');
                if (r && r.goLink) {
                    tok.raw = '';
                    const dong = dongCua.get(idx);
                    if (dong !== undefined) boThe.add(dong);
                    soGoLink++;
                    return;
                }
                if (r && r.url !== gt) sua(a.name, r.url);
            } else if (TT_SRCSET.has(a.name)) {
                const moi = vietLaiSrcset(gt, ngC);
                if (moi !== gt) sua(a.name, moi);
            }
        }
    };

    const suaRaw = (raw, the) => {
        if (laScriptJsonLd(the)) {
            let o;
            try { o = JSON.parse(raw); } catch (e) { return raw; }
            duyetJson(o, (v, cha, k) => { const d = dichJson(P.chuanHoa(v)); if (d !== null) cha[k] = d; });
            (function doiUrl(x) {
                if (Array.isArray(x)) { x.forEach((y, i) => { if (typeof y === 'string') { const r = urlJson(y); if (r) x[i] = r; } else doiUrl(y); }); return; }
                if (!x || typeof x !== 'object') return;
                if (loaiNode(x).some((t) => THUC_THE_CHUNG.has(t))) return;
                for (const k of Object.keys(x)) {
                    const v = x[k];
                    if (k === 'inLanguage' && typeof v === 'string') { x[k] = NG.hreflang; continue; }
                    if (typeof v === 'string') { const r = urlJson(v); if (r) x[k] = r; } else doiUrl(v);
                }
            })(o);
            const cuoi = (/\n([ \t]*)$/.exec(raw) || ['', ''])[1];
            return '\n' + JSON.stringify(o, null, 2) + '\n' + cuoi;
        }
        if (laScriptDich(the)) {
            const ds2 = chuoiJs(raw);
            let s = raw;
            for (let i = ds2.length - 1; i >= 0; i--) {
                const c = ds2[i];
                const d = layDich(c.gt);
                if (d === null) continue;
                s = s.slice(0, c.dau) + c.q + maHoaJs(d, c.q) + c.q + s.slice(c.cuoi);
            }
            return s.split("'https://zalo.me/0989765070?text='").join("'https://wa.me/84989765070?text='");
        }
        return raw;
    };
    const urlJson = (v) => {
        if (!/^https?:\/\/(www\.)?tramdungchill\.vn(\/|$)/i.test(v)) return null;
        if (ID_THUC_THE.test(v)) return null;
        const r = vietLaiUrl(v, ngC, 'tuyetDoi');
        return r && r.url && r.url !== v ? r.url : null;
    };

    const kq = P.rapTrang(doc, ds, {
        dichCau: (it) => layDich(it.khoa),
        dichTT: (it) => {
            // meta description: ưu tiên bản rút gọn "@meta <câu gốc>" — câu gốc ~160 ký tự tiếng Việt dịch ra tiếng Anh/Nga
            // dài 175–220 ký tự, mà nhiều bài dùng CHÍNH câu đó làm đoạn mở đầu → không rút bản dịch chung được
            if (it.tt === 'content' && /description$/.test((P.layThuocTinh(doc.tokens[it.tok], 'name') || P.layThuocTinh(doc.tokens[it.tok], 'property') || '').toLowerCase())) {
                const ngan = dich(ma, KHOA_META + it.khoa);   // không có bản rút gọn thì dùng bản thường, không tính là thiếu
                if (ngan !== null) return ngan;
            }
            return layDich(it.khoa);
        },
        suaThe,
        suaRaw
    });
    // Số hotline viết dạng quốc tế (người dịch giữ "0989.765.070" để máy kiểm chữ số; đổi ở bước cuối này)
    // + link đã đổi sang wa.me nhưng icon footer vẫn là chữ "Zalo" vẽ bằng <text> → icon WhatsApp (ngon-ngu.js)
    let html = N.lienHeNuocNgoai(kq.html);
    // Ô nhập số điện thoại: ví dụ số theo nước của khách đọc tiếng đó (form trang dịch nhận số quốc tế)
    html = html.split('placeholder="0xxx.xxx.xxx"').join('placeholder="' + VD_SO[ma] + '"');
    // Link Messenger của trang đích QC tiếng Anh mang mã nguồn ?ref=en_google — bản dịch đổi sang mã theo tiếng
    // (?ref=zh_web…), kẻo tin nhắn từ 5 bản dịch bị đếm lẫn vào khách đến từ QC (soát chéo 22/10/2026)
    html = html.replace(/(m\.me\/[A-Za-z0-9._-]+\?ref=)en_google/g, '$1' + ma + '_web');
    // ô chọn ngôn ngữ + đoạn mùa + phông chữ không Latin + chữ JS lúc chạy
    html = html.replace('<!--NGON-NGU-->', N.hopChonNgonNgu(ma, ngC.lienKet));
    html = html.replace('<!--MUA-->', () => mua.doanDauTrang(mua.versHienTai(), undefined, chuMua(ma)) + N.cssPhong(ma).replace(/^(?=.)/, '\n'));
    const theChu = '<script defer src="/dist/chu-' + ma + '.js?v=' + ngC.vChu + '"></script>';
    html = html.replace(RE_GAN_EN, '');   // bài gốc tiếng Anh đã gắn chu-en.js + utils.js ở lượt trước — xem suaBaiGocTiengAnh
    if (/<script defer src="[^"]*data\/translations\.js[^"]*"><\/script>/.test(html)) {
        html = html.replace(/<script defer src="[^"]*data\/translations\.js[^"]*"><\/script>/, theChu);
    } else {
        html = html.replace(/<script defer src="/, theChu + '\n    <script defer src="');
    }
    if (ngC.duongDan === 'blog.html') {
        html = html.replace(/<script defer src="[^"]*blog-data-light\.js[^"]*"><\/script>/,
            '<script defer src="/dist/bai-viet-' + ma + '.js?v=' + ngC.vBai + '"></script>');
    }
    return { html, thieu: [...new Set(thieu)], loiRap: kq.loi, soGoLink };
}

/** Chữ mùa (Noel/Tết) của một thứ tiếng — dịch từ bản tiếng Việt trong data/mua-le.json. */
function chuMua(ma) {
    const C = {};
    for (const t of mua.TEN_MUA) {
        C[t] = {};
        for (const [k, v] of Object.entries(mua.CAU_HINH[t].chu || {})) {
            const d = dich(ma, P.chuanHoa(v.vi)) || v.en || v.vi;
            C[t][k] = { [ma]: d };
        }
    }
    return C;
}

/* Dịch một chuỗi HTML nhỏ (giá trị trong translations.js, mục blog…) bằng chính bộ tách câu. */
function dichManh(ma, html, thieu) {
    if (!P.CO_CHU.test(html)) return html;
    const doc = P.phanTich('<div>' + html + '</div>');
    const ds = P.tachCau(doc);
    const kq = P.rapTrang(doc, ds, {
        dichCau: (it) => { const d = dich(ma, it.khoa); if (d === null) thieu.push(it.khoa); return d; },
        dichTT: (it) => { const d = dich(ma, it.khoa); if (d === null) thieu.push(it.khoa); return d; }
    });
    return kq.html.slice(5, -6);
}
function cauCuaManh(html) {
    if (!P.CO_CHU.test(html)) return [];
    return P.tachCau(P.phanTich('<div>' + html + '</div>')).map((it) => it.khoa);
}

// ───────────────────────── chữ JS + danh sách bài ─────────────────────────
function noiDungChu(ma, thieu) {
    const o = {};
    for (const k of KHOA_CHAY) {
        const v = TRANS.vi[k];
        if (v === undefined) continue;
        o[k] = dichManh(ma, v, thieu);
    }
    return '/* Chữ JS gán lúc chạy của trang ' + N.THEO_MA[ma].ten + ' — sinh bởi scripts/dich-trang.js từ data/translations.js + ' +
        'data/ban-dich/' + ma + '.json. ĐỪNG sửa tay. */\nvar TRANSLATIONS = ' + JSON.stringify({ [ma]: o }) + ';\n';
}

function docBaiNhe() {
    const ctx = {};
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'data/blog-data-light.js'), 'utf8') + '\n;this.B = BLOG_ARTICLES;', ctx);
    return ctx.B;
}
function noiDungBaiViet(ma, coBanDich, langCua, thieu) {
    const ds = [];
    for (const a of docBaiNhe()) {
        const p = 'blog/' + a.id + '.html';
        const goc = langCua(p);
        if (goc !== ma && !coBanDich(p)) continue;    // chỉ liệt kê bài đọc được bằng tiếng này
        const b = Object.assign({}, a);
        if (goc !== ma) {
            b.title = dichManh(ma, a.title, thieu);
            b.category = dichManh(ma, a.category, thieu);
            b.imageAlt = dichManh(ma, a.imageAlt || a.title, thieu);
            b.excerpt = dichManh(ma, a.excerpt || '', thieu);
            b.badge = a.badge ? dichManh(ma, a.badge, thieu) : '';
        } else {
            b.url = '/' + p;   // bài viết gốc tiếng này nằm ở thư mục gốc
        }
        b.tags = [];
        b.image = '/' + String(a.image).replace(/^\/+/, '');
        ds.push(b);
    }
    return '/* Danh sách bài cho trang Blog ' + N.THEO_MA[ma].ten + ' — sinh bởi scripts/dich-trang.js. ĐỪNG sửa tay. */\n' +
        'const BLOG_ARTICLES = ' + JSON.stringify(ds, null, 1) + ';\n';
}

// ───────────────────────── sitemap ─────────────────────────
/** Khai cụm hreflang hai chiều + thêm URL trang dịch vào sitemap.xml. Gọi lại nhiều lần ra cùng kết quả. */
function boSungSitemap(trangDaCo) {
    const f = path.join(ROOT, 'sitemap.xml');
    const xml = fs.readFileSync(f, 'utf8');
    const khoi = xml.match(/  <url>[\s\S]*?<\/url>\n?/g) || [];
    const dau = xml.slice(0, xml.indexOf('  <url>'));
    const ra = [];
    for (const k of khoi) {
        const loc = (/<loc>([^<]*)<\/loc>/.exec(k) || [])[1];
        const p = N.duongDanTuUrl(loc);
        if (N.laTrangDich(p)) continue;                     // khối cũ của trang dịch — dựng lại dưới đây
        const html = fs.existsSync(path.join(ROOT, p)) ? fs.readFileSync(path.join(ROOT, p), 'utf8') : '';
        const langGoc = N.maTuLang((/<html[^>]*\blang="([^"]+)"/.exec(html) || [])[1]);
        const cum = [{ ma: langGoc, url: loc }];
        for (const ma of N.MA_DICH) if (ma !== langGoc && trangDaCo.has(N.duongDanDich(ma, p))) cum.push({ ma, url: N.urlTuDuongDan(N.duongDanDich(ma, p)) });
        const xDefault = (cum.find((c) => c.ma === 'en') || cum[0]).url;
        const lien = cum.map((c) => '    <xhtml:link rel="alternate" hreflang="' + N.THEO_MA[c.ma].hreflang + '" href="' + c.url + '"/>')
            .concat(['    <xhtml:link rel="alternate" hreflang="x-default" href="' + xDefault + '"/>']).join('\n');
        const khoiMoi = (u) => k.replace(/<loc>[^<]*<\/loc>/, '<loc>' + u + '</loc>')
            .replace(/(\n    <xhtml:link [^\n]*)+/, '\n' + lien);
        ra.push(khoiMoi(loc));
        for (const c of cum) if (c.url !== loc) ra.push(khoiMoi(c.url));
    }
    const moi = dau + ra.join('') + '</urlset>\n';
    if (moi !== xml) fs.writeFileSync(f, moi, 'utf8');
    return ra.length;
}

// ───────────────────────── chạy ─────────────────────────
function moiTrangHtml(dir, acc) {
    acc = acc || [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { if (!/^(node_modules|\.git|dist|docs|plans|dev|assets|templates|components)$/.test(e.name)) moiTrangHtml(p, acc); }
        else if (e.name.endsWith('.html')) acc.push(p);
    }
    return acc;
}
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');

function chay(cheDo) {
    const nguon = N.trangNguon();
    const langCua = (p) => { const t = nguon.find((x) => x.duongDan === p); return t ? t.lang : null; };
    // chuẩn bị + tách câu một lần cho mỗi trang nguồn
    const chuan = new Map();
    for (const t of nguon) {
        const html = fs.readFileSync(path.join(ROOT, t.duongDan), 'utf8');
        chuan.set(t.duongDan, cauCuaTrang(chuanBiNguon(html, t.lang)));
    }
    const tapNguon = new Set(nguon.map((t) => t.duongDan));
    const baoCao = {};
    const trangDaCo = new Set();
    const theoMa = {};
    let ghi = 0;
    // Lượt 1: trang nào có bản dịch, ở mọi thứ tiếng — ô chọn ngôn ngữ của từng trang cần biết đủ trước khi ghi
    for (const ma of N.MA_DICH) {
        baoCao[ma] = { du: 0, thieuTrang: [], chua: 0, cauThieu: new Set() };
        // trang nào được có bản dịch tiếng này: đủ câu, hoặc đã có file từ trước (giữ cho khỏi tụt hạng)
        const duocDich = new Set();
        const thieuTheoTrang = new Map();
        for (const t of nguon) {
            if (t.lang === ma) continue;
            const { ds } = chuan.get(t.duongDan);
            const thieu = new Set();
            const tranCau = new Set(ds.filter((it) => it.loai === 'chu').map((it) => P.chuanHoa(it.khoa.replace(/<[^>]+>/g, ''))));
            for (const it of ds) {
                if (dich(ma, it.khoa) !== null) continue;
                if (it.loai === 'json' && tranCau.has(it.khoa) && ds.some((x) => x.loai === 'chu' && P.chuanHoa(x.khoa.replace(/<[^>]+>/g, '')) === it.khoa && dich(ma, x.khoa) !== null)) continue;
                thieu.add(it.khoa);
            }
            thieuTheoTrang.set(t.duongDan, thieu);
            const daCo = fs.existsSync(path.join(ROOT, N.duongDanDich(ma, t.duongDan)));
            if (!thieu.size || daCo) duocDich.add(t.duongDan);
        }
        const coBanDich = (p) => duocDich.has(p) && langCua(p) !== ma;
        for (const p of duocDich) trangDaCo.add(N.duongDanDich(ma, p));
        theoMa[ma] = { duocDich, coBanDich, thieuTheoTrang };
    }
    // Lượt 2: ghi
    for (const ma of N.MA_DICH) {
        const { duocDich, coBanDich, thieuTheoTrang } = theoMa[ma];
        if (cheDo === 'bao-cao') {
            for (const [p, th] of thieuTheoTrang) {
                if (th.size) { baoCao[ma].thieuTrang.push([p, th.size]); th.forEach((k) => baoCao[ma].cauThieu.add(k)); }
                else baoCao[ma].du++;
            }
            continue;
        }
        if (!duocDich.size) { baoCao[ma].chua = nguon.filter((t) => t.lang !== ma).length; continue; }   // chưa trang nào đủ câu
        // chữ JS + danh sách bài (băm để gắn ?v=)
        const thieuChu = [];
        const chuJs = noiDungChu(ma, thieuChu);
        const fChu = path.join(ROOT, 'dist', 'chu-' + ma + '.js');
        if (!fs.existsSync(fChu) || fs.readFileSync(fChu, 'utf8') !== chuJs) fs.writeFileSync(fChu, chuJs, 'utf8');
        const thieuBai = [];
        const baiJs = noiDungBaiViet(ma, coBanDich, langCua, thieuBai);
        const fBai = path.join(ROOT, 'dist', 'bai-viet-' + ma + '.js');
        if (!fs.existsSync(fBai) || fs.readFileSync(fBai, 'utf8') !== baiJs) fs.writeFileSync(fBai, baiJs, 'utf8');
        const vChu = crypto.createHash('md5').update(chuJs).digest('hex').slice(0, 8);
        theoMa[ma].vChu = vChu;   // bài gốc tiếng Anh cũng nạp chu-en.js (suaBaiGocTiengAnh)
        const vBai = crypto.createHash('md5').update(baiJs).digest('hex').slice(0, 8);
        thieuChu.concat(thieuBai).forEach((k) => baoCao[ma].cauThieu.add(k));

        for (const t of nguon) {
            if (t.lang === ma) continue;   // bài viết gốc tiếng này (2 bài tiếng Anh) — không dịch sang chính nó
            if (!duocDich.has(t.duongDan)) { baoCao[ma].chua++; continue; }
            const ngC = {
                ma, duongDan: t.duongDan, urlNguon: t.url, urlDich: N.urlTuDuongDan(N.duongDanDich(ma, t.duongDan)),
                coBanDich, vChu, vBai, lienKet: lienKetCua(t.duongDan, t.lang, trangDaCo, tapNguon)
            };
            const r = sinhTrang(t, ma, ngC, chuan.get(t.duongDan));
            if (r.loiRap.length) r.loiRap.forEach((l) => { baoCao[ma].cauThieu.add(l.khoa); console.error('  ✗ ' + ma + ' ' + t.duongDan + ': ' + l.loi + ' — ' + l.khoa.slice(0, 80)); });
            if (r.thieu.length) { baoCao[ma].thieuTrang.push([t.duongDan, r.thieu.length]); r.thieu.forEach((k) => baoCao[ma].cauThieu.add(k)); }
            else baoCao[ma].du++;
            const ra = path.join(ROOT, N.duongDanDich(ma, t.duongDan));
            fs.mkdirSync(path.dirname(ra), { recursive: true });
            if (!fs.existsSync(ra) || fs.readFileSync(ra, 'utf8') !== r.html) { fs.writeFileSync(ra, r.html, 'utf8'); ghi++; }
        }
    }
    if (cheDo === 'bao-cao') return inBaoCao(baoCao, nguon.length);

    // ô chọn ngôn ngữ trên trang gốc (mọi trang có mốc, kể cả bài noindex → trỏ trang chủ các tiếng)
    let ghiGoc = 0;
    for (const f of moiTrangHtml(ROOT)) {
        const p = rel(f);
        if (N.laTrangDich(p)) continue;
        const s = fs.readFileSync(f, 'utf8');
        if (!N.RE_HOP.test(s)) continue;
        const lang = N.maTuLang((/<html[^>]*\blang="([^"]+)"/.exec(s) || [])[1]);
        let moi = s.replace(N.RE_HOP, () => N.hopChonNgonNgu(lang, lienKetCua(p, lang, trangDaCo, tapNguon)));
        if (lang === 'en' && /^blog\//.test(p) && theoMa.en) moi = suaBaiGocTiengAnh(moi, p, theoMa.en.coBanDich, theoMa.en.vChu);
        if (moi !== s) { fs.writeFileSync(f, moi, 'utf8'); ghiGoc++; }
    }
    const soUrl = boSungSitemap(trangDaCo);
    inBaoCao(baoCao, nguon.length);
    console.log('  ' + ghi + ' trang dịch được ghi · ô chọn ngôn ngữ cập nhật ở ' + ghiGoc + ' trang gốc · sitemap ' + soUrl + ' URL');
    return baoCao;
}

/**
 * Bài viết GỐC tiếng Anh ở /blog/ (21/10/2026): khách đọc là người nước ngoài, nhưng generate-blog-pages.js dựng nó bằng
 * khuôn bài tiếng Việt → nav, breadcrumb, nút đặt bàn trỏ trang tiếng Việt, footer mang link + icon Zalo. Sửa giống trang
 * dịch: link nội bộ (thẻ <a> trong body, trừ ô chọn ngôn ngữ) trỏ bản /en/ nếu có, liên hệ WhatsApp + số có mã nước.
 * Chạy lại trên kết quả của chính nó không đổi gì (link /en/… không phải trang nguồn → giữ nguyên).
 */
// Chữ tiếng Anh lúc chạy + hàm đọc nguồn khách cho bài GỐC tiếng Anh (23/10/2026, soát trang đích QC Google):
// bài chỉ nạp fab-contact.js nên nút nổi / thanh đặt bàn hiện chữ Việt ("Gọi ngay", "Liên hệ nhanh") và WhatsApp soạn
// sẵn câu tiếng Việt không có mã nguồn (#google). dist/chu-en.js cho chữ (fab.*, sticky.*), js/utils.js cho
// getSourceForTag/buildSourceTag. utils.js chỉ khai hàm — bộ đếm bấm chung initContactTracking() không ai gọi ở trang
// blog ⇒ không đếm hai lần. Đặt TRƯỚC fab-contact.js (cùng defer ⇒ chạy đúng thứ tự). Bản dịch của bài (zh/…) gỡ khối
// này ra trước khi gắn chu-<mã>.js (sinhTrang), kẻo chu-en.js chạy sau ghi đè TRANSLATIONS của trang dịch.
const RE_GAN_EN = /<script defer src="\/dist\/chu-en\.js\?v=[^"]*"><\/script>\n<script defer src="\/js\/utils\.js\?v=[^"]*"><\/script>\n/g;
function suaBaiGocTiengAnh(s, p, coBanDich, vChu) {
    const i = s.search(/<body\b/);
    if (i < 0) return s;
    const ngC = { ma: 'en', urlNguon: N.urlTuDuongDan(p), coBanDich };
    const hop = [];
    // giữ nguyên ô chọn ngôn ngữ (link "Tiếng Việt" cố ý trỏ bản gốc) và script nội tuyến (chuỗi JS tự ghép link)
    let than = s.slice(i).replace(N.RE_HOP, (m) => { hop.push(m); return '<!--HOP-GIU-' + (hop.length - 1) + '-->'; })
        .replace(/<script\b[\s\S]*?<\/script>/gi, (m) => { hop.push(m); return '<!--HOP-GIU-' + (hop.length - 1) + '-->'; });
    than = than.replace(/(<a\s[^>]*?\bhref=")([^"]+)(")/g, (m, a, u, b) => {
        const r = vietLaiUrl(u.replace(/&amp;/g, '&'), ngC, 'link');
        return r && r.url ? a + r.url.replace(/&/g, '&amp;') + b : m;
    });
    than = than.replace(/<!--HOP-GIU-(\d+)-->/g, (m, k) => hop[+k]);
    let ra = N.lienHeNuocNgoai(s.slice(0, i) + than).replace(RE_GAN_EN, '');
    if (vChu) {
        // mẫu bài đổi thẻ fab-contact.js mà quên chỗ này thì bài tiếng Anh lặng lẽ quay về chữ Việt → dừng build cho thấy ngay
        if (!/<script defer src="[^"]*js\/fab-contact\.js/.test(ra)) throw new Error('bài gốc tiếng Anh ' + p + ': không thấy thẻ <script defer src="…js/fab-contact.js"> để gắn chu-en.js + utils.js trước nó');
        const the = '<script defer src="/dist/chu-en.js?v=' + vChu + '"></script>\n' +
            '<script defer src="/js/utils.js?v=' + (bamFile(path.join(ROOT, 'js', 'utils.js')) || 'dev') + '"></script>\n';
        ra = ra.replace(/<script defer src="[^"]*js\/fab-contact\.js/, (m) => the + m);
    }
    return ra;
}

/** Link của ô chọn ngôn ngữ cho trang p (tiếng gốc langGoc). Thứ tiếng chưa có bản dịch → trang chủ tiếng đó. */
function lienKetCua(p, langGoc, trangDaCo, tapNguon) {
    const lk = {};
    const laNguon = tapNguon.has(p);
    for (const n of N.NGON_NGU) {
        if (n.ma === langGoc) { lk[n.ma] = '/' + dangThuMuc(p); continue; }
        if (n.ma === 'vi') { lk.vi = langGoc === 'vi' ? '/' + dangThuMuc(p) : '/'; continue; }
        lk[n.ma] = laNguon && trangDaCo.has(N.duongDanDich(n.ma, p)) ? '/' + n.ma + '/' + dangThuMuc(p) : (trangDaCo.has(n.ma + '/index.html') ? '/' + n.ma + '/' : null);
    }
    return lk;
}

function inBaoCao(baoCao, soNguon) {
    console.log('Trang dịch sẵn (' + soNguon + ' trang nguồn):');
    for (const ma of Object.keys(baoCao)) {
        const b = baoCao[ma];
        const tom = N.THEO_MA[ma].ten.padEnd(10) + ' đủ ' + String(b.du).padStart(2) + ' · thiếu câu ' + String(b.thieuTrang.length).padStart(2) +
            ' trang · chưa sinh ' + String(b.chua).padStart(2) + ' · câu cần dịch ' + b.cauThieu.size;
        console.log('  ' + tom);
    }
}

// ───────────────────────── xuất / nạp bản dịch ─────────────────────────
/* Mọi câu (khoá) cần cho trang dịch, kèm ngữ cảnh — theo thứ tự trang để người dịch đọc mạch lạc. */
function moiCau() {
    const nguon = N.trangNguon();
    const ds = [];
    const daCo = new Set();
    const them = (khoa, ngu, langNguon) => { if (!daCo.has(khoa)) { daCo.add(khoa); ds.push({ khoa, ngu, langNguon }); } };
    for (const t of nguon) {
        const { doc, ds: cau } = cauCuaTrang(chuanBiNguon(fs.readFileSync(path.join(ROOT, t.duongDan), 'utf8'), t.lang));
        const tranCau = new Set(cau.filter((it) => it.loai === 'chu').map((it) => P.chuanHoa(it.khoa.replace(/<[^>]+>/g, ''))));
        for (const it of cau) {
            if (it.loai === 'json' && tranCau.has(it.khoa)) continue;   // FAQ JSON-LD = chữ câu hiển thị
            let ngu = t.duongDan;
            if (it.loai === 'tt') ngu += ' · thuộc tính ' + it.tt + ' của <' + doc.tokens[it.tok].name + '>';
            else if (it.loai === 'title') ngu += ' · <title>';
            else if (it.loai === 'json') ngu += ' · dữ liệu có cấu trúc (JSON-LD)';
            else if (it.loai === 'js') ngu += ' · chuỗi trong script (thông báo / tin nhắn)';
            else if (it.cha && it.cha.name) {
                const tok = doc.tokens[it.cha.open];
                const cls = tok && P.layThuocTinh(tok, 'class');
                ngu += ' · <' + it.cha.name + (cls ? ' class="' + cls.split(/\s+/)[0] + '"' : '') + '>';
            }
            them(it.khoa, ngu, t.lang);
        }
    }
    for (const k of KHOA_CHAY) if (TRANS.vi[k] !== undefined) for (const c of cauCuaManh(TRANS.vi[k])) them(c, 'chữ JS (' + k + ')', 'vi');
    for (const a of docBaiNhe()) for (const v of [a.title, a.category, a.imageAlt || a.title, a.excerpt || '', a.badge || '']) for (const c of cauCuaManh(v)) them(c, 'danh sách Blog (' + a.id + ')', 'vi');
    for (const t of mua.TEN_MUA) for (const v of Object.values(mua.CAU_HINH[t].chu || {})) them(P.chuanHoa(v.vi), 'thanh đặt bàn mùa ' + t, 'vi');
    return ds;
}

function xuat(ma, thuMuc, soTuMoiPhan) {
    const ds = moiCau().filter((c) => c.langNguon !== ma && dich(ma, c.khoa) === null);
    fs.mkdirSync(thuMuc, { recursive: true });
    const phan = [];
    let cur = [], tu = 0;
    ds.forEach((c, i) => {
        const w = c.khoa.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
        if (cur.length && tu + w > soTuMoiPhan) { phan.push(cur); cur = []; tu = 0; }
        cur.push({ id: i + 1, goc: c.khoa, ngu_canh: c.ngu, tieng_goc: c.langNguon });
        tu += w;
    });
    if (cur.length) phan.push(cur);
    phan.forEach((p, i) => {
        const f = path.join(thuMuc, ma + '-' + String(i + 1).padStart(2, '0') + '.json');
        fs.writeFileSync(f, JSON.stringify({ ma, tieng: N.THEO_MA[ma].ten, cau: p }, null, 1) + '\n', 'utf8');
    });
    console.log(ma + ': ' + ds.length + ' câu cần dịch → ' + phan.length + ' file trong ' + thuMuc);
}

/* Kiểm một bản dịch: chỗ giữ chỗ khớp, chữ số khớp, không từ cấm, không còn chữ tiếng Việt có dấu. */
const kiem = require('./dich/kiem-ban-dich');

/* Nạp bản dịch. Nhận:
     - file "<tên>.dich.json" = { "<id>": "bản dịch" } nằm cạnh file xuất "<tên>.json" (người dịch chỉ ghi số thứ tự,
       khỏi chép lại câu gốc — chép tay là dễ sai một dấu, khoá không khớp, câu rơi mất mà không ai hay)
     - mảng [{ goc, dich }] hoặc { cau: [{ goc, dich }] }
   chiKiem = true: chỉ báo lỗi, không ghi từ điển (người dịch tự soát trước khi nộp). */
function docCapNap(file) {
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (/\.dich\.json$/.test(file)) {
        const xuat = JSON.parse(fs.readFileSync(file.replace(/\.dich\.json$/, '.json'), 'utf8'));
        const theoId = new Map(xuat.cau.map((c) => [String(c.id), c.goc]));
        const cap = [];
        const la = [];
        for (const [id, d] of Object.entries(j)) {
            if (!theoId.has(String(id))) { la.push(id); continue; }
            cap.push([theoId.get(String(id)), d]);
        }
        const thieu = [...theoId.keys()].filter((id) => j[id] === undefined);
        return { cap, la, thieu: thieu.map((id) => [id, theoId.get(id)]) };
    }
    if (Array.isArray(j)) return { cap: j.map((x) => [x.goc, x.dich]), la: [], thieu: [] };
    if (Array.isArray(j.cau)) return { cap: j.cau.filter((x) => x.dich !== undefined).map((x) => [x.goc, x.dich]), la: [], thieu: [] };
    throw new Error('Định dạng file nạp không đúng (cần <tên>.dich.json = { id: bản dịch }, hoặc mảng { goc, dich })');
}
/* Khoảng trắng / xuống dòng ở HAI ĐẦU câu gốc phải giữ nguyên: chuỗi nhãn tin nhắn kiểu "\nSĐT: " được ghép với
   dữ liệu khách ("…\nPhone: 0912…") — cắt mất "\n" đầu hay dấu cách cuối là tin nhắn gửi quán dính chữ. */
function giuKhoangTrang(goc, d) {
    const dau = (/^\s*/.exec(goc) || [''])[0], cuoi = (/\s*$/.exec(goc) || [''])[0];
    return dau + String(d).trim() + cuoi;
}

function nap(file, ma, chiKiem) {
    const { cap, la, thieu } = docCapNap(file);
    let ok = 0;
    const loi = [];
    for (const [goc, d] of cap) {
        if (typeof d !== 'string' || !d.trim()) { loi.push([goc, 'trống']); continue; }
        const v = giuKhoangTrang(goc, d);
        const l = kiem.kiemCau(ma, goc, v);
        if (l.length) { loi.push([goc, l.join('; ')]); continue; }
        if (!chiKiem) TU_DIEN[ma][goc] = v;
        ok++;
    }
    if (!chiKiem) N.ghiTuDien(ma, TU_DIEN[ma]);
    console.log(ma + ': ' + (chiKiem ? 'đạt ' : 'nạp ') + ok + '/' + cap.length + ' câu' + (loi.length ? ' · ' + loi.length + ' câu lỗi' : '') +
        (thieu.length ? ' · thiếu ' + thieu.length + ' id' : '') + (la.length ? ' · id lạ ' + la.join(',') : ''));
    loi.forEach(([g, l]) => console.log('   ✗ ' + l + ' — ' + g.slice(0, 100).replace(/\n/g, '⏎')));
    thieu.slice(0, 40).forEach(([id, g]) => console.log('   ? thiếu id ' + id + ' — ' + g.slice(0, 80).replace(/\n/g, '⏎')));
    return { ok, loi, thieu };
}

if (require.main === module) {
    const a = process.argv.slice(2);
    if (a[0] === '--bao-cao') chay('bao-cao');
    else if (a[0] === '--xuat') xuat(a[1], a[2] || path.join(ROOT, 'plans', 'ban-dich'), +(a[3] || 6000));
    else if (a[0] === '--nap') { const r = nap(a[1], a[2], false); if (r.loi.length && process.env.NGHIEM) process.exit(1); }
    else if (a[0] === '--kiem') { const r = nap(a[1], a[2], true); if (r.loi.length || r.thieu.length) process.exitCode = 1; }
    else chay('sinh');
}

module.exports = { chay, moiCau, dich, cauCuaTrang, chuanBiNguon, boSungSitemap, chuMua, KHOA_CHAY };
