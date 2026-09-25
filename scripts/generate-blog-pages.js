/***
* generate-blog-pages.js
* Generates individual blog post HTML pages from blog-data.js
* Zero npm dependencies - only Node built-ins (fs, path, vm)
*/

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
// Bảng bậc ý định + chủ đề để chọn "Bài viết liên quan" — xem chú thích đầu file đó.
const DLN = require("../data/dln-map.js");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data", "blog-data.js");
const FACTS_FILE = path.join(ROOT, "data", "facts.json");
const TEMPLATE_FILE = path.join(ROOT, "templates", "blog-post.html");
const BLOG_DIR = path.join(ROOT, "blog");
const SITEMAP = path.join(ROOT, "sitemap.xml");
const SITE_URL = "https://tramdungchill.vn";
// Ngày theo giờ Việt Nam. toISOString() trả giờ UTC — chạy trước 7h sáng VN là
// ra ngày HÔM QUA, làm bài vừa tới ngày đăng bị coi là chưa tới.
// Vân tay nội dung của CSS, gắn vào ?v= để trình duyệt tải lại khi CSS đổi.
// Trước đây bài blog nạp ../css/style.css KHÔNG kèm version, nên sửa CSS xong
// người dùng vẫn thấy bản cũ trong cache — đúng thứ vừa xảy ra với bảng giá.
const CSS_VER = (function () {
    try {
        const p = path.join(ROOT, "dist", "style.min.css");
        return require("crypto").createHash("md5")
            .update(fs.readFileSync(p)).digest("hex").slice(0, 8);
    } catch (e) {
        return "dev";
    }
})();
// Lop wow rieng cua bai blog (dist/wow-blog-bai.min.css, tach khoi style.min.css 25/09/2026).
// Cung cach bam voi CSS_VER de khop muc "Link CSS kem van tay khop file that" (seo-geo-verify).
const CSS_BAI_VER = require("./van-tay").bamFile(path.join(ROOT, "dist", "wow-blog-bai.min.css")) || "dev";
// Vân tay cho dist/lazy-tracking.min.js (bản nén của js/lazy-tracking.js, 13/09/2026) — 142 bài blog đều nạp file này. Trang tĩnh
// được scripts/toi-uu-tai-trang.js gắn ?v=, nhưng nó cố ý bỏ qua thư mục blog/
// (bài blog sinh từ template, sửa thẳng vào file sinh ra là mất ở lần build sau)
// nên chỗ này phải tự lo. Dùng chung scripts/van-tay.js để hai bên ra cùng mã.
const JS_LAZY_VER = require("./van-tay").bamFile(path.join(ROOT, "dist", "lazy-tracking.min.js")) || "dev";
const TODAY = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric", month: "2-digit", day: "2-digit"
}).format(new Date());

// Bảng dịch dùng chung với website. Footer trong template ghi {{I18N:khoá}} và
// được thay ở đây theo ngôn ngữ CỦA BÀI — bài blog không nạp js/i18n.js nên
// không thể để nút EN/VI lo, chữ phải chốt ngay lúc sinh trang.
const TRANS = (function () {
    const src = fs.readFileSync(path.join(ROOT, "data", "translations.js"), "utf8");
    const sb = {};
    vm.runInNewContext(src + "\n;this.TRANSLATIONS = TRANSLATIONS;", sb);
    return sb.TRANSLATIONS;
})();
// Helpers

