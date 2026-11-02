# Roadmap SEO 90 ngày — tramdungchill.vn

**Kỳ:** thứ Hai 26/10/2026 → Chủ nhật 24/01/2027 (13 tuần, đi hết mùa Noel → giáp Tết).
**Soạn:** 24/10/2026 · **Trạng thái:** đề xuất, chờ sếp Tuấn duyệt.
Độ tin: 🟢 đã đo / có nguồn · 🟡 ước tính · 🔴 chưa có số, phải đo.

---

## 0. Đọc trong 1 phút

Mục tiêu kinh doanh: **thêm đơn đặt bàn từ tìm kiếm trong mùa đông khách Noel → Tết.**
Web đã tốt về kỹ thuật (hơn 60 luật tự kiểm mỗi lần build). Ba thứ đang chặn là:

1. **Chưa đo được.** Số GSC tháng 9 em đã đọc từ Gmail (02/11: 442 lượt nhấp, giảm 44% so tháng 8 — xem mục 1); còn thiếu số
   tháng 10, số đơn đặt bàn từ web, và AI có nhắc quán không.
   Không đo thì sau 90 ngày không biết SEO có ra tiền hay không. → Tuần 1, việc của sếp (~35 phút).
2. **Chưa có trang nào bắt mùa lễ.** 0 trang đang lập chỉ mục nhắm Noel / tất niên / Tết. Bốn bài Noel / năm mới / Tết hiện có
   đều noindex, mà 3 bài trong đó còn canonical về bài *setup sinh nhật* (lệch ý định tìm kiếm). Google khám phá trang mới rất chậm
   (~0,9 lượt/ngày), nên trang Noel phải lên web **trước 15/11**.
3. **Không được để mất web.** Tên miền hết hạn **13/12/2026**, trúng giữa mùa Noel.

Thêm một việc kỹ thuật em làm được ngay: **INP điện thoại trượt lại** (248ms, ngưỡng 200ms), tệ nhất ở trang Thực đơn (364ms).

---

## 1. Mốc xuất phát (24/10/2026)

| Chỉ số | Số hiện có | Nguồn | Độ tin |
|---|---|---|---|
| Lượt nhấp Google / tháng | T5 388 · T6 777 · T7 800 · **T8 793** (12,9K hiển thị) | thư tổng kết của GSC | 🟢 |
| Lượt nhấp T9 | **442** (8,4K hiển thị) — **−44%** so T8; top trang: chủ 202 · menu 160 · săn tàu 55 | thư GSC 06/10, em đọc từ Gmail 02/11 | 🟢 |
| Lượt nhấp T10 | **chưa có** (thư GSC thường về ~06/11) | GSC | 🔴 |
| Truy vấn mang về nhấp | top T8 toàn tên quán ("tiệm nướng trạm dừng chill" 119, "trạm dừng chill" 83) | thư GSC | 🟢 |
| Điện thoại / máy tính | 584 / 206 lượt nhấp (T8) | thư GSC | 🟢 |
| URL đã lập chỉ mục | 8/26 (09/09); 15 trang "đã phát hiện – chưa lập chỉ mục" | GSC 09/09 | 🟢 cũ — số hiện tại 🔴 |
| Sitemap | **173 URL** = 25 trang gốc + 148 bản dịch (mới thêm 21/10) | sitemap.xml | 🟢 |
| Ngân sách khám phá trang mới | ~0,9 lượt/ngày | GSC Thống kê thu thập dữ liệu, 09/09 | 🟢 cũ |
| Core Web Vitals điện thoại (p75, 25/09–22/10) | LCP 2.012ms ✅ · **INP 248ms ❌** · CLS 0,01 ✅ → **trượt** (29/09 INP là 196, đạt) | CrUX API, `plans/crux/crux-2026-10-24.json` | 🟢 |
| Core Web Vitals máy tính | LCP 1.098 · INP 99 · CLS 0,00 → đạt | CrUX | 🟢 |
| Trang Thực đơn, điện thoại | **INP 364ms** (lần đầu có số riêng) — trang được nhấp nhiều thứ 2 (T8: 277) | CrUX | 🟢 |
| Đơn đặt bàn từ web / tháng | **chưa đọc được** | GA4 — cần `/quan-tri/` | 🔴 |
| AI có trích dẫn web quán không | **chưa đo lần nào** (bộ 20 câu đã sẵn) | `docs/do-hien-thi-ai/` | 🔴 |
| Bing Webmaster Tools | chưa thấy dấu xác minh nào trên site | rà 16/09 | 🟡 |
| Đánh giá Google | 4,8 · 7.344 lượt (đọc 18/10) | GBP | 🟢 |
| Lượng tìm kiếm từ khoá mùa lễ | **chưa có** — Google Ads MCP hết hạn mức ngày 24/10 | Keyword Planner | 🔴 |

