/**
 * kiem-phong-lot.js — kiểm bộ số size-adjust của phông lót còn khớp không.
 *
 * VÌ SAO CẦN: css/style.css khai 3 @font-face "Fallback" kèm size-adjust /
 * ascent-override / descent-override. Ba con số đó KHÔNG phải tự nghĩ ra — chúng
 * tính từ bề rộng trung bình của chính file .woff2 trong assets/fonts, cân theo
 * tần suất ký tự thật của index+menu+blog.
 *
 * Nghĩa là chúng sẽ MỤC nếu sau này đổi file phông, đổi bộ ký tự (subset), hoặc
 * đổi nhiều chữ trên trang. Mà mục thì không ai thấy — trang vẫn chạy, chỉ có
 * CLS lặng lẽ quay lại. Script này tính lại và báo chỗ lệch.
 *
 * CHẠY:  node scripts/kiem-phong-lot.js
 * CẦN:   Arial + Georgia trong C:/Windows/Fonts. Máy khác thì script tự bỏ qua
 *        chứ không báo lỗi — nó là công cụ chạy tay, KHÔNG nằm trong
 *        bundle-js.js và không chặn build.
 *
 * Sửa số thì nhớ sửa cả critical CSS inline trong index/menu/blog/404/duong-di —
 * script sẽ chỉ ra trang nào lệch.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const FONTS = path.join(ROOT, "assets", "fonts");
const SYS = "C:/Windows/Fonts";

// Bảng tag rút gọn của WOFF2 (chỉ số 0..62; 63 = tag ghi thẳng 4 byte)
const TAGS = ["cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm",
    "glyf", "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern", "LTSH",
    "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC", "JSTF", "MATH",
    "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar", "bdat", "bloc", "bsln",
    "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty", "just", "lcar", "mort", "morx",
    "opbd", "prop", "trak", "Zapf", "Silf", "Glat", "Gloc", "Feat", "Sill"];

function uintBase128(b, p) {
    let v = 0;
    for (let i = 0; i < 5; i++) {
        const x = b[p.o++];
        v = (v << 7) | (x & 0x7f);
        if (!(x & 0x80)) return v >>> 0;
    }
    throw new Error("UIntBase128 qua dai");
}

/** Đọc cmap + hmtx của một file phông (woff2 hoặc ttf/otf thường). */
function loadFont(file) {
    const buf = fs.readFileSync(file);
    let data;
    const tables = {};
    if (buf.toString("latin1", 0, 4) === "wOF2") {
        const n = buf.readUInt16BE(12), p = { o: 48 }, dir = [];
        for (let i = 0; i < n; i++) {
            const flags = buf[p.o++], idx = flags & 0x3f, ver = (flags >> 6) & 3;
            let tag;
            if (idx === 63) { tag = buf.toString("latin1", p.o, p.o + 4); p.o += 4; }
            else tag = TAGS[idx];
            const orig = uintBase128(buf, p);
            const isGlyfLoca = tag === "glyf" || tag === "loca";
            // glyf/loca: version 0 = ĐÃ biến đổi. Bảng khác: khác 0 mới là biến đổi.
            const transformed = isGlyfLoca ? ver === 0 : ver !== 0;
            dir.push({ tag, len: transformed ? uintBase128(buf, p) : orig, transformed });
        }
        // Dữ liệu các bảng nối liền nhau theo đúng thứ tự directory, không chèn đệm
        data = zlib.brotliDecompressSync(buf.subarray(p.o));
        let off = 0;
        for (const t of dir) { tables[t.tag] = { off, transformed: t.transformed }; off += t.len; }
    } else {
        data = buf;
        const n = data.readUInt16BE(4);
        for (let i = 0; i < n; i++) {
            const o = 12 + i * 16;
            tables[data.toString("latin1", o, o + 4)] = { off: data.readUInt32BE(o + 8), transformed: false };
        }
    }
    const upem = data.readUInt16BE(tables.head.off + 18);
    const numH = data.readUInt16BE(tables.hhea.off + 34);

    // cmap format 4 (Windows Unicode BMP) → codepoint : glyph id
    const map = new Map();
    const c = tables.cmap.off;
    let sub = -1;
    for (let i = 0, n = data.readUInt16BE(c + 2); i < n; i++) {
        const pid = data.readUInt16BE(c + 4 + i * 8), eid = data.readUInt16BE(c + 6 + i * 8);
        if (pid === 3 && (eid === 1 || eid === 10)) sub = c + data.readUInt32BE(c + 8 + i * 8);
    }
    if (sub >= 0 && data.readUInt16BE(sub) === 4) {
        const segX2 = data.readUInt16BE(sub + 6), seg = segX2 / 2;
        const endO = sub + 14, startO = endO + segX2 + 2, deltaO = startO + segX2, rangeO = deltaO + segX2;
        for (let i = 0; i < seg; i++) {
            const end = data.readUInt16BE(endO + i * 2), start = data.readUInt16BE(startO + i * 2);
            const delta = data.readInt16BE(deltaO + i * 2), ro = data.readUInt16BE(rangeO + i * 2);
            if (start === 0xffff) continue;
            for (let cp = start; cp <= end && cp !== 0x10000; cp++) {
                let g;
                if (ro === 0) g = (cp + delta) & 0xffff;
                else {
                    const gi = rangeO + i * 2 + ro + (cp - start) * 2;
                    if (gi + 1 >= data.length) continue;
                    g = data.readUInt16BE(gi);
                    if (g) g = (g + delta) & 0xffff;
                }
                if (g) map.set(cp, g);
            }
        }
    }
    // hmtx đã biến đổi (version 1) chỉ bỏ mảng lsb — mảng advanceWidth vẫn ở đầu
    const hm = tables.hmtx;
    const base = hm.off + (hm.transformed ? 1 : 0);
    const stride = hm.transformed ? 2 : 4;
    return {
        em(cp) {
            const g = map.get(cp);
            if (!g) return null;
            return data.readUInt16BE(base + Math.min(g, numH - 1) * stride) / upem;
        }
    };
}

