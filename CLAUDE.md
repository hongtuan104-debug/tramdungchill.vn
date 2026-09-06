# WEBSITE TRAMDUNGCHILL.VN — Source Code Project

> Đây là **source code chính thức** của website https://tramdungchill.vn
> Khi sếp Tuấn nói "tiếp tục website" / "mở website" / "sửa website" → đây là folder cần làm việc.

## Quy tắc giao tiếp
- Gọi chủ doanh nghiệp là **"sếp Tuấn"**, tự xưng **"em Claude"**
- Luôn giao tiếp bằng **tiếng Việt** (code và thuật ngữ kỹ thuật có thể giữ tiếng Anh)
- Ngắn gọn, thực tế, đi thẳng vào vấn đề
- Khi sửa code → giải thích "tại sao" trước khi nói "làm gì"

## Thông tin sếp Tuấn (chủ website)
- **Họ tên:** Nguyễn Hồng Tuấn (sinh 1993)
- **Email:** hongtuan104@gmail.com
- **Phong cách:** Bách Khoa, thận trọng theo số liệu, thích nghiên cứu cái mới
- **Mong muốn:** Tự động vận hành, tự do tài chính

## Thông tin doanh nghiệp
- **Tên:** Tiệm Nướng Trạm Dừng Chill (Đà Lạt)
- **Địa chỉ:** 111 Huỳnh Tấn Phát, Phường Xuân Trường - Đà Lạt, Lâm Đồng (P11 cũ — sáp nhập phường 2025)
- **SĐT:** 0989.765.070
- **Giờ mở cửa:** 15:00 - 23:00
- **USP chính:** Hoàng hôn 15h, nhà lồng đèn 18h30, bò tảng phô mai trứng muối
- **Giá:** 95k - 300k/người (đã VAT). GBP hiển thị bucket "100-300N đ" — đây là
  khoảng Google tự phân loại, không phải số chủ quán đặt, nên KHÔNG cần ép website khớp.
- **Menu:** 81 món trong `data/menu-data.js` (44 món ăn + 37 đồ uống) → viết "hơn 70 món".
  Đồng bộ theo menu in 26 trang ngày 04/08/2026 — sếp Tuấn xác nhận **bản in là chuẩn**.
  Nếu quán thật có nhiều hơn, bổ sung vào menu-data.js rồi chạy generator, mọi chỗ tự khớp.
- **Đánh giá:** 4,8/5 sao · **7.060 lượt** (GBP, xác nhận 04/09/2026 — Google có tỉa bớt review, 24/08 từng thấy 7.123)
- ⚠️ **Nguồn chuẩn cho mọi con số:** `data/facts.json`. Đừng chép số từ bài cũ —
  kiểm bằng `node scripts/check-facts.js` và `node scripts/seo-geo-verify.js`.

## Stack & Build
- **Domain:** tramdungchill.vn (CNAME file → custom domain)
- **Hosting:** GitHub Pages
- **GitHub repo:** https://github.com/hongtuan104-debug/tramdungchill.vn (branch: `main`)
- **Build command:** `node scripts/bundle-js.js`
- **i18n:** EN/VI — `var TRANSLATIONS` (⚠️ PHẢI dùng `var`, KHÔNG dùng `const` vì const không tạo window property → language switcher hỏng)

## Cấu trúc folder
```
tiem-nuong-tram-dung-chill/
├── index.html              # Trang chủ
├── menu.html               # Menu
├── blog.html               # Blog index
├── 404.html                # Trang 404
├── review-qr.html          # QR review
├── CNAME                   # tramdungchill.vn
├── manifest.json + sw.js   # PWA
├── sitemap.xml + robots.txt
├── assets/                 # Ảnh, font
├── css/                    # Stylesheets
├── js/                     # JavaScript (booking.js, fab-contact.js...)
├── data/                   # JSON data
├── components/             # HTML components
├── templates/              # Templates
├── scripts/                # Build scripts (bundle-js.js, generate-blog-pages.js)
├── dist/                   # Output build
├── blog/                   # 142 blog posts
├── dip/                    # Landing pages dịp đặc biệt
├── plans/                  # Tài liệu kế hoạch
└── docs/                   # Documentation
```

