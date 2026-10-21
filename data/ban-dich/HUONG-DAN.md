# Hướng dẫn dịch web tramdungchill.vn

Web có bản **dịch sẵn** 6 thứ tiếng (không dùng Google Dịch): English `en` · 中文 giản thể `zh` · 한국어 `ko` · 日本語 `ja` · Русский `ru` · ไทย `th`.
Mỗi câu tiếng Việt (hoặc tiếng Anh, với 2 bài viết gốc tiếng Anh) là một khoá trong `data/ban-dich/<mã>.json`.
Máy build ráp bản dịch vào trang, sinh ra `/en/…`, `/zh/…`… (xem `scripts/dich-trang.js`).

Người đọc là **khách du lịch nước ngoài** đang tìm quán ăn ở Đà Lạt (Singapore, Malaysia, Hàn, Trung, Nhật, Nga, Thái…).
Viết tự nhiên như người bản xứ viết cho khách, không dịch từng chữ, nhưng **không thêm và không bớt sự thật nào**.

## 1. Định dạng nộp

- File xuất: `plans/ban-dich/<mã>-NN.json`, gồm `cau: [{ id, goc, ngu_canh, tieng_goc }]`.
- Nộp file **`plans/ban-dich/<mã>-NN.dich.json`**, là một object `{ "<id>": "<bản dịch>", … }` có đủ mọi id. Không chép lại câu gốc.
- Tự kiểm trước khi nộp. Lệnh dưới phải ra **0 lỗi, 0 thiếu**:
  `node scripts/dich-trang.js --kiem plans/ban-dich/<mã>-NN.dich.json <mã>`
- Đừng chạy `--nap` (người điều phối nạp sau khi soát).

## 2. Luật kỹ thuật (máy sẽ chặn nếu sai)

1. **Chỗ giữ chỗ**: `<a1>…</a1>`, `<strong2>…</strong2>`, `<em3>…</em3>`, `<span4>…</span4>` là thẻ của trang (link, chữ đậm…).
   Giữ **đủ** mọi chỗ giữ chỗ, đúng số, đúng cặp mở/đóng. Được đổi vị trí theo ngữ pháp, chữ bên trong thì dịch.
   Dạng tự đóng `<img5/>`, `<svg6/>`, `<input7/>` (ảnh, biểu tượng) cũng phải giữ. `<br/>` là xuống dòng, được bỏ hoặc thêm.
2. **Chữ số giữ nguyên từng chữ số**: giá, giờ, ngày, số khách, số đánh giá, số điện thoại, phần trăm, năm.
   Viết bằng chữ số Ả Rập. Không đổi "1" thành "a/one/一". Không đổi 24 giờ sang AM/PM. Không quy đổi tiền.
   Được đổi dấu ngăn nghìn (7.344 → 7,344) và dấu thập phân (4,8 → 4.8). "95K" được viết "95,000".
   Ngày dạng `19/10/2026` giữ nguyên dạng đó. Số điện thoại viết `0989.765.070`.
3. **Chuỗi trong script** (ngữ cảnh "chuỗi trong script"): thông báo/tin nhắn, có thể có `\n` (xuống dòng thật). Giữ các
   xuống dòng đó. Câu bắt đầu bằng "Tên: ", "SĐT: "… là nhãn tin nhắn gửi quán.
4. **Dữ liệu có cấu trúc / thuộc tính** (alt, title, aria-label, meta): chữ trần, không thẻ.
   - `<title>`, og:title: ngắn gọn (tiếng Anh/Nga ≤ 60 ký tự; Trung/Nhật ≤ 32 chữ; Hàn ≤ 40; Thái ≤ 60).
   - meta description: tiếng Anh/Nga ≤ 160 ký tự; Trung/Nhật ≤ 80 chữ; Hàn ≤ 90; Thái ≤ 120.
   - alt ảnh: tả đúng thứ trong ảnh như câu gốc tả, không thêm chi tiết.

