# Mô tả chung cho mọi kênh — Tiệm Nướng Trạm Dừng Chill

> Bản chuẩn **29/09/2026** (rà chính tả + câu chữ 02/10/2026) — xoay quanh **VIEW** (sếp Tuấn: "giới thiệu về view"). Mọi kênh (Google Maps, Facebook,
> Instagram, TikTok, YouTube, Threads, X, Zalo, Apple Maps, Bing Places, Tripadvisor) dán đúng các khối dưới đây —
> **không viết riêng từng nơi**. Sếp tự dán lên kênh; file này không đụng gì tới website.
>
> Vì sao đồng bộ (rà độ hiển thị AI 29/09/2026): AI ghép thông tin quán từ nhiều kênh. YouTube, Threads, X còn ghi
> "Phường 11" và đóng cửa 22h — AI tóm tắt lặp lại đúng giờ sai đó. Tên trần "Trạm Dừng Chill" trùng vài cơ sở khác
> → mọi kênh dùng **tên đầy đủ**. ⛔ Không nhắc tới cơ sở nào khác (sếp chốt 29/09/2026).
>
> Câu tả view lấy từ chữ đã có trên web (translations.js, FAQ trang chủ, trang săn tàu) — không tự nghĩ thêm.
> Dữ kiện lấy từ `data/facts.json` + `data/site-config.js`. Kiểm độ dài + chữ cấm: `node scripts/kiem-mo-ta-kenh.js`.

## 1. Khối dữ kiện — giống hệt ở mọi nơi

| Mục | Ghi đúng như sau |
|---|---|
| Tên hiển thị | **Tiệm Nướng Trạm Dừng Chill** (viết hoa chữ N; không dùng "Trạm Dừng Chill" trần làm tên) |
| Địa chỉ | **111 Huỳnh Tấn Phát, Phường Xuân Trường - Đà Lạt, Lâm Đồng** (gạch nối — "- Đà Lạt" là một phần tên phường) |
| Địa chỉ tiếng Anh | 111 Huynh Tan Phat, Xuan Truong - Da Lat Ward, Lam Dong |
| Điện thoại / Zalo | **0989.765.070** (quốc tế: +84 989 765 070) |
| Giờ mở cửa | **15:00 – 23:00 hàng ngày** (bio ngắn viết 15h–23h) |
| Website | **https://tramdungchill.vn** |
| Chỉ đường | https://maps.app.goo.gl/LYKSGggSms2nwTWq7 |

**Ba view — cách nói thống nhất:**

| View | Viết là | Giờ |
|---|---|---|
| Hoàng hôn | nắng chiều vàng từ 15:00, hoàng hôn buông xuống thung lũng | từ khoảng **16:30** |
| Tàu cổ | tàu cổ Đà Lạt – Trại Mát chạy ngay dưới chân quán | khung **16:30 – 21:25** (không ghi giờ từng chuyến) |
| Nhà lồng | hàng nghìn nhà lồng trồng hoa lên đèn, cả thung lũng lung linh như biển sao | từ khoảng **18:30** |
| Chỗ ngồi | bàn ngoài trời nhìn thung lũng 180°; khu mái che vẫn thấy toàn cảnh, trời mưa vẫn ngồi được; bàn view không phụ thu | |

## 2. Kênh nào dùng khối nào

| Kênh | Mô tả | Ô link website |
|---|---|---|
| Google Maps (Business Profile) | **C** (ô "Mô tả doanh nghiệp", 750) | `https://tramdungchill.vn/?utm_source=google&utm_medium=referral&utm_campaign=local_listing` |
| Bing Places | **C** (hoặc nhập thẳng từ Google) | ô "Thẻ UTM": xem `docs/UTM-CONVENTION.md` mục Bing Places |
| Apple Maps (Apple Business) | **B** (ô "About", 250) — tiếng Anh dùng **B-EN** | `https://tramdungchill.vn` |
| Facebook | bio **A-FB** (101 — dán khối A sẽ bị cắt) · ô "Mô tả" **B** (255) · mục Giới thiệu **D** | `https://tramdungchill.vn/?utm_source=facebook&utm_medium=organic&utm_content=trang` |
| Instagram | **A** (150) | `https://tramdungchill.vn/?utm_source=instagram&utm_medium=organic&utm_content=bio` |
| TikTok chính @tiemnuongtramdungchill | **A** (tài khoản đang nhận 152 ký tự → giới hạn thật 160, không phải 80) | `https://tramdungchill.vn/?utm_source=tiktok&utm_medium=organic&utm_content=bio#booking` |
| YouTube @TramDungChill | **D** (1000) · tên kênh đổi thành "Tiệm Nướng Trạm Dừng Chill" | `https://tramdungchill.vn/?utm_source=youtube&utm_medium=organic&utm_content=kenh` |
| Threads | **A** (150) | `https://tramdungchill.vn` |
| X @tramdungchill | **A** (160) | `https://tramdungchill.vn` |
| Zalo 0989.765.070 | **A** | — |
| Tripadvisor | **E** (tiếng Anh) | có sẵn |

