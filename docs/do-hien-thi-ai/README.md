# Đo độ hiển thị trên AI Search — quy trình

Checklist #26 (mục 234–243). Mục tiêu: biết được khi khách hỏi máy AI về quán nướng
Đà Lạt thì quán có được **nhắc tên** hay được **dẫn nguồn** không — và đo lại được,
so được qua các tháng.

> **Điều quan trọng nhất:** không có API nào trả về đúng thứ khách nhìn thấy trên
> ChatGPT Search / AI Overviews / Copilot. Kết quả đổi theo tài khoản, phiên, vị trí,
> thậm chí đổi giữa hai lần hỏi liền nhau. Nên phần hỏi là **làm tay**, script chỉ lo
> phần máy làm được. Không đoán, không suy ra từ "chắc là có".

---

## 1. Việc chỉ sếp Tuấn làm được (cần đăng nhập)

| Mục | Việc | Ở đâu |
|-----|------|-------|
| 234 | Xác minh site trong **Bing Webmaster Tools**, gửi `sitemap.xml`, xem trạng thái crawl/index 27 URL | bing.com/webmasters |
| 236 | Xem báo cáo **Generative AI** trong Search Console (khi Google bật cho site này), đối chiếu với Performance + GA4 | search.google.com/search-console |

Tình trạng 16/09/2026: site **chưa** có dấu xác minh Bing nào trong repo (không file
`BingSiteAuth.xml`, không thẻ `msvalidate.01`, domain không có bản ghi TXT nào). Nếu
sếp từng xác minh bằng cách **Import từ Google Search Console** thì vẫn hợp lệ và
không để lại dấu gì trên site — em không tự kiểm được, sếp mở Bing Webmaster Tools
xem giúp. Nếu chưa có thì cách nhẹ nhất là Import từ GSC (không phải sửa code).

Vì sao đáng làm: Bing là kho dữ liệu cho ChatGPT Search và Copilot. Đây là tín hiệu
giúp Bing **phát hiện** nội dung — **không** phải cam kết Copilot sẽ trích dẫn.

## 2. Việc máy đã tự làm (mục 235 — IndexNow)

Chạy sẵn, không phải đụng tay:

- `scripts/bao-indexnow.js` — chỉ gửi URL **thật sự đổi nội dung**, lấy từ
  `cap-nhat-lastmod.js`, đều là URL canonical trong sitemap.
- Chặn URL ngoài miền trước khi gửi (IndexNow trả 422).
- Thử lại 3 lần cho lỗi tạm; 400/403/422 thì dừng ngay vì thử lại không cứu được.
- Thoát khác 0 khi hỏng → workflow GitHub báo đỏ, không nuốt im lặng.
- Chìa khoá: `39cc2ef8d9d8eaf42c5a3255526ade94.txt` ở gốc web (đang sống, HTTP 200).
  Chìa khoá IndexNow **công khai theo thiết kế** — để trong repo công khai là đúng.

⚠️ Mã 200/202 chỉ nghĩa là **đã nhận URL**, không phải đã crawl hay đã index.
⚠️ Google **không** dùng IndexNow. Với Google chỉ còn sitemap có `lastmod` đúng.
⚠️ Hiện chưa gửi URL **bị xoá**. Khi nào gỡ hẳn một trang thì gửi tay:
`node scripts/bao-indexnow.js https://tramdungchill.vn/<trang-da-xoa>`

## 3. Bộ câu hỏi benchmark (mục 237)

`cau-hoi-benchmark.json` — 20 câu: 5 câu thương hiệu + 15 câu không thương hiệu,
chia theo intent (informational / commercial / transactional / local / navigational),
15 câu tiếng Việt + 5 câu tiếng Anh. Mỗi câu ghi `urlKyVong` = trang đáng ra nên được
dẫn nếu AI chọn nguồn của mình.

**Giữ nguyên câu chữ giữa các lần đo.** Sửa một chữ là số tháng này không so được với
tháng trước. Muốn đổi/thêm câu:

1. Sửa mảng `cauHoi`
2. Tăng `phienBan` (`v1` → `v2`)
3. Cập nhật `bamCauHoi` (script in ra giá trị đúng khi lệch)
4. Đo lại từ đầu — **không** gộp số v1 với v2