## Tracking đã cài (cập nhật 2026-04-08)
- **Google Analytics 4:** `G-2VFBZDY6CD` (toàn site) + `G-5G3K0RN39C` (4 dip pages)
- **Google Ads:** `AW-18038463990` (chỉ index)
- **Meta Pixel:** `1281459450582041` ✅ TẤT CẢ 151 trang
  - Events: `PageView`, `ViewContent` (menu/dip/blog), `Lead` (form đặt bàn), `Contact` (click Phone/Zalo/FB)
  - **Conversions API (CAPI):** chưa cài, đợi đủ traffic

## Footer — sinh tự động, ĐỪNG sửa HTML tay
Footer nằm trong 8 file (component + template bài + 404 + 4 trang dịp), tất cả
do `scripts/generate-footer.js` sinh giữa mốc `<!-- FOOTER:START --> … <!-- FOOTER:END -->`.
- **Sửa chữ** → `data/translations.js` · **Sửa SĐT/địa chỉ/social** → `data/site-config.js`
- Rồi chạy `node scripts/bundle-js.js` (đã gọi sẵn generate-footer) + `node scripts/generate-blog-pages.js`
- Sửa tay từng file chính là cách cũ đã đẻ ra 5 footer lệch nhau (fix 30/07/2026)
- ⚠️ `css/footer.css` và `css/responsive.css` KHÔNG trang nào nạp — bản chạy thật
  nằm trong `css/style.css`, đó mới là file được bundle ra `dist/style.min.css`
- ⚠️ `css/variables.css` cũng là file chết — biến màu thật nằm trong `css/style.css`

## Nav — cũng sinh tự động, ĐỪNG sửa HTML tay
Trước 31/08/2026, index/menu/blog/đường-đi chỉ có `<div id="nav-placeholder">` rỗng;
thanh nav do `components/layout-loader.js` **fetch lúc chạy**. Trên 4G chậm chuỗi này
nằm thẳng trên đường tới LCP: tải `common.min.js` → DOMContentLoaded → fetch nav →
chèn DOM → **rồi mới** fetch footer (hai vòng khứ hồi NỐI TIẾP). PageSpeed 31/08/2026
chỉ đích danh phần tử LCP là `<span class="logo-main">` với render delay 2.500ms.
- Nay `scripts/generate-nav.js` nướng `components/nav.html` vào giữa mốc
  `<!-- NAV:START --> … <!-- NAV:END -->`; footer 4 trang này cũng đã thêm vào
  `generate-footer.js` (cờ `baked:true`). Bài blog + 4 trang dịp vốn đã có nav tĩnh.
- **Sửa nav** → sửa `components/nav.html` rồi chạy `node scripts/bundle-js.js`
- ⚠️ Generator phải làm ĐÚNG những gì `fixLinksIn()` trong layout-loader làm lúc chạy:
  trang chủ đổi link thành neo (`#booking`), thư mục con thêm `../`, gắn class
  `active` theo `data-page`, trang con thêm `scrolled` vào `.navbar`.
  **Đổi `fixLinksIn` thì đổi cả `generate-nav.js` và `bakeLinks()` trong generate-footer.js.**
- ⚠️ **ĐỪNG gỡ khối `<noscript>` nav** dù trông như trùng với nav tĩnh. Trên mobile
  `.nav-menu` bị `transform:translateX(100%)` đẩy ra ngoài màn hình, chỉ JS mới mở
  được — không có JS thì khách mobile mất sạch đường đi nếu bỏ khối đó.
- `layout-loader.js` giữ nguyên: nó tự bỏ qua khi không thấy placeholder.
- ⚠️ **Nav mobile của index.html nằm ở HAI nơi** (thêm 06/09/2026): `css/style.css`
  và khối `CRIT-NAV` trong critical CSS inline của chính `index.html`. Trước đó
  critical chỉ có nav bản desktop, nên khung hình đầu trên điện thoại vẽ menu ngang
  7 mục, không hamburger — đúng bản chất lỗi hero ở bug #8, chỉ khác là `.navbar`
  `position:fixed` nên cái nhảy nằm BÊN TRONG thanh nav chứ không đẩy cả trang.
  → **Sửa rule nav mobile trong style.css thì PHẢI sửa cả `CRIT-NAV`.** Critical
  cố ý lược `backdrop-filter`/`transition` (không ảnh hưởng bố cục), còn lại phải
  khớp từng khai báo — kiểm bằng cách bỏ comment rồi đối chiếu, hiện là 12/12.

