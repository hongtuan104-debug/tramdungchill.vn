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
- **Đánh giá:** 4,8/5 sao · **6.889 lượt** (GBP, xác nhận 30/07/2026 — PR #14)
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
