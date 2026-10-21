/***
 * scripts/dich/phan-tich.js — đọc HTML thành token + cây, tách CÂU cần dịch, rồi ráp bản dịch lại.
 *
 * Dùng cho bộ sinh trang dịch (scripts/dich-trang.js, 21/10/2026). Không dùng thư viện ngoài:
 * .gitignore chặn package.json nên máy vừa clone không có gói nào, mà build không được gãy.
 *
 * NGUYÊN TẮC: chỉnh SỬA TẠI CHỖ trên chuỗi gốc, không dựng lại cả trang từ cây. Token nào
 * không đụng tới thì in ra đúng từng byte như cũ (thụt dòng, thứ tự thuộc tính, chú thích),
 * nên trang dịch giữ y nguyên bố cục + critical CSS của trang tiếng Việt.
 *
 * MỘT "CÂU" (segment) là:
 *   - một đoạn chữ liền trong một khối (p, li, h2, td, button, option…) gồm chữ + thẻ
 *     nội dòng (a, strong, em, span, br, img, svg…). Thẻ nội dòng được thay bằng chỗ giữ
 *     chỗ có số: <a1>…</a1>, <strong2>…</strong2>, <img3/>, <br/>. Người dịch đổi được
 *     thứ tự chữ quanh chúng (tiếng Nhật, Hàn đảo ngữ), còn thuộc tính (href, class…) máy
 *     tự trả lại từ bản gốc — người dịch không làm hỏng link được.
 *   - giá trị một thuộc tính hiển thị: alt, title, aria-label, placeholder, content (meta)…
 *   - chữ trong <title>, chuỗi trong JSON-LD, chuỗi có dấu tiếng Việt trong <script> nhúng.
 * Khối chỉ toàn thẻ con (không có chữ trực tiếp) thì đi sâu vào từng thẻ con — để
 * "<span>Ẩm thực</span> <time>…</time>" thành từng câu riêng thay vì một câu dài lẫn ngày tháng.
 */
'use strict';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'textarea', 'title']);
// Thẻ nội dòng: nằm trong một câu thì thành chỗ giữ chỗ. svg/img/input/picture là "đặc" (không dịch bên trong).
const NOI_DONG = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'del', 'dfn', 'em', 'i', 'img',
    'input', 'ins', 'kbd', 'label', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'svg', 'time',
    'u', 'var', 'wbr', 'picture']);
const DAC = new Set(['svg', 'img', 'input', 'picture', 'br', 'wbr', 'code']);
// Không bao giờ dịch chữ bên trong
const BO_QUA = new Set(['script', 'style', 'textarea', 'template', 'svg', 'code', 'pre', 'head']);

