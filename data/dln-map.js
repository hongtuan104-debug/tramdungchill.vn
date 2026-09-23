/* ============================================================
 * data/dln-map.js — bản đồ bậc ý định + chủ đề, dùng để chọn "Bài viết liên quan".
 *
 * File này CHỈ Node đọc lúc build (giống data/schema-data.js) — không trang nào nạp,
 * không nằm trong precache. cat-phong.js chỉ quét css/ js/ components/ + data/translations.js
 * nên chú thích tiếng Việt ở đây KHÔNG làm phình phông subset.
 *
 * VÌ SAO CÓ FILE NÀY (đo 16/09/2026, đếm trên 141 file blog/*.html production):
 *   Thuật toán cũ chọn thẻ theo "cùng chuyên mục, bài mới nhất trước". Bài mới nhất
 *   toàn site (an-vat-da-lat-buoi-toi, 30/07/2026) vừa đứng đầu chuyên mục đông nhất
 *   vừa là bài lấp chỗ cho mọi chuyên mục thiếu bài index → nó hứng 113/423 thẻ,
 *   trong khi bài chủ lực nuong-bbq-ngam-xe-lua chỉ có 9 và quan-nuong-da-lat-view-nha-long có 3.
 *   Thuần thiên vị ngày đăng, không ai cố ý.
 *
 * NĂM BẬC Ý ĐỊNH (thang khách đi từ mơ hồ tới đặt bàn):
 *   O = đang tìm hiểu Đà Lạt nói chung, chưa nghĩ tới chuyện chọn quán
 *   C = đang chọn giữa các kiểu quán / các lựa chọn
 *   P = đã chọn hướng, cần thấy bằng chứng quán làm được thật
 *   R = đang cân ngân sách, hỏi giá
 *   A = sẵn sàng đặt bàn, chỉ cần biết đặt thế nào / ngồi đâu
 * Thẻ liên quan nên dẫn khách LÊN bậc cao hơn. Trước bản này, bài bậc O chỉ dẫn sang
 * bài bậc O (cam-trai-da-lat trỏ về-đêm + lịch-trình + mùa-nào-đẹp — cả 3 đều O).
 *
 * ⚠️ PHÂN VÂN THÌ ĐOÁN BẬC THẤP. Đoán thấp một nấc chỉ làm thang dài thêm một bước;
 *    đoán cao một nấc là ném khách còn mơ hồ thẳng vào bảng giá.
 * ============================================================ */

/* 14 mã chủ đề. Thêm mã mới thì phải thêm vào cả DICH, TAG_DANH_MUC và TU_KHOA,
   không thì mã đó không bao giờ khớp được gì. */
const MA_CHU_DE = [
  "nuong", "tau", "hoang-hon", "nha-long", "ban-dem", "hen-ho", "tiec",
  "gia-dinh", "nhom", "chi-phi", "du-lich", "an-vat", "dat-ban", "di-lai", "nuoc-ngoai"
];
/* ⚠️ "di-lai" TÁCH khỏi "dat-ban" (16/09/2026) — không gộp lại.
   Bản đầu nhét "duong di|do xe" chung vào "dat-ban", nên bài "Quán Nướng Có Chỗ Đỗ Xe",
   "Quán Ăn Gần Trung Tâm", "Quán Nướng Gần Hồ Tuyền Lâm" chấm y hệt bài về đặt bàn —
   và vì chúng đều mang thêm "nuong" nên `tip-chon-cho-ngoi-quan-nuong` luôn thắng.
   Hệ quả: trang `duong-di/` chỉ nhận 3 thẻ, lại rơi vào 3 bài KHÔNG nói về đường đi
   (nhóm 10 người, team building, hoàng hôn). Tách mã ra thì nó về đúng bài nói về
   vị trí/đỗ xe. Đây là ví dụ: thẻ đặt sai chỗ còn tệ hơn không có thẻ. */