## Menu ảnh dạng sách lật (flipbook) — cũng sinh tự động
Trang menu: hero → **quyển menu ảnh 26 trang lật được** → FAQ → khối đặt bàn.
Bảng giá text hiển thị đã bỏ ngày 04/08/2026 (sếp Tuấn: "menu cũ bỏ đi").
- Giá cho máy đọc giờ nằm ở 2 chỗ: **JSON-LD Menu** (81 món, sinh từ menu-data.js)
  và khối **`<noscript>` MENU_STATIC** — khối này khách có JS KHÔNG thấy, nó chỉ để
  GPTBot/ClaudeBot/PerplexityBot đọc được giá vì chúng không chạy JS và không đọc
  được chữ trong ảnh. **Đừng xoá nó vì "trang không hiển thị"** — đó là chủ đích.
- **Nguồn tên file + alt + thứ tự trang:** `data/menu-pages.js`
- **Đổi/thêm ảnh:** copy ảnh gốc vào `assets/menu-pages/_goc/` (đặt tên `1.jpg`…`26.jpg`,
  số quyết định thứ tự trang), rồi:
  `node scripts/tao-anh-menu.js` → `node scripts/bundle-js.js`
- Ảnh gốc **không commit** (đã gitignore) — chỉ bản WebP 560/1000/1600 + thumb 200 lên web
- HTML nằm giữa `<!-- MENU_FLIPBOOK:START --> … <!-- MENU_FLIPBOOK:END -->` trong menu.html,
  do `scripts/generate-menu-flipbook.js` ghi đè. **Sửa tay là mất ở lần build sau.**
- Chưa đủ 26 ảnh thì generator để trống vùng marker — cố tình, tránh 26 lỗi 404
- Tiếng lật trang tổng hợp bằng Web Audio API trong `js/menu-flipbook.js` (0 KB tải thêm),
  khách bật/tắt ở nút loa, lưu trong localStorage `tdc-menu-sound`
- ⚠️ Đổi `css/style.css` hay JS dùng chung → nhớ bump `CACHE_NAME` trong `sw.js`,
  không thì khách cũ vẫn chạy bản cache cũ
- **Thay ảnh menu thì KHÔNG cần bump `CACHE_NAME`**: URL ảnh mang vân tay `?v=<md5>`
  do generator gắn, đổi ảnh là URL đổi theo. Trước khi có vân tay (07/08/2026) thay
  ảnh xong khách vẫn thấy bản cũ — `/assets/menu-pages/` rơi vào nhánh cache-first
  của service worker, Ctrl+F5 cũng không phá được lớp đó.

## Thẻ resource hints + vân tay CSS — cũng sinh tự động
`scripts/toi-uu-tai-trang.js` (do `bundle-js.js` gọi) tự chèn `dns-prefetch` cho
3 domain pixel và gắn `?v=<md5>` vào link CSS của **mọi trang tĩnh**. Sửa tay
trong HTML sẽ bị build ghi đè ở lần chạy sau — 01/08/2026 đã dính: đổi tay
`preconnect` → `dns-prefetch`, build xong production có CẢ HAI.
→ Muốn đổi thì sửa trong `scripts/toi-uu-tai-trang.js`, đừng sửa HTML.

## Bug đã fix (đừng làm lại)
0. **Sửa chữ trong HTML mà quên `data/translations.js`** → chữ cũ hiện lại khi JS chạy.
   `applyTranslations()` ghi đè `innerHTML` của MỌI phần tử `[data-i18n]`, **kể cả khi
   đang ở tiếng Việt**. Nên HTML tĩnh sạch mà bản dịch bẩn thì khách vẫn đọc bản bẩn —
   FAQ index.html dọn 30/07/2026 vẫn khai "tôm sú, sò điệp, lẩu Thái" tới 04/08/2026.
   → Sửa chữ có `data-i18n` thì **luôn sửa cả 2 ngôn ngữ trong translations.js**.
   `seo-geo-verify.js` nay soi cả file này.
