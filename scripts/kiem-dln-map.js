#!/usr/bin/env node
/* ============================================================
 * scripts/kiem-dln-map.js — in bảng "bài | bậc | chủ đề | lấy từ đâu" để NGƯỜI đọc.
 *
 * Chạy tay, KHÔNG nằm trong build: `node scripts/kiem-dln-map.js`
 *   --sai-lech   chỉ in bài mà chủ đề đến từ luật từ khoá (chỗ dễ gán nhầm nhất)
 *   --the        in luôn 3 thẻ mà mỗi bài sẽ nhận
 *
 * VÌ SAO CẦN: hồ sơ chủ đề của 123 bài noindex do máy suy. Máy canh R24 chỉ đếm được
 * số thẻ, ngôn ngữ, bậc — nó KHÔNG biết một bài về "Gia Đình" bị luật /gia / gắn nhầm
 * chủ đề "chi-phi" rồi đẩy khách sang bảng giá. Đúng loại lỗi bug #16/#32 trong
 * CLAUDE.md: chỉ lộ khi mở ra đọc. Sửa một bài lệch thì khai vào GHI_DE trong
 * data/dln-map.js, đừng sửa bảng chuyên mục (một dòng đó kéo theo hàng chục trang).
 * ============================================================ */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const DLN = require(path.join(ROOT, "data", "dln-map.js"));

const chiSaiLech = process.argv.includes("--sai-lech");
const inThe = process.argv.includes("--the");

function nap(tep, bien) {
  const hop = {};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, tep), "utf8") + "\n;this." + bien + " = " + bien + ";", hop);
  return hop[bien];
}

const BAI = nap("data/blog-data.js", "BLOG_ARTICLES");
const SEO = nap("data/blog-seo.js", "BLOG_SEO");
const truCot = SEO.pillars || {};
const noidx = SEO.noindex || {};

const theoId = {};
BAI.forEach((a) => { theoId[a.id] = a; });
Object.keys(truCot).forEach((p) => {
  const t = truCot[p];
  if (theoId[p]) {
    if (t.category) theoId[p].category = t.category;
    if (t.title) theoId[p].title = t.title;
    if (t.excerpt) theoId[p].excerpt = t.excerpt;
  } else {
    theoId[p] = { id: p, title: t.title, category: t.category || "Blog", excerpt: t.excerpt };
  }
});
Object.values(theoId).forEach((a) => {
  const t = noidx[a.id];
  a._canonId = t && t !== "/" && t !== a.id ? t : null;
});

const stripHtml = (s) => String(s || "").replace(/<[^>]*>/g, " ");

/** Dựng hồ sơ GIỐNG HỆT chonBaiLienQuan() trong generate-blog-pages.js, nhưng ghi lại
 *  từng chủ đề đến từ đâu để người đọc soi được. Đổi generator thì đổi cả hàm này. */
function hoSo(a) {
  if (DLN.GHI_DE[a.id]) {
    return { bac: DLN.GHI_DE[a.id].bac, tag: new Set(DLN.GHI_DE[a.id].tag), nguon: "GHI_DE (khai tay)", khop: [] };
  }
  if (DLN.DICH[a.id]) {
    return { bac: DLN.DICH[a.id].bac, tag: new Set(DLN.DICH[a.id].tag), nguon: "DICH (bài đích, khai tay)", khop: [] };
  }
  const tag = new Set(DLN.TAG_DANH_MUC[a.category] || []);
  const tuDanhMuc = new Set(tag);
  let bac = DLN.BAC_DANH_MUC[a.category];
  let nguon = "chuyên mục";
  const goc = a._canonId && DLN.DICH[a._canonId];
  if (goc) {
    bac = goc.bac;
    goc.tag.forEach((t) => tag.add(t));
    nguon = "kế thừa canonical → " + a._canonId;
  }
  const khop = [];
  const ten = DLN.boDau(a.title || "");
  DLN.TU_KHOA.forEach(([mau, ma]) => {
    const m = ten.match(mau);
    if (m) { if (!tag.has(ma)) khop.push(ma + " ← \"" + m[0].trim() + "\""); tag.add(ma); }
  });
  if (tag.size < 2) {
    const tt = DLN.boDau(stripHtml(a.excerpt || ""));
    DLN.TU_KHOA.forEach(([mau, ma]) => {
      const m = tt.match(mau);
      if (m) { if (!tag.has(ma)) khop.push(ma + " ← tóm tắt \"" + m[0].trim() + "\""); tag.add(ma); }
    });
  }
  return { bac: bac, tag: tag, nguon: nguon, khop: khop, tuDanhMuc: tuDanhMuc };
}

