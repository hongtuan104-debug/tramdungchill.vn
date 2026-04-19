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
- **Địa chỉ:** 111 Huỳnh Tấn Phát, P11, TP Đà Lạt, Lâm Đồng
- **SĐT:** 0989.765.070
- **Giờ mở cửa:** 15:00 - 23:00
- **USP chính:** Hoàng hôn 15h, nhà lồng đèn 18h30, bò tảng phô mai trứng muối
- **Giá:** 95k - 300k/người, ~100 món BBQ + lẩu + hải sản
- **Đánh giá:** 4.8/5 sao

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

## Bug đã fix (đừng làm lại)
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
