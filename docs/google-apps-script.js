/* ============================================
   Google Apps Script - Webhook Dat Ban
   TRAM DUNG CHILL - Tiem Nuong Da Lat

   Ghi vao Google Sheets + Gui Telegram
   Tu dong tao bang chuyen nghiep khi chay lan dau

   HUONG DAN:
   1. Tao Google Sheets moi
   2. Extensions → Apps Script
   3. Copy TOAN BO code nay vao
   4. Sua TELEGRAM_BOT_TOKEN va danh sach TELEGRAM_CHAT_IDS
   5. Chay ham "setupSheet" truoc de tao bang chuyen nghiep
   6. Chay ham "testWebhook" de test
   7. Deploy → New deployment → Web app
      - Execute as: Me
      - Who has access: Anyone
   8. Copy URL webhook → dan vao site-config.js
   ============================================ */

// ========== CAU HINH ==========
var TELEGRAM_BOT_TOKEN = 'THAY_TOKEN_BOT_TELEGRAM_VAO_DAY';

// Danh sach nhan vien nhan thong bao
// Them/xoa nguoi: them/xoa dong trong mang ben duoi
var TELEGRAM_CHAT_IDS = [
  { id: 'CHAT_ID_CHU_QUAN', name: 'Chu quan' },
  // { id: 'CHAT_ID_NHAN_VIEN_1', name: 'Nhan vien 1' },
  // { id: 'CHAT_ID_NHAN_VIEN_2', name: 'Nhan vien 2' },
  // Muon them nguoi: bo dau // o dau dong, thay CHAT_ID va ten
];

var SHEET_NAME = 'Dat Ban';
// ==============================


// ==========================================
//  SETUP - Chay 1 lan dau de tao bang dep
// ==========================================
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Doi ten file Sheets
  ss.rename('Tram Dung Chill - Quan Ly Dat Ban');

  // Xoa sheet mac dinh neu can
  var defaultSheet = ss.getSheetByName('Sheet1');
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (defaultSheet && defaultSheet.getName() !== SHEET_NAME) {
    ss.deleteSheet(defaultSheet);
  }

  // Xoa du lieu cu (giu nguyen cau truc)
  sheet.clear();

  // ---- TIEU DE BANNER ----
  sheet.getRange('A1:K1').merge();
  sheet.getRange('A1').setValue('TRAM DUNG CHILL - QUAN LY DAT BAN ONLINE')
    .setFontSize(16)
    .setFontWeight('bold')
    .setFontColor('#FFFFFF')
    .setBackground('#B8860B')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 50);

  sheet.getRange('A2:K2').merge();
  sheet.getRange('A2').setValue('111 Huynh Tan Phat, P11, Da Lat | 0989.765.070 | tramdungchill.vn')
    .setFontSize(10)
    .setFontColor('#8B7355')
    .setBackground('#FFF8DC')
    .setHorizontalAlignment('center');
  sheet.setRowHeight(2, 25);

  // ---- HEADER BANG ----
  var headers = [
    'STT',
    'Thoi Gian Nhan',
    'Ho Ten Khach',
    'So Dien Thoai',
    'Ngay Den',
    'Gio Den',
    'So Khach',
    'Dip Dac Biet',
    'Ghi Chu',
    'Trang Thai',
    'Nhan Vien Xu Ly'
  ];

  var headerRange = sheet.getRange(3, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange
    .setFontWeight('bold')
    .setFontSize(11)
    .setFontColor('#FFFFFF')
    .setBackground('#5D4037')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#3E2723', SpreadsheetApp.BorderStyle.SOLID);
  sheet.setRowHeight(3, 35);

  // ---- DO RONG COT ----
  sheet.setColumnWidth(1, 50);    // STT
  sheet.setColumnWidth(2, 170);   // Thoi gian
  sheet.setColumnWidth(3, 180);   // Ho ten
  sheet.setColumnWidth(4, 140);   // SDT
  sheet.setColumnWidth(5, 120);   // Ngay den
  sheet.setColumnWidth(6, 80);    // Gio den
  sheet.setColumnWidth(7, 80);    // So khach
  sheet.setColumnWidth(8, 150);   // Dip dac biet
  sheet.setColumnWidth(9, 250);   // Ghi chu
  sheet.setColumnWidth(10, 130);  // Trang thai
  sheet.setColumnWidth(11, 150);  // Nhan vien

  // ---- DONG CO HEADER ----
  sheet.setFrozenRows(3);

  // ---- DROPDOWN TRANG THAI (cot J, tu dong 4 tro di) ----
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Moi', 'Da xac nhan', 'Da den', 'Huy', 'Khong den'])
    .setAllowInvalid(false)
    .build();
  sheet.getRange('J4:J500').setDataValidation(statusRule);

  // ---- MAU NEN XOAY VONG CHO DE DOC ----
  var rule1 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(MOD(ROW()-3,2)=1,ROW()>3)')
    .setBackground('#FFF8DC')
    .setRanges([sheet.getRange('A4:K500')])
    .build();

  // ---- MAU TRANG THAI ----
  var ruleMoi = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Moi')
    .setBackground('#FFCDD2')
    .setFontColor('#B71C1C')
    .setBold(true)
    .setRanges([sheet.getRange('J4:J500')])
    .build();

  var ruleXacNhan = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Da xac nhan')
    .setBackground('#C8E6C9')
    .setFontColor('#1B5E20')
    .setBold(true)
    .setRanges([sheet.getRange('J4:J500')])
    .build();

  var ruleDaDen = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Da den')
    .setBackground('#BBDEFB')
    .setFontColor('#0D47A1')
    .setBold(true)
    .setRanges([sheet.getRange('J4:J500')])
    .build();

  var ruleHuy = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Huy')
    .setBackground('#E0E0E0')
    .setFontColor('#616161')
    .setBold(true)
    .setRanges([sheet.getRange('J4:J500')])
    .build();

  var ruleKhongDen = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Khong den')
    .setBackground('#FFE0B2')
    .setFontColor('#E65100')
    .setBold(true)
    .setRanges([sheet.getRange('J4:J500')])
    .build();

  sheet.setConditionalFormatRules([rule1, ruleMoi, ruleXacNhan, ruleDaDen, ruleHuy, ruleKhongDen]);

  // ---- CANH GIUA MOT SO COT ----
  sheet.getRange('A4:A500').setHorizontalAlignment('center'); // STT
  sheet.getRange('D4:D500').setHorizontalAlignment('center'); // SDT
  sheet.getRange('E4:E500').setHorizontalAlignment('center'); // Ngay
  sheet.getRange('F4:F500').setHorizontalAlignment('center'); // Gio
  sheet.getRange('G4:G500').setHorizontalAlignment('center'); // So khach
  sheet.getRange('J4:J500').setHorizontalAlignment('center'); // Trang thai

  // ---- TAO SHEET THONG KE ----
  createDashboardSheet(ss);

  Logger.log('Setup thanh cong! Bang da duoc tao chuyen nghiep.');
}


