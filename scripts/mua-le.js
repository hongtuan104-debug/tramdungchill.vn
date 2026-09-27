/**
 * mua-le.js — giao diện theo mùa (Noel, Tết) tự bật / tự tắt theo NGÀY GIỜ VIỆT NAM.
 * Sếp Tuấn duyệt 27/09/2026. CLAUDE.md mục #48.
 *
 * Vì sao làm kiểu này: site là trang tĩnh trên GitHub Pages. Đợi tới ngày mới sửa rồi push
 * thì dễ trễ và dễ vấp lại các lỗi hiệu năng cũ. Nên giao diện mùa nằm sẵn trên web ở trạng
 * thái "ngủ": mỗi trang có một đoạn script nhỏ trong <head> tự xem hôm nay có thuộc mùa nào
 * không. Ngoài mùa nó chỉ so vài con số rồi thôi — khách tải thêm 0 byte.
 *
 * Trong mùa đoạn script:
 *   1. gắn class mua-noel / mua-tet lên <html> ngay (trước lần vẽ đầu);
 *   2. đặt window.TDC_MUA = { ten, chu } — chu là chữ mùa cho thanh "Đặt bàn online"
 *      (js/i18n.js, js/thanh-dat-ban.js, templates/blog-post.html đọc biến này);
 *   3. chờ sự kiện load rồi mới nạp dist/mua-<ten>.min.css, xong (hoặc lỗi) thì gắn class
 *      mua-san. Nạp SAU load để CSS mùa không giành băng thông với ảnh LCP (bug #5, #19, #24).
 *      style.css giấu tàu + đèn hero khi có mua-* mà chưa có mua-san, để khách không thấy bản
 *      thường rồi "đổi áo" giữa chừng; CSS lỗi thì mua-san vẫn gắn → hiện lại bản thường.
 *
 * Ngày Tết tính bằng thuật toán âm lịch của Hồ Ngọc Đức, múi giờ +7. KHÔNG chép lịch Tết
 * Trung Quốc: năm 2030 Việt Nam ăn Tết 02/02, Trung Quốc 03/02 (khác múi giờ lúc trăng non).
 *
 * Xem trước: ?mua=noel · ?mua=tet · ?mua=tat (tắt). Lựa chọn giữ trong sessionStorage
 * "tdc-mua" nên bấm sang trang khác vẫn còn; đóng tab là hết.
 *
 * Dùng:
 *   node scripts/mua-le.js          in lịch các mùa sắp tới
 *   require("./mua-le")             các hàm dưới (bundle-js, toi-uu-tai-trang, generate-blog-pages,
 *                                   seo-geo-verify R31 cùng dùng — đừng chép logic sang chỗ khác)
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CAU_HINH = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "mua-le.json"), "utf8"));
const TEN_MUA = ["noel", "tet"];

// ── Âm lịch Việt Nam (Hồ Ngọc Đức, https://www.informatik.uni-leipzig.de/~duc/amlich/) ──
const INT = Math.floor, PI = Math.PI;
function jdTuNgay(dd, mm, yy) {
    const a = INT((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
    let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
    if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
    return jd;
}
function jdSangNgay(jd) {
    let a, b, c;
    if (jd > 2299160) { a = jd + 32044; b = INT((4 * a + 3) / 146097); c = a - INT((b * 146097) / 4); }
    else { b = 0; c = jd + 32082; }
    const d = INT((4 * c + 3) / 1461), e = c - INT((1461 * d) / 4), m = INT((5 * e + 2) / 153);
    return [e - INT((153 * m + 2) / 5) + 1, m + 3 - 12 * INT(m / 10), b * 100 + d - 4800 + INT(m / 10)];
}
function trangNon(k, tz) {
    const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
    let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
    C1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
    C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
    C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
    const dt = T < -11
        ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
        : -0.000278 + 0.000265 * T + 0.000262 * T2;
    return INT(Jd1 + C1 - dt + 0.5 + tz / 24);
}
function kinhDoMatTroi(jdn, tz) {
    const T = (jdn - 2451545.5 - tz / 24) / 36525, T2 = T * T, dr = PI / 180;
    const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
    let L = (L0 + DL) * dr;
    L = L - PI * 2 * INT(L / (PI * 2));
    return INT(L / PI * 6);
}
function thang11(yy, tz) {
    const k = INT((jdTuNgay(31, 12, yy) - 2415021) / 29.530588853);
    let nm = trangNon(k, tz);
    if (kinhDoMatTroi(nm, tz) >= 9) nm = trangNon(k - 1, tz);
    return nm;
}
function thangNhuan(a11, tz) {
    const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let cu = 0, i = 1, cung = kinhDoMatTroi(trangNon(k + i, tz), tz);
    do { cu = cung; i++; cung = kinhDoMatTroi(trangNon(k + i, tz), tz); } while (cung !== cu && i < 14);
    return i - 1;
}
/** Ngày âm (không nhuận) → [ngày, tháng, năm] dương lịch, múi giờ +7. */
function amSangDuong(ngay, thang, nam) {
    const tz = 7;
    let a11, b11;
    if (thang < 11) { a11 = thang11(nam - 1, tz); b11 = thang11(nam, tz); }
    else { a11 = thang11(nam, tz); b11 = thang11(nam + 1, tz); }
    const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
    let off = thang - 11;
    if (off < 0) off += 12;
    if (b11 - a11 > 365 && off >= thangNhuan(a11, tz)) off += 1;
    return jdSangNgay(trangNon(k + off, tz) + ngay - 1);
}