Tên hiển thị hiện lệch chữ hoa: Instagram, TikTok, Threads ghi "Tiệm **n**ướng" — sửa thành "Tiệm **N**ướng".

## 3. Các khối mô tả

### A. Bio ngắn — Instagram, TikTok, Threads, X, bio Facebook, Zalo

<!-- KHOI A max=150 -->
```text
🌅 Hoàng hôn · 🚂 Tàu cổ · ✨ Biển sao nhà lồng
☎ 0989.765.070
📍 111 Huỳnh Tấn Phát, P. Xuân Trường - Đà Lạt
🕰 15h–23h hàng ngày
🌐 tramdungchill.vn
```

Bio Facebook chỉ nhận 101 ký tự — SĐT, địa chỉ, giờ, website đã có ô riêng trên Trang nên bio chỉ nói view:

<!-- KHOI A-FB max=101 -->
```text
Quán nướng BBQ ngoài trời Đà Lạt: 🌅 hoàng hôn · 🚂 tàu cổ chạy dưới chân quán · ✨ biển sao nhà lồng
```

### B. Mô tả vừa — Apple Maps "About", ô "Mô tả" của Facebook

<!-- KHOI B max=250 -->
```text
Tiệm Nướng Trạm Dừng Chill – quán nướng BBQ ngoài trời nhìn ra thung lũng Đà Lạt. Hoàng hôn từ khoảng 16:30, tàu cổ Đà Lạt – Trại Mát chạy ngay dưới chân quán, từ khoảng 18:30 hàng nghìn nhà lồng lên đèn như biển sao.
```

<!-- KHOI B-EN max=250 -->
```text
Tiệm Nướng Trạm Dừng Chill is an outdoor BBQ restaurant overlooking a valley in Da Lat: sunset from about 4:30 PM, the vintage Da Lat – Trai Mat train rolling right below, and greenhouses glowing like a sea of stars from about 6:30 PM.
```

### C. Mô tả dài — Google Maps, Bing Places

Không link (Google cấm URL), không emoji (Google coi ký tự trang trí là "gimmicky"). Google chỉ hiện ~250 ký tự đầu
trước chữ "Xem thêm" → câu đầu phải nói đủ ba view.

<!-- KHOI C max=750 -->
```text
Tiệm Nướng Trạm Dừng Chill là quán nướng BBQ ngoài trời nhìn ra thung lũng Đà Lạt, với ba khung cảnh trong một buổi: hoàng hôn, tàu cổ và biển sao nhà lồng.

– Nắng chiều vàng từ 15:00, hoàng hôn buông xuống thung lũng từ khoảng 16:30.
– Tàu cổ Đà Lạt – Trại Mát chạy ngay dưới chân quán, trong khung 16:30 – 21:25.
– Từ khoảng 18:30, hàng nghìn nhà lồng trồng hoa lên đèn, cả thung lũng lung linh như biển sao; trời tối, đoàn tàu đèn vàng lướt ngang qua.

Bàn ngoài trời nhìn thung lũng 180°, khu mái che vẫn thấy toàn cảnh nên trời mưa vẫn ngồi được. Bàn view không phụ thu.

Thực đơn hơn 70 món gồm đồ nướng tại bàn, lẩu và đồ uống. Mở cửa 15:00 – 23:00 hàng ngày; nên đặt bàn trước để giữ bàn view hoàng hôn.
```

### D. Giới thiệu kênh — YouTube, mục Giới thiệu của Facebook (có link, có emoji)

<!-- KHOI D max=1000 -->
```text
Tiệm Nướng Trạm Dừng Chill là quán nướng BBQ ngoài trời nhìn ra thung lũng Đà Lạt, với ba khung cảnh trong một buổi:

🌅 Nắng chiều vàng từ 15:00, hoàng hôn buông xuống thung lũng từ khoảng 16:30.
🚂 Tàu cổ Đà Lạt – Trại Mát chạy ngay dưới chân quán, trong khung 16:30 – 21:25.
✨ Từ khoảng 18:30, hàng nghìn nhà lồng trồng hoa lên đèn, cả thung lũng lung linh như biển sao; trời tối, đoàn tàu đèn vàng lướt ngang qua.

Bàn ngoài trời nhìn thung lũng 180°, khu mái che vẫn thấy toàn cảnh nên trời mưa vẫn ngồi được. Bàn view không phụ thu. Thực đơn hơn 70 món gồm đồ nướng tại bàn, lẩu và đồ uống.
----------------------------------------
📍 Địa chỉ: 111 Huỳnh Tấn Phát, Phường Xuân Trường - Đà Lạt, Lâm Đồng
🕰 Mở cửa: 15:00 – 23:00 hàng ngày
☎ Đặt bàn giữ view: Zalo / gọi 0989.765.070
🌐 Đặt bàn online: https://tramdungchill.vn/#booking
🗺 Chỉ đường: https://maps.app.goo.gl/LYKSGggSms2nwTWq7
```