5. **Giờ** dạng "20h", "15h-23h", "16h30" được viết "20:00", "15:00–23:00", "16:30" (máy coi là cùng số). Không được đổi
   sang 12 giờ ("8 PM") vì chữ số khác. Lượt xem "13M+", "251K" giữ nguyên dạng đó. Số luôn viết chữ số Ả Rập (không 初二, 十月).
   Câu gốc viết tháng bằng chữ ("18 Oct 2026") thì bản dịch được ghi tháng bằng số (2026年10月18日). Ngược lại câu gốc
   "tháng 11 – tháng 4" thì tiếng Anh/Nga/Thái cứ viết tên tháng (November–April, ноябрь–апрель) — máy tính là khớp, KHÔNG cần ghi "(month 11)".
6. **Câu chỉ gồm tên riêng / địa chỉ** (vd `111 Huỳnh Tấn Phát, Phường Xuân Trường - Đà Lạt`) được giữ y nguyên, máy không báo
   "chưa dịch". Tên khách viết đánh giá đã được máy giữ nguyên, không nằm trong danh sách dịch.
7. Câu gốc có chú thích "(bài tiếng Anh)" / "(tiếng Việt)" cạnh một link bài viết: **bỏ chú thích đó**, vì mọi bài đã có bản cùng thứ tiếng.
8. **Thống nhất cách gọi trong cùng thứ tiếng**: trước khi dịch, mở `data/ban-dich/<mã>.json` (các câu đã dịch của thứ tiếng
   đó, nếu có) để dùng đúng cách gọi đã chọn: tên nhóm món, tên dãy bàn, "săn tàu"…

## 3. Luật nội dung của quán (sếp chốt, áp cho MỌI thứ tiếng)

- **Không tự xưng độc quyền / số một**: cấm "the only", "number one", "#1", "No.1", "unrivalled"; 唯一, 第一名, 首屈一指;
  唯一, ナンバーワン, 第1位; 유일, 넘버원, 1위; единственный, номер один, №1; แห่งเดียว, อันดับหนึ่ง. Câu gốc viết "hiếm có"
  thì dịch "rare / hard to find". Không thêm so sánh hơn nhất mà câu gốc không có.
- **Setup sinh nhật / cầu hôn**: hoa trang trí là **hoa nhựa**. Dịch "hoa trang trí" là *decorative flowers*. **Không bao giờ**
  viết hoa tươi / fresh flowers / 鲜花 / 生花 / 생화…, **không có nến** (candle / 蜡烛 / キャンドル / 촛불 / свеча / เทียน),
  không hoa hồng. Ngoại lệ: "thổi nến bánh kem" của khách thì dịch bình thường (nến trên bánh).
- **Kênh liên hệ: Zalo → WhatsApp.** Khách nước ngoài không dùng Zalo. Quán có WhatsApp **cùng số 0989.765.070**.
  Câu nào bảo khách nhắn / gửi đơn / xác nhận **qua Zalo** thì dịch thành **WhatsApp**. "Mở Zalo gửi tin" → "Open WhatsApp".
- **Xác nhận đặt bàn**: câu gốc "xác nhận qua Zalo trong 15 phút (trong giờ mở cửa)" dịch thành: *quán nhắn xác nhận **bằng tiếng Anh**
  qua WhatsApp hoặc SMS trong 15 phút, trong giờ mở cửa 15:00–23:00*. Ở trang tiếng Anh thì không cần ghi "bằng tiếng Anh".
  Luôn giữ điều kiện "trong giờ mở cửa".