function htmlEncode(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function stripHtml(html) {
    return String(html).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function truncate(str, maxLen) {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 3).replace(/\s+\S*$/, "") + "...";
}

// Meta description + schema description của một bài. Bài có "metaDescription" trong
// blog-seo.js thì dùng nguyên văn; không có thì cắt excerpt ở 160 ký tự.
// Thêm 15/09/2026 (checklist #09): 7/18 bài index có excerpt dài hơn 160 nên mô tả
// Google hiện bị cắt giữa câu kèm "..." — R19 trong seo-geo-verify.js chặn tái diễn.
function moTaTrang(article, excerptClean) {
    return article.metaDescription || truncate(excerptClean, 160);
}

// Bề rộng THẬT của ảnh thẻ bài (lưới .blog-grid 2 cột, gap 32px, trong .container 1200px): 560px trên
// máy tính, 1 cột từ 768px trở xuống. Bản cũ khai "1200px" nên máy tính tải bản 1200w cho ô 560px (đo
// 15/09/2026, checklist #11 mục 77). Trùng chuỗi với img.sizes trong js/blog-renderer.js — đổi lưới thì sửa cả hai.
const SIZES_THE_BAI = "(max-width: 768px) calc(100vw - 40px), (max-width: 1200px) calc(50vw - 40px), 560px";

// Ảnh cắt khung ngang do scripts/tao-anh-chia-se.js sinh (15/09/2026, checklist #11 mục 82): og:image 1200×630 cho
// Facebook/Zalo + 3 tỉ lệ 16:9 · 4:3 · 1:1 cho schema bài (khuyến nghị Article của Google). Ảnh chưa có trong bảng ANH
// của script đó thì dùng ảnh gốc như cũ — R22 trong seo-geo-verify.js báo bài index nào còn thiếu.
const { duongDanAnhCat } = require("./tao-anh-chia-se");
const { kichThuocAnh } = require("./kich-thuoc-anh");
function anhChiaSe(image) {
    var coFile = function (p) { return fs.existsSync(path.join(ROOT, p)); };
    var og = duongDanAnhCat(image, "og");
    var baTiLe = ["16x9", "4x3", "1x1"].map(function (l) { return duongDanAnhCat(image, l); });
    return {
        og: coFile(og) ? og : null,
        ogKichThuoc: coFile(og) ? kichThuocAnh(path.join(ROOT, og)) : null,
        schema: baTiLe.every(coFile) ? baTiLe : null
    };
}
function anhSchema(image) {
    var ba = anhChiaSe(image).schema;
    return ba ? ba.map(function (p) { return SITE_URL + "/" + p; }) : SITE_URL + "/" + image;
}

function formatDateVI(dateStr) {
    const p = dateStr.split("-");
    return p[2] + "/" + p[1] + "/" + p[0];
}

function readingTime(html) {
    const text = stripHtml(html);
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
}
/* Bảng thành thẻ trên điện thoại (25/09/2026). Bảng 3–6 cột trong 14 bài đọc rất chật ở màn 412px.
   CSS (style.css, <= 540px) xếp mỗi hàng thành một thẻ, mỗi ô một dòng kèm nhãn cột lấy từ
   data-label. Chỉ làm với bảng có <thead> và không gộp ô (rowspan/colspan) — gộp ô thì nhãn
   theo thứ tự cột sẽ gán sai. Thêm role table/rowgroup/row/cell vì display:block làm trình duyệt
   bỏ nghĩa "bảng" với trình đọc màn hình. Chỉ thêm THUỘC TÍNH, chữ khách đọc không đổi nên dấu
   vân nội dung (cap-nhat-lastmod.js) giữ nguyên. */
function giaiMaThucThe(s) {
    return String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
function ganNhanBang(bang) {
    if (!/<thead\b/i.test(bang) || /\b(rowspan|colspan)\s*=/i.test(bang)) return bang;
    var thead = (bang.match(/<thead\b[\s\S]*?<\/thead>/i) || [""])[0];
    var nhan = [];
    thead.replace(/<th\b[^>]*>([\s\S]*?)<\/th>/gi, function (_, inner) {
        nhan.push(htmlEncode(giaiMaThucThe(stripHtml(inner))));
        return _;
    });
    if (nhan.length < 3) return bang;
    // Chỉ bảng CHẬT mới đáng đổi: bảng giá "Món | Giá" hay "Món | Nhóm | Giá" (ô ngắn) vẫn đọc gọn
    // dưới dạng bảng, đổi sang thẻ chỉ làm bài dài thêm cả nghìn px. Bảng 2 cột thì cột sau đã
    // chiếm gần hết bề ngang nên cũng giữ nguyên.
    var oDaiNhat = 0;
    ((bang.match(/<tbody\b[\s\S]*?<\/tbody>/i) || [""])[0].match(/<tr\b[\s\S]*?<\/tr>/gi) || []).forEach(function (hang) {
        (hang.match(/<td\b[^>]*>[\s\S]*?<\/td>/gi) || []).slice(1).forEach(function (o) {
            oDaiNhat = Math.max(oDaiNhat, stripHtml(o).length);
        });
    });
    if (oDaiNhat <= 24) return bang;
    return bang
        .replace(/<table\b([^>]*)>/i, function (_, attrs) {
            if (/\sclass="/i.test(attrs)) attrs = attrs.replace(/\sclass="/i, ' class="bang-the ');
            else attrs += ' class="bang-the"';
            return "<table" + attrs + ' role="table">';
        })
        .replace(/<(thead|tbody)\b([^>]*)>/gi, '<$1$2 role="rowgroup">')
        .replace(/<th\b([^>]*)>/gi, '<th$1 role="columnheader">')
        .replace(/<tbody\b[\s\S]*?<\/tbody>/gi, function (tbody) {
            return tbody.replace(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi, function (_, attrs, hang) {
                var cot = 0;
                hang = hang.replace(/<td\b([^>]*)>/gi, function (__, a) {
                    var n = nhan[cot++];
                    return "<td" + a + ' role="cell"' + (n ? ' data-label="' + n + '"' : "") + ">";
                });
                return "<tr" + attrs + ' role="row">' + hang + "</tr>";
            });
        })
        .replace(/<thead\b[\s\S]*?<\/thead>/i, function (th) {
            return th.replace(/<tr\b([^>]*)>/gi, '<tr$1 role="row">');
        });
}

function fixAssetPaths(body) {
    // Bọc <table> trong khung cuộn riêng: bảng giá nhiều cột mà không bọc thì
    // trên điện thoại nó đẩy CẢ TRANG trượt ngang, không chỉ mình nó.
    body = String(body).replace(/<table[\s\S]*?<\/table>/g, function (m) {
        return '<div class="table-scroll">' + ganNhanBang(m) + "</div>";
    });
    return body
        .replace(/src="assets\//g, 'src="../assets/')
        // srcset chứa nhiều đường dẫn cách nhau bằng dấu phẩy — phép trên chỉ bắt
        // đường đầu tiên (và chỉ khi là src=), các bản 400w/800w sẽ trỏ blog/assets/… hỏng.
        .replace(/srcset="[^"]*"/g, function (m) {
            return m.replace(/(srcset="|,\s*)assets\//g, "$1../assets/");
        })
        // Trang chủ là "/" (đúng canonical + sitemap), KHÔNG phải "index.html": để hai
        // URL cùng nội dung thì Google tự chọn lấy một, có thể chọn bản mình không khai.
        // Giữ phép đổi này làm lưới đỡ cho nội dung cũ còn chép lối viết cũ trong blog-data.js.
        .replace(/href="(?:\.\.\/)?index\.html/g, 'href="/')
        .replace(/href="menu\.html/g, 'href="../menu.html')
        .replace(/href="blog\.html/g, 'href="../blog.html');
}
/* ---- Mục lục nhảy trang (12/08/2026) ----------------------------------
   Vì sao thêm: Google dựng "chip" sitelink dưới kết quả tìm kiếm từ heading
   CÓ id cộng với link neo trỏ tới nó — đo trên bài PasGo đang đứng #1 cụm
   "quán nướng ngon Đà Lạt": 2 chip của họ lấy nguyên văn từ H2/H3 trong bài,
   không dính dáng gì tới schema. Trước hôm nay cả site không một heading nào
   mang id, nên Google không có chỗ bám.
   Đây đồng thời là điều hướng thật: bài 2.000 chữ đọc trên điện thoại mà
   không có mục lục thì khách phải cuộn mù. */
function slugTiengViet(s) {
    return String(s)
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/Đ/g, "D")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 60)
        .replace(/-$/, "");
}

function themMucLuc(body, u) {
    var daDung = {};
    var muc = [];

    body = body.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, function (all, attrs, inner) {
        if (/\sid\s*=/i.test(attrs)) return all;      // đã có id thì tôn trọng
        var chu = stripHtml(inner);
        if (!chu) return all;
        var id = slugTiengViet(chu) || "muc";
        if (daDung[id]) {                              // hai mục trùng tên → id phải khác
            var i = 2;
            while (daDung[id + "-" + i]) i++;
            id = id + "-" + i;
        }
        daDung[id] = true;
        muc.push({ id: id, chu: chu });
        return "<h2" + attrs + ' id="' + id + '">' + inner + "</h2>";
    });

    // Dưới 3 mục thì mục lục chỉ tổ chiếm chỗ, không giúp ai điều hướng
    if (muc.length < 3) return body;

    // role="list": lớp wow (css/wow-blog-bai.css) thay số thứ tự bằng chấm ga (list-style:none),
    // mà Safari/VoiceOver bỏ vai trò danh sách của <ol> khi list-style:none → trình đọc màn hình
    // không còn báo "danh sách, N mục". Chỉ thêm thuộc tính, không đổi chữ (dấu vân lastmod giữ nguyên).
    var nav = '<nav class="toc" aria-label="' + htmlEncode(u.toc) + '">'
        + '<p class="toc-title">' + htmlEncode(u.toc) + '</p><ol role="list">'
        + muc.map(function (m) {
            return '<li><a href="#' + m.id + '">' + htmlEncode(m.chu) + "</a></li>";
        }).join("")
        + "</ol></nav>";

    // Chèn ngay trước mục đầu tiên — khách đọc hết đoạn mở bài là thấy đường đi
    var viTri = body.indexOf("<h2");
    return viTri < 0 ? body : body.slice(0, viTri) + nav + body.slice(viTri);
}

// Doanh nghiep chi co MOT thuc the tren toan site: Restaurant @id '/#restaurant'
// (dinh nghia day du o index.html). author / publisher / worksFor cua bai blog deu
// tro ve dung @id do thay vi moi cho de mot node Organization rieng — node roi rac
// cung ten se bi doc thanh nhieu doanh nghiep khac nhau.
function QUAN(them) {
    var o = {
        "@type": "Restaurant",
        "@id": SITE_URL + "/#restaurant",
        "name": "Tiệm Nướng Trạm Dừng Chill",
        "url": SITE_URL + "/"
    };
    if (them) for (var k in them) o[k] = them[k];
    return o;
}

function blogPostingSchema(article, excerptClean) {
    // E-E-A-T: tác giả là Person nếu bài có _author (trụ cột), mặc định Organization
    var author = article._author
        ? {
            "@type": "Person",
            // Có trang tác giả (tac-gia/<slug>.html) thì neo @id + url vào đó —
            // Google khuyến nghị author.url là "trang định danh duy nhất tác giả".
            "@id": article._authorPage ? article._authorPage.url + "#person" : undefined,
            "name": article._author.name,
            "url": article._authorPage ? article._authorPage.url : undefined,
            "jobTitle": article._author.role || undefined,
            "worksFor": QUAN()
        }
        : QUAN();
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": SITE_URL + "/blog/" + article.id + ".html#article",
        "headline": article.title,
        "description": moTaTrang(article, excerptClean),
        "image": anhSchema(article.image),
        "datePublished": article.date,
        "dateModified": article._dateModified || article.date,
        "author": author,
        "publisher": QUAN({
            "logo": {
                "@type": "ImageObject",
                "url": SITE_URL + "/assets/images/favicon-512.png"
            }
        }),
        // Trang chứa bài. Với bài ĐANG INDEX thì khai node WebPage đầy đủ
        // (name/url/description/inLanguage/isPartOf) và neo vào @id của WebSite —
        // trước 12/09/2026 chỗ này chỉ có @type + @id, tức một node trống rỗng
        // không nói được trang là gì, cũng không nối vào thực thể site.
        // Bài NOINDEX giữ nguyên dạng gọn: Google không index nên không đọc tới,
        // mà khai url = chính nó trong khi canonical trỏ bài khác chỉ tổ mâu thuẫn.
        "mainEntityOfPage": article._indexable === false
            ? { "@type": "WebPage", "@id": SITE_URL + "/blog/" + article.id + ".html" }
            : {
                "@type": "WebPage",
                "@id": article._canonical,
                "url": article._canonical,
                "name": article.title,
                "description": moTaTrang(article, excerptClean),
                "inLanguage": article._lang || "vi",
                "isPartOf": {
                    "@type": "WebSite",
                    "@id": SITE_URL + "/#website",
                    "name": "Tiệm Nướng Trạm Dừng Chill",
                    "url": SITE_URL + "/"
                }
            },
        "articleSection": article.category,
        "wordCount": stripHtml(article.body).split(/\s+/).filter(Boolean).length,
        "inLanguage": article._lang || "vi"
    }, null, 4);
}

// FAQPage JSON-LD (chỉ trụ cột có _faq). Trả về cả khối <script> hoặc rỗng.
function faqSchemaBlock(article) {
    if (!article._faq || !article._faq.length) return "";
    var json = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": article._faq.map(function (f) {
            return {
                "@type": "Question",
                "name": f.q,
                // Bỏ thẻ HTML: câu trả lời hiển thị có link (<a> tới thực đơn, form đặt
                // bàn…) nhưng schema chỉ cần chữ — khớp cách index.html khai FAQPage.
                "acceptedAnswer": { "@type": "Answer", "text": f.a.replace(/<[^>]+>/g, "") }
            };
        })
    }, null, 4);
    return '<script type="application/ld+json">\n    ' + json + '\n    </script>';
}

// FAQ hiển thị dạng HTML (để người + AI đọc được, không cần JS)
function faqHtml(article) {
    if (!article._faq || !article._faq.length) return "";
    var items = article._faq.map(function (f) {
        return '<div class="blog-faq-item"><h3>' + htmlEncode(f.q) + '</h3><p>' + f.a + '</p></div>';
    }).join("\n");
    return '\n<section class="blog-faq"><h2>' + ui(article).faq + '</h2>\n' + items + '\n</section>';
}