// ───────────────────────── thực thể HTML ─────────────────────────
const U = (n) => String.fromCodePoint(n);
const TEN_ENTITY = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: U(160), times: U(215), divide: U(247), minus: U(8722),
    hellip: U(8230), ndash: U(8211), mdash: U(8212), middot: U(183), deg: U(176), copy: U(169), reg: U(174),
    laquo: U(171), raquo: U(187), lsaquo: U(8249), rsaquo: U(8250), bull: U(8226), star: U(9733), larr: U(8592),
    rarr: U(8594), uarr: U(8593), darr: U(8595), asymp: U(8776), plusmn: U(177), rsquo: U(8217), lsquo: U(8216),
    ldquo: U(8220), rdquo: U(8221), thinsp: U(8201), ensp: U(8194), emsp: U(8195), hearts: U(9829), check: U(10003)
};
function giaiMa(t) {
    return String(t)
        .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => U(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, d) => U(parseInt(d, 10)))
        .replace(/&([a-zA-Z]+);/g, (m, ten) => (TEN_ENTITY[ten] !== undefined ? TEN_ENTITY[ten] : m));
}
function maHoaChu(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;');
}
function maHoaThuocTinh(t) {
    return maHoaChu(t).replace(/"/g, '&quot;');
}

// ───────────────────────── token ─────────────────────────
function docThe(html, pos) {
    // pos đứng ở '<'. Trả { tok, het } hoặc null nếu không phải thẻ hợp lệ.
    const dong = html[pos + 1] === '/';
    let i = pos + (dong ? 2 : 1);
    const mTen = /^[A-Za-z][A-Za-z0-9:-]*/.exec(html.slice(i, i + 64));
    if (!mTen) return null;
    const ten = mTen[0].toLowerCase();
    i += mTen[0].length;
    if (dong) {
        const het = html.indexOf('>', i);
        if (het === -1) return null;
        return { tok: { t: 'close', name: ten, raw: html.slice(pos, het + 1) }, het: het + 1 };
    }
    const attrs = [];
    for (;;) {
        const truocDau = i;
        while (i < html.length && /\s/.test(html[i])) i++;
        if (i >= html.length) return null;
        if (html[i] === '>') {
            return { tok: { t: 'open', name: ten, attrs, tail: html.slice(truocDau, i + 1), selfClose: false, raw: html.slice(pos, i + 1) }, het: i + 1 };
        }
        if (html[i] === '/' && html[i + 1] === '>') {
            return { tok: { t: 'open', name: ten, attrs, tail: html.slice(truocDau, i + 2), selfClose: true, raw: html.slice(pos, i + 2) }, het: i + 2 };
        }
        if (html[i] === '/') { i++; continue; }
        const pre = html.slice(truocDau, i);
        const dauTen = i;
        while (i < html.length && !/[\s=>]/.test(html[i]) && !(html[i] === '/' && html[i + 1] === '>')) i++;
        const tenTT = html.slice(dauTen, i);
        let j = i;
        while (j < html.length && /\s/.test(html[j])) j++;
        if (html[j] === '=') {
            j++;
            while (j < html.length && /\s/.test(html[j])) j++;
            const q = html[j];
            let gt, ketThuc;
            if (q === '"' || q === "'") {
                const k = html.indexOf(q, j + 1);
                if (k === -1) return null;
                gt = html.slice(j + 1, k);
                ketThuc = k + 1;
                attrs.push({ name: tenTT.toLowerCase(), value: gt, q, pre, raw: html.slice(dauTen, ketThuc) });
            } else {
                let k = j;
                while (k < html.length && !/[\s>]/.test(html[k])) k++;
                gt = html.slice(j, k);
                ketThuc = k;
                attrs.push({ name: tenTT.toLowerCase(), value: gt, q: '', pre, raw: html.slice(dauTen, ketThuc) });
            }
            i = ketThuc;
        } else {
            attrs.push({ name: tenTT.toLowerCase(), value: null, q: '', pre, raw: tenTT });
        }
    }
}

function tachToken(html) {
    const tokens = [];
    let i = 0;
    let chu = '';
    const dayChu = () => { if (chu) { tokens.push({ t: 'text', raw: chu }); chu = ''; } };
    while (i < html.length) {
        if (html[i] !== '<') {
            const k = html.indexOf('<', i);
            const het = k === -1 ? html.length : k;
            chu += html.slice(i, het);
            i = het;
            continue;
        }
        if (html.startsWith('<!--', i)) {
            dayChu();
            const k = html.indexOf('-->', i + 4);
            const het = k === -1 ? html.length : k + 3;
            tokens.push({ t: 'comment', raw: html.slice(i, het) });
            i = het;
            continue;
        }
        if (html[i + 1] === '!' || html[i + 1] === '?') {
            dayChu();
            const k = html.indexOf('>', i);
            const het = k === -1 ? html.length : k + 1;
            tokens.push({ t: 'doctype', raw: html.slice(i, het) });
            i = het;
            continue;
        }
        const r = docThe(html, i);
        if (!r) { chu += '<'; i++; continue; }
        dayChu();
        tokens.push(r.tok);
        i = r.het;
        if (r.tok.t === 'open' && RAW.has(r.tok.name) && !r.tok.selfClose) {
            const re = new RegExp('</' + r.tok.name + '\\s*>', 'ig');
            re.lastIndex = i;
            const m = re.exec(html);
            const het = m ? m.index : html.length;
            if (het > i) tokens.push({ t: 'raw', raw: html.slice(i, het) });
            i = het;
            if (m) { tokens.push({ t: 'close', name: r.tok.name, raw: m[0] }); i = het + m[0].length; }
        }
    }
    dayChu();
    return tokens;
}

// ───────────────────────── cây ─────────────────────────
// Tự đóng thẻ theo luật HTML ở mức đủ dùng cho site này (HTML do máy sinh, gần như luôn đóng đủ).
const DONG_P_KHI_MO = new Set(['address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset', 'figcaption',
    'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'main', 'nav', 'ol', 'p', 'pre',
    'section', 'table', 'ul']);

function dungCay(tokens) {
    const goc = { type: 'el', name: '#goc', open: -1, close: tokens.length, children: [], parent: null };
    let hienTai = goc;
    const dong = (node, idx) => { node.close = idx; hienTai = node.parent; };
    const dongNgam = (node, idx) => { node.close = null; node.end = idx - 1; hienTai = node.parent; };
    let loiLech = 0;
    tokens.forEach((tok, idx) => {
        if (tok.t === 'open') {
            if (hienTai.name === 'p' && DONG_P_KHI_MO.has(tok.name)) dongNgam(hienTai, idx);
            if (tok.name === 'li' && hienTai.name === 'li') dongNgam(hienTai, idx);
            if (tok.name === 'option' && hienTai.name === 'option') dongNgam(hienTai, idx);
            if ((tok.name === 'td' || tok.name === 'th') && (hienTai.name === 'td' || hienTai.name === 'th')) dongNgam(hienTai, idx);
            if ((tok.name === 'dt' || tok.name === 'dd') && (hienTai.name === 'dt' || hienTai.name === 'dd')) dongNgam(hienTai, idx);
            const node = { type: 'el', name: tok.name, open: idx, close: null, children: [], parent: hienTai };
            hienTai.children.push(node);
            if (!VOID.has(tok.name) && !tok.selfClose) hienTai = node;
            else node.end = idx;
        } else if (tok.t === 'close') {
            // tìm thẻ mở cùng tên gần nhất trên ngăn xếp
            let n = hienTai;
            while (n && n !== goc && n.name !== tok.name) n = n.parent;
            if (!n || n === goc) { loiLech++; hienTai.children.push({ type: 'rac', tok: idx, parent: hienTai }); return; }
            while (hienTai !== n) { dongNgam(hienTai, idx); }
            dong(n, idx);
        } else {
            hienTai.children.push({ type: tok.t, tok: idx, parent: hienTai });
        }
    });
    while (hienTai !== goc) dongNgam(hienTai, tokens.length);
    // điền "end" (token cuối thuộc phần tử) cho mọi phần tử
    (function dienEnd(node) {
        for (const c of node.children || []) if (c.type === 'el') dienEnd(c);
        if (node.type === 'el' && node.close !== null && node.close !== undefined) node.end = node.close;
    })(goc);
    return { goc, loiLech };
}

function phanTich(html) {
    const tokens = tachToken(html);
    const { goc, loiLech } = dungCay(tokens);
    return { html, tokens, goc, loiLech };
}

function inLai(tokens) { return tokens.map((t) => t.raw).join(''); }

function layThuocTinh(tok, ten) {
    if (!tok || !tok.attrs) return undefined;
    const a = tok.attrs.find((x) => x.name === ten);
    return a ? (a.value === null ? '' : giaiMa(a.value)) : undefined;
}

// Ghi lại thẻ mở từ attrs (giữ khoảng trắng + nháy gốc của thuộc tính không đổi)
function dungLaiThe(tok) {
    return '<' + tok.name + tok.attrs.map((a) => a.pre + a.raw).join('') + tok.tail;
}
function datThuocTinh(tok, ten, giaTri) {
    let a = tok.attrs.find((x) => x.name === ten);
    if (giaTri === null) {
        if (a) tok.attrs = tok.attrs.filter((x) => x !== a);
    } else if (a) {
        const q = a.q || '"';
        a.value = maHoaThuocTinh(giaTri);
        a.q = q;
        a.raw = ten + '=' + q + a.value + q;
    } else {
        a = { name: ten, value: maHoaThuocTinh(giaTri), q: '"', pre: ' ', raw: ten + '="' + maHoaThuocTinh(giaTri) + '"' };
        tok.attrs.push(a);
    }
    tok.raw = dungLaiThe(tok);
}

// ───────────────────────── tách câu ─────────────────────────
const CO_CHU = /\p{L}/u;

function laNoiDong(node) {
    if (node.type !== 'el') return true; // text/comment
    if (!NOI_DONG.has(node.name)) return false;
    if (DAC.has(node.name)) return true;
    // phần tử nội dòng mà chứa khối (vd <a class="card"><div>…) thì coi như khối
    return (node.children || []).every(laNoiDong);
}

function khongDich(tok) {
    const tr = layThuocTinh(tok, 'translate');
    if (tr !== undefined && tr.toLowerCase() === 'no') return true;
    const cls = layThuocTinh(tok, 'class');
    return !!(cls && /(^|\s)notranslate(\s|$)/.test(cls));
}

/* Tên chỗ giữ chỗ: tên thẻ thật + số thứ tự trong câu. */
function chuoiHoaRun(nodes, tokens, ctx) {
    let s = '';
    for (const n of nodes) {
        if (n.type === 'text') s += giaiMa(tokens[n.tok].raw);
        else if (n.type === 'el') {
            const tok = tokens[n.open];
            if (n.name === 'br' && tok.attrs.length === 0) { s += '<br/>'; ctx.br++; continue; }
            const so = ++ctx.so;
            ctx.ban[so] = n;
            if (DAC.has(n.name) || VOID.has(n.name)) s += '<' + n.name + so + '/>';
            else s += '<' + n.name + so + '>' + chuoiHoaRun(n.children, tokens, ctx) + '</' + n.name + so + '>';
        }
        // comment/rac: bỏ khỏi khoá
    }
    return s;
}

function chuanHoa(s) { return s.replace(/[ \t\r\n\f]+/g, ' ').trim(); }

/* Trả danh sách câu dạng { loai, khoa, ... } — đủ thông tin để ráp lại. */
function tachCau(doc) {
    const { tokens, goc } = doc;
    const ds = [];

    function tham(node, trongBoQua) {
        if (node.type !== 'el') return;
        const tok = tokens[node.open];
        if (node.name !== '#goc') {
            if (BO_QUA.has(node.name) || (tok && khongDich(tok))) return;
        }
        const con = node.children;
        // gom các "chuỗi nội dòng" liền nhau, ngăn bởi phần tử khối
        let run = [];
        const xuLyRun = () => {
            if (!run.length) return;
            // "Chữ trực tiếp" phải có CHỮ CÁI: dấu ngăn "·", "—", "|" giữa các thẻ không tính — không thì dòng
            // "<span>Chuyên mục</span> · <time>…</time> · <span>Cập nhật …</span>" thành một câu dài lẫn ngày tháng.
            const coChuTrucTiep = run.some((n) => n.type === 'text' && CO_CHU.test(giaiMa(tokens[n.tok].raw)));
            if (coChuTrucTiep) {
                const ctx = { so: 0, br: 0, ban: {} };
                const khoa = chuanHoa(chuoiHoaRun(run, tokens, ctx));
                if (CO_CHU.test(khoa.replace(/<\/?[a-z]+\d*\/?>/g, ''))) {
                    const dau = run[0], cuoi = run[run.length - 1];
                    const tokDau = dau.type === 'el' ? dau.open : dau.tok;
                    const tokCuoi = cuoi.type === 'el' ? cuoi.end : cuoi.tok;
                    ds.push({ loai: 'chu', khoa, tokDau, tokCuoi, ban: ctx.ban, cha: node });
                }
            } else {
                for (const n of run) if (n.type === 'el' && !DAC.has(n.name)) tham(n);
            }
            run = [];
        };
        for (const c of con) {
            if (c.type === 'el' && !laNoiDong(c)) { xuLyRun(); tham(c); }
            else run.push(c);
        }
        xuLyRun();
    }
    // chỉ thân trang; <head> xử riêng
    tham(goc);

    // chữ trong <title> (rcdata)
    tokens.forEach((tok, idx) => {
        if (tok.t === 'raw' && tokens[idx - 1] && tokens[idx - 1].name === 'title') {
            const gt = chuanHoa(giaiMa(tok.raw));
            if (CO_CHU.test(gt)) ds.push({ loai: 'title', khoa: gt, tok: idx });
        }
    });
    // thuộc tính hiển thị
    tokens.forEach((tok, idx) => {
        if (tok.t !== 'open') return;
        for (let ai = 0; ai < tok.attrs.length; ai++) {
            const a = tok.attrs[ai];
            if (a.value === null) continue;
            if (!laThuocTinhDich(tok, a.name)) continue;
            const gt = chuanHoa(giaiMa(a.value));
            if (!CO_CHU.test(gt)) continue;
            ds.push({ loai: 'tt', khoa: gt, tok: idx, tt: a.name });
        }
    });
    return ds;
}

const TT_DICH = new Set(['alt', 'title', 'aria-label', 'placeholder', 'aria-description', 'aria-roledescription',
    'data-group-label', 'data-label', 'label']);
const META_DICH = new Set(['description', 'keywords', 'twitter:title', 'twitter:description', 'twitter:image:alt',
    'og:title', 'og:description', 'og:image:alt', 'apple-mobile-web-app-title']);
function laThuocTinhDich(tok, ten) {
    if (TT_DICH.has(ten)) {
        // title của <link>/<style> không hiển thị (tên bảng kiểu), bỏ
        if (ten === 'title' && (tok.name === 'link' || tok.name === 'style')) return false;
        return true;
    }
    if (ten === 'value' && tok.name === 'input') {
        const ty = (layThuocTinh(tok, 'type') || '').toLowerCase();
        return ty === 'submit' || ty === 'button' || ty === 'reset';
    }
    if (ten === 'content' && tok.name === 'meta') {
        const k = (layThuocTinh(tok, 'name') || layThuocTinh(tok, 'property') || '').toLowerCase();
        return META_DICH.has(k);
    }
    return false;
}

// ───────────────────────── ráp bản dịch ─────────────────────────
/* Đọc bản dịch có chỗ giữ chỗ thành dãy mảnh; kiểm khớp với câu gốc. Trả { manh } hoặc { loi }. */
function docBanDich(banDich, ban) {
    const re = /<(\/?)([a-z]+)(\d+)(\/?)>|<br\s*\/?>/gi;
    const manh = [];
    let cuoi = 0, m;
    const daDung = new Set();
    const ngan = [];
    while ((m = re.exec(banDich))) {
        if (m.index > cuoi) manh.push({ chu: banDich.slice(cuoi, m.index) });
        cuoi = re.lastIndex;
        if (m[2] === undefined) { manh.push({ br: true }); continue; }
        const dongThe = m[1] === '/', so = +m[3], tuDong = m[4] === '/';
        const node = ban[so];
        if (!node) return { loi: 'chỗ giữ chỗ lạ ' + m[0] };
        if (node.name !== m[2].toLowerCase()) return { loi: 'sai tên chỗ giữ chỗ ' + m[0] + ' (gốc là ' + node.name + so + ')' };
        const laDac = DAC.has(node.name) || VOID.has(node.name);
        if (laDac) {
            if (!tuDong) return { loi: m[0] + ' phải viết dạng tự đóng <' + node.name + so + '/>' };
            if (daDung.has(so)) return { loi: m[0] + ' dùng hai lần' };
            daDung.add(so);
            manh.push({ dac: so });
        } else if (dongThe) {
            if (ngan.pop() !== so) return { loi: 'đóng sai thứ tự ' + m[0] };
            manh.push({ dong: so });
        } else {
            if (tuDong) return { loi: m[0] + ' phải có cặp mở/đóng' };
            if (daDung.has(so)) return { loi: m[0] + ' dùng hai lần' };
            daDung.add(so);
            ngan.push(so);
            manh.push({ mo: so });
        }
    }
    if (cuoi < banDich.length) manh.push({ chu: banDich.slice(cuoi) });
    if (ngan.length) return { loi: 'thiếu thẻ đóng cho ' + ngan.join(',') };
    const thieu = Object.keys(ban).map(Number).filter((so) => !daDung.has(so));
    if (thieu.length) return { loi: 'thiếu chỗ giữ chỗ ' + thieu.map((so) => '<' + ban[so].name + so + '>').join(' ') };
    return { manh };
}

/* Kiểm một bản dịch có ráp được vào câu gốc không — dùng khi nạp bản dịch, không cần trang. */
function kiemChoGiuCho(khoaGoc, banDich) {
    const ban = {};
    const re = /<(\/?)([a-z]+)(\d+)(\/?)>/gi;
    let m;
    while ((m = re.exec(khoaGoc))) { if (!m[1]) ban[+m[3]] = { name: m[2].toLowerCase() }; }
    const r = docBanDich(banDich, ban);
    return r.loi || null;
}

/* Ráp lại trang.
   opts.dichCau(item) → chuỗi dịch (có chỗ giữ chỗ) hoặc null (giữ nguyên)
   opts.dichTT(item) → chuỗi hoặc null
   opts.suaThe(tok, idx) → (tuỳ) sửa token thẻ tại chỗ (link, lang, data-i18n…) — chạy TRƯỚC khi ráp câu
   opts.suaRaw(tokRaw, tokThe) → (tuỳ) chuỗi raw mới cho nội dung <script>/<style>/<title> */
function rapTrang(doc, ds, opts) {
    const tokens = doc.tokens.map((t) => Object.assign({}, t, t.attrs ? { attrs: t.attrs.map((a) => Object.assign({}, a)) } : {}));
    // 1) thuộc tính
    for (const it of ds) {
        if (it.loai !== 'tt') continue;
        const moi = opts.dichTT(it);
        if (moi === null || moi === undefined) continue;
        datThuocTinh(tokens[it.tok], it.tt, moi);
    }
    for (const it of ds) {
        if (it.loai !== 'title') continue;
        const moi = opts.dichTT(it);
        if (moi !== null && moi !== undefined) tokens[it.tok].raw = maHoaChu(moi);
    }
    // 2) sửa thẻ (link, lang…)
    if (opts.suaThe) tokens.forEach((tok, idx) => { if (tok.t === 'open' || tok.t === 'close') opts.suaThe(tok, idx, tokens); });
    // 3) raw (title/script/style)
    if (opts.suaRaw) tokens.forEach((tok, idx) => {
        if (tok.t !== 'raw') return;
        const the = tokens[idx - 1];
        const moi = opts.suaRaw(tok.raw, the, idx);
        if (typeof moi === 'string') tok.raw = moi;
    });
    // 4) câu chữ
    const thay = new Map(); // tokDau → { tokCuoi, raw }
    const loi = [];
    for (const it of ds) {
        if (it.loai !== 'chu') continue;
        const dich = opts.dichCau(it);
        if (dich === null || dich === undefined) continue;
        const r = docBanDich(dich, it.ban);
        if (r.loi) { loi.push({ khoa: it.khoa, loi: r.loi }); continue; }
        // giữ khoảng trắng đầu/cuối của đoạn gốc (thụt dòng)
        const dauRaw = tokens[it.tokDau].t === 'text' ? tokens[it.tokDau].raw : '';
        const cuoiRaw = tokens[it.tokCuoi].t === 'text' ? tokens[it.tokCuoi].raw : '';
        const wsDau = (/^[ \t\r\n]*/.exec(dauRaw) || [''])[0];
        const wsCuoi = (/[ \t\r\n]*$/.exec(cuoiRaw) || [''])[0];
        let s = '';
        for (const p of r.manh) {
            if (p.chu !== undefined) s += maHoaChu(p.chu);
            else if (p.br) s += '<br>';
            else if (p.dac !== undefined) {
                const n = it.ban[p.dac];
                s += tokens.slice(n.open, n.end + 1).map((t) => t.raw).join('');
            } else if (p.mo !== undefined) s += tokens[it.ban[p.mo].open].raw;
            else if (p.dong !== undefined) {
                const n = it.ban[p.dong];
                s += n.close !== null && n.close !== undefined ? tokens[n.close].raw : '';
            }
        }
        thay.set(it.tokDau, { tokCuoi: it.tokCuoi, raw: wsDau + s.trim() + wsCuoi });
    }
    let out = '';
    for (let i = 0; i < tokens.length; i++) {
        const t = thay.get(i);
        if (t) { out += t.raw; i = t.tokCuoi; continue; }
        out += tokens[i].raw;
    }
    return { html: out, loi };
}

module.exports = {
    phanTich, tachCau, rapTrang, inLai, giaiMa, maHoaChu, maHoaThuocTinh, chuanHoa, layThuocTinh, datThuocTinh,
    dungLaiThe, kiemChoGiuCho, docBanDich, CO_CHU, VOID
};
