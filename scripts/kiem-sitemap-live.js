/**
 * kiem-sitemap-live.js — checklist #29 mục 266 + 268, phần chỉ máy chủ mới trả lời được.
 *
 * R26 trong seo-geo-verify.js canh phần TĨNH (URL có file thật, canonical tự trỏ,
 * không noindex, hình dạng URL). Nhưng "trả 200 và KHÔNG redirect" là chuyện của
 * máy chủ: cùng một sitemap đúng y nguyên, GitHub Pages vẫn có thể trả 301 (thiếu
 * dấu gạch chéo cuối), 404 (file chưa deploy xong) hay gắn X-Robots-Tag ở header —
 * header thì đọc file trong repo không bao giờ thấy.
 *
 * Chạy:  node scripts/kiem-sitemap-live.js
 *        node scripts/kiem-sitemap-live.js --nhanh   (bỏ phần canonical, chỉ xem header)
 * Thoát khác 0 nếu có mục hỏng → cắm được vào CI hoặc chạy tay sau mỗi lần deploy.
 *
 * ⚠️ Chạy SAU khi GitHub Pages deploy xong (thường 1–2 phút), không thì cả 27 URL
 *    báo nội dung cũ mà không phải lỗi gì của sitemap.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const ROOT = path.resolve(__dirname, "..");
const MIEN = "https://tramdungchill.vn";
const NHANH = process.argv.includes("--nhanh");

// Gọi MỘT lần, KHÔNG tự đi theo redirect: mục đích là nhìn thấy cú 301 chứ không
// phải né nó. Trả về { code, headers, body }.
function goi(url, method) {
    return new Promise((ok, loi) => {
        const u = new URL(url);
        const mod = u.protocol === "http:" ? http : https;
        const req = mod.request({
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: method || "GET",
            headers: { "User-Agent": "tramdungchill-kiem-sitemap/1.0", "Accept": "text/html,*/*" },
            timeout: 30000
        }, (res) => {
            let body = "";
            res.setEncoding("utf8");
            res.on("data", (c) => { if (body.length < 200000) body += c; });
            res.on("end", () => ok({ code: res.statusCode, headers: res.headers, body }));
        });
        req.on("timeout", () => { req.destroy(new Error("quá 30 giây")); });
        req.on("error", loi);
        req.end();
    });
}

(async () => {
    const pham = [];
    const smText = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
    const urls = [...smText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

    console.log("\n🔎 KIỂM SITEMAP TRÊN MÁY CHỦ THẬT — " + urls.length + " URL\n");

    let dat = 0;
    for (const u of urls) {
        let r;
        try { r = await goi(u); } catch (e) { pham.push(u + ": không gọi được (" + e.message + ")"); continue; }

        const loi = [];
        if (r.code !== 200) {
            loi.push("mã " + r.code + (r.headers.location ? " → " + r.headers.location : ""));
        }
        // X-Robots-Tag ở header chặn index y như thẻ meta, mà nhìn HTML không thấy.
        const xr = r.headers["x-robots-tag"];
        if (xr && /noindex|none/i.test(xr)) loi.push("header X-Robots-Tag: " + xr);

        if (!NHANH && r.code === 200) {
            const can = (r.body.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || [])[1];
            if (!can) loi.push("bản live không có canonical");
            else if (can !== u) loi.push("canonical bản live = " + can);
            if (/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(r.body)) loi.push("bản live có noindex");
        }

        if (loi.length) { pham.push(u + ": " + loi.join(" · ")); console.log("  ❌ " + u + " — " + loi.join(" · ")); }
        else { dat++; }
    }
    console.log("  ✅ " + dat + "/" + urls.length + " URL trả 200, không chuyển hướng, canonical tự trỏ\n");

    // ── Phần ngoài sitemap: những URL quyết định property bao phủ được gì ──────
    // Mục 264: property đang là dạng URL-prefix "https://tramdungchill.vn/". Bản
    // http:// và bản www. KHÔNG nằm trong property đó, nên nếu chúng trả 200 thay
    // vì 301 thì Google có hai bản cùng nội dung mà báo cáo chỉ thấy một.
    const bienThe = [
        ["http://tramdungchill.vn/", "phải 301 sang https (bật Enforce HTTPS trong GitHub Pages → Settings → Pages)"],
        ["https://www.tramdungchill.vn/", "phải 301 sang bản không www"],
        ["http://www.tramdungchill.vn/", "phải 301"]
    ];
    console.log("  Bản khác của cùng trang chủ:");
    for (const [u, mongDoi] of bienThe) {
        let r;
        try { r = await goi(u, "HEAD"); } catch (e) { console.log("  ⚠️  " + u + " — không gọi được (" + e.message + ")"); continue; }
        const chuyen = r.code >= 300 && r.code < 400;
        if (chuyen) console.log("  ✅ " + u + " → " + r.code + " " + (r.headers.location || ""));
        else { pham.push(u + ": trả " + r.code + " — " + mongDoi); console.log("  ❌ " + u + " trả " + r.code + " — " + mongDoi); }
    }

    // Mục 265: dấu xác minh quyền sở hữu phải tải được thật. Còn trong repo mà
    // deploy hỏng thì Google vẫn coi là mất xác minh.
    const dauXacMinh = fs.readdirSync(ROOT).filter((f) => /^google[0-9a-z]+\.html$/i.test(f))[0];
    if (dauXacMinh) {
        const r = await goi(MIEN + "/" + dauXacMinh).catch(() => null);
        if (!r || r.code !== 200 || !r.body.includes(dauXacMinh)) {
            pham.push("file xác minh " + dauXacMinh + " không tải được trên máy chủ");
            console.log("  ❌ " + dauXacMinh + " — không tải được (mất file này là mất property)");
        } else {
            console.log("  ✅ " + dauXacMinh + " tải được, nội dung khớp");
        }
    }

    // Mục 266: sitemap và robots.txt phải tự tải được, và robots phải trỏ đúng sitemap.
    for (const [u, kiem] of [[MIEN + "/sitemap.xml", /<urlset/], [MIEN + "/robots.txt", /Sitemap:\s*https:\/\/tramdungchill\.vn\/sitemap\.xml/]]) {
        const r = await goi(u).catch(() => null);
        if (!r || r.code !== 200 || !kiem.test(r.body)) {
            pham.push(u + ": không tải được hoặc nội dung sai");
            console.log("  ❌ " + u);
        } else console.log("  ✅ " + u);
    }

    console.log("\n" + (pham.length ? "  " + pham.length + " mục cần sửa" : "  Tất cả đạt") + "\n");
    process.exit(pham.length ? 1 : 0);
})();