/** Gộp nhiều file subset (latin + vietnamese) thành một họ phông. */
const family = (files) => ({
    em(cp) {
        for (const f of files) { const w = f.em(cp); if (w != null) return w; }
        return null;
    }
});

/** Bề rộng chuỗi tính theo em (bỏ qua ký tự phông không có). */
function widthEm(fam, s) {
    let sum = 0;
    for (const ch of s) { const w = fam.em(ch.codePointAt(0)); if (w != null) sum += w; }
    return sum;
}

/** Tỉ lệ bề rộng phông thật ÷ phông lót, CHỈ tính ký tự cả hai đều có. */
function ratio(real, fb, corpus) {
    const freq = new Map();
    for (const ch of corpus) {
        const cp = ch.codePointAt(0);
        freq.set(cp, (freq.get(cp) || 0) + 1);
    }
    let a = 0, b = 0;
    for (const [cp, n] of freq) {
        const x = real.em(cp), y = fb.em(cp);
        if (x == null || y == null) continue;   // thiếu một bên là lệch tỉ lệ
        a += x * n; b += y * n;
    }
    return a / b;
}

const visibleText = (file) => fs.readFileSync(file, "utf8")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ").trim();

// ── chạy ────────────────────────────────────────────────────────────────
const arialPath = path.join(SYS, "arial.ttf");
const georgiaPath = path.join(SYS, "georgia.ttf");
if (!fs.existsSync(arialPath) || !fs.existsSync(georgiaPath)) {
    console.log("Bo qua: khong thay Arial/Georgia trong " + SYS + " (script nay chay tren Windows).");
    process.exit(0);
}

const inter = family([
    loadFont(path.join(FONTS, "inter-latin.woff2")),
    loadFont(path.join(FONTS, "inter-vietnamese.woff2"))]);
const dancing = family([
    loadFont(path.join(FONTS, "dancing-script-700-latin.woff2")),
    loadFont(path.join(FONTS, "dancing-script-700-vietnamese.woff2"))]);
const playfair = family([
    loadFont(path.join(FONTS, "playfair-latin.woff2")),
    loadFont(path.join(FONTS, "playfair-vietnamese.woff2"))]);
