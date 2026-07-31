# Đo số khách vào website — hướng dẫn cho chủ quán

> **Tình trạng hôm nay (31/07/2026):** đồ nghề đã viết xong và chạy được.
> Còn **4 nút anh phải tự bấm** — Google bắt buộc chủ tài khoản làm, máy không
> làm thay được. Bấm xong là từ đó về sau chỉ cần gõ một câu lệnh là ra số.

Chạy: `node scripts/do-khach-vao-web.js`

---

## Vì sao phải làm việc này

Website đã cắm sẵn **5 công cụ đo** từ lâu:

| Công cụ | Mã | Đo cái gì |
|---|---|---|
| Google Analytics | `G-2VFBZDY6CD` | bao nhiêu người vào, vào từ đâu, xem trang nào |
| Google Ads | `AW-18038463990` | ai bấm quảng cáo rồi vào web |
| Meta Pixel | `1281459450582041` | khách từ Facebook/Instagram |
| TikTok Pixel | `D7IFUA3C77U3A048FDR0` | khách từ TikTok |
| Microsoft Clarity | `w9j3jz5uxj` | quay lại màn hình khách thao tác |

**Nhưng không có cách nào đọc số ra ngoài việc mở trình duyệt xem tay.** Nên
chẳng ai xem, nên không ai biết mấy việc sửa web có ăn thua gì không. Đó là lý
do có file này.

---

## Bốn nút phải bấm (làm một lần, ~10 phút)

Địa chỉ thư của "chìa khoá máy" — **copy sẵn, lát dán vào 2 chỗ**:

```
claude-sheets@light-height-492803-d2.iam.gserviceaccount.com
```

### Nút 1 — Bật cổng Analytics

Mở: <https://console.developers.google.com/apis/api/analyticsadmin.googleapis.com/overview?project=503533744126>

Bấm nút **ENABLE** (hoặc "Bật"). Xong.

### Nút 2 — Bật cổng đọc số Analytics

Mở: <https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=503533744126>

Bấm **ENABLE**.

### Nút 3 — Bật cổng Search Console

Mở: <https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=503533744126>

Bấm **ENABLE**.

### Nút 4 — Cho chìa khoá quyền XEM

Hai chỗ, cùng một địa chỉ thư ở trên:

**a) Google Analytics** → <https://analytics.google.com>
- Góc dưới trái bấm **Quản trị** (Admin)
- Cột phải chọn **Quản lý quyền truy cập tài sản** (Property Access Management)
- Bấm dấu **+** góc trên phải → **Thêm người dùng**
- Dán địa chỉ thư ở trên
- Chọn quyền **Người xem** (Viewer) — *chỉ đọc, không sửa được gì*
- Bấm **Thêm**

**b) Google Search Console** → <https://search.google.com/search-console>
- Chọn trang `tramdungchill.vn`
- Menu trái kéo xuống cuối, bấm **Cài đặt** (Settings)
- Chọn **Người dùng và quyền** (Users and permissions)
- Bấm **Thêm người dùng**
- Dán địa chỉ thư ở trên, chọn quyền **Đầy đủ** hoặc **Hạn chế** (đều được)

---

## Bấm xong thì chạy lại

```
node scripts/do-khach-vao-web.js
```

Nó sẽ in ra:

- **Bao nhiêu người vào web** trong 28 ngày gần nhất
- **Bao nhiêu lượt truy cập**, xem bao nhiêu trang, ngồi lại bao lâu
- **Khách đến từ đâu**: Google tìm kiếm / Facebook / gõ thẳng địa chỉ / quảng cáo
- **Trang nào được xem nhiều nhất**
- **Khách gõ từ khoá gì thì thấy quán**, hiện ra bao nhiêu lần, bao nhiêu người
  bấm vào, đang đứng hạng mấy

Muốn xem xa hơn: `node scripts/do-khach-vao-web.js --ngay 90`

Chỉ muốn kiểm quyền, chưa cần số: `node scripts/do-khach-vao-web.js --kiem-tra`

---

## Nếu vẫn báo lỗi

Đồ nghề này **không đoán mò**. Nó in ra đúng cái còn thiếu và đúng đường dẫn để
sửa. Cứ đọc dòng nó in rồi làm theo.

Hai lỗi hay gặp:

| Nó báo | Nghĩa là | Làm gì |
|---|---|---|
| *"Bật ... API cho dự án Google"* | chưa bấm nút 1/2/3 | mở đường dẫn nó in ra, bấm ENABLE |
| *"KHÔNG thấy kho số nào"* | đã bật cổng nhưng chưa cấp quyền | làm nút 4 |

---

## ⚠️ Những gì đồ nghề này KHÔNG làm được

Nói trước để khỏi kỳ vọng sai:

- **Không đọc được số từ Meta Pixel / TikTok Pixel / Clarity.** Ba cái đó cần
  chìa khoá riêng, chưa có. Nếu cần thì làm sau — Clarity là dễ nhất (vào
  Clarity → Settings → Data Export → tạo token).
- **Không có số liệu trước ngày Google Analytics được cắm lên web.** Cắm từ
  08/04/2026, nên trước đó là con số 0 thật, không phải lỗi.
- **Không cho biết bao nhiêu khách trong số đó đến ăn thật.** Web không nối
  với sổ đặt bàn. Muốn biết thì phải so tay với sổ đặt bàn trong app.

---

## Ghi chú kỹ thuật (không cần đọc nếu không sửa mã)

- File tự ký giấy thông hành (JWT RS256) bằng `crypto` có sẵn của Node —
  **không cài thư viện ngoài**, vì kho này là web tĩnh, không có `node_modules`.
- Chỉ xin **hai quyền CHỈ-ĐỌC**: `analytics.readonly` và `webmasters.readonly`.
  Cố ý không xin quyền ghi — lỡ lộ chìa khoá cũng không sửa được gì.
- Chìa khoá đọc từ `GOOGLE_APPLICATION_CREDENTIALS`, hoặc mặc định
  `~/.claude/google-credentials.json`. **Chìa khoá KHÔNG nằm trong kho mã** và
  đừng bao giờ commit nó vào đây.
- Đã thử cho chìa khoá tự bật cổng API: **không được**, Google trả
  `403 Permission denied to enable service`. Nên nút 1–3 bắt buộc người bấm.
- Số property của Google Analytics: đồ nghề tự dò. Muốn ép thì đặt biến môi
  trường `GA4_PROPERTY_ID`.
