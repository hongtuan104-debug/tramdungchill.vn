# Trang thống kê truy cập tramdungchill.vn/quan-tri/

Trang `https://tramdungchill.vn/quan-tri/` hiện số liệu Google Analytics 4 (GA4) của web quán, giống trang
`xomleo.vn/quan-tri/` của Xóm Lèo (quán cùng chủ):
- **Ngay lúc này** (giống màn hình "Tổng quan theo thời gian thực" của GA4, tự cập nhật mỗi phút): số người trên web trong 30 phút và 5 phút, cột theo từng phút, đang xem trang nào, đến từ đâu, ở thành phố nào, vừa bấm gì;
- người truy cập, lượt xem, lượt ghé theo 7 / 28 / 90 ngày, so với kỳ liền trước;
- khách đặt bàn thành công / bấm gọi / Zalo / Facebook / chỉ đường;
- **đơn đặt bàn đến từ đâu** (Google, Maps, Facebook, TikTok, bài báo…) và **gửi từ trang nào**;
- khách đến từ đâu, trang nào được xem, giờ nào đông, thiết bị, thành phố.

Số được lấy qua một Google Apps Script chạy dưới tài khoản Google của quán. Trang web không giữ khoá hay mật khẩu nào.

```
tramdungchill.vn/quan-tri/  --(mật mã)-->  Apps Script (tài khoản Google của quán)  -->  GA4 Data API
```

Cài một lần, khoảng 15 phút. Làm trên máy tính.

> ⚠️ Đây là một dự án Apps Script **MỚI, riêng**. Đừng dán mã này vào dự án Apps Script đang nhận đơn đặt bàn
> (gửi Telegram + Zalo nhóm). Thêm dịch vụ Analytics vào dự án đó buộc phải cấp quyền lại và triển khai bản mới —
> lỡ tay là đơn đặt bàn rớt.

## 1. Chọn đúng tài khoản Google

Dùng tài khoản Google **có quyền xem GA4 của tramdungchill.vn**, tức property có luồng web `G-2VFBZDY6CD`. Nếu không chắc, mở analytics.google.com bằng tài khoản đó: thấy được báo cáo của tramdungchill.vn là đúng.

## 2. Tạo dự án Apps Script và dán mã

1. Mở https://script.google.com, bấm **Dự án mới**. Đặt tên dự án, ví dụ `Thống kê tramdungchill.vn`.
2. Xoá hết nội dung có sẵn trong `Code.gs`.
3. Mở https://raw.githubusercontent.com/hongtuan104-debug/tramdungchill.vn/main/docs/thong-ke/Code.gs, chọn hết, sao chép, dán vào `Code.gs`.
4. Bấm biểu tượng lưu (hoặc Ctrl+S).

## 3. Bật hai dịch vụ Google Analytics

Ở cột trái, cạnh chữ **Dịch vụ**, bấm **+**:
- chọn **Google Analytics Data API**, bấm **Thêm**;
- bấm **+** lần nữa, chọn **Google Analytics Admin API**, bấm **Thêm**.

Giữ nguyên tên mặc định (`AnalyticsData`, `AnalyticsAdmin`).

## 4. Đặt mật mã và chạy kiểm tra

1. Bấm **⚙ Cài đặt dự án** (cột trái), kéo xuống **Thuộc tính tập lệnh**, bấm **Thêm thuộc tính tập lệnh**:
   - Thuộc tính: `MAT_MA`
   - Giá trị: mật mã vào trang thống kê, **ít nhất 10 ký tự**. Đừng dùng lại mật khẩu Google hay ngân hàng, và đừng dùng chung mật mã với trang của Xóm Lèo.

   Bấm **Lưu thuộc tính tập lệnh**.
2. Quay lại **Trình chỉnh sửa** (biểu tượng `< >`). Ở thanh trên, chọn hàm **kiemTra**, bấm **Chạy**.
3. Lần đầu Google hỏi cấp quyền:
   - bấm **Xem xét quyền**, rồi chọn tài khoản;
   - nếu hiện "Google chưa xác minh ứng dụng này", bấm **Nâng cao**, rồi **Chuyển tới Thống kê tramdungchill.vn**. Cảnh báo này xuất hiện vì đây là dự án của chính quán, không phải ứng dụng công khai;
   - bấm **Cho phép**.
4. **Nhật ký thực thi** phải có hai dòng:
   - `Đã lưu GA4_PROPERTY_ID = …` (script tự tìm property của tramdungchill.vn và tự ghi lại);
   - `Lấy thử 7 ngày: … người truy cập …`

## 5. Triển khai thành ứng dụng web

1. Bấm **Triển khai** (góc trên phải), chọn **Tùy chọn triển khai mới**.
2. Bấm bánh răng cạnh "Chọn loại", chọn **Ứng dụng web**.
3. Điền:
   - Mô tả: `Thống kê tramdungchill.vn`
   - Thực thi dưới dạng: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai**

   Chọn "Bất kỳ ai" vì trang tramdungchill.vn gọi script mà không mang theo đăng nhập Google. Lớp bảo vệ là mật mã.
