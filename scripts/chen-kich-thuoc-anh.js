// Chèn width/height thật vào mọi <img> còn thiếu, trên MỌI trang .html.
//
// Vì sao cần: css chỉ khai `.blog-post-body img{width:100%;height:auto}`.
// Không có width/height trên thẻ, trình duyệt không biết tỉ lệ ảnh nên dành
// cho nó chiều cao 0px; tới lúc ảnh tải xong mới bung ra đúng cỡ và đẩy toàn
// bộ chữ bên dưới xuống. Đó chính là CLS. Ảnh blog lại còn loading="lazy" nên
// cú đẩy xảy ra đúng lúc khách đang đọc — kiểu nhảy khó chịu nhất.
// Rà soát 04/09/2026 đếm được 770 thẻ <img> thiếu cặp này.
//
// Vì sao là script sinh tự động chứ không sửa tay: ảnh nằm rải ở 3 nguồn —
// templates/blog-post.html (hero), generate-blog-pages.js (thẻ bài liên quan)
// và 236 thẻ <img> viết tay trong data/blog-data.js. Sửa tay cả ba rồi vẫn
// hỏng ở bài viết tiếp theo. Để một máy đọc kích thước thật từ file ảnh thì
// thêm bài mới bao nhiêu cũng tự khớp.
//
// Chạy được nhiều lần, không đổi gì thêm: thẻ nào đã đủ width+height thì bỏ qua.

const fs = require("fs");
const path = require("path");
const { kichThuocAnh } = require("./kich-thuoc-anh.js");

const ROOT = path.join(__dirname, "..");
const BO_QUA_THU_MUC = new Set([".git", "node_modules", "dist", "plans", "docs"]);

function gomTrangHtml(dir, out = []) {
    for (const f of fs.readdirSync(dir)) {
        if (BO_QUA_THU_MUC.has(f)) continue;
        const fp = path.join(dir, f);
        let st;
        try { st = fs.statSync(fp); } catch (e) { continue; }
        if (st.isDirectory()) gomTrangHtml(fp, out);
        else if (f.endsWith(".html")) out.push(fp);
    }
    return out;
}

// Lấy giá trị một thuộc tính trong chuỗi attribute của thẻ.
function attr(s, ten) {
    const m = s.match(new RegExp("(?:^|\\s)" + ten + "\\s*=\\s*[\"']([^\"']*)[\"']", "i"));
    return m ? m[1] : null;
}
function coAttr(s, ten) {
    return new RegExp("(?:^|\\s)" + ten + "\\s*=", "i").test(s);
}

/** Đổi src trong HTML thành đường dẫn file thật, hoặc null nếu không đo được. */
function timFileAnh(src, thuMucTrang) {
    if (!src) return null;
    if (/^(https?:|data:|\/\/)/i.test(src)) return null;   // ảnh ngoài hoặc data URI
    const sach = src.split("#")[0].split("?")[0];
    if (!sach) return null;
    const goc = sach.startsWith("/")
        ? path.join(ROOT, sach.slice(1))
        : path.join(thuMucTrang, sach);
    return fs.existsSync(goc) ? goc : null;
}

function xuLyMotTrang(file) {
    const truoc = fs.readFileSync(file, "utf8");
    const thuMuc = path.dirname(file);
    let chen = 0, khongDo = 0;

    const sau = truoc.replace(/<img\b([^>]*?)(\/?)>/gi, function (nguyen, thuocTinh, dongCheo) {
        const coW = coAttr(thuocTinh, "width");
        const coH = coAttr(thuocTinh, "height");
        if (coW && coH) return nguyen;              // đã đủ, không đụng

        // Ảnh lazy trên trang chủ để src là data: URI còn ảnh thật nằm ở data-src.
        let file2 = timFileAnh(attr(thuocTinh, "src"), thuMuc);
        if (!file2) file2 = timFileAnh(attr(thuocTinh, "data-src"), thuMuc);
        if (!file2) { khongDo++; return nguyen; }

        const kt = kichThuocAnh(file2);
        if (!kt) { khongDo++; return nguyen; }

        // Chỉ thêm thuộc tính còn THIẾU — không ghi đè con số tác giả đã đặt.
        let them = "";
        if (!coW) them += ' width="' + kt.w + '"';
        if (!coH) them += ' height="' + kt.h + '"';
        chen++;

        // Chèn ngay sau `<img`, trước các thuộc tính khác, cho dễ đọc diff.
        return "<img" + them + thuocTinh + dongCheo + ">";
    });

    if (sau !== truoc) fs.writeFileSync(file, sau, "utf8");
    return { chen, khongDo, doi: sau !== truoc };
}

function chay() {
    const trang = gomTrangHtml(ROOT);
    let tongChen = 0, tongKhongDo = 0, soTrangDoi = 0;
    const khongDoTheoTrang = [];

    for (const f of trang) {
        const r = xuLyMotTrang(f);
        tongChen += r.chen;
        tongKhongDo += r.khongDo;
        if (r.doi) soTrangDoi++;
        if (r.khongDo) khongDoTheoTrang.push(path.relative(ROOT, f).replace(/\\/g, "/") + " (" + r.khongDo + ")");
    }

    console.log("  chen-kich-thuoc-anh: " + tongChen + " thẻ <img> được thêm width/height · "
        + soTrangDoi + "/" + trang.length + " trang đổi");
    if (tongKhongDo) {
        console.log("  " + tongKhongDo + " thẻ không đo được (ảnh ngoài site hoặc file không có) — bỏ qua:");
        console.log("    " + khongDoTheoTrang.slice(0, 3).join(", ")
            + (khongDoTheoTrang.length > 3 ? " …+" + (khongDoTheoTrang.length - 3) + " trang" : ""));
    }
    return { tongChen, tongKhongDo };
}

if (require.main === module) chay();
module.exports = { chay };
