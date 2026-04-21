# UTM Convention — TDC Ads

> Chuẩn tag URL cho mọi ads + link share. Dùng với UTM Builder: https://tramdungchill.vn/dev/utm-builder.html

## Tại sao cần UTM

GA4 mặc định chỉ biết traffic đến từ đâu khi URL có query string `?utm_*`. Không có UTM → mọi click từ TikTok/FB (bất kể ads trả tiền hay post free) đều gộp chung vào **"Organic Social"** → không phân biệt được **ads có hiệu quả không**.

Có UTM → GA4 tách:
- `tiktok / cpc` = ads TikTok trả tiền
- `tiktok / organic` = post TikTok free
- `facebook / cpc` = ads Facebook trả tiền
- …

## Bảng quy ước

### `utm_source` (nguồn — BẮT BUỘC)

| Giá trị | Khi nào dùng |
|---------|--------------|
| `tiktok` | TikTok Ads + TikTok organic post/bio |
| `facebook` | Facebook Ads + FB organic post/page |
| `instagram` | Instagram Ads + IG organic post/bio |
| `google` | Google Ads + Google My Business link |
| `zalo` | Zalo OA, Zalo share, Zalo group link |
| `youtube` | YouTube Ads + video description |
| `kol` | Gửi link cho KOL/influencer share |
| `email` | Email marketing |
| `sms` | SMS blast |
| `qr` | QR code offline (menu, bảng, card) |

### `utm_medium` (loại traffic — BẮT BUỘC)

| Giá trị | Ý nghĩa |
|---------|---------|
| `cpc` | Ads **trả tiền** (Cost-Per-Click) — TikTok/FB/IG/Google Ads |
| `organic` | Post tự nhiên (không trả tiền) |
| `social` | Link share trong group/page (mập mờ giữa organic/paid) |
| `email` | Email blast |
| `messenger` | Link trong tin nhắn FB/Zalo |
| `referral` | Link từ web khác trỏ về |
| `affiliate` | KOL commission link |
| `qr` | QR code vật lý |

**Rule nhớ:** trả tiền = `cpc`, không trả tiền = `organic`.

### `utm_campaign` (chiến dịch — NÊN CÓ)

Phải match với **"chủ đề / USP"** của ad, KHÔNG phải platform.

| Campaign | Dùng cho |
|----------|----------|
| `hoang_hon_15h` | Ads/post bán hoàng hôn 15h |
| `nha_long_1830` | Ads về nhà lồng đèn 18h30 |
| `bo_tang_pho_mai` | Ads bán món signature bò tảng phô mai |
| `san_tau_dem` | Ads tàu đêm Đà Lạt |
| `cau_hon_hen_ho` | Ads nhóm đối tượng cặp đôi |
| `team_building` | Ads nhóm đối tượng công ty |
| `sinh_nhat` | Ads dịp sinh nhật |
| `retargeting` | Ads retarget khách đã vào web |
| `lookalike_1p` | Ads lookalike 1% từ seed list |
| `brand_awareness` | Ads đánh nhận diện chung |
| `seo_blog` | Link từ blog post share |

**Rule đặt tên:** snake_case, **không dấu**, không khoảng trắng.

### `utm_content` (phân biệt ad cụ thể)

Dùng khi 1 campaign chạy nhiều ad → để biết ad nào hiệu quả.

Format: `<format>_<topic>_<variant>`

Ví dụ:
- `video_sunset_15s` — video hoàng hôn 15 giây
- `carousel_menu_5card` — carousel 5 ảnh menu
- `reel_nha_long_30s` — reel 30s nhà lồng
- `image_bo_tang_static` — ảnh tĩnh bò tảng
- `video_testimonial_khach` — video review khách

### `utm_term` (keyword — chỉ dùng cho Search Ads)

Bỏ qua cho TikTok/FB/IG ads. Chỉ cần cho Google Search Ads.

---

## Template hay dùng

### TikTok Ads — video hoàng hôn
```
https://tramdungchill.vn/?utm_source=tiktok&utm_medium=cpc&utm_campaign=hoang_hon_15h&utm_content=video_sunset_15s
```

### Meta Ads — carousel menu
```
https://tramdungchill.vn/menu.html?utm_source=facebook&utm_medium=cpc&utm_campaign=bo_tang_pho_mai&utm_content=carousel_menu_5card
```

### Retargeting Meta
```
https://tramdungchill.vn/?utm_source=facebook&utm_medium=cpc&utm_campaign=retargeting&utm_content=image_nha_long_dem
```

### KOL share link
```
https://tramdungchill.vn/?utm_source=kol&utm_medium=affiliate&utm_campaign=hoang_hon_15h&utm_content=kol_tenkhach_reel
```

### Zalo OA broadcast
```
https://tramdungchill.vn/?utm_source=zalo&utm_medium=messenger&utm_campaign=sinh_nhat
```

### QR code offline (menu, card)
```
https://tramdungchill.vn/menu.html?utm_source=qr&utm_medium=qr&utm_campaign=menu_ban_offline
```

---

## Anti-patterns — ĐỪNG làm

❌ `utm_source=Facebook` (chữ HOA, khác với `facebook`) → GA gộp vào 2 row khác nhau
❌ `utm_source=fb&utm_medium=ads` (không chuẩn) → dùng `facebook` + `cpc`
❌ `utm_campaign=Chương trình Hoàng Hôn` (có dấu + space) → dùng `hoang_hon_15h`
❌ `utm_content=video_1,video_2` (comma) → tách thành 2 URL riêng
❌ Đổi path chính thay vì thêm query: `tramdungchill.vn/?from=tiktok` → phải `?utm_source=tiktok`

---

## Verify sau 24-48h

1. Mở GA4 → **Báo cáo** → **Thu hút** → **Traffic acquisition**
2. Chọn dimension: `Session source / medium`
3. Phải thấy các row riêng biệt:
   - `tiktok / cpc`
   - `tiktok / organic`
   - `facebook / cpc`
   - …
4. Nếu chỉ thấy `(not set) / (not set)` hoặc `direct / none` → URL chưa đúng, check lại

---

## Workflow recommended

1. Mở https://tramdungchill.vn/dev/utm-builder.html
2. Click preset (TikTok Ads / FB Ads / …)
3. Chọn landing page
4. Chọn campaign chip hoặc tự gõ
5. Gõ `utm_content` (tên ad variant cụ thể)
6. Copy URL → paste vào Ads Manager → Save
7. Ads review 15-30 phút (FB) hoặc 1-2h (TikTok)
8. Sau 24h check GA4 Traffic acquisition

---

## Lưu ý quan trọng cho ads hiện tại

Nếu anh đang chạy ads rồi, thay URL mới sẽ **reset learning phase** của ad. TikTok/FB phải học lại 3-5 ngày trước khi optimize ổn định.

→ **Đề xuất:** Tag UTM cho ads mới. Với ads cũ đang ROI tốt, không đổi URL. Chấp nhận 1-2 tuần overlap data mơ hồ, sau đó mọi ads mới đều tag UTM → data sạch dần.