const arial = family([loadFont(arialPath)]);
const georgia = family([loadFont(georgiaPath)]);

const corpus = ["index.html", "menu.html", "blog.html"]
    .map((f) => visibleText(path.join(ROOT, f))).join(" ");
// Dancing Script chỉ dùng cho tên quán (H1 hero + logo footer)
const BRAND = "Trạm Dừng Chill Tiệm Nướng Trạm Dừng Chill";

// ×0,985: cố ý cho phông lót HẸP hơn phông thật ~1,5%. Hẹp thì không bao giờ đẻ
// thêm dòng; rộng hơn một chút là đủ đẩy chữ xuống dòng rồi gây nhảy.
const MARGIN = 0.985;
const want = {
    "Inter Fallback": ratio(inter, arial, corpus) * MARGIN,
    "Dancing Script Fallback": ratio(dancing, arial, BRAND) * MARGIN,
    "Playfair Fallback": ratio(playfair, georgia, corpus) * MARGIN
};

const FILES = ["css/style.css", "index.html", "menu.html", "blog.html", "404.html", "duong-di/index.html"];
let bad = 0;
console.log("Bo so size-adjust tinh lai tu phong + chu hien tai:\n");

for (const fam of Object.keys(want)) {
    const pct = +(want[fam] * 100).toFixed(2);
    console.log("  " + fam.padEnd(24) + " nen la " + pct + "%");
    for (const rel of FILES) {
        const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
        const re = new RegExp("font-family:\\s*'" + fam + "';[\\s\\S]{0,160}?size-adjust:\\s*([0-9.]+)%");
        const m = src.match(re);
        if (!m) { console.log("      x " + rel + ": khong thay khoi @font-face nay"); bad++; continue; }
        const has = parseFloat(m[1]);
        // lệch dưới 0,5% thì bỏ qua — sai số làm tròn, chưa đủ đổi số dòng
        if (Math.abs(has - pct) > 0.5) { console.log("      x " + rel + ": dang khai " + has + "%"); bad++; }
    }
}

// ── kiểm chốt: chữ hero có đổi số dòng khi phông đổi không.
// Moto G Power như Lighthouse mô phỏng: khung nhìn 412px.
// .hero-content max-width 800 + padding 0 24px → ô chữ rộng 364px.
// .hero-badge còn trừ tiếp padding 20px mỗi bên + viền → 322px.
console.log("\nSo dong chu hero (khung nhin 412px — phong that vs phong lot):");
const HERO = [
    ["H1 ten quan", dancing, arial, want["Dancing Script Fallback"], "Trạm Dừng Chill", 51.2, 364],
    ["badge dia chi", inter, arial, want["Inter Fallback"], "111 Huỳnh Tấn Phát, Phường Xuân Trường - Đà Lạt", 12.8, 322],
    ["mo ta dong 1", inter, arial, want["Inter Fallback"], "Dừng Chill giữa Đà Lạt — nướng BBQ, nghe còi tàu cổ,", 18.4, 364],
    ["mo ta dong 2", inter, arial, want["Inter Fallback"], "đợi hoàng hôn buông và nhà lồng lên đèn lung linh", 18.4, 364]
];
for (const [label, real, fb, sa, text, px, avail] of HERO) {
    const wReal = widthEm(real, text) * px, wFb = widthEm(fb, text) * px * sa;
    const lines = (w) => Math.max(1, Math.ceil(w / avail));
    const ok = lines(wReal) === lines(wFb);
    if (!ok) bad++;
    console.log("  " + (ok ? "OK  " : "LECH") + " " + label.padEnd(15) +
        "that " + wReal.toFixed(0) + "px/" + lines(wReal) + " dong · lot " +
        wFb.toFixed(0) + "px/" + lines(wFb) + " dong");
}

console.log(bad
    ? "\n" + bad + " cho lech — sua lai roi chay node scripts/bundle-js.js"
    : "\nKHOP — phong lot van giu dung so dong, khong sinh CLS.");
process.exit(bad ? 1 : 0);
