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
- Ảnh gốc **không commit** (đã gitignore) — chỉ bản WebP 560/1000/1600 + thumb 200 lên web
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
   - Đo A/B khi PageSpeed API hết lượt (429, hạn mức ngày reset ~15h giờ VN): Lighthouse trong
     `npm-cache/_npx/5390d7d89c0de19d` + bản sao `git worktree` của commit cũ phục vụ ở cổng khác, chạy xen kẽ
     3 lượt, so trung vị. Điểm tuyệt đối trên máy này thấp hơn PageSpeed nhiều — chỉ dùng để so trước/sau.

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