// ==========================================
//  SHEET THONG KE - Dashboard tu dong
// ==========================================
function createDashboardSheet(ss) {
  var dashName = 'Thong Ke';
  var dash = ss.getSheetByName(dashName);
  if (!dash) {
    dash = ss.insertSheet(dashName);
  } else {
    dash.clear();
  }

  // Banner
  dash.getRange('A1:F1').merge();
  dash.getRange('A1').setValue('THONG KE DAT BAN - TRAM DUNG CHILL')
    .setFontSize(14)
    .setFontWeight('bold')
    .setFontColor('#FFFFFF')
    .setBackground('#B8860B')
    .setHorizontalAlignment('center');
  dash.setRowHeight(1, 45);

  // Thong ke tong quat
  var stats = [
    ['', '', '', ''],
    ['TONG QUAN', '', '', ''],
    ['Tong don dat ban', '=COUNTA(\'Dat Ban\'!B4:B500)', '', ''],
    ['Don moi (chua xu ly)', '=COUNTIF(\'Dat Ban\'!J4:J500,"Moi")', '', ''],
    ['Don da xac nhan', '=COUNTIF(\'Dat Ban\'!J4:J500,"Da xac nhan")', '', ''],
    ['Don da den', '=COUNTIF(\'Dat Ban\'!J4:J500,"Da den")', '', ''],
    ['Don huy', '=COUNTIF(\'Dat Ban\'!J4:J500,"Huy")', '', ''],
    ['Don khong den', '=COUNTIF(\'Dat Ban\'!J4:J500,"Khong den")', '', ''],
    ['', '', '', ''],
    ['THEO DIP', '', '', ''],
    ['Sinh nhat', '=COUNTIF(\'Dat Ban\'!H4:H500,"Sinh nhat")', '', ''],
    ['Ky niem', '=COUNTIF(\'Dat Ban\'!H4:H500,"Ky niem")', '', ''],
    ['Hen ho', '=COUNTIF(\'Dat Ban\'!H4:H500,"Hen ho")', '', ''],
    ['Hop mat ban be', '=COUNTIF(\'Dat Ban\'!H4:H500,"Hop mat ban be")', '', ''],
    ['Cong ty / team', '=COUNTIF(\'Dat Ban\'!H4:H500,"Cong ty / team")', '', ''],
    ['', '', '', ''],
    ['THEO GIO', '', '', ''],
    ['15:00 - 17:00', '=COUNTIFS(\'Dat Ban\'!F4:F500,">="&"15:00",\'Dat Ban\'!F4:F500,"<"&"17:00")', '', ''],
    ['17:00 - 19:00', '=COUNTIFS(\'Dat Ban\'!F4:F500,">="&"17:00",\'Dat Ban\'!F4:F500,"<"&"19:00")', '', ''],
    ['19:00 - 21:30', '=COUNTIFS(\'Dat Ban\'!F4:F500,">="&"19:00",\'Dat Ban\'!F4:F500,"<="&"21:30")', '', ''],
  ];

  dash.getRange(2, 1, stats.length, 4).setValues(stats);

  // Format tieu de nhom
  [3, 11, 18].forEach(function(row) {
    dash.getRange(row, 1, 1, 2)
      .setFontWeight('bold')
      .setFontSize(12)
      .setBackground('#5D4037')
      .setFontColor('#FFFFFF');
  });

  // Format so lieu
  dash.getRange('B4:B9').setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center');
  dash.getRange('B12:B16').setFontSize(12).setHorizontalAlignment('center');
  dash.getRange('B19:B21').setFontSize(12).setHorizontalAlignment('center');

  // Do rong cot
  dash.setColumnWidth(1, 200);
  dash.setColumnWidth(2, 120);

  // Mau cho so don moi
  var ruleNew = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0)
    .setBackground('#FFCDD2')
    .setFontColor('#B71C1C')
    .setRanges([dash.getRange('B5')])
    .build();
  dash.setConditionalFormatRules([ruleNew]);

  dash.setFrozenRows(1);
}


