/**
 * kiem-crux.js — Core Web Vitals của KHÁCH THẬT (Chrome UX Report), tách điện thoại / máy tính.
 *
 * Checklist #13 (15/09/2026) — script này làm đúng những điều checklist bắt buộc, để khỏi
 * đọc nhầm số:
 *   - Chấm bằng Field Data ở phân vị 75 (mục 94–96, 98). In kèm "% lượt đạt Tốt": p75 đạt
 *     ⇔ ít nhất 75% lượt đạt ngưỡng tốt.
 *   - ĐẠT chỉ khi CẢ BA LCP · INP · CLS đều Tốt; không lấy trung bình bù (mục 99).
 *   - Điện thoại và máy tính đánh giá RIÊNG, không gộp (mục 101).
 *   - Số là cửa sổ 28 ngày → in ngày đầu–cuối; --lich-su in các kỳ trước để thấy bản sửa
 *     ngấm dần (mục 102). Sửa hôm nay phải ~4 tuần sau mới hiện đủ.
 *   - TTFB in kèm để chẩn đoán LCP, KHÔNG tính vào kết luận (mục 97).
 *   - Điểm Lighthouse / PageSpeed lab KHÔNG dùng ở đây (mục 100) — lab chỉ để chẩn đoán.
 *
 * Cần API key (miễn phí): Google Cloud Console → APIs & Services → bật "Chrome UX Report API"
 * → Credentials → Create API key. Đặt vào file .env ở gốc repo (đã gitignore):
 *     CRUX_API_KEY=AIza...
 * hoặc biến môi trường (PowerShell):  $env:CRUX_API_KEY='AIza...'
 * ⚠️ Repo công khai — KHÔNG dán key vào file nào khác.
 *
 * Chạy:
 *   node scripts/kiem-crux.js                 cả origin + 4 trang chính
 *   node scripts/kiem-crux.js --all           cả origin + mọi URL trong sitemap.xml
 *   node scripts/kiem-crux.js --lich-su       thêm xu hướng p75 các kỳ 28 ngày (CrUX History API)
 *   node scripts/kiem-crux.js https://tramdungchill.vn/menu.html
 *   (Git Bash đổi tham số bắt đầu bằng "/" thành đường dẫn Windows — dùng URL đầy đủ.)
 * Không có key: thử PageSpeed Insights API ẩn danh — hạn mức chung cho mọi người nên gần như
 * lúc nào cũng hết (HTTP 429), và PSI không trả ngày của cửa sổ 28 ngày.
 *
 * Kết quả thô lưu ở plans/crux/crux-<ngày>.json (plans/ đã gitignore) để so về sau.
 * Trang ít khách thường KHÔNG có số riêng — CrUX trả 404, script ghi "chưa đủ dữ liệu".
 * Khi đó xem số RUM trong GA4 (js/do-khach-that.js) theo nhom_trang.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ORIGIN = "https://tramdungchill.vn";
const TRANG_CHINH = ["/", "/menu.html", "/blog.html", "/duong-di/"];

// Ngưỡng của Google (web.dev/articles/vitals): p75 ≤ tot là Tốt, > kem là Kém, còn lại Cần cải thiện
const CHI_SO = [
    { ma: "LCP", crux: "largest_contentful_paint", psi: "LARGEST_CONTENTFUL_PAINT_MS", tot: 2500, kem: 4000, cwv: true },
    { ma: "INP", crux: "interaction_to_next_paint", psi: "INTERACTION_TO_NEXT_PAINT", tot: 200, kem: 500, cwv: true },
    { ma: "CLS", crux: "cumulative_layout_shift", psi: "CUMULATIVE_LAYOUT_SHIFT_SCORE", tot: 0.1, kem: 0.25, cwv: true },
    // Tên TTFB trong CrUX API từng mang tiền tố "experimental_" — dò theo đuôi cho khỏi gãy khi đổi tên
    { ma: "TTFB", crux: /time_to_first_byte$/, psi: "EXPERIMENTAL_TIME_TO_FIRST_BYTE", tot: 800, kem: 1800, cwv: false },
];
const THIET_BI = [
    { ten: "Điện thoại", crux: "PHONE", psi: "mobile" },
    { ten: "Máy tính", crux: "DESKTOP", psi: "desktop" },
];

const args = process.argv.slice(2);
const LICH_SU = args.includes("--lich-su");
const TAT_CA = args.includes("--all");

function docKey() {
    if (process.env.CRUX_API_KEY) return process.env.CRUX_API_KEY.trim();
    const env = path.join(ROOT, ".env");
    if (fs.existsSync(env)) {
        const m = fs.readFileSync(env, "utf8").match(/^\s*CRUX_API_KEY\s*=\s*["']?([^"'\s#]+)/m);
        if (m) return m[1];
    }
    return null;
}

function danhSachUrl() {
    const tuy = args.filter((a) => !a.startsWith("--"));
    if (tuy.length) return tuy.map((a) => (/^https?:\/\//.test(a) ? a : ORIGIN + "/" + a.replace(/^\/+/, "")));
    if (TAT_CA) {
        const xml = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
        return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    }
    return TRANG_CHINH.map((p) => ORIGIN + p);
}

// ── Định dạng ─────────────────────────────────────────────────────────────
const ngay = (d) => (d ? String(d.day).padStart(2, "0") + "/" + String(d.month).padStart(2, "0") + "/" + d.year : "?");
const phanTram = (x) => (x == null || !isFinite(x) ? "  —" : String(Math.round(x * 100)).padStart(3) + "%");

function soDo(c, v) {
    if (v == null || !isFinite(v)) return "—";
    if (c.ma === "CLS") return v.toFixed(2).replace(".", ",");
    return Math.round(v).toLocaleString("vi-VN") + " ms";
}

function xepLoai(c, v) {
    if (v == null || !isFinite(v)) return "thieu";
    return v <= c.tot ? "tot" : v <= c.kem ? "can" : "kem";
}
const NHAN = { tot: "✅ Tốt", can: "🟠 Cần cải thiện", kem: "🔴 Kém", thieu: "⚪ chưa đủ dữ liệu" };

/** Kết luận Core Web Vitals cho MỘT thiết bị: đạt khi cả ba đều Tốt (mục 99). */
function ketLuan(chiSo) {
    const cwv = CHI_SO.filter((c) => c.cwv);
    const loai = (c) => xepLoai(c, chiSo[c.ma] && chiSo[c.ma].p75);
    const truot = cwv.filter((c) => ["can", "kem"].includes(loai(c))).map((c) => c.ma);
    const thieu = cwv.filter((c) => loai(c) === "thieu").map((c) => c.ma);
    if (truot.length) return { dat: false, chu: "❌ TRƯỢT — " + truot.join(", ") + " chưa Tốt" };
    if (thieu.includes("LCP") || thieu.includes("CLS")) return { dat: null, chu: "⚪ chưa đủ dữ liệu để kết luận" };
    // PageSpeed chấm theo LCP + CLS khi INP chưa đủ lượt tương tác — ghi rõ, đừng coi như đủ ba
    if (thieu.length) return { dat: true, chu: "✅ ĐẠT theo LCP + CLS (INP chưa đủ dữ liệu)" };
    return { dat: true, chu: "✅ ĐẠT cả ba chỉ số" };
}