1. **Language switcher EN/VI hỏng** → Fix: đổi `const TRANSLATIONS` thành `var TRANSLATIONS`
2. **`scripts/generate-blog-pages.js`:** `const BLOG_ARTICLES` không expose vào vm sandbox → append `;this.BLOG_ARTICLES = BLOG_ARTICLES;` sau dataSource trước khi `runInNewContext`
3. **Telegram không nhận thông báo** → Token đúng: `AAGO55X` (chữ **O**, KHÔNG phải số 0)
4. **Zalo không nhận thông báo** → Dùng deployment Apps Script `AKfycbz46uJ...` (quyền "Bất kỳ ai"), KHÔNG dùng `AKfycbw3y1TpNm...` (cần đăng nhập)
5. **4 thẻ `preload` phông nằm TRONG `<noscript>`** → với mọi khách có JS chúng
   không chạy, tức preload chưa từng hoạt động dù nhìn HTML tưởng có. Phông chỉ
   được phát hiện sau khi `style.min.css` (tải async) về nên đổi phông xảy ra rất
   muộn → hero xô chỗ, CLS 0,269 suốt từ 31/07 tới 29/08/2026. Cái `<noscript>` đó
   vốn chỉ để bọc thẻ `<link rel=stylesheet>` dự phòng, thẻ preload bị dính vào sau.
   → Sửa 29/08/2026: đưa preload ra ngoài, và chỉ giữ Dancing Script (31 KB) —
   preload thêm Inter 58 KB sẽ giành băng thông với ảnh hero (phần tử LCP).

6. **Lớp `.preloader` che kín màn hình** → nó phủ `fixed;inset:0;z-index:9999`
   nền tối cho tới khi JS chạy xong VÀ ảnh poster tải xong. Hệ quả: FCP đếm đúng
   cái spinner chứ không phải nội dung, rồi màn hình đứng im → Speed Index 5,0 giây
   (PageSpeed 30/08/2026). Bỏ hẳn 30/08/2026 — `.hero` đã có nền gradient nâu
   trong critical CSS nên không hề chớp trắng.
7. **Đừng viết chuỗi `<body>` hay `<script>` trong chú thích HTML.**
   `scripts/seo-geo-verify.js` tách phần thân trang bằng `split(/<body[^>]*>/)`,
   nên một chữ `<body>` nằm trong comment ở `<head>` là nó cắt nhầm chỗ và báo
   thiếu cả 12 chủ đề fan-out. Dính đúng lỗi này ngày 30/08/2026.

8. **Critical CSS inline chỉ có bản DESKTOP của hero** → CLS 0,275 (30/08/2026).
   Trên khung 412px, khung hình đầu vẽ hero theo số đo desktop; tới khi
   `dist/style.min.css` (tải async) về thì override mobile ập vào một lượt —
   nặng nhất là `.hero-buttons{flex-direction:column}` biến 2 nút ngang thành
   dọc. `.hero` là `flex; align-items:center` nên cả khối tự căn giữa lại → nhảy.
   Lỗi này VỐN VẪN LUÔN CÓ, chỉ bị lớp `.preloader` che; bỏ preloader là lộ ra.
   → Đã chép đủ 6 khối media query của hero vào critical CSS, đặt **SAU**
   `CRIT-EXTRA` (trong đó `.hero-trust`/`.trust-stars` khai KHÔNG kèm media
   query, chen trước thì rule không điều kiện sẽ thắng).
   ⚠️ **Sửa rule mobile của hero trong `css/style.css` thì PHẢI sửa cả khối
   `CRIT-MOBILE` trong `index.html`.** Kiểm nhanh: quét mọi rule `.hero*`/`.btn`/
   `.trust*` nằm trong media query khớp khung 412x823, đối chiếu với critical CSS
   — phải khớp 11/11.
   ⚠️ Trước khi đổ lỗi cho phông, chạy `node scripts/kiem-phong-lot.js` (đợt này
   nó báo phông lót vẫn đúng số dòng) và so text tĩnh với `data/translations.js`.
   Cả hai đều sạch, thủ phạm là media query thiếu.

