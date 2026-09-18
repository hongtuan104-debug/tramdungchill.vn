# Google Search Console — trạng thái & việc cần làm

Rà theo checklist #29 (mục 264–273), ngày **18/09/2026**.
Máy này **không đăng nhập được Search Console**, nên tài liệu chia đôi rõ ràng:
phần máy đo được (đã đo, có số) và phần sếp phải mở GSC bấm.

Chạy lại phần máy bất cứ lúc nào:

```
node scripts/seo-geo-verify.js      # luật R26 — phần tĩnh trong repo
node scripts/kiem-sitemap-live.js   # gọi thật 27 URL trên máy chủ
```

---

## 1. Ba việc cần sếp làm (xếp theo mức đáng làm)

### 1.1 Bật "Enforce HTTPS" trong GitHub Pages — 1 cú bấm 🟢

Hiện `http://tramdungchill.vn/` trả **200**, không chuyển hướng sang https (đo 18/09/2026).
Nghĩa là cùng một nội dung đang sống ở hai địa chỉ. Property trong GSC là dạng
URL-prefix `https://tramdungchill.vn/` nên **bản http không nằm trong báo cáo nào cả** —
Google crawl bản đó thì mình không thấy.

Làm: GitHub → repo `hongtuan104-debug/tramdungchill.vn` → **Settings → Pages** →
tick **Enforce HTTPS** (chứng chỉ đã có sẵn nên tick được ngay).

Bản `www.` thì đã đúng rồi: `www` → 301 → không-www. Không phải làm gì.

### 1.2 Thêm Domain property (mục 264) — bao phủ mọi giao thức, subdomain

Tra DNS 18/09/2026: miền `tramdungchill.vn` **không có bản ghi TXT nào**. Domain property
chỉ xác minh được bằng DNS, nên chắc chắn hiện **chưa có** — GSC đang chỉ có property
URL-prefix `https://tramdungchill.vn/`, xác minh 22/03/2026 bằng file
`googlef9138a5a20ad2da4.html`.

Domain property gộp http + https + www + mọi subdomain vào một báo cáo. Nó **không**
làm Google crawl hay index nhiều hơn — chỉ để nhìn đủ.

Làm: GSC → Thêm thuộc tính → chọn **Miền** → nhập `tramdungchill.vn` → copy bản ghi TXT
→ vào nhà cung cấp DNS (**iNET**, nameserver `ns1/ns2/ns3.inet.vn`) → thêm bản ghi TXT ở
host `@` → quay lại GSC bấm Xác minh.

Giữ luôn property URL-prefix cũ, đừng xoá: dữ liệu lịch sử nằm ở đó, property mới bắt
đầu từ 0 (thực ra GSC vẫn nạp được ~16 tháng dữ liệu, nhưng cứ giữ cho chắc).

### 1.3 Thêm chủ sở hữu thứ hai (mục 265)

Hiện chỉ thấy MỘT tài khoản nhận thư GSC (tài khoản Gmail chính của sếp). Nếu tài khoản đó gặp
chuyện thì mất luôn quyền quản lý property.

Làm: GSC → Cài đặt → **Người dùng và quyền** → thêm tài khoản Gmail thứ hai của quán.
Lưu ý: người được thêm là **chủ sở hữu được uỷ quyền** (delegated owner) — muốn thành
**chủ sở hữu đã xác minh** (verified owner) thì tài khoản đó phải tự xác minh một lần
bằng cách riêng (ví dụ thêm bản ghi TXT thứ hai, hoặc tự tải file xác minh của mình lên).

Rà định kỳ: gỡ tài khoản cá nhân / agency đã hết việc.

---

## 2. Việc chỉ xem được trong GSC (máy này không vào được)

### 2.1 ⏳ Đang treo: 15 trang "Đã phát hiện – hiện chưa được lập chỉ mục"

Thư GSC ngày **09/09/2026**: Google bắt đầu xác thực bản sửa cho lỗi *"Đã phát hiện –
hiện chưa được lập chỉ mục"*, **ảnh hưởng 15 trang** trong sitemap. Thư báo "vài ngày sẽ
xong" — tới 18/09 (9 ngày) **chưa có thư kết quả**.