- **Phụ thu**: Tết phụ thu 10% từ Mùng 2 đến Mùng 8 âm lịch. Valentine, đêm 24/12, bàn view **không** phụ thu. Dịch đúng như câu gốc.
- **Giờ**: 15:00 là giờ **mở cửa**. Hoàng hôn từ khoảng 16:30. Tàu chạy qua trong khung 16:30 – 21:25. Nhà lồng lên đèn từ khoảng 18:30.
- **Tàu**: là tàu du lịch tuyến Đà Lạt – Trại Mát (đường sắt cổ). **Không** gọi là "răng cưa / cog / rack railway".
- **Xóm Lèo** là quán cùng chủ. Câu gốc ghi "quán cùng chủ" thì giữ nghĩa đó (*our sister restaurant*).
- Tên quán **giữ nguyên chữ Latin có dấu** ở mọi thứ tiếng: `Tiệm Nướng Trạm Dừng Chill`, `Trạm Dừng Chill`. Không dịch nghĩa tên quán.
  "Trạm" dùng để quán tự xưng thì dịch thành "chúng tôi" (we / 我们 / 저희 / 私たち / мы / เรา).
- **Không ghi tên người** (sếp chốt 21/10/2026). Câu gốc không có tên người thì bản dịch cũng không có.
- **Địa chỉ**: tiếng Anh viết `111 Huynh Tan Phat, Xuan Truong - Da Lat Ward, Lam Dong`. Các thứ tiếng khác **giữ nguyên tiếng Việt**
  `111 Huỳnh Tấn Phát, Phường Xuân Trường - Đà Lạt, Lâm Đồng`, vì khách đưa cho tài xế Grab/taxi xem.
- Hashtag, tên mạng xã hội, URL: giữ nguyên.

## 4. Giọng văn theo thứ tiếng

- **en**: tiếng Anh tự nhiên, quốc tế (chính tả Mỹ), xưng "you". Tiền ghi "VND".
- **zh**: giản thể, dấu câu toàn khổ (，。！？：；「」). Câu mời / chính sách xưng 您, câu kể có thể dùng 你. "đ / VND" → 越南盾 hoặc VND.
- **ko**: 해요체 lịch sự, nhất quán toàn trang. Danh từ nước ngoài theo cách viết phổ biến ở Hàn.
- **ja**: です・ます調, dấu câu 、。, từ ngoại lai viết katakana.
- **ru**: "вы" viết thường, văn tự nhiên, ngoặc kép « ».
- **th**: lịch sự, trung tính. Không dùng ค่ะ/ครับ (vì phân giới tính). Số viết chữ số Ả Rập.

## 5. Bảng thuật ngữ (dùng thống nhất)