4. Bấm **Triển khai**, sao chép **URL ứng dụng web**. URL có dạng `https://script.google.com/macros/s/…/exec`.

## 6. Mở trang thống kê

1. Vào https://tramdungchill.vn/quan-tri/
2. Dán URL ở bước 5 vào ô **Địa chỉ Apps Script**, nhập mật mã, bấm **Xem số liệu**.
3. Chỉ tích **Nhớ mật mã trên máy này** trên máy riêng.

Gửi URL ở bước 5 cho người làm web để gắn sẵn vào trang (biến `DIA_CHI_MAC_DINH` trong `quan-tri/index.html`). Sau đó máy nào cũng chỉ cần nhập mật mã.

**Máy vào được trang thống kê sẽ tự được loại khỏi số liệu** (giống mở `tramdungchill.vn/?noi_bo=1`): người trong quán
xem web hay đặt bàn thử từ trình duyệt đó không bị đếm là khách. Muốn đếm lại máy đó: bấm **Đếm lại lượt xem của máy
này** ở cuối trang thống kê.

## Về sau

- **Đổi mật mã:** sửa `MAT_MA` trong Thuộc tính tập lệnh. Có hiệu lực ngay, không cần triển khai lại. Máy đã nhớ mật mã cũ sẽ bị hỏi lại. Nên đổi khi có người biết mật mã nghỉ việc.
- **Cập nhật mã Apps Script** (khi `docs/thong-ke/Code.gs` trong repo đổi):
  1. dán lại mã, lưu;
  2. vào **Triển khai → Quản lý các lần triển khai**, bấm ✎ ở lần triển khai đang dùng;
  3. ở Phiên bản chọn **Phiên bản mới**, bấm **Triển khai**.

  Làm đúng cách này thì URL giữ nguyên. Nếu tạo "triển khai mới" thì URL đổi và phải dán lại trên trang.
- **Nhập sai mật mã 15 lần trong 15 phút:** trang khoá 15 phút cho mọi người, chống dò mật mã.
- Script **chỉ đọc** GA4 (quyền xem), không sửa được gì trong GA4. Số liệu được lưu tạm 15 phút, nên tải lại liên tục không tốn hạn mức.

## Lỗi thường gặp

| Hiện tượng | Cách sửa |
|---|---|
| `kiemTra` báo "không xem được property chứa G-2VFBZDY6CD" | Đang mở dự án bằng tài khoản không có quyền GA4. Dùng tài khoản quản trị GA4. Hoặc vào GA4: Quản trị → Quản lý quyền truy cập → thêm tài khoản này với vai trò **Người xem**. |
| `kiemTra` báo `AnalyticsAdmin is not defined` hoặc `AnalyticsData is not defined` | Chưa thêm dịch vụ ở bước 3. |
| Trang báo "Không gọi được Apps Script" | Lúc triển khai chưa chọn **Bất kỳ ai**, hoặc dán nhầm URL `/dev` (phải là URL kết thúc bằng `/exec`). |
| Trang báo "Apps Script chưa có MAT_MA hoặc GA4_PROPERTY_ID" | Chưa chạy `kiemTra` thành công, hoặc thiếu `MAT_MA` ở Thuộc tính tập lệnh. |
| Trang báo "Google Analytics báo lỗi …" | Tài khoản chạy script đã mất quyền xem GA4. Cấp lại quyền, hoặc xoá `GA4_PROPERTY_ID` rồi chạy lại `kiemTra`. |

## Ghi chú kỹ thuật

- Sự kiện đếm đúng theo hợp đồng ở `docs/do-luong.md` mục 3. "Đặt bàn thành công" = `conversion_event_submit_lead_form`
  (chỉ nổ khi đơn đã lưu được, không tính đơn trùng). Đổi tên sự kiện trên web thì sửa cả `SU_KIEN` trong `Code.gs`
  (rồi cập nhật Apps Script) lẫn `SU_KIEN` trong `quan-tri/index.html`.
- Trang `/quan-tri/` không gắn GA4 / pixel, có `noindex`, không nằm trong sitemap, không có giao diện mùa và không được
  link từ đâu trên site. Máy canh R27 mục (d) giữ nó sạch pixel và còn `noindex`.
- Nhóm nguồn khách (Google tìm kiếm, Google Maps, báo chí, AI…) được gom ở hàm `nhomNguon` trong `quan-tri/index.html`,
  theo tên nguồn trong `docs/UTM-CONVENTION.md`. Sửa ở đó, không cần triển khai lại Apps Script.
- Web chỉ bật GA4 khi khách chạm/cuộn hoặc 6 giây sau khi tải xong (CLAUDE.md #9, #20) — số GA4 thấp hơn số khách thật một chút.
- Muốn thêm số Search Console (khách tìm từ khoá gì): Apps Script không có sẵn dịch vụ Search Console, phải chuyển dự án
  sang một dự án Google Cloud riêng và bật Search Console API. Chưa làm.