// ── Bảng mùa ─────────────────────────────────────────────────────
const soNgay = (d, m, y) => y * 10000 + m * 100 + d;              // 20270206
const tuMMDD = (s, y) => { const [m, d] = s.split("-").map(Number); return soNgay(d, m, y); };
function tet(namTet) {
    const c = CAU_HINH.tet;
    // tháng 12 (Chạp) thuộc năm âm TRƯỚC Tết, tháng Giêng thuộc năm Tết
    const am = ([d, m]) => soNgay(...amSangDuong(d, m, m >= 11 ? namTet - 1 : namTet));
    return ["tet", am(c.tuAm), am(c.loiDenAm), am(c.denAm)];
}
function noel(nam) {
    const c = CAU_HINH.noel;
    const qua = (s) => (tuMMDD(s, nam) < tuMMDD(c.tu, nam) ? nam + 1 : nam);  // "01-01" < "12-01" → năm sau
    return ["noel", tuMMDD(c.tu, nam), tuMMDD(c.loiDen, qua(c.loiDen)), tuMMDD(c.den, qua(c.den))];
}
/** Hàng [tên, từ, hết-chữ-mùa, đến] (số yyyymmdd, gồm cả hai đầu). Chỉ phụ thuộc NĂM build
 *  → build lại trong cùng năm ra y hệt, không làm 141 bài blog đổi vô cớ. */
function bangMua(namGoc) {
    if (!namGoc) namGoc = +new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 4);
    const rows = [tet(namGoc)];
    for (let y = namGoc; y < namGoc + CAU_HINH.soNam; y++) rows.push(noel(y), tet(y + 1));
    return rows;
}

// ── Đoạn script đầu trang ────────────────────────────────────────
const MOC_DAU = "<!-- MUA:START (scripts/mua-le.js sinh, đừng sửa tay) -->";
const MOC_CUOI = "<!-- MUA:END -->";

/** vers = { noel: "<md5 8 ký tự của dist/mua-noel.min.css>", tet: "…" } */
function doanDauTrang(vers, namGoc) {
    const B = JSON.stringify(bangMua(namGoc));
    const C = {};
    for (const t of TEN_MUA) C[t] = CAU_HINH[t].chu;
    const V = {};
    for (const t of TEN_MUA) V[t] = vers[t] || "dev";
    // Viết tay cho gọn (chạy trên MỌI trang, trước CSS). Không throw ra ngoài: lỗi gì cũng chỉ mất
    // giao diện mùa, trang vẫn chạy như thường.
    const js = "!function(){try{var h=document.documentElement,n=+new Date(Date.now()+252e5).toISOString().slice(0,10).replace(/-/g,\"\")," +
        "B=" + B + ",C=" + JSON.stringify(C) + ",V=" + JSON.stringify(V) + ",m=\"\",l=0,q,i;" +
        "for(i=0;i<B.length;i++)if(n>=B[i][1]&&n<=B[i][3]){m=B[i][0];l=n<=B[i][2]}" +
        "q=/[?&]mua=(noel|tet|tat)(&|$)/.exec(location.search);q=q&&q[1];" +
        "try{if(q)sessionStorage.setItem(\"tdc-mua\",q);else q=sessionStorage.getItem(\"tdc-mua\")}catch(e){}" +
        "if(q){m=q==\"tat\"?\"\":q;l=1}" +
        "if(!m)return;" +
        "h.classList.add(\"mua-\"+m);" +
        "window.TDC_MUA={ten:m,chu:l?C[m]:null};" +
        "var f=function(){var k=document.createElement(\"link\");k.rel=\"stylesheet\";k.href=\"/dist/mua-\"+m+\".min.css?v=\"+V[m];" +
        "k.onload=k.onerror=function(){h.classList.add(\"mua-san\")};document.head.appendChild(k)};" +
        "document.readyState==\"complete\"?f():addEventListener(\"load\",f)}catch(e){}}();";
    return MOC_DAU + "\n<script>" + js + "</script>\n" + MOC_CUOI;
}

/** Chèn / cập nhật đoạn mùa ngay sau thẻ meta viewport — TRƯỚC mọi link CSS: script nội tuyến
 *  đứng sau một stylesheet chặn hiển thị phải chờ CSS đó tải xong mới chạy. */
function ganVaoTrang(html, vers) {
    const doan = doanDauTrang(vers);
    const re = /<!-- MUA:START[^>]*-->[\s\S]*?<!-- MUA:END -->/;
    if (re.test(html)) return html.replace(re, () => doan);
    const vp = /(<meta name="viewport"[^>]*>)/;
    if (!vp.test(html)) return html;
    return html.replace(vp, (m) => m + "\n" + doan);
}

