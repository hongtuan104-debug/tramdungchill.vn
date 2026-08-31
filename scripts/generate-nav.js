/***
 * generate-nav.js
 * Nướng components/nav.html THẲNG vào 4 trang còn nạp nav lúc chạy.
 *
 * VÌ SAO: trước 31/08/2026, index/menu/blog/đường-đi chỉ có <div id="nav-placeholder">
 * rỗng; thanh nav do components/layout-loader.js fetch về rồi chèn vào. Chuỗi sự
 * kiện trên 4G chậm là: tải dist/common.min.js → DOMContentLoaded →
 * await fetch('components/nav.html') → chèn DOM. Hai vòng khứ hồi (nav rồi footer,
 * lại còn NỐI TIẾP nhau) nằm thẳng trên đường tới LCP.
 * PageSpeed 31/08/2026 đo được: phần tử LCP chính là <span class="logo-main">
 * ("Trạm Dừng Chill" trên nav) với render delay 2.500ms.
 * Critical CSS vốn đã có sẵn style .navbar/.logo-main, nên nav tĩnh hiện được
 * ngay khung hình đầu.
 *
 * Bài blog và 4 trang dịp đã có nav tĩnh từ trước — script này chỉ lo 4 trang còn lại.
 *
 * Cách chạy:  node scripts/generate-nav.js
 * (bundle-js.js gọi sẵn, nên `node scripts/bundle-js.js` cũng cập nhật)
 *
 * Sửa nav thì sửa components/nav.html rồi chạy lại, ĐỪNG sửa HTML đã sinh.
 *
 * Bốn phép biến đổi dưới đây phải khớp đúng những gì layout-loader.js làm lúc
 * chạy (hàm fixLinksIn + đoạn gắn active/scrolled). Đổi bên đó thì đổi cả bên này.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const START = "<!-- NAV:START — sinh bởi scripts/generate-nav.js, ĐỪNG sửa tay -->";
const END = "<!-- NAV:END -->";

const NAV_SRC = fs.readFileSync(path.join(ROOT, "components/nav.html"), "utf8")
    .replace(/^\s*<!--[^>]*-->\s*/, "")   // bỏ dòng chú thích đầu file
    .trim();

const targets = [
    { file: "index.html",          page: "index",    prefix: "" },
    { file: "menu.html",           page: "menu",     prefix: "" },
    { file: "blog.html",           page: "blog",     prefix: "" },
    { file: "duong-di/index.html", page: "duong-di", prefix: "../" }
];

/* Giữ nguyên thứ tự của fixLinksIn: data-home-href TRƯỚC, rồi mới thêm ../ */
function buildNav(t) {
    let html = NAV_SRC;

    // 1) Trang chủ: link tới mục trên chính trang này phải là neo, không phải
    //    index.html#… (bấm vào là tải lại cả trang).
    if (t.page === "index") {
        html = html.replace(/<a\b[^>]*>/g, function (tag) {
            const m = tag.match(/data-home-href="([^"]*)"/);
            if (!m) return tag;
            return tag.replace(/href="[^"]*"/, 'href="' + m[1] + '"');
        });
    }

    // 2) Trang trong thư mục con: link tương đối lùi một cấp.
    if (t.prefix) {
        html = html.replace(/href="([^"]*)"/g, function (all, href) {
            if (!href || /^(https?:|#|\.\.\/|\/|tel:|mailto:)/.test(href)) return all;
            return 'href="' + t.prefix + href + '"';
        });
    }

    // 3) Link đang đứng thì tô đậm.
    const activePage = t.page;
    let daActive = 0;
    html = html.replace(/<a\b[^>]*>/g, function (tag) {
        if (tag.indexOf('data-page="' + activePage + '"') === -1) return tag;
        daActive++;
        return tag.replace(/class="([^"]*)"/, 'class="$1 active"');
    });

    // 4) Trang con: navbar luôn ở trạng thái đặc (không trong suốt như trang chủ).
    if (t.page !== "index") {
        const truoc = html;
        html = html.replace('class="navbar"', 'class="navbar scrolled"');
        if (html === truoc) throw new Error('Không thấy class="navbar" để gắn scrolled');
    }

    return { html: html, daActive: daActive };
}

/* Khong dung regex o day: moc START/END la chuoi co dinh nen indexOf vua du,
   lai khoi phai escape ky tu dac biet. */
const PLACEHOLDER = '<div id="nav-placeholder"></div>';

function thayKhoi(before, block) {
    const i = before.indexOf(START);
    if (i !== -1) {
        const j = before.indexOf(END, i);
        if (j === -1) return null;              // co START ma mat END -> bo qua cho an toan
        return before.slice(0, i) + block + before.slice(j + END.length);
    }
    if (before.indexOf(PLACEHOLDER) !== -1) return before.replace(PLACEHOLDER, block);
    return null;
}

let written = 0;
for (const t of targets) {
    const abs = path.join(ROOT, t.file);
    const { html, daActive } = buildNav(t);
    const before = fs.readFileSync(abs, "utf8");

    const block = START + "\n    " + html.replace(/\n/g, "\n    ") + "\n    " + END;

    const after = thayKhoi(before, block);
    if (after === null) {
        console.error("  ✗ " + t.file + " — không thấy mốc NAV:START lẫn #nav-placeholder, bỏ qua");
        continue;
    }

    if (after !== before) {
        fs.writeFileSync(abs, after, "utf8");
        written++;
        console.log("  ✓ " + t.file + "  (link active: " + daActive + ")");
    } else {
        console.log("  = " + t.file + " (không đổi)");
    }
}

console.log("\nNav đồng bộ: " + written + "/" + targets.length + " file được ghi.");