// ==========================================
//  WEBHOOK - Nhan du lieu dat ban
// ==========================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    saveToSheet(data);
    sendTelegram(data);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Webhook Tram Dung Chill dang hoat dong!' }))
    .setMimeType(ContentService.MimeType.JSON);
}


// ==========================================
//  GHI VAO SHEETS
// ==========================================
function saveToSheet(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  // Neu chua setup, chay setup truoc
  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(SHEET_NAME);
  }

  // Map dip dac biet
  var occasionMap = {
    'birthday': 'Sinh nhat',
    'anniversary': 'Ky niem',
    'date': 'Hen ho',
    'gathering': 'Hop mat ban be',
    'company': 'Cong ty / team',
    'other': 'Khac'
  };

  // Format ngay
  var dateStr = data.date || '';
  if (dateStr.indexOf('-') > -1) {
    var parts = dateStr.split('-');
    dateStr = parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  // Thoi gian nhan (GMT+7)
  var vnTime = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');

  // Tinh STT
  var lastRow = sheet.getLastRow();
  var stt = lastRow - 2; // Tru 3 dong header, cong 1

  // Ghi dong moi
  var newRow = [
    stt,
    vnTime,
    data.name || '',
    data.phone || '',
    dateStr,
    data.time || '',
    data.guests || '',
    occasionMap[data.occasion] || data.occasion || '',
    data.note || '',
    'Moi',
    ''
  ];

  sheet.appendRow(newRow);

  // Format dong moi
  var rowNum = sheet.getLastRow();
  sheet.getRange(rowNum, 1, 1, 11)
    .setBorder(true, true, true, true, true, true, '#D7CCC8', SpreadsheetApp.BorderStyle.SOLID)
    .setVerticalAlignment('middle');
  sheet.setRowHeight(rowNum, 30);
}


// ==========================================
//  GUI TELEGRAM
// ==========================================
function sendTelegram(data) {
  if (TELEGRAM_BOT_TOKEN === 'THAY_TOKEN_BOT_TELEGRAM_VAO_DAY') return;
  if (TELEGRAM_CHAT_IDS.length === 0) return;

  var occasionMap = {
    'birthday': 'Sinh nhat',
    'anniversary': 'Ky niem',
    'date': 'Hen ho',
    'gathering': 'Hop mat ban be',
    'company': 'Cong ty / team',
    'other': 'Khac'
  };

  var dateStr = data.date || '';
  if (dateStr.indexOf('-') > -1) {
    var parts = dateStr.split('-');
    dateStr = parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  var msg = '🔔 *DAT BAN MOI*\n\n';
  msg += '👤 *Ten:* ' + (data.name || '') + '\n';
  msg += '📱 *SDT:* ' + (data.phone || '') + '\n';
  msg += '📅 *Ngay:* ' + dateStr + '\n';
  msg += '🕐 *Gio:* ' + (data.time || '') + '\n';
  msg += '👥 *So khach:* ' + (data.guests || '') + '\n';

  if (data.occasion) {
    msg += '🎉 *Dip:* ' + (occasionMap[data.occasion] || data.occasion) + '\n';
  }
  if (data.note) {
    msg += '📝 *Ghi chu:* ' + data.note + '\n';
  }

  msg += '\n⏰ ' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'HH:mm dd/MM/yyyy');
  msg += '\n📍 tramdungchill.vn';

  var url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';

  // Gui thong bao cho TAT CA nhan vien trong danh sach
  TELEGRAM_CHAT_IDS.forEach(function(person) {
    try {
      UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          chat_id: person.id,
          text: msg,
          parse_mode: 'Markdown'
        })
      });
    } catch (err) {
      Logger.log('Khong gui duoc cho ' + person.name + ': ' + err);
    }
  });
}


// ==========================================
//  TEST - Chay de kiem tra
// ==========================================
function testWebhook() {
  var testData = {
    name: 'Nguyen Van Test',
    phone: '0989765070',
    date: '2026-03-25',
    time: '18:00',
    guests: '4',
    occasion: 'birthday',
    note: 'Ban view sunset, setup sinh nhat',
    timestamp: new Date().toISOString()
  };

  saveToSheet(testData);
  sendTelegram(testData);

  Logger.log('Test thanh cong! Kiem tra Sheet va Telegram.');
}
