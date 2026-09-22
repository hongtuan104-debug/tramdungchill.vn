/**
 * kiem-do-luong-live.js — checklist #30 mục 283: bộ test đo lường CỐ ĐỊNH, chạy sau mỗi lần phát hành.
 *
 * R25 + R27 trong seo-geo-verify.js chỉ đọc mã nguồn. Còn "bấm một cái thì Meta nhận mấy sự kiện",
 * "đơn rớt thì Google Ads có đếm không", "SĐT khách có lọt vào hit nào không" chỉ trả lời được khi
 * chạy thật trong trình duyệt với pixel thật. Công cụ này làm đúng vậy mà KHÔNG gửi gì ra ngoài:
 *  - Chrome bị cấm phân giải mọi tên miền trừ trang đang thử (--host-resolver-rules) → không một
 *    request nào ra được Internet, kể cả từ iframe / worker của pixel.
 *  - Script pixel (gtag.js, fbevents.js, TikTok, Clarity) do Node tải hộ rồi đưa vào trang → trang
 *    chạy đúng bản pixel khách thật đang chạy, kèm cấu hình dashboard hiện hành.
 *  - Mọi hit gửi về Google / Meta / TikTok / Clarity bị chặn tại chỗ, chỉ GHI LẠI để chấm.
 *  - Webhook đặt bàn (app + Apps Script) được giả lập theo từng kịch bản.
 *  → Không đơn nào tới quán, không Telegram/Zalo nào nổ, số trong tài khoản quảng cáo không đổi.
 *
 * Chạy:  node scripts/kiem-do-luong-live.js            chấm production https://tramdungchill.vn
 *        node scripts/kiem-do-luong-live.js --cuc-bo   chấm bản đang sửa trên máy, TRƯỚC khi push
 *        node scripts/kiem-do-luong-live.js --nhanh    chỉ trang chủ: đơn ghi được + Apps Script báo lỗi
 * Thoát khác 0 nếu có mục trượt. Cần Chrome + Node ≥ 22 (có sẵn WebSocket). Mỗi lượt ~30 giây.
 *
 * ⚠️ Chế độ production chấm bản ĐANG CHẠY — chạy sau khi Pages deploy xong (1–2 phút).
 * ⚠️ Clarity nén gói gửi đi (nhị phân) nên phần "không lọt SĐT" KHÔNG soi được Clarity. Mức che của
 *    Clarity dựa vào data-clarity-mask trên form (R27 canh) + cài đặt Masking trên dashboard.
 * ⚠️ Meta lọc UA "HeadlessChrome" (không bắn hit nào) nên công cụ đặt UA điện thoại thường, và phải
 *    trả ảnh GIF cho /tr — trả 204 rỗng là Meta tự gửi lại bằng đường dự phòng, trông như đếm đôi.
 */
"use strict";
const { spawn } = require("child_process");
const fs = require("fs"), os = require("os"), path = require("path"), http = require("http");

const ROOT = path.resolve(__dirname, "..");
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const CUC_BO = process.argv.includes("--cuc-bo");
const NHANH = process.argv.includes("--nhanh");
const TEN_THU = "Kiem Do Luong", SDT_THU = "0900000000";
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

// Script pixel được tải hộ (chỉ GET, chỉ đúng các đường dẫn tải script — hit gửi đi không nằm ở đây)
const TAI_HO = [
    /^https:\/\/www\.googletagmanager\.com\/gtag\/js/,
    /^https:\/\/connect\.facebook\.net\//,
    /^https:\/\/analytics\.tiktok\.com\/i18n\/pixel\//,
    /^https:\/\/www\.clarity\.ms\/tag\//,
    /^https:\/\/scripts\.clarity\.ms\//,
    /^https:\/\/cdn\.jsdelivr\.net\//
];
const APP = /^https:\/\/app\.tramdungchill\.vn\/api\/webhook\/booking/;
const SHEET = /^https:\/\/script\.google\.com\/macros\//;

/* dem = số chuyển đổi PHẢI đếm được ở kịch bản đó. Trang dịp chỉ gửi Apps Script (app nhận qua
   Apps Script chuyển tiếp), nên với trang dịp chỉ cột sheet có ý nghĩa. */
