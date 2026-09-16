/**
 * do-hien-thi-ai.js — đo độ hiển thị của quán trong các máy trả lời AI.
 * Checklist #26 mục 237–243. Đọc nhật ký đo TAY ở docs/do-hien-thi-ai/nhat-ky/.
 *
 * ⚠️ SCRIPT NÀY KHÔNG TỰ HỎI AI. Không có API nào cho ChatGPT Search / AI Overviews /
 *    Copilot trả về đúng thứ khách nhìn thấy, mà kết quả còn đổi theo tài khoản, phiên,
 *    vị trí. Người đo hỏi tay, dán câu trả lời + danh sách nguồn vào nhật ký; script lo
 *    phần máy làm được: soi URL được dẫn còn sống/đúng canonical không (mục 240), và
 *    cộng số qua các đợt (mục 242, 243). Số nào chưa đo thì để trống — đừng đoán.
 *
 * CHẠY
 *   node scripts/do-hien-thi-ai.js                 kiểm nhật ký + in báo cáo
 *   node scripts/do-hien-thi-ai.js --kiem-url      + gọi mạng soi từng URL được dẫn (mục 240)
 *   node scripts/do-hien-thi-ai.js --lich-su       + so các đợt để thấy xu hướng (mục 243)
 *
 * MÃ THOÁT  0 = nhật ký hợp lệ · 1 = có lỗi nhật ký hoặc URL dẫn hỏng
 *
 * ĐỊNH NGHĨA (mục 239 — đừng gộp làm một)
 *   nhắc tên (mention) = câu trả lời có nêu tên quán.
 *   trích dẫn (citation) = có URL/nguồn hiện ra. Chỉ tính là "của mình" khi URL thuộc
 *   tramdungchill.vn VÀ link còn hoạt động — nên --kiem-url báo hỏng là citation đó không tính.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const THU_MUC = path.join(ROOT, "docs", "do-hien-thi-ai");
const MIEN = "https://tramdungchill.vn";

const doiSo = process.argv.slice(2);
const KIEM_URL = doiSo.includes("--kiem-url");
const LICH_SU = doiSo.includes("--lich-su");

const TRANG_THAI = ["missing", "mentioned", "cited", "replaced"];
const TRUONG_DIEU_KIEN = ["nenTang", "model", "ngonNgu", "thiTruong", "trangThaiTaiKhoan"];

const loi = [];

// ── Bộ câu hỏi + nhật ký ─────────────────────────────────────────────────
const boCauHoi = JSON.parse(fs.readFileSync(path.join(THU_MUC, "cau-hoi-benchmark.json"), "utf8"));
const maCau = new Map(boCauHoi.cauHoi.map((c) => [c.ma, c]));

// Mục 237: câu hỏi đổi mà phiên bản giữ nguyên thì số các đợt không còn so được với nhau.
{
    const bam = require("crypto").createHash("md5").update(JSON.stringify(boCauHoi.cauHoi)).digest("hex");
    if (bam !== boCauHoi.bamCauHoi) {
        loi.push("cau-hoi-benchmark.json: nội dung câu hỏi đã đổi (bam " + bam + " ≠ " + boCauHoi.bamCauHoi +
            ") — tăng phienBan rồi cập nhật bamCauHoi, và đo lại từ đầu thay vì gộp với số cũ");
    }
}

const thuMucNhatKy = path.join(THU_MUC, "nhat-ky");
const tepNhatKy = fs.readdirSync(thuMucNhatKy)
    .filter((f) => f.endsWith(".json") && f !== "MAU.json")
    .sort();

const dot = [];
for (const f of tepNhatKy) {
    let j;
    try { j = JSON.parse(fs.readFileSync(path.join(thuMucNhatKy, f), "utf8")); }
    catch (e) { loi.push(f + ": không đọc được JSON — " + e.message); continue; }

    // Mục 237: so số giữa các đợt chỉ có nghĩa khi cùng bộ câu hỏi.
    if (j.boCauHoi !== boCauHoi.phienBan) {
        loi.push(f + ": đo bằng bộ câu hỏi " + j.boCauHoi + ", bộ hiện tại là " + boCauHoi.phienBan + " — không gộp số chung được");
    }
    // Mục 238: thiếu một điều kiện là lần đo đó không tái lập được.
    for (const t of TRUONG_DIEU_KIEN) {
        if (!j.dieuKienChung || !j.dieuKienChung[t]) loi.push(f + ': dieuKienChung thiếu "' + t + '"');
    }
    if (!Array.isArray(j.lanDo) || j.lanDo.length === 0) { loi.push(f + ": không có lanDo nào"); continue; }

    for (const l of j.lanDo) {
        const o = f + " · " + l.maCauHoi;
        if (!maCau.has(l.maCauHoi)) loi.push(o + ": mã câu hỏi không có trong bộ benchmark");
        if (!TRANG_THAI.includes(l.trangThai)) loi.push(o + ': trangThai "' + l.trangThai + '" không hợp lệ (' + TRANG_THAI.join(" | ") + ")");
        if (!l.thoiDiem) loi.push(o + ": thiếu thoiDiem (mục 238)");
        // Mục 241: không có trích đoạn hay ảnh chụp thì về sau không đối soát được.
        if (!l.trichDoan && !l.anhChup) loi.push(o + ": thiếu cả trichDoan lẫn anhChup — không có bằng chứng để đối soát (mục 241)");
        if (l.anhChup && !fs.existsSync(path.join(THU_MUC, l.anhChup))) loi.push(o + ": anhChup không có file (" + l.anhChup + ")");

        const dan = l.nguonDuocDan || [];
        const cuaMinh = dan.filter((n) => (n.url || "").startsWith(MIEN));
        // Mục 239: 4 trạng thái phải khớp với dữ liệu, không khai bừa.
        if (l.trangThai === "cited" && cuaMinh.length === 0) loi.push(o + ": khai cited nhưng không có nguồn nào thuộc " + MIEN);
        if (l.trangThai === "mentioned" && cuaMinh.length > 0) loi.push(o + ": có nguồn của mình được dẫn → phải là cited, không phải mentioned");
        if (l.trangThai === "mentioned" && !l.nhacTen) loi.push(o + ": khai mentioned nhưng nhacTen = false");
        if (l.trangThai === "missing" && (l.nhacTen || dan.length > 0)) loi.push(o + ": khai missing nhưng có nhắc tên hoặc có nguồn");
        // Mục 242: replaced chỉ có nghĩa khi ghi rõ ai được chọn thay.
        if (l.trangThai === "replaced" && !(l.nguonThayThe || []).length) loi.push(o + ": khai replaced nhưng không ghi nguonThayThe (mục 242)");
        for (const n of cuaMinh) {
            if (n.daMoKiemTuyenBo !== true) loi.push(o + ": " + n.url + " chưa đánh daMoKiemTuyenBo — mục 240 bắt phải tự mở trang đọc xem có đỡ được tuyên bố không");
            if (!n.tuyenBo) loi.push(o + ": " + n.url + " thiếu tuyenBo (AI dẫn nó để đỡ điều gì)");
        }
    }
    dot.push(Object.assign({ tep: f }, j));
}

// ── Mục 240: URL được dẫn phải sống, đúng canonical, không redirect ───────
async function soiUrl(u) {
    const chang = [];
    let hienTai = u;
    for (let i = 0; i < 6; i++) {
        let r;
        try { r = await fetch(hienTai, { redirect: "manual", headers: { "User-Agent": "tramdungchill-kiem-nguon-ai" } }); }
        catch (e) { return { url: u, loi: "không gọi được: " + e.message, chang: chang }; }
        if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
            chang.push(r.status + " → " + r.headers.get("location"));
            hienTai = new URL(r.headers.get("location"), hienTai).href;
            continue;
        }
        if (r.status !== 200) return { url: u, loi: "HTTP " + r.status, chang: chang };
        const html = await r.text();
        const canonical = (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) || [])[1];
        const robots = (html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i) || [])[1] || "";
        return { url: u, cuoi: hienTai, chang: chang, canonical: canonical, noindex: /noindex/i.test(robots) };
    }
    return { url: u, loi: "vòng chuyển hướng quá 6 chặng", chang: chang };
}

async function kiemMoiUrl() {
    const tap = new Set();
    for (const d of dot) for (const l of d.lanDo || []) {
        for (const n of [].concat(l.nguonDuocDan || [], l.nguonThayThe || [])) {
            if (n.url) tap.add(n.url);
        }
    }
    if (tap.size === 0) { console.log("  (chưa có URL nào trong nhật ký để soi)\n"); return new Set(); }

    console.log("\n🔗 Soi " + tap.size + " URL được AI dẫn (mục 240)\n");
    const hong = new Set();
    for (const u of [...tap].sort()) {
        const kq = await soiUrl(u);
        const laCuaMinh = u.startsWith(MIEN);
        const van = [];
        if (kq.loi) van.push(kq.loi);
        else {
            if (kq.chang.length) van.push("redirect " + kq.chang.length + " chặng: " + kq.chang.join(" · "));
            if (laCuaMinh && kq.canonical && kq.canonical !== u) van.push("canonical trỏ " + kq.canonical);
            if (laCuaMinh && !kq.canonical) van.push("không có canonical");
            if (kq.noindex) van.push("trang khai noindex");
        }
        if (van.length) hong.add(u);
        console.log("  " + (van.length ? "❌" : "✅") + "  " + u + (laCuaMinh ? "" : "   (nguồn ngoài)"));
        if (van.length) console.log("        " + van.join(" | "));
    }
    console.log("");
    return hong;
}

// ── Mục 242 + 243: cộng số ───────────────────────────────────────────────
function tinh(danhSach, urlHong) {
    const s = { lan: 0, nhacTen: 0, cited: 0, mentioned: 0, replaced: 0, missing: 0, danCuaMinh: 0, danTong: 0 };
    for (const l of danhSach) {
        s.lan++;
        if (l.nhacTen) s.nhacTen++;
        if (s[l.trangThai] !== undefined) s[l.trangThai]++;
        for (const n of l.nguonDuocDan || []) {
            s.danTong++;
            // Mục 239: link chết thì không tính là owned citation.
            if ((n.url || "").startsWith(MIEN) && !urlHong.has(n.url)) s.danCuaMinh++;
        }
    }
    return s;
}

const pt = (a, b) => (b === 0 ? "—" : (a * 100 / b).toFixed(0) + "%");

function inBang(ten, s) {
    console.log("  " + ten);
    console.log("      " + s.lan + " lần đo · citation coverage " + pt(s.cited, s.lan) +
        " · mention rate " + pt(s.nhacTen, s.lan) +
        " · owned-source share " + pt(s.danCuaMinh, s.danTong) + " (" + s.danCuaMinh + "/" + s.danTong + " nguồn)");
    console.log("      cited " + s.cited + " · mentioned " + s.mentioned + " · replaced " + s.replaced + " · missing " + s.missing);
}

(async () => {
    console.log("\n📊 ĐỘ HIỂN THỊ TRÊN AI SEARCH — tramdungchill.vn");
    console.log("   Bộ câu hỏi " + boCauHoi.phienBan + " (" + boCauHoi.cauHoi.length + " câu, chốt " +
        boCauHoi.ngayChot + ") · " + tepNhatKy.length + " tệp nhật ký\n");

    if (loi.length) {
        console.log("❌ Nhật ký chưa hợp lệ:");
        for (const e of loi) console.log("     " + e);
        console.log("");
    }

    const urlHong = KIEM_URL ? await kiemMoiUrl() : new Set();
    if (!KIEM_URL) console.log("  (chưa soi URL — thêm --kiem-url để gọi mạng kiểm mục 240)\n");

    const moiLan = [];
    for (const d of dot) {
        for (const l of d.lanDo || []) {
            moiLan.push(Object.assign({}, l, { _dot: d.dot, _nenTang: d.dieuKienChung && d.dieuKienChung.nenTang }));
        }
    }
    if (moiLan.length === 0) {
        console.log("  Chưa có lần đo nào. Chép docs/do-hien-thi-ai/nhat-ky/MAU.json rồi hỏi tay theo");
        console.log("  docs/do-hien-thi-ai/README.md — một lần xuất hiện KHÔNG đủ kết luận (mục 243).\n");
        process.exit(loi.length ? 1 : 0);
    }

    inBang("TỔNG", tinh(moiLan, urlHong));
    console.log("");

    const nhom = (khoa, ten) => {
        const g = new Map();
        for (const l of moiLan) {
            const k = khoa(l);
            if (!g.has(k)) g.set(k, []);
            g.get(k).push(l);
        }
        console.log("  ── theo " + ten + " ──");
        for (const [k, v] of [...g.entries()].sort()) inBang(k, tinh(v, urlHong));
        console.log("");
    };
    nhom((l) => l._nenTang || "?", "nền tảng");
    nhom((l) => (maCau.get(l.maCauHoi) || {}).loai || "?", "loại truy vấn");

    if (LICH_SU) nhom((l) => l._dot || "?", "đợt đo (xu hướng — mục 243)");

    // Câu nào chưa đo lần nào — đo thiếu cũng là một kết quả cần biết.
    const daDo = new Set(moiLan.map((l) => l.maCauHoi));
    const thieu = boCauHoi.cauHoi.filter((c) => !daDo.has(c.ma)).map((c) => c.ma);
    if (thieu.length) console.log("  ⚠️  " + thieu.length + "/" + boCauHoi.cauHoi.length + " câu chưa đo lần nào: " + thieu.join(", ") + "\n");

    process.exit(loi.length || urlHong.size ? 1 : 0);
})();