// Số đánh giá cho dòng "bằng chứng" trong khối CTA cuối bài. ĐỌC TỪ data/facts.json
// chứ không viết cứng: đổi số ở nguồn chuẩn là 141 bài tự khớp theo, khỏi phải nhớ
// sửa thêm chỗ nào. (check-facts.js vẫn soi con số này như mọi chỗ khác trên web.)
var FACTS = JSON.parse(fs.readFileSync(FACTS_FILE, "utf8"));
// "7060" -> "7.060" (kiểu Việt) và "7,060" (kiểu Anh)
var SO_DANH_GIA_VI = String(FACTS.soDanhGiaGoogle).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
var SO_DANH_GIA_EN = String(FACTS.soDanhGiaGoogle).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
var DIEM_VI = String(FACTS.diemDanhGiaGoogle).replace(".", ",");

// Chuỗi giao diện theo ngôn ngữ bài. Trước đây nav/breadcrumb/CTA/FAQ đều cứng
// tiếng Việt, nên 2 bài tiếng Anh hiện "Trang chủ / Thực đơn / Đặt bàn ngay" —
// vừa khó hiểu với khách nước ngoài (CTA không đọc được thì không có chuyển đổi),
// vừa sai accessibility tree vì trang khai lang="en" mà nội dung lại tiếng Việt.
var UI = {
    vi: {
        home: "Trang chủ", menu: "Thực đơn", blog: "Blog", book: "Đặt bàn",
        read: "phút đọc", related: "Gợi ý cho bạn", faq: "Câu hỏi thường gặp",
        ctaTitle: "Đặt Bàn Trạm Dừng Chill",
        ctaSub: "Nướng BBQ view hoàng hôn + xe lửa — trải nghiệm chỉ có tại Đà Lạt",
        ctaBtn: "Đặt bàn ngay →",
        ctaTrust: DIEM_VI + " sao · " + SO_DANH_GIA_VI + " lượt đánh giá trên Google",
        ctaTrustAria: "Xem đánh giá của khách",
        byline: "Đội ngũ Trạm Dừng Chill · Tiệm Nướng Trạm Dừng Chill",
        updated: "Cập nhật", prev: "Bài trước", next: "Bài sau",
        toc: "Nội dung bài viết"
    },
    en: {
        home: "Home", menu: "Menu", blog: "Blog", book: "Book a table",
        read: "min read", related: "You might also like", faq: "Frequently asked questions",
        ctaTitle: "Book a table at Trạm Dừng Chill",
        ctaSub: "Grilled BBQ with sunset and vintage train views — only in Da Lat",
        ctaBtn: "Book now →",
        ctaTrust: FACTS.diemDanhGiaGoogle + " stars · " + SO_DANH_GIA_EN + " Google reviews",
        ctaTrustAria: "Read guest reviews",
        byline: "The Trạm Dừng Chill team · Tiệm Nướng Trạm Dừng Chill",
        updated: "Updated", prev: "Previous", next: "Next",
        toc: "In this article"
    }
};
function ui(article) { return UI[article._lang === "en" ? "en" : "vi"]; }

// Byline tác giả. Trụ cột: tác giả thật (_author). Còn lại: byline mặc định "Đội ngũ"
// (E-E-A-T: mọi bài đều có tín hiệu "ai viết"; schema vẫn để Organization — không bịa Person).
function bylineHtml(article) {
    if (!article._author) {
        return ' <span class="blog-byline">✍️ ' + ui(article).byline + '</span>';
    }
    var role = article._author.role ? ' · ' + htmlEncode(article._author.role) : "";
    var ten = htmlEncode(article._author.name);
    if (article._authorPage) {
        ten = '<a href="../tac-gia/' + article._authorPage.slug + '.html" rel="author">' + ten + '</a>';
    }
    return ' <span class="blog-byline">✍️ ' + ten + role + '</span>';
}

// ---- Trang tác giả (13/09/2026) ----------------------------------------
// Vì sao: Google khuyến nghị author.url cho Article — "một trang định danh duy
// nhất tác giả". Trước hôm nay 18 bài đang index ghi tác giả Nguyễn Duy mà
// không trỏ đi đâu. Vỏ trang (CSS, pixel, nav/footer) viết tay trong
// tac-gia/<slug>.html; máy chỉ điền hai vùng có mốc để danh sách bài luôn khớp nguồn:
//   TAC_GIA_JSONLD   → ProfilePage + BreadcrumbList
//   TAC_GIA_NOI_DUNG → breadcrumb + tên/vai trò + thẻ bài
// ⚠️ KHÔNG khai dateModified: scripts/cap-nhat-lastmod.js ghi đè mọi "dateModified"
//    của trang trong sitemap — generator mà cũng ghi thì hai máy giật ngày qua lại
//    (đúng loại lỗi R13b canh). Ngày tạo đọc từ chính mốc START (ngayTao=...).
// ⚠️ Tiểu sử KHÔNG tự viết — chỉ tên, vai trò (data/blog-seo.js) và bài có thật.
function dienTrangTacGia(tg) {
    var bai = tg.bai
        .filter(function (a) { return a._indexable !== false && a.date <= TODAY; })
        .sort(function (a, b) { return b.date.localeCompare(a.date); });
    // Tên + vai trò chuẩn lấy ở bài tiếng Việt; tên không dấu của bài tiếng Anh
    // thành alternateName (cùng một người, cùng một @id).
    var goc = tg.bai.filter(function (a) { return a._lang !== "en"; })[0] || tg.bai[0];
    var ten = goc._author.name;
    var vaiTro = goc._author.role || "";
    var tenKhac = tg.bai.map(function (a) { return a._author.name; })
        .filter(function (n, i, arr) { return n !== ten && arr.indexOf(n) === i; });

    var html = fs.readFileSync(tg.file, "utf8");
    var reJson = /(<!-- TAC_GIA_JSONLD:START[^>]*-->)[\s\S]*?(<!-- TAC_GIA_JSONLD:END -->)/;
    var reNoiDung = /(<!-- TAC_GIA_NOI_DUNG:START[^>]*-->)[\s\S]*?(<!-- TAC_GIA_NOI_DUNG:END -->)/;
    var mocJson = html.match(reJson);
    if (!mocJson || !reNoiDung.test(html)) {
        throw new Error("tac-gia/" + tg.slug + ".html thiếu mốc TAC_GIA_JSONLD hoặc TAC_GIA_NOI_DUNG");
    }
    var ngayTao = (mocJson[1].match(/ngayTao=(\d{4}-\d{2}-\d{2})/) || [])[1];

    var profile = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "@id": tg.url + "#webpage",
        "url": tg.url,
        "name": ten + " — Tác giả blog Trạm Dừng Chill",
        "dateCreated": ngayTao,
        "inLanguage": "vi",
        "isPartOf": {
            "@type": "WebSite",
            "@id": SITE_URL + "/#website",
            "name": "Tiệm Nướng Trạm Dừng Chill",
            "url": SITE_URL + "/"
        },
        "mainEntity": {
            "@type": "Person",
            "@id": tg.url + "#person",
            "name": ten,
            "alternateName": tenKhac.length ? tenKhac : undefined,
            "jobTitle": vaiTro || undefined,
            "description": (vaiTro ? vaiTro + ", " : "") + "tác giả " + bai.length + " bài viết trên blog của quán.",
            "url": tg.url,
            "worksFor": QUAN(),
            "agentInteractionStatistic": {
                "@type": "InteractionCounter",
                "interactionType": "https://schema.org/WriteAction",
                "userInteractionCount": bai.length
            }
        }
    }, null, 4);
    // Tên chặng phải trùng từng chữ với breadcrumb hiển thị bên dưới (R7c mục e)
    var breadcrumb = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Trang chủ", "item": SITE_URL + "/" },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": SITE_URL + "/blog.html" },
            { "@type": "ListItem", "position": 3, "name": ten, "item": tg.url }
        ]
    }, null, 4);
    var khoiJson = '\n    <script type="application/ld+json">\n    ' + profile.replace(/\n/g, "\n    ") +
        '\n    </script>\n    <script type="application/ld+json">\n    ' + breadcrumb.replace(/\n/g, "\n    ") +
        '\n    </script>\n    ';

    // Thẻ bài: đúng khuôn .blog-card mà js/blog-renderer.js dựng trên blog.html
    var the = bai.map(function (a, i) {
        var anh = "../" + a.image;
        var coFile = function (duoi) { return fs.existsSync(path.join(ROOT, a.image.replace(/\.(jpg|webp)$/i, duoi))); };
        // Từ thẻ thứ 3, trên điện thoại (<= 480px) thẻ thu thành hàng ngang với ảnh vuông 104px
        // (CSS trong vỏ tac-gia/*.html) → khai sizes 104px cho khung đó, không thì máy vẫn tải 800w.
        var sizes = i >= 2 ? "(max-width: 480px) 104px, " + SIZES_THE_BAI : SIZES_THE_BAI;
        var srcset = coFile("-400w.webp") && coFile("-800w.webp")
            ? ' srcset="' + anh.replace(/\.(jpg|webp)$/i, "-400w.webp") + ' 400w, ' +
              anh.replace(/\.(jpg|webp)$/i, "-800w.webp") + ' 800w, ' + anh + ' 1200w"' +
              ' sizes="' + sizes + '"'
            : "";
        return '                    <article class="blog-card"' + (a._lang === "en" ? ' lang="en"' : "") + '>\n' +
            '                        <div class="blog-card-img"><img src="' + anh + '"' + srcset + ' alt="' + htmlEncode(a.imageAlt || a.title) + '"' + (i === 0 ? ' fetchpriority="high"' : i === 1 ? '' : ' loading="lazy"') + '></div>\n' +
            '                        <div class="blog-card-content">\n' +
            '                            <div class="blog-meta"><time datetime="' + a.date + '">' + formatDateVI(a.date) + '</time><span class="blog-category">' + htmlEncode(a.category) + '</span></div>\n' +
            '                            <h2><a href="../blog/' + a.id + '.html">' + htmlEncode(a.title) + '</a></h2>\n' +
            '                            <p>' + htmlEncode(truncate(stripHtml(a.excerpt || ""), 180)) + '</p>\n' +
            '                        </div>\n' +
            '                    </article>';
    }).join("\n");

    var noiDung = '\n' +
        '        <nav class="breadcrumb" aria-label="Breadcrumb">\n' +
        '            <div class="container">\n' +
        '                <ol>\n' +
        '                    <li><a href="/"><span>Trang chủ</span></a></li>\n' +
        '                    <li><a href="../blog.html"><span>Blog</span></a></li>\n' +
        '                    <li><span aria-current="page">' + htmlEncode(ten) + '</span></li>\n' +
        '                </ol>\n' +
        '            </div>\n' +
        '        </nav>\n' +
        '        <section class="author-hero">\n' +
        '            <div class="container">\n' +
        '                <span class="author-tag">Tác giả</span>\n' +
        '                <h1>' + htmlEncode(ten) + '</h1>\n' +
        (vaiTro ? '                <p class="author-role">' + htmlEncode(vaiTro) + '</p>\n' : '') +
        '                <p class="author-meta">' + bai.length + ' bài viết trên blog Trạm Dừng Chill</p>\n' +
        '            </div>\n' +
        '        </section>\n' +
        '        <section class="author-posts" aria-label="Bài viết của ' + htmlEncode(ten) + '">\n' +
        '            <div class="container">\n' +
        '                <div class="blog-grid">\n' + the + '\n' +
        '                </div>\n' +
        '            </div>\n' +
        '        </section>\n        ';

    // Hàm thay thế (không dùng chuỗi) để ký tự $ trong nội dung không bị hiểu thành mẫu
    var moi = html
        .replace(reJson, function (m, dau, cuoi) { return dau + khoiJson + cuoi; })
        .replace(reNoiDung, function (m, dau, cuoi) { return dau + noiDung + cuoi; });
    if (moi !== html) fs.writeFileSync(tg.file, moi, "utf8");
    console.log("Trang tác giả tac-gia/" + tg.slug + ".html: " + bai.length + " bài");
}

