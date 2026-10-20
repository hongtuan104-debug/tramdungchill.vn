# Giám sát uptime

Dựng 19/10/2026. Hai lớp:
1. **GitHub Actions** (lên GitHub 19/10/2026), không cần tài khoản dịch vụ nào, báo email + Telegram: `.github/workflows/giam-sat-uptime.yml`
   + `scripts/giam-sat-uptime.js`. Lịch đặt 15 phút/lần nhưng GitHub chạy thưa hơn nhiều: 19–20/10/2026 đo được
   **2,5–5 tiếng/lần** (lượt 19:22 → 23:02 → 01:42 → 06:42 UTC). Sự cố ngắn hơn vài tiếng có thể lọt; muốn
   phát hiện trong ~5 phút thì thêm lớp 2. Telegram đã thông 20/10/2026 (sếp cài secret, lượt chạy tay báo về được).
2. **UptimeRobot — tuỳ chọn**, lớp độc lập với GitHub. Sếp muốn thêm thì làm theo mục cuối.

## Vì sao cần
Trước 19/10/2026 web không có máy nào canh liên tục — chỉ biết web sập khi có người tình cờ mở
ra. Lịch sử Googlebot gặp lỗi chỉ xem được ở Search Console → Cài đặt → Thống kê thu thập dữ liệu
→ Trạng thái máy chủ (90 ngày, chỉ sếp mở được).

Đo 19/10/2026: 26/26 URL sitemap trả 200, DNS Cloudflare trả lời, chứng chỉ còn 76 ngày. Hai chỗ
dễ hỏng **âm thầm** nhất không phải trang web mà là đường nhận đơn (Apps Script, app, VPS báo Zalo) —
bug #4 từng làm rớt đơn mà không ai hay.

## 8 mục được kiểm
| # | Tên | Địa chỉ | Đạt khi |
|---|---|---|---|
| 1 | Trang chủ | `https://tramdungchill.vn/` | 200 + có `id="bookingForm"` |
| 2 | Thực đơn | `https://tramdungchill.vn/menu.html` | 200 + có `MENU_FLIPBOOK:START` |
| 3 | Bài blog | `https://tramdungchill.vn/blog/nuong-bbq-ngam-xe-lua.html` | 200 + có `blog-post-body` |
| 4 | robots.txt | `https://tramdungchill.vn/robots.txt` | 200 + có `Sitemap: https://tramdungchill.vn/sitemap.xml` |
| 5 | sitemap.xml | `https://tramdungchill.vn/sitemap.xml` | 200 + có `<urlset` |
| 6 | Form đặt bàn (Apps Script) | `webhookUrl` trong `data/site-config.js` | 200 + có `"status":"ok"` |
| 7 | App nhận đơn | `https://app.tramdungchill.vn/` | 200 (theo chuyển hướng) |
| 8 | VPS báo Zalo | `http://14.225.224.28:3456/` | trả lời < 500 + tiêu đề CORS có `x-webhook-token` |

Vì sao từng mục:
- **1–3** — ba khuôn trang khác nhau. Dùng từ khoá chứ không chỉ mã 200: trang đỗ tên miền khi hết
  hạn, hay một bản build hỏng, vẫn có thể trả 200 với nội dung sai. Đã thử: trang 404 của site
  không chứa từ khoá nào.
- **4** — robots.txt lỗi 5xx hay quá thời gian là **Google ngừng crawl cả site** cho tới khi tải lại
  được. Mục liên quan SEO trực tiếp nhất.