const KICH_BAN = {
    ok:       { app: [200, { ok: true }],                sheet: [200, { status: "ok" }], dem: 1, ta: "app + Apps Script đều ghi được" },
    chiSheet: { app: [500, { error: "db down" }],        sheet: [200, { status: "ok" }], dem: 1, ta: "app lỗi 500, Apps Script ghi được" },
    sheetLoi: { app: [500, { error: "db down" }],        sheet: [200, { status: "error", message: "Exception: thu" }], dem: 0, ta: "app lỗi 500, Apps Script trả 200 kèm {status:error}" },
    trung:    { app: [200, { ok: true, deduped: true }], sheet: [200, { status: "ok" }], dem: 0, ta: "app báo đơn trùng (deduped)" },
    chet:     { app: null,                               sheet: null,                    dem: 0, ta: "cả hai webhook không kết nối được" },
    xem:      { app: null, sheet: null, dem: 0, ta: "URL mang ?name=&phone= (form rơi về gửi GET khi JS hỏng)" }
};
const LUOT = NHANH
    ? [["/", "ok"], ["/", "sheetLoi"]]
    : [["/", "ok"], ["/", "chiSheet"], ["/", "sheetLoi"], ["/", "trung"], ["/", "chet"],
       ["/dip/sinh-nhat.html", "ok"], ["/dip/sinh-nhat.html", "sheetLoi"],
       ["/?name=Kiem+Do+Luong&phone=0900000000&date=2026-01-01&guests=2", "xem"]];

// ── máy chủ tĩnh cho --cuc-bo ───────────────────────────────────────────
const LOAI = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".css": "text/css",
    ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png",
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif",
    ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2", ".xml": "application/xml",
    ".txt": "text/plain; charset=utf-8", ".mp4": "video/mp4", ".gif": "image/gif" };
function moMayChu() {
    return new Promise((ok) => {
        const sv = http.createServer((req, res) => {
            let p = decodeURIComponent(req.url.split("?")[0]);
            if (p.endsWith("/")) p += "index.html";
            const f = path.join(ROOT, p);
            if (!f.startsWith(ROOT) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end(); }
            res.writeHead(200, { "Content-Type": LOAI[path.extname(f).toLowerCase()] || "application/octet-stream" });
            fs.createReadStream(f).pipe(res);
        });
        sv.listen(0, "127.0.0.1", () => ok(sv));
    });
}

// ── tách sự kiện từ một hit bị chặn ─────────────────────────────────────
function tachSuKien(h) {
    let u;
    try { u = new URL(h.url); } catch (e) { return []; }
    const host = u.hostname, p = u.pathname, body = h.postData || "";
    if (p === "/g/collect" || /google-analytics\.com$/.test(host)) {
        const dongThan = body.split("\n").filter((l) => /(^|&)en=/.test(l));
        const nguon = dongThan.length ? dongThan : [u.search.slice(1)];
        return nguon.map((l) => ({ nen: "GA4", ten: new URLSearchParams(l).get("en") || "" })).filter((x) => x.ten);
    }
    if (/\/measurement\/conversion/.test(p)) return [{ nen: "ADS", ten: u.searchParams.get("en") || "" }];
    if (/google\.|doubleclick\.net|googleadservices\.com/.test(host)) return [{ nen: "ADS-khac", ten: p }];
    if (/facebook\.com$/.test(host) && /^\/tr/.test(p)) {
        const q = new URLSearchParams(u.searchParams.get("ev") ? u.search : body);
        return [{ nen: "META", ten: q.get("ev") || "", eid: q.get("eid") || "" }];
    }
    if (/tiktok\.com$/.test(host) && /^\/api\/v2\/pixel/.test(p)) {
        let j = null;
        try { j = JSON.parse(body); } catch (e) {}
        return (j ? (j.batch || [j]) : []).map((x) => ({ nen: "TIKTOK", ten: x.event || "", eid: x.event_id || "" }));
    }
    if (/clarity\.ms$/.test(host) && /collect/.test(p)) return [{ nen: "CLARITY", ten: "goi" }];
    return [{ nen: "KHAC", ten: host + p }];
}

function coPII(h) {
    const tho = h.url + " " + (h.postData || "");
    let giai = tho;
    try { giai = decodeURIComponent(tho.replace(/\+/g, " ")); } catch (e) {}
    return tho.indexOf(SDT_THU) !== -1 || giai.indexOf(SDT_THU) !== -1 || giai.toLowerCase().indexOf(TEN_THU.toLowerCase()) !== -1;
}

