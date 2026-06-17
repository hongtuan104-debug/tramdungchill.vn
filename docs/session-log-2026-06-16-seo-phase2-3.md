# Nhật ký phiên: SEO/AEO tramdungchill.vn — Phase 2 + Phase 3

**Ngày làm:** 2026-06-16 (chốt + đẩy log 2026-06-17)
**Người làm:** Claude (em) cho sếp Tuấn — chủ Tiệm Nướng Trạm Dừng Chill (Đà Lạt)
**Repo:** hongtuan104-debug/tramdungchill.vn (website TĨNH, GitHub Pages, deploy = push `main`)
**Bối cảnh:** tiếp nối Phase 1 (đã LIVE `db0e2c3`). Mục tiêu: để Google + ChatGPT/Gemini/Claude/Perplexity **đề xuất quán** khi khách hỏi tự nhiên (AEO) + lên top Google (SEO).

---

## 1. Phase 2 — Đào sâu nội dung (đòn bẩy AEO lớn nhất) ✅ LIVE `bc2b667`

Owner duyệt 3 lựa chọn (qua AskUserQuestion): **13 trụ cột** + **ẩn mạnh tay 122 bài mỏng** + **ẩn hẳn 9 bài "bịa tiện ích"**.

### Kiến trúc (QUAN TRỌNG để bảo trì)
- **KHÔNG sửa trực tiếp `data/blog-data.js`** (486KB, 142 bài gốc — giữ nguyên, tránh vỡ).
- Tạo **`data/blog-seo.js`** = 1 nguồn duy nhất chứa:
  - `pillars{}`: nội dung 13 trụ cột (title/excerpt/body/faq/author/dateModified/lang; bài MỚI thêm category/date/image).
  - `noindex{}`: map 122 id bài cũ → id trụ canonical (`""` = ẩn hẳn, không canonical).
- `scripts/generate-blog-pages.js` **GỘP** file này lên blog-data lúc build: merge body trụ cột, append trụ MỚI, set `indexable`/`canonical` cho mọi bài.
- **Revert dễ:** xoá entry trong blog-seo.js là bài về như cũ.
- `data/blog-data-light.js` giờ **auto-sinh** bởi generator (chỉ bài còn index → trang blog index gọn 21 bài). **ĐỪNG sửa tay.**

### Generator/template thêm mới
- Template `templates/blog-post.html`: placeholder `{{ROBOTS}}` `{{CANONICAL_HREF}}` `{{HREFLANG_LANG}}` `{{JSON_LD_FAQ}}` `{{BYLINE}}` + CSS khối FAQ.
- Generator: hàm `faqSchemaBlock` / `faqHtml` / `bylineHtml`; `blogPostingSchema` đổi author → **Person** khi có `_author` (E-E-A-T) + `dateModified`.
- **Sitemap chỉ xuất `date<=hôm nay && indexable`** → SỬA bug 97 bài drip-2027 lọt sitemap. Còn 15 URL blog chất lượng.

### 13 trụ cột (mỗi bài ~1.100–1.290 từ, 6 FAQ, bảng dữ liệu thật, tác giả Person)
top-quan-nuong-da-lat · nuong-bbq-ngam-xe-lua · quan-nuong-da-lat-view-nha-long · setup-sinh-nhat-mien-phi-da-lat · hen-ho-da-lat · team-building-da-lat · an-nuong-da-lat-bao-nhieu-tien · lau-nuong-da-lat-mua-lanh · mon-nuong-ngon-nhat-da-lat · lich-trinh-da-lat-3-ngay-2-dem · da-lat-mua-nao-dep-nhat · **da-lat-cho-nguoi-nuoc-ngoai (EN)** · **da-lat-restaurant-train-view-en (EN, VIẾT MỚI)**.

### Quy trình sản xuất = 4 workflow đa-agent
1. Phân tích 142 bài → đề xuất pillar/prune (verify id, không xung đột).
2+3. Viết 13 trụ cột (4 bài rớt do server rate-limit → workflow bù).
4. **Fix trung hoà.** ⚠️ Lớp **verify chống-bịa BẮT NHIỀU LỖI THẬT:** agent hay BỊA tên+giá quán đối thủ trong bảng so sánh ("Buffet Đồi Thông ~159K", "K-BBQ ~199K", "BBQ Garden"...), claim chưa kiểm chứng ("10 phút đến chợ đêm", "xe lạnh chở hải sản", "menu tiếng Anh", "món gọi nhiều nhất"). → ĐÃ trung hoà: bảng so sánh chỉ mô tả LOẠI quán, KHÔNG nêu tên/giá đối thủ cụ thể.
- **Dữ kiện ép xác minh (chống bịa):** `D:\Projects\blog-facts-tdc.md` (menu 73 món+giá thật; giờ tàu Đà Lạt–Trại Mát rời ga 14:30·15:30·16:30·17:30, qua quán +20–25′, cuối tuần thêm 18:30·19:30; USP). Artifact tạm (ngoài repo, không commit): `D:\Projects\{blog-catalog-tdc.json, pillar-packs/, pillar-final/}`.