// ── Đọc dữ liệu ───────────────────────────────────────────────────────────
function timMetric(metrics, khoa) {
    if (typeof khoa === "string") return metrics[khoa];
    const k = Object.keys(metrics).find((x) => khoa.test(x));
    return k ? metrics[k] : undefined;
}

function tuCrux(record) {
    const chiSo = {};
    for (const c of CHI_SO) {
        const m = timMetric(record.metrics || {}, c.crux);
        const p75 = m && m.percentiles ? Number(m.percentiles.p75) : NaN;
        const h = (m && m.histogram) || [];
        chiSo[c.ma] = {
            p75: isFinite(p75) ? p75 : null,
            tot: h[0] && h[0].density != null ? Number(h[0].density) : null,
        };
    }
    const cp = record.collectionPeriod || {};
    return { chiSo, tu: cp.firstDate, den: cp.lastDate };
}

function tuPsi(le) {
    if (!le || !le.metrics) return null;
    const chiSo = {};
    for (const c of CHI_SO) {
        const m = le.metrics[c.psi];
        if (!m) { chiSo[c.ma] = { p75: null, tot: null }; continue; }
        // PSI trả CLS nhân 100 (6 nghĩa là 0,06)
        const p75 = c.ma === "CLS" ? m.percentile / 100 : m.percentile;
        const d = m.distributions || [];
        chiSo[c.ma] = { p75, tot: d[0] ? d[0].proportion : null };
    }
    return { chiSo, originFallback: !!le.origin_fallback };
}