---

## 2. Mục tiêu sau 90 ngày

**Em cam kết được (việc kỹ thuật, đo bằng máy):**

- INP điện thoại p75 **< 200ms** cho cả site và trang Thực đơn (CrUX có độ trễ 28 ngày → sửa xong trước 20/12 mới kịp hiện ở mốc 24/01).
- **25/25 trang gốc** ở trạng thái "đã lập chỉ mục" trong GSC (09/09 là 8/26).
- Trang chủ của **6 thứ tiếng** đã lập chỉ mục, cộng thêm `/en/menu.html`.
- 2 trang mùa lễ đã lên web và đã lập chỉ mục trước ngày diễn ra dịp đó.
- Đo độ hiển thị AI **3 lần** (cuối mỗi tháng), có nhật ký thật.

**Đặt số ở tuần 2, khi đã có số GSC tháng 9–10** — em không đặt bừa:

- Lượt nhấp **không** mang tên quán (đây mới là phần SEO tạo ra; lượt nhấp tên quán chủ yếu đến từ TikTok / truyền miệng).
- Số đơn đặt bàn mỗi tháng có nguồn là Google tự nhiên (organic).

---

## 3. Lịch 13 tuần

Ký hiệu người làm: **[Sếp]** cần tài khoản của sếp · **[Em]** em Claude · **[NV]** nhân viên.

### Giai đoạn 1 — Đo được, sửa nền, chuẩn bị mùa lễ (26/10 → 22/11)

**Tuần 1 (26/10 – 01/11)**
- [ ] **[Sếp, ~20 phút]** GSC → Hiệu suất, chọn kỳ **3 tháng**, xuất (nút Xuất → Google Sheets) các tab **Truy vấn · Trang · Thiết bị**.
      Thêm GSC → Lập chỉ mục trang → danh sách URL "Đã phát hiện – chưa lập chỉ mục" và "Đã thu thập – chưa lập chỉ mục". Gửi em.
- [ ] **[Sếp, ~15 phút]** Cài Apps Script thống kê theo `docs/thong-ke/HUONG-DAN.md`, gửi em URL `/exec`.
      → **[Em]** điền `DIA_CHI_MAC_DINH` trong `quan-tri/index.html`, build, push. Từ đó sếp xem số đơn ngay trên `/quan-tri/`.
- [ ] **[Em]** Đo INP trang Thực đơn trên điện thoại giả lập (lật trang, phóng to, bật loa) bằng
      `plans/cong-cu-do-hieu-nang/do-inp-loaf.js ?pixel_thu=1`, tìm script gây chậm.

**Tuần 2 (02/11 – 08/11)**
- [ ] **[Em]** Đọc số GSC → đặt 2 mục tiêu ở mục 2; soi từng URL chưa lập chỉ mục; đem quyết định **123 bài noindex**
      (phương án A/B/C để chờ số T9 từ 14/09, nay đã quá hạn) ra hỏi sếp kèm số.
- [ ] **[Sếp, ~10 phút]** Bing Webmaster Tools → **Import từ Google Search Console** → gửi `sitemap.xml`.
      (Bing là nguồn dữ liệu của ChatGPT Search và Copilot.)
- [ ] **[Sếp, ~10 phút]** GSC → thêm **Domain property** `tramdungchill.vn`. ⚠️ Từ 10/10 DNS nằm ở **Cloudflare**
      (NS `derek` / `maya`), nên thêm bản ghi TXT trong **Cloudflare → DNS**, không phải iNET như `docs/search-console.md` ghi.