| Tiếng Việt | en | zh | ko | ja | ru | th |
|---|---|---|---|---|---|---|
| Đà Lạt | Da Lat | 大叻 | 달랏 | ダラット | Далат | ดาลัด |
| Lâm Đồng | Lam Dong | 林同省 | 럼동성 | ラムドン省 | провинция Ламдонг | จังหวัดลัมดง |
| Trại Mát | Trai Mat | 斋玛 (Trại Mát) | 짜이맛 | チャイマット | Чаймат | ไตรมาต |
| tuyến tàu Đà Lạt – Trại Mát | Da Lat – Trai Mat railway | 大叻—斋玛观光小火车 | 달랏–짜이맛 관광열차 | ダラット〜チャイマット観光列車 | поезд Далат — Чаймат | รถไฟสายดาลัด–ไตรมาต |
| ga Đà Lạt | Da Lat Railway Station | 大叻火车站 | 달랏 기차역 | ダラット駅 | вокзал Далата | สถานีรถไฟดาลัด |
| Hồ Xuân Hương | Xuan Huong Lake | 春香湖 | 쑤언흐엉 호수 | スアンフーン湖 | озеро Суанхыонг | ทะเลสาบซวนเฮือง |
| chợ đêm Đà Lạt | Da Lat Night Market | 大叻夜市 | 달랏 야시장 | ダラット・ナイトマーケット | ночной рынок Далата | ตลาดกลางคืนดาลัด |
| núi Langbiang | Langbiang Mountain | 朗边山 | 랑비앙산 | ランビアン山 | гора Лангбианг | ภูเขาลังเบียง |
| hồ Tuyền Lâm | Tuyen Lam Lake | 泉林湖 | 뚜옌럼 호수 | トゥエンラム湖 | озеро Туйенлам | ทะเลสาบเตวียนเลิม |
| nhà lồng (nhà kính trồng hoa) | greenhouses | 温室大棚 | 비닐하우스 | ビニールハウス | теплицы | โรงเรือนเพาะปลูก |
| nhà lồng lên đèn | the greenhouses light up | 大棚亮灯 | 비닐하우스에 불이 켜지다 | ビニールハウスに明かりが灯る | теплицы зажигают огни | โรงเรือนเปิดไฟ |
| "biển sao" nhà lồng | "sea of stars" | "星海" | '별바다' | 「星の海」 | «море звёзд» | "ทะเลดาว" |
| săn tàu | train-spotting | 追火车 | 기차 구경 | 列車ウォッチング | охота за поездом | ล่ารถไฟ |
| tàu cổ | vintage train | 复古小火车 | 옛 기차 | レトロ列車 | старинный поезд | รถไฟโบราณ |
| hoàng hôn | sunset | 日落 | 노을 | 夕日 | закат | พระอาทิตย์ตก |
| view triệu đô | million-dollar view | 百万美元美景 | 백만 불짜리 뷰 | 100万ドルの景色 | вид на миллион | วิวหลักล้าน |
| bàn view / dãy bàn | view table / row of tables | 景观桌 / 排 | 뷰 테이블 / 줄 | 眺めの良い席 / 列 | столик с видом / ряд | โต๊ะวิว / แถว |
| lan can | railing | 栏杆 | 난간 | 手すり | перила | ราวระเบียง |
| nướng tại bàn (than hoa) | grill at your table (charcoal) | 桌边炭烤 | 테이블 숯불구이 | テーブルで炭火焼き | гриль на углях прямо за столом | ปิ้งย่างถ่านที่โต๊ะ |
| BBQ / đồ nướng | BBQ / grilled dishes | 烧烤 | 바비큐 / 구이 | バーベキュー / 焼き物 | барбекю / гриль | บาร์บีคิว / ปิ้งย่าง |
| lẩu | hotpot | 火锅 | 전골 | 鍋 | хотпот | หม้อไฟ |
| đặt bàn | book a table / reservation | 订座 | 예약 | 予約 | бронирование столика | จองโต๊ะ |
| setup miễn phí | free table decoration | 免费布置 | 무료 테이블 장식 | 無料デコレーション | бесплатное оформление стола | ตกแต่งโต๊ะฟรี |
| bảng chúc mừng / bảng "Marry Me?" | greeting board / "Marry Me?" board | 祝福牌 / "Marry Me?" 牌 | 축하 보드 / 'Marry Me?' 보드 | お祝いボード / 「Marry Me?」ボード | поздравительная табличка / табличка «Marry Me?» | ป้ายอวยพร / ป้าย "Marry Me?" |
| hoa trang trí | decorative flowers | 装饰花 | 장식용 꽃 | 飾り花 | декоративные цветы | ดอกไม้ประดับ |
| cọc 200.000đ hoàn lại sau khi ăn | refundable 200,000 VND deposit, returned after your meal | 200,000越南盾押金，用餐后退还 | 보증금 200,000동 (식사 후 환불) | デポジット200,000ドン（食後に返金） | залог 200 000 донгов, возвращается после ужина | มัดจำ 200,000 ดอง คืนหลังทานเสร็จ |
| phụ thu | surcharge | 附加费 | 추가 요금 | 追加料金 | наценка | ค่าบริการเพิ่ม |
| Tết (Tết Nguyên đán) | Tết (Lunar New Year) | 越南春节 | 뗏(설날) | テト（旧正月） | Тет (Лунный Новый год) | ตรุษเต๊ต (ตรุษจีนเวียดนาม) |
| Mùng 2 – Mùng 8 Tết | the 2nd–8th day of Tết | 春节（农历正月 2 日至 8 日） | 뗏 2일~8일 | テトの2日〜8日 | со 2-го по 8-й день Тета | วันที่ 2–8 ของเทศกาลเต๊ต |
| giờ mở cửa | opening hours | 营业时间 | 영업시간 | 営業時間 | часы работы | เวลาเปิดทำการ |
| hotline | hotline | 热线 | 핫라인 | 電話 | горячая линия | สายด่วน |
| đã gồm VAT | VAT included | 含增值税 | 부가세 포함 | 税込み | НДС включён | รวม VAT แล้ว |
| quán cùng chủ (Xóm Lèo) | our sister restaurant | 同一老板的姐妹店 | 같은 주인이 운영하는 자매 식당 | 系列店 | наш ресторан-побратим | ร้านในเครือเดียวกัน |