async function goiCrux(loai, body, key) {
    const r = await fetch("https://chromeuxreport.googleapis.com/v1/records:" + loai + "?key=" + encodeURIComponent(key), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (r.status === 404) return null;                   // CrUX: không đủ lượt truy cập để công bố
    if (!r.ok) {
        const e = new Error("CrUX API HTTP " + r.status + ": " + ((j.error && j.error.message) || r.statusText));
        e.status = r.status;
        throw e;
    }
    return j;
}

// ── In ────────────────────────────────────────────────────────────────────
function inMotThietBi(tb, duLieu, ghiChu) {
    if (!duLieu) {
        console.log("   " + tb.ten + ": ⚪ chưa đủ lượt truy cập để CrUX công bố số");
        return null;
    }
    const cuaSo = duLieu.tu ? " · cửa sổ 28 ngày " + ngay(duLieu.tu) + " → " + ngay(duLieu.den) : "";
    console.log("   " + tb.ten + cuaSo + (ghiChu ? " · " + ghiChu : ""));
    for (const c of CHI_SO) {
        const v = duLieu.chiSo[c.ma] || {};
        const nhan = NHAN[xepLoai(c, v.p75)] + (c.cwv ? "" : " (chẩn đoán, không tính)");
        console.log("     " + c.ma.padEnd(5) + soDo(c, v.p75).padStart(9) + "   " + phanTram(v.tot) + " lượt Tốt   " + nhan);
    }
    const kl = ketLuan(duLieu.chiSo);
    console.log("     → Core Web Vitals: " + kl.chu);
    return kl;
}

function inLichSu(tb, rec) {
    if (!rec || !rec.record) {
        console.log("     (lịch sử " + tb.ten.toLowerCase() + ": chưa đủ dữ liệu)");
        return;
    }
    const kyList = rec.record.collectionPeriods || [];
    const metrics = rec.record.metrics || {};
    const cot = CHI_SO.filter((c) => c.cwv);
    const chuoi = cot.map((c) => {
        const m = timMetric(metrics, c.crux) || {};
        const p = (m.percentilesTimeseries && m.percentilesTimeseries.p75s) || [];
        return p.map((x) => (x == null || x === "NaN" ? null : Number(x)));
    });
    const bat = Math.max(0, kyList.length - 10);
    console.log("     Xu hướng p75 " + tb.ten.toLowerCase() + " (mỗi dòng một cửa sổ 28 ngày, API cập nhật theo tuần):");
    console.log("       kết thúc       " + cot.map((c) => c.ma.padStart(9)).join("  "));
    for (let i = bat; i < kyList.length; i++) {
        const o = cot.map((c, k) => {
            const v = chuoi[k][i];
            const dau = { tot: " ", can: "!", kem: "✗", thieu: " " }[xepLoai(c, v)];
            return (soDo(c, v) + dau).padStart(10);
        });
        console.log("       " + ngay(kyList[i].lastDate).padEnd(12) + o.join(" "));
    }
}

// ── Chạy ──────────────────────────────────────────────────────────────────
(async () => {
    const key = docKey();
    const urls = danhSachUrl();
    const tho = { ngayChay: new Date().toISOString(), nguon: key ? "crux-api" : "psi-an-danh", ketQua: [] };
    console.log("\n📊 CORE WEB VITALS — KHÁCH THẬT (CrUX, phân vị 75) — " + ORIGIN);
    console.log("   Ngưỡng Tốt: LCP ≤ 2.500 ms · INP ≤ 200 ms · CLS ≤ 0,10 · (TTFB ≤ 800 ms chỉ để chẩn đoán)\n");

    if (key) {
        const dich = [{ ten: ORIGIN + "  (cả origin)", body: { origin: ORIGIN } }]
            .concat(urls.map((u) => ({ ten: u, body: { url: u } })));
        try {
            for (const d of dich) {
                console.log("━━ " + d.ten);
                for (const tb of THIET_BI) {
                    const body = Object.assign({ formFactor: tb.crux }, d.body);
                    const rec = await goiCrux("queryRecord", body, key);
                    tho.ketQua.push({ dich: d.ten, thietBi: tb.crux, queryRecord: rec });
                    const kl = inMotThietBi(tb, rec && tuCrux(rec.record));
                    if (LICH_SU && kl) {
                        const ls = await goiCrux("queryHistoryRecord", body, key);
                        tho.ketQua.push({ dich: d.ten, thietBi: tb.crux, queryHistoryRecord: ls });
                        inLichSu(tb, ls);
                    }
                }
                console.log("");
            }
        } catch (e) {
            console.error("\n❌ " + e.message);
            if (e.status === 400 || e.status === 403) {
                console.error("   Kiểm tra: key đúng chưa, project đã bật \"Chrome UX Report API\" chưa, key có bị giới hạn API/IP không.");
            }
            process.exit(2);
        }
    } else {
        console.log("⚠️  Chưa có CRUX_API_KEY → thử PageSpeed Insights API ẩn danh (chỉ trang chủ + cả origin, không có ngày cửa sổ).");
        console.log("   Cách lấy key: xem chú thích đầu file scripts/kiem-crux.js.\n");
        const trangChu = ORIGIN + "/";
        const theoTb = {};
        for (const tb of THIET_BI) {
            const r = await fetch("https://www.googleapis.com/pagespeedonline/v5/runPagespeed?category=performance&strategy=" +
                tb.psi + "&url=" + encodeURIComponent(trangChu));
            const j = await r.json().catch(() => ({}));
            if (!r.ok) {
                console.error("❌ PageSpeed API HTTP " + r.status + ": " + ((j.error && j.error.message) || r.statusText).slice(0, 160));
                if (r.status === 429) console.error("   Hạn mức ẩn danh dùng chung đã hết — cần CRUX_API_KEY (miễn phí).");
                process.exit(2);
            }
            tho.ketQua.push({ thietBi: tb.psi, psi: { loadingExperience: j.loadingExperience, originLoadingExperience: j.originLoadingExperience } });
            theoTb[tb.psi] = j;
        }
        for (const [ten, khoa] of [[ORIGIN + "  (cả origin)", "originLoadingExperience"], [trangChu, "loadingExperience"]]) {
            console.log("━━ " + ten);
            for (const tb of THIET_BI) {
                const d = tuPsi(theoTb[tb.psi][khoa]);
                inMotThietBi(tb, d, d && d.originFallback ? "URL chưa đủ dữ liệu, đây là số của cả origin" : "");
            }
            console.log("");
        }
    }

    const thuMuc = path.join(ROOT, "plans", "crux");
    fs.mkdirSync(thuMuc, { recursive: true });
    const tep = path.join(thuMuc, "crux-" + tho.ngayChay.slice(0, 10) + ".json");
    fs.writeFileSync(tep, JSON.stringify(tho, null, 2), "utf8");
    console.log("Số thô đã lưu: " + path.relative(ROOT, tep).replace(/\\/g, "/"));
    console.log("Nhắc: CrUX là cửa sổ 28 ngày — bản sửa hôm nay cần ~4 tuần mới hiện đủ. Trang không có số riêng → xem RUM trong GA4.");
})();
