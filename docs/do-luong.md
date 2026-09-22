# Sổ đo lường — tramdungchill.vn

> Chủ sở hữu: **sếp Tuấn** (Nguyễn Hồng Tuấn). Cập nhật lần cuối: **19/09/2026** (checklist #30).
> Đổi bất cứ sự kiện, pixel hay trang nào trong sổ này thì ghi một dòng vào **Nhật ký thay đổi** ở cuối.
> Mức tin cậy: 🟢 đã đo · 🟡 suy ra · 🔴 chưa kiểm được từ máy này.

## 1. Công cụ nào, để quyết định gì

Site **không dùng GTM**; bắn thẳng bằng gtag / fbq / ttq, nạp hoãn qua `js/lazy-tracking.js`
(pixel chỉ bật khi khách chạm/cuộn, hoặc sau khi tải xong 6 giây — xem CLAUDE.md bug #9, #20).

| Công cụ | Mã | Phục vụ quyết định |
|---|---|---|
| GA4 | `G-2VFBZDY6CD` (Google tag `GT-5TCMZQ6G`) | Khách đến từ đâu, trang nào ra đơn |
| Google Ads | `AW-18038463990` (Google tag `GT-KD7KTVK9`) | Tối ưu / trả tiền quảng cáo Google |
| Meta Pixel | `1281459450582041` | Tối ưu + remarketing quảng cáo Facebook/Instagram |
| TikTok Pixel | `D7IFUA3C77U3A048FDR0` ("TDC Booking Pixel") | Tối ưu + remarketing TikTok Ads |
| Microsoft Clarity | `w9j3jz5uxj` | Heatmap / bản quay để sửa giao diện (xem mục 7) |

🟢 Hai Google tag là hai tag RIÊNG. Trang dịp không khai `AW-` nhưng chuyển đổi vẫn tới Google Ads qua
liên kết GA4 ↔ Ads (hit `/measurement/conversion`), và trang chủ chỉ gửi **một** hit đó — không đếm đôi.

## 2. Phạm vi — trang nào gắn, trang nào không

- **Gắn đủ 5 công cụ:** trang chủ, menu, blog, 141 bài blog, 4 trang dịp, 404.
  404 cố ý giữ: nhờ GA4 ghi trang 404 mà biết link hỏng từ đâu tới.
- **Không Clarity:** `duong-di/`, `tac-gia/nguyen-duy.html` — chưa từng gắn (bỏ sót, không phải quyết
  định). Chờ sếp: có cần heatmap trang đường đi không?
- **Không gắn gì (cố ý):** `review-qr.html` (trang in QR cho nhân viên — mã QR trỏ thẳng tới trang viết
  đánh giá Google, khách không bao giờ vào), `dev/utm-builder.html`, `components/*`, file xác minh Google.
- **Máy làm việc** (localhost, 127.x, mạng LAN, file://): `lazy-tracking.js` không bật pixel.
  Công cụ đo cần pixel thật thêm `?pixel_thu=1` và PHẢI tự chặn hit gửi đi.
- 🟢 Meta Pixel còn bật **Traffic Permissions** (danh sách domain được phép): xin cấu hình với
  domain `127.0.0.1` là nhận `blockReason: traffic_permissions`. GA4, TikTok, Clarity không có lớp này.

### Loại máy nội bộ (chủ quán, nhân viên)

Mở **một lần** trên mỗi điện thoại / máy tính của người trong quán:

```
https://tramdungchill.vn/?noi_bo=1
```

Từ đó máy đó không bật pixel nào nữa (lưu trong trình duyệt), kể cả khi nhân viên đặt bàn thử — đơn
thử không bị đếm là chuyển đổi. Bỏ đánh dấu: `?noi_bo=0`. Xoá dữ liệu trình duyệt thì phải mở lại.
Lọc "lưu lượng nội bộ" theo IP của GA4 không dùng được cho điện thoại 4G (đổi IP liên tục).

## 3. Hợp đồng sự kiện

"Vi mô" = tín hiệu ý định, KHÔNG phải lead. "Vĩ mô" = lead đã vào hệ thống.

| Sự kiện | Nền tảng | Bắn khi | Tham số | Loại |
|---|---|---|---|---|
| `page_view` / `PageView` / `Pageview` | GA4 · Meta · TikTok | pixel bật (chạm/cuộn đầu hoặc load+6s) | — | nền |
| `ViewContent` | Meta | cùng lúc PageView ở menu, trang dịp, bài blog | `content_name`, `content_category` | vi mô |
| `click_phone` / `click_zalo` / `click_facebook` / `click_directions` | GA4 | bấm link tel / zalo.me / facebook / Maps | `event_category=contact`, `event_label` = vị trí (`page_link`, `fab`, `booking_zalo_quick`) | vi mô |
| `Contact` | Meta · TikTok | bấm link tel / zalo.me (MỖI cú bấm đúng 1 lần — bug #35) | `content_category` / `content_type` | vi mô |
| `bam_the_goi_y` | GA4 | bấm thẻ "Gợi ý cho bạn" cuối bài | `link_url`, `o_thu`, `tu_trang` | vi mô |
| `LCP` `INP` `CLS` `TTFB` | GA4 | sau khi pixel bật (đo khách thật) | `metric_rating`, `nhom_trang`, `debug_*` | kỹ thuật |
| `conversion_event_submit_lead_form` | GA4 (key event) → Google Ads | **đơn đã lưu được** (mục 4) | — | **vĩ mô** |
| `generate_lead` | GA4 (+ tag Ads) | cùng lúc trên, chỉ trang chủ | `event_label` = nguồn, `guests`, `occasion` | vĩ mô (không phải key event) |
| `Lead` | Meta | cùng lúc trên | `num_guests`, `source`; `eventID` = `tdc_<thời gian>_<ngẫu nhiên>` (chỉ trang chủ) | **vĩ mô** |
| `CompleteRegistration` | TikTok | cùng lúc trên, chỉ trang chủ | `quantity`; `event_id` trùng `eventID` của Meta | **vĩ mô** |

Sự kiện TỰ ĐỘNG do dashboard bật (không có trong code, đừng chọn làm mục tiêu tối ưu):
GA4 `form_start` / `form_submit` / `scroll` / `click` (outbound) · Meta `SubscribedButtonClick` ·
TikTok `Click`, `EngagedSession`, `LandingPageView`. `form_submit` nổ cả khi form báo thiếu ô.

🟢 Key event đang đánh dấu trong GA4 (đọc từ container 19/09): `conversion_event_submit_lead_form`,
`purchase`, `qualify_lead`, `close_convert_lead`. Hai cái sau chưa có gì gửi (xem mục 8).

**Không bao giờ** đưa tên, số điện thoại, ghi chú của khách vào tham số sự kiện. Tên + SĐT chỉ đi tới
webhook của quán (app đặt bàn + Apps Script) và tin nhắn Zalo. R27 canh.

## 4. Khi nào một đơn được đếm là lead

`js/booking.js` (trang chủ) gửi hai đường: app đặt bàn và Apps Script (Sheet + Telegram + Zalo nhóm).

- Đếm khi **ít nhất một đường thật sự ghi được** — và đơn đó không phải đơn trùng.
- ⚠️ **Apps Script luôn trả HTTP 200**, kể cả khi bên trong lỗi (thân `{"status":"error"}`). Phải đọc
  thân trả lời; chỉ `res.ok` là đếm cả đơn rớt (đã dính tới 19/09/2026).
- App trả `deduped: true` = cùng khách gửi lại trong 5 phút → không đếm lần hai.
- Cả hai đường chết → không đếm, khách được nhắc nhắn Zalo (Zalo luôn được mở).
- Trang dịp chỉ gửi Apps Script (app nhận qua Apps Script chuyển tiếp), cùng luật đọc thân trả lời.
- Máy đã đánh dấu nội bộ (mục 2) không bật pixel → đơn thử không đếm.

Còn thiếu (chờ sếp): trang dịp chưa bắn `generate_lead` / `CompleteRegistration` và Lead chưa kèm
`eventID` (sếp chốt 17/09 chỉ sửa điều kiện thành công) · chưa có honeypot chống spam.

## 5. Dữ liệu cá nhân

- 🟢 Đo 19/09 (Chrome, chặn mọi hit): 0 hit GA4 / Ads / Meta / TikTok mang tên hay SĐT khách, ở cả 8
  kịch bản. Gói Clarity nén nhị phân nên không soi được.
- Form đặt bàn (trang chủ + 4 trang dịp) mang `data-clarity-mask="True"` → che trong bản quay Clarity
  bất kể dashboard để chế độ nào. 🟡 Dashboard hiện để mặc định (cấu hình tag `"content":true`, không
  danh sách mask/unmask — khớp chế độ Balanced).
- URL có `?name=` / `?phone=` / `?note=` / `?email=` (form rơi về gửi GET khi JS đặt bàn không chạy):
  `lazy-tracking.js` gỡ trước khi pixel đọc. Trước 19/09, 🟢 cả 4 nền tảng nhận NGUYÊN VĂN.
  `date` / `time` / `guests` cố ý để lại — thấy chúng trong báo cáo trang GA4 = JS đặt bàn đã hỏng.
- 🟢 Cấu hình dashboard đọc được từ ngoài (19/09):
  - Meta: **tắt** Automatic Advanced Matching; bật sự kiện tự động (gửi chữ trên nút + tên ô form,
    không gửi giá trị ô).
  - Google tag (cả GA4 lẫn Ads): **bật** "tự động thu thập dữ liệu người dùng cung cấp" (email / SĐT /
    địa chỉ). Lượt đo không thấy dữ liệu nào bị gửi (form không có ô email) nhưng công tắc đang mở.
  - TikTok: **bật** Advanced Matching cho email, SĐT, họ tên, địa chỉ. Lượt đo chỉ thấy `anonymous_id`.
  - Clarity: đặt cookie 365 ngày, chưa có tín hiệu đồng ý (Consent API).
- Site chưa có banner đồng ý, chưa có trang chính sách dữ liệu. Nháp: `docs/nhap-chinh-sach-du-lieu.md`.

## 6. Kiểm thử

| Khi nào | Lệnh | Kiểm gì |
|---|---|---|
| Mỗi lần build | `node scripts/seo-geo-verify.js` | R25 (đếm một lần, không no-cors) · R27 (phạm vi, PII, đọc thân Apps Script, form che Clarity) |
| Trước khi push đổi JS/form | `node scripts/kiem-do-luong-live.js --cuc-bo` | Chạy bản trên máy trong Chrome, 8 kịch bản, 63 mục |
| Sau khi Pages deploy | `node scripts/kiem-do-luong-live.js` | Như trên nhưng chấm production |
| Hằng tuần (sếp) | xem mục 8 | Đối soát số đơn Sheet ↔ GA4 ↔ Ads ↔ Meta |

Công cụ live **không gửi gì ra ngoài**: Chrome bị cấm phân giải mọi tên miền trừ site, hit bị chặn tại
chỗ, webhook được giả lập. Không đơn nào tới quán, không Telegram nào nổ.
Kết quả 19/09/2026: production 16/17 (trượt đúng mục "Apps Script báo lỗi vẫn đếm") · bản sửa 63/63.

## 7. Heatmap — mỗi lần xem phải có câu hỏi

Mẫu ghi trước khi mở Clarity:

> **Câu hỏi:** … · **Trang/khuôn:** … · **Thiết bị:** điện thoại / máy tính (tách riêng, không gộp) ·
> **Từ ngày:** … (sau lần đổi giao diện gần nhất) · **Đủ khi:** ≥ 300 phiên của đúng nhóm đó ·
> **Quyết định nếu đúng / sai:** …

Ba câu hỏi đáng hỏi trước (🟡 đề xuất):
1. Điện thoại, trang chủ: khách bỏ form ở ô nào? (Clarity lọc trang `/` + thiết bị Mobile, xem
   dead click / rage click trong `#booking`). Quyết định: bớt ô hay đổi thứ tự.
2. Menu: bao nhiêu phiên lật quá trang 3 của sách menu? Quyết định: có đưa món chủ lực lên trang đầu.
3. Trang dịp: khách cuộn tới form hay bấm Zalo sớm? Quyết định: đặt nút Zalo lên hero hay giữ form.

⚠️ Dữ liệu Clarity trước 19/09/2026 lẫn phiên của nhân viên (trang in QR) và máy làm việc. Trang chủ
có hai bản tiếng Việt / tiếng Anh cùng URL, cùng bố cục — gộp được; điện thoại và máy tính thì không.

## 8. Việc chờ sếp (cần đăng nhập, máy này không làm được)

- [ ] Mở `?noi_bo=1` trên máy của sếp và nhân viên (mục 2).
- [ ] Meta Events Manager: pixel thuộc đúng Business của quán; Test Events thử 1 đơn thật; xem
      Traffic Permissions đang cho những domain nào; mục Overview ghi "Browser" hay có cả "Server".
- [ ] Nếu app đặt bàn ĐÃ gửi Conversions API: báo em — trang dịp phải thêm `eventID` trước, không thì
      Meta đếm đôi. CLAUDE.md đang ghi "CAPI chưa cài".
- [ ] TikTok Events Manager: pixel thuộc đúng tài khoản quảng cáo (cấu hình trả về `advertiserID: "0"`);
      quyết giữ hay tắt Advanced Matching.
- [ ] Google tag: quyết giữ hay tắt "thu thập dữ liệu người dùng cung cấp tự động". Giữ thì chính sách
      dữ liệu phải nói rõ.
- [ ] GA4 → Quản trị → Thu thập dữ liệu → Che dữ liệu: thêm tham số `name, phone, note` (lớp chặn thứ hai).
- [ ] GA4 → Thông tin chi tiết tuỳ chỉnh: cảnh báo khi `conversion_event_submit_lead_form` = 0 trong
      3 ngày liền. Meta / TikTok: bật thông báo chẩn đoán sự kiện qua email.
- [ ] Clarity → Settings: xem Masking (nên để Balanced hoặc Strict), chặn IP wifi của quán.
- [ ] Hằng tuần: số dòng Sheet "Dat Ban" nguồn web ↔ GA4 key event ↔ Google Ads ↔ Meta Lead. Lệch >
      20% hai tuần liền thì chạy `kiem-do-luong-live.js` và báo em.
- [ ] Duyệt nháp chính sách dữ liệu + quyết banner đồng ý (Clarity Consent API, Google Consent Mode).
- [ ] Muốn đếm lead THẬT (khách đã đến): khi nhân viên đổi trạng thái "Da den" trong Sheet, Apps Script
      gửi `close_convert_lead` về GA4 — GA4 đã có sẵn key event này, cần lưu `client_id` lúc đặt bàn.

## Nhật ký thay đổi

| Ngày | Ai | Đổi gì | Commit / CLAUDE.md |
|---|---|---|---|
| 17/09/2026 | em Claude, sếp duyệt | Contact không đếm đôi · bỏ `no-cors` · conversion chỉ khi đơn lưu được · gỡ booking.js khỏi trang sinh nhật | `371c5493` · #35 |
| 19/09/2026 | em Claude | Đọc thân trả lời Apps Script · bỏ đếm đơn trùng · gỡ tên/SĐT khỏi URL · chặn pixel máy làm việc + `?noi_bo=1` · gỡ pixel `review-qr.html` · che form trong Clarity · R27 + `kiem-do-luong-live.js` | #37 |