9. **Bắn pixel so le ở ĐƯỜNG TƯƠNG TÁC → mất sự kiện conversion** (rà soát 02/09/2026).
   Khi cú chạm đầu tiên chính là cú bấm CTA (icon gọi trên navbar mobile),
   pointerdown chỉ kịp bật Meta; khối định nghĩa `function gtag` là thẻ thứ 5,
   cần 4 khe requestIdleCallback nữa — click của cùng cú chạm tới trước, guard
   `typeof gtag === 'function'` nuốt lặng sự kiện GA4 + conversion Ads rồi trang
   nhảy sang app gọi. → Quy tắc trong `js/lazy-tracking.js`: **đường tương tác
   bật CẢ 5 đồng bộ, chỉ đường hẹn giờ mới so le** (Lighthouse không tương tác
   nên điểm không đổi). Đừng "tối ưu" lại chỗ này.
10. **Trình đối chiếu critical CSS phải BỎ COMMENT trước khi tách rule.** Rule
   `/* Hero adjustments */ .hero-title-sub {...}` bị regex `^s*.hero` bỏ sót
   vì chuỗi bắt đầu bằng `/*` — vì thế 30/08 quét "11/11 khớp" mà thật ra thiếu 2
   rule (`.hero-title-sub` 480px và `.hero{min-height:100dvh}` 768px), lộ ra ở
   rà soát 02/09/2026. Kiểm đúng là **13/13** sau khi strip comment.

## Phông đã cắt nhỏ — bản gốc nằm ở `assets/fonts/_goc/`
`scripts/cat-phong.js` (bundle-js.js gọi sẵn, chạy CUỐI cùng) cắt 8 file .woff2
xuống đúng những ký tự site thật sự dùng: **160,2 KB → 109,0 KB**. Bộ ký tự gom
từ chính nội dung — mọi trang .html + cả 2 ngôn ngữ trong `data/translations.js`
— nên thêm chữ mới rồi build lại là tự khớp.
- ⚠️ **Luôn cắt TỪ `_goc/`, không bao giờ cắt từ file đã cắt.** Cắt lại từ bản đã
  cắt thì glyph đã bỏ mất vĩnh viễn. Đừng xoá thư mục `_goc`.
- ⚠️ **Phải giữ dấu cách (mã 32) và no-break space (160) trong bộ ký tự.** Bản đầu
  lọc `> 32` để bỏ ký tự điều khiển, mà 32 chính là dấu cách → phông không có
  glyph khoảng trắng. `kiem-phong-lot.js` bắt được ngay: bề rộng "Trạm Dừng Chill"
  tụt 324px → 297px và size-adjust lệch 82,92% → 81,97%.
- Cắt glyph **KHÔNG** đổi số đo glyph còn lại — đã kiểm bằng thí nghiệm: cắt với
  tập ký tự cực rộng cho ra đúng 82,92% và 324px như bản gốc. Nên bộ số size-adjust
  của phông lót vẫn đúng nguyên, **không sinh CLS**. Khác hẳn phương án "hoãn tải
  phông" — cái đó dời thời điểm swap và có thể làm CLS của khách thật tệ đi, nên
  đã bị loại.
- `.gitignore` chặn `package.json`, nên máy vừa clone sẽ không có `subset-font`.
  Script tự bỏ qua bước cắt trong trường hợp đó (phông đã cắt nằm sẵn trong git).
  Cài lại: `npm install --save-dev subset-font`
- ⚠️ **Bộ ký tự phải gom cả: entity đã giải mã (`&times;` → ×), `content:"−"`
  trong CSS, chữ JS gán lúc chạy (✓/✗ của toast), thuộc tính placeholder/value.**
  Bản đầu chỉ quét chữ giữa các thẻ HTML nên dấu − (FAQ) và × (đóng lightbox)
  rơi về Arial — rà soát 02/09/2026 bắt được. cat-phong.js nay quét thô cả
  css/ + js/ + components/ kèm giải mã escape.
- **Sau khi đổi phông hay đổi nhiều chữ → chạy `node scripts/kiem-phong-lot.js`.**

