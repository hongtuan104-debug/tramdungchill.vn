/***
 * cat-phong.js
 * Cắt nhỏ 8 file .woff2 xuống đúng những ký tự website thật sự dùng.
 *
 * VÌ SAO: đo 01/09/2026, phông chiếm 165 KiB trên tổng 325 KiB byte của nhà
 * mình — hơn một nửa — trong khi các bộ subset của Google chở khoảng 380 glyph
 * mỗi bộ còn cả site chỉ dùng 250 ký tự khác nhau (đã tính cả emoji, mà emoji
 * vốn không nằm trong hai phông này). Phông giành băng thông với ảnh hero, và
 * Dancing Script còn được preload ở mức ưu tiên cao nhất: phần tử LCP là
 * <span class="logo-main"> — chữ vẽ bằng chính phông đó — với render delay
 * 2.540ms, trong khi FCP chỉ 1,9s.
 *
 * VÌ SAO AN TOÀN (khác hẳn phương án "hoãn tải phông" đã bị loại):
 * cắt bớt glyph KHÔNG đổi số đo của glyph nào còn lại, nên bộ số size-adjust
 * của 3 phông lót *Fallback vẫn đúng nguyên → không sinh CLS. Còn hoãn tải thì
 * dời thời điểm swap và có thể làm CLS của khách thật tệ đi.
 *
 * BẢN GỐC NẰM Ở assets/fonts/_goc/ — script luôn cắt TỪ ĐÓ, không bao giờ cắt
 * từ file đã cắt. Thiếu bước này thì lần sau thêm chữ mới là mất glyph vĩnh
 * viễn: cắt lại từ bản đã cắt không thể lấy lại glyph đã bỏ.
 *
 * Tập ký tự gom từ CHÍNH nội dung site (mọi trang .html + cả 2 ngôn ngữ trong
 * data/translations.js), nên thêm chữ mới rồi chạy lại build là tự khớp.
 *
 * Cách chạy:  node scripts/cat-phong.js   (bundle-js.js gọi sẵn)
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
/* .gitignore của dự án CHẶN package.json, nên máy vừa clone về sẽ không có gói
   này. Không được để build gãy vì thế: thiếu gói thì bỏ qua bước cắt, các file
   phông đã cắt sẵn nằm trong git vẫn dùng bình thường.
   Cài lại khi cần:  npm install --save-dev subset-font  */
let subsetFont = null;
try { subsetFont = require("subset-font"); } catch (e) { /* xử ở dưới */ }

const ROOT = path.resolve(__dirname, "..");
const GOC = path.join(ROOT, "assets/fonts/_goc");
const RA = path.join(ROOT, "assets/fonts");

/* Gom mọi ký tự xuất hiện trong nội dung site */
function gomKyTu() {
    const tap = new Set();
    /* LƯU Ý: phải giữ dấu cách (32) và no-break space (160).
       Bản đầu lọc "> 32" để bỏ ký tự điều khiển, nhưng 32 chính là dấu cách —
       phông cắt ra không có glyph khoảng trắng. scripts/kiem-phong-lot.js bắt
       được ngay: bề rộng "Trạm Dừng Chill" tụt 324px → 297px (hụt đúng 2 dấu
       cách) và size-adjust tính ra lệch 82,92% → 81,97%. */
    const nap = (t) => {
        for (const c of String(t)) {
            const m = c.charCodeAt(0);
            if (m === 32 || m === 160 || m > 32) tap.add(c);
        }
    };
    tap.add(" ");
    tap.add(String.fromCharCode(160));

    // Chữ hiển thị trong mọi trang HTML
    const files = [];
    (function di(d) {
        for (const f of fs.readdirSync(d)) {
            const p = path.join(d, f);
            if (fs.statSync(p).isDirectory()) {
                if (!/node_modules|\.git|dist|assets|plans|docs/.test(p)) di(p);
            } else if (f.endsWith(".html")) files.push(p);
        }
    })(ROOT);

    for (const f of files) {
        let s = fs.readFileSync(f, "utf8");
        // bỏ script/style/comment: chữ trong đó không được vẽ ra
        s = s.replace(/<script[\s\S]*?<\/script>/g, "")
             .replace(/<style[\s\S]*?<\/style>/g, "")
             .replace(/<!--[\s\S]*?-->/g, "");
        nap(s.replace(/<[^>]+>/g, " "));
    }

    // Cả 2 ngôn ngữ: khách bấm EN là chữ đổi hết
    const src = fs.readFileSync(path.join(ROOT, "data/translations.js"), "utf8");
    const sandbox = {};
    vm.runInNewContext(src + "\n;this.T = TRANSLATIONS;", sandbox);
    for (const lang of Object.keys(sandbox.T)) {
        for (const k of Object.keys(sandbox.T[lang])) nap(sandbox.T[lang][k]);
    }

    return [...tap].sort().join("");
}

(async function () {
    if (!subsetFont) {
        console.log("  (bỏ qua: chưa cài subset-font — dùng phông đã cắt sẵn trong git)");
        return;
    }
    if (!fs.existsSync(GOC)) {
        console.error("  ✗ Không thấy assets/fonts/_goc — bỏ qua bước cắt phông.");
        return;
    }
    const chars = gomKyTu();
    console.log("  Tập ký tự gom từ nội dung site: " + chars.length + " ký tự");

    const kb = (n) => (n / 1024).toFixed(1) + " KB";
    let cu = 0, moi = 0, ghi = 0;

    for (const f of fs.readdirSync(GOC).sort()) {
        if (!f.endsWith(".woff2")) continue;
        const goc = fs.readFileSync(path.join(GOC, f));
        let out;
        try {
            out = await subsetFont(goc, chars, { targetFormat: "woff2" });
        } catch (e) {
            console.error("  ✗ " + f + " — " + e.message.split("\n")[0]);
            continue;
        }
        cu += goc.length; moi += out.length;
        const dich = path.join(RA, f);
        const truoc = fs.existsSync(dich) ? fs.readFileSync(dich) : null;
        if (!truoc || !truoc.equals(out)) {
            fs.writeFileSync(dich, out);
            ghi++;
            console.log("  ✓ " + f.padEnd(38) + kb(goc.length).padStart(9) + " → " + kb(out.length).padStart(9));
        } else {
            console.log("  = " + f.padEnd(38) + "(không đổi)");
        }
    }
    console.log("  Tổng: " + kb(cu) + " → " + kb(moi) + "  (giảm " + (100 - moi / cu * 100).toFixed(0) + "%) · " + ghi + " file được ghi");
})();