### Verify đã PASS (cả local + GPTBot trên web thật)
13 trụ: JSON-LD hợp lệ + FAQPage + tác giả Person + bảng + FAQ render; bài noindex `noindex,follow` + canonical về trụ; sitemap 15 URL; 0 tên đối thủ bịa.
⚠️ GSC mấy tuần tới báo ~122 trang "Excluded by noindex" = **bình thường, lành mạnh**.

---

## 2. Byline tác giả → bút danh ✅ LIVE `2cb0858`
Owner KHÔNG muốn lộ tên thật cho đối thủ. → 13 trụ cột dùng bút danh **"Nguyễn Duy · Chủ tiệm nướng Trạm Dừng Chill"** (EN: "Nguyen Duy"). Verify live: 0 vết tên thật.

---

## 3. Phase 3 — Off-site + đo lường (bắt đầu)

### Đã làm trên web ✅ LIVE `c07c335`
- **Khai báo tên phụ "Tiệm Nướng & Chill Xóm Lèo" + "Xóm Lèo"** (`alternateName` mảng) vào Restaurant schema: sửa `data/schema-data.js` (nguồn) + `scripts/generate-menu.js` (xuất `r.alternateName`) + inline `index.html`. → Google/AI hiểu **Xóm Lèo = Trạm Dừng Chill = cùng quán**, hứng search "Xóm Lèo" mà KHÔNG cần nuôi xomleo.vn. (Owner duyệt qua AskUserQuestion.)

### Baseline đo lường (brave search, mốc "TRƯỚC" 16/6)
- "Trạm Dừng Chill Đà Lạt" (thương hiệu) → tramdungchill.vn **#1**.
- "quán nướng Đà Lạt view đẹp" + "best BBQ Da Lat train view" → **CHƯA lên trang 1** (toàn listicle PasGo/VinWonders/Vinpearl/TripAdvisor + đối thủ "Chuyến Tàu Hoàng Hôn"; bản EN có xomleo.vn/en). Bình thường — chờ Google/AI recrawl 13 trụ cột vài tuần.
- **Phát hiện "loạn tên":** quán bị gọi cả "Trạm Dừng Chill" lẫn "Xóm Lèo"; có homestay `tramdungchill.com` + 1 hotel trùng tên (≠ quán) gây nhiễu.
- **Chốt số liệu:** TikTok @tiemnuongtramdungchill = 76.5K follower → "76.000 followers" ĐÚNG. "12.9M views" chưa verify được public (owner xem TikTok Analytics). Bio TikTok còn ghi "P11" → cần đổi "Phường Xuân Trường".

### Việc OWNER tự làm (đã đưa nội dung copy-paste trong chat)
1. **Google Business Profile**: mô tả "từ doanh nghiệp" (gồm "còn gọi Xóm Lèo"), category BBQ/Korean + Lẩu/Hải sản, bật Q&A seed CÙNG bộ FAQ web, ảnh mới/tuần, link đặt bàn `/#booking`.
2. Đồng bộ NAP: sửa bio TikTok "P11"→"Phường Xuân Trường" (+ FB/IG).
3. Review: in QR `review-qr.html` để bàn.
4. Citation: xin có mặt/cập nhật trên PasGo/Foody/TripAdvisor (nhiều listicle đã nhắc tên "Xóm Lèo").

### Đo lường lặp ✅ ĐÃ ĐẶT LỊCH CLOUD
Routine `trig_01YKnun4XM18VJnCzbwmSrQM` — "Kiểm tra AEO/SEO tramdungchill.vn hằng tháng", cron `0 2 14 * *` (09:01 VN ngày 14 hằng tháng, **lần đầu 14/7/2026**), sonnet-4.6, chỉ-đọc: tự WebSearch 6 truy vấn khách → báo lên-top-chưa / có-nêu-tên(cả Xóm Lèo) / info-đúng-sai / cite-web + kiểm GPTBot đọc giá + so baseline + cảnh báo AI nói sai. Quản lý: https://claude.ai/code/routines/trig_01YKnun4XM18VJnCzbwmSrQM (brave-search không phải connector cloud → routine dùng WebSearch built-in).

---

## 4. Commit phiên này (đều trên `main`, đã push + GitHub Pages deploy)
- `bc2b667` — Phase 2: 13 trụ cột AEO + gộp/ẩn 122 bài mỏng (148 file).
- `2cb0858` — đổi byline → bút danh Nguyễn Duy.
- `c07c335` — thêm tên phụ Xóm Lèo vào schema.

## 5. Bẫy / bài học
- Workflow viết nhiều bài cùng lúc dễ dính **server rate-limit** → chia nhỏ hoặc workflow bù.
- LLM viết content rất hay **bịa tên/giá đối thủ** dù đã dặn → BẮT BUỘC có lớp verify đối chiếu tờ dữ kiện + bước fix trung hoà.
- `menu.html` bị `generate-menu.js` ghi đè phần giữa marker → sửa schema phải sửa ở `data/schema-data.js` + generator, KHÔNG sửa tay menu.html.
- Bash cwd hay reset về D:\Projects → cd vào repo mỗi lệnh.

## 6. Kế tiếp
- Owner làm checklist Phase 3 off-site (GBP/NAP/review/citation).
- Routine 14/7 = báo cáo tiến độ AEO đầu tiên.
- Phase 2 mở rộng (nếu muốn): viết tiếp các bài trụ cột phụ, hoặc xử nốt ~8 bài "phễu" còn giữ tạm.
