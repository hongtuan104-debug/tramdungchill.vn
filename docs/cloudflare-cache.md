# Đặt Cloudflare trước GitHub Pages — cache dài + HTTP/3

> Soạn 06/09/2026, sau khi rà soát mục 124–133 (Cache & Kết nối).
> Việc này **sếp Tuấn phải tự bấm** (cần tài khoản Cloudflare + quyền đổi
> nameserver ở iNET). Em Claude làm được phần chuẩn bị cấu hình và verify sau.

## Vì sao làm

Hai giới hạn của GitHub Pages, không sửa được bằng code:

| Đo được hôm nay | Hiện tại | Sau Cloudflare |
|---|---|---|
| `Cache-Control` mọi file | `max-age=600` | tự đặt được, tới 1 năm |
| HTTP/3 | không (không có `alt-svc`) | có, bật mặc định |
| TTFB từ VN | 0,28–0,40s (edge Fastly Singapore) | 🟡 ước tính thấp hơn — Cloudflare có PoP tại VN |

Bảng TTFB là **ước tính**, không phải cam kết. Đo lại sau khi xong bằng lệnh ở
cuối tài liệu rồi mới kết luận.

## Hiện trạng (xác nhận 06/09/2026)

```
nameserver   ns1.inet.vn · ns2.inet.vn · ns3.inet.vn     → tên miền ở iNET
A   tramdungchill.vn      185.199.108-111.153            → 4 IP GitHub Pages
CNAME www                 hongtuan104-debug.github.io
chứng chỉ   Let's Encrypt do GitHub cấp, hết hạn 30/10/2026
www → apex  301, cả http lẫn https
```

---

## ⚠️ Ba cái bẫy phải biết TRƯỚC khi bấm

### 1. Cache `sw.js` dài = gạch website, không sửa được từ xa

Đây là rủi ro nghiêm trọng nhất. Service worker là thứ quyết định khách nhận
bản nào; nếu chính nó bị cache 1 năm thì khách cũ **không bao giờ** nhận được
service worker mới, và toàn bộ cơ chế vân tay `?v=` vừa làm ngày 06/09/2026
thành vô dụng. Tệ hơn: không có cách nào ép từ xa, phải đợi hết hạn.

→ `/sw.js` **bắt buộc** bypass cache. Cùng nhóm: mọi `.html`, `manifest.json`,
`sitemap.xml`, `robots.txt`.

### 2. Gia hạn chứng chỉ có thể gãy khi bật proxy

GitHub Pages gia hạn Let's Encrypt bằng HTTP-01 challenge trên
`/.well-known/acme-challenge/`. Bật proxy Cloudflare + "Always Use HTTPS" thì
challenge bị chuyển hướng sang HTTPS và có thể hỏng. Cert hiện tại hết hạn
**30/10/2026**, GitHub thường gia hạn trước ~30 ngày, tức **khoảng đầu 10/2026**.

→ Phải có rule cho `/.well-known/*`: bypass cache, **không** ép HTTPS.
→ Làm sớm (bây giờ) để còn ~3 tuần đệm phát hiện sự cố trước kỳ gia hạn.
→ Nếu cert vẫn không gia hạn được: tạm tắt proxy (chuyển sang DNS only, mây xám)
   khoảng 1 giờ cho GitHub gia hạn xong rồi bật lại.

### 3. Chỉ cache dài thứ CÓ vân tay

Rà soát toàn bộ tham chiếu trong 156 trang (06/09/2026):

| Đường dẫn | Có vân tay | Kết luận |
|---|---|---|
| `/dist/*.js` `/dist/*.css` | 100% | cache 1 năm an toàn |
| `/js/*.js` `/data/*.js` | 100% | cache 1 năm an toàn |
| `/assets/menu-pages/*` | 100% (30 tham chiếu) | cache 1 năm an toàn |
| `/assets/images/*` | **0%** (1.098 tham chiếu) | ❌ không cache dài ở trình duyệt |
| `/assets/fonts/*.woff2` | **0%** (594 tham chiếu) | ❌ không cache dài ở trình duyệt |

Phông đặc biệt dễ nhầm là "không bao giờ đổi": `cat-phong.js` cắt lại phông mỗi
khi nội dung site thêm chữ mới — CLAUDE.md đã ghi "git status hiện 4 file .woff2
đổi sau khi build là bình thường". Cache 1 năm ở trình duyệt là khách cũ dính
phông thiếu glyph.

**Cách xử lý cho nhóm không vân tay:** cho **Edge TTL dài** (Cloudflare giữ, mọi
khách hưởng tốc độ) nhưng **Browser TTL ngắn** (trình duyệt hỏi lại). Deploy xong
purge Cloudflare là cả thế giới thấy bản mới ngay.

---

## Các bước

### B1. Thêm site vào Cloudflare
1. Tạo tài khoản Cloudflare (gói **Free** là đủ).
2. Add a Site → `tramdungchill.vn` → chọn Free.
3. Cloudflare tự quét DNS. **Đối chiếu cho đủ** với bảng hiện trạng bên trên —
   thiếu bản ghi nào thì thêm tay, nhất là bản ghi email nếu có.
