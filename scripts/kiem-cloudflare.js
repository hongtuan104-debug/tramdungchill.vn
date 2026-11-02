/**
 * kiem-cloudflare.js — kiểm tramdungchill.vn trước / trong / sau khi đặt Cloudflare
 * phía trước GitHub Pages. Hướng dẫn bấm: docs/cloudflare-cache.md.
 *
 * Canh đúng những cái bẫy trong tài liệu đó, nặng trước nhẹ sau:
 *   - app.tramdungchill.vn (app nhận đơn, chạy Vercel) bị bật mây cam → app nhận đơn hỏng
 *   - sw.js / HTML bị giữ lâu → khách cũ kẹt bản cũ, không ép được từ xa
 *   - "managed robots.txt" / chặn bot AI → mất GPTBot, ClaudeBot, Google-Extended (R23)
 *   - Cloudflare chèn script vào HTML (Rocket Loader, Web Analytics, /cdn-cgi/…) → đè LCP/TBT
 *   - chứng chỉ gốc của GitHub hết hạn (sau khi bật proxy, GitHub gia hạn không chắc chạy)
 *
 * Chạy được ở mọi giai đoạn: chưa đổi nameserver / chưa bật mây cam thì các mục chỉ dành
 * cho Cloudflare in "ℹ️" chứ không báo hỏng.
 *
 * Chạy:  node scripts/kiem-cloudflare.js
 * Thoát khác 0 nếu có mục ❌.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const tls = require("tls");

const ROOT = path.resolve(__dirname, "..");
const MIEN = "tramdungchill.vn";
const IP_GITHUB = "185.199.108.153"; // gọi thẳng máy chủ gốc, né Cloudflare
const BA_MUOI_NGAY = 30 * 86400;

const ketQua = [];
const ghi = (trangThai, muc, chiTiet) => ketQua.push({ trangThai, muc, chiTiet: chiTiet || "" });

// Một mục gọi mạng hỏng thì ghi lại rồi chạy tiếp, đừng để cả bộ kiểm tắt ngang.
async function thu(muc, fn) {
    try { await fn(); } catch (e) { ghi("loi", muc, "không gọi được: " + e.message); }
}

// Gọi MỘT lần, không tự đi theo redirect (phải thấy được cú 301), không xin gzip.
function goi(url, ua) {
    return new Promise((ok, loi) => {
        const u = new URL(url);
        const mod = u.protocol === "http:" ? http : https;
        const t0 = process.hrtime.bigint();
        const req = mod.request({
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: "GET",
            headers: { "User-Agent": ua || "tramdungchill-kiem-cloudflare/1.0", "Accept": "*/*" },
            agent: false,
            timeout: 30000
        }, (res) => {
            const ttfb = Number(process.hrtime.bigint() - t0) / 1e6;
            let body = "";
            res.setEncoding("utf8");
            res.on("data", (c) => { if (body.length < 400000) body += c; });
            res.on("end", () => ok({ code: res.statusCode, headers: res.headers, body, ttfb }));
        });
        req.on("timeout", () => req.destroy(new Error("quá 30 giây")));
        req.on("error", loi);
        req.end();
    });
}

async function dns(ten, kieu) {
    const r = await fetch("https://dns.google/resolve?name=" + ten + "&type=" + kieu);
    const j = await r.json();
    return (j.Answer || []).map((a) => ({ kieu: a.type, giaTri: String(a.data).replace(/\.$/, "") }));
}

function chungChi(host) {
    return new Promise((ok, loi) => {
        const s = tls.connect({ host, port: 443, servername: MIEN, rejectUnauthorized: false, timeout: 20000 }, () => {
            const c = s.getPeerCertificate();
            const kq = {
                nhaCap: (c.issuer && (c.issuer.O || c.issuer.CN)) || "?",
                hetHan: new Date(c.valid_to),
                hopLe: s.authorized,
                loiXacThuc: s.authorizationError
            };
            s.end();
            ok(kq);
        });
        s.on("timeout", () => s.destroy(new Error("quá 20 giây")));
        s.on("error", loi);
    });
}

const soNgay = (d) => Math.floor((d.getTime() - Date.now()) / 86400000);
const ngayVN = (d) => d.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
const maxAge = (h) => {
    const m = /max-age=(\d+)/.exec(h["cache-control"] || "");
    return m ? Number(m[1]) : null;
};
const tomTatCache = (r) => "max-age=" + maxAge(r.headers) + (r.headers["cf-cache-status"] ? " · cf-cache-status " + r.headers["cf-cache-status"] : "");