// ── Kiểm tính toàn vẹn của chính bảng ─────────────────────────────────────
const canhBao = [];
const maHopLe = new Set(DLN.MA_CHU_DE);
Object.entries(DLN.DICH).forEach(([id, d]) => {
  if (!theoId[id]) canhBao.push("DICH khai \"" + id + "\" nhưng không có bài nào mang id đó");
  else if (Object.prototype.hasOwnProperty.call(noidx, id)) canhBao.push("DICH khai \"" + id + "\" nhưng bài đó đang NOINDEX");
  d.tag.forEach((t) => { if (!maHopLe.has(t)) canhBao.push(id + ": chủ đề \"" + t + "\" không có trong MA_CHU_DE"); });
  if (!DLN.BAC_RANK.hasOwnProperty(d.bac)) canhBao.push(id + ": bậc \"" + d.bac + "\" không hợp lệ");
});
Object.values(theoId).forEach((a) => {
  if (!DLN.TAG_DANH_MUC[a.category] || !DLN.BAC_DANH_MUC[a.category]) {
    canhBao.push("chuyên mục \"" + a.category + "\" (bài " + a.id + ") chưa khai trong dln-map.js");
  }
});
Object.entries(DLN.TAG_DANH_MUC).forEach(([c, ts]) =>
  ts.forEach((t) => { if (!maHopLe.has(t)) canhBao.push("TAG_DANH_MUC[" + c + "] có chủ đề lạ \"" + t + "\""); }));

// Đích ngoài blog: trang phải có thật, ảnh phải có bản 400w/800w (thiếu là R21 chặn),
// và phải đủ chữ cho CẢ HAI ngôn ngữ vì nó phục vụ cả hai cụm.
Object.entries(DLN.DICH_NGOAI || {}).forEach(([id, n]) => {
  if (DLN.DICH[id]) canhBao.push("id \"" + id + "\" có ở cả DICH lẫn DICH_NGOAI");
  const trang = n.href.replace(/^\.\.\//, "").replace(/#.*$/, "");
  if (!fs.existsSync(path.join(ROOT, trang))) canhBao.push(id + ": href trỏ trang không có thật — " + trang);
  if (!fs.existsSync(path.join(ROOT, n.anh))) canhBao.push(id + ": ảnh không có thật — " + n.anh);
  ["-400w.webp", "-800w.webp"].forEach((d) => {
    if (!fs.existsSync(path.join(ROOT, n.anh.replace(/[.](jpg|webp)$/i, d)))) {
      canhBao.push(id + ": ảnh thiếu bản " + d + " → thẻ không có srcset, luật R21 chặn");
    }
  });
  // Chỉ đích phục vụ CẢ HAI cụm (lang = null) mới cần đủ chữ tiếng Anh.
  const canNgonNgu = n.lang == null ? ["vi", "en"] : [n.lang];
  canNgonNgu.forEach((L) => {
    if (!n[L] || !n[L].nhan || !n[L].tieuDe || !n[L].alt) canhBao.push(id + ": thiếu nhan/tieuDe/alt cho tiếng " + L);
  });
  n.tag.forEach((t) => { if (!maHopLe.has(t)) canhBao.push(id + ": chủ đề \"" + t + "\" không có trong MA_CHU_DE"); });
  if (!DLN.BAC_RANK.hasOwnProperty(n.bac)) canhBao.push(id + ": bậc \"" + n.bac + "\" không hợp lệ");
});

// ── In ────────────────────────────────────────────────────────────────────
const ds = Object.values(theoId).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
let soTuKhoa = 0, soKeThua = 0, soKhaiTay = 0, soChuyenMuc = 0;
const demTag = {};

console.log("\n📋 BẢNG BẬC Ý ĐỊNH + CHỦ ĐỀ — " + ds.length + " bài");
console.log("   Cột 'lấy từ đâu' cho biết hồ sơ do NGƯỜI khai hay MÁY suy.\n");

for (const a of ds) {
  const h = hoSo(a);
  h.tag.forEach((t) => { demTag[t] = (demTag[t] || 0) + 1; });
  if (h.nguon.startsWith("GHI_DE") || h.nguon.startsWith("DICH")) soKhaiTay++;
  else if (h.nguon.startsWith("kế thừa")) soKeThua++;
  else soChuyenMuc++;
  if (h.khop && h.khop.length) soTuKhoa++;

  if (chiSaiLech && !(h.khop && h.khop.length)) continue;

  console.log("  [" + h.bac + "] " + a.id);
  console.log("       " + (a.title || "").slice(0, 78));
  console.log("       chủ đề : " + [...h.tag].join(", "));
  console.log("       lấy từ : " + h.nguon + (h.khop && h.khop.length ? " + từ khoá: " + h.khop.join(" · ") : ""));
  console.log("");
}

console.log("── Tổng kết ─────────────────────────────────────────────");
console.log("  hồ sơ do NGƯỜI khai (DICH/GHI_DE) : " + soKhaiTay);
console.log("  kế thừa canonical do người khai   : " + soKeThua);
console.log("  suy theo chuyên mục               : " + soChuyenMuc);
console.log("  có chủ đề thêm từ luật từ khoá    : " + soTuKhoa + "  ← soi kỹ nhóm này");
console.log("  chủ đề dùng nhiều nhất            : " +
  Object.entries(demTag).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([t, n]) => t + "(" + n + ")").join(" · "));

if (canhBao.length) {
  console.log("\n⚠️  " + canhBao.length + " cảnh báo:");
  canhBao.forEach((c) => console.log("   - " + c));
  process.exit(1);
}
console.log("\n✅ Bảng dln-map.js toàn vẹn: mọi đích có thật và còn index, mọi chuyên mục đã khai.\n");