- [ ] **[Sếp, ~5 phút]** GSC → Người dùng và quyền → thêm **chủ sở hữu thứ 2** (Gmail khác của quán).
- [ ] **[Sếp, trả lời tin nhắn]** Dữ kiện cho trang mùa lễ — em không tự nghĩ ra:
      1. Noel có món / chương trình riêng không? Quán có trang trí thật không, có ảnh không?
      2. Tiệc tất niên công ty: nhận tối đa bao nhiêu khách, cọc bao nhiêu, đặt trước mấy ngày?
      3. Lịch nghỉ Tết + giờ mở cửa các ngày Tết 2027?
      4. 8 câu người dịch phát hiện mâu thuẫn (set menu team building trái "gọi món lẻ", "món nướng rẻ nhất là Chân Gà",
         nước ngọt 12K, "dãy trong nhà", "kín bàn từ 16h", số chưa nguồn, giá Sườn Cay **259K hay 260K** trong bài tiếng Anh…).
         Câu team building cần chốt trước mùa tất niên.
- [ ] *(Tuỳ chọn)* **[Sếp]** mở Keyword Planner hoặc nâng hạn mức Pipeboard → em lấy lượng tìm kiếm "tất niên đà lạt",
      "noel đà lạt ăn gì", "tết đà lạt quán mở cửa"… trước khi viết.

**Tuần 3 (09/11 – 15/11)**
- [ ] **[Em]** Viết **trang mùa lễ #1 — Noel & tất niên ở Trạm** (lập chỉ mục, link từ mục Cẩm nang trên trang chủ để R30 canh,
      dịch 6 thứ tiếng). **Hạn lên web: 15/11.** Viết đúng luật quán: hoa nhựa, không nến, đêm 24/12 không phụ thu.
- [ ] **[Sếp, ~5 phút]** GSC → Kiểm tra URL → **Yêu cầu lập chỉ mục**: trang mới + trang chủ (để Google đọc link mới).
- [ ] **[Em]** Sửa INP trang Thực đơn theo kết quả tuần 1.
- [ ] **[Sếp]** Khoảng 13/11 Telegram báo nhắc gia hạn tên miền → **gia hạn ở iNET** (Cloudflare không nhận tên miền .vn).
      → **[Em]** sửa `HAN_TEN_MIEN` trong `scripts/giam-sat-uptime.js`.

**Tuần 4 (16/11 – 22/11)**
- [ ] **[Em]** **Trang mùa lễ #2 — Tết 2027**: nâng bài `dat-ban-quan-nuong-da-lat-tet` (đang noindex) lên lập chỉ mục,
      viết lại theo dữ kiện sếp gửi (phụ thu 10% Mùng 2–8, lịch nghỉ). **Hạn: 30/11.** Mùng 1 Tết là 06/02/2027.
- [ ] **[Sếp hoặc NV, ~60 phút]** Đo AI lần 1: hỏi 20 câu trong `docs/do-hien-thi-ai/cau-hoi-benchmark.json` trên
      **ChatGPT (cửa sổ ẩn danh)** và **Google (AI Overviews / AI Mode)**, chụp màn hình → em chấm và ghi nhật ký.
- [ ] **Mốc tháng 1 (~23/11):** em chạy `kiem-crux.js`, đọc `/quan-tri/`, so với mốc xuất phát.

### Giai đoạn 2 — Mùa Noel (23/11 → 20/12)

- [ ] **[Em] 01/12:** giao diện Noel tự bật → kiểm trên web thật (tuyết, thanh "Đặt bàn mùa Noel", CLS).
- [ ] **[NV, mỗi tuần ~15 phút]** Google Maps (GBP): 1 bài đăng/tuần về Noel / tất niên, link có UTM trỏ trang mùa lễ;
      trả lời đánh giá mới; đăng ảnh trang trí Noel thật nếu có. Với truy vấn "quán nướng Đà Lạt", khung bản đồ (local pack) mới là
      chỗ quán đơn lẻ cạnh tranh được — phần kết quả thường toàn bài tổng hợp của các trang lớn.
- [ ] **[Em]** Theo dõi trạng thái lập chỉ mục 2 trang mùa lễ + bản dịch. Trang mùa lễ chưa được lập chỉ mục sau 3 tuần → thêm link
      từ trang Thực đơn và các trang dịp (những trang Google ghé thường xuyên).
- [ ] **[Em]** Tháng 12 Singapore mở đường bay thẳng → kiểm `/en/` đã lập chỉ mục chưa; chưa thì nhờ sếp Yêu cầu lập chỉ mục.
- [ ] **Mốc tháng 2 (~21/12):** GSC + `/quan-tri/` + CrUX (INP đã sửa ở tuần 3 bắt đầu hiện) + đo AI lần 2.

### Giai đoạn 3 — Tết và Valentine (21/12 → 24/01)

