/**
 * kiem-schema-live.js
 * Chạy Schema Markup Validator (validator.schema.org) trên trang ĐANG CHẠY THẬT,
 * mỗi mẫu trang một URL đại diện — checklist SEO #23 mục 195/199/200/203.
 *
 * Chạy SAU khi push và GitHub Pages deploy xong:
 *   node scripts/kiem-schema-live.js              # 1 URL cho mỗi mẫu trang
 *   node scripts/kiem-schema-live.js --all        # mọi URL trong sitemap.xml
 *   node scripts/kiem-schema-live.js menu.html    # URL tuỳ chọn — KHÔNG gõ "/" ở đầu:
 *                                                 # Git Bash đổi "/menu.html" thành đường dẫn Windows
 * Thoát khác 0 nếu có lỗi / cảnh báo / lệch số khối.
 *
 * Validator RENDER JS rồi mới đọc schema, nên nó trả lời được luôn câu "HTML Google
 * render có còn schema không" (mục 199): số khối JSON-LD sau render phải BẰNG số
 * khối trong file tĩnh. Nhiều hơn = có JS chèn thêm (đúng bug #12, 18 BlogPosting
 * trên blog.html chỉ lộ ra khi render); ít hơn = JS lỗi làm mất.
 * Nhớ: file trên máy mới hơn production (chưa deploy) cũng sinh lệch.
 *
 * ⚠️ Validator KHÔNG biết thuộc tính nào Google khuyến nghị — ngày 13/09/2026 nó
 *    báo 0 lỗi cho geo 4 chữ số thập phân và video thiếu duration. Phần đó là
 *    việc của luật R7e trong seo-geo-verify.js (chạy trước commit). Hai công cụ
 *    bổ sung cho nhau, đừng bỏ cái nào.
 * ⚠️ Endpoint /validate là API nội bộ của trang validator, không ai cam kết giữ.
 *    Báo "không đọc được phản hồi" thì mở https://validator.schema.org/ kiểm tay.
 * ⚠️ Rich Results Test KHÔNG có API. Đổi template nào thì dán tay URL đại diện
 *    của template đó vào https://search.google.com/test/rich-results.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://tramdungchill.vn";

const trongSitemap = [...fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8")
    .matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

// Một URL cho mỗi mẫu trang — sửa template nào thì URL tương ứng phải qua.
const DAI_DIEN = [
    "/",                    // index.html: Restaurant, WebSite, WebPage, FAQPage, 3 VideoObject
    "/menu.html",           // Menu 81 món
    "/blog.html",           // CollectionPage + Blog
    "/duong-di/",           // WebPage + BreadcrumbList
    "/dip/sinh-nhat.html",  // mẫu 4 trang dịp: Service
    // mẫu 141 bài blog (templates/blog-post.html) — lấy bài đang index đầu tiên
    (trongSitemap.find((u) => u.includes("/blog/")) || SITE + "/blog.html").replace(SITE, ""),
];

const args = process.argv.slice(2);
// Git Bash (MSYS) tự đổi đối số "/menu.html" thành "C:/Program Files/Git/menu.html"
// trước khi Node nhận — dính thật 13/09/2026: 4 URL thành "https://tramdungchill.vnC:/…".
// Gặp dạng đó thì dừng và nói cách gõ, đừng gửi URL rác cho validator rồi báo ❌ oan.
const biDoi = args.filter((u) => /^[A-Za-z]:[\\/]/.test(u));
if (biDoi.length) {
    console.error("❌ Đối số đã bị Git Bash đổi thành đường dẫn Windows: " + biDoi.join(", ") +
        "\n   Gõ không có dấu / ở đầu (vd: tac-gia/nguyen-duy.html) hoặc URL đầy đủ https://…");
    process.exit(1);
}
const urls = args.includes("--all")
    ? trongSitemap
    : (args.length ? args : DAI_DIEN)
        .map((u) => (u.startsWith("http") ? u : SITE + "/" + u.replace(/^\/+/, "")));

function fileTinh(url) {
    let p = url.replace(SITE, "").replace(/^\//, "");
    if (p === "" || p.endsWith("/")) p += "index.html";
    const abs = path.join(ROOT, p);
    return fs.existsSync(abs) ? abs : null;
}

// Validator trả cây node → thuộc tính, lỗi nằm rải ở mảng `errors` từng cấp
function gomLoi(o, duong, out) {
    if (Array.isArray(o)) return o.forEach((x) => gomLoi(x, duong, out));
    if (!o || typeof o !== "object") return;
    const tiep = o.pred || o.typeGroup ? duong.concat(o.pred || o.typeGroup) : duong;
    if (Array.isArray(o.errors) && o.errors.length) {
        out.push(tiep.join(" › ") + ": " + JSON.stringify(o.errors).slice(0, 200));
    }
    for (const [k, v] of Object.entries(o)) {
        if (k !== "errors" && k !== "html") gomLoi(v, tiep, out);
    }
}

(async () => {
    console.log("\n🔎 SCHEMA LIVE — validator.schema.org · " + urls.length + " URL\n");
    let hong = 0;

    for (const url of urls) {
        // Giãn nhịp: gọi dồn là validator trả HTTP 429 (trang "unusual traffic" của
        // Google) — dính thật 13/09/2026 sau ~45 lượt gọi trong một buổi.
        if (urls.indexOf(url) > 0) await new Promise((r) => setTimeout(r, 3000));
        let j;
        try {
            const res = await fetch("https://validator.schema.org/validate", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: "url=" + encodeURIComponent(url),
            });
            if (res.status === 429) {
                hong++;
                console.log("  ❌  " + url + "\n        validator đang chặn tạm vì gọi dồn (HTTP 429) — đợi 15–30 phút rồi chạy lại. Không phải lỗi của trang.");
                continue;
            }
            j = JSON.parse((await res.text()).replace(/^\)\]\}'\s*/, ""));
        } catch (e) {
            hong++;
            console.log("  ❌  " + url + "\n        không đọc được phản hồi validator (" + e.message + ") — kiểm tay");
            continue;
        }

        const loi = [];
        if (Array.isArray(j.errors) && j.errors.length) loi.push("(trang): " + JSON.stringify(j.errors).slice(0, 200));
        gomLoi(j.tripleGroups, [], loi);

        const render = ((j.html || "").match(/application\/ld\+json/g) || []).length;
        const f = fileTinh(url);
        const tinh = f ? (fs.readFileSync(f, "utf8").match(/application\/ld\+json/g) || []).length : null;
        const lech = tinh !== null && render !== tinh;
        const loai = [...new Set((j.tripleGroups || []).flatMap((g) => g.nodes || [])
            .map((n) => n.typeGroup).filter(Boolean))];

        const ok = j.totalNumErrors === 0 && j.totalNumWarnings === 0 && !lech && render > 0 && loi.length === 0;
        if (!ok) hong++;
        console.log("  " + (ok ? "✅" : "❌") + "  " + url.replace(SITE, "") + (j.isRendered === false ? "  (validator KHÔNG render JS)" : ""));
        console.log("        " + j.totalNumErrors + " lỗi · " + j.totalNumWarnings + " cảnh báo · JSON-LD sau render "
            + render + (tinh === null ? "" : (lech ? " ≠ " : " = ") + "file tĩnh " + tinh)
            // chỉ node GỐC: Restaurant lồng trong publisher/about nên không hiện ở đây, không phải bị mất
            + " · node gốc: " + (loai.join(", ") || "không có"));
        loi.slice(0, 5).forEach((x) => console.log("          - " + x));
    }

    console.log("\n  " + (urls.length - hong) + "/" + urls.length + " URL sạch" + (hong ? "  —  " + hong + " URL cần xem" : "  —  tất cả đạt") + "\n");
    process.exit(hong ? 1 : 0);
})();