4. Đặt proxy (mây **cam**) cho: 4 bản ghi A của apex, và CNAME `www`.

### B2. Đổi nameserver ở iNET
Vào trang quản trị tên miền tại iNET, thay `ns1/ns2/ns3.inet.vn` bằng cặp
nameserver Cloudflare cấp ở bước B1.

⏱️ Lan truyền thường 5 phút – 24 giờ. Trong lúc chờ, site vẫn chạy bình thường.

### B3. SSL/TLS
- Mode: **Full (strict)** — GitHub Pages có cert hợp lệ nên strict dùng được.
- Bật "Always Use HTTPS" — **nhưng phải làm B4 trước hoặc cùng lúc.**
- Giữ nguyên "Enforce HTTPS" bên GitHub Pages.

### B4. Rule chừa đường cho gia hạn cert  ← ĐỪNG BỎ QUA
Tạo rule cho `/.well-known/*`: **bypass cache** và **không** ép HTTPS.
Đây là cái chặn bẫy #2.

### B5. Cache Rules

Thứ tự quan trọng — rule đứng trước thắng. Đặt đúng thứ tự này:

**Rule 1 — Không bao giờ cache (bẫy #1)**
```
(http.request.uri.path eq "/sw.js")
or (http.request.uri.path.extension eq "html")
or (http.request.uri.path eq "/")
or (http.request.uri.path in {"/manifest.json" "/sitemap.xml" "/robots.txt"})
```
→ Bypass cache.

**Rule 2 — Tài sản CÓ vân tay: cache 1 năm**
```
(http.request.uri.query contains "v=" and
 http.request.uri.path.extension in {"js" "css" "webp"})
```
→ Edge TTL 1 năm · Browser TTL 1 năm.
Điều kiện `query contains "v="` là chốt an toàn: không có vân tay thì không
lọt vào rule này, kể cả file trong `/dist/`.

**Rule 3 — Ảnh + phông (không vân tay)**
```
(starts_with(http.request.uri.path, "/assets/images/"))
or (starts_with(http.request.uri.path, "/assets/fonts/"))
```
→ Edge TTL 1 tháng · **Browser TTL 1 ngày**.
Edge dài để nhanh, browser ngắn để thay ảnh/phông xong khách nhận được sau khi purge.

### B6. Bật HTTP/3
Speed → Optimization → bật HTTP/3 (QUIC). Thường đã bật sẵn.

---

## Sau khi deploy: purge (mục 130)

Quy trình sửa code trong CLAUDE.md giữ nguyên, **thêm một bước cuối**: purge
Cloudflare cho những đường dẫn đã đổi.

- Tài sản có vân tay: **không cần purge** — URL đổi theo nội dung.
- `sw.js`, `.html`: không cache nên cũng không cần.
- **Ảnh, phông**: đổi thì phải purge, vì không có vân tay.

Purge chọn lọc theo URL, đừng "Purge Everything" cho quen tay — làm thế là vứt
sạch cache rồi mọi khách chịu lượt tải nguội.

---

## Verify sau khi xong

```bash
# 1. max-age đã dài chưa (tài sản có vân tay)
curl -sSI "https://tramdungchill.vn/dist/common.min.js?v=e8c99505" | grep -i "cache-control\|cf-cache-status"

# 2. sw.js PHẢI không được cache dài  ← quan trọng nhất
curl -sSI "https://tramdungchill.vn/sw.js" | grep -i "cache-control\|cf-cache-status"

# 3. ảnh: edge dài, browser ngắn
curl -sSI "https://tramdungchill.vn/assets/images/hero-sunset.webp" | grep -i "cache-control\|cf-cache-status"

# 4. HTTP/3 đã quảng bá chưa
curl -sSI "https://tramdungchill.vn/" | grep -i "alt-svc"

# 5. TTFB — chạy 3 lần, so với 0,28–0,40s trước khi đổi
for i in 1 2 3; do curl -sS -o /dev/null -w "TTFB=%{time_starttransfer}s\n" "https://tramdungchill.vn/"; done

# 6. cert vẫn hợp lệ
echo | openssl s_client -connect tramdungchill.vn:443 -servername tramdungchill.vn 2>/dev/null | openssl x509 -noout -issuer -dates
```

Mốc cần theo dõi: **đầu 10/2026** — kỳ gia hạn cert đầu tiên sau khi bật proxy.
Chạy lệnh 6, nếu `notAfter` không lùi ra xa thì làm theo bẫy #2.

## Rollback

Đổi nameserver ở iNET về `ns1/ns2/ns3.inet.vn`. Site quay lại chạy thẳng GitHub
Pages. Nhanh hơn nữa: tắt proxy (mây cam → xám) từng bản ghi, có hiệu lực trong
vài giây mà không cần đợi DNS lan truyền.