### E. Mô tả tiếng Anh — Tripadvisor (và nơi nào cần bản tiếng Anh dài)

Dòng cuối có link + SĐT: nền tảng nào không nhận thì bỏ dòng đó.

<!-- KHOI E max=750 -->
```text
Tiệm Nướng Trạm Dừng Chill (Tram Dung Chill BBQ) is an outdoor barbecue restaurant overlooking a valley in Da Lat, with three views in one visit:
- Golden afternoon light from 3 PM, and the sunset over the valley from about 4:30 PM.
- The vintage Da Lat – Trai Mat train running right below the restaurant, between 4:30 PM and 9:25 PM.
- From about 6:30 PM, thousands of flower greenhouses light up and the valley glows like a sea of stars.
Outdoor tables have a 180° valley view; the covered area keeps the view, so rain is no problem. No surcharge for view tables. 70+ menu items: table-grilled BBQ, hot pot and drinks. Open 3–11 PM daily.
111 Huynh Tan Phat, Xuan Truong - Da Lat Ward, Lam Dong. Book at tramdungchill.vn or Zalo +84 989 765 070.
```

## 4. Nhờ trang bên ngoài sửa (rà 29/09/2026)

Các trang này quán không tự sửa được — nhắn nhờ họ, dán nguyên dữ kiện ở mục 1.

| Trang | Đang ghi | Nhờ sửa thành |
|---|---|---|
| PasGo — bài "Top quán nướng ngon Đà Lạt" (pasgo.vn/kham-pha/top-quan-nuong-ngon-da-lat-1712) | "sức chứa khoảng 1.000 khách", không có giờ mở cửa | khoảng 1.500 chỗ ngồi · mở cửa 15:00–23:00 hàng ngày |
| Trip.com (thẻ địa điểm trong bài moments) | mở cửa 4:00 PM | 15:00 – 23:00 |
| xedulichdalat.vn/tiem-nuong-tram-dung-chill (bài 03/2025) | "gần 100 món", "65k đến 195k" | hơn 70 món · 95.000–300.000đ/người (đã gồm VAT) |

Mẫu tin nhắn (sửa tên trang cho hợp):

<!-- KHOI NHO-SUA max=1000 -->
```text
Chào anh/chị, em bên Tiệm Nướng Trạm Dừng Chill (Đà Lạt). Cảm ơn trang đã giới thiệu quán. Thông tin quán hiện có vài chỗ đã thay đổi, nhờ anh/chị cập nhật giúp:
- Địa chỉ: 111 Huỳnh Tấn Phát, Phường Xuân Trường - Đà Lạt, Lâm Đồng
- Giờ mở cửa: 15:00 – 23:00 hàng ngày
- Điện thoại / Zalo: 0989.765.070 · Website: tramdungchill.vn
- [dòng riêng cho trang này — xem bảng trên]
Em cảm ơn!
```

Tripadvisor: ô WiFi miễn phí và cho mang thú cưng nhỏ đều KHỚP web (FAQ trang chủ) — không cần sửa.

## 5. Luật khi sửa các khối trên

- **Nội dung chính là VIEW** (sếp chốt 29/09/2026). Menu chỉ một câu ngắn; giá, setup, bãi đỗ để website lo.
- **Không** "duy nhất", "số một", "#1", "No.1", "độc nhất", "nhất Đà Lạt", "view triệu đô" (sếp cấm 13/09/2026).
- Tàu: "tàu cổ Đà Lạt – Trại Mát chạy ngay dưới chân quán", chỉ ghi khung 16:30 – 21:25 — **không** ghi giờ từng chuyến,
  không "răng cưa". Ảnh minh hoạ câu tàu: chỉ dùng ảnh chắc chắn là tàu thật (thấy chữ "DALAT PLATEAU RAIL ROAD" / VNR,
  hoặc có khách trên toa đang chạy). **Đừng đoán theo kiểu cửa sổ** — 29/09/2026 sếp xác nhận một toa cửa sổ bo tròn
  khung nâu đỏ là tàu thật. Không chắc thì hỏi sếp.
- Hoàng hôn "từ khoảng 16:30"; nhà lồng "lên đèn từ khoảng 18:30". 15:00 là giờ MỞ CỬA, không phải hoàng hôn.
- Nếu nhắc setup: "bảng chúc mừng, hoa trang trí" — **không** hoa tươi, hoa hồng, nến; luôn kèm "cọc 200.000đ hoàn lại".
- **Không** ghi số lượt đánh giá (đổi hằng ngày, kênh nào quên sửa là lệch).
- Món: viết "hơn 70 món" (menu có 81).
- **Không nhắc tới cơ sở khác cùng tên / tên gần giống** — chỉ nói về quán mình.