Sếp mở: GSC → **Lập chỉ mục trang** → lọc theo sơ đồ trang web → mục đó → xem trạng thái
xác thực (Đã qua / Không qua / Đang chạy) và **danh sách URL cụ thể**.

Gửi em danh sách URL đó thì em soi được nguyên nhân từng trang. Biết trước vài điều:

- Sitemap hiện **27 URL**, tất cả đã kiểm live 18/09: trả 200, không chuyển hướng,
  canonical tự trỏ, không noindex. Tức lỗi **không** nằm ở khâu kỹ thuật sitemap.
- "Đã phát hiện – chưa lập chỉ mục" nghĩa là Google **biết URL nhưng chưa buồn tải về**.
  Gửi lại sitemap không chữa được. Thứ chữa được là: liên kết nội bộ mạnh hơn từ trang
  hay được crawl, và nội dung đủ khác biệt để đáng crawl.
- Đếm link nội bộ 18/09: 18 bài blog trong sitemap nhận **5–9 link** từ các trang cũng
  đang index; 11 bài **không có link nào từ thân trang chủ**. Trang chủ là trang Google
  ghé nhiều nhất — đây là chỗ đáng cân nhắc nhất nếu muốn đẩy bài nào đó.

### 2.2 Mục 267 — đọc Lập chỉ mục trang cho đúng

Những URL sau **cố ý** không được index, thấy trong báo cáo là **đúng**, đừng sửa:

| Nhóm | Số lượng | Trạng thái mong đợi trong GSC |
|---|---|---|
| 123 bài blog noindex (canonical trỏ bài gộp) | 123 | Bị loại trừ bởi thẻ 'noindex' |
| `404.html`, `review-qr.html` | 2 | noindex, cố ý không có trong sitemap |
| `dev/utm-builder.html` (công cụ nội bộ) | 1 | noindex, nofollow |
| `/index.html` (bản trùng của trang chủ) | 1 | Trang thay thế có thẻ canonical phù hợp |

Thư GSC 17/08/2026 báo "nguyên nhân mới: Bị loại trừ bởi thẻ 'noindex'" — chính là nhóm
trên, không phải lỗi. Mục tiêu **không** phải đưa mọi URL về "đã index".

### 2.3 Mục 268 — URL Inspection: kiểm cả bản index lẫn bản live

Mỗi lần đổi template thì soi 1 URL đại diện mỗi loại trang (trang chủ, menu, blog index,
1 bài blog, 1 trang dịp, đường đi, trang tác giả). Nhìn 3 dòng: **Canonical do người dùng
khai** ↔ **Canonical do Google chọn** (phải trùng), và lần crawl gần nhất.

⚠️ Đã biết một chỗ lệch tín hiệu: toàn site có **1.960 link nội bộ trỏ `index.html`**
(nav, footer, breadcrumb, CTA trong bài) trong khi canonical + sitemap khai trang chủ là
`https://tramdungchill.vn/`. Hai URL cùng nội dung, và mọi link nội bộ đang trỏ vào bản
**không** phải bản chuẩn. Hiện chưa gây hại thấy được (canonical vẫn hợp nhất về `/`),
nhưng nếu URL Inspection cho trang chủ báo Google chọn canonical là `/index.html` thì đó
đúng là nguyên nhân — sửa bằng cách đổi link nội bộ sang `/`. Việc này em chưa làm vì
nó động vào 156 file, chờ sếp gật.

### 2.4 Mục 269–271 — đọc Hiệu suất

Số lấy từ thư tổng kết tháng của GSC:

| Tháng | Lượt nhấp | Lượt hiển thị |
|---|---|---|
| 5/2026 | 388 | 7.980 |
| 6/2026 | 777 | 13.200 |
| 7/2026 | 800 | 13.400 |
| 8/2026 | **793** | **12.900** |

Ba tháng liền đứng yên. Khi đọc báo cáo Hiệu suất, nhớ:

- So cùng độ dài kỳ (28 ngày ↔ 28 ngày), tách **thương hiệu** ("trạm dừng chill") khỏi
  **không thương hiệu** ("quán nướng đà lạt") — hai nhóm này diễn giải khác hẳn nhau.