## Phông lót chống CLS — sửa thì sửa cả 6 chỗ
`css/style.css` khai 3 `@font-face` tên `*Fallback` (Inter / Dancing Script /
Playfair) trỏ vào phông máy sẵn có kèm `size-adjust`, để lúc phông thật chưa về
chữ vẫn chiếm đúng bề rộng → **không đổi số dòng → không nhảy layout**.
Đây mới là thứ chữa CLS; tự chứa phông (31/07) chỉ bỏ được chặng gstatic.
- Cả 3 khối này **được chép vào critical CSS inline** của `index/menu/blog/404/
  duong-di` — vì lúc dễ nhảy nhất là lúc CSS async chưa về. Sửa `style.css` mà
  quên 5 file kia là công cốc.
- Bộ số **không được tự nghĩ**: tính từ bảng `cmap`+`hmtx` trong chính file
  `.woff2`, cân theo tần suất ký tự thật của trang (tiếng Việt lệch hẳn tiếng Anh).
- Đổi phông / đổi subset / đổi nhiều chữ hero → chạy `node scripts/kiem-phong-lot.js`
  (chạy tay, cần Arial+Georgia của Windows, KHÔNG nằm trong build).

## Flow đặt bàn
```
tramdungchill.vn (form đặt bàn inline trên homepage, KHÔNG có route /dat-ban riêng)
  → Apps Script (deployment AKfycbz46uJ..., version 18 — có sendToApp forward sang app DB)
    ├→ Google Sheet (lưu trữ)
    ├→ Telegram bot 8791984601 → chat ID 6293463576 (Tuấn)
    └→ VPS webhook 14.225.224.28:3456 → OpenClaw → Zalo nhóm "Đội Tư Vấn"
  → 23:00 daily: dailySummary() gửi báo cáo Telegram + Zalo
```

## Apps Script — các hàm chính
- `doPost(e)` — nhận data từ website
- `saveToSheet(data)`, `sendTelegram(data)`, `sendZaloGroup(data)`
- `fixDashboard()`, `dailySummary()`, `setupTriggers()`

## VPS Webhook
- **IP:** 14.225.224.28
- **Port webhook:** 3456
- **Webhook secret:** `tramdungchill2026`
- **PM2 process:** `zalo-webhook`
- **Script path:** `/home/molt/zalo-webhook.js`
- **Zalo group ID:** `group:2069484793216742236` (Đội Tư Vấn)

## Quy trình sửa code (sếp Tuấn ưu tiên)
1. Edit local
2. Chạy `node scripts/bundle-js.js` để build
3. `git add` files cần thiết (KHÔNG `git add -A`)
4. `git commit` với message tiếng Việt mô tả "tại sao"
5. `git push` lên `main` → GitHub Pages tự deploy
6. Verify trên https://tramdungchill.vn (cache có thể delay 1-2 phút)

## Task ưu tiên còn dang dở (chờ sếp chọn A/B/C)
**P1 (CAO):**
- ✅ Cài Facebook Pixel — ĐÃ XONG
- ⏳ Phân tích Facebook Ads / TikTok Ads Manager
- ⏳ Export Pancake data phân tích
- ⏳ CAPI Facebook (đợi traffic)

**P2 (TRUNG BÌNH):**
- Tối ưu SEO Local (schema, keyword, meta)
- Thêm blog content ("5 quán nướng đẹp Đà Lạt 2026"...)
- Live Chat Zalo trên website
- Setup n8n auto kéo Messenger
- UTM link cho từng KOL

**P3 (THẤP):**
- PWA (add to home screen)
- Loyalty/Reward system

**Why:** Sếp chưa chọn ưu tiên (tăng đặt bàn / SEO / quảng cáo).
**How to apply:** Khi tiếp tục việc website, hỏi lại sếp muốn focus mảng nào trước.

## Anti-Hallucination (BẮT BUỘC)
🚫 KHÔNG bịa số liệu, ROAS, traffic
✅ Tag confidence: 🟢 XÁC NHẬN / 🟡 ƯỚC TÍNH / 🔴 GIẢ ĐỊNH
✅ Verify code hiện tại trước khi assert (memory có thể outdated)

## Liên kết
- **Working directory marketing AI:** `g:/My Drive/09 - Tool/Claude/Tram-dung-chill/` (chứa CLAUDE.md đầy đủ về 9 agents marketing, brand voice, đối thủ)
- **Memory chính:** `C:/Users/Lenovo/.claude/projects/g--My-Drive-09---Tool-Claude-Tram-dung-chill/memory/`