/* ─────────────────────── (A) 18 BÀI ĐÍCH ───────────────────────
 * Đây là toàn bộ đích mà thẻ liên quan được phép trỏ tới — đúng 18 bài đang index.
 * bac  : bậc ý định, chốt 16/09/2026 bằng 5 góc nhìn độc lập + trọng tài cho bài lệch phiếu.
 * tag  : chủ đề bài thật sự nói tới (đọc tiêu đề + tóm tắt, không suy từ chuyên mục).
 * trongSo: phần link công bằng của bài. 1.25 = bài nói về QUÁN (bài kiếm tiền),
 *          0.70 = bài du lịch chung, 1.00 = bài tiếng Anh (cụm riêng, không so với cụm Việt).
 *          Tổng trọng số cụm Việt = 10 × 1.25 + 6 × 0.70 = 16.70.
 *
 * ⚠️ Bài ở đây PHẢI đang index. Cho một bài thành noindex trong data/blog-seo.js mà
 *    quên xoá dòng dưới đây → generator dừng build kèm tên bài (chặn hai chiều).
 */
const DICH = {
  // ── Bậc P — bằng chứng quán làm được thật
  "nuong-bbq-ngam-xe-lua":          { bac: "P", trongSo: 1.25, tag: ["nuong", "tau", "hoang-hon"] },
  "quan-an-gia-dinh-da-lat":        { bac: "P", trongSo: 1.25, tag: ["gia-dinh", "nuong", "dat-ban"] },
  "quan-nuong-da-lat-view-nha-long":{ bac: "P", trongSo: 1.25, tag: ["nuong", "nha-long", "hoang-hon", "tau", "ban-dem"] },
  "da-lat-restaurant-train-view-en":{ bac: "P", trongSo: 1.00, lang: "en", tag: ["nuoc-ngoai", "nuong", "tau"] },

  // ── Bậc C — đang chọn giữa các lựa chọn
  "hen-ho-da-lat":                  { bac: "C", trongSo: 1.25, tag: ["hen-ho", "nuong", "tau", "nha-long", "ban-dem"] },
  "team-building-da-lat":           { bac: "C", trongSo: 1.25, tag: ["nhom", "nuong", "dat-ban"] },
  "lau-nuong-da-lat-mua-lanh":      { bac: "C", trongSo: 1.25, tag: ["nuong", "tau", "du-lich"] },
  "setup-sinh-nhat-mien-phi-da-lat":{ bac: "C", trongSo: 1.25, tag: ["tiec", "nuong", "nha-long"] },
  "mon-nuong-ngon-nhat-da-lat":     { bac: "C", trongSo: 1.25, tag: ["nuong", "chi-phi", "tau"] },
  "da-lat-cho-nguoi-nuoc-ngoai":    { bac: "C", trongSo: 1.00, lang: "en", tag: ["nuoc-ngoai", "nuong", "chi-phi", "dat-ban"] },

  // ── Bậc R — cân ngân sách
  "an-nuong-da-lat-bao-nhieu-tien": { bac: "R", trongSo: 1.25, tag: ["chi-phi", "nuong"] },

  // ── Bậc A — sẵn sàng đặt bàn
  // TẠM ẨN 23/09/2026: bài đang noindex trong blog-seo.js (generator chặn đích noindex). Hiện lại bài thì mở dòng dưới.
  // Bậc A vẫn còn qua DICH_NGOAI (duong-di/).
  // "tip-chon-cho-ngoi-quan-nuong":   { bac: "A", trongSo: 1.25, tag: ["dat-ban", "nuong", "tau"] },

  // ── Bậc O — còn đang tìm hiểu Đà Lạt nói chung
  "da-lat-mua-nao-dep-nhat":        { bac: "O", trongSo: 0.70, tag: ["du-lich", "hoang-hon"] },
  "dac-san-da-lat-mua-ve":          { bac: "O", trongSo: 0.70, tag: ["an-vat", "du-lich"] },
  "cam-trai-da-lat":                { bac: "O", trongSo: 0.70, tag: ["du-lich"] },
  "lich-trinh-da-lat-3-ngay-2-dem": { bac: "O", trongSo: 0.70, tag: ["du-lich", "an-vat", "nuong"] },
  "da-lat-ve-dem-di-dau":           { bac: "O", trongSo: 0.70, tag: ["du-lich", "ban-dem", "an-vat"] },
  "an-vat-da-lat-buoi-toi":         { bac: "O", trongSo: 0.70, tag: ["an-vat", "du-lich", "ban-dem"] }
};