Luật **R23** trong `seo-geo-verify.js` chặn việc sửa câu mà quên bước 2–3.

## 4. Điều kiện mỗi lần đo (mục 238)

Kết quả **chỉ đại diện cho đúng điều kiện đã kiểm tra**. Mỗi tệp nhật ký phải ghi đủ
`nenTang` · `model` · `cheDo` · `ngonNgu` · `thiTruong` · `trangThaiTaiKhoan`, và mỗi
lần đo ghi `thoiDiem`. Thiếu một trường là script báo lỗi.

Nền tảng nên phủ: `ChatGPT` · `Perplexity` · `Copilot` · `Google-AI-Overviews` ·
`Google-AI-Mode` · `Gemini`.

Nên đo ở **chế độ ẩn danh** (`trangThaiTaiKhoan: "an-danh"`) làm mốc chính — tài khoản
đã đăng nhập có lịch sử cá nhân hoá, số sẽ đẹp giả. Muốn đo cả hai thì tách thành hai
tệp nhật ký, đừng trộn.

## 5. Citation ≠ mention (mục 239)

| Trạng thái | Nghĩa |
|------------|-------|
| `missing` | Không nhắc tên, không dẫn nguồn |
| `mentioned` | Có nêu tên quán trong câu trả lời, **không** có URL của mình |
| `cited` | Có URL thuộc `tramdungchill.vn` hiện ra **và link còn hoạt động** |
| `replaced` | Câu hỏi này AI trả lời bằng nguồn/đối thủ khác — ghi rõ ai, đỡ tuyên bố gì |

Đừng gộp bốn thứ này thành một điểm "độ hiển thị". `mentioned` mà không `cited` là
tín hiệu khác hẳn: AI biết quán nhưng lấy thông tin từ chỗ khác (Maps, Foody, bài PR)
— khi đó thông tin sai thì mình không sửa được.

## 6. Mở từng nguồn ra kiểm (mục 240)

Trước khi ghi `cited`, **tự mở URL đó ra đọc**, rồi đánh `daMoKiemTuyenBo: true`. Phải
thấy trang **thật sự nói điều** mà AI gắn nguồn cho nó. Không suy ra từ việc trang có
tên quán hoặc có đoạn văn na ná.

Phần máy làm được thì `node scripts/do-hien-thi-ai.js --kiem-url` lo: HTTP status,
chuỗi redirect, canonical có trỏ về chính nó không, trang có `noindex` không. URL nào
hỏng thì **không được tính** vào owned citation khi cộng số.

## 7. Lưu bằng chứng (mục 241)

Mỗi lần đo phải có `trichDoan` (dán nguyên văn) **hoặc** `anhChup` (ảnh trong
`docs/do-hien-thi-ai/anh/`). Không có gì cả thì tháng sau kết quả đổi, không đối soát
được là do AI đổi hay do mình nhớ nhầm.

## 8. Cách chạy

```bash
node scripts/do-hien-thi-ai.js              # kiểm nhật ký + in số
node scripts/do-hien-thi-ai.js --kiem-url   # + soi từng URL được dẫn (gọi mạng)
node scripts/do-hien-thi-ai.js --lich-su    # + tách theo đợt để thấy xu hướng
```

Số in ra: **citation coverage** (% lần đo có dẫn nguồn của mình) · **mention rate**
(% lần đo có nhắc tên) · **owned-source share** (nguồn của mình / tổng nguồn AI dẫn) ·
số `cited` / `mentioned` / `replaced` / `missing`, tách theo nền tảng và loại truy vấn.

## 9. Nhịp đo lại (mục 243)

**Hàng tháng**, cùng bộ câu hỏi, cùng điều kiện. Một lần xuất hiện không đủ kết luận
xu hướng — câu trả lời AI dao động mạnh giữa hai lần hỏi cách nhau vài phút.

Sau mỗi đợt, đối chiếu với GA4 (lượt truy cập từ `chatgpt.com`, `perplexity.ai`,
`copilot.microsoft.com`) và báo cáo Generative AI trong Search Console nếu có. Đừng
xem số citation như một chỉ số xếp hạng — nó là số lần **được chọn làm nguồn**, phụ
thuộc cả vào câu hỏi lẫn nền tảng.