function breadcrumbSchema(article) {
    // Tên chặng phải trùng breadcrumb hiển thị trên trang — bài tiếng Anh hiện
    // "Home › Blog" thì schema cũng phải vậy, không để lệch ngôn ngữ.
    var u = ui(article);
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": u.home,
                "item": SITE_URL + "/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": u.blog,
                "item": SITE_URL + "/blog.html"
            },
            {
                "@type": "ListItem",
                "position": 3,
                // Phải là titleShort — ĐÚNG chuỗi breadcrumb hiển thị trên trang,
                // chứ không phải title đầy đủ. Breadcrumb hiển thị cắt ở 60 ký tự
                // (chỗ hẹp), nên khai title dài ở đây là schema mô tả một thứ khách
                // không hề nhìn thấy. Đổi cách cắt ở dưới thì đổi luôn chỗ này.
                "name": truncate(article.title, 60),
                "item": SITE_URL + "/blog/" + article.id + ".html"
            }
        ]
    }, null, 4);
}

// Main

try {
    console.log("Reading blog data...");
    const dataSource = fs.readFileSync(DATA_FILE, "utf8");
    const sandbox = {};
    // Append assignment so `const BLOG_ARTICLES` (block-scoped) is exposed on sandbox
    vm.runInNewContext(dataSource + "\n;this.BLOG_ARTICLES = BLOG_ARTICLES;", sandbox);
    const articles = sandbox.BLOG_ARTICLES;

    if (!articles || !Array.isArray(articles)) {
        throw new Error("BLOG_ARTICLES not found or not an array");
    }
    console.log("Found " + articles.length + " articles in blog-data.js");

    // ---- Phase 2 SEO: gộp nội dung trụ cột + map noindex/canonical từ data/blog-seo.js ----
    var SEO = { pillars: {}, noindex: {} };
    var SEO_FILE = path.join(ROOT, "data", "blog-seo.js");
    if (fs.existsSync(SEO_FILE)) {
        var seoSandbox = {};
        vm.runInNewContext(fs.readFileSync(SEO_FILE, "utf8") + "\n;this.BLOG_SEO = BLOG_SEO;", seoSandbox);
        if (seoSandbox.BLOG_SEO) SEO = seoSandbox.BLOG_SEO;
    }
    var pillars = SEO.pillars || {};
    var noindexMap = SEO.noindex || {};

    var byId = {};
    articles.forEach(function (a) { byId[a.id] = a; });

    // (1) Gộp/override trụ cột; (2) append trụ cột MỚI chưa có trong blog-data
    Object.keys(pillars).forEach(function (pid) {
        var p = pillars[pid];
        var existing = byId[pid];
        if (existing) {
            if (p.title) existing.title = p.title;
            if (p.seoTitle) existing.seoTitle = p.seoTitle;
            if (p.excerpt) existing.excerpt = p.excerpt;
            if (p.metaDescription) existing.metaDescription = p.metaDescription;
            if (p.image) existing.image = p.image;
            if (p.imageAlt) existing.imageAlt = p.imageAlt;
            if (p.category) existing.category = p.category;
            if (p.body) existing.body = p.body;
            existing._faq = p.faq;
            existing._author = p.author;
            existing._dateModified = p.dateModified;
            existing._lang = p.lang;
            existing._pillar = true;
        } else {
            var na = {
                id: pid,
                title: p.title,
                seoTitle: p.seoTitle,
                category: p.category || "Blog",
                date: p.date,
                image: p.image,
                imageAlt: p.imageAlt || p.title,
                badge: p.badge || "",
                featured: !!p.featured,
                excerpt: p.excerpt,
                metaDescription: p.metaDescription,
                body: p.body,
                _faq: p.faq,
                _author: p.author,
                _dateModified: p.dateModified,
                _lang: p.lang,
                _pillar: true
            };
            articles.push(na);
            byId[pid] = na;
        }
    });

    // Bài tiếng Anh KHÔNG phải trụ cột cũng phải khai lang="en".
    // Nhánh gán _lang ở trên chỉ chạy cho pillars, nên bài thường mang
    // category:"English" rơi thẳng về mặc định "vi" — sunset-bbq-da-lat-guide
    // dính đúng vậy: nội dung 100% tiếng Anh mà <html lang="vi">, og:locale
    // vi_VN, hreflang="vi". Screen reader đọc tiếng Anh bằng bộ đọc tiếng Việt
    // thì khách nghe không ra chữ nào.
    // Chỉ suy khi pillar chưa khai — pillar khai gì thì tôn trọng cái đó.
    articles.forEach(function (a) {
        if (!a._lang && a.category === "English") a._lang = "en";
    });

    // Đánh dấu indexable + canonical override cho mọi bài
    articles.forEach(function (a) {
        if (Object.prototype.hasOwnProperty.call(noindexMap, a.id)) {
            a._indexable = false;
            var target = noindexMap[a.id];
            // Đích "/" = TRANG CHỦ. Thêm 02/08/2026: đo được 20 bài đang dồn tín
            // hiệu vào /blog/top-quan-nuong-da-lat.html — trang đó đứng hạng 30–58
            // cho đúng mấy câu mà TRANG CHỦ đứng hạng 13–23. Dồn về một trang yếu
            // hơn là phí. Trước đây bản đồ này chỉ trỏ được sang bài blog khác.
            a._canonical = !target
                ? (SITE_URL + "/blog/" + a.id + ".html")
                : target === "/"
                    ? SITE_URL + "/"
                    : SITE_URL + "/blog/" + target + ".html";
            // Id TRẦN của bài mà bài này gộp vào (null nếu trỏ trang chủ hay chính nó).
            // chonBaiLienQuan() kế thừa bậc + chủ đề từ bài đó — 95/123 bài noindex có
            // giá trị này, tức 95 hồ sơ do NGƯỜI biên tập khai chứ không phải máy đoán.
            // ⚠️ Đừng đọc a._canonical thay cho nó: đó là URL đầy đủ, không phải id.
            a._canonId = (target && target !== "/" && target !== a.id) ? target : null;
        } else {
            a._indexable = true;
            a._canonical = SITE_URL + "/blog/" + a.id + ".html";
        }
    });
    // Gắn trang tác giả cho bài có _author — xem dienTrangTacGia(). Chỉ gắn khi file
    // tac-gia/<slug>.html ĐÃ có: máy không tự đẻ trang, vỏ trang do người viết.
    var tacGia = {};
    articles.forEach(function (a) {
        if (!a._author || !a._author.name) return;
        var slug = slugTiengViet(a._author.name);   // "Nguyễn Duy" và "Nguyen Duy" cùng ra nguyen-duy
        var file = path.join(ROOT, "tac-gia", slug + ".html");
        if (!fs.existsSync(file)) return;
        if (!tacGia[slug]) tacGia[slug] = { slug: slug, file: file, url: SITE_URL + "/tac-gia/" + slug + ".html", bai: [] };
        a._authorPage = tacGia[slug];
        tacGia[slug].bai.push(a);
    });

    var idxCount = articles.filter(function (a) { return a._indexable; }).length;
    console.log("Sau gộp SEO: " + articles.length + " bài (" + Object.keys(pillars).length + " trụ cột, " + Object.keys(noindexMap).length + " bài noindex, " + idxCount + " bài index được)");

    // ⚠️ Chặn TRƯỚC khi ghi bất kỳ file nào: không cho phép trang vừa CHO Google
    // đọc vừa khai ngày đăng ở tương lai. Đoạn dựng sitemap phía dưới loại bài
    // chưa tới ngày, nhưng trang vẫn nằm trên web, vẫn được link từ danh sách bài
    // ở blog.html và vẫn là đích canonical của bài gộp — Google tới nơi rồi thấy
    // ngày ở tương lai, coi là dấu hiệu xấu. (29/07/2026 đã dính đúng ca này: bài
    // "ăn nướng Đà Lạt bao nhiêu tiền" khai đăng 29/12/2026 suốt 4 tháng.)
    // Phải chọn một: hoặc cho noindex, hoặc sửa ngày về sự thật.
    var lungLo = articles.filter(function (a) { return a.date > TODAY && a._indexable !== false; });
    if (lungLo.length) {
        throw new Error(
            "Có " + lungLo.length + " bài vừa cho Google đọc vừa khai ngày đăng ở tương lai: " +
            lungLo.map(function (a) { return a.id + " (" + a.date + ")"; }).join(", ") +
            " — hoặc khai noindex trong data/blog-seo.js, hoặc sửa date về ngày thật."
        );
    }

    console.log("Reading template...");
    const template = fs.readFileSync(TEMPLATE_FILE, "utf8");

    if (!fs.existsSync(BLOG_DIR)) {
        fs.mkdirSync(BLOG_DIR, { recursive: true });
    }

    // Sort published articles by date (newest first) for prev/next navigation
    const publishedForNav = articles
        .filter(a => a.date <= TODAY && a._indexable !== false)
        .sort((a, b) => b.date.localeCompare(a.date));

    // Build a map: articleId -> { prev (older), next (newer) }
    const navMap = {};
    for (let i = 0; i < publishedForNav.length; i++) {
        const curr = publishedForNav[i];
        const newer = i > 0 ? publishedForNav[i - 1] : null;
        const older = i < publishedForNav.length - 1 ? publishedForNav[i + 1] : null;
        navMap[curr.id] = {
            prev: older ? { id: older.id, title: older.title } : null,
            next: newer ? { id: newer.id, title: newer.title } : null
        };
    }

    function buildPrevLink(nav, article) {
        if (!nav || !nav.prev) return "";
        return '<a href="' + nav.prev.id + '.html" class="blog-nav-prev"><span class="nav-label">\u2190 ' + ui(article).prev + '</span><span class="nav-title">' + htmlEncode(nav.prev.title) + '</span></a>';
    }
    function buildNextLink(nav, article) {
        if (!nav || !nav.next) return "";
        return '<a href="' + nav.next.id + '.html" class="blog-nav-next"><span class="nav-label">' + ui(article).next + ' \u2192</span><span class="nav-title">' + htmlEncode(nav.next.title) + '</span></a>';
    }

    // ── Chọn "Bài viết liên quan" theo bậc ý định (xem data/dln-map.js) ──────────
    // Bản cũ: "cùng chuyên mục, bài mới nhất trước". Vì bài mới nhất toàn site cũng là
    // bài lấp chỗ cho mọi chuyên mục thiếu bài index nên nó hứng 113/423 thẻ, còn bài
    // chủ lực chỉ 9 — thuần thiên vị ngày đăng. Bản này chấm điểm theo CHỦ ĐỀ + BẬC rồi
    // gán theo 3 vòng với TRẦN CỨNG mỗi đích.
    //
    // ⚠️ Phải chạy MỘT LẦN cho cả 141 bài TRƯỚC vòng ghi file: bộ đếm trần là trạng thái
    //    toàn cục. Tính lại trong từng lần gọi buildRelatedPosts thì trần không bao giờ
    //    chạm, kết quả khác hẳn mà không hề chậm đi — tức sai lặng lẽ.
    const KE_HOACH = chonBaiLienQuan(articles);

    function chonBaiLienQuan(tatCa) {
        const HE_SO_TRAN = 1.35;   // trần = 1.35 × phần công bằng. Xem ghi chú độ nhạy cuối hàm.
        const W_LIEN_QUAN = 0.65;  // trọng số chủ đề
        const W_BAC = 0.35;        // trọng số bậc ý định
        const RANK = DLN.BAC_RANK;

        // ── Chặn TRƯỚC khi ghi bất kỳ file nào (cùng kiểu với cái throw ngày tương lai).
        // Vòng ghi file bắt lỗi theo từng bài và không thoát khác 0, nên lỗi phát hiện
        // trong đó sẽ để lại file HTML CŨ trên đĩa mà build vẫn báo thành công.
        const theoId = {};
        tatCa.forEach(a => { theoId[a.id] = a; });
        for (const id of Object.keys(DLN.DICH)) {
            if (!theoId[id]) {
                throw new Error("data/dln-map.js khai bài đích \"" + id + "\" nhưng không có bài nào mang id đó. Đổi tên/xoá bài thì sửa cả bảng DICH.");
            }
            if (theoId[id]._indexable === false) {
                throw new Error("data/dln-map.js khai bài đích \"" + id + "\" nhưng bài đó đang noindex trong data/blog-seo.js. Thẻ liên quan không được trỏ sang trang noindex — xoá nó khỏi DICH.");
            }
        }
        for (const a of tatCa) {
            if (!DLN.TAG_DANH_MUC[a.category] || !DLN.BAC_DANH_MUC[a.category]) {
                throw new Error("Chuyên mục \"" + a.category + "\" (bài " + a.id + ") chưa khai trong TAG_DANH_MUC/BAC_DANH_MUC của data/dln-map.js. Thiếu là bài đó chấm 0 với mọi đích rồi nhận thẻ theo thứ tự viết trong bảng — sai lặng lẽ.");
            }
        }

        const nn = a => (a._lang === "en" ? "en" : "vi");

        // Gộp hai loại đích vào MỘT bảng để chấm điểm chung. Đích ngoài blog
        // (menu, đặt bàn) có lang = null → phục vụ cả cụm Việt lẫn cụm Anh.
        const MOI_DICH = {};
        Object.keys(DLN.DICH).forEach(id => {
            MOI_DICH[id] = { bac: DLN.DICH[id].bac, tag: DLN.DICH[id].tag,
                trongSo: DLN.DICH[id].trongSo, lang: DLN.DICH[id].lang || "vi", ngoai: false };
        });
        Object.keys(DLN.DICH_NGOAI).forEach(id => {
            const n = DLN.DICH_NGOAI[id];
            if (MOI_DICH[id]) throw new Error("data/dln-map.js: id \"" + id + "\" có ở cả DICH lẫn DICH_NGOAI.");
            if (!fs.existsSync(path.join(ROOT, n.anh))) {
                throw new Error("data/dln-map.js: đích ngoài blog \"" + id + "\" trỏ ảnh không có thật — " + n.anh);
            }
            // Thiếu bản 400/800 là thẻ không có srcset → luật R21 chặn. Bắt ở đây cho sớm.
            for (const duoi of ["-400w.webp", "-800w.webp"]) {
                if (!fs.existsSync(path.join(ROOT, n.anh.replace(/[.](jpg|webp)$/i, duoi)))) {
                    throw new Error("data/dln-map.js: ảnh của \"" + id + "\" thiếu bản " + duoi + " — thẻ sẽ không có srcset, R21 chặn.");
                }
            }
            // lang: null = phục vụ cả hai cụm (menu.html là 26 trang ảnh).
            // Trang nhiều CHỮ thì phải khai đúng ngôn ngữ của nó (duong-di = "vi").
            MOI_DICH[id] = { bac: n.bac, tag: n.tag, trongSo: n.trongSo,
                lang: n.lang === undefined ? null : n.lang, ngoai: true };
        });

        // ── Hồ sơ bài nguồn: ghi đè tay > là bài đích > kế thừa canonical > bảng chuyên mục
        function hoSo(a) {
            if (DLN.GHI_DE[a.id]) return { bac: DLN.GHI_DE[a.id].bac, tag: new Set(DLN.GHI_DE[a.id].tag) };
            if (DLN.DICH[a.id]) return { bac: DLN.DICH[a.id].bac, tag: new Set(DLN.DICH[a.id].tag) };

            const tag = new Set(DLN.TAG_DANH_MUC[a.category]);
            let bac = DLN.BAC_DANH_MUC[a.category];
            // Kế thừa từ bài mà nó gộp vào — HỢP chứ không thay: bài "Valentine" gộp về
            // hen-ho-da-lat vẫn phải giữ chủ đề "tiec" của chính nó.
            const goc = a._canonId && DLN.DICH[a._canonId];
            if (goc) {
                bac = goc.bac;
                goc.tag.forEach(t => tag.add(t));
            }
            const ten = DLN.boDau(a.title || "");
            DLN.TU_KHOA.forEach(([mau, ma]) => { if (mau.test(ten)) tag.add(ma); });
            // Cứu hộ: tiêu đề quá ngắn thì hồ sơ gần như rỗng và mọi cặp chấm bằng nhau.
            // Chỉ quét tóm tắt khi thiếu — quét cho mọi bài thì tóm tắt nào cũng có
            // "nướng/view" nên chủ đề dính hết vào nhau.
            if (tag.size < 2) {
                const tt = DLN.boDau(stripHtml(a.excerpt || ""));
                DLN.TU_KHOA.forEach(([mau, ma]) => { if (mau.test(tt)) tag.add(ma); });
            }
            return { bac: bac, tag: tag };
        }

        // Điểm bậc: thưởng cho bước đi LÊN, phạt bước lùi. Bài đã ở R/A thì không còn
        // bậc trên — giữ khách trong nhóm P/R/A thay vì đẩy ngược về bài du lịch chung.
        function diemBac(rs, rd) {
            if (rs >= 3) return rd >= 2 ? 0.85 : rd === 1 ? 0.50 : 0.15;
            const d = rd - rs;
            if (d === 1) return 1.00;
            if (d === 2) return 0.85;
            if (d === 3) return 0.65;
            if (d === 4) return 0.50;
            if (d === 0) return 0.40;
            return 0.15;
        }

        function cos(A, B) {
            if (!A.size || !B.size) return 0;   // tập rỗng → 0, đừng để 0/0 thành NaN
            let chung = 0;
            A.forEach(t => { if (B.has(t)) chung++; });
            return chung / Math.sqrt(A.size * B.size);
        }

        const hs = {};
        tatCa.forEach(a => { hs[a.id] = hoSo(a); });

        // ── Trần cứng, tính RIÊNG theo cụm ngôn ngữ.
        // Tính chung hai cụm thì 2 bài tiếng Anh được chia phần của cả site trong khi
        // cụm đó chỉ có 4 khe — trần thành vô nghĩa và mọi ngưỡng "sàn" báo động giả.
        // Đích ngoài blog (lang = null) nằm trong CẢ HAI cụm.
        const dichTheoNN = { vi: [], en: [] };
        Object.keys(MOI_DICH).forEach(id => {
            const L = MOI_DICH[id].lang;
            if (L === null) { dichTheoNN.vi.push(id); dichTheoNN.en.push(id); }
            else dichTheoNN[L].push(id);
        });
        ["vi", "en"].forEach(c => dichTheoNN[c].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));

        // Phần công bằng CỘNG DỒN qua các cụm: đích phục vụ cả hai cụm thì được cộng
        // phần của cả hai. Tính chung một rổ thì 2 bài tiếng Anh được chia phần của cả
        // site trong khi cụm đó chỉ có vài khe — trần thành vô nghĩa.
        const phanCongBang = {};
        Object.keys(MOI_DICH).forEach(id => { phanCongBang[id] = 0; });
        ["vi", "en"].forEach(cum => {
            const dich = dichTheoNN[cum];
            if (!dich.length) return;
            const nguon = tatCa.filter(a => nn(a) === cum);
            // Khe thật: mỗi nguồn hiện tối đa 3 thẻ, nhưng không quá số đích dùng được trừ chính nó.
            let khe = 0;
            nguon.forEach(a => { khe += Math.min(3, dich.filter(d => d !== a.id).length); });
            const tong = dich.reduce((s, id) => s + MOI_DICH[id].trongSo, 0);
            dich.forEach(id => { phanCongBang[id] += khe * MOI_DICH[id].trongSo / tong; });
        });
        const tran = {};
        Object.keys(MOI_DICH).forEach(id => {
            tran[id] = Math.max(1, Math.ceil(phanCongBang[id] * HE_SO_TRAN));
        });

        // ── Gán theo 3 vòng. Vòng 1 ai cũng lấy lựa chọn tốt nhất còn chỗ; vòng sau
        // những đích đã đầy tự nhường lại cho đích khác.
        const dung = {};
        Object.keys(MOI_DICH).forEach(id => { dung[id] = 0; });
        const ketQua = {};
        // Duyệt theo id tăng dần, so bằng MÃ KÝ TỰ — localeCompare phụ thuộc ICU của
        // từng bản Node nên cùng code trên hai máy có thể ra thứ tự khác, phá tính tất định.
        const nguonSort = tatCa.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        nguonSort.forEach(a => { ketQua[a.id] = []; });
        let tranDay = 0;

        for (let vong = 0; vong < 3; vong++) {
            for (const a of nguonSort) {
                if (ketQua[a.id].length > vong) continue;
                const daChon = new Set(ketQua[a.id].map(x => x.id));
                const ungVien = dichTheoNN[nn(a)].filter(id => id !== a.id && !daChon.has(id));
                if (!ungVien.length) continue;

                const chamDiem = ungVien.map(id => {
                    const d = MOI_DICH[id];
                    const lq = Math.min(1,
                        0.75 * cos(hs[a.id].tag, new Set(d.tag)) +
                        // Đích ngoài blog không có chuyên mục nên không ăn điểm này — đúng:
                        // nó ăn điểm ở trục BẬC (menu = R, đặt bàn = A, cao hơn mọi bài blog trừ hai bài).
                        0.25 * (!d.ngoai && theoId[id].category === a.category ? 1 : 0) +
                        // Thẻ trỏ đúng bài mà nguồn gộp vào: dòng link nội bộ chảy cùng
                        // hướng với canonical đã khai, thay vì cãi nhau với nó.
                        0.30 * (a._canonId === id ? 1 : 0));
                    return { id: id, diem: W_LIEN_QUAN * lq + W_BAC * diemBac(RANK[hs[a.id].bac], RANK[d.bac]), lq: lq };
                });
                // Phá hoà: điểm giảm → đích đang ít link hơn → id tăng. Thiếu khoá "dùng"
                // thì khi hoà điểm, bài đầu bảng chữ cái luôn thắng — đúng loại thiên lệch
                // đã góp phần đẻ ra cục 113 link.
                const xep = (ds) => ds.sort((x, y) =>
                    y.diem - x.diem || dung[x.id] - dung[y.id] || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));

                let con = chamDiem.filter(c => dung[c.id] < tran[c.id]);
                if (!con.length) { con = chamDiem; tranDay++; }   // thà tràn trần còn hơn hụt thẻ
                xep(con);
                const chon = con[0];
                ketQua[a.id].push({ id: chon.id, diem: chon.diem });
                dung[chon.id]++;
            }
        }

        // Ô đầu trong lưới 3 cột được nhìn và bấm nhiều nhất — xếp thẻ mạnh nhất lên trước.
        // Thứ tự gán ở trên là sản phẩm phụ của trạng thái trần từng vòng, không phải của độ khớp.
        // Trả về MÔ TẢ thống nhất cho cả hai loại đích, để hàm dựng HTML không phải
        // biết thẻ này là bài blog hay trang menu/đặt bàn.
        const moTa = (id, nguon) => {
            if (MOI_DICH[id].ngoai) {
                const n = DLN.DICH_NGOAI[id];
                const chu = n[nn(nguon)] || n.vi;
                return { href: n.href, anh: n.anh, alt: chu.alt, nhan: chu.nhan, tieuDe: chu.tieuDe };
            }
            const b = theoId[id];
            return { href: id + ".html", anh: b.image, alt: b.imageAlt || b.title, nhan: b.category, tieuDe: b.title };
        };

        const ra = {};
        let soNgoai = 0;
        nguonSort.forEach(a => {
            ra[a.id] = ketQua[a.id]
                .sort((x, y) => y.diem - x.diem || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))
                .map(x => { if (MOI_DICH[x.id].ngoai) soNgoai++; return moTa(x.id, a); });
        });

        const tongThe = Object.keys(ra).reduce((s, id) => s + ra[id].length, 0);
        console.log("Gợi ý cho bạn: " + tongThe + " thẻ cho " + Object.keys(ra).length +
            " bài (" + soNgoai + " thẻ trỏ menu/đặt bàn)" +
            (tranDay ? " · " + tranDay + " lượt phải tràn trần" : ""));
        return ra;
    }

    function buildRelatedPosts(currentArticle) {
        const related = KE_HOACH[currentArticle.id] || [];
        if (related.length === 0) return "";

        return related.map(function(a) {
            // srcset + sizes theo bề rộng THẬT của ô: lưới 3 cột tối đa 1000px, gap 24px → 317px; ≤768px còn 1 cột.
            // Bản cũ không srcset nên máy tính tải ảnh 1200px cho ô 317px (đo 15/09/2026, checklist #11 mục 77).
            // Tiêu đề thẻ là <p>, không phải h3: thẻ không có nội dung bên dưới, 3 h3 liền nhau chỉ làm rối dàn bài
            // (checklist #10 mục 70) — R20/R21 trong seo-geo-verify.js canh cả hai.
            var anh = "../" + a.anh;
            var coBien = ["-400w.webp", "-800w.webp"].every(function (duoi) {
                return fs.existsSync(path.join(ROOT, a.anh.replace(/[.](jpg|webp)$/i, duoi)));
            });
            var srcset = coBien
                ? ' srcset="' + anh.replace(/[.](jpg|webp)$/i, "-400w.webp") + ' 400w, ' +
                  anh.replace(/[.](jpg|webp)$/i, "-800w.webp") + ' 800w, ' + anh + ' 1200w"' +
                  ' sizes="(max-width: 768px) calc(100vw - 40px), (max-width: 1048px) calc(33.3vw - 32px), 317px"'
                : "";
            return '<a href="' + a.href + '" class="blog-related-card">' +
                '<img src="' + anh + '"' + srcset + ' alt="' + htmlEncode(a.alt) + '" loading="lazy">' +
                '<div class="blog-related-info">' +
                '<span class="blog-category">' + htmlEncode(a.nhan) + '</span>' +
                '<p class="blog-related-title">' + htmlEncode(a.tieuDe) + '</p>' +
                '</div></a>';
        }).join("\n                ");
    }

    let generated = 0;
    let errors = 0;

    for (const article of articles) {
        try {
            const excerptClean = stripHtml(article.excerpt || "");
            const metaDesc = htmlEncode(moTaTrang(article, excerptClean));
            const titleEncoded = htmlEncode(article.title);
            // titleShort chỉ dùng cho breadcrumb (chỗ hẹp, cắt là hợp lý).
            const titleShort = truncate(article.title, 60);
            // Thẻ <title> thì KHÔNG được cắt: trước đây template ghép
            // "{titleShort} — Trạm Dừng Chill Đà Lạt" nên 86/143 bài có dấu "..."
            // ngay giữa title, nuốt mất keyword ở đuôi. Nay: title ngắn thì thêm
            // hậu tố thương hiệu, title đã dài thì để nguyên vẹn, không hậu tố.
            const BRAND = " — Trạm Dừng Chill Đà Lạt";
            // seoTitle: ban rut gon RIENG cho the <title> (Google cat o ~60 ky tu).
            // H1 / og:title / schema headline van dung article.title day du — title
            // dai khong bi phat, chi bi cat khi hien thi, nen giu ban dai cho nguoi
            // doc va AI, chi thay ban ngan o cho bi cat.
            const titleTag = htmlEncode(
                article.seoTitle
                    ? article.seoTitle
                    : article.title.length + BRAND.length <= 65
                      ? article.title + BRAND
                      : article.title
            );
            const imageAltEncoded = htmlEncode(article.imageAlt || article.title);
            const keywords = article.title.toLowerCase() + ", đà lạt, quán nướng, bbq";
            const dateVI = formatDateVI(article.date);
            const readTime = readingTime(article.body || "");
            // Hiển thị "Cập nhật {ngày}" khi bài có dateModified thật khác ngày đăng (freshness E-E-A-T).
            const updatedHtml = (article._dateModified && article._dateModified !== article.date)
                ? ' · <span class="blog-updated">' + ui(article).updated + ' ' + formatDateVI(article._dateModified) + '</span>'
                : '';
            const bodyFixed = themMucLuc(
                fixAssetPaths((article.body || "") + faqHtml(article)),
                ui(article)
            );

            const image400w = article.image.replace(/\.(jpg|webp)$/i, '-400w.webp');
            const image800w = article.image.replace(/\.(jpg|webp)$/i, '-800w.webp');

            const chiaSe = anhChiaSe(article.image);
            const ogImage = chiaSe.og || article.image;
            const ogKichThuoc = chiaSe.ogKichThuoc
                ? '\n    <meta property="og:image:width" content="' + chiaSe.ogKichThuoc.w + '">\n    <meta property="og:image:height" content="' + chiaSe.ogKichThuoc.h + '">'
                : "";

            let html = template
                .replace(/{{TITLE_TAG}}/g, titleTag)
                .replace(/{{TITLE_SHORT}}/g, titleShort)
                .replace(/{{TITLE}}/g, titleEncoded)
                .replace(/{{ID}}/g, article.id)
                .replace(/{{DATE_VI}}/g, dateVI)
                .replace(/{{UPDATED}}/g, updatedHtml)
                .replace(/{{DATE}}/g, article.date)
                .replace(/{{CATEGORY}}/g, article.category)
                .replace(/{{IMAGE_ALT}}/g, imageAltEncoded)
                .replace(/{{IMAGE_400W}}/g, image400w)
                .replace(/{{IMAGE_800W}}/g, image800w)
                .replace(/{{OG_IMAGE_KICH_THUOC}}/g, ogKichThuoc)
                .replace(/{{OG_IMAGE}}/g, ogImage)
                .replace(/{{IMAGE}}/g, article.image)
                .replace(/{{META_DESCRIPTION}}/g, metaDesc)
                .replace(/{{KEYWORDS}}/g, keywords)
                .replace(/{{EXCERPT_CLEAN}}/g, excerptClean)
                .replace(/{{BODY}}/g, bodyFixed)
                .replace(/{{JSON_LD_BLOGPOSTING}}/g, blogPostingSchema(article, excerptClean))
                .replace(/{{JSON_LD_BREADCRUMB}}/g, breadcrumbSchema(article))
                .replace(/{{JSON_LD_FAQ}}/g, faqSchemaBlock(article))
                .replace(/{{ROBOTS}}/g, article._indexable === false ? "noindex, follow" : "index, follow")
                .replace(/{{CANONICAL_HREF}}/g, article._canonical)
                // Bài tiếng Anh phải khai lang="en": <html lang> nằm trong accessibility
                // tree (screen reader chọn giọng đọc theo nó) và là tín hiệu ngôn ngữ
                // Google đọc. Trước đây hardcode "vi" nên 2 bài EN tự mâu thuẫn với
                // chính hreflang="en" và schema inLanguage="en" của mình.
                .replace(/{{T_HOME}}/g, ui(article).home)
                .replace(/{{T_MENU}}/g, ui(article).menu)
                .replace(/{{T_BLOG}}/g, ui(article).blog)
                .replace(/{{T_BOOK}}/g, ui(article).book)
                .replace(/{{T_READ}}/g, ui(article).read)
                .replace(/{{T_RELATED}}/g, ui(article).related)
                .replace(/{{T_CTA_TITLE}}/g, ui(article).ctaTitle)
                .replace(/{{T_CTA_SUB}}/g, ui(article).ctaSub)
                .replace(/{{T_CTA_BTN}}/g, ui(article).ctaBtn)
                .replace(/{{T_CTA_TRUST}}/g, ui(article).ctaTrust)
                .replace(/{{T_CTA_TRUST_ARIA}}/g, ui(article).ctaTrustAria)
                .replace(/{{CSS_VER}}/g, CSS_VER)
                .replace(/{{CSS_BAI_VER}}/g, CSS_BAI_VER)
                .replace(/{{JS_LAZY_VER}}/g, JS_LAZY_VER)
                .replace(/{{HTML_LANG}}/g, article._lang === "en" ? "en" : "vi")
                .replace(/{{OG_LOCALE}}/g, article._lang === "en" ? "en_US" : "vi_VN")
                .replace(/{{BYLINE}}/g, bylineHtml(article))
                .replace(/{{READING_TIME}}/g, String(readTime))
                .replace(/{{PREV_LINK}}/g, buildPrevLink(navMap[article.id], article))
                .replace(/{{NEXT_LINK}}/g, buildNextLink(navMap[article.id], article))
                .replace(/{{PREV_TITLE}}/g, navMap[article.id] && navMap[article.id].prev ? htmlEncode(navMap[article.id].prev.title) : "")
                .replace(/{{NEXT_TITLE}}/g, navMap[article.id] && navMap[article.id].next ? htmlEncode(navMap[article.id].next.title) : "")
                .replace(/{{RELATED_COUNT}}/g, String((KE_HOACH[article.id] || []).length))
                .replace(/{{RELATED_POSTS}}/g, buildRelatedPosts(article));

            // {{I18N:khoá}} — chữ dùng chung với website (footer). Thiếu khoá thì
            // dừng hẳn: để nguyên chuỗi {{I18N:…}} là in mã lỗi ra mặt khách.
            const dict = TRANS[article._lang === "en" ? "en" : "vi"] || {};
            html = html.replace(/{{I18N:([A-Za-z0-9._-]+)}}/g, function (m, key) {
                if (dict[key] === undefined) {
                    throw new Error("Thiếu khoá dịch '" + key + "' trong data/translations.js");
                }
                return dict[key];
            });

            // Vân tay phông cho thẻ preload trong template (14/09/2026, CLAUDE.md bug #27) —
            // toi-uu-tai-trang.js bỏ qua thư mục blog/ nên chỗ này tự gắn, cùng hàm dùng
            // chung để khớp đúng ?v= trong dist/style.min.css (lệch là tải phông hai lần).
            html = require("./van-tay").ganVanTayPhong(html, path.join(ROOT, "assets", "fonts"));

            const outPath = path.join(BLOG_DIR, article.id + ".html");
            fs.writeFileSync(outPath, html, "utf8");
            generated++;
        } catch (err) {
            console.error("Error generating " + article.id + ": " + err.message);
            errors++;
        }
    }

    console.log("Generated " + generated + " blog pages in blog/");
    // Lỗi ở một bài = file HTML CŨ của bài đó nằm nguyên trên đĩa. Trước 16/09/2026 chỗ
    // này chỉ in ra rồi build vẫn trả về 0, nên `git status` trông sạch ở đúng những bài
    // hỏng và bản cũ lên thẳng production. Dừng hẳn để không ai push nhầm.
    if (errors > 0) {
        throw new Error(errors + " bài lỗi khi dựng — file HTML cũ của chúng còn nguyên trên đĩa, ĐỪNG push. Xem log phía trên.");
    }

    // Trang tác giả: điền SAU khi dựng bài (dùng chung _indexable/_lang), TRƯỚC
    // chen-kich-thuoc-anh + toi-uu-tai-trang ở cuối để ảnh và vân tay được lo luôn.
    Object.keys(tacGia).forEach(function (slug) { dienTrangTacGia(tacGia[slug]); });

    // Regenerate sitemap.xml
    console.log("Regenerating sitemap.xml...");

    // Giữ nguyên lastmod đang có trong sitemap thay vì đóng dấu ngày hôm nay.
    // Đóng dấu vô điều kiện là "làm mới giả": trang không đổi một chữ nào mà vẫn
    // khai vừa cập nhật — Google nói rõ đừng làm. Chỗ quyết định ngày là
    // scripts/cap-nhat-lastmod.js, nó so nội dung thật rồi mới đổi ngày.
    const lastmodDangCo = {};
    try {
        const smCu = fs.readFileSync(SITEMAP, "utf8");
        (smCu.match(/<url>[\s\S]*?<\/url>/g) || []).forEach(function (b) {
            const loc = (b.match(/<loc>([^<]*)<\/loc>/) || ["", ""])[1];
            const lm = (b.match(/<lastmod>([^<]*)<\/lastmod>/) || ["", ""])[1];
            if (loc && lm) lastmodDangCo[loc.replace(SITE_URL, "")] = lm;
        });
    } catch (e) {
        // Chưa có sitemap (lần chạy đầu) thì dùng TODAY như cũ.
    }

    const staticPages = [
        { loc: "/", lastmod: TODAY, changefreq: "weekly", priority: "1.0" },
        { loc: "/blog.html", lastmod: TODAY, changefreq: "daily", priority: "0.9" },
        { loc: "/menu.html", lastmod: TODAY, changefreq: "weekly", priority: "0.8" },
        { loc: "/dip/san-tau-da-lat.html", lastmod: TODAY, changefreq: "monthly", priority: "0.8" },
        { loc: "/dip/cau-hon-hen-ho.html", lastmod: TODAY, changefreq: "monthly", priority: "0.8" },
        { loc: "/dip/sinh-nhat.html", lastmod: TODAY, changefreq: "monthly", priority: "0.8" },
        { loc: "/dip/team-building.html", lastmod: TODAY, changefreq: "monthly", priority: "0.8" },
        { loc: "/duong-di/", lastmod: TODAY, changefreq: "monthly", priority: "0.6" }
        // review-qr.html là noindex,nofollow (trang tiện ích QR) → KHÔNG đưa vào sitemap.
    ].concat(Object.keys(tacGia).sort().map(function (slug) {
        // Trang tác giả index được → phải có trong sitemap (R12 canh cả hai chiều)
        return { loc: "/tac-gia/" + slug + ".html", lastmod: TODAY, changefreq: "monthly", priority: "0.5" };
    })).map(function (p) {
        return Object.assign({}, p, { lastmod: lastmodDangCo[p.loc] || p.lastmod });
    });

    // Chỉ xuất sitemap bài đã tới ngày (date<=hôm nay) VÀ còn index (loại future + noindex)
    const publishedArticles = articles.filter(a => a.date <= TODAY && a._indexable !== false);

    // hreflang CHỈ khai ở đây (13/09/2026) — không khai trong HTML nữa. Google coi
    // HTML / HTTP header / sitemap là tương đương, dùng nhiều cách không lợi gì mà
    // dễ lệch: trước hôm nay dòng dưới ghi cứng "vi" cho cả 2 bài tiếng Anh trong khi
    // HTML của chính chúng khai "en". Sitemap phủ đủ mọi trang index và tự loại bài
    // noindex nên là nguồn gọn nhất. Mã phải khớp <html lang> của trang (R13d canh).
    // Chưa trang nào có bản dịch ở URL khác, nên mỗi cụm chỉ gồm chính nó + x-default;
    // khi có bản dịch thật thì thêm link chéo HAI CHIỀU tại đây.
    function sitemapUrl(loc, lastmod, changefreq, priority, lang) {
        const fullUrl = SITE_URL + loc;
        var lines = [
            "  <url>",
            "    <loc>" + fullUrl + "</loc>",
            "    <lastmod>" + lastmod + "</lastmod>",
            "    <changefreq>" + changefreq + "</changefreq>",
            "    <priority>" + priority + "</priority>",
            '    <xhtml:link rel="alternate" hreflang="' + (lang || "vi") + '" href="' + fullUrl + '"/>',
            '    <xhtml:link rel="alternate" hreflang="x-default" href="' + fullUrl + '"/>',
            "  </url>"
        ];
        return lines.join("\n");
    }

    var sitemapLines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">'
    ];

    for (const page of staticPages) {
        sitemapLines.push(sitemapUrl(page.loc, page.lastmod, page.changefreq, page.priority));
    }

    for (const article of publishedArticles) {
        sitemapLines.push(sitemapUrl("/blog/" + article.id + ".html", article._dateModified || article.date, "monthly", article._pillar ? "0.8" : "0.7",
            article._lang === "en" ? "en" : "vi"));
    }

    sitemapLines.push("</urlset>");
    var sitemap = sitemapLines.join("\n") + "\n";

    fs.writeFileSync(SITEMAP, sitemap, "utf8");
    console.log("Sitemap updated: " + staticPages.length + " static pages + " + publishedArticles.length + " published blog posts");

    // Regenerate blog-data-light.js — CHỈ bài còn index (trang blog index không liệt kê bài đã noindex)
    var LIGHT_FILE = path.join(ROOT, "data", "blog-data-light.js");
    var lightArr = articles
        .filter(function (a) { return a._indexable !== false; })
        .sort(function (a, b) { return b.date.localeCompare(a.date); })
        .map(function (a) {
            return {
                id: a.id,
                title: a.title,
                category: a.category,
                date: a.date,
                image: a.image,
                imageAlt: a.imageAlt || a.title,
                badge: a.badge || "",
                featured: !!a.featured,
                excerpt: a.excerpt || "",
                tags: a.tags || []
            };
        });
    var lightOut = "/* Blog listing data (lightweight — no body). Auto-sinh bởi generate-blog-pages.js — KHÔNG sửa tay. */\n" +
        "const BLOG_ARTICLES = " + JSON.stringify(lightArr, null, 2) + ";\n";
    fs.writeFileSync(LIGHT_FILE, lightOut, "utf8");
    console.log("blog-data-light.js updated: " + lightArr.length + " bài hiển thị trên trang blog");

    // Sinh luôn danh sách link tĩnh trong blog.html — đây mới là bản DUY NHẤT
    // mà bot AI đọc được (blog.html vẽ danh sách bằng JS, bot không chạy JS).
    //
    // Vì sao gọi thẳng ở đây thay vì dặn "nhớ chạy sau": header của
    // generate-blog-links.js đã dặn đúng câu đó từ đầu, mà thực tế vẫn trôi —
    // khối tĩnh đứng yên ở 13 bài trong khi nguồn lên 19. Lời dặn không có ai
    // thi hành thì sớm muộn cũng lệch. Nay hai máy dính liền, không lệch được nữa.
    require("child_process").execFileSync(
        process.execPath,
        [path.join(__dirname, "generate-blog-links.js")],
        { stdio: "inherit" }
    );

    // Chen width/height that vao moi <img> vua sinh. Phai chay O DAY chu khong
    // chi trong bundle-js.js: 141 trang blog duoc dung SAU khi bundle-js chay
    // xong, nen neu chi moc mot ben thi bai moi sinh ra van thieu kich thuoc.
    // Goi thang giong generate-blog-links.js ben tren — loi dan "nho chay sau"
    // da tung troi mot lan roi.
    require("./chen-kich-thuoc-anh").chay();

    // Vân tay lại + đồng bộ sw.js. Cũng vì lý do trên: script này VỪA ghi đè
    // data/blog-data-light.js (khối 18 bài hiển thị) và blog.html, mà blog.html
    // nạp file đó kèm ?v=<md5> do bundle-js.js gắn TRƯỚC ĐÓ. Thêm một bài blog
    // là mã băm cũ trỏ vào nội dung mới — trình duyệt giữ nguyên bản cache, danh
    // sách bài trên trang blog đứng im. Đúng kiểu lỗi khối tĩnh 13/19 bài kể trên,
    // chỉ khác là lần này nằm ở lớp cache nên nhìn file trong repo không thấy gì sai.
    require("child_process").execFileSync(
        process.execPath,
        [path.join(__dirname, "toi-uu-tai-trang.js")],
        { stdio: "inherit" }
    );
    require("./cap-nhat-sw").chay();

    console.log("Done!");

} catch (err) {
    console.error("Fatal error:", err.message);
    process.exit(1);
}