/* ─────────────── (A2) ĐÍCH NGOÀI BLOG — trang chốt đơn ───────────────
 * Bài bậc R (giá) và bậc A (đặt bàn) mà chỉ dẫn sang một bài blog khác thì khách đang
 * sẵn sàng xuống tiền lại bị đẩy đi đọc tiếp. Hai đích dưới đây là đích THẬT của thang:
 * xem giá ở thực đơn, và đặt bàn.
 *
 * Chúng cũng gỡ ca cụm tiếng Anh: site chỉ có 2 bài EN index nên trang EN trước đó chỉ
 * còn 1 thẻ. `lang: null` = phục vụ CẢ HAI cụm — `menu.html` là 26 trang ẢNH nên trung
 * tính ngôn ngữ, `index.html` có nút EN/VI.
 *
 * ⚠️ Vì có hai đích KHÔNG phải bài viết, tiêu đề khối đã đổi từ "Bài viết liên quan"
 *    thành "Gợi ý cho bạn" (`ui()` trong generate-blog-pages.js). Chữ đó nằm TRONG
 *    `<section class="blog-related">` nên không đụng dấu vân lastmod — đã kiểm.
 * ⚠️ Ảnh phải có sẵn bản `-400w.webp` + `-800w.webp`, không thì thẻ thiếu srcset và
 *    luật R21 chặn. Alt viết sau khi MỞ ẢNH RA XEM (bug #16/#32), đừng tả theo tên file.
 */
const DICH_NGOAI = {
  "menu": {
    href: "../menu.html",
    bac: "R", trongSo: 1.25, tag: ["chi-phi", "nuong"],
    anh: "assets/images/blog/cap-doi-ban-lau-nuong-da-lat.webp",
    vi: {
      nhan: "Thực đơn",
      tieuDe: "Thực Đơn Trạm Dừng Chill — Hơn 70 Món, Giá Đã Gồm VAT",
      alt: "Cặp đôi ngồi bàn gỗ bày lẩu, khay thịt, hải sản và salad ở Trạm Dừng Chill, phía sau là toa tàu cửa sổ bo tròn của khu check-in trong quán"
    },
    en: {
      nhan: "Menu",
      tieuDe: "Tram Dung Chill Menu — Over 70 Dishes, VAT Included",
      alt: "A couple at a wooden table laid with hotpot, meat and seafood platters and salad at Tram Dung Chill, the restaurant's round-window check-in carriage behind them"
    }
  },
  "duong-di": {
    href: "../duong-di/",
    bac: "A", trongSo: 1.00, lang: "vi", tag: ["di-lai", "dat-ban"],
    anh: "assets/images/blog/cong-tre-tram-dung-chill-da-lat.webp",
    vi: {
      nhan: "Đường đi",
      tieuDe: "Đường Đi Đến Trạm Dừng Chill — 111 Huỳnh Tấn Phát, Có Video Chỉ Đường",
      alt: "Khách tạo dáng ở cổng tre gắn biển Trạm Dừng Chill, bên trong là dãy bàn gỗ và cờ đỏ"
    }
    /* KHÔNG khai `en`: trang này toàn chữ tiếng Việt (h1, hướng dẫn, FAQ) nên `lang: "vi"` —
       khác `menu.html` vốn là 26 trang ẢNH nên để `lang: null` dùng được cho cả hai cụm.
       Đẩy khách đọc tiếng Anh vào một trang tiếng Việt chỉ để trang EN đủ 3 thẻ là
       tối ưu con số chứ không tối ưu người đọc. */
  }
};
/* ⚠️ ĐỪNG thêm thẻ "Đặt bàn" trỏ `../index.html#booking` vào đây — đã thử và BỎ (16/09/2026).
 * `templates/blog-post.html` dòng ~119 đã có sẵn khối CTA nền đen, nút vàng "Đặt bàn ngay →"
 * nằm NGAY DƯỚI khối gợi ý, cùng một màn hình. Thêm thẻ nữa là nhân đôi cùng một lời mời,
 * mà mỗi thẻ chiếm một suất: đo thật thì nó ăn 17 suất, kéo `team-building-da-lat`
 * (bài index) từ 20 xuống 5 link nội bộ. Khối gợi ý để dẫn khách tới trang CHƯA có lối vào
 * rõ ràng — `menu.html` đúng loại đó, form đặt bàn thì không. */

