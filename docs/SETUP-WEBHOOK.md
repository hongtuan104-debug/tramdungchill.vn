# Huong Dan Cai Dat Webhook Dat Ban

Khi khach dat ban tren website → Tu dong:
- Ghi vao **Google Sheets** (bang tinh online)
- Gui thong bao ve **Telegram** (nhan tin ngay lap tuc)

---

## Buoc 1: Tao Telegram Bot (nhan thong bao)

### 1.1 Tao bot
1. Mo Telegram, tim **@BotFather**
2. Gui lenh: `/newbot`
3. Dat ten bot: `Tram Dung Chill Bot`
4. Dat username: `tramdungchill_bot` (hoac ten khac)
5. BotFather se tra ve **TOKEN** dang:
   ```
   7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   → **Luu lai TOKEN nay**

### 1.2 Lay Chat ID cua ban
1. Tim bot **@userinfobot** tren Telegram
2. Gui tin nhan bat ky cho bot do
3. Bot se tra ve **Chat ID** cua ban, dang:
   ```
   Id: 123456789
   ```
   → **Luu lai so Chat ID nay**

### 1.3 Kich hoat bot
1. Tim bot ban vua tao (vd: @tramdungchill_bot)
2. Nhan **Start** hoac gui `/start`

---

## Buoc 2: Tao Google Sheets + Apps Script

### 2.1 Tao Google Sheets
1. Vao https://sheets.google.com
2. Nhan **"+ Blank"** (Tao bang tinh moi)
3. Dat ten: **"Dat Ban - Tram Dung Chill"**

### 2.2 Them code xu ly
1. Trong Google Sheets, vao menu **Extensions → Apps Script**
2. Xoa het code cu trong file `Code.gs`
3. Mo file `docs/google-apps-script.js` trong du an
4. **Copy TOAN BO noi dung** → **Paste vao Apps Script**
5. Sua 2 dong sau:
   ```
   var TELEGRAM_BOT_TOKEN = '7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
   var TELEGRAM_CHAT_ID = '123456789';
   ```
   (Thay bang TOKEN va Chat ID ban luu o Buoc 1)
6. Nhan **Ctrl+S** de luu

### 2.3 Test thu
1. Trong Apps Script, chon ham **testWebhook** tu dropdown
2. Nhan nut **Run** (▶)
3. Lan dau se hoi quyen truy cap → Nhan **Review Permissions → Allow**
4. Kiem tra:
   - Google Sheets phai co 1 dong du lieu test
   - Telegram phai nhan duoc tin nhan thong bao

### 2.4 Deploy webhook
1. Nhan **Deploy → New deployment**
2. Chon loai: **Web app**
3. Cai dat:
   - Description: `Webhook dat ban`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Nhan **Deploy**
5. Copy **URL** webhook (dang `https://script.google.com/macros/s/xxxxx/exec`)
   → **Luu lai URL nay**

---

## Buoc 3: Dan URL webhook vao website

1. Mo file `data/site-config.js`
2. Tim dong:
   ```
   webhookUrl: '',
   ```
3. Dan URL webhook vao:
   ```
   webhookUrl: 'https://script.google.com/macros/s/xxxxx/exec',
   ```
4. Luu file, push len GitHub

---

## Buoc 4: Kiem tra toan bo

1. Vao website tramdungchill.vn
2. Dien form dat ban → Nhan "Gui Yeu Cau Dat Ban"
3. Kiem tra:
   - [ ] Google Sheets co dong moi?
   - [ ] Telegram nhan duoc thong bao?
   - [ ] Zalo mo len voi noi dung dat ban?

Neu ca 3 deu OK → **Hoan tat!**

---

## Xu ly loi thuong gap

| Loi | Cach sua |
|-----|----------|
| Telegram khong nhan tin | Kiem tra da nhan Start voi bot chua |
| Google Sheets khong ghi | Vao Apps Script → Executions → xem loi |
| Deploy bi loi quyen | Chon "Execute as: Me" va "Anyone" |
| URL webhook khong hoat dong | Chac chan copy dung URL, co `/exec` o cuoi |

---

## Cap nhat sau nay

- Neu doi so Telegram: sua trong Apps Script → Deploy lai (New deployment)
- Neu muon them cot trong Sheets: sua ham `saveToSheet` trong Apps Script
- Webhook URL se thay doi moi lan deploy moi → nho cap nhat lai trong `site-config.js`