- Tách **Điện thoại / Máy tính**: site này gần như toàn khách điện thoại.
- **Vị trí trung bình** là số trung bình để chẩn đoán, không phải thứ hạng thật.
- Một truy vấn hiện ở nhiều URL **chưa chắc** là cannibalization — chỉ xử lý khi URL
  nhận hiển thị thay phiên bất ổn hoặc sai ý định tìm kiếm.
- Báo cáo **Generative AI** (AI Overviews / AI Mode) mới mở giới hạn cho một số property.
  Nếu property của mình chưa có, lượt hiển thị từ AI Overviews **vẫn** được tính trong
  Hiệu suất tổng — đừng kết luận "AI chưa nhắc mình" chỉ vì không thấy báo cáo riêng.
  (Đo độ hiển thị trên AI là việc riêng: xem `docs/do-hien-thi-ai/README.md`.)

### 2.5 Mục 272 — Enhancements / Search appearance

⚠️ **Google đã bỏ hẳn kết quả nhiều định dạng FAQ từ 07/05/2026.** Site vẫn giữ FAQPage
(Bing và bot AI còn đọc). Rich Results Test không thấy FAQ là **bình thường** — đừng sửa
báo cáo cho loại hiển thị Google đã ngừng dùng.

Lỗi dữ liệu có cấu trúc duy nhất site từng dính là "Trường trùng lặp FAQPage" (06/04/2026),
đã hết từ khi bỏ chèn schema bằng JS. Trước mỗi lần commit đã có luật R7e trong
`seo-geo-verify.js` đối chiếu tài liệu Google; sau deploy chạy `node scripts/kiem-schema-live.js`.

### 2.6 Mục 273 — Thao tác thủ công & Vấn đề bảo mật

Rà toàn bộ hộp thư 365 ngày (18/09/2026): **0 thư về thao tác thủ công, 0 thư cảnh báo
bảo mật** cho tramdungchill.vn. Sếp vẫn nên mở GSC xác nhận tận mắt — hai báo cáo này chỉ
tài khoản có quyền mới xem được, và thư có thể bị lọc.

---

## 3. Phần máy đã kiểm — đạt hết (18/09/2026)

| Kiểm | Kết quả |
|---|---|
| 27 URL sitemap gọi thật | 27/27 trả **200**, 0 chuyển hướng, 0 header `X-Robots-Tag` |
| Canonical từng trang | 27/27 tự trỏ đúng URL đã khai trong sitemap |
| noindex trong sitemap | 0 |
| `sitemap.xml`, `robots.txt` | tải được, robots khai đúng 1 dòng Sitemap |
| File xác minh property | `googlef9138a5a20ad2da4.html` còn sống, nội dung khớp tên |
| URL lạ (`/trang-khong-ton-tai-xyz`) | trả **404 thật**, không phải soft-404 |
| `www` → không-www | 301 ✅ |
| `http` → `https` | ❌ trả 200 — xem việc 1.1 |
| Link nội bộ tự đẻ 301 (thiếu `/`, trỏ http/www) | 0 |

Từ nay hai thứ này được canh tự động:

- **R26** trong `scripts/seo-geo-verify.js` — chạy mỗi lần build/commit: dấu xác minh còn
  nguyên, sitemap chỉ chứa URL https đúng miền, có file thật, canonical tự trỏ, không
  noindex, không URL kiểu thư mục thiếu dấu `/` (kiểu đó sẽ bị 301), robots.txt khai đúng
  sitemap, và không link nội bộ nào tự đẻ chuyển hướng.
- **`scripts/kiem-sitemap-live.js`** — chạy tay sau deploy: gọi thật từng URL để bắt
  những thứ chỉ máy chủ mới lộ (301, 404, header `X-Robots-Tag`, canonical bản live).

---

## 4. Ba điều dễ hiểu sai (chép lại từ checklist, đúng với site này)

1. **Mục tiêu không phải 100% URL được index.** 123 bài noindex có chủ đích, `404.html`,
   `review-qr.html`, `dev/` — nằm ngoài chỉ mục là đúng thiết kế.
2. **Gửi sitemap chỉ giúp Google *khám phá* URL**, không bảo đảm crawl, index hay xếp hạng.
   15 trang "đã phát hiện – chưa lập chỉ mục" là ví dụ sống: URL đã nằm trong sitemap từ lâu.
3. **"URL is on Google" không có nghĩa là có thứ hạng.** Index xong vẫn có thể 0 lượt hiển thị.