/* ─────────────────────── (B) HỒ SƠ BÀI NGUỒN ───────────────────────
 * Bài NGUỒN là trang đang hiện khối thẻ — cả 141 bài, gồm 123 bài noindex.
 * Thứ tự ưu tiên khi dựng hồ sơ (bac + tag) cho bài nguồn, dừng ở nhánh đầu tiên khớp:
 *
 *   0. GHI_DE[id]                       — khai tay cho đúng một bài
 *   1. DICH[id]                         — bài nguồn cũng là bài đích thì dùng hồ sơ chuẩn
 *   2. canonical của nó trỏ sang bài đích — KẾ THỪA bậc + tag của bài đó
 *   3. TAG_DANH_MUC / BAC_DANH_MUC       — bảng theo chuyên mục
 *
 * Nhánh 2 quan trọng nhất: 95/123 bài noindex đã khai canonical sang một bài index
 * trong data/blog-seo.js. Đó là NGƯỜI biên tập tuyên bố "bài này nói cùng chuyện với
 * bài kia" — tín hiệu thật, không phải máy đoán. Nhờ nó chỉ còn 28 bài phải suy
 * theo chuyên mục (21 bài canonical trỏ trang chủ + 7 bài trỏ chính nó).
 *
 * ⚠️ Kế thừa là HỢP (union) chứ không thay thế: bài "Valentine" canonical về
 *    hen-ho-da-lat vẫn phải giữ tag "tiec" của chính nó.
 */

/* Khai tay cho từng bài, đè lên mọi suy đoán. Để trống là bình thường —
   chỉ điền khi thấy một bài cụ thể bị đẩy sai hướng, khỏi phải sửa bảng chuyên mục
   rồi kéo theo hàng chục trang khác. */
const GHI_DE = {
  // "id-bai": { bac: "C", tag: ["nuong", "dat-ban"] },
};

/* Chuyên mục → chủ đề mặc định. Chỉ dùng cho 28 bài ở nhánh 3.
 * ⚠️ "Ẩm thực Đà Lạt" KHÔNG mặc định "an-vat". Đã mở 28 bài đó ra đọc tiêu đề
 *    (16/09/2026): 28/28 đều là bài CHỌN QUÁN NƯỚNG — "Quán Nhậu Đà Lạt",
 *    "Quán Nướng Mở Khuya", "Quán Nướng Có Sân Vườn", "Top 7 Quán Nướng View Đẹp"…
 *    Gán "an-vat" cho chúng là đẩy thẳng sang bài ăn vặt chợ đêm — đúng cái bệnh
 *    bản sửa này đang chữa. Tag "an-vat" giờ chỉ đến từ luật từ khoá khi tiêu đề
 *    thật sự nói về ăn vặt/đặc sản. */
const TAG_DANH_MUC = {
  "Ẩm thực Đà Lạt":    ["nuong"],
  "Quán nướng Đà Lạt": ["nuong", "dat-ban"],
  "Du lịch Đà Lạt":    ["du-lich"],
  "Mẹo & Kinh nghiệm": ["dat-ban", "nuong"],
  "Hẹn hò & Sinh nhật":["hen-ho", "tiec", "nuong"],
  "Trải nghiệm":       ["nuong", "tau", "hoang-hon"],
  "Mùa lễ hội":        ["tiec", "nuong"],
  "View đẹp Đà Lạt":   ["nha-long", "hoang-hon", "tau"],
  "Check-in & Sống ảo":["nha-long", "hoang-hon", "nuong"],
  "English":           ["nuoc-ngoai", "nuong"]
};

/* Chuyên mục → bậc mặc định. Theo quy tắc "phân vân thì đoán THẤP".
 * 28 bài dùng bảng này đều là bài chọn quán → C là đúng cho nhóm quán nướng.
 * "Mùa lễ hội" để O: 10 bài, không bài nào index, nội dung thiên về dịp lễ chung. */
const BAC_DANH_MUC = {
  "Ẩm thực Đà Lạt":    "C",
  "Quán nướng Đà Lạt": "C",
  "Du lịch Đà Lạt":    "O",
  "Mẹo & Kinh nghiệm": "C",
  "Hẹn hò & Sinh nhật":"C",
  "Trải nghiệm":       "C",
  "Mùa lễ hội":        "O",
  "View đẹp Đà Lạt":   "C",
  "Check-in & Sống ảo":"O",
  "English":           "C"
};

