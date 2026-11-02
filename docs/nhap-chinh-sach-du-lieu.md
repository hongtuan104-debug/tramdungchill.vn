# Chính sách dữ liệu cá nhân + dòng thông báo dưới form — nháp gốc (đã đăng 02/11/2026)

> **Trạng thái: ĐÃ ĐĂNG 02/11/2026** tại https://tramdungchill.vn/chinh-sach-du-lieu/ (sếp chốt cùng ngày: không nhắn khuyến mãi, "bấm gửi = đồng ý", giữ 12 tháng, email lienhetramdungchill@tramdungchill.vn, trả lời 7 ngày; chưa có tên hộ kinh doanh / MST — trang ghi tên quán). Bản dưới là NHÁP GỐC để đối chiếu; chữ đang chạy nằm ở chinh-sach-du-lieu/index.html. Em Claude soạn 13/09/2026, rà lại 02/10/2026 (checklist #23 E-E-A-T,
> mục 208) từ đúng luồng dữ liệu trong code: `js/booking.js`, `data/site-config.js`, các thẻ
> tracking trong `index.html` và `templates/blog-post.html`.
>
> Chỗ **[ĐIỀN]** là thông tin chỉ sếp có. Căn cứ pháp lý: Luật Bảo vệ dữ liệu cá nhân số
> 91/2025/QH15, hiệu lực 01/01/2026. Em không phải luật sư. Trước khi đăng nên nhờ người có
> chuyên môn đọc lại, nhất là mục "đồng ý" (xem phần C).

---

## A. Dòng đặt ngay dưới nút gửi (5 form: trang chủ + 4 trang dịp)

**VI:** Bấm gửi là bạn đồng ý để Tiệm Nướng Trạm Dừng Chill dùng tên, số điện thoại và thông tin đặt bàn
để giữ chỗ và liên hệ xác nhận. [Xem chính sách dữ liệu](/chinh-sach-du-lieu/).

**EN:** By sending, you agree to let Tiệm Nướng Trạm Dừng Chill use your name, phone number and
booking details to hold your table and contact you to confirm. [See our data policy](/chinh-sach-du-lieu/).

---

## B. Nội dung trang `/chinh-sach-du-lieu/`

### 1. Ai chịu trách nhiệm dữ liệu của bạn

[ĐIỀN tên hộ kinh doanh / doanh nghiệp đứng tên, mã số thuế nếu có] — Tiệm Nướng Trạm Dừng Chill,
111 Huỳnh Tấn Phát, Phường Xuân Trường - Đà Lạt, Lâm Đồng.
Liên hệ về dữ liệu cá nhân: 0989.765.070 (gọi hoặc Zalo) · [ĐIỀN email của quán].

### 2. Khi bạn đặt bàn, chúng tôi nhận những gì

- **Bạn tự nhập:** họ tên, số điện thoại, ngày, giờ, số khách, dịp đặc biệt (nếu chọn), ghi chú.
- **Website tự ghi kèm** để biết khách tìm thấy quán từ đâu: nguồn truy cập (Google, Facebook,
  TikTok, mã UTM trên link quảng cáo) và mã lượt bấm quảng cáo mà Meta/TikTok/Google đã đặt trên
  trình duyệt của bạn (cookie `_fbp`, `_fbc`, `_ttp`; tham số `fbclid`, `ttclid`, `gclid`).

### 3. Dùng để làm gì

- Giữ bàn, gọi hoặc nhắn Zalo xác nhận, chuẩn bị trang trí nếu bạn đặt tiệc.
- Biết kênh quảng cáo nào thật sự mang khách tới.
- [ĐIỀN: quán có dùng số điện thoại để gửi khuyến mãi không? Nếu có, việc này phải xin đồng ý
  riêng, không gộp vào dòng đặt bàn.]

### 4. Dữ liệu được gửi tới đâu

- Hệ thống quản lý đặt bàn của quán (app.tramdungchill.vn, chạy trên máy chủ Vercel).
- Bảng tính Google Sheet của quán (qua Google Apps Script).
- Tin báo đơn mới gửi tới Telegram của chủ quán và nhóm Zalo của nhân viên tư vấn (qua máy chủ
  riêng của quán).
- Quán **không bán** dữ liệu cá nhân cho bất kỳ ai.

### 5. Công cụ đo lường trên website

Website tải các công cụ sau: **Google Analytics 4, Google Ads, Meta Pixel (Facebook), TikTok Pixel,
Microsoft Clarity**. Chúng dùng cookie để đếm lượt xem và đo hiệu quả quảng cáo. Clarity ghi lại
thao tác cuộn, bấm trên trang để quán biết chỗ nào khó dùng.
[KIỂM trước khi đăng: từ 19/09/2026 cả 5 form đã gắn `data-clarity-mask` nên chữ gõ vào form bị che
trong bản ghi. Phần còn lại của trang che tới đâu tuỳ cài đặt Masking trong Clarity — sếp mở xem.]

Website lưu trong trình duyệt của bạn (localStorage):
- nguồn truy cập lần đầu và lần gần nhất (`tdc_source_first`, `tdc_source_last`), hết hạn sau 30 ngày —
  gửi kèm đơn khi bạn đặt bàn (mục 2) và kèm sự kiện đặt bàn gửi tới công cụ đo lường;
- ngôn ngữ bạn chọn (`lang`) và bật/tắt tiếng lật trang menu (`tdc-menu-sound`) — chỉ nằm trong
  trình duyệt, không gửi đi đâu.

Nút Zalo mở ứng dụng Zalo (zalo.me). Bản đồ nhúng do Google Maps cung cấp.

### 6. Giữ dữ liệu bao lâu

[ĐIỀN, ví dụ: "Thông tin đặt bàn được giữ 12 tháng để tra lại khi khách hỏi, sau đó xoá."]

### 7. Quyền của bạn

Theo Luật Bảo vệ dữ liệu cá nhân 2025, bạn có quyền được biết dữ liệu của mình được dùng thế nào,
đồng ý hoặc rút lại đồng ý, xem, sửa, và yêu cầu xoá dữ liệu. Muốn thực hiện, gọi hoặc nhắn Zalo
0989.765.070 hoặc gửi [ĐIỀN email]. Quán trả lời trong vòng [ĐIỀN số ngày] ngày.

### 8. Ngày hiệu lực

[ĐIỀN ngày đăng]. Khi đổi nội dung, quán ghi ngày cập nhật ở đây.

---

## C. Sếp cần quyết trước khi em đăng

1. Điền hết các chỗ **[ĐIỀN]** / **[KIỂM]** ở trên.
2. **Dòng chữ hay ô tick?** Dòng ở phần A là "bấm gửi = đồng ý". Luật 2025 đòi sự đồng ý phải rõ
   ràng. Nếu người có chuyên môn khuyên dùng ô tick riêng thì em thêm checkbox bắt buộc vào 5 form.
3. Có dùng số điện thoại khách để gửi khuyến mãi không (mục 3).

## D. Phần kỹ thuật em làm sau khi sếp duyệt

- Tạo trang `chinh-sach-du-lieu/index.html` theo khuôn `duong-di/` (nav/footer tự sinh).
- Thêm dòng phần A dưới 5 form, chữ nằm trong `data/translations.js` cả vi lẫn en (bug #0).
- Thêm link "Chính sách dữ liệu" vào footer qua `generate-footer.js`, thêm trang vào sitemap.
- Chạy `bundle-js.js` → `generate-blog-pages.js` → `seo-geo-verify.js` như mọi lần.
