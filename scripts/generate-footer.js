/***
 * generate-footer.js
 * MỘT nguồn duy nhất cho footer của toàn site.
 *
 * Trước đây website có 5 footer khác nhau viết ở 5 chỗ: components/footer.html
 * (trang chủ), components/footer-simple.html (menu/blog/đường đi), footer cứng
 * trong templates/blog-post.html (141 bài), .dip-footer trong 4 trang dịp, và
 * .error-footer trong 404.html. Hệ quả thật, không phải chuyện thẩm mỹ:
 *   - 141 bài blog — nhóm trang hút tìm kiếm nhiều nhất — chỉ trỏ ra 3 link,
 *     không hề liên kết tới 4 trang dịp và trang đường đi. Đó là các trang có
 *     ý định đặt bàn cao nhất mà lại không nhận được liên kết nội bộ nào từ blog.
 *   - NAP (tên - địa chỉ - điện thoại) mỗi trang một kiểu, trong khi local SEO
 *     đối chiếu chuỗi này giữa các trang với Google Business Profile.
 *   - Khách đọc hết bài blog rồi không có đường đi tiếp: không số gọi, không Zalo.
 *
 * Cách chạy:  node scripts/generate-footer.js
 * (bundle-js.js gọi sẵn ở cuối, nên `node scripts/bundle-js.js` cũng cập nhật)
 *
 * Chữ lấy từ data/translations.js, thông tin quán lấy từ data/site-config.js —
 * sửa footer thì sửa 2 file đó rồi chạy lại script, đừng sửa HTML đã sinh.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const START = "<!-- FOOTER:START — sinh bởi scripts/generate-footer.js, ĐỪNG sửa tay -->";
const END = "<!-- FOOTER:END -->";

// ── Nạp dữ liệu nguồn ────────────────────────────────────────
// Cả hai file đều là script trình duyệt (không module.exports), nên chạy trong
// vm rồi tự gán biến ra sandbox — giống cách generate-blog-pages.js đọc blog-data.
function loadGlobal(relFile, varName) {
    const src = fs.readFileSync(path.join(ROOT, relFile), "utf8");
    const sandbox = {};
    vm.runInNewContext(src + "\n;this." + varName + " = " + varName + ";", sandbox);
    if (!sandbox[varName]) throw new Error("Không đọc được " + varName + " từ " + relFile);
    return sandbox[varName];
}

const CFG = loadGlobal("data/site-config.js", "SITE_CONFIG");
const T = loadGlobal("data/translations.js", "TRANSLATIONS");

// ── Ba "khẩu vị" footer ──────────────────────────────────────
// mode "i18n"     → giữ data-i18n, chữ mặc định tiếng Việt. CHỈ dùng cho trang
//                   có nút EN/VI (trang nạp components/nav.html).
// mode "vi"       → chữ tiếng Việt cố định, không data-i18n. Dùng cho trang dịp
//                   và 404: chúng có nạp js/i18n.js nhưng KHÔNG có nút đổi ngôn
//                   ngữ, nên khách từng chọn EN ở trang chủ sẽ thấy footer tiếng
//                   Anh dán dưới một trang toàn tiếng Việt.
// mode "template" → nhả ra {{I18N:key}} để generate-blog-pages.js thay bằng chữ
//                   đúng ngôn ngữ CỦA BÀI. Bài blog không nạp i18n.js nên chữ
//                   phải cố định lúc sinh trang, nếu không 2 bài tiếng Anh sẽ
//                   hiện footer tiếng Việt.
function txt(key, mode) {
    if (mode === "template") return "{{I18N:" + key + "}}";
    const v = T.vi[key];
    if (v === undefined) throw new Error("Thiếu khoá dịch: " + key);
    return v;
}

function i18nAttr(key, mode) {
    return mode === "i18n" ? ' data-i18n="' + key + '"' : "";
}

// Link nội bộ: thêm tiền tố thư mục, và với trang dùng layout-loader thì giữ
// data-home-href để loader đổi về neo (#booking) khi đang đứng ở trang chủ.
function navItem(href, key, opts) {
    const homeHash = (opts.mode === "i18n" && opts.homeHash) ?
        ' data-home-href="' + opts.homeHash + '"' : "";
    return '                    <li><a href="' + opts.prefix + href + '"' + homeHash +
        i18nAttr(key, opts.mode) + ">" + txt(key, opts.mode) + "</a></li>";
}

const SVG = {
    facebook: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
    tiktok: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.33-6.33V9.19a8.16 8.16 0 0 0 4.29 1.2V6.69z"/></svg>',
    maps: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'
};

function buildFooter(opts) {
    const mode = opts.mode;
    const prefix = opts.prefix;
    const zaloUrl = "https://zalo.me/" + (CFG.contact.zaloNumber || CFG.contact.phone);

    return [
        '<footer class="footer">',
        '    <div class="container">',
        '        <div class="footer-top">',
        '            <div class="footer-brand">',
        '                <h3 class="footer-logo">' + CFG.name + "</h3>",
        '                <p' + i18nAttr("footer.desc", mode) + ">" + txt("footer.desc", mode) + "</p>",
        '                <div class="footer-social">',
        '                    <a href="' + CFG.social.facebook + '" target="_blank" rel="noopener" aria-label="Facebook" title="Facebook">' + SVG.facebook + "</a>",
        '                    <a href="' + CFG.social.tiktok + '" target="_blank" rel="noopener" aria-label="TikTok" title="TikTok">' + SVG.tiktok + "</a>",
        '                    <a href="' + CFG.social.googleMaps + '" target="_blank" rel="noopener" aria-label="Google Maps" title="Google Maps">' + SVG.maps + "</a>",
        "                </div>",
        "            </div>",
        '            <div class="footer-nav">',
        "                <h4" + i18nAttr("footer.link.title", mode) + ">" + txt("footer.link.title", mode) + "</h4>",
        "                <ul>",
        navItem("index.html", "nav.home", { prefix: prefix, mode: mode, homeHash: "#home" }),
        navItem("index.html#experience", "nav.experience", { prefix: prefix, mode: mode, homeHash: "#experience" }),
        navItem("menu.html", "nav.menu", { prefix: prefix, mode: mode }),
        navItem("index.html#gallery", "nav.gallery", { prefix: prefix, mode: mode, homeHash: "#gallery" }),
        navItem("blog.html", "nav.blog", { prefix: prefix, mode: mode }),
        navItem("index.html#booking", "nav.booking", { prefix: prefix, mode: mode, homeHash: "#booking" }),
        "                </ul>",
        "            </div>",
        '            <div class="footer-nav">',
        "                <h4" + i18nAttr("footer.occasion.title", mode) + ">" + txt("footer.occasion.title", mode) + "</h4>",
        "                <ul>",
        navItem("dip/san-tau-da-lat.html", "footer.occasion.train", { prefix: prefix, mode: mode }),
        navItem("dip/sinh-nhat.html", "footer.occasion.birthday", { prefix: prefix, mode: mode }),
        navItem("dip/cau-hon-hen-ho.html", "footer.occasion.date", { prefix: prefix, mode: mode }),
        navItem("dip/team-building.html", "footer.occasion.team", { prefix: prefix, mode: mode }),
        navItem("duong-di/", "footer.occasion.directions", { prefix: prefix, mode: mode }),
        "                </ul>",
        "            </div>",
        '            <div class="footer-contact">',
        "                <h4" + i18nAttr("footer.contact.title", mode) + ">" + txt("footer.contact.title", mode) + "</h4>",
        "                <ul>",
        '                    <li><a href="tel:' + CFG.contact.phone + '">' + CFG.contact.phoneDisplay + "</a></li>",
        '                    <li><a href="' + zaloUrl + '" target="_blank" rel="noopener">Zalo ' + CFG.contact.phoneDisplay + "</a></li>",
        "                    <li" + i18nAttr("footer.hours.value", mode) + ">" + txt("footer.hours.value", mode) + "</li>",
        '                    <li><a href="' + CFG.social.googleMaps + '" target="_blank" rel="noopener"' + i18nAttr("footer.address", mode) + ">" + txt("footer.address", mode) + "</a></li>",
        "                </ul>",
        "            </div>",
        "        </div>",
        '        <div class="footer-bottom">',
        "            <p" + i18nAttr("footer.copyright", mode) + ">" + txt("footer.copyright", mode) + "</p>",
        "        </div>",
        "    </div>",
        "</footer>"
    ].join("\n");
}

// ── Đích ghi ─────────────────────────────────────────────────
// whole:true  → cả file CHỈ chứa footer (component để layout-loader fetch).
// còn lại     → thay phần giữa FOOTER:START/END. Lần chạy đầu chưa có mốc thì
//               nuốt trọn thẻ <footer>…</footer> cũ và đặt mốc vào chỗ đó.
const targets = [
    { file: "components/footer.html", prefix: "", mode: "i18n", whole: true },
    // Bản rút gọn cũ. Không code nào gọi nữa, NHƯNG service worker phục vụ
    // dist/common.min.js theo kiểu cache-first, nên máy khách vào từ trước vẫn
    // chạy bản JS cũ và vẫn fetch đúng tên file này ở lần ghé kế tiếp. Ghi đè
    // bằng footer đầy đủ để họ không rơi vào chân trang trống. Xoá được sau
    // vài tuần, khi cache cũ đã hết vòng đời.
    { file: "components/footer-simple.html", prefix: "", mode: "i18n", whole: true },
    { file: "templates/blog-post.html", prefix: "../", mode: "template" },
    { file: "404.html", prefix: "", mode: "vi" }
];

for (const name of fs.readdirSync(path.join(ROOT, "dip"))) {
    if (name.endsWith(".html")) {
        targets.push({ file: "dip/" + name, prefix: "../", mode: "vi" });
    }
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
const BLOCK_RE = new RegExp(escapeRe(START) + "[\\s\\S]*?" + escapeRe(END));

let written = 0;
for (const t of targets) {
    const abs = path.join(ROOT, t.file);
    const footer = buildFooter(t);
    const before = fs.readFileSync(abs, "utf8");
    let after;

    if (t.whole) {
        after = "<!-- Footer dùng chung — sinh bởi scripts/generate-footer.js, ĐỪNG sửa tay -->\n" + footer + "\n";
    } else {
        const block = START + "\n    " + footer.replace(/\n/g, "\n    ") + "\n    " + END;
        if (BLOCK_RE.test(before)) {
            after = before.replace(BLOCK_RE, block);
        } else if (/<footer[\s\S]*?<\/footer>/.test(before)) {
            after = before.replace(/<footer[\s\S]*?<\/footer>/, block);
        } else {
            console.error("  ✗ " + t.file + " — không thấy mốc FOOTER:START lẫn thẻ <footer>, bỏ qua");
            continue;
        }
    }

    if (after !== before) {
        fs.writeFileSync(abs, after, "utf8");
        written++;
        console.log("  ✓ " + t.file);
    } else {
        console.log("  = " + t.file + " (không đổi)");
    }
}

console.log("\nFooter đồng bộ: " + written + "/" + targets.length + " file được ghi.");
console.log("Bài blog lấy footer từ templates/blog-post.html — nhớ chạy:");
console.log("  node scripts/generate-blog-pages.js");
