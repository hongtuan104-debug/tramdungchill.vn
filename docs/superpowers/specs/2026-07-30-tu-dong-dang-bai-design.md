# Thiết kế: Tự động đăng bài mới cho SEO/GEO — tramdungchill.vn

Ngày: 30/07/2026 · Trạng thái: **CHỜ CHỦ DUYỆT** (chưa code dòng nào)

---

## 1. Ba điều chủ đã chốt

| Câu hỏi | Chốt |
|---|---|
| Máy tự tới đâu? | **Máy soạn sẵn → chủ bấm duyệt → mới đăng.** Không có chuyện tự đăng thẳng. |
| Lấy gì ra để viết? | **(1) Câu hỏi THẬT của khách trong Hộp thư** (chính) · (2) Từ khoá khách tìm trên Google · (3) Việc thật của tiệm theo mùa/sự kiện |
| Bấm duyệt ở đâu? | **Trong app TDC, màn "Đăng bài đa kênh", thêm "Website" thành kênh thứ 7** |

Chủ đã **bỏ** hai việc treo trước đó: không cần nhắn Zalo, không sửa ngày đăng của 12 bài cũ.

---

## 2. Vì sao thiết kế theo hướng này

Tháng 6 vừa phải chặn **122 bài mỏng** khỏi Google. Nguyên nhân không phải "AI viết dở" mà là **sinh bài theo số lượng, không có bằng chứng ai cần đọc**.

Nguồn "câu hỏi thật của khách" sửa đúng gốc đó:

- **Có bằng chứng nhu cầu** — 20 khách đã hỏi câu này nghĩa là còn hàng trăm người đang gõ câu đó lên Google
- **Đối thủ không copy được** — họ không có hộp thư của tiệm mình
- **Đúng dạng máy AI hay trích** — ChatGPT/Google AI thích trang hỏi-đáp có câu trả lời gọn, dứt khoát
- **Không bịa** — câu trả lời lấy từ lời nhân viên đã trả lời khách thật, không phải AI nghĩ ra

---

## 3. Đường đi của một bài, từ lúc sinh ra tới lúc lên web

```
[App TDC — nơi có hộp thư và màn duyệt]

 1. Mỗi tuần, máy gom đề tài:
      • Hộp thư 30 ngày → gộp câu hỏi giống nhau → đếm bao nhiêu khách hỏi
      • Từ khoá Google  → câu nào có người tìm mà web chưa có trang
      • Lịch mùa vụ     → Tết, Festival Hoa, mùa mưa, giờ tàu đổi…

 2. Lọc qua CỔNG CHẤT LƯỢNG (mục 4) — không qua thì bỏ, không ép đủ chỉ tiêu

 3. Soạn nháp: AI viết dựa trên câu trả lời THẬT của nhân viên + số liệu
    trong data/facts.json (giá, giờ, số đánh giá, số món)

 4. Cất vào bảng nháp, chờ duyệt

[Chủ tiệm — điện thoại]

 5. Mở "Đăng bài đa kênh" → kênh Website → đọc nháp → sửa/bỏ → bấm Đăng

[Website — GitHub Pages]

 6. App ghi bài vào data/blog-data.js rồi đẩy lên một nhánh riêng
 7. Lưới CI 28 mục chạy — xanh mới được vào
 8. GitHub Pages tự dựng lại web
 9. Máy tự đặt ngày sửa + báo IndexNow  (đã có sẵn, không phải làm lại)
```

**Điểm mấu chốt:** bước 6–9 **đã chạy được rồi**. Ba PR hôm 29–30/07 dựng xong phần đó. Việc mới chỉ là bước 1–5.

---

## 4. Cổng chất lượng — thứ chặn lặp lại vụ 122 bài

Một đề tài chỉ được đưa lên cho chủ duyệt khi **đủ CẢ 4**:

1. **Có người thật hỏi** — ít nhất N khách hỏi cùng ý trong 90 ngày (N chốt sau khi đo số thật)
2. **Web chưa trả lời** — không trang nào trong 22 trang đang index đã nói việc đó
3. **Có đủ dữ kiện thật để viết** — giá / giờ / ảnh thật / lời nhân viên; thiếu thì không viết
4. **Không giẫm chân trang cũ** — không trùng ý với trang đang index (tránh hai trang tranh nhau một từ khoá)

