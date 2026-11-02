# Đặt Cloudflare trước GitHub Pages

> Soạn 06/09/2026 · **viết lại 06/10/2026** (bản cũ thiếu bản ghi `app`, ghi ngược thứ tự
> Cache Rules, khuyên SSL "Full (strict)" — xem mục "Năm cái bẫy").
> Việc bấm **sếp Tuấn tự làm** (cần tài khoản Cloudflare + đăng nhập iNET + GitHub).
> Sau mỗi giai đoạn chạy **`node scripts/kiem-cloudflare.js`** — nó canh đúng các bẫy dưới đây.

## Được gì, không được gì

| | Hiện tại | Sau Cloudflare |
|---|---|---|
| http → https | ✅ 301 (sếp bật Enforce HTTPS 10/10/2026) | ✅ 301 |
| HTTP/3 | không | có (tốt cho 4G chập chờn) |
| JS / CSS / phông có `?v=` | trình duyệt giữ 10 phút (GitHub ép) | giữ 1 năm · hết mục "Use efficient cache lifetimes" của PageSpeed |
| TTFB trang HTML | 0,13–0,16s từ máy làm việc (Fastly Singapore, đo 06/10) | 🟡 **không hứa nhanh hơn** — HTML cố ý không cho Cloudflare giữ, mỗi lượt vẫn về GitHub; gói Free ở VN có lúc đi qua PoP Singapore/HK |

Nói thẳng: lợi ích ở mức **vừa phải**. Core Web Vitals đã đạt cả điện thoại lẫn máy tính, và
service worker vốn đã giữ ảnh/JS/CSS cho khách quay lại. Đây là việc tối ưu thêm, không phải chữa cháy.

## Hiện trạng (đo 06/10/2026)

```
nameserver   ns1/ns2/ns3.inet.vn                         tên miền ở iNET
A     @      185.199.108.153 · .109 · .110 · .111      GitHub Pages
CNAME www    hongtuan104-debug.github.io
CNAME app    cname.vercel-dns.com                        ← APP NHẬN ĐƠN ĐẶT BÀN (Vercel)
MX    @      10 mx1.improvmx.com                         chuyển tiếp email (có từ sau 06/10; thấy 10/10/2026)
TXT / CAA / DNSSEC: không có                             → chuyển rất gọn, 7 bản ghi
chứng chỉ GitHub   Let's Encrypt, cấp 05/10/2026, hết hạn 03/01/2027
tên miền     hết hạn 13/12/2026 — gia hạn ở iNET (Cloudflare không nhận đăng ký/chuyển .vn)
```

---

## ⚠️ Năm cái bẫy

### 1. `app` bật mây cam → app nhận đơn hỏng
`app.tramdungchill.vn` là app nhận đơn đặt bàn chạy trên Vercel, **không phải GitHub**. Vercel
có chứng chỉ và CDN riêng, không nên đặt sau proxy Cloudflare. Bản ghi này **luôn để mây XÁM
(DNS only)**. Tài liệu bản cũ không ghi bản ghi này.

### 2. Cloudflare chặn bot AI theo mặc định
- Từ **15/09/2026**, domain mới thêm vào Cloudflare **mặc định chặn bot AI** (loại Training +
  Agent) trên những trang Cloudflare tự đoán là "có quảng cáo". Site không hiện quảng cáo nhưng
  có tag Google Ads; đừng để nó đoán, chọn rõ.
- **"Managed robots.txt"** chèn lên ĐẦU robots.txt của mình các lệnh `Disallow: /` cho GPTBot,
  ClaudeBot, Google-Extended, Applebot-Extended, CCBot, Amazonbot, Bytespider, kèm dòng
  `Content-signal: ai-train=no`.