// ── một lượt: một Chrome sạch, một trang, một kịch bản webhook ───────────
async function chayLuot(goc, trang, kb) {
    const K = KICH_BAN[kb];
    const nguonTrang = goc + trang + (CUC_BO ? (trang.indexOf("?") === -1 ? "?" : "&") + "pixel_thu=1" : "");
    const hostGoc = new URL(goc).hostname;
    const PORT = 9300 + Math.floor(Math.random() * 190);
    const HOME = fs.mkdtempSync(path.join(os.tmpdir(), "kdl-"));
    const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + HOME,
        "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-background-networking",
        "--lang=vi-VN", "--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE " + hostGoc + " , EXCLUDE tramdungchill.vn",
        "--disable-features=IsolateOrigins,site-per-process", "about:blank"], { stdio: "ignore" });
    let ws = null;
    for (let i = 0; i < 60 && !ws; i++) {
        await ngu(250);
        try { const l = await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json(); const pg = l.find((x) => x.type === "page"); if (pg) ws = pg.webSocketDebuggerUrl; } catch (e) {}
    }
    if (!ws) { chrome.kill(); throw new Error("Không mở được Chrome ở " + CHROME); }
    const sock = new WebSocket(ws);
    await new Promise((ok) => sock.addEventListener("open", ok));
    let id = 0; const cho = new Map(); const nghe = [];
    sock.addEventListener("message", (m) => { const d = JSON.parse(m.data); if (d.id && cho.has(d.id)) { cho.get(d.id)(d); cho.delete(d.id); } else if (d.method) nghe.forEach((f) => f(d)); });
    const goi = (method, params = {}) => new Promise((ok) => { const i = ++id; cho.set(i, ok); sock.send(JSON.stringify({ id: i, method, params })); });
    const danhGia = async (expr) => { const r = await goi("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); return r.result && r.result.result ? r.result.result.value : undefined; };

    const hits = [], webhook = [], loiTrang = [], loiNgoai = [];
    let daLoad = false, buocHienTai = "tai";
    nghe.push((d) => {
        if (d.method === "Page.loadEventFired") daLoad = true;
        if (d.method === "Runtime.exceptionThrown") {
            const x = d.params.exceptionDetails;
            const mo = (x.exception && x.exception.description ? x.exception.description.split("\n")[0] : x.text) + " @ " + (x.url || "");
            (x.url && x.url.indexOf(goc) !== 0 ? loiNgoai : loiTrang).push(mo);
        }
    });
    nghe.push(async (d) => {
        if (d.method !== "Fetch.requestPaused") return;
        const rq = d.params.request, rid = d.params.requestId;
        try {
            // trang đang thử (và ở chế độ cục bộ: tài nguyên khai URL tuyệt đối trỏ về site thật)
            if (rq.url.indexOf(goc) === 0 || /^https:\/\/tramdungchill\.vn\//.test(rq.url)) return void goi("Fetch.continueRequest", { requestId: rid });
            if (rq.method === "GET" && TAI_HO.some((re) => re.test(rq.url))) {
                /* Meta Pixel có bật Traffic Permissions: xin cấu hình với domain=127.0.0.1 là nhận về
                   prohibitedPixels (blockReason "traffic_permissions") và pixel câm hẳn. Ở chế độ cục bộ
                   xin cấu hình theo domain thật để pixel chạy như trên production — hit vẫn bị chặn ở đây. */
                const nguon = CUC_BO ? rq.url.replace(/([?&]domain=)[^&]*/, "$1tramdungchill.vn") : rq.url;
                const res = await fetch(nguon, { headers: { "user-agent": "Mozilla/5.0" } });
                const buf = Buffer.from(await res.arrayBuffer());
                return void goi("Fetch.fulfillRequest", { requestId: rid, responseCode: res.status, body: buf.toString("base64"),
                    responseHeaders: [{ name: "Content-Type", value: res.headers.get("content-type") || "application/javascript" }, { name: "Access-Control-Allow-Origin", value: "*" }] });
            }
            const cors = [{ name: "Content-Type", value: "application/json" }, { name: "Access-Control-Allow-Origin", value: "*" },
                { name: "Access-Control-Allow-Headers", value: "*" }, { name: "Access-Control-Allow-Methods", value: "POST, GET, OPTIONS" }];
            const laApp = APP.test(rq.url), laSheet = SHEET.test(rq.url);
            if (laApp || laSheet) {
                if (rq.method === "OPTIONS") return void goi("Fetch.fulfillRequest", { requestId: rid, responseCode: 204, responseHeaders: cors });
                webhook.push(laApp ? "app" : "sheet");
                const kq = K[laApp ? "app" : "sheet"];
                if (!kq) return void goi("Fetch.failRequest", { requestId: rid, errorReason: "ConnectionFailed" });
                return void goi("Fetch.fulfillRequest", { requestId: rid, responseCode: kq[0], responseHeaders: cors, body: Buffer.from(JSON.stringify(kq[1])).toString("base64") });
            }
            hits.push({ buoc: buocHienTai, url: rq.url, postData: rq.postData || "" });
            if (/facebook\.com\/tr/.test(rq.url)) {
                return void goi("Fetch.fulfillRequest", { requestId: rid, responseCode: 200, body: "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
                    responseHeaders: [{ name: "Content-Type", value: "image/gif" }, { name: "Access-Control-Allow-Origin", value: goc }, { name: "Access-Control-Allow-Credentials", value: "true" }] });
            }
            const tt = /tiktok\.com/.test(rq.url);
            return void goi("Fetch.fulfillRequest", { requestId: rid, responseCode: tt ? 200 : 204, responseHeaders: cors,
                body: tt ? Buffer.from('{"code":0,"message":"OK"}').toString("base64") : "" });
        } catch (e) {
            goi("Fetch.failRequest", { requestId: rid, errorReason: "Failed" });
        }
    });

    await goi("Page.enable"); await goi("Runtime.enable"); await goi("Network.enable");
    await goi("Network.setBypassServiceWorker", { bypass: true });
    await goi("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
    await goi("Emulation.setDeviceMetricsOverride", { width: 412, height: 823, deviceScaleFactor: 1.75, mobile: true });
    await goi("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await goi("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36", acceptLanguage: "vi-VN,vi;q=0.9" });
    // Không cho rời trang: ghi lại window.open / alert, chặn điều hướng của link gọi/Zalo/Facebook
    await goi("Page.addScriptToEvaluateOnNewDocument", { source: `(() => {
        window.__moTab = [];
        window.open = function (u) { window.__moTab.push(String(u)); return null; };
        window.alert = function () {};
        window.addEventListener('click', function (e) {
            const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
            if (a && /^(tel:|mailto:)|zalo\\.me|facebook\\.com|maps\\.|goo\\.gl|tiktok\\.com|youtube\\.com/.test(a.getAttribute('href') || '')) e.preventDefault();
        }, true);
    })();` });

    await goi("Page.navigate", { url: nguonTrang });
    for (let i = 0; i < 300 && !daLoad; i++) await ngu(100);

    const bam = async (sel) => {
        const r = await danhGia(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
            el.scrollIntoView({ block: 'center', behavior: 'instant' }); const b = el.getBoundingClientRect();
            return b.width ? { x: b.left + b.width / 2, y: b.top + b.height / 2 } : null; })()`);
        if (!r) return false;
        await ngu(350);
        for (const type of ["mousePressed", "mouseReleased"]) await goi("Input.dispatchMouseEvent", { type, x: r.x, y: r.y, button: "left", clickCount: 1 });
        return true;
    };

    const soBam = { tel: 0, zalo: 0 };
    await ngu(1500);
    buocHienTai = "cuon";
    await goi("Input.dispatchMouseEvent", { type: "mouseWheel", x: 200, y: 400, deltaX: 0, deltaY: 300 });
    await ngu(7000);
    const urlSauGo = await danhGia("location.href");

    if (kb !== "xem") {
        buocHienTai = "tel";
        await danhGia(`(() => { const a = [...document.querySelectorAll('a[href^="tel:"]')].find(x => !x.closest('.fab-contact') && x.offsetParent); if (a) a.setAttribute('data-kdl', 'tel'); })()`);
        if (await bam('[data-kdl="tel"]')) soBam.tel++;
        await ngu(2000);

        buocHienTai = "fab";
        let fabHien = false;
        for (const y of [700, 1400, 2100, 2800, 350]) {
            await danhGia(`window.scrollTo({ top: ${y}, behavior: 'instant' })`);
            await ngu(700);
            fabHien = await danhGia(`(() => { const f = document.getElementById('fabContact'); return !!f && f.classList.contains('visible') && !f.classList.contains('in-booking'); })()`);
            if (fabHien) break;
        }
        if (fabHien && await bam("#fabMainBtn")) {
            await ngu(600);
            if (await bam(".fab-opt-zalo")) soBam.zalo++;
        }
        await ngu(2000);

        buocHienTai = "zalo-nhanh";
        if (await bam("#zaloQuickBook")) { soBam.zalo++; await ngu(2000); }

        buocHienTai = "gui-form";
        const coForm = await danhGia(`(() => { const f = document.getElementById('bookingForm'); if (!f) return false;
            f.scrollIntoView({ block: 'start', behavior: 'instant' });
            const d = new Date(); d.setDate(d.getDate() + 3);
            f.querySelectorAll('input[type=date]').forEach(x => { x.value = d.toISOString().slice(0, 10); x.dispatchEvent(new Event('change', { bubbles: true })); });
            f.querySelectorAll('select').forEach(x => { if (!x.value && x.options.length > 1) { x.selectedIndex = 1; x.dispatchEvent(new Event('change', { bubbles: true })); } });
            return true; })()`);
        if (coForm) {
            for (const [sel, chu] of [['input[name="name"]', TEN_THU], ['input[name="phone"]', SDT_THU]]) {
                await danhGia(`document.querySelector('#bookingForm ${sel}').focus()`);
                await goi("Input.insertText", { text: chu });
            }
            await ngu(400);
            await bam('#bookingForm [type="submit"]');
            await ngu(5000);
        }
    }
    buocHienTai = "cuoi";
    await ngu(6000);   // GA4 gom sự kiện gửi theo lô, chờ lô cuối
    const moTab = (await danhGia("window.__moTab")) || [];

    sock.close(); chrome.kill();
    await ngu(300);
    try { fs.rmSync(HOME, { recursive: true, force: true }); } catch (e) {}

    return { hits, webhook, moTab, loiTrang, loiNgoai, soBam, urlSauGo };
}

// ── chấm điểm ───────────────────────────────────────────────────────────
function cham(trang, kb, kq) {
    const K = KICH_BAN[kb];
    const laDip = /\/dip\//.test(trang);
    const ev = kq.hits.flatMap((h) => tachSuKien(h).map((x) => Object.assign({ buoc: h.buoc }, x)));
    const dem = (nen, ten, buoc) => ev.filter((x) => x.nen === nen && x.ten === ten && (!buoc || x.buoc === buoc)).length;
    const muc = [];
    const them = (ten, ok, chiTiet) => muc.push({ ten, ok, chiTiet });

    const truoc = kq.hits.filter((h) => h.buoc === "tai").length;
    them("Chưa bật pixel trước tương tác đầu", truoc === 0, truoc + " hit trước cú cuộn đầu");

    const pv = { meta: dem("META", "PageView"), ga: dem("GA4", "page_view"), tt: dem("TIKTOK", "Pageview"), cl: ev.filter((x) => x.nen === "CLARITY").length };
    them("PageView đúng 1 lần mỗi nền tảng", pv.meta === 1 && pv.ga === 1 && pv.tt === 1 && pv.cl >= 1,
        "Meta " + pv.meta + " · GA4 " + pv.ga + " · TikTok " + pv.tt + " · Clarity " + pv.cl + " gói");
    if (laDip) them("Trang dịp: ViewContent 1 lần", dem("META", "ViewContent") === 1, "Meta ViewContent " + dem("META", "ViewContent"));

    if (kb === "xem") {
        const bay = kq.hits.filter(coPII).length;
        const conPII = /[?&](name|phone)=/.test(kq.urlSauGo || "");
        them("URL mang tên/SĐT: gỡ trước khi pixel đọc", bay === 0 && !conPII,
            bay + "/" + kq.hits.length + " hit mang tên/SĐT · URL sau khi gỡ: " + (kq.urlSauGo || "").replace(/^https?:\/\/[^/]+/, ""));
        return muc;
    }

    const soContact = kq.soBam.tel + kq.soBam.zalo;
    const mC = dem("META", "Contact"), tC = dem("TIKTOK", "Contact");
    const gTel = dem("GA4", "click_phone"), gZalo = dem("GA4", "click_zalo");
    them("Mỗi cú bấm gọi/Zalo = đúng 1 Contact",
        soContact >= 2 && mC === soContact && tC === soContact && gTel === kq.soBam.tel && gZalo === kq.soBam.zalo,
        soContact + " cú bấm (" + kq.soBam.tel + " gọi, " + kq.soBam.zalo + " Zalo) → Meta " + mC + " · TikTok " + tC +
        " · GA4 click_phone " + gTel + " + click_zalo " + gZalo);
    const convBam = ev.filter((x) => x.nen === "ADS" && x.buoc !== "gui-form" && x.buoc !== "cuoi").length;
    them("Bấm gọi/Zalo không tính là chuyển đổi Google Ads", convBam === 0, convBam + " chuyển đổi Ads ngoài bước gửi form");

    const cv = {
        ads: dem("ADS", "conversion_event_submit_lead_form"),
        lead: dem("META", "Lead"),
        ga: dem("GA4", "conversion_event_submit_lead_form"),
        tt: dem("TIKTOK", "CompleteRegistration"),
        gl: dem("GA4", "generate_lead")
    };
    let okCv = cv.ads === K.dem && cv.lead === K.dem && cv.ga === K.dem;
    if (!laDip) okCv = okCv && cv.tt === K.dem && cv.gl === K.dem;
    them("Chuyển đổi đếm " + K.dem + " (" + K.ta + ")", okCv,
        "Ads " + cv.ads + " · Meta Lead " + cv.lead + " · GA4 " + cv.ga + (laDip ? " (trang dịp không bắn TikTok/generate_lead — sếp chốt 17/09)" : " · TikTok " + cv.tt + " · generate_lead " + cv.gl));
    if (!laDip && K.dem === 1) {
        const eM = (ev.find((x) => x.nen === "META" && x.ten === "Lead") || {}).eid || "";
        const eT = (ev.find((x) => x.nen === "TIKTOK" && x.ten === "CompleteRegistration") || {}).eid || "";
        them("Meta Lead và TikTok cùng event_id (sẵn cho khử trùng CAPI)", !!eM && eM === eT, eM + " / " + eT);
    }

    const soApp = kq.webhook.filter((x) => x === "app").length, soSheet = kq.webhook.filter((x) => x === "sheet").length;
    const zalo = kq.moTab.filter((u) => /zalo\.me/.test(u)).length;
    const okGui = (laDip ? soApp === 0 : soApp === 1) && soSheet === 1 && zalo === 1;
    them("Đơn gửi đúng 1 lần mỗi đường · luôn mở Zalo 1 lần", okGui, "app " + soApp + " · Apps Script " + soSheet + " · Zalo " + zalo);

    const bay = kq.hits.filter(coPII).length;
    them("Không hit đo lường nào mang tên/SĐT khách", bay === 0, bay + "/" + kq.hits.length + " hit (gói Clarity nén — không soi được)");
    them("Không lỗi JS của trang", kq.loiTrang.length === 0, kq.loiTrang.length ? kq.loiTrang.slice(0, 2).join(" | ") : "0 lỗi" + (kq.loiNgoai.length ? " (" + kq.loiNgoai.length + " lỗi trong script bên thứ ba)" : ""));
    return muc;
}

(async () => {
    let sv = null, goc = "https://tramdungchill.vn";
    if (CUC_BO) { sv = await moMayChu(); goc = "http://127.0.0.1:" + sv.address().port; }
    console.log("\n🔬 KIỂM ĐO LƯỜNG — " + (CUC_BO ? "bản cục bộ " + goc : goc) + " · " + LUOT.length + " lượt · không hit nào ra ngoài\n");
    let truot = 0, tong = 0;
    for (const [trang, kb] of LUOT) {
        let muc;
        try { muc = cham(trang, kb, await chayLuot(goc, trang, kb)); }
        catch (e) { muc = [{ ten: "Chạy lượt", ok: false, chiTiet: e.message }]; }
        console.log("== " + (trang.length > 40 ? trang.slice(0, 40) + "…" : trang) + " · " + KICH_BAN[kb].ta);
        for (const m of muc) {
            tong++; if (!m.ok) truot++;
            console.log("   " + (m.ok ? "✅" : "❌") + " " + m.ten.padEnd(52) + " " + m.chiTiet);
        }
        console.log("");
    }
    if (sv) sv.close();
    console.log("  " + (tong - truot) + "/" + tong + " mục đạt" + (truot ? "  —  " + truot + " mục trượt" : "  —  tất cả đạt"));
    process.exit(truot ? 1 : 0);
})();