(async () => {
    console.log("\n☁️  KIỂM CLOUDFLARE — " + MIEN + "\n");

    // ── Giai đoạn: đã đổi nameserver chưa, trang chủ có đi qua proxy chưa ──
    const ns = (await dns(MIEN, "NS")).filter((x) => x.kieu === 2).map((x) => x.giaTri);
    const nsCf = ns.length > 0 && ns.every((n) => n.endsWith(".ns.cloudflare.com"));
    ghi("tin", "Nameserver", ns.join(", ") + (nsCf ? " → đã ở Cloudflare" : " → chưa chuyển sang Cloudflare"));

    const trangChu = await goi("https://" + MIEN + "/");
    const quaProxy = String(trangChu.headers.server || "").toLowerCase() === "cloudflare";
    ghi("tin", "Trang chủ đi qua", quaProxy
        ? "proxy Cloudflare (mây cam) · cf-ray " + trangChu.headers["cf-ray"]
        : "thẳng GitHub Pages (" + (trangChu.headers["x-served-by"] || trangChu.headers.server) + ")");

    // ── 1. App nhận đơn KHÔNG được đi qua proxy ──
    await thu("app." + MIEN, async () => {
        const chuoi = await dns("app." + MIEN, "A");
        const cname = chuoi.filter((x) => x.kieu === 5).map((x) => x.giaTri);
        let server = "?";
        try { server = (await goi("https://app." + MIEN + "/")).headers.server || "?"; } catch (e) { server = "lỗi: " + e.message; }
        const dung = cname.some((c) => /vercel/i.test(c)) && !/cloudflare/i.test(server);
        ghi(dung ? "ok" : "loi", "app." + MIEN + " (app nhận đơn) không đi qua proxy",
            "CNAME " + (cname.join(" → ") || "không có") + " · server: " + server +
            (dung ? "" : " — trong DNS của Cloudflare bản ghi app phải để mây XÁM (DNS only)"));
    });

    // ── 2. Chuyển hướng ──
    await thu("www → apex", async () => {
        const r = await goi("https://www." + MIEN + "/");
        const dung = [301, 308].includes(r.code) && /^https:\/\/tramdungchill\.vn\/?$/.test(r.headers.location || "");
        ghi(dung ? "ok" : "loi", "www → https://tramdungchill.vn/", r.code + " " + (r.headers.location || ""));
    });
    await thu("http → https", async () => {
        const r = await goi("http://" + MIEN + "/");
        const dung = [301, 308].includes(r.code) && (r.headers.location || "").startsWith("https://" + MIEN);
        ghi(dung ? "ok" : (quaProxy ? "loi" : "canh"), "http → https", r.code + " " + (r.headers.location || "") +
            (dung ? "" : quaProxy ? " — thiếu Redirect Rule (bước B4)" : " — chưa bật Enforce HTTPS bên GitHub (bước B0)"));
    });
    // Redirect Rule phải tick "Preserve query string" — thiếu là link quảng cáo http://…?utm_… mất UTM.
    await thu("http → https giữ tham số", async () => {
        const r = await goi("http://" + MIEN + "/menu.html?utm_source=kiem_cf&v=1");
        const loc = r.headers.location || "";
        const dung = [301, 308].includes(r.code) && loc === "https://" + MIEN + "/menu.html?utm_source=kiem_cf&v=1";
        ghi(dung ? "ok" : (quaProxy ? "loi" : "canh"), "http → https giữ nguyên đường dẫn + tham số", r.code + " " + loc +
            (dung ? "" : quaProxy ? " — Redirect Rule chưa tick \"Preserve query string\"" : ""));
    });
    await thu("đường gia hạn chứng chỉ", async () => {
        const r = await goi("http://" + MIEN + "/.well-known/acme-challenge/kiem-thu-tdc");
        ghi("tin", "http /.well-known/acme-challenge/", r.code + (r.headers.location ? " → " + r.headers.location : "") +
            " (mong đợi: 404, KHÔNG bị chuyển sang https)");
    });

    // ── 3. Bot AI + robots.txt (R23) ──
    await thu("robots.txt", async () => {
        const live = (await goi("https://" + MIEN + "/robots.txt")).body.replace(/\r/g, "");
        const repo = fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8").replace(/\r/g, "");
        const botAi = /^user-agent:\s*(gptbot|claudebot|google-extended|ccbot|applebot-extended|amazonbot|bytespider|oai-searchbot|perplexitybot)\s*$/im;
        const chanAi = live.split(/\n\s*\n/).some((g) => botAi.test(g) && /^disallow:\s*\/\s*$/im.test(g));
        if (chanAi || /content-signal/i.test(live)) {
            ghi("loi", "robots.txt bị Cloudflare chèn lệnh chặn bot AI",
                "tắt \"managed robots.txt\" trong Security Settings (bước B1/B4)");
        } else if (live.trim() === repo.trim()) {
            ghi("ok", "robots.txt y hệt file trong repo");
        } else {
            ghi("canh", "robots.txt khác file trong repo", "deploy chưa xong, hoặc có lớp nào đang sửa nó");
        }
    });
    await thu("bot AI", async () => {
        const r = await goi("https://" + MIEN + "/", "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)");
        const bi = [403, 503].includes(r.code);
        ghi(bi ? "loi" : "tin", "Giả làm GPTBot gọi trang chủ", r.code + (bi
            ? " — Cloudflare đang chặn bot AI: Security → AI bots → Allow"
            : " — không bị chặn. Cloudflare chỉ chặn bot AI THẬT (xác minh theo IP) nên vẫn phải xem trong dashboard"));
    });

    // ── 4. Cloudflare không được sửa HTML ──
    const dauChen = /\/cdn-cgi\/[^"' >]*|cloudflareinsights|data-cf-beacon|rocket-loader|-text\/javascript|__cf_email__/gi;
    for (const p of ["/", "/menu.html", "/blog.html", "/dip/sinh-nhat.html"]) {
        await thu("HTML " + p, async () => {
            const r = p === "/" ? trangChu : await goi("https://" + MIEN + p);
            const thay = [...new Set(r.body.match(dauChen) || [])];
            const rocket = thay.some((x) => /rocket|-text\/javascript/i.test(x));
            ghi(!thay.length ? "ok" : rocket ? "loi" : "canh", "HTML không bị chèn script: " + p,
                thay.length ? thay.join(", ") + (rocket ? " — tắt Rocket Loader" : " — tắt tính năng Cloudflare chèn script này") : "");
        });
    }

    // Speed Brain tải trước trang khi rê chuột, nhưng HTML mình cố ý không cho Cloudflare giữ
    // → chỉ đẻ thêm request hỏng. Nó lộ ra bằng header này trên HTML.
    if (trangChu.headers["speculation-rules"]) {
        ghi("canh", "Speed Brain đang bật", "header speculation-rules: " + trangChu.headers["speculation-rules"] + " — tắt ở Speed → Optimization");
    }

    // ── 5. Bộ nhớ đệm ──
    // Nhóm KHÔNG được giữ lâu: chính sw.js mà bị giữ lâu thì khách cũ không bao giờ nhận bản mới.
    for (const p of ["/", "/index.html", "/sw.js", "/manifest.json", "/sitemap.xml", "/robots.txt"]) {
        await thu("cache " + p, async () => {
            const r = await goi("https://" + MIEN + p);
            const ma = maxAge(r.headers);
            const quaLau = ma !== null && ma > 600;
            const edgeGiu = quaProxy && r.headers["cf-cache-status"] === "HIT";
            ghi(quaLau ? "loi" : edgeGiu ? "canh" : "ok", "Không giữ lâu: " + p, tomTatCache(r) +
                (quaLau ? " — rule \"Không bao giờ cache\" (B4) chưa đúng" : edgeGiu ? " — Cloudflare đang giữ bản ở edge, thiếu rule \"Không bao giờ cache\"" : ""));
        });
    }
    // Nhóm CÓ vân tay ?v=: an toàn để giữ 1 năm (URL đổi theo nội dung).
    const coVanTay = [
        /dist\/style\.min\.css\?v=[0-9a-f]+/,
        /(?:dist|js)\/[\w.-]+\.js\?v=[0-9a-f]+/,
        /assets\/fonts\/[\w.-]+\.woff2\?v=[0-9a-f]+/
    ].map((re) => (trangChu.body.match(re) || [])[0]).filter(Boolean);
    for (const p of coVanTay) {
        await thu("cache " + p, async () => {
            const r = await goi("https://" + MIEN + "/" + p);
            const ma = maxAge(r.headers);
            const dai = ma !== null && ma >= BA_MUOI_NGAY;
            ghi(dai ? "ok" : quaProxy ? "canh" : "tin", "Giữ lâu (có vân tay): " + p.replace(/\?v=.*/, "?v=…"), tomTatCache(r) +
                (dai ? "" : quaProxy ? " — rule \"Có vân tay\" (B4) chưa ăn" : " — GitHub Pages ép 600 giây, cần Cloudflare"));
        });
    }
    // Trang lỗi KHÔNG được giữ, kể cả khi URL khớp rule "Có vân tay": rule đó cần dòng
    // Status code TTL ≥ 400 → No store. Gọi hai lần — lần hai mà HIT là edge đang giữ trang 404.
    await thu("cache 404 có vân tay", async () => {
        const url = "https://" + MIEN + "/dist/khong-ton-tai-kiem-thu.js?v=0000";
        await goi(url);
        const r = await goi(url);
        const giu = r.headers["cf-cache-status"] === "HIT" || (maxAge(r.headers) || 0) > 600;
        ghi(r.code !== 404 ? "canh" : giu ? "loi" : "ok", "Trang 404 có ?v= không bị giữ", r.code + " · " + tomTatCache(r) +
            (giu ? " — rule \"Có vân tay\" thiếu Status code TTL ≥ 400 → No store" : ""));
    });
    // Ảnh KHÔNG vân tay: cố ý để như GitHub (600 giây). Service worker đã giữ ảnh cho khách quay lại.
    const anh = (trangChu.body.match(/assets\/images\/[\w\/.-]+\.webp(?![?\w])/) || [])[0];
    if (anh) {
        await thu("cache " + anh, async () => {
            const r = await goi("https://" + MIEN + "/" + anh);
            const ma = maxAge(r.headers);
            ghi(ma !== null && ma > 86400 ? "loi" : "ok", "Ảnh không vân tay không bị giữ quá 1 ngày", anh + " · " + tomTatCache(r));
        });
    }

    // ── 6. HTTP/3 ──
    const altSvc = trangChu.headers["alt-svc"] || "";
    ghi(/h3/.test(altSvc) ? "ok" : quaProxy ? "canh" : "tin", "HTTP/3", altSvc || "không quảng bá");

    // ── 7. Chứng chỉ ──
    await thu("chứng chỉ khách thấy", async () => {
        const c = await chungChi(MIEN);
        const n = soNgay(c.hetHan);
        ghi(!c.hopLe || n < 14 ? "loi" : n < 30 ? "canh" : "ok", "Chứng chỉ khách thấy",
            c.nhaCap + " · hết hạn " + ngayVN(c.hetHan) + " (còn " + n + " ngày)" + (c.hopLe ? "" : " · " + c.loiXacThuc));
    });
    await thu("chứng chỉ gốc GitHub", async () => {
        const c = await chungChi(IP_GITHUB);
        const n = soNgay(c.hetHan);
        const chiTiet = c.nhaCap + " · hết hạn " + ngayVN(c.hetHan) + " (còn " + n + " ngày)";
        if (!quaProxy) {
            ghi("tin", "Chứng chỉ gốc GitHub", chiTiet + " (chưa qua proxy: đây cũng là chứng chỉ khách thấy)");
        } else {
            ghi(n < 20 ? "canh" : "ok", "Chứng chỉ gốc GitHub (sau proxy)", chiTiet + (n < 20
                ? " — GitHub chưa gia hạn được. Vẫn chạy nếu SSL mode là Full (KHÔNG strict). Trước khi tắt proxy phải xin GitHub cấp lại (mục Quay lại)"
                : ""));
        }
    });

    // ── 8. TTFB (số chẩn đoán từ máy này, không phải CrUX) ──
    await thu("TTFB", async () => {
        const t = [];
        for (let i = 0; i < 3; i++) t.push((await goi("https://" + MIEN + "/")).ttfb);
        ghi("tin", "TTFB trang chủ, 3 lần từ máy này", t.map((x) => (x / 1000).toFixed(2) + "s").join(" · ") +
            " (trước Cloudflare, đo 06/10/2026: 0,13–0,16s; gồm cả DNS + bắt tay TLS)");
    });

    // ── In ──
    const ky = { ok: "✅", loi: "❌", canh: "⚠️ ", tin: "ℹ️ " };
    for (const k of ketQua) console.log(ky[k.trangThai] + " " + k.muc + (k.chiTiet ? "\n     " + k.chiTiet : ""));
    const soLoi = ketQua.filter((k) => k.trangThai === "loi").length;
    const soCanh = ketQua.filter((k) => k.trangThai === "canh").length;
    console.log("\n" + (soLoi ? "❌ " + soLoi + " mục hỏng" : "✅ không mục nào hỏng") + " · " + soCanh + " cảnh báo\n");
    process.exit(soLoi ? 1 : 0);
})().catch((e) => { console.error("❌ " + e.message); process.exit(1); });