Cả hai đi ngược chiến lược hiển thị trên AI Search (CLAUDE.md bug #33, luật R23).
→ Chọn **Allow / Do not block**, và **tắt** managed robots.txt.

### 3. Chứng chỉ GitHub có thể không gia hạn được sau khi bật proxy → chọn SSL **"Full", KHÔNG "Full (strict)"**
Khi đã bật mây cam, DNS trả IP của Cloudflare chứ không phải IP GitHub, và Cloudflare chuyển
yêu cầu xác minh của Let's Encrypt sang https. Đã có nhiều người báo GitHub gia hạn được vài
tháng rồi hỏng ([Let's Encrypt community, 12/2024](https://community.letsencrypt.org/t/fyi-for-github-pages-or-vercel-netlify-with-cloudflare/231054)).
- **Full (strict)**: Cloudflare đòi chứng chỉ GitHub còn hạn → hết hạn là **cả site sập lỗi 526**.
  Với chứng chỉ hiện tại, ngày đó là **03/01/2027**, nếu không ai để ý.
- **Full**: vẫn mã hoá đoạn Cloudflare ↔ GitHub nhưng không đòi chứng chỉ GitHub còn hạn → site
  **không phụ thuộc** vào việc GitHub gia hạn. Khách luôn thấy chứng chỉ của Cloudflare (Cloudflare tự gia hạn).
- **Flexible**: tuyệt đối không dùng (bật cùng Enforce HTTPS là trang chuyển hướng vòng tròn).

⚠️ Cloudflare mới để mặc định **"Automatic SSL/TLS"**. Thấy GitHub có chứng chỉ hợp lệ, nó sẽ tự
chọn strict → phải vào **Custom** chọn tay **Full**.

### 4. Cache `sw.js` dài = gạch website, không sửa được từ xa
Service worker quyết định khách nhận bản nào. Nếu chính nó bị giữ 1 năm thì khách cũ **không bao
giờ** nhận bản mới, và không có cách ép từ xa. → `/sw.js`, mọi `.html`, `/`, `manifest.json`,
`sitemap.xml`, `robots.txt` **không bao giờ cache**.

### 5. Cache Rules: rule đứng SAU thắng
Khi nhiều Cache Rule cùng khớp, Cloudflare gộp lại và **giá trị của rule khớp CUỐI cùng thắng**
([tài liệu Cloudflare](https://developers.cloudflare.com/cache/how-to/cache-rules/order/)).
Bản cũ của tài liệu này ghi ngược lại. Hai rule bên dưới được viết để **không bao giờ cùng khớp
một URL**, nên thứ tự không quan trọng. Dù vậy cứ để rule "Không bao giờ cache" ở cuối cho chắc.

---

## Các bước

Làm theo **hai giai đoạn**: chuyển DNS với mây xám trước (site vẫn chạy thẳng GitHub, không
gián đoạn giây nào), chứng chỉ Cloudflare sẵn sàng rồi mới bật mây cam.
Nên làm **buổi sáng** (quán mở 15:00), lúc ít khách đặt bàn.

### B0. GitHub: bật Enforce HTTPS — làm TRƯỚC · ✅ ĐÃ XONG 10/10/2026
GitHub repo → **Settings → Pages** → tick **Enforce HTTPS**.
Sau khi qua Cloudflare, GitHub không còn thấy IP của mình nên ô này thường bị khoá xám, không bấm
được nữa. Bật trước để nếu phải quay lại thì http vẫn tự sang https.
→ Chạy script: mục `http → https` phải ✅.

### B1. Tạo tài khoản + thêm tên miền
1. Đăng ký tại dash.cloudflare.com, chọn gói **Free**.
2. **Add a domain** → `tramdungchill.vn` → quét DNS tự động (quick scan).
3. Gặp màn hỏi về **AI crawlers / AI bots**: chọn **Do not block / Allow**.
   Gặp ô **robots.txt / Content Signals / "Instruct AI bot traffic with robots.txt"**: **TẮT**.

### B2. Kiểm bảng DNS — đúng 7 bản ghi, giai đoạn đầu TẤT CẢ mây xám

| Loại | Tên | Nội dung | Giai đoạn 1 | Giai đoạn 2 (B5) |
|---|---|---|---|---|
| A | `@` | `185.199.108.153` | xám | **cam** |
| A | `@` | `185.199.109.153` | xám | **cam** |
| A | `@` | `185.199.110.153` | xám | **cam** |
| A | `@` | `185.199.111.153` | xám | **cam** |
| CNAME | `www` | `hongtuan104-debug.github.io` | xám | **cam** |
| CNAME | `app` | `cname.vercel-dns.com` | xám | **xám — mãi mãi** |
| MX | `@` | `mx1.improvmx.com`, ưu tiên 10 | (MX không có mây) | giữ nguyên — xoá là mất email |

Bản quét thiếu bản ghi nào thì thêm tay. Bản quét bày thêm bản ghi lạ thì **tra DNS thật trước** rồi mới xoá
(10/10/2026 dòng MX ImprovMX trông lạ nhưng là bản ghi thật ở iNET).
⚠️ Bản quét tự động để **mọi** bản ghi A/CNAME ở mây CAM — phải gạt tay từng dòng về xám (đã gặp 10/10/2026).
Trước khi sang B3, **chụp màn hình bảng DNS ở iNET** (để quay lại nếu cần).

### B3. iNET: đổi nameserver
Trang quản trị tên miền iNET → `tramdungchill.vn` → đổi nameserver: thay `ns1/ns2/ns3.inet.vn`
bằng **2 nameserver Cloudflare cấp** (dạng `xxx.ns.cloudflare.com`).
Chờ Cloudflare gửi mail báo domain **Active** (thường vài phút, lâu nhất 24 giờ). Trong lúc chờ,
site vẫn chạy bình thường vì cả hai bên trả cùng một bộ bản ghi.
→ Chạy script: mục `Nameserver` phải báo "đã ở Cloudflare".

### B4. Cài sẵn mọi thứ TRƯỚC khi bật mây cam
**a. SSL/TLS**
- SSL/TLS → Overview → **Configure → Custom → Full** (không strict, không Flexible — bẫy #3).
- SSL/TLS → Edge Certificates: chờ chứng chỉ **Universal** báo **Active**.
- Cùng trang đó: **Always Use HTTPS = TẮT** (ô này không có ngoại lệ theo đường dẫn; dùng
  Redirect Rule bên dưới thay thế, theo đúng khuyến nghị của Cloudflare).

**b. Redirect Rule http → https** (Rules → Redirect Rules → Create)
- Tên: `http sang https`
- Biểu thức (Edit expression):
  ```
  (not ssl and not starts_with(http.request.uri.path, "/.well-known/"))
  ```
- Then: **Dynamic** · `concat("https://", http.host, http.request.uri.path)` · **301** ·
  tick **Preserve query string**.
- Chừa `/.well-known/` là để GitHub còn cơ hội tự gia hạn chứng chỉ. Gia hạn được thì tốt;
  không được thì site vẫn chạy nhờ chế độ Full.

**c. Cache Rules** (Caching → Cache Rules → Create rule → Edit expression)

Rule 1 — `Có vân tay — giữ 1 năm`
```
(http.request.uri.query contains "v=" and http.request.uri.path.extension in {"js" "css" "webp" "woff2"} and http.request.uri.path ne "/sw.js")
```
→ Eligible for cache · Edge TTL: **Ignore cache-control header, 1 year** · Browser TTL:
**Override origin, 1 year**.
→ **Status code TTL: Greater than or equal · 400 · No store** (thêm 10/10/2026). Không có dòng này thì
một lần GitHub trả 404/5xx cho URL có vân tay (vừa push, file chưa lên hết máy chủ) có thể bị giữ ở edge
cả năm — URL đó hỏng với mọi khách tới khi có người purge tay. `kiem-cloudflare.js` gọi thử một URL
`?v=` không tồn tại hai lần để canh.

Rule 2 — `Không bao giờ cache` (đặt **cuối**)
```
(http.request.uri.path eq "/sw.js") or (http.request.uri.path.extension eq "html") or (http.request.uri.path in {"/" "/manifest.json" "/sitemap.xml" "/robots.txt"})
```
→ **Bypass cache**.

Vì sao chỉ hai rule:
- **Có vân tay**: 100% JS/CSS (`dist/` `js/` `data/`), 100% phông (26/26 chỗ gọi, có vân tay từ
  14/09/2026), 100% ảnh trang thực đơn. URL đổi theo nội dung nên giữ 1 năm an toàn. 🟢 Đã kiểm
  06/10: bộ nhớ đệm của GitHub (Fastly) tính cả `?v=` vào khoá, nên `?v=` mới luôn lấy file mới.
- **Ảnh `assets/images/` (0/115 chỗ gọi có vân tay)**: cố ý **không** có rule. Để y như GitHub
  (10 phút), vì service worker đã giữ ảnh kiểu cache-first cho khách quay lại. Thêm rule giữ lâu
  thì lợi ích nhỏ mà mỗi lần thay ảnh cùng tên phải nhớ purge.
  → **Không phải thêm bước purge nào vào quy trình sửa code.**
- Thư mục kiểu `/duong-di/` không có đuôi file nên Cloudflare vốn không giữ.

**d. Tắt những thứ Cloudflare tự sửa trang** (gặp ở đâu thì tắt ở đó)
- **Rocket Loader**: tắt (Speed → Optimization). Nó viết lại thẻ `<script>`, phá thứ tự `defer`
  và cơ chế hoãn pixel (bug #9, #20).
- **Speed Brain**: tắt. Nó tải trước trang khi rê chuột, mà HTML mình không cho Cloudflare giữ.
- **Web Analytics / RUM tự động**: đừng bật. Site đã có RUM riêng gửi GA4 (bug #31); chèn thêm
  script là đè lên LCP/TBT.
- **Bot Fight Mode**: để tắt (nó chèn script kiểm tra JS vào trang).
- **Security → AI bots**: kiểm lại vẫn là **Allow**, managed robots.txt **tắt**.

### B5. Bật mây cam
Bật **cam** cho 4 bản ghi A + `www`. **`app` giữ xám.** Có hiệu lực sau vài phút.
→ Chạy script. Mong đợi: 0 ❌. Các mục quan trọng:
`app … không đi qua proxy` ✅ · `robots.txt y hệt file trong repo` ✅ ·
`Không giữ lâu: /sw.js` ✅ · `Giữ lâu (có vân tay)` ✅ · `HTML không bị chèn script` ✅ · `HTTP/3` ✅.
Mở thử trang chủ bằng điện thoại, đặt thử một đơn để chắc app nhận đơn vẫn chạy.

---

## Sau khi xong

- **Quy trình sửa code KHÔNG đổi.** HTML + `sw.js` không cache nên push xong khách vẫn thấy bản
  mới như cũ. Tài sản có vân tay đổi URL theo nội dung. Ảnh để y như GitHub. Không phải purge gì.
- **Bản ghi DNS mới** (vd TXT xác minh Domain property Search Console, Bing Webmaster) từ nay
  **thêm ở Cloudflare**, không thêm ở iNET nữa.
- **Cập nhật** CLAUDE.md (Stack & Build) + memory `hosting-cdn-thuc-te`: site đã sau Cloudflare.

### Mốc theo dõi
| Ngày | Việc |
|---|---|
| ngay sau B5 | `node scripts/kiem-cloudflare.js` · đặt thử 1 đơn |
| ~4 tuần sau | so TTFB/LCP trong GA4 (sự kiện RUM, bug #31) với trước khi chuyển; CrUX cửa sổ 28 ngày mới đổi |
| **trước 13/12/2026** | **gia hạn tên miền ở iNET** — Cloudflare không gia hạn hộ .vn |
| ~05/12/2026 | GitHub tới kỳ gia hạn chứng chỉ. Chạy script xem mục `Chứng chỉ gốc GitHub (sau proxy)`. Không gia hạn được thì site vẫn chạy (chế độ Full), chỉ ảnh hưởng tới việc quay lại (mục dưới) |

## Quay lại (rollback)

**Nhanh:** chuyển 4 bản ghi A + `www` từ cam → xám, có hiệu lực sau vài phút.
⚠️ Trước khi làm, chạy script xem **chứng chỉ gốc GitHub còn hạn không**. Bỏ proxy là khách
gặp thẳng chứng chỉ GitHub; hết hạn thì trình duyệt báo "không an toàn". Nếu đã hết hạn:
chuyển xám → GitHub Settings → Pages → xoá custom domain → lưu → điền lại `tramdungchill.vn`
→ chờ GitHub cấp chứng chỉ mới (vài phút tới 1 giờ). Thao tác này làm GitHub tự commit sửa file
`CNAME` hai lần, nên nhớ `git pull` trước khi push tiếp.

**Hẳn:** đổi nameserver ở iNET về `ns1/ns2/ns3.inet.vn`. Đối chiếu bảng DNS ở iNET với ảnh chụp
ở bước B2.