Sau khi đăng:

- Bài mới **mặc định cho Google đọc và vào sitemap** — khác hẳn 122 bài cũ
- Lưới CI 28 mục phải xanh mới lên được
- **Sau 60 ngày**: bài nào Google không cho hiện lần nào → máy báo chủ cân nhắc gộp hoặc bỏ. Không để rác tích tụ lần nữa.

**Trần số lượng: tối đa 1 bài/tuần.** Ít mà chắc. Nếu tuần đó không có đề tài nào qua cổng thì **không đăng gì cả** — đó là kết quả đúng, không phải lỗi.

---

## 5. Còn phải kiểm trước khi code (KHÔNG đoán)

| Việc | Vì sao quan trọng |
|---|---|
| Cấu trúc thật của màn "Đăng bài đa kênh" | Ghi chép cũ nói có registry `channels/<kênh>.ts`, nhưng soi repo ngày 30/07 **không thấy** — có thể ở nhánh khác hoặc đã đổi tên. Phải soi lại rồi mới thiết kế kênh thứ 7. |
| Bảng hộp thư trong Supabase | Biết `inbox_messages` có cột `text` (không phải `content`). Cần biết thêm: cột phân biệt khách/nhân viên, cột trang, cột thời gian. |
| Nguồn từ khoá Google | Chưa chốt: Search Console (chuẩn nhất, cần nối) hay SerpAPI (đã có khoá trong Notion) hay Google Ads keyword ideas. |
| Khoá AI để soạn nháp | App đã có khoá Anthropic trên Vercel (dùng cho đọc hoá đơn bằng ảnh). Xác nhận dùng lại được không. |
| Ảnh cho bài mới | Kho `assets/images/blog` có 1.136 file. Cần cách chọn ảnh đúng chủ đề — hoặc chủ tự chọn lúc duyệt. |

---

## 6. Làm theo mấy đợt

**Đợt 1 — đọc được nhu cầu** (chưa viết gì)
Gom câu hỏi khách trong hộp thư, gộp lại, xếp theo số người hỏi. Ra một bảng "khách hay hỏi gì mà web chưa trả lời". *Chỉ cái bảng này thôi đã đáng tiền* — nó nói cho chủ biết web đang thiếu gì.

**Đợt 2 — soạn nháp + duyệt**
Thêm kênh Website vào màn đăng bài. AI soạn nháp từ đề tài đợt 1. Chủ duyệt.

**Đợt 3 — nối vào web**
Duyệt xong tự đẩy lên GitHub, CI kiểm, lên web.

**Đợt 4 — canh sau khi đăng**
Sau 60 ngày soát bài không ai đọc, báo chủ.

Mỗi đợt xong là dùng được ngay, không phải chờ đủ bộ.

---

## 7. Coi như thành công khi

- Mỗi tuần chủ mất **dưới 5 phút** mà web vẫn có bài mới đáng đọc
- **Không bài nào phải chặn khỏi Google** sau khi đăng (khác tháng 6)
- Sau 3 tháng: số trang được Google cho hiện **tăng**, và tỉ lệ bài chết **bằng 0**

---

## 8. Rủi ro đã nhìn thấy

| Rủi ro | Cách chặn |
|---|---|
| AI viết sai số liệu (giá, giờ, số đánh giá) | Lưới `check-facts` đã chặn ở CI — sai số là không lên được |
| Bài mới giẫm chân bài cũ | Cổng chất lượng mục 4, điều kiện 4 |
| Chủ bận, nháp dồn đống | Trần 1 bài/tuần; nháp quá 14 ngày không duyệt thì tự huỷ |
| Hai phiên cùng sửa app | Repo app đang có người làm song song — phải `git pull` và soi trước khi đụng |
| Đăng nhầm bài chưa xong | Chỉ đẩy lên nhánh riêng + PR, CI xanh mới vào `main` |