### Tên món (theo menu in; tiếng Anh lấy đúng dòng tiếng Anh in trên menu)

Các thứ tiếng khác dịch theo nghĩa, có thể dựa vào bản tiếng Anh. Tên riêng "Kobe", "Okachi", "Tiger", "Saigon" giữ nguyên CHỮ LATIN ở mọi thứ tiếng (không 神户 / 고베 / コウベ). "Sate" được phiên âm theo thói quen (沙爹, サテ).

| Tiếng Việt | English |
|---|---|
| **Best Seller** | Signature Favorites |
| Ba Chỉ Bò Cuộn Nấm Kim Châm | Enoki Beef Rolls |
| Ba Chỉ Bò Nướng Muối Tiêu | Salt & Pepper Beef Belly |
| Bò Kobe Nướng Tảng Phô Mai Trứng Muối | Kobe Beef with Salted Egg Cheese |
| Bò Okachi Nướng Tảng Phô Mai Trứng Muối | Okachi Beef with Salted Egg Cheese |
| Vếu Heo Ướp Sate | Pork Udder Marinated with Satay |
| Vếu Heo Ướp Chao | Pork Udder Marinated with Fermented Tofu |
| Ốc Nhồi Thịt | Stuffed Snails |
| Cá Tầm Lúc Lắc | Shaking Sturgeon |
| Cá Tầm Rang Muối | Salt-Roasted Sturgeon |
| Sườn Cay Thái Lan | Thai Spicy Ribs |
| Tôm Chiên Trứng Muối | Salted Egg Shrimp |
| Gỏi Sứa | Jellyfish Salad |
| **BBQ Nướng Tại Bàn** | Grill-at-the-Table BBQ |
| Bò Nướng Cục | Cubed Grilled Beef |
| Bò Nướng Xiên | Skewered Grilled Beef |
| Ba Chỉ Heo Hàn Quốc | Korean-Style Pork Belly |
| Ba Chỉ Heo Nướng Ngũ Vị | Five-Spice Grilled Pork Belly |
| Sườn Que Nướng | Grilled Rib Skewers |
| Chân Gà Nướng Muối Ớt | Grilled Chicken Feet with Chili Salt |
| Cánh Gà Nướng Muối Ớt | Grilled Chicken Wings with Chili Salt |
| Ếch Nướng Muối Ớt | Grilled Frog with Chili Salt |
| Tôm Nướng Muối Ớt | Grilled Shrimp with Chili Salt |
| Mực Ướp Sate | Satay-Marinated Squid |
| Bạch Tuộc Nướng | Grilled Octopus |
| Cá Tầm Nướng | Grilled Sturgeon |
| **Món Ăn Kèm** | Sides |
| Chả Ram Tôm Đất | Crispy Shrimp Rolls |
| Khoai Tây Chiên | French Fries |
| Khoai Lang Kén | Sweet Potato Balls |
| Salad Trộn Dầu Giấm | Garden Salad with Vinaigrette |
| Kim Chi | Kimchi |
| Rau Thêm | Extra Vegetables |
| Khăn Ướt | Wet Towel |
| **No Cái Bụng** | Hearty Mains |
| Cơm Chiên Cao Nguyên | Highland Fried Rice |
| Cơm Chiên Hải Sản | Seafood Fried Rice |
| Mì Xào Hải Sản | Stir-Fried Seafood Noodles |
| Mì Xào Bò | Stir-Fried Beef Noodles |
| **Lẩu** | Hotpot |
| Lẩu Gà Lá É | Chicken Hotpot with É Leaves |
| Lẩu Hải Sản | Seafood Hotpot |
| Lẩu Cá Tầm | Sturgeon Hotpot |
| **Món Lai Rai** | Snacks & Bites |
| Đậu Hũ Non Chiên Chà Bông | Crispy Soft Tofu with Pork Floss |
| Xúc Xích Đức Nướng | Grilled German Sausage |
| Bò Lúc Lắc | Shaking Beef |
| Sụn Gà Chiên Mắm | Fried Chicken Cartilage with Fish Sauce |
| Vếu Heo Cháy Tỏi | Pork Udder with Fried Garlic |
| Ếch Chiên Nước Mắm | Fried Frog with Fish Sauce |
| Cánh Gà Chiên Nước Mắm | Fried Chicken Wings with Fish Sauce |
| **Trà Lạnh** | Iced Tea |
| Trà Vải Hạt Chia | Lychee Tea with Chia Seeds |
| Trà Dứa Đào | Pineapple Peach Tea |
| Trà Trái Cây Nhiệt Đới | Tropical Fruit Tea |
| Trà Đào Cam Sả | Peach Orange Lemongrass Tea |
| Trà Tắc Xí Muội | Kumquat Tea with Preserved Plum |
| Trà Ổi Hồng | Pink Guava Tea |
| **Trà Nóng** | Hot Tea |
| Trà Hoa Cúc Táo Đỏ | Chrysanthemum Tea with Red Dates |
| Trà Thảo Mộc | Herbal Tea |
| Trà Gừng Táo Đỏ Mật Ong | Ginger Tea with Red Dates & Honey |
| Trà Chanh Nóng Hạt Chia | Hot Lemon Tea with Chia Seeds |
| Trà Lipton Nóng | Hot Lipton Tea |
| **Soda** | Sparkling Soda |
| Soda Việt Quất | Blueberry Soda |
| Soda Chanh | Lemon Soda |
| Soda Blue | Blue Soda |
| Soda Dâu Tây | Strawberry Soda |
| Soda Đào | Peach Soda |
| **Món Nước** | Drinks |
| Coca Cola | Coca-Cola |
| Sprite | Sprite |
| Sting | Sting Energy Drink |
| Strongbow | Strongbow Cider |
| Nước Suối | Mineral Water |
| **Bia** | Beer |
| Tiger Bạc | Tiger Crystal |
| Tiger Nâu | Tiger Original |
| Sài Gòn Xanh (Special) | Saigon Special |
| Sài Gòn Chill | Saigon Chill |
| Sài Gòn Lager | Saigon Lager |
| Heineken Lùn | Heineken (short can) |
| **Rượu** | Wine & Spirits |
| Rượu Mơ Hương Đào (18%) | Peach-Scented Apricot Wine (18%) |
| Rượu Mơ 300ml (29%) | Apricot Wine 300ml (29%) |
| Rượu Mơ 350ml (12%) | Apricot Wine 350ml (12%) |
| Rượu Mơ 500ml (12%) | Apricot Wine 500ml (12%) |
| Soju Mix Vị 360ml | Mixed-Flavor Soju 360ml |
| Rượu Vang Classic 750ml | Classic Wine 750ml |
| Rượu Vang Export 750ml | Export Wine 750ml |
| Rượu Táo Mèo 300ml (29%) | Wild Apple Wine 300ml (29%) |
| Rượu Mơ Ume (Classic) | Ume Apricot Wine (Classic) |
| Rượu Táo Mèo 350ml (18%) | Wild Apple Wine 350ml (18%) |