- **6** — địa chỉ đọc thẳng từ `site-config.js` (đổi deployment là máy kiểm theo). `doGet` chỉ trả một
  dòng JSON, không ghi Sheet, không gửi Telegram. ⚠️ Chỉ chứng minh deployment còn sống + còn quyền
  "Bất kỳ ai" (bug #4), KHÔNG chứng minh ghi đơn chạy — muốn chắc vẫn phải đặt thử một đơn.
- **8** — không có trang kiểm sức khoẻ; GET / trả 404, nhưng tiêu đề `x-webhook-token` là của đúng
  chương trình zalo-webhook. ⚠️ Kiểm cổng TCP trần KHÔNG đủ: cổng 3457 cạnh bên cũng mở (dịch vụ khác,
  tiêu đề `X-Hub-Signature`) — đã thử 19/10/2026. Chỉ chứng minh tiến trình pm2 còn sống, KHÔNG chứng
  minh OpenClaw → nhóm Zalo chạy.

## Lớp 1 — GitHub Actions (đang chạy)
- Mỗi mục hỏng **3 lần liền, cách 20 giây** mới tính là hỏng. Mọi mục đều đỏ mà google.com cũng không
  gọi được → máy kiểm mất mạng, bỏ qua lượt đó.
- **Báo động = issue** `[giam-sat] Sự cố: <các mục hỏng>`, gắn `@hongtuan104-debug` → GitHub gửi email,
  rồi **gửi Telegram** cho sếp (sếp yêu cầu 19/10/2026) kèm link issue — **bot riêng** (sếp chọn 19/10/2026, không dùng bot báo đơn), người nhận
  khai ở `NGUOI_NHAN` trong script (hiện `6022990090` — tài khoản đã bấm Start 19/10/2026; tài khoản nhận báo
  đơn `6293463576` chưa bấm Start nên chưa thêm). Vẫn hỏng thì im lặng (không gửi mỗi 15 phút); danh sách mục hỏng đổi thì sửa tiêu đề +
  bình luận + 1 tin 🟠; lên lại thì bình luận "đã lên lại, kéo dài ~N phút", tự đóng, 1 tin ✅.
  Nhắc chứng chỉ / tên miền cũng đi Telegram.
- Telegram gửi hỏng (chưa cài secret, sai mã bot…) → ghi bình luận vào issue; email vẫn tới.
- Có secret `ZALO_WEBHOOK_URL` / `ZALO_WEBHOOK_SECRET` (cùng cặp với `canh-bai-cu.yml`) thì nhắn Zalo
  thêm. Chưa biết secret đã cài chưa (lần chạy canh-bai-cu nào cũng chưa phải nhắn).
- **Bấm "Run workflow" tay** → luôn gửi 1 tin thử `🧪 Thử máy giám sát web` về Telegram; gửi không được thì
  lượt chạy đỏ, mở ra xem dòng `Tin thử: …` chỉ lỗi gì.

- **Nhắc chứng chỉ**: issue khi còn < 20 ngày (GitHub tự gia hạn từ ~30 ngày, tụt dưới 20 là kẹt).
- **Nhắc tên miền**: issue khi còn ≤ 30 ngày. Hạn .vn KHÔNG tra tự động được (không RDAP, iNET chặn API)
  → ghi tay ở `HAN_TEN_MIEN` trong `scripts/giam-sat-uptime.js`. **Gia hạn xong thì sửa ngày đó** rồi
  đẩy lên, issue nhắc tự đóng. Hiện: **13/12/2026** (đọc 06/10/2026) → issue sẽ tự mở ngày 13/11/2026.
- Không mở/đóng được issue (API lỗi) → workflow cố tình rớt → GitHub gửi mail "workflow failed".
- Chạy thử trên máy: `node scripts/giam-sat-uptime.js --thu` (chỉ in, không đụng GitHub/Zalo).
- ⚠️ **Giới hạn**: máy kiểm chạy trên chính GitHub — GitHub sập toàn bộ thì không báo được. Lịch chạy
  có lúc trễ: `canh-bai-cu` lịch 08:00 ngày 01/10/2026 chạy lúc 13:47. Cron đặt phút 7/22/37/52 để
  tránh giờ chẵn (lúc Actions đông nhất).
- Máy kiểm không chạy JavaScript → không bật GA4 / Meta / TikTok, không làm bẩn số đo lường.
- Kiểm logic issue bằng client giả 19/10/2026: 9 tình huống (im lặng khi ổn · mở · không lặp · đổi danh
  sách · đóng + tính phút · mở lại lần sau · nhắc chứng chỉ · nhắc tên miền đúng mốc 30 ngày · API hỏng).

### Cài Telegram — sếp làm 1 lần (~5 phút)
Dùng **bot riêng** chứ không dùng bot báo đơn: mã bot báo đơn chỉ nằm trong Apps Script, đem ra chỗ khác
là thêm một chỗ có thể lộ; tin giám sát cũng tách khỏi tin đơn, tắt/bật thông báo riêng được. Mã bot phải
nằm trong Secrets của GitHub (repo công khai), em không tự cài được.
1. **Tạo bot:** Telegram → tìm **@BotFather** (có dấu tích xanh) → **Start** → gửi `/newbot` → tên hiển thị,
   vd `Giám sát web Trạm Dừng Chill` → username phải kết thúc bằng `bot`, vd `tdc_giamsat_bot` (trùng thì
   thêm số). BotFather trả về mã dạng `123456789:AA…` → **chép-dán, đừng gõ lại**.
2. **Bấm Start với bot mới** (BotFather có gửi link `t.me/<username>`). Bắt buộc: chưa Start thì bot không
   được nhắn cho sếp, lỗi sẽ hiện là mã 400.
3. **Dán vào GitHub:** đăng nhập bằng tài khoản **chủ `hongtuan104-debug`** (tài khoản cộng tác viên không
   thấy trang Settings) → repo tramdungchill.vn → **Settings → Secrets and variables → Actions → New
   repository secret** → Name `TELEGRAM_BOT_TOKEN` → Secret: dán mã → **Add secret**.
4. **Thử:** tab **Actions** → **Giám sát uptime** → **Run workflow** → **Run workflow**. ~1–2 phút sau
   Telegram nhận tin 🧪. Lượt bấm tay này cũng là cú "mồi" nếu lịch tự động chưa chạy lượt nào.

## Khi nhận báo động (Telegram / email)
1. Mở thử bằng 4G trên điện thoại — sập thật hay chỉ máy kiểm thấy.
2. Trang web (mục 1–5) sập: xem githubstatus.com (mục Pages) và cloudflarestatus.com. Nếu vừa đổi
   gì trên Cloudflare thì quay lại bước trước đó — xem `docs/cloudflare-cache.md`. Lỗi ghi "Cloudflare
   đang chặn máy kiểm" thì có thể web vẫn chạy, chỉ máy kiểm bị chặn → thêm luật cho phép user-agent
   `TDC-giam-sat-uptime` trong Cloudflare.
3. Mục 6 đỏ: mở Apps Script → Triển khai → kiểm deployment `AKfycbz46uJ…` còn "Bất kỳ ai".
4. Mục 7 đỏ: xem dashboard Vercel của app.
5. Mục 8 đỏ: vào VPS, `pm2 status` / `pm2 restart zalo-webhook`.

⚠️ **Lúc bật mây cam Cloudflare là lúc dễ sập nhất** (chọn sai chế độ SSL → vòng chuyển hướng hoặc
lỗi 525/526). Sau khi bật, xem tab Actions của repo vài lượt liền.

## Lớp 2 — UptimeRobot (tuỳ chọn, độc lập với GitHub)
- Điều khoản sửa 26/05/2026: *"UptimeRobot is available for any use, including commercial and
  business use"* → quán dùng gói miễn phí được.
- Gói miễn phí: 50 mục, kiểm 5 phút/lần, có kiểm theo từ khoá. **KHÔNG** có Telegram (gói Solo),
  không canh hạn chứng chỉ / tên miền. Báo qua email + app UptimeRobot trên điện thoại.
- Cách tạo (~15 phút; tên nút theo trang hướng dẫn của UptimeRobot 19/10/2026, giao diện có thể khác):
  1. uptimerobot.com → Sign up → bấm link xác nhận trong hộp thư. Cài app UptimeRobot, bật thông báo.
  2. **+ Add New Monitor** → Monitor type **Keyword** → URL + Keyword theo bảng mục 1–6 → Alert when
     **Keyword not exists** → Interval **5 minutes** → tick email/app → **Create Monitor**.
  3. Mục 7: type **HTTP(s)**. Mục 8 bỏ qua, để lớp 1 lo: UptimeRobot không kiểm được tiêu đề, còn kiểu
     Port thì cổng mở chưa chắc là đúng chương trình (xem lý do mục 8 ở trên).
  4. Chờ ~5 phút, mọi mục phải **Up**. Mục nào đỏ ngay thì gần như chắc là dán sai từ khoá.
- Hoặc: đăng ký xong → **Integrations & API** → tạo **Main API key** → dán vào `.env`
  (`UPTIMEROBOT_API_KEY=…`, gitignore — repo công khai, đừng dán key chỗ nào khác) → em tạo hộ.