/** Trang nào có đoạn mùa: mọi trang khách xem. Bỏ: file xác minh Google (nội dung phải y hệt),
 *  mảnh nav/footer (không có head), review-qr.html (trang in QR nội bộ, bug #37). */
function trangCanMua(file) {
    const ten = path.basename(file);
    if (/^google[0-9a-f]+\.html$/.test(ten) || ten === "review-qr.html") return false;
    return /[\\/]components[\\/]/.test(file) === false;
}

function versHienTai() {
    const { bamFile } = require("./van-tay");
    const v = {};
    for (const t of TEN_MUA) v[t] = bamFile(path.join(ROOT, "dist", "mua-" + t + ".min.css")) || "dev";
    return v;
}

// ── Hình tàu mùa: ghép phần trang trí vào --tau của style.css ────
// Không chép tay SVG tàu vào CSS mùa: sửa hình tàu trong style.css là tàu mùa tự theo.
const maUrl = (s) => 'url("data:image/svg+xml,' +
    s.replace(/%/g, "%25").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23") + '")';
function tauGoc() {
    const css = fs.readFileSync(path.join(ROOT, "css", "style.css"), "utf8");
    const xuoi = /--tau:url\("data:image\/svg\+xml,([^"]+)"\)/.exec(css);
    const lui = /--tau-lui:url\("data:image\/svg\+xml,([^"]+)"\)/.exec(css);
    if (!xuoi || !lui) throw new Error("mua-le: không tìm thấy --tau / --tau-lui trong css/style.css");
    return { xuoi: decodeURIComponent(xuoi[1]), lui: decodeURIComponent(lui[1]) };
}
/** Bản quay đầu: bọc nét vẽ sau </defs> trong nhóm lật gương quanh tâm viewBox -90..590
 *  — đúng cách --tau-lui trong style.css được làm (CLAUDE.md #45). */
function quayDau(svg) {
    const i = svg.indexOf("</defs>") + 7;
    return svg.slice(0, i) + "<g transform='matrix(-1 0 0 1 500 0)'>" + svg.slice(i, svg.lastIndexOf("</svg>")) + "</g></svg>";
}
function tauMua(ten) {
    const goc = tauGoc().xuoi;
    const nguon = fs.readFileSync(path.join(ROOT, "css", "mua", "tau-" + ten + ".svg"), "utf8");
    const trong = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(nguon)[1]
        .replace(/<!--[\s\S]*?-->/g, "").replace(/\s*\n\s*/g, "").trim();
    const xuoi = goc.slice(0, goc.lastIndexOf("</svg>")) + trong + "</svg>";
    return { xuoi: maUrl(xuoi), lui: maUrl(quayDau(xuoi)) };
}
/** Gọi sau khi bundle-js.js nén css/mua-*.css:
 *  - thay chỗ giữ TAU-MUA / TAU-MUA-LUI bằng hình tàu mùa;
 *  - nhúng mọi url("mua/<tên>.svg") thành data URI (hình viết thô, dễ sửa, trong css/mua/). */
function hoanTatCss(distDir) {
    for (const t of TEN_MUA) {
        const f = path.join(distDir, "mua-" + t + ".min.css");
        if (!fs.existsSync(f)) continue;
        const tau = tauMua(t);
        let s = fs.readFileSync(f, "utf8");
        s = s.replace(/TAU-MUA-LUI/g, () => tau.lui).replace(/TAU-MUA/g, () => tau.xuoi);
        s = s.replace(/url\("mua\/([a-z0-9-]+)\.svg"\)/g, (m, ten) => {
            const p = path.join(ROOT, "css", "mua", ten + ".svg");
            if (!fs.existsSync(p)) throw new Error("mua-le: thiếu hình css/mua/" + ten + ".svg");
            const svg = fs.readFileSync(p, "utf8").replace(/<!--[\s\S]*?-->/g, "").replace(/\s*\n\s*/g, "").trim();
            if (svg.includes('"')) throw new Error("mua-le: css/mua/" + ten + ".svg có dấu nháy kép — dùng nháy đơn");
            return maUrl(svg);
        });
        fs.writeFileSync(f, s, "utf8");
    }
}

module.exports = { amSangDuong, bangMua, doanDauTrang, ganVaoTrang, trangCanMua, versHienTai, tauGoc, quayDau, hoanTatCss, MOC_DAU, MOC_CUOI, TEN_MUA };

if (require.main === module) {
    const f = (n) => { const s = String(n); return s.slice(6) + "/" + s.slice(4, 6) + "/" + s.slice(0, 4); };
    console.log("Lịch giao diện mùa (giờ Việt Nam, gồm cả hai đầu):");
    for (const [t, tu, loi, den] of bangMua()) {
        console.log("  " + (t === "noel" ? "Noel" : "Tết ") + "  " + f(tu) + " → " + f(den) + "   chữ mùa trên thanh đặt bàn tới hết " + f(loi));
    }
}