/* Luật từ khoá chạy trên tiêu đề ĐÃ BỎ DẤU, cộng thêm chủ đề cho bài nguồn.
 *
 * ⚠️ Mẫu phải đủ hẹp. Bản nháp đầu dùng /gia / và /tien/ — đo trên dữ liệu thật thì
 *    "Gia Đình" khớp /gia /, "Tiện Lợi" và "Đáng Tiền" khớp /tien/, làm 5 bài về gia đình
 *    bị gắn nhầm chủ đề "chi-phi" rồi đẩy sang bảng giá thay vì sang bài view/đặt bàn.
 *    Loại lỗi này không máy canh nào bắt được — chỉ lộ khi đọc bảng gán bằng mắt.
 *    Chạy `node scripts/kiem-dln-map.js` để in bảng "bài | chủ đề được gán | chuỗi khớp".
 */
const TU_KHOA = [
  [/xe lua|tau lua|duong ray|duong sat|train|trai mat/, "tau"],
  [/hoang hon|sunset|thung lung|ngam may|san may/,      "hoang-hon"],
  [/nha long|bien sao|nha kinh/,                        "nha-long"],
  [/ve dem|buoi toi|ban dem|mo khuya|an dem|night/,     "ban-dem"],
  [/hen ho|lang man|couple|valentine|cau hon|date night|romantic/, "hen-ho"],
  [/sinh nhat|ky niem|setup|tiec|noel|giang sinh|tat nien|le hoi|birthday|anniversar/, "tiec"],
  [/gia dinh|tre em|em be|con nho|bo me|family|kid/,    "gia-dinh"],
  [/team building|nhom |cong ty|lien hoan|dong nguoi|phong rieng|group/, "nhom"],
  // ⚠️ "gia ca(?!o)": bỏ dấu xong "Đánh Giá Cao" thành "danh gia cao" — chứa đúng chuỗi
  //    "gia ca". Bài "Quán Nướng Đánh Giá Cao Google" nói về SỐ SAO chứ không nói về giá,
  //    gắn nhầm là đẩy khách sang bảng giá. Chặn bằng cách loại chữ "o" đứng ngay sau.
  [/gia ca(?!o)|gia re|bang gia|gia bao|bao nhieu|chi phi|menu|combo|buffet|budget|price/, "chi-phi"],
  [/lich trinh|du lich|cam trai|mua nao|check.?in|dia diem|kinh nghiem|di dau|tour|mua mua|mua kho/, "du-lich"],
  [/an vat|dac san|lam qua|mua qua|qua tang|cho dem|banh |ca phe|cafe/, "an-vat"],
  [/dat ban|cho ngoi|ban view|dat cho|dat truoc|booking|mo cua|mo som/, "dat-ban"],
  [/duong di|do xe|dau xe|bai xe|di the nao|duong den|den quan|chi duong|dia chi|huynh tan phat|gan trung tam|gan cho dem|gan ho |gan cho |di chuyen/, "di-lai"],
  [/nuong|bbq|grill|thit |hai san|lau |quan nhau/,      "nuong"],
  [/foreign|tourist|english|guide|nuoc ngoai/,          "nuoc-ngoai"]
];

/* Bỏ dấu tiếng Việt. Chép NGUYÊN VĂN boDau() ở js/blog-renderer.js —
   so bằng mã số 768–879, và có cả nhánh Đ hoa (U+0110): thiếu nhánh đó thì
   "Đặt Bàn Online Đà Lạt" ra "đat ban online" và trượt sạch luật /dat ban/.
   ⚠️ Cố ý KHÔNG viết dải dấu bằng escape u-hex — xem chú thích ở blog-renderer. */
function boDau(s) {
  let ra = "";
  for (const ch of String(s).normalize("NFD")) {
    const ma = ch.charCodeAt(0);
    if (ma < 768 || ma > 879) ra += ch;
  }
  return ra.replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

module.exports = {
  MA_CHU_DE, DICH, DICH_NGOAI, GHI_DE, TAG_DANH_MUC, BAC_DANH_MUC, TU_KHOA, boDau,
  BAC_RANK: { O: 0, C: 1, P: 2, R: 3, A: 4 }
};
