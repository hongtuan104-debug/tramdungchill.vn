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
  (⚠️ "hoàng hôn 15h" là cách nói nội bộ — 15:00 là giờ mở cửa. Trên web viết: **hoàng hôn từ khoảng 16:30**,
  **tàu chạy qua quán trong khung 16:30 – 21:25** (không ghi giờ từng chuyến) — sếp chốt 14/09/2026, xem bug #25.)
- **Giá:** 95k - 300k/người (đã VAT). GBP hiển thị bucket "100-300N đ" — đây là
  khoảng Google tự phân loại, không phải số chủ quán đặt, nên KHÔNG cần ép website khớp.
- **Phụ thu:** Tết Nguyên đán Mùng 2–Mùng 8 Âm lịch **phụ thu 10%**; Valentine, đêm 24/12, bàn view **không** phụ thu (sếp chốt 14/09/2026).
- **Xác nhận đặt bàn qua Zalo trong 15 phút:** chỉ trong giờ mở cửa 15:00–23:00 (sếp chốt 14/09/2026).
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
- **Google Analytics 4:** `G-2VFBZDY6CD` (toàn site). ~~`G-5G3K0RN39C` (4 dip pages)~~ — rà 17/09/2026:
  **0 file** còn nhắc ID này, property phụ đã thôi dùng; 4 trang dịp nay đo chung một property.
- **Google Ads:** `AW-18038463990` — thực tế nằm ở **index + menu + blog** (không phải "chỉ index")
- **Meta Pixel:** `1281459450582041` ✅ TẤT CẢ 151 trang
  - Events: `PageView`, `ViewContent` (menu/dip/blog), `Lead` (form đặt bàn), `Contact` (click Phone/Zalo/FB)
  - **Conversions API (CAPI):** chưa cài, đợi đủ traffic
- **RUM Core Web Vitals** (15/09/2026): sự kiện GA4 `LCP` `INP` `CLS` `TTFB` đo trên máy khách thật, nạp SAU pixel — xem bug #31

## Footer — sinh tự động, ĐỪNG sửa HTML tay
Footer nằm trong 8 file (component + template bài + 404 + 4 trang dịp), tất cả
do `scripts/generate-footer.js` sinh giữa mốc `<!-- FOOTER:START --> … <!-- FOOTER:END -->`.
- **Sửa chữ** → `data/translations.js` · **Sửa SĐT/địa chỉ/social** → `data/site-config.js`
- Rồi chạy `node scripts/bundle-js.js` (đã gọi sẵn generate-footer) + `node scripts/generate-blog-pages.js`
- Sửa tay từng file chính là cách cũ đã đẻ ra 5 footer lệch nhau (fix 30/07/2026)
- ⚠️ `css/footer.css` và `css/responsive.css` KHÔNG trang nào nạp — bản chạy thật
  nằm trong `css/style.css`, đó mới là file được bundle ra `dist/style.min.css`
- ⚠️ `css/variables.css` cũng là file chết — biến màu thật nằm trong `css/style.css`
- ⚠️ **Nhãn footer là `<p class="footer-logo">` / `<p class="footer-title">`, KHÔNG phải h3/h4** (15/09/2026, bug #32). CSS
  bám class, không bám tên thẻ. Đừng đổi lại thành heading: footer lặp trên mọi trang, heading trong đó nối đuôi dàn bài của
  section cuối — R20 chặn. `404.html` có bản CSS inline riêng (`.footer-logo`, `.footer-title`) — đổi kiểu thì sửa cả hai.

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
- ⚠️ **Trạng thái "đang đứng ở trang này" nằm ở BA nơi** (thêm 08/09/2026) —
  `class="active"` + `aria-current="page"` phải đi thành cặp ở cả ba:
  `scripts/generate-nav.js` (4 trang chính) · `components/layout-loader.js`
  (bản chạy lúc runtime) · `templates/blog-post.html` (141 bài, nav tĩnh viết tay).
  Trước 08/09/2026 `.nav-link.active` dùng CHUNG rule với `:hover` nên trang đang
  đứng trông y hệt mục đang rê chuột, và `aria-current` bằng 0 trên toàn site.
  Rule `.active` **không** nằm trong critical CSS (ở đó chỉ có nav mobile) nên
  sửa nó không phải đụng khối `CRIT-NAV`.
  Trang `duong-di/` không có mục trên nav (cố ý — nó ở footer) nên không có gì
  để tô active; chỉ báo vị trí của nó là **breadcrumb**, đừng gỡ.
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
- Ảnh gốc **không commit** (đã gitignore) — chỉ bản WebP 560/640/1000 (+1600 nếu ảnh gốc đủ rộng) + thumb 200 lên web.
  640 thêm 14/09/2026 cho điện thoại 1,75× — đổi cỡ thì sửa cả `sizes` trong generator (bug #29)
- HTML nằm giữa `<!-- MENU_FLIPBOOK:START --> … <!-- MENU_FLIPBOOK:END -->` trong menu.html,
  do `scripts/generate-menu-flipbook.js` ghi đè. **Sửa tay là mất ở lần build sau.**
- Chưa đủ 26 ảnh thì generator để trống vùng marker — cố tình, tránh 26 lỗi 404
- Tiếng lật trang tổng hợp bằng Web Audio API trong `js/menu-flipbook.js` (0 KB tải thêm),
  khách bật/tắt ở nút loa, lưu trong localStorage `tdc-menu-sound`
- ~~⚠️ Đổi `css/style.css` hay JS dùng chung → nhớ bump `CACHE_NAME`~~ — **hết cần
  từ 06/09/2026**, xem mục "Vân tay CSS + JS" bên dưới. `CACHE_NAME` nay tự sinh
  theo nội dung; sửa tay chỉ còn ý nghĩa khi muốn ép xoá cache vì lý do khác.
- **Thay ảnh menu thì KHÔNG cần bump `CACHE_NAME`**: URL ảnh mang vân tay `?v=<md5>`
  do generator gắn, đổi ảnh là URL đổi theo. Trước khi có vân tay (07/08/2026) thay
  ảnh xong khách vẫn thấy bản cũ — `/assets/menu-pages/` rơi vào nhánh cache-first
  của service worker, Ctrl+F5 cũng không phá được lớp đó.

## Thẻ resource hints + vân tay CSS/JS — cũng sinh tự động
`scripts/toi-uu-tai-trang.js` (do `bundle-js.js` gọi) tự chèn `dns-prefetch` cho
3 domain pixel và gắn `?v=<md5>` vào link CSS **và mọi thẻ `<script src>` nội bộ**
(`dist/` `js/` `data/`) của **mọi trang tĩnh**. Sửa tay trong HTML sẽ bị build ghi
đè ở lần chạy sau — 01/08/2026 đã dính: đổi tay `preconnect` → `dns-prefetch`,
build xong production có CẢ HAI.
→ Muốn đổi thì sửa trong `scripts/toi-uu-tai-trang.js`, đừng sửa HTML.

### Vân tay JS + service worker (06/09/2026)
Trước hôm đó CSS có vân tay mà JS thì không — 183 thẻ script nội bộ, không cái
nào mang `?v=`. Cách bù duy nhất là bump `CACHE_NAME` **bằng tay**, và đã quên
thật 3 commit liền (chú thích v11 trong `sw.js` tự ghi nhận). Nay:
- **Vân tay JS**: `toi-uu-tai-trang.js` lo trang tĩnh · `generate-blog-pages.js`
  lo 142 bài blog qua `{{JS_LAZY_VER}}` trong template · cả hai dùng chung
  `scripts/van-tay.js` để không lệch thuật toán.
- **`CACHE_NAME` tự sinh** = `<tiền tố>-<md5 nội dung precache>`, do
  `scripts/cap-nhat-sw.js` ghi giữa mốc `/* SW-ASSETS:START … END */`.
  Tiền tố vẫn đọc từ `sw.js` nên muốn bump tay cứ sửa như cũ.
- ⚠️ **`STATIC_ASSETS` trong `sw.js` PHẢI mang đúng `?v=`** như URL trang thật
  gọi: bộ xử lý fetch khớp URL chính xác (`caches.match(event.request)`), ghi URL
  trần = precache tải về rồi vứt đi + mất vỏ offline. Đã dính đúng lỗi này một
  lần với `style.min.css` (bài học v9). **Sửa danh sách precache trong
  `cap-nhat-sw.js`, đừng sửa `sw.js`.**
- ⚠️ `generate-blog-pages.js` ghi đè `data/blog-data-light.js` nên nó **tự chạy
  lại** `toi-uu-tai-trang.js` + `cap-nhat-sw.js` ở cuối. Đừng gỡ hai dòng đó:
  thêm một bài blog là `blog.html` trỏ vân tay cũ, danh sách bài đứng im.
- Máy canh: `seo-geo-verify.js` có 2 mục mới — "Thẻ script JS kèm vân tay khớp
  file thật" và "Precache sw.js khớp URL trang thật gọi".

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

11. **Schema: quán chỉ có MỘT thực thể, `@id` là `https://tramdungchill.vn/#restaurant`.**
   Rà 12/09/2026 thấy 4 trang dịp, 141 bài blog và 3 khối VideoObject ở trang chủ
   đều dựng node mang tên quán mà **không có `@id`** → với Google đó là nhiều doanh
   nghiệp trùng tên, không phải một. Địa chỉ trang dịp còn thiếu "Phường Xuân Trường"
   + mã bưu chính, logo blog.html là `favicon-180` trong khi trang chủ khai
   `favicon-512` — hai giá trị cho **cùng một `@id`**.
   → Mọi node `Restaurant`/`Organization` mang tên quán **phải** có `@id` đó; định
   nghĩa đầy đủ chỉ nằm ở `index.html`, nơi khác chỉ tham chiếu. Trong
   `generate-blog-pages.js` dùng hàm `QUAN()`, đừng viết node mới.

12. **Schema KHÔNG sinh bằng JS lúc chạy — `js/schema-generator.js` đã xoá.**
   File đó viết từ hồi blog.html chưa có JSON-LD tĩnh nên inject một node `Blog`;
   sau này blog.html được thêm node `Blog` inline mà không ai tắt phần inject →
   **2 node `Blog` cho cùng 1 trang**, bản JS lại không `@id`. Chạy thật trong
   production suốt thời gian đó, không phải code chết.
   Dọn 12/09/2026: xoá `js/schema-generator.js`, bỏ khỏi `COMMON_FILES` trong
   `bundle-js.js`, bỏ lời gọi trong `js/app.js`, bỏ thẻ tải `data/schema-data.js`
   ở index/menu/blog và bỏ nó khỏi precache trong `cap-nhat-sw.js`.
   → `dist/common.min.js` **30,1 KB → 25,7 KB**, cộng 5,8 KB + 1 request nữa
   không còn phải tải.
   ⚠️ **`data/schema-data.js` vẫn phải GIỮ trên đĩa** — `generate-menu.js` và
   `check-facts.js` đọc nó bằng Node lúc build. Nó chỉ thôi là tài sản của trình
   duyệt, không phải file thừa.
   ⚠️ **Có HAI đường inject, không phải một.** Ngày 12/09 gỡ `schema-generator.js`
   xong vẫn sót `js/blog-renderer.js`: nó chèn **18 node BlogPosting** trên
   blog.html, mỗi bài một node — trùng với BlogPosting thật của từng trang bài, lại
   thiếu `@id`, khai logo `favicon-180` (chuẩn là 512) và đặt `"@type":"Organization"`
   cho `@id` `#restaurant` (thực thể đó là `Restaurant`). Nó lọt qua mọi vòng kiểm
   vì các luật chỉ đọc HTML tĩnh, mà node đó chỉ hiện sau khi JS chạy — chỉ lộ ra
   khi đưa trang qua validator.schema.org (nó render JS). Nay R7c mục (d) quét
   **mọi** file trong `js/` và `dist/`, không riêng `common.min.js`.
   → Máy canh R7c mục (d) chặn cả ba đường sống lại: file generator xuất hiện lại,
   trang tải `schema-data.js`, hoặc bundle mang hàm `build*Schema`.

13. **Breadcrumb: khai MỘT kiểu, và schema phải khớp bản hiển thị.**
   menu.html + blog.html từng khai cả microdata trong `<nav>` lẫn JSON-LD cho cùng
   một dãy. 4 trang dịp thì ngược lại: có JSON-LD mà trên trang không hiện gì.
   Bài blog lệch kiểu thứ ba: schema ghi tiêu đề đầy đủ còn trang cắt ở 60 ký tự
   kèm "…". → Toàn site nay chỉ dùng **JSON-LD**, tên từng chặng khớp từng chữ với
   `<nav class="breadcrumb">`. Trang chủ **không** có BreadcrumbList (không có phân
   cấp nào để thể hiện).
   ⚠️ `.breadcrumb` trong `style.css` để `padding-top:100px` chừa chỗ cho
   `.navbar position:fixed`. Trang dịp dùng `.dip-nav position:sticky` (nằm TRONG
   luồng) nên `css/dip-landing.css` phải ghi đè `padding:0`, không thì thừa hẳn
   một mảng tối trước hero.
   → Máy canh: luật **R7c** trong `seo-geo-verify.js` canh cả 6 thứ trên.

14. **Trang nào CẦN schema, trang nào KHÔNG** (rà hết 14 trang + 141 bài, 12/09/2026).
   - `404.html` và `review-qr.html` khai `noindex, nofollow` và cố ý không nằm trong
     sitemap → **đừng thêm schema hay canonical vào đó**. Google không index thì
     không đọc schema, còn canonical trên trang noindex là hai tín hiệu đánh nhau.
   - `components/*.html` là mảnh nav/footer, `googlef913….html` là file xác minh
     Search Console — không phải trang, không có gì để khai.
   - Bài blog: `mainEntityOfPage` trước đây chỉ có `@type` + `@id`, tức một node
     WebPage rỗng. Nay **bài đang index** (18 bài) mang đủ `url`/`name`/
     `description`/`inLanguage`/`isPartOf` neo vào `#website`, và `@id` = `url` =
     đúng canonical của trang. **Bài noindex (123) cố ý giữ dạng gọn**: khai
     `url` = chính nó trong khi canonical trỏ bài khác chỉ tổ mâu thuẫn.
   → Máy canh R7c mục (f) quét cả thư mục `blog/`, bỏ qua bài noindex.

15. **Kiểm schema có HAI công cụ, đừng coi là một** (checklist #23, rà 13/09/2026).
   Schema Markup Validator báo **0 lỗi · 0 cảnh báo cho cả 27 URL live** mà vẫn sót
   2 thứ Google cần: `geo` chỉ 4 chữ số thập phân (Google đòi ≥ 5) và 3 VideoObject
   thiếu `duration`. Nó chỉ soi cú pháp schema.org, không biết tài liệu Google.
   → **Trước commit:** luật **R7e** trong `seo-geo-verify.js` đối chiếu tài liệu Google
   (bản 08/09/2026) + chặn microdata/data-vocabulary quay lại.
   → **Sau deploy:** `node scripts/kiem-schema-live.js` (thêm `--all` = cả sitemap) chạy
   validator trên 1 URL/mẫu trang và so số khối JSON-LD sau render với file tĩnh.
   Rich Results Test không có API → đổi template thì dán tay URL đại diện.
   - Toạ độ `11.9542027, 108.4946325` lấy từ ghim trong link Maps của quán — đừng làm tròn.
   - `duration` đo từ hộp `mvhd` của mp4 (16s/16s/20s) — thay video thì đo lại. Khối
     `VIDEO_JSONLD` là **sửa tay**: chú thích cũ nhắc `scripts/sync-video-schema.js`
     nhưng file đó chưa từng có trong git.
   - **Google đã bỏ hẳn FAQ rich result từ 07/05/2026** (Rich Results Test cũng thôi
     nhận). Vẫn giữ FAQPage vì Google cho để lại và Bing/bot AI còn đọc — RRT không
     thấy FAQ là bình thường, đừng "sửa".
   - ⚠️ **aggregateRating 4,8/7.060 + 4 review là số của Google Maps.** Google ghi
     *"Don't aggregate reviews or ratings from other websites"*, và trang tự khai về
     chính quán thì không được hiện sao. **Sếp Tuấn chốt GIỮ NGUYÊN (13/09/2026)** —
     đừng hỏi lại, trừ khi Search Console báo Manual Action "spammy structured
     markup": khi đó gỡ phần này là việc đầu tiên.
   - Mục 201/202 (báo cáo Rich result, Manual Actions) chỉ xem được trong Search Console —
     máy này không vào được, nhưng GSC gửi mail cho chủ site. Rà Gmail 13/09/2026: 17 mail
     từ `sc-noreply@google.com` từ 22/03/2026, **0 mail Manual Action**; lỗi dữ liệu có cấu
     trúc duy nhất là "Trường trùng lặp FAQPage" (06/04/2026) — đúng thời bug #12 còn chèn
     schema bằng JS, nay mỗi trang 1 FAQPage và Google đã gỡ luôn báo cáo FAQ.

16. **Nội dung phải khớp nguồn nó dẫn, khớp chính nó, và khớp ảnh** (checklist #23 E-E-A-T, rà 13/09/2026).
   - 11 bài index ghi "đường sắt **răng cưa** Đà Lạt – Trại Mát", 2 bài gắn link Wikipedia làm
     nguồn. Wikipedia (vi + en) đặt các đoạn răng cưa ở quãng vượt đèo từ Sông Pha lên cao
     nguyên — tuyến gốc, đã ngừng khai thác. Đoạn 7 km còn chạy **không** phải răng cưa.
     Câu nói "tàu còn chạy" thì dẫn trang `Ga_Đà_Lạt`, không dẫn trang tuyến gốc.
   - 17 bài giới thiệu quán số 113 "cũng ngắm được tàu" ngay cạnh câu "quán **duy nhất** ngắm
     trọn 3 view" — tự phủ nhận chính mình. Đã gỡ mọi tuyên bố độc quyền (tiêu đề bài
     `nuong-bbq-ngam-xe-lua` đổi theo). Muốn nhấn thì dùng "hiếm có", "đặc biệt".
   - ⛔ **Sếp Tuấn cấm hẳn (13/09/2026): KHÔNG dùng chữ "duy nhất" hay "số một"** ở bất kỳ đâu —
     kể cả câu không tự xưng ("cách duy nhất", "tiêu chí số 1", "best-seller số 1", "#1 rated")
     và cả bài noindex. Viết lại câu, đừng lách bằng "độc nhất", "No.1", "top 1", "hạng 1".
   - **Alt ảnh đại diện tả chủ đề bài chứ không tả ảnh**: khay gà sống nhúng lẩu ghi "bò sườn gà
     nướng than hoa", ảnh bàn tiệc sinh nhật về đêm ghi "BBQ giữa rừng thông". Đã sửa 19 alt
     (17 trong `blog-data.js`, 2 override trong `blog-seo.js`). **Viết alt phải mở ảnh ra xem** —
     không máy canh nào bắt được lỗi này.
   - Toa tàu sát lan can trong `view-xe-lua-11b` / `view-xe-lua-20` (toa xám biển RAIL ROAD, ban
     đêm viền đèn xanh) **là tàu Đà Lạt – Trại Mát thật** — sếp Tuấn xác nhận 13/09/2026. Đừng
     nhầm với khu check-in đoàn tàu riêng của quán.
   - **Xóm Lèo (113 Huỳnh Tấn Phát) là quán cùng chủ.** 17 bài từng giới thiệu nó như quán hàng
     xóm để khách "so thử" mà không nói quan hệ. Sếp chốt 13/09/2026: mọi link sang xomleo.vn kèm
     chữ "quán cùng chủ". Chỉ nói trong câu chữ — **KHÔNG** khai alternateName/sameAs (hai hồ sơ
     Maps riêng, xem `docs/digital-pr-outreach.md`).
   - Tác giả **Nguyễn Duy là đồng chủ** (sếp xác nhận 13/09/2026) → vai trò trong `blog-seo.js` là
     "Đồng chủ Tiệm Nướng Trạm Dừng Chill". Thư báo chí ký Nguyễn Hồng Tuấn, chủ quán, cũng đúng.
   - `dip/san-tau-da-lat.html` bỏ "Tips chuyên gia" + "thành công 100%" (chính trang ghi "không
     phải ai đến cũng thấy tàu"), thêm cảnh báo không bước xuống đường ray. Bài gia đình thêm
     một gạch đầu dòng về đường sắt cạnh lan can.
   → Máy canh: **R8k** (răng cưa) + **R8l** (cấm "duy nhất"/"số một" và câu tự xưng độc quyền;
   quét mọi trang kể cả noindex, alt/title/meta, JSON-LD, dữ liệu gốc) +
   **R8m** (link Xóm Lèo thiếu chữ "cùng chủ") trong `seo-geo-verify.js`.

17. **Bộ nén CSS tự làm hỏng `calc()`** (phát hiện 13/09/2026). `minifyCSS` trong
   `bundle-js.js` xoá dấu cách quanh `+` trên cả file (định nén bộ chọn `a + b`), biến
   `calc(16px + env(...))` → `calc(16px+env(...))` và `calc(50% + 20px)` → `calc(50%+20px)`:
   biểu thức hỏng, trình duyệt **lặng lẽ bỏ**, không lỗi nào hiện ra. Chạy thật trên production:
   chữ "Cuộn xuống" trên mobile bị căn GIỮA hero đè lên dòng mô tả (có `env()` nên thành "unset"
   luôn cả `bottom:30px` gốc) và nhảy 365px khi CSS async về; nút "ảnh tiếp" của lightbox mobile
   mất vị trí. `css/style.css` gốc viết đúng nên đọc nguồn không bao giờ thấy — chỉ lộ ở file nén.
   → Nay cất nội dung trong ngoặc tròn trước khi bỏ dấu cách. Dấu giữ chỗ viết bằng chuỗi escape
   `\u0001` — ⚠️ **đừng dán ký tự điều khiển thật vào file**: chỉ 1 byte NUL là git coi cả
   `bundle-js.js` là nhị phân, diff thành "Binary files differ" (đã dính lúc sửa).
   → Máy canh **R8n**: mọi `calc/min/max/clamp` trong `dist/*.css` phải có dấu cách quanh `+ −`.

18. **Dòng đánh giá hero tự xuống hàng khác nhau giữa phông lót và phông thật** (13/09/2026) →
   `.hero-content` xô **0,013 mọi lượt tải** trên mobile. Ở khung ~412px ô chữ còn ~272px, chuỗi
   "4.8/5 · 7.060 đánh giá Google · 13M+ views viral" đo bằng Inter thật ~282px (2 dòng), Arial lót
   vừa 1 dòng → phông về là `.hero-trust` cao 35 → 54px. Sửa: ≤480px ép đúng 2 dòng bằng
   `.trust-line{display:block}` (sửa cả `CRIT-MOBILE`). `kiem-phong-lot.js` nay kiểm thêm 2 dòng này
   với ô hẹp nhất 196px — trước đó chỉ kiểm H1, địa chỉ, mô tả nên lọt.
   Đo bằng Chrome DevTools Protocol (layout-shift sources, script ở scratchpad, không vào repo):
   CLS 0,024–0,031 → **0,0005–0,0007** sau khi sửa cả #17 lẫn #18, kể cả khi giữ CSS lại 4 giây.
   ⚠️ **Đừng sửa theo một lượt PageSpeed đơn lẻ.** Lượt 13/09 16:21 báo CLS 0,287, nhưng 6 lượt đo
   khác (Lighthouse 13.4.1 cục bộ, bóp mạng thật, CDP giữ CSS) đều ≤ 0,031. Cùng lượt đó có ~90
   request `pubads.g.doubleclick.net/gampad/ads` + `playstream.media` mà site không hề gọi (HTML live
   trùng git từng byte, lượt đo cục bộ không có) → lượt đo bị nhiễu.

19. **Hiệu ứng mờ dần trên tên quán kéo LCP mobile muộn cả mấy giây** (13/09/2026). `<h1 class="hero-title">`
   từng mang `animate-fade-up delay-1` (bắt đầu `opacity:0`). Chrome không tính phần tử trong suốt là ứng
   viên LCP, mà khung hình ĐẦU của animation phải chờ main thread chạy xong JS lúc tải trang — độ trễ
   khai 0,04s không nói lên gì. Đo CDP (412px, CPU 4×, 4G chậm, 3 lượt lấy trung vị): FCP ~3,6s nhưng
   LCP 7,97s; bỏ lớp đó khỏi riêng h1 → LCP 4,63s (bỏ cả hero → 4,22s). Phông Dancing Script về lúc
   ~2,0s nên KHÔNG phải thủ phạm dù chữ thật rộng hơn phông lót.
   → Tên quán nay hiện ngay; địa chỉ/mô tả/nút/dòng đánh giá vẫn mờ dần. **Đừng gắn lại
   `animate-fade-up` cho phần tử LCP** (kiểm phần tử LCP bằng PageSpeed trước khi thêm hiệu ứng vào hero).
   ⚠️ Lighthouse chạy trên máy làm việc KHÔNG dùng để chấm điểm được (TBT 2,7–12s so với 290ms của
   PageSpeed, kể cả bật GPU) — chỉ dùng so trước/sau cùng điều kiện; điểm thật phải lấy từ pagespeed.web.dev.
   ⚠️ LCP trên PageSpeed (2,4s) cao hơn FCP (1,8s) là **LCP mô phỏng**: Chrome thật đo LCP = FCP ngay cả
   khi giữ phông Dancing Script lại 3s (đo CDP 13/09). Lighthouse cộng mọi request bắt đầu trước khung
   hình đầu vào LCP chứ không vào FCP — đừng săn "font swap" cho khoảng chênh này.

20. **Giờ bật pixel ở đường hẹn giờ: tải xong + 6 giây** (sếp Tuấn duyệt 13/09/2026). Hai lượt PageSpeed
   mobile cùng ngày, JS lúc tải không đổi: TBT 290ms rồi 840ms (24 → 10/30 điểm). Lighthouse ngừng ghi
   ~1s sau khi mạng + CPU yên — sát mốc load + 2,5s cũ, nên pixel lúc lọt vào cửa sổ đo lúc không.
   Nay `HOAN_SAU_LOAD = 6000` trong `js/lazy-tracking.js`. **Đừng kéo về 2,5s** "cho đỡ mất PageView":
   khách chạm/cuộn vẫn bật ngay (bug #9), chỉ mất PageView người rời trang trong 2,5–6s mà không tương tác.
   Cùng đợt: `initHeroParticles` (js/hero.js) đọc `window.innerWidth` lúc DOMContentLoaded gây "buộc chỉnh
   lại luồng" 112ms → đổi sang `matchMedia` + hoãn tạo hạt tới lúc rảnh.
   TikTok tự bắt click (INP 66–108ms/cú chạm): sếp chọn **để sau** (13/09/2026).

21. **CSS tải async kích ~280 transition cùng lúc** (PageSpeed mobile "100 phần tử ảnh động không được ghép",
   13/09/2026). 5 trang nạp `dist/style.min.css` kiểu `media="print" onload` (index/menu/blog/duong-di/tac-gia).
   Lúc CSS về, 30 rule `transition: all` (thẻ ưu đãi, link nav, thẻ trải nghiệm…) TRƯỢT từ giá trị lúc chưa có
   CSS (padding 0, viền 0, cỡ chữ mặc định) sang giá trị thật trong 0,3–0,4s — padding/viền/cỡ chữ đổi từng
   khung hình = tính lại bố cục liên tục. Đo CDP (`plans/cong-cu-do-hieu-nang/do-animation.js`): 354 animation,
   281 không ghép lớp.
   → Mỗi trang đó có `<style id="chan-transition">` tắt transition khi `<html>` chưa có class `tdc-css`, và
   `onload` của link gắn `tdc-css` sau **2 khung hình** (khung 1 áp CSS mới với transition đang tắt, khung 2
   mới bật lại — bật cùng khung là transition vẫn chạy). Sau sửa: 63 animation, PageSpeed đếm **0**.
   Còn lại là `.reveal` (opacity/transform, ghép lớp được) — đúng chủ đích.
   ⚠️ **Thêm trang mới nạp CSS async thì chép cả khối chặn lẫn onload** — luật **R8o** chặn thiếu.
   Trang nạp CSS đồng bộ (bài blog, trang dịp) không dính vì CSS áp trước lần tính style đầu tiên.
22. **FAB + nút lên-đầu-trang từng dời bằng `bottom` khi thanh đặt bàn dính đáy hiện/ẩn** → mỗi khung hình
   của cú trượt là một layout shift lúc khách CUỘN (PageSpeed không cuộn nên không bao giờ thấy). Đo CDP khi
   thao tác: 0,0134 → **0,0010**. Nay dùng thuộc tính `translate` (tách khỏi `transform` nên không đè
   translateY ẩn/hiện của FAB). Luật R8o cũng chặn rule `sticky-bar-active` nào còn khai `bottom`.
   ⚠️ CrUX CLS 0,06 (13/09/2026) là trung bình 28 ngày — còn gồm các ngày trước bản sửa #17/#18 (lab lúc đó
   0,287). Cuộn hết trang chủ bằng CDP sau sửa chỉ ra 0,0006; con số CrUX tự giảm dần, đừng săn thêm.
23. **Ảnh gallery: WebP 480/800/1200 + srcset** (13/09/2026). 6 ảnh `gallery-*.jpg` 105–294 KB chỉ có bản
   JPG 1200px, điện thoại hiện ~372px. Bản 800px (Moto G của PageSpeed chọn) tổng 326 KB so với 1.039 KB JPG.
   - Sinh ảnh: `node scripts/tao-anh-webp.js` (cần `npm install --save-dev sharp`, chạy tay khi thay ảnh).
     **Giữ JPG gốc**: og:image và `<noscript>` vẫn dùng.
   - index.html: 10 thẻ lazy mang `data-srcset` + `sizes`; `js/gallery.js` gắn srcset TRƯỚC src. `sizes` đo
     bằng `do-co-anh.js` và **tính cả `object-fit: cover`** — ô cao hẹp (gallery-tall, khối Câu chuyện) phải
     tải ảnh rộng hơn chính ô. Đổi lưới gallery trong CSS thì đo lại sizes.
   - 4 trang dịp: preload + nền hero dùng `-1200.webp` (nền phủ theo chiều cao nên mobile cần ~1.500px thật).
   - Luật **R8p**: thẻ srcset nào cũng phải có `sizes`, ảnh gallery lazy không được quay về JPG.
   - Cùng đợt: `js/lazy-tracking.js` giờ được nén ra **`dist/lazy-tracking.min.js`** (PageSpeed "Rút gọn
     JavaScript" 3,3 KiB) — **sửa file nguồn trong `js/` rồi build**, mọi trang + template blog nạp bản dist.
     `scroll-ui.js` hoãn lần `onScroll()` đầu qua một khung hình (hết "buộc chỉnh lại luồng" ở offsetTop).
24. **TBT mobile nhảy 130 ↔ 300+ms với cùng một code = 3 lần tính bố cục toàn trang** (13/09/2026, PageSpeed
   ra 98 rồi 93–95 mà code không đổi phần tải trang). Trace Lighthouse: ba tác vụ dài lúc tải đều là Layout
   ~1.350–1.430 phần tử — vẽ đầu (trước FCP) · `style.min.css` async về · phông Inter/Playfair về. CSS và phông
   về sát nhau thì gộp một lần (lượt điểm cao), lệch nhau thì TBT tính hai lần.
   ⚠️ Lighthouse gắn tác vụ thứ ba cho `lazy-tracking.min.js` chỉ vì trùng nhịp sự kiện `load` — bên trong KHÔNG
   có pixel (không request nào tới tiktok/facebook/clarity trong lượt đo), đừng săn nhầm.
   → Làm nhẹ mỗi lần dựng chữ: `html,button,input,select,textarea{text-rendering:optimizeSpeed;font-kerning:none;
   font-variant-ligatures:none}` trong `style.css` VÀ ở đầu critical CSS của 6 trang (mốc `CHU-NHANH`: index/menu/
   blog/404/duong-di/tac-gia). Lighthouse 13.4.1 cục bộ, 2 đợt × 3 lượt: Style&Layout −18…−26%, TBT −24/−25%,
   FCP/LCP không đổi; ảnh chụp logo Dancing Script vẫn nối nét. `kiem-phong-lot.js` vẫn khớp số dòng (bảng hmtx
   nó đọc vốn không tính kerning). Máy canh **R8q**. Nút/ô nhập khai riêng vì trình duyệt đặt `font:` viết tắt
   cho chúng, kerning bật lại thay vì kế thừa từ `html`.
   - **Phông tĩnh đủ mọi độ đậm — ĐÃ ĐO, LOẠI**: TBT −43% nhưng trang dùng đủ 5 độ đậm Inter + 4 Playfair nên tải
     21 file/210 KB thay vì 8 file/115 KB → FCP +450ms, LCP +530ms. Chi tiết memory `tbt-mobile-layout-phong-bien-thien`.
   - **Khai `@font-face` Inter/Playfair ngay trong HTML (để phông tải từ lúc vẽ đầu, mong gộp 2 lần tính bố cục)
     — ĐÃ ĐO 14/09/2026, LOẠI**: phông bắt đầu tải lúc 230ms thay vì 1.094ms nhưng không gộp được, TBT 1.270 →
     1.961ms, FCP +150ms, LCP +380ms. Đừng chuyển @font-face vào critical CSS.
   - Đo A/B khi PageSpeed API hết lượt (429, hạn mức ngày reset ~15h giờ VN): Lighthouse trong
     `npm-cache/_npx/5390d7d89c0de19d` + bản sao `git worktree` của commit cũ phục vụ ở cổng khác, chạy xen kẽ
     3 lượt, so trung vị. Điểm tuyệt đối trên máy này thấp hơn PageSpeed nhiều — chỉ dùng để so trước/sau.
25. **Cùng một dữ kiện, mỗi trang ghi một kiểu — AI trích đoạn nào thì trả lời khách theo đoạn đó** (checklist #25
   Content AEO, rà 14/09/2026 trên 27 URL index + dữ liệu blog noindex). Câu chuẩn để viết bài mới:
   - **Tết CÓ phụ thu 10% từ Mùng 2 đến Mùng 8 Âm lịch** (sếp Tuấn chốt 14/09/2026); không phụ thu Valentine, đêm 24/12,
     bàn view. Trước đó `facts.json` (bản 31/07) + 4 trang dịp + llms.txt ghi "giữ nguyên giá kể cả Tết", còn 5 bài blog
     ghi 10% — **bên sai là facts.json**. Menu in 26 trang không in dòng phụ thu nào, đừng lấy nó làm bằng chứng.
   - **"Xác nhận qua Zalo trong 15 phút" chỉ trong giờ mở cửa 15:00–23:00** (sếp chốt 14/09); đặt ngoài giờ thì quán
     xác nhận khi mở cửa. Câu đầy đủ phải kèm điều kiện; nhãn ngắn dưới 45 ký tự (thanh sticky) được miễn.
   - **15:00 là giờ MỞ CỬA, không phải hoàng hôn. Hoàng hôn từ khoảng 16:30** (sếp Tuấn xác nhận 14/09/2026). Lượt sửa đầu
     em dùng giờ mặt trời lặn tự tính theo toạ độ (17:18–18:15, NOAA) — sếp sửa lại vì số đó không trừ đồi phía tây che nắng.
     **Đừng đưa giờ lặn tự tính lên web.** Câu "quán cùng khu mở 16–17h nên bỏ lỡ hoàng hôn" (so sánh không nguồn) đã gỡ.
   - **Tàu: CHỈ ghi khung "chạy qua quán trong khung 16:30 – 21:25"** (sếp chốt 14/09/2026). KHÔNG ghi giờ từng chuyến
     (16:30·17:15·18:35·19:20·20:40·21:25), không ghi điều kiện T6–CN / "không cố định", không ghi bảng giờ rời ga DL1–DL14,
     không ghi "tàu từ ga tới quán 20–25 phút". Trước đó mỗi nơi ghi một lịch khác: trang chủ "cứ một tiếng một chuyến",
     llms.txt 14:30/15:30/16:30/17:30, bài EN 2:30–5:30 PM, bài nhà lồng "~17:30–18:30", 30 bài noindex "tàu khoảng 18h".
     Trang săn tàu nay chỉ còn 3 mốc: tàu 16:30–21:25 · hoàng hôn từ ~16:30 · nhà lồng lên đèn từ ~18:30.
     Widget tàu ở trang chủ giữ nguyên HTML (3 ô), chỉ đổi chữ trong translations.js.
   - Cách ghi số: "7.060 lượt đánh giá / 5 sao" → 4.8/5 · "13 triệu người" → lượt xem + link video · "rated by 7,060
     guests" → reviews · "Hơn 80 món" lẫn "hơn 70 món" → hơn 70 · mục Câu chuyện "10K+ / 50+ món signature / 100%" →
     "4.8/5 Google Maps · 70+ món trên menu · 15–23h" (sếp duyệt; "Năm thành lập 2022" CHƯA ai xác nhận). Bản EN trang
     chủ còn "6,500+ verified reviews" vì mẫu của `normalize-review-count.js` chỉ bắt "N reviews" đứng liền nhau.
   - Số đánh giá nay kèm **"(số đọc ngày 04/09/2026)" / "(as of 4 Sep 2026)"**; `facts.json` có `ngayDocSoDanhGia`.
     → **Đổi số review: `node scripts/normalize-review-count.js <số> <YYYY-MM-DD>`** (tham số ngày thêm 14/09) rồi sửa facts.json.
   - Tên món 209K thống nhất **"Bò Kobe Nướng Tảng Phô Mai Trứng Muối"** (bản Okachi 229K) — blog từng gọi "Bò Tảng…" 26 chỗ.
   - Bài "mùa nào đẹp": nhiệt độ tự nghĩ ("TB 18–25°C", "T12 lạnh nhất") → số trung bình bảng khí hậu Wikipedia (nguồn
     Địa chí Đà Lạt): **đêm lạnh nhất là tháng 1 (11,3°C)**, mưa nhiều nhất tháng 9. Trích VnExpress (24/9/2022) và Tuổi Trẻ
     (7/11/2023) nay có link → whitelist R8d thêm `vnexpress.net`, `tuoitre.vn`.
   - Bài "bao nhiêu tiền": bảng chi phí nhóm lệch giá menu (1 bò + 1–2 heo/gà + 1 hải sản + lẩu gà lá é = 720–990K →
     180–250K/người chia 4, không phải 150–220K); gỡ mẹo "mang theo nước" vì menu in ghi không nhận đồ ăn/uống mang vào.
     "Nhóm 4 người 380K–1,2M" là mức chi × 4, không phải số đo → viết "nhân lên là", đừng viết "thường hết".
   - Bài EN train-view ghi "French-built **cog (rack) railway**" — lọt R8k vì regex cũ chỉ bắt "rack rail" liền nhau.
   - Setup miễn phí luôn đi kèm "cọc 200.000đ, hoàn lại sau khi ăn"; "nhân viên trông giúp bé" → "phụ để mắt tới bé, ba
     mẹ vẫn là người trông" (quán sát đường ray đang chạy tàu).
   → Máy canh: **R8r** (10 kiểu câu sai đã gặp, gồm cả giờ từng chuyến tàu và giờ lặn tự tính; quét mọi trang + bản dịch
   + llms.txt + dữ liệu blog) + **R8s** (câu hứa
   15 phút phải có "giờ mở cửa"; ngày đọc số phải khớp facts.json). R8k vá thêm "cog (rack)".
   ⚠️ **Chưa sửa, chờ sếp** (chi tiết memory `aeo-ra-soat-2026-09`): set menu / xe limousine / sân khấu ở team-building;
   quy mô đoàn; số marketing chưa nguồn trong dip/; review "Trần Thị Hương" không truy được; tiêu đề tự xưng "nhất/best";
   lộ trình bằng chữ cho trang đường đi.
   Công cụ rà (gitignore, `plans/cong-cu-aeo/`): `tach-chu.js` tách chữ hiển thị các URL sitemap · `quet.js` liệt kê số
   liệu / câu mơ hồ / heading · `hoang-hon.js` giờ mặt trời lặn. ⚠️ `data/blog-seo.js` là object JS (khoá ngoài không ngoặc
   kép) — đừng `JSON.parse`; đọc bằng `vm`, thay chuỗi thì mã hoá `JSON.stringify(s).slice(1,-1)` là khớp từng byte.

26. **"Buộc chỉnh lại luồng" chỉ lộ khi mạng chậm — và KHÔNG được đo bố cục lúc tải trang** (14/09/2026). PageSpeed báo
   "[chưa được phân bổ] 58ms" trong khi Lighthouse cục bộ báo ĐẠT: trên localhost CSS/phông về tức thì nên không bao giờ
   trùng lúc JS đọc số đo. Ghi trace có bóp 4G chậm (`do-trace.js` với `LUU=`) rồi chấm bằng CHÍNH trace_engine của
   Lighthouse (`plans/cong-cu-do-hieu-nang/cham-reflow.mjs`) thì ra 30–43ms, đủ tên: `checkScroll` (fab-contact, đo
   scrollHeight "trang ngắn") 13–25ms · `updateProgress` (i18n, scrollHeight) 7–8ms · `handleScroll` (sticky, pageYOffset)
   4–9ms · `onScroll` (scroll-ui) 1–2ms. Cả bốn là "lần gọi đầu lúc tải" đã từng hoãn xuống requestIdleCallback /
   rAF+setTimeout — **hoãn không đủ**: idle vẫn rơi đúng lúc CSS async hoặc phông vừa làm bẩn bố cục.
   → Bỏ hẳn lần gọi đầu ở cả bốn. Ở đầu trang trạng thái mặc định đã đúng (FAB/nút lên đầu/thanh đặt bàn ẩn, tiến độ 0%,
   link "Trang chủ" có sẵn `active` trong HTML). Tải lại giữa trang hay mở bằng `#neo` thì trình duyệt khôi phục vị trí và
   **bắn sự kiện `scroll`** → bộ nghe tự cập nhật (đã kiểm `do-trang-thai.js`: 5 trang × đầu trang / cuộn / tải lại / #neo).
   "Trang ngắn" của FAB lấy từ `ResizeObserver(document.body)` — kích thước có sẵn sau bước bố cục, không ép gì.
   Sau sửa: 3 trace 4G chậm đều **0 lần**. ⚠️ **Đừng thêm lại "cập nhật trạng thái lúc tải" bằng cách đọc
   scrollY/offsetTop/scrollHeight**, kể cả trong requestIdleCallback — dùng sự kiện, IntersectionObserver, ResizeObserver.
   Cùng đợt: `detectCurrentPage()` không biết `/tac-gia/` nên trang tác giả chạy `initScrollUI` của trang chủ và cuộn về
   đầu là nav mất nền đặc → `scroll-ui.js` không bao giờ gỡ `scrolled` khỏi nav đã mang sẵn class đó trong HTML.
27. **Phông tự chứa mang vân tay `?v=`** (14/09/2026) — điều kiện bắt buộc trước khi cho trình duyệt giữ bộ nhớ đệm dài
   (Google đòi ≥ 30 ngày cho font/ảnh/script/style; GitHub Pages ép 10 phút, muốn đổi phải đặt Cloudflare phía trước).
   `cat-phong.js` viết lại 8 file phông mỗi khi bộ ký tự site đổi mà tên file giữ nguyên → không vân tay thì khách cũ
   giữ bản thiếu glyph. Hàm dùng chung `ganVanTayPhong()` trong `scripts/van-tay.js`, gọi ở 3 nơi:
   `toi-uu-tai-trang.js` (bước 0: `dist/*.css` TRƯỚC khi băm CSS · bước 4: thẻ preload + @font-face inline của mọi
   trang tĩnh) · `generate-blog-pages.js` (preload trong 141 bài) · `bundle-js.js` chạy lại toi-uu + cap-nhat-sw SAU
   `cat-phong.js` (phông vừa đổi thì vân tay CSS/sw.js phải đổi theo).
   ⚠️ Preload và `url()` trong CSS **phải cùng `?v=`** — lệch là trình duyệt coi hai URL khác nhau, tải phông hai lần.
   Máy canh **R8t** (602 chỗ gọi). `css/style.css` gốc KHÔNG mang `?v=` (chỉ bản `dist/`); template bài cũng không.
28. **Trang con tải CSS nền mà critical CSS chỉ có phông lót + nav → cả trang xếp lại lúc CSS về** (14/09/2026).
   Lighthouse mobile rà 8 loại trang: blog.html CLS 0,931, menu 0,564, đường đi 0,262 — trang chủ không dính vì critical
   CSS đầy đủ. CDP 4G chậm trên site thật: cú lớn nhất đúng lúc CSS áp (logo 175×77 → 136×36, menu mobile đang hiện bị
   ẩn, hero bị đẩy ~100px). → **menu / blog / đường đi / tác giả nay nạp `style.min.css` ĐỒNG BỘ** như trang dịp và bài
   blog (vốn ≤ 0,03); gỡ luôn khối `chan-transition` ở 4 trang đó (thiếu `onload` gắn `tdc-css` thì transition tắt vĩnh
   viễn). R8o giờ chỉ còn canh trang chủ. **Trang mới: CSS đồng bộ, trừ khi viết critical CSS đầy đủ như trang chủ.**
   Cùng đợt, 3 lỗi dời chỗ khi ĐỔI PHÔNG (không liên quan CSS nền):
   - `.menu-hero::before`, `.blog-hero::before`, `.menu-cta::before` là lớp phủ 200% đặt `top/left: -50%` — `top` % tính theo
     chiều cao khối cha, phông về làm hero cao/thấp vài px là cả lớp khổng lồ "dời chỗ": CLS 0,30 riêng menu. Nay `inset: 0`
     + quy đổi tâm/bán kính gradient cho y hệt. ⚠️ **Lớp phủ trang trí dùng `inset: 0`, đừng định vị âm theo %.**
   - Đường đi: tiêu đề "Đến Quán Trạm Dừng Chill" lúc 1 dòng lúc 2 dòng vì Playfair Latin và Playfair tiếng Việt về lệch giờ
     (chữ trộn phông hẹp đi) → 2 cú 0,023 ngược chiều. ≤ 520px ép 2 dòng bằng `.dong-h1{display:block}`.
   - Bài blog: script thanh tiến độ đọc gọi `measure()` (offsetTop) ngay lúc dựng trang = 419ms "buộc chỉnh lại luồng"
     → đo ở lần cuộn đầu (xem #26).
   - Trang dịp: `site-config.js` + `booking.js` thêm `defer` (script inline chỉ dùng SITE_CONFIG lúc gửi form).
   - blog.html: `.blog-grid` + `#blogFilters` là div RỖNG, `blog-renderer.js` đổ 18 card vào SAU lần vẽ đầu → `.blog-cta`
     đang trong tầm nhìn bị đẩy ~12.000px (Lighthouse 0,103; CDP không thấy vì JS kịp chạy trước lần vẽ đầu). Nay
     `@media (scripting: enabled){.blog-grid:empty{min-height:120vh}}` — chỉ khi có JS, tắt JS thì không thành khoảng trắng.
     ⚠️ **Nội dung do JS vẽ sau lần vẽ đầu phải có chỗ giữ sẵn**, không thì phần tử bên dưới trong tầm nhìn bị đẩy.
   Sau sửa, CDP 4G chậm: blog 0,0004 · menu / đường đi / tác giả / bài blog / trang dịp đều 0. ~~Lighthouse cục bộ từng ra
   menu 0,193 một lượt … không sửa mò~~ → **0,193 là lỗi THẬT, tìm ra ở #29** (h1 menu đổi số dòng khi phông về).
   Còn lại KHÔNG tính điểm, chưa làm: ảnh card blog thiếu cỡ ~650px (điện thoại 1,75× phải tải 800w). Bìa menu: xong ở #29.
29. **Trang menu: ảnh bìa đúng cỡ · lưới ảnh không tải trước JS · h1 hero không đổi số dòng khi phông về** (14/09/2026).
   PageSpeed menu 93: LCP 3,0s là ảnh bìa bản 1000w 227 KB (hiện 630px), "buộc chỉnh lại luồng" `menu.min.js:425`, ảnh trang 2
   tải sớm. Công cụ đo nằm ở `plans/cong-cu-do-hieu-nang/` (gitignore).
   - **Buộc chỉnh lại luồng:** dòng 425 bản live là `img.height / img.width` lúc dựng mục lục — thuộc tính DOM đó là cỡ ĐANG
     HIỂN THỊ, đọc là ép bố cục. Đổi sang đọc thuộc tính `width`/`height` trong HTML thì lần ép dời sang `syncLayout()` đọc
     `window.innerWidth` (Lighthouse 35–429ms). Nay hỏi `matchMedia('(min-width: 900px)')` — không ép bố cục.
     ⚠️ **Đừng đọc `innerWidth`/`innerHeight` lúc dựng giao diện**, dùng `matchMedia` (giống hero.js ở #20).
   - **Cỡ ảnh:** thêm **640w** vào `MENU_PAGE_SIZES` + viết `sizes` theo bề rộng THẬT của trang sách (`do-rong-sach.js`, 10 cỡ
     máy). Máy 412px × 1,75 hiện trang rộng 360px CSS = 630px thật → nay chọn 640w (bìa **92 KB** sau nén 62, trước 227 KB). Không lấy
     720: Lighthouse chỉ bỏ qua ảnh có srcset khi phần thừa < 12 KB (`BYTE_SAVINGS_THRESHOLD_RESPONSIVE_BREAKPOINTS`), 720 ở cỡ
     đó còn thừa ~32 KB. `sizes` cũ `92vw` khai dư 5% nên có 640 trình duyệt vẫn chọn bản to hơn. Chrome hiểu `min()` trong
     `sizes`; trình duyệt không hiểu thì bỏ mục đó, rơi xuống mục sau (ảnh to hơn, không vỡ).
     ⚠️ Đổi CSS kích thước sách (`.flipbook-book`, `.container`, khung `.flipbook-viewport`) → đo lại rồi sửa chuỗi `sizes` trong
     `generate-menu-flipbook.js`. Ảnh xem trước ở trang chủ cũng viết lại `sizes` (lưới 2/4 cột).
     Đúng cỡ rồi Lighthouse vẫn báo bìa "phí 18 KB" — lần này là mục **nén/AVIF**: báo khi ảnh tốn > 1/6 byte mỗi điểm ảnh
     (`TARGET_BYTES_PER_PIXEL_AVIF`), mà ảnh nhỏ giữ chi tiết dày hơn nên bản 560/640 ở chất lượng 76 tốn ~0,20. Nay
     `QUALITY_THEO_CO = { 560: 62, 640: 62 }` trong `tao-anh-menu.js` (bìa 0,162); soi vùng chữ phóng 2× không thấy khác.
     1000/1600 giữ 76 (retina + phóng to đọc chữ).
   - **Tải trước trang kế** lúc dựng sách hoãn tới `load` — trước đó ảnh trang 2 giành băng thông với ảnh bìa (phần tử LCP).
   - **Lưới 26 ảnh hiện ra trước khi JS dựng sách:** CSS đồng bộ (#28) nên trình duyệt có thể tính bố cục cho lưới trước khi
     `menu.min.js` (defer) chạy — một lần là đủ để mọi ảnh `loading="lazy"` trong tầm tải trước bị tải: Lighthouse bắt được
     3–15 trang (0,4–1,9 MB) giành băng thông với bìa. Nay `@media (scripting: enabled)` ẩn lưới khi chưa `is-ready` + giữ chỗ
     `min-height` xấp xỉ sách + thanh điều khiển (lệch ≤ ~40px ở 10 cỡ máy). Tắt JS thì lưới vẫn hiện; ảnh bìa `eager` vẫn tải
     sớm dù nằm trong khối `display:none`. CDP 4G chậm, giữ menu.min.js thêm 2,5s: chỉ còn bìa + trang 2 (sau load).
   - **h1 hero đổi số dòng khi phông về** — thủ phạm của lượt 0,193: "Menu Quán Nướng Đà Lạt" ở màn 410–420px bằng phông lót
     (Georgia co giãn) vừa 1 dòng, bằng Playfair thật thì 2 → cả hero bị đẩy 42px. Chỉ lộ khi phông về SAU lần vẽ đầu (mạng
     chậm), nên lượt PageSpeed phông về kịp đo 0. Rà bằng `so-dong-phong.js` (so chiều cao mọi phần tử chữ: chặn woff2 ↔ cho
     tải, 8 trang × 11 cỡ) + `do-dong-h1.js` (quét 300–900px từng 2px ra đúng dải lệch). Lệch h1: menu 410–420 · blog.html
     314–332 · dịp cầu hôn 360–374 · săn tàu 418 · sinh nhật 406–420 (trúng 412 của PageSpeed) · team building 534–542.
     → `<br class="ngat-h1 ngat-h1-N">` chỉ hiện khi màn ≤ N px (N = chỗ cả hai phông vừa + ~3%, rule trong `style.css`).
     Sau sửa: 6 trang khớp số dòng ở mọi bề rộng ≥ 320px.
     ⚠️ **Dùng `<br>`, KHÔNG dùng span `display:block`** trong `<em>` trang dịp: `em` tô chữ gradient bằng `background-clip:text`,
     chen khối block vào inline là chữ mất nền → trong suốt.
     ⚠️ **Đổi chữ hay cỡ chữ h1 hero của 6 trang này → chạy `do-dong-h1.js` đo lại N.** Trang chủ không nằm trong đợt này
     (h1 có cấu trúc riêng, mô hình không khớp — đã có `kiem-phong-lot.js` lo).
   - **Đoạn văn dài xuống dòng lệch vài chữ khi Inter về — ngắt dòng không chữa được** (menu 320/375/412/430/600px, đường đi
     390/480, dịp cầu hôn 375–430). Ô chữ giữ nguyên chiều cao nhưng chữ chạy lại bên trong vẫn tính là dời chỗ: sau khi sửa h1,
     menu ở 412px vẫn **CLS 0,104** cả 2 lượt Lighthouse, thủ phạm duy nhất `p.menu-hero-desc` (đoạn "Quán mở ngoài trời…", link
     trong đoạn nhảy dòng). Gốc: phông chỉ được phát hiện SAU khi CSS tải + tính bố cục, tức ngay trước lần vẽ đầu → gần như
     luôn đổi phông sau khi đã vẽ, kể cả localhost.
     → **Preload đủ phông màn đầu** (Inter + Playfair thẳng/nghiêng, cộng Dancing Script sẵn có = đủ 8 file 109 KB). Trang
     vốn tải đủ 8 file này, preload chỉ cho tải SỚM chứ không thêm byte. A/B trên bản sao trang menu, Lighthouse 2 lượt/bản:
     - gốc: CLS 0,104 / 0,104 · FCP 2.827 / 2.855 · LCP 4.477 / 4.355ms
     - chỉ Inter: CLS 0 / 0 · FCP 2.978 / 2.555 · LCP 4.478 / 4.355ms
     - đủ phông: CLS 0 / 0 · FCP 2.459 / 1.804 · LCP 4.290 / 4.285ms · "CSS chặn hiển thị" 490–740 → 150–200ms
     CDP 4G chậm: gốc CLS 0,1044 · FCP 4.328 → đủ phông CLS 0 · FCP 3.336. LCP trang menu là CHỮ (hero cao ~1.100px ở 412px,
     sách nằm dưới màn đầu) nên phông về sớm chỉ có lợi.
     Áp cho **menu · blog.html · đường đi · 404** — LCP đều là chữ; file preload đúng những file trang dùng, đo bằng
     `phong-dung-that.js` (404 không dùng Playfair nghiêng). **KHÔNG áp** cho tác giả / trang dịp / bài blog: LCP là ẢNH (preload
     phông giành băng thông với ảnh như bug #5), CLS 4G chậm ở 412px vốn ≤ 0,0004, trang dịp + bài blog đã preload Inter từ trước.
     ⚠️ Preload phải cùng `?v=` với `@font-face` trong CSS (R8t canh) — lệch là trình duyệt tải phông hai lần.
   - **Lighthouse cục bộ có lượt báo bìa "phí 63–82 KB" dù ảnh đúng cỡ** — lỗi ĐO, không phải trang: trace thiếu
     `metadata.hostDPR` thì `ImagePaintingHandler.finalize` của trace_engine bỏ bước quy đổi DPR, coi ảnh hiện 360×510 thay vì
     630×892. Gặp ở cả bản gốc lẫn bản preload. PageSpeed của sếp vẫn quy đổi đúng (từng báo "hiển thị 630x892").
   - **Đường đi: iframe YouTube + Google Maps chỉ gắn `src` khi khách cuộn gần.** Sau khi thêm preload, Lighthouse ra FCP 6,75s
     lượt này, 1,69s lượt khác (bản gốc 4,8–5,0s cả 2 lượt): hai khung có `loading="lazy"` nhưng nằm ngay dưới hero, trong tầm
     Chrome tải trước, nên ~700 KB script YouTube/Maps có lượt bắt đầu TRƯỚC lần vẽ đầu và Lighthouse cộng cả vào mô phỏng 4G.
     Nay `data-src`, chờ mốc `first-contentful-paint` (PerformanceObserver) rồi mới IntersectionObserver (rootMargin 300px) gắn
     `src`; tắt JS thì có bản `<noscript>`. ⚠️ IntersectionObserver MỘT MÌNH vẫn gọi lại trước FCP (desktop 1350px: request iframe
     520ms, FCP 672ms), chờ `load` cũng không được (Lighthouse: load 273ms, FCP 2.393ms). Kiểm bằng `kiem-iframe-hoan.js`.
     ⚠️ **Nhúng iframe bên thứ ba (YouTube, Maps, TikTok…) gần màn đầu thì làm kiểu này** — `loading="lazy"` một mình không đủ.

30. **Điều hướng & UX — checklist #18 mục 144–153** (rà 14/09/2026, đo bằng Chrome 412px + máy canh). Đạt sẵn, đừng làm lại:
   nav 7 mục đều là `<a href>` thật; trang đang đứng có `active` + `aria-current` (đậm + gạch chân, không chỉ màu); breadcrumb
   ở mọi trang con; blog có tìm kiếm + lọc + khối "không tìm thấy" + nút xoá lọc + trạng thái lọc trong URL (sửa 08/09); 404 có lối về.
   Đã sửa:
   - **Nhãn "Thực đơn"**: nav tĩnh, noscript nav, breadcrumb + schema trang menu, 141 bài và 404 đều ghi "Thực đơn", riêng
     `translations.js` ghi `nav.menu: 'Menu'` → JS đổi chữ ngay sau khi tải (bug #0), footer sinh từ bản dịch cũng lệch.
     Nay vi = "Thực đơn", en giữ "Menu".
   - **27 đường dẫn trần trong FAQ blog** (`data/blog-seo.js`): "Xem thực đơn tại ../menu.html", "form trên website
     (../index.html#booking)" hiện nguyên tên file mà bấm không được → link có nhãn. `faqSchemaBlock()` nay bỏ thẻ HTML khỏi
     `acceptedAnswer.text` (giống FAQPage trang chủ).
   - **Menu mobile 404 mất 2 mục đầu**: `.navbar` có `backdrop-filter` nên thành khung chứa của phần tử `fixed` bên trong →
     `.nav-links{inset:0}` chỉ cao 72px, "Trang chủ" + "Thực đơn" bị đẩy lên trên mép màn hình. Nay khai `width:100vw;height:100dvh`
     như `.nav-menu` ở style.css.
     ⚠️ **Lớp phủ `position:fixed` nằm trong khối có `backdrop-filter` / `transform` / `filter` phải khai kích thước theo viewport** —
     `inset:0` bám theo khối cha đó chứ không theo màn hình.
   - ESC đóng menu mobile + trả tiêu điểm về nút ở 141 bài blog và 404 (trang chính có từ 08/09); 404 thêm `aria-expanded`.
   - Ô tìm kiếm blog **không dấu, tách chữ, có bản viết liền**: "sinh nhat", "đà lạt sinh nhật", "dalat" đều khớp.
     `type="search"` + `enterkeyhint`; tắt JS thì giấu ô tìm + nút lọc.
   - "Đọc tiếp →" ×18 có `aria-label` kèm tên bài · icon điện thoại nav 2 trang dịp đổi emoji → SVG cho giống 2 trang kia ·
     `review-qr.html` có link về trang chủ (ẩn khi in) · link dự phòng của QR bỏ "Bấm vào đây" · FAQ trang chủ bọc link thực đơn.
   - ⚠️ **Đừng viết escape u-hex của dấu kết hợp (0300–036F) trong `js/` `css/` `components/`.** `cat-phong.js` giải mã escape
     vào bộ ký tự cần giữ → cả 8 phông +4,3 KB (đã dính lúc viết hàm bỏ dấu). `boDau()` trong blog-renderer cố ý so mã số.
     Phông subset hiện **113,1 KB** (số 109,0 KB ở mục Phông bên dưới là số cũ).
   - ⚠️ **Dấu vân lastmod (`chuHienThi` trong cap-nhat-lastmod.js) nay bỏ qua `<nav class="navbar|dip-nav">`, `<footer class="footer">`
     và thẻ `<a>`.** Trước đó đổi một nhãn footer là bot đóng dấu "Cập nhật" + báo IndexNow cho cả 27 trang sitemap.
     **Đổi hàm đó thì phải tính lại `data/dau-van-noi-dung.json` đối xứng trên bản HEAD** (lưu hàm-mới(HEAD), chỉ khi dấu vân
     đang lưu = hàm-cũ(HEAD)) — không thì lần push sau cả site bị đóng dấu. Đợt này bot chỉ còn đánh dấu 9 bài đổi chữ FAQ thật,
     và 9 bài đó vốn đã mang ngày 14/09.
   - Chưa sửa, chờ sếp: mở lightbox ảnh / phóng to menu lật rồi bấm Back là **rời trang** chứ không đóng lớp phủ (không đẩy
     history) · "Đường đi" vẫn chỉ ở footer (cố ý, xem mục Nav) · `review-qr.html` còn dòng "View Đẹp Nhất Đà Lạt" (thuộc việc
     chờ sếp về chữ "nhất").
   → Máy canh: **R18** (đường dẫn trần · nhãn nav khớp bản dịch · ESC ở 3 biến thể menu · escape dấu kết hợp) + **R13e**
   (dấu vân bỏ qua nav/footer + bọc link).

31. **Core Web Vitals — checklist #13 mục 94–103** (rà 15/09/2026). Kết luận CWV **chỉ** lấy từ Field Data p75 (CrUX / Search
   Console), điện thoại và máy tính chấm riêng, đạt khi CẢ BA LCP·INP·CLS đều Tốt; điểm Lighthouse/PageSpeed lab chỉ để chẩn đoán.
   CrUX là cửa sổ 28 ngày — bản sửa cần ~4 tuần mới hiện đủ.
   - **`node scripts/kiem-crux.js`** (`--all` cả sitemap · `--lich-su` xu hướng các kỳ): làm đúng các luật trên, in ngày cửa sổ,
     số thô lưu `plans/crux/`. Cần `CRUX_API_KEY=` trong `.env` (gitignore) — PageSpeed API ẩn danh dùng hạn mức chung nên gần
     như luôn 429. ⚠️ **Repo công khai: đừng dán key vào file nào khác.** Trang ít khách không có số riêng (CrUX trả 404).
   - **RUM** (mục 103): `js/do-khach-that.js` + `js/vendor/web-vitals.attribution.iife.js` (6.2.2, Apache-2.0, chép nguyên từ npm)
     → `dist/do-khach-that.min.js`. Gửi sự kiện GA4 `LCP` `INP` `CLS` `TTFB` kèm `metric_rating`, `nhom_trang`, `debug_*` (phần tử,
     script dài nhất của cú chạm, trạng thái tải, các chặng con). Mỗi chỉ số MỘT sự kiện/lượt xem → đếm theo `metric_rating` ra
     % lượt đạt Tốt; đổi lại INP có thể thấp hơn CrUX chút (cú chạm sau khi khách quay lại tab không tính).
     - `lazy-tracking.js` chèn nó **SAU khi bật pixel**. ⚠️ **Đừng gắn `<script src>` của nó vào HTML** — chạy lúc tải trang là đè
       lên LCP/TBT (bug #19–#24). Thư viện dùng PerformanceObserver buffered nên nạp muộn vẫn đủ số.
     - Tên + vân tay do `bundle-js.js` điền vào chỗ giữ chỗ `'__DO_KHACH_THAT__'` trong `dist/lazy-tracking.min.js`; bundle này
       phải sinh TRƯỚC lazy-tracking. Thư viện **không** qua `minify()` (regex bỏ `//` cắt hỏng code đã nén).
     - ⚠️ Giữ `send_to: 'G-2VFBZDY6CD'` — thiếu là gtag gửi cả sang Google Ads AW-18038463990.
     - Thư viện ngoài để trong `js/vendor/`: `cat-phong.js` chỉ quét `js/*.js` cấp một nên không phình phông.
     - Đổi bản web-vitals: `npm pack web-vitals`, chép `dist/web-vitals.attribution.iife.js` + LICENSE, đối chiếu lại tên trường
       attribution trong README (các bản lớn từng đổi tên).
     - GA4 chỉ cắt báo cáo theo tham số đã đăng ký ở Quản trị → Định nghĩa tuỳ chỉnh, và chỉ tính từ lúc đăng ký.
     - Kiểm cục bộ: `plans/cong-cu-do-hieu-nang/do-rum.js` (chặn domain pixel, bắt lệnh gtag qua dataLayer). ⚠️ Runtime binding
       của CDP KHÔNG kịp gửi lúc trang unload — số gửi khi rời trang phải ghi `localStorage` rồi đọc ở URL cùng origin (đã tưởng
       nhầm là lỗi code 15/09).
   - **CrUX thật 15/09** (cửa sổ 17/08–13/09): điện thoại LCP 1.897ms · **INP 264ms** · CLS 0,06 · TTFB 1.046ms → trượt INP;
     máy tính LCP 870ms · INP 104ms · **CLS 0,12** · TTFB 336ms → trượt CLS. 27 URL sitemap đều KHÔNG có số riêng (chỉ có origin).
   - ⚠️ **CLS desktop 0,12 là lỗi ĐÃ SỬA, đừng săn lại.** A/B bằng `plans/cong-cu-do-hieu-nang/do-cls-desktop.js` (1366×768, mạng
     chậm, cuộn + rê chuột), bản `9d0470c9` trước đợt sửa ↔ bản hiện tại: menu 0,1999 ↔ 0 · blog 0,9327 ↔ 0 · đường đi 0,1754 ↔ 0 ·
     trang chủ 0,0021 ↔ 0,0043. Chính là bug #28 (CSS async về → cả trang xếp lại), xảy ra cả trên máy tính. Số CrUX tự giảm khi
     cửa sổ 28 ngày trượt qua 14/09. Trên máy tính cuộn và rê chuột KHÔNG tính là "input" → rule `:hover` đổi padding/gap và nav
     co lại khi cuộn đều cộng vào CLS; đã đo: rê chuột 0 cú xô, nav co 0,0002 — không đáng sửa.
   - TTFB đo từ máy làm việc 15/09: 0,26–0,31s khi kết nối sẵn, 0,51–0,63s lượt đầu (gồm DNS+TCP+TLS), Fastly SIN `HIT` — khác xa
     p75 khách mobile 1.046ms; số chẩn đoán, không tính CWV.
   - Search Console: 0 mail về Core Web Vitals trong 120 ngày (rà Gmail 15/09). Báo cáo CWV trong GSC chỉ sếp xem được.
   → Máy canh **R8u**: bundle có web-vitals + send_to GA4 · vân tay trong lazy-tracking khớp file thật · không trang nào nạp thẳng.

32. **Meta description · Heading · Ảnh — checklist #09/#10/#11 mục 54–83** (rà 15/09/2026: quét tĩnh 168 trang + quét bản ĐÃ CHẠY JS
   bằng Chrome, 27 URL × điện thoại 412px / máy tính 1366px; công cụ để ở scratchpad, không vào repo).
   Đạt sẵn, đừng làm lại: 27/27 URL có đúng 1 meta description, không trùng nhau, không trùng title · mỗi trang 1 H1, 0 nhảy cấp (cả bản
   render), 0 heading rỗng, 0 heading bản ẩn/bản hiện trùng nhau, 0 id trùng, 0 neo mục lục hỏng · ảnh đang hiển thị đều là WebP (JPG chỉ
   còn cho og:image / schema / noscript) · 0 URL ảnh lỗi hay redirect · ảnh trong schema đều có file, ≥ 50K điểm ảnh, Article.image = og:image.
   Đã sửa:
   - **Mô tả bị cắt giữa câu**: 7/18 bài index có excerpt > 160 ký tự, generator cắt kèm "..." → nay `metaDescription` trong
     `data/blog-seo.js` (8 bài, thêm bài setup sinh nhật cho kèm cọc), hàm `moTaTrang()` dùng chung cho meta lẫn schema description.
     ⚠️ **Bài index mới có excerpt > 160 ký tự thì PHẢI viết `metaDescription`** — R19 chặn. Trang tác giả 173 → 149 ký tự; blog.html bỏ
     lặp "Đà Lạt" ×3 (sửa cả 2 node schema viết tay); trang sinh nhật / cầu hôn thêm điều kiện cọc (bug #25) ở meta lẫn schema.
   - ⚠️ **Hàm dấu vân lastmod TÍNH meta description là nội dung** (cố ý, xem đầu `cap-nhat-lastmod.js`) → đổi mô tả là bot đóng dấu
     "Cập nhật" cho trang đó. Đợt này 12 trang.
   - **Heading ngoài dàn bài**: 4 nhãn footer (h3 + 3 h4) và tiêu đề 3 thẻ "Bài viết liên quan" (h3 không có nội dung bên dưới) → `<p>`
     (xem mục Footer). So computed style trước/sau ở 6 trang × 2 khung: khớp từng thuộc tính, chỉ khác tên thẻ. h2 của section giữ nguyên.
   - **Thẻ bài ở blog.html + trang tác giả cao theo ảnh gốc**: `.blog-card-img img{height:100%}` nằm trong khối cao tự do → ảnh dọc
     1182×2560 thành thẻ cao 1.213px (máy tính) / 805px (điện thoại), heading hai thẻ cùng hàng lệch nhau hàng trăm px — thứ tự nhìn ngược
     thứ tự DOM (mục 69). Nay `.blog-card:not(.blog-featured) .blog-card-img{aspect-ratio:3/2}`.
   - **Ảnh hero 4 trang dịp là nền CSS** → Google Images không lập chỉ mục; 3/4 trang không có tấm `<img>` nào. Nay
     `<img class="dip-hero-anh" fetchpriority="high">` phủ `object-fit:cover`, preload giữ nguyên CÙNG URL (vẫn 1 lần tải). Một cỡ 1200w là
     cố ý: hero phủ theo chiều cao nên điện thoại cũng cần ≥ 1.200px thật (bug #23). ⚠️ Đừng quay về `style="background-image"` — R21 chặn.
   - **Ảnh LCP**: trang tác giả lazy đúng ảnh LCP → 2 thẻ đầu không lazy, thẻ đầu `fetchpriority="high"`; hero 141 bài thêm
     `fetchpriority="high"` (vốn là LCP, trước chỉ có `loading="eager"`).
   - **srcset/sizes**: thẻ bài liên quan không srcset → máy tính tải 1200px cho ô 317px; thẻ bài blog.html/tác giả khai `sizes` 1200px cho
     ô 560px. Nay `sizes` theo bề rộng đo bằng `do-co-anh.js`: `SIZES_THE_BAI` trong generator = `img.sizes` trong `js/blog-renderer.js`.
     ⚠️ Đổi lưới `.blog-grid` / `.blog-related-grid` thì đo lại và sửa cả hai chỗ.
   - **Alt tả chủ đề chứ không tả ảnh** (tái phạm bug #16, lần này ở trang chủ): gallery-2 là hai người đàn hát trên sân khấu mà alt ghi
     "view nhà lồng", gallery-6 là tàu chạy qua dưới dãy bàn mà alt ghi "kỷ niệm… view triệu đô", gallery-4 alt "Câu chuyện Trạm Dừng Chill"
     → viết lại 15 alt sau khi mở từng ảnh. Zoom menu lật tạo `<img>` không alt → gán `alt=""`; lightbox trang chủ bỏ `src=""` rỗng.
   - Tên file ảnh: 100% chữ thường nối gạch ngang. `gallery-N` / `tiktok-thumb-N` chung chung nhưng **cố ý không đổi tên** — đổi là mất lịch
     sử lập chỉ mục ảnh (GitHub Pages không redirect được) và kéo theo og:image / schema / precache.
   - EXIF/XMP của cả 728 ảnh đã bị xoá lúc nén → không lần được nguồn ảnh bằng máy.
   Sếp chốt 15/09/2026: **giữ trang menu như hiện tại** — không thêm bảng giá dạng chữ cho khách có JS (mục 81), đừng đề xuất lại ·
   **Trạm Dừng Chill và Xóm Lèo "là 1"** → ảnh gallery-2 có biển Xóm Lèo trên sân khấu dùng tiếp được · **cắt ảnh ngang: làm** (mục dưới).
   - **Ảnh chia sẻ + ảnh bài nhiều tỉ lệ** (sếp duyệt 15/09): og:image của 5 trang là hero-sunset.jpg DỌC 1200×1802 (index/menu/blog còn khai
     1200×630) và 4 bài index dùng ảnh dọc → Facebook/Zalo cắt giữa ảnh, còn lại mảng trời. Nay `scripts/tao-anh-chia-se.js` (chạy tay, cần
     sharp) sinh `assets/images/chia-se/<tên>-og.jpg` 1200×630 cho cả 27 URL + `-16x9/-4x3/-1x1.webp` cho ảnh 18 bài index; BlogPosting.image
     thành mảng 3 tỉ lệ (tài liệu Article của Google khuyến nghị). Đã duyệt bằng mắt cả 21 ảnh nguồn; 6 ảnh máy cắt hụt người / mất toa tàu
     → khai `tam` trong bảng ANH. ⚠️ **Thêm bài index mới hay đổi ảnh đại diện → thêm vào bảng ANH, chạy script, MỞ ẢNH RA XEM** — R22 chặn
     bài thiếu. Trang tĩnh khai og:image viết tay. og:image để JPG (bot mạng xã hội), ảnh schema để WebP.
   - ⚠️ **Hàm dấu vân lastmod nay bỏ cả MẢNG chỉ gồm URL** (`"image": [...]`, `sameAs`): bản cũ để lại `["","",""]` trong phép so, đổi ảnh bài
     sang mảng là 18 bài bị đóng dấu "Cập nhật" oan. Đã tính lại `dau-van-noi-dung.json` đối xứng trên HEAD (chỉ trang chủ đổi, 0 trang lệch);
     R13c thêm mẫu mảng. Chạy thử bot sau khi build: 0 trang bị đóng dấu.
   - **Vì sao ảnh mất EXIF** (sếp hỏi 15/09): bản đầu của 117 ảnh JPG vào repo ngày 23/03/2026 còn EXIF (Canon, iPhone 13/15 Pro/16 Pro Max,
     Lightroom, Meitu; ảnh 3.000–6.240px). Cùng ngày commit `7d5698a4` "compress all images from 1.3GB to 57MB" thu nhỏ ảnh và xoá metadata —
     sharp mặc định bỏ metadata, không script ảnh nào trong `scripts/` giữ lại. 192 JPG khác vào repo đã trống sẵn (ảnh tải từ Zalo/Facebook/
     Canva). Bản gốc còn EXIF VẪN nằm trong lịch sử git (`16516cce`, `a5dff490`) — cần bằng chứng nguồn ảnh thì lấy bằng `git show`.
   Chưa sửa, chờ sếp (memory `checklist-09-11-meta-heading-anh`): quyền dùng ảnh có mặt khách / người mẫu (mục 83) · đối chiếu snippet Google
   thật hiển thị (mục 63, cần Search Console).
   → Máy canh **R19** (meta description) · **R20** (footer/thẻ bài liên quan không heading, không heading rỗng, id không trùng, mục lục đúng
   đích) · **R21** (đủ alt, không src rỗng, hero dịp là `<img>`, ảnh LCP không lazy, srcset thẻ bài liên quan, quy ước tên file ảnh) ·
   **R22** (og:image mọi URL sitemap ngang ~1,91:1 khai đúng cỡ, twitter:image trùng og:image, bài index đủ 3 tỉ lệ, mỗi ảnh ≥ 50K điểm ảnh).

33. **Độ hiển thị trên AI Search — checklist #26 mục 234–243** (dựng bộ đo 16/09/2026). Quy trình + công cụ nằm ở
   `docs/do-hien-thi-ai/` (robots.txt chặn `/docs/` nên không lên Google, nhưng VẪN trong git — khác `plans/`).
   - **KHÔNG có API nào hỏi hộ được ChatGPT Search / AI Overviews / Copilot** đúng thứ khách thấy: kết quả đổi theo tài khoản,
     phiên, vị trí, đổi cả giữa hai lần hỏi liền nhau. Nên phần hỏi là **làm tay**, `scripts/do-hien-thi-ai.js` chỉ lo phần máy
     làm được. ⚠️ **Đừng bịa số citation** — chưa đo thì script in "chưa có lần đo nào", để nguyên vậy.
   - **Bộ câu hỏi `cau-hoi-benchmark.json`**: 20 câu (5 thương hiệu + 15 không), 5 intent, 15 vi + 5 en, mỗi câu kèm `urlKyVong`.
     Sửa câu chữ → **tăng `phienBan` + cập nhật `bamCauHoi`**, rồi đo lại từ đầu; gộp số v1 với v2 là số vô nghĩa (mục 237).
   - **Bốn trạng thái, đừng gộp thành một điểm "độ hiển thị"** (mục 239): `missing` · `mentioned` (nhắc tên, không dẫn URL) ·
     `cited` (có URL của mình VÀ link còn sống) · `replaced` (AI chọn nguồn khác — phải ghi rõ ai). `mentioned` mà không `cited`
     là tín hiệu riêng: AI biết quán nhưng lấy tin từ chỗ khác, tin sai thì mình không sửa được.
   - **URL hỏng thì KHÔNG tính là owned citation**: `--kiem-url` soi status / chuỗi redirect / canonical / noindex, URL nào hỏng
     bị loại khỏi owned-source share. Phần "trang có thật sự đỡ được tuyên bố đó không" máy **không** kiểm hộ được — người đo tự
     mở ra đọc rồi đánh `daMoKiemTuyenBo: true`, script bắt thiếu cờ này (mục 240).
   - Mỗi lần đo phải đủ `nenTang`/`model`/`ngonNgu`/`thiTruong`/`trangThaiTaiKhoan`/`thoiDiem` + `trichDoan` hoặc `anhChup`
     (mục 238, 241). Đo mốc chính ở chế độ **ẩn danh** — tài khoản đã đăng nhập có cá nhân hoá, số đẹp giả. Nhịp: **hàng tháng**.
   - **IndexNow (mục 235) vốn đã đạt**: `bao-indexnow.js` chỉ gửi URL thật sự đổi nội dung, chặn URL ngoài miền, thử lại 3 lần,
     thoát khác 0 khi hỏng. ⚠️ Mã 200/202 chỉ là "đã nhận URL", KHÔNG phải đã crawl/đã index. Chưa gửi URL **bị xoá** — gỡ hẳn
     trang nào thì gửi tay `node scripts/bao-indexnow.js <url>`.
   - **Chờ sếp (cần đăng nhập, máy này không vào được)**: mục 234 xác minh Bing Webmaster Tools + gửi sitemap · mục 236 báo cáo
     Generative AI trong Search Console. Rà 16/09/2026: site **không** có dấu xác minh Bing nào (không `BingSiteAuth.xml`,
     không thẻ `msvalidate.01`, domain **0 bản ghi TXT**) — nhưng nếu sếp từng Import từ GSC thì hợp lệ mà không để dấu gì
     trên site, phải mở Bing Webmaster Tools mới biết.
   → Máy canh **R23**: chìa khoá IndexNow đúng 1 file + tên khớp nội dung + robots.txt không chặn nó · robots.txt còn mở cho
   Bingbot/GPTBot/OAI-SearchBot/ClaudeBot/PerplexityBot/Google-Extended (soi **mọi** khối trùng tên bot, không chỉ khối đầu) ·
   bộ câu hỏi khớp `bamCauHoi`, mã không trùng, `urlKyVong` có thật trong sitemap.

34. **Thẻ "Bài viết liên quan" chọn theo NGÀY ĐĂNG → 113/423 link dồn vào một bài, 30 thẻ rò ngôn ngữ** (16/09/2026).
   Hàm `buildRelatedPosts` cũ lấy "cùng chuyên mục, bài mới nhất trước". `an-vat-da-lat-buoi-toi` (30/07/2026) là bài mới
   nhất TOÀN SITE nên thắng ở cả hai đường: đứng đầu chuyên mục đông nhất (33 bài noindex "Ẩm thực Đà Lạt") **và** là bài
   lấp chỗ cho 13 bài thuộc "Mùa lễ hội" + "Check-in & Sống ảo" (hai chuyên mục KHÔNG có bài index nào). Kết quả đếm thật
   trên 141 file HTML: nó hứng **113/423 thẻ**, bài chủ lực `nuong-bbq-ngam-xe-lua` được **9**, `quan-nuong-da-lat-view-nha-long`
   được **3** → bài ăn vặt chợ đêm (nói về hàng quán khác, không nói về quán mình) thành hố link nội bộ lớn nhất site.
   Hàm cũng không lọc ngôn ngữ nên bài tiếng Việt trỏ sang bài tiếng Anh và ngược lại (30 thẻ).
   → Nay `data/dln-map.js` khai **bậc ý định** (thang O→C→P→R→A: tìm hiểu → chọn → tin → giá → đặt bàn) + chủ đề cho 18 bài
   đích; `chonBaiLienQuan()` chấm 0,65 chủ đề + 0,35 khoảng cách bậc, gán 3 vòng với **TRẦN CỨNG** (1,35 × phần công bằng,
   tính RIÊNG theo cụm ngôn ngữ). Không dùng hạn ngạch mềm/λ liên tục — đã cân nhắc và loại: trần một mình đủ kéo 113 → 42
   mà bỏ được toàn bộ độ nhạy tham số.
   Đo A/B cùng thước đo (bản cũ lấy từ git HEAD): link nhiều nhất **113 → 42** · thẻ đẩy khách LÊN bậc **107 (25,3%) → 208
   (49,8%)** · trang có ≥1 thẻ bậc cao hơn **65/141 → 134/141** · rò ngôn ngữ **30 → 0** · tự trỏ 0 · trùng 0 ·
   3 lần build ra hash y hệt · 0/141 bài đổi dấu vân nội dung (không bị đóng dấu "Cập nhật" oan).
   - ⚠️ **Hai trọng số 0,65/0,35 là chỗ NHẠY — đã đo, đừng vặn mò.** Đổi sang 0,60/0,40 làm **45/141 trang (31,9%)**
     đổi thẻ · 0,70/0,30 làm **27/141 (19,1%)** · 0,50/0,50 làm **105/141 (74,5%)**. Con số này đo ĐỘ RUNG chứ không đo
     chất lượng: các bảo đảm thật (không dồn cục, không rò ngôn ngữ, ≥90% trang có thẻ dẫn lên) do **R24** canh và vẫn
     đứng ở mọi mức trên. Nghĩa là trọng số là núm tinh chỉnh, không phải chỗ giữ cam kết — nhưng vặn một nhát là
     ~1/3 site vào `git diff`, nên vặn thì phải chạy lại R24 + đọc lại vài trang mẫu bằng mắt.
   - ⚠️ **`chonBaiLienQuan()` PHẢI chạy MỘT LẦN trước vòng ghi file.** Bộ đếm trần là trạng thái toàn cục; tính lại trong
     từng lần gọi thì trần không bao giờ chạm, kết quả khác hẳn mà KHÔNG chậm đi — tức sai lặng lẽ, không đồng hồ nào bắt.
   - ⚠️ **Hồ sơ bài nguồn theo thứ tự: `GHI_DE` → `DICH` → kế thừa canonical → bảng chuyên mục.** 95/123 bài noindex đã khai
     canonical sang một bài index trong `blog-seo.js` — đó là NGƯỜI biên tập tuyên bố "bài này nói cùng chuyện với bài kia",
     dùng nó thì chỉ còn 28 bài phải đoán (113/141 = 80% hồ sơ do người khai). Kế thừa là **HỢP**, không thay thế: bài
     Valentine gộp về `hen-ho-da-lat` vẫn phải giữ chủ đề `tiec` của chính nó.
   - ⚠️ **"Ẩm thực Đà Lạt" KHÔNG mặc định chủ đề `an-vat`.** Đã mở 28 bài dùng bảng chuyên mục ra đọc: 28/28 đều là bài CHỌN
     QUÁN NƯỚNG ("Quán Nhậu Đà Lạt", "Quán Nướng Mở Khuya", "Top 7 Quán Nướng View Đẹp"…). Gán `an-vat` cho chúng là đẩy
     thẳng về bài ăn vặt chợ đêm — đúng cái bệnh bản sửa này đang chữa.
   - ⚠️ **Luật từ khoá phải đủ hẹp — không máy canh nào bắt được lỗi này.** Bỏ dấu xong "Đánh **Giá Cao**" thành `danh gia cao`,
     chứa đúng chuỗi `gia ca` → bài về SỐ SAO bị gắn chủ đề giá rồi đẩy khách sang bảng giá (đã dính, vá bằng `gia ca(?!o)`).
     Chạy **`node scripts/kiem-dln-map.js --sai-lech`** để đọc bảng "bài | chủ đề được gán | chuỗi khớp" bằng mắt.
     Sửa một bài lệch thì khai vào `GHI_DE`, **đừng sửa bảng chuyên mục** — một dòng đó kéo theo hàng chục trang.
   - Cụm tiếng Anh chỉ có 2 bài index nên 2 trang EN còn 1 thẻ, 1 trang còn 2. `templates/blog-post.html` có rule
     `[data-so="1"]` / `[data-so="2"]` để lưới 3 cột không kéo giãn 1 thẻ hết 1000px.
     ⚠️ Thuộc tính `data-so` gắn vào `<div class="blog-related-grid">`, **TUYỆT ĐỐI không thêm gì vào
     `<section class="blog-related">`** — `cap-nhat-lastmod.js` dòng ~110 khớp chuỗi đó CHÍNH XÁC để loại khối này khỏi dấu
     vân; regex trượt là 141 bài bị đóng dấu "Cập nhật" + bắn IndexNow oan.
   - Thêm/bớt một bài blog làm ~30–40 file `blog/*.html` đổi khối thẻ (trần là trạng thái toàn cục) — **bình thường, cứ
     commit kèm**, giống ghi chú về 4 file `.woff2` ở mục Phông. Dấu vân đã loại khối này nên không trang nào bị đóng dấu.
   - `generate-blog-pages.js` nay **throw khi có bài lỗi** thay vì chỉ in ra. Lỗ này có từ trước: vòng ghi file bắt lỗi theo
     từng bài rồi chỉ `console.error`, build vẫn trả về 0 → file HTML **CŨ** của bài hỏng nằm nguyên trên đĩa, `git status`
     trông sạch ở đúng bài đó, và bản cũ lên thẳng production.
   → Máy canh **R24**: đích phải còn index THẬT (đọc lại `blog-seo.js`, **không suy** từ việc "có trong bảng") · không tự trỏ ·
   không trùng trong trang · không rò ngôn ngữ (đọc khoá `lang` trong bảng, không đoán theo tên file) · không đích nào quá
   **15%** tổng thẻ — cố ý là ngưỡng THÔ chứ không chép lại công thức trần, chép là đẻ thêm chỗ phải giữ đồng bộ tay ·
   `data-so` khớp số thẻ · **≥ 90% trang có thẻ dẫn lên bậc cao hơn** (thiếu mục này thì ai đó đổi bảng bậc làm tỉ lệ rơi về
   mức cũ 46% mà không ai kêu).
   - **Đích NGOÀI blog** (`DICH_NGOAI` trong dln-map.js), 2 trang:
     · `menu.html` — bậc R, **`lang: null`** nên phục vụ cả cụm Việt lẫn Anh (26 trang ẢNH, trung tính ngôn ngữ).
       Nhận **42/421 thẻ**. Nhờ nó 2 trang EN từ 1 thẻ lên 2 thẻ.
     · `duong-di/` — bậc A, **`lang: "vi"`** vì trang toàn chữ tiếng Việt (h1, hướng dẫn, FAQ). Nhận **4 thẻ**.
     ⚠️ Trang nhiều CHỮ phải khai đúng `lang`; chỉ trang gần như thuần ảnh mới để `null`. Đẩy khách đọc tiếng Anh
     vào trang tiếng Việt chỉ để đủ 3 thẻ là tối ưu con số, không tối ưu người đọc.
     Vì khối giờ có cả trang lẫn bài, tiêu đề đổi thành **"Gợi ý cho bạn" / "You might also like"** (`ui()` trong generator) —
     chữ đó nằm trong vùng bị gỡ khỏi dấu vân nên đổi được, đã kiểm.
   - ⚠️ **Mã chủ đề `di-lai` TÁCH khỏi `dat-ban` — đừng gộp lại.** Bản đầu nhét `duong di|do xe` chung vào `dat-ban`,
     nên bài "Quán Nướng Có Chỗ Đỗ Xe" / "Gần Trung Tâm" / "Gần Hồ Tuyền Lâm" chấm y hệt bài về đặt bàn, mà chúng đều
     mang thêm `nuong` nên `tip-chon-cho-ngoi-quan-nuong` luôn thắng. Kết quả: `duong-di/` chỉ được 3 thẻ và rơi vào 3 bài
     KHÔNG nói về đường đi (nhóm 10 người, team building, hoàng hôn). Tách mã xong nó về đúng 3 bài nói về vị trí/đỗ xe.
     **Thẻ đặt sai chỗ còn tệ hơn không có thẻ** — thêm đích mới thì phải mở ra xem nó rơi vào đâu, đừng chỉ đếm số.
   - ⚠️ **ĐỪNG thêm thẻ "Đặt bàn" trỏ `index.html#booking`** — đã thử rồi BỎ. `templates/blog-post.html` dòng ~119 đã có sẵn
     khối CTA nền đen nút vàng "Đặt bàn ngay →" nằm NGAY DƯỚI khối gợi ý, cùng màn hình. Thêm thẻ là nhân đôi cùng lời mời mà
     vẫn chiếm một suất: đo thật nó ăn 17 suất, kéo `team-building-da-lat` (bài index) từ 20 xuống **5** link.
     Khối gợi ý để dẫn tới trang CHƯA có lối vào rõ ràng — `menu.html` đúng loại đó, form đặt bàn thì không.
   - **GA4 cho cú bấm thẻ**: sự kiện `bam_the_goi_y` trong `js/lazy-tracking.js` (cuối file), kèm `link_url`, `link_text`,
     `o_thu` (1 = ô trái), `tu_trang`, `transport_type: 'beacon'`. Bắt ở giai đoạn **capture** và gọi `batPixel(false)` trước —
     chạm/rê chuột thường đã bật đủ 5 pixel (bug #9) nhưng khách dùng BÀN PHÍM thì chưa sự kiện nào nổ.
     ⚠️ Giữ `send_to: 'G-2VFBZDY6CD'`, thiếu là gtag gửi cả sang Google Ads. ⚠️ Không đọc thuộc tính bố cục trong handler.
     Phải đăng ký `o_thu`/`link_url` ở GA4 → Quản trị → Định nghĩa tuỳ chỉnh mới cắt báo cáo được, và chỉ tính từ lúc đăng ký.
   ⚠️ **Còn lại, chưa làm:** hai bài bậc O ít được trỏ nhất (`dac-san-da-lat-mua-ve`, `an-vat-da-lat-buoi-toi`) còn 3 link mỗi
   bài; cố ý **không** đặt "sàn" vì ép sàn là buộc phải chèn thẻ lạc đề. Hai bài EN vẫn chỉ 2 thẻ — đó là giới hạn DỮ LIỆU
   (site chỉ có 2 bài EN index), muốn 3 thẻ thì phải viết thêm bài tiếng Anh, không phải sửa bảng.

35. **Một cú bấm đếm hai lần · chuyển đổi bắn cả khi đơn rớt** (checklist #28 GTM, rà 17/09/2026).
   Site **KHÔNG dùng GTM** (0 chuỗi `GTM-` trong repo) nên 10 mục của checklist #28 phần lớn không áp
   dụng — nhưng luật 257 (trigger theo trạng thái thành công thật), 258 (hợp đồng dữ liệu) và 259 (PII)
   vẫn đúng cho cài gtag trực tiếp, và rà theo chúng thì ra 4 lỗi. 🟢 Đo trên production bằng Chrome
   (chặn bundle pixel, đọc hàng đợi `dataLayer`/`fbq.queue`/`ttq`), sửa xong đo lại trên bản local với
   webhook giả lập bằng CDP — công cụ để ở scratchpad, không vào repo.
   - **Bắn đôi ở 3 nút.** `initContactTracking()` trong `js/utils.js` bắt click ở cấp **document** cho
     MỌI `<a>` trỏ `tel:`/`zalo.me`. Ba nút mạnh nhất lại có bộ đếm riêng gắn thẳng vào chúng
     (`js/fab-contact.js` × 2, `#zaloQuickBook` trong index.html) → mỗi cú bấm đẻ ra **2 × Contact cho
     Meta và TikTok**, tức tín hiệu tối ưu quảng cáo phồng gấp đôi ở đúng chỗ ra khách. Bản cũ **đã**
     loại trừ `.fab-contact` cho RIÊNG link Facebook — biết bệnh mà chỉ vá một chỗ.
     → Nay loại trừ ở MỘT nơi, trước khi phân loại: `if (link.closest(CO_BO_DEM_RIENG)) return;`.
     ⚠️ **Thêm nút mới có `trackEvent` riêng thì phải khai selector vào `CO_BO_DEM_RIENG`** (js/utils.js),
     không thì nó lại đếm hai lần. R25 chặn.
     ⚠️ Nút "Đặt nhanh qua Zalo" đổi tên sự kiện GA4 `contact` → **`click_zalo`** (vị trí nằm ở
     `event_label`): bộ nghe chung không còn bắn hộ nó nữa, giữ tên cũ là nó rơi khỏi báo cáo click_zalo.
   - **`mode:'no-cors'` là thứ làm mình mù.** Với no-cors trình duyệt trả "opaque response": promise
     resolve **kể cả khi máy chủ trả 500 hoặc deployment đã chết**, `res.ok` luôn false, `status` luôn 0.
     Nên `try/catch` quanh nó chỉ bắt được lỗi MẠNG, và conversion Google Ads + Meta Lead vẫn bắn dù đơn
     rớt sạch — đúng kịch bản bug #4 (deployment sai quyền) từng gây ra, chỉ khác là lần đó số vẫn đẹp.
     🟢 Đo 17/09/2026: webhook Apps Script **có CORS thật** (GET → `type: "cors"`, đọc được thân JSON), và
     `Content-Type: text/plain` là "simple request" nên không sinh preflight → **bỏ `no-cors` đi là đọc
     được mã trả về, không phải đổi gì phía Apps Script**. ⚠️ Đừng thêm `no-cors` lại "cho chắc".
   - **Chuyển đổi chỉ bắn khi đơn lưu được.** `js/booking.js` tách hai cờ: `appOk` (app đặt bàn) và
     `sheetOk` (Apps Script). ⚠️ **Hai câu hỏi khác nhau, đừng gộp một cờ**: `webhookOk = appOk && sheetOk`
     quyết định có cảnh báo khách (chỉ cần Apps Script hỏng là nhân viên không nhận Telegram/Zalo, dù đơn
     đã nằm trong app); `daLuuDuoc = appOk || sheetOk` quyết định có đếm chuyển đổi. 4 trang dịp dùng
     `luuOk` = `res.ok`, và **mở Zalo trong MỌI trường hợp** — webhook hỏng thì tin nhắn Zalo là đường
     duy nhất còn lại để đơn tới quán (bản cũ gặp lỗi chỉ báo "gọi điện" rồi bỏ đó).
   - **`dip/sinh-nhat.html` xử lý form HAI LẦN.** Nó là trang dịp duy nhất nạp `js/booking.js`, mà file đó
     tự gắn handler submit vào `#bookingForm` — chú thích "Override booking form behavior" là **nhầm**:
     không thay thế gì cả, chỉ thêm bộ xử lý thứ hai. 🟢 Đo: mỗi đơn POST **2 lần** sang Apps Script +
     2 × conversion + 2 × Meta Lead. Đã gỡ thẻ script (sếp chốt 17/09) — 3 trang dịp kia vốn không nạp.
     Đánh đổi: mất bước kiểm SĐT 10 số của booking.js, ngang bằng 3 trang dịp kia.
   - 🟢 **PII sạch, không phải sửa** (mục 259): pixel chỉ nhận `num_guests`/`source`/`content_category`.
     Tên + SĐT chỉ đi tới webhook của quán và tin nhắn Zalo, không vào payload đo lường nào.
   - ⚠️ **Kịch bản "đơn rớt" vẫn hiện modal "Đặt bàn thành công"** ở trang chủ (hành vi có sẵn, chưa sửa —
     chờ sếp): khách đọc lời chúc mừng rồi bỏ đi, không nhắn Zalo. Chỉ có một toast lỗi kèm theo.
   - **Consent (mục 260) chưa có gì**: không cookie banner, không Consent Mode, chưa có trang chính sách.
     Nháp nằm ở `docs/nhap-chinh-sach-du-lieu.md` (soạn 13/09), chờ sếp duyệt. Clarity đang quay màn hình
     khách gồm cả lúc gõ form mà code không khai `data-clarity-mask` nào — mức che phụ thuộc hoàn toàn
     cấu hình trong dashboard Clarity, chỉ sếp mở xem được.
   - **Có nên chuyển sang GTM? KHÔNG** (em khuyến nghị, sếp chưa bác): điểm PageSpeed mobile 98 đang dựa
     vào việc pixel không chạy lúc tải (bug #9/#20/#24); nhét container GTM ~90 KB chạy sớm là phá đúng
     cơ chế đó. GTM đáng giá khi nhiều người sửa tag mà không được đụng code — ở đây git đã lo phần
     version/rollback tốt hơn, và GTM **không** chữa được lỗi bắn đôi (lỗi nằm ở hai bộ listener).
   → Máy canh **R25**: bộ nghe chung phải còn loại trừ `CO_BO_DEM_RIENG` · mọi nút có bộ đếm riêng phải
   nằm trong danh sách đó · 0 chỗ gửi đơn bằng `no-cors` · `conversion_event_submit_lead_form` phải nằm
   trong nhánh `if (luuOk)`/`if (daLuuDuoc)` · trang dịp không được vừa nạp booking.js vừa có handler
   submit inline. ⚠️ Luật **bỏ chú thích trước khi quét** — chính lời dặn "đừng dùng no-cors" cũng chứa
   chuỗi đó, quét thô là luật tự báo phạm lời dặn của mình (bài học bug #10).

## Trang tác giả — vỏ viết tay, danh sách bài sinh tự động
`tac-gia/nguyen-duy.html` (thêm 13/09/2026) là `author.url` của mọi bài có `author` trong
`data/blog-seo.js`. Google khuyến nghị author.url = "trang định danh duy nhất tác giả";
trước đó 18 bài index ghi "Nguyễn Duy" mà không trỏ đi đâu. Sếp xác nhận: người thật,
chưa có profile mạng xã hội → trang đặt trên site.
- **Vỏ trang** (head, CSS, pixel, lời mời ghé quán) viết tay theo khuôn `duong-di/`.
  Nav/footer do `generate-nav.js` + `generate-footer.js` nướng (tự nhận mọi file trong `tac-gia/`).
- **Hai vùng có mốc do `generate-blog-pages.js` ghi đè**: `TAC_GIA_JSONLD` (ProfilePage +
  BreadcrumbList) và `TAC_GIA_NOI_DUNG` (breadcrumb + tên/vai trò + thẻ bài). Sửa tay là mất.
- Generator đổi tên → slug (`Nguyễn Duy`/`Nguyen Duy` → `nguyen-duy`); **có file
  `tac-gia/<slug>.html` thì mới gắn**: Person trong BlogPosting thêm `@id` + `url`, byline
  thành link `rel="author"`, trang vào sitemap. Chưa có file thì bài giữ nguyên như cũ —
  máy KHÔNG tự đẻ trang. Thêm tác giả mới = chép vỏ trang đổi tên file rồi chạy build.
- ⚠️ **ProfilePage KHÔNG khai `dateModified`**: `cap-nhat-lastmod.js` ghi đè mọi
  `dateModified` của trang trong sitemap, generator mà cũng ghi là hai máy giật ngày qua lại
  (loại lỗi R13b canh). Ngày tạo nằm ngay trong mốc `TAC_GIA_JSONLD:START ngayTao=…`.
- ⚠️ **Tiểu sử KHÔNG tự viết.** Trang chỉ có tên, vai trò (từ blog-seo.js) và bài có thật.
  Sếp gửi vài dòng tiểu sử thật thì thêm vào vỏ trang (ngoài vùng mốc).
- Critical CSS của trang chép từ `duong-di/` → sửa phông lót trong `style.css` thì sửa cả
  file này (`kiem-phong-lot.js` đã soi nó).
- Máy canh: R7e mục (h) ProfilePage có mainEntity + name; mục (i) mọi `author.url` phải
  trỏ trang có thật và `@id` khớp ProfilePage trên trang đó.
- Crawl budget hẹp (~0,9 request khám phá/ngày, xem memory crawl budget) và trang chỉ có
  link từ byline blog → Google crawl chậm là bình thường; muốn nhanh thì Yêu cầu lập chỉ mục.

## hreflang — CHỈ khai trong sitemap.xml
Rà 13/09/2026 theo tài liệu Google (localized-versions): 2 bài tiếng Anh khai
`hreflang="en"` trong HTML nhưng sitemap khai `"vi"` cho chính URL đó (generator ghi
cứng) — hai nguồn đá nhau đúng ở 2 trang dành cho khách nước ngoài. 123 bài noindex
còn khai hreflang trỏ chính nó trong khi canonical trỏ bài khác.
- Nay chỉ còn MỘT nguồn: `sitemapUrl()` trong `generate-blog-pages.js`, mã theo `_lang`
  của bài. Google coi HTML / HTTP header / sitemap là tương đương, dùng nhiều cách
  "no benefit". **Đừng thêm `<link rel="alternate" hreflang>` vào HTML** — R13d chặn.
- Chưa trang nào có bản dịch ở URL riêng → mỗi cụm chỉ gồm chính nó + x-default, tức
  hreflang hiện KHÔNG định tuyến được gì. Nút EN trên trang chính đổi chữ bằng JS trên
  cùng URL: Google nhận ngôn ngữ từ chữ hiển thị (không từ `lang`/hreflang) nên chỉ
  thấy bản tiếng Việt. Muốn khách nước ngoài tìm thấy từ Google thì phải có URL tiếng
  Anh riêng, nội dung viết cho họ, rồi khai cụm HAI CHIỀU trong `sitemapUrl()`.
- R13d: không hreflang trong HTML · URL tự khai chính nó, mã khớp `<html lang>` · mọi URL
  trong cụm phải nằm trong sitemap (index được, canonical chính nó) · liên kết hai chiều.

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
- ⚠️ **Chú thích tiếng Việt trong `css/` `js/` `components/` CŨNG lọt vào bộ ký tự.**
  `cat-phong.js` cố ý quét thô để không sót chữ JS gán lúc chạy, nên nó không phân
  biệt được chú thích với nội dung thật. Hệ quả: viết comment có dấu là phông subset
  nhích lên vài chục byte, và `git status` hiện 4 file .woff2 đổi sau khi build —
  **đó là bình thường, cứ commit kèm**, đừng tưởng build hỏng. Chỉ đáng bận tâm nếu
  chú thích mang ký tự lạ (×, −, emoji) mà nội dung site không hề dùng.
- **Sau khi đổi phông hay đổi nhiều chữ → chạy `node scripts/kiem-phong-lot.js`.**

## Phông lót chống CLS — sửa thì sửa cả 6 chỗ
`css/style.css` khai 3 `@font-face` tên `*Fallback` (Inter / Dancing Script /
Playfair) trỏ vào phông máy sẵn có kèm `size-adjust`, để lúc phông thật chưa về
chữ vẫn chiếm đúng bề rộng → **không đổi số dòng → không nhảy layout**.
Đây mới là thứ chữa CLS; tự chứa phông (31/07) chỉ bỏ được chặng gstatic.
- Cả 3 khối này **được chép vào critical CSS inline** của `index/menu/blog/404/
  duong-di` — vì lúc dễ nhảy nhất là lúc CSS async chưa về. Sửa `style.css` mà
  quên 5 file kia là công cốc. (Từ 13/09/2026 thêm file thứ 6: `tac-gia/nguyen-duy.html`.)
- Bộ số **không được tự nghĩ**: tính từ bảng `cmap`+`hmtx` trong chính file
  `.woff2`, cân theo tần suất ký tự thật của trang (tiếng Việt lệch hẳn tiếng Anh).
- Đổi phông / đổi subset / đổi nhiều chữ hero → chạy `node scripts/kiem-phong-lot.js`
  (chạy tay, cần Arial+Georgia của Windows, KHÔNG nằm trong build).
- Cùng 6 file đó còn giữ rule **dựng chữ nhanh** (mốc `CHU-NHANH`, tắt kerning + ligature — bug #24).
  Gỡ hay đổi rule trong `style.css` thì đổi cả 6 bản inline, không thì chữ phông lót bị dựng lại lúc
  CSS async về. R8q canh.

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
