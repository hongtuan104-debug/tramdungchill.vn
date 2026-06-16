/***
 * generate-menu.js
 * Sinh JSON-LD "Menu" (MenuItem + gia) VA danh sach mon tinh (noscript) vao menu.html
 * tu data/menu-data.js + data/schema-data.js.
 *
 * MUC DICH (AEO): AI crawler (GPTBot/ClaudeBot/PerplexityBot) thuong KHONG chay JS,
 * nen mon + gia phai nam san trong HTML tho. Truoc day menu chi render bang JS -> AI khong thay.
 *
 * NGUON DUY NHAT = data/menu-data.js. Sua gia/mon o do roi chay `node scripts/bundle-js.js`
 * (script nay duoc goi tu dong trong bundle-js.js).
 *
 * menu.html phai co san cac marker (script ghi de phan GIUA marker):
 *   <!-- MENU_JSONLD:START --> ... <!-- MENU_JSONLD:END -->
 *   <!-- MENU_STATIC:START --> ... <!-- MENU_STATIC:END -->
 *
 * Zero npm deps — chi dung Node built-ins (fs, path, vm).
 */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const MENU_DATA = path.join(ROOT, "data", "menu-data.js");
const SCHEMA_DATA_FILE = path.join(ROOT, "data", "schema-data.js");
const MENU_HTML = path.join(ROOT, "menu.html");
const SITE_URL = "https://tramdungchill.vn";

// ── Doc du lieu tu cac file data (sandbox vm) ────────────────
function loadData() {
    const sandbox = {};
    const menuSrc = fs.readFileSync(MENU_DATA, "utf8");
    const schemaSrc = fs.readFileSync(SCHEMA_DATA_FILE, "utf8");
    // Noi 2 file roi gan ra `this` de lay cac const block-scoped (giong cach generate-blog-pages.js lam)
    vm.runInNewContext(
        menuSrc + "\n" + schemaSrc +
        "\n;this.MENU_CATEGORIES=MENU_CATEGORIES;" +
        "this.MENU_ITEMS=MENU_ITEMS;" +
        "this.MENU_NOTES=(typeof MENU_NOTES!=='undefined')?MENU_NOTES:{};" +
        "this.SCHEMA_DATA=SCHEMA_DATA;",
        sandbox
    );
    return sandbox;
}

// '137K' -> 137000 ; '2K' -> 2000 ; '120' -> 120
function priceToVnd(price) {
    const digits = parseInt(String(price).replace(/[^\d]/g, ""), 10);
    if (!digits) return null;
    return /k$/i.test(String(price)) ? digits * 1000 : digits;
}

// 137000 -> '137.000đ'
function priceDisplay(price) {
    const v = priceToVnd(price);
    if (v === null) return String(price);
    return v.toLocaleString("vi-VN") + "đ";
}

function buildMenuJsonLd(d) {
    const r = d.SCHEMA_DATA.restaurant;
    const sections = d.MENU_CATEGORIES.map(function (cat) {
        const items = (d.MENU_ITEMS[cat.id] || []).map(function (item) {
            const mi = { "@type": "MenuItem", "name": item.name };
            const v = priceToVnd(item.price);
            if (v !== null) {
                mi.offers = {
                    "@type": "Offer",
                    "price": String(v),
                    "priceCurrency": "VND",
                    "availability": "https://schema.org/InStock"
                };
            }
            return mi;
        });
        return { "@type": "MenuSection", "name": cat.label, "hasMenuItem": items };
    });

    // mainEntity chi tham chieu @id + thong tin co ban (KHONG lap aggregateRating
    // -> tranh trung/lech so review voi index.html, von la nguon chuan cua rating).
    return {
        "@context": "https://schema.org",
        "@type": "Menu",
        "@id": SITE_URL + "/menu.html#menu",
        "name": "Thực Đơn " + r.name,
        "description": "Thực đơn quán nướng BBQ Đà Lạt — nướng tại bàn, lẩu, hải sản, đồ uống. ~100 món, giá đã gồm VAT.",
        "url": SITE_URL + "/menu.html",
        "inLanguage": "vi",
        "mainEntity": {
            "@type": "Restaurant",
            "@id": SITE_URL + "/#restaurant",
            "name": r.name,
            "url": r.url,
            "telephone": r.telephone,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": r.address.street,
                "addressLocality": r.address.locality,
                "addressRegion": r.address.region,
                "postalCode": r.address.postalCode,
                "addressCountry": r.address.country
            },
            "servesCuisine": r.cuisine,
            "priceRange": r.priceRange,
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": r.hours.open,
                "closes": r.hours.close
            }
        },
        "hasMenuSection": sections
    };
}

function buildStaticHtml(d) {
    const out = [
        "<noscript>",
        '<div class="menu-static-fallback">',
        "<h2>Thực đơn Tiệm Nướng Trạm Dừng Chill — Đà Lạt</h2>"
    ];
    d.MENU_CATEGORIES.forEach(function (cat) {
        const items = d.MENU_ITEMS[cat.id] || [];
        if (!items.length) return;
        out.push("<h3>" + cat.label + "</h3>");
        out.push("<ul>");
        items.forEach(function (item) {
            out.push("<li>" + item.name + " — " + priceDisplay(item.price) + "</li>");
        });
        out.push("</ul>");
    });
    if (d.MENU_NOTES && d.MENU_NOTES.general) {
        out.push("<p>" + d.MENU_NOTES.general + "</p>");
    }
    out.push("</div>", "</noscript>");
    return out.join("\n");
}

function replaceBetween(html, startMarker, endMarker, content) {
    const s = html.indexOf(startMarker);
    const e = html.indexOf(endMarker);
    if (s === -1 || e === -1 || e < s) return null;
    return html.slice(0, s + startMarker.length) + "\n" + content + "\n        " + html.slice(e);
}

function generateMenu() {
    const d = loadData();
    let html = fs.readFileSync(MENU_HTML, "utf8");

    const jsonld =
        '    <script type="application/ld+json">\n' +
        JSON.stringify(buildMenuJsonLd(d), null, 4) +
        "\n    </" + "script>";
    const staticHtml = buildStaticHtml(d);

    let next = replaceBetween(html, "<!-- MENU_JSONLD:START -->", "<!-- MENU_JSONLD:END -->", jsonld);
    if (next === null) {
        console.error("  generate-menu: KHONG tim thay marker MENU_JSONLD trong menu.html -> bo qua");
        return;
    }
    html = next;

    next = replaceBetween(html, "<!-- MENU_STATIC:START -->", "<!-- MENU_STATIC:END -->", staticHtml);
    if (next === null) {
        console.error("  generate-menu: KHONG tim thay marker MENU_STATIC trong menu.html -> bo qua");
        return;
    }
    html = next;

    fs.writeFileSync(MENU_HTML, html, "utf8");

    let count = 0;
    d.MENU_CATEGORIES.forEach(function (c) { count += (d.MENU_ITEMS[c.id] || []).length; });
    console.log("  generate-menu: cap nhat menu.html (" + d.MENU_CATEGORIES.length + " nhom, " + count + " mon) — JSON-LD + noscript");
}

module.exports = { generateMenu };

if (require.main === module) {
    try {
        generateMenu();
    } catch (e) {
        console.error("generate-menu fatal:", e.message);
        process.exit(1);
    }
}