- [ ] **[Em] Đầu tháng 1:** bổ sung mục **Valentine 2027** vào bài `hen-ho-da-lat` (đã lập chỉ mục — sửa trang cũ
      được Google ghé nhanh hơn viết trang mới). Valentine 14/02/2027.
- [ ] **[Em]** Cập nhật trang Tết theo lịch nghỉ thật nếu có thay đổi.
- [ ] **[Em] 22/01:** giao diện Tết tự bật → kiểm.
- [ ] **Mốc cuối (~24/01):** báo cáo 90 ngày so với mốc xuất phát + đo AI lần 3 + đề xuất 90 ngày tiếp theo.

---

## 4. Đọc số thế nào cho khỏi nhầm

| Nhịp | Ai | Xem gì |
|---|---|---|
| Thứ Hai hằng tuần, ~10 phút | Sếp | `/quan-tri/`: số đơn đặt bàn từ web, đơn đến từ đâu. Đối chiếu số dòng nguồn web trong Sheet "Dat Ban". |
| Cuối mỗi tháng | Em (sếp gửi số GSC) | GSC: lượt nhấp **có / không có tên quán**, trang đã lập chỉ mục · CrUX · đo AI · GBP: cuộc gọi, chỉ đường. |

Ba bẫy khi đọc số:
- **Từ 26/10 có quảng cáo Google tiếng Anh** trỏ vào bài `da-lat-restaurant-train-view-en`. Lượt vào bài đó sẽ tăng vọt do quảng cáo
  → khi đánh giá SEO chỉ đọc nguồn **organic**.
- **Từ 22/09 web thôi đếm đơn rớt và đơn trùng** → số chuyển đổi có thể giảm nhẹ so với trước. Đó không phải SEO kém đi.
- **CrUX trễ 28 ngày** — sửa INP xong phải ~4 tuần mới thấy số đổi. Đừng sửa thêm khi số chưa kịp cập nhật.

---

## 5. Cố ý KHÔNG làm trong 90 ngày

| Không làm | Vì sao |
|---|---|
| Viết thêm bài hàng loạt, mở lại 123 bài noindex | Ngân sách khám phá ~0,9 lượt/ngày đang phải chia cho 148 bản dịch mới. Cụm bài kiểu sản xuất hàng loạt là rủi ro sau đợt spam update 08/2026. |
| Thêm thứ tiếng thứ 7 | 148 URL dịch còn chưa được lập chỉ mục. |
| Chuyển sang GTM, thêm pixel / widget chat | INP đang trượt; thêm script lúc tải là đẩy nó tệ thêm. |
| Bật proxy Cloudflare (mây cam) từ 01/12 tới hết Tết | Đổi hạ tầng giữa mùa đông khách thì rủi ro lớn hơn lợi. Lợi chính của nó là TTFB, mà TTFB không được tính vào Core Web Vitals. Để sau Tết. |
| Mua backlink, trả thêm bài PR chỉ để có link | Đo trước hiệu quả 5 bài PR tháng 9 (nguồn `referral`, chiến dịch `pr_*` trong GA4). |
| Sửa `lastmod` để "giục" Google | Khai man tín hiệu; máy đóng dấu ngày chỉ đổi ngày khi chữ thật sự đổi. |

---

## 6. Gom việc chỉ sếp làm được

| Khi nào | Việc | Thời gian |
|---|---|---|
| Tuần 1 | Xuất số GSC 3 tháng + danh sách URL chưa lập chỉ mục | 20 phút |
| Tuần 1 | Cài Apps Script `/quan-tri/`, gửi URL `/exec` | 15 phút |
| Tuần 2 | Bing Webmaster (Import từ GSC) | 10 phút |
| Tuần 2 | GSC Domain property (TXT ở **Cloudflare**) + chủ sở hữu thứ 2 | 15 phút |
| Tuần 2 | Trả lời dữ kiện mùa lễ + 8 câu mâu thuẫn | 15 phút |
| Tuần 3 | Gia hạn tên miền ở iNET (hạn chót 13/12) | 10 phút |
| Tuần 3–4 | Yêu cầu lập chỉ mục 2 trang mùa lễ | 5 phút |
| Mỗi thứ Hai | Đọc `/quan-tri/` | 10 phút |
| Cuối mỗi tháng | Gửi em số GSC; đo AI (hoặc giao NV) | 30–60 phút |

Tổng ngoài việc hằng tuần: **~1,5 giờ trong 90 ngày.**
