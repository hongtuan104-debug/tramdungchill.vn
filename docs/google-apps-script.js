/* ============================================
   Google Apps Script - Webhook nhan dat ban
   Ghi vao Google Sheets + Gui Telegram

   HUONG DAN:
   1. Vao https://script.google.com → New Project
   2. Copy TOAN BO code nay vao
   3. Sua TELEGRAM_BOT_TOKEN va TELEGRAM_CHAT_ID
   4. Deploy → New deployment → Web app
      - Execute as: Me
      - Who has access: Anyone
   5. Copy URL webhook → dan vao site-config.js
   ============================================ */

// ========== CAU HINH ==========
var TELEGRAM_BOT_TOKEN = 'THAY_TOKEN_BOT_TELEGRAM_VAO_DAY';
var TELEGRAM_CHAT_ID = 'THAY_CHAT_ID_VAO_DAY';
var SHEET_NAME = 'DatBan'; // Ten sheet
// ==============================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Ghi vao Google Sheets
    saveToSheet(data);

    // Gui thong bao Telegram
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

function saveToSheet(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  // Tao sheet neu chua co
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Tao header
    sheet.appendRow([
      'Thoi gian',
      'Ho ten',
      'So dien thoai',
      'Ngay den',
      'Gio den',
      'So khach',
      'Dip dac biet',
      'Ghi chu',
      'Trang thai'
    ]);
    // Format header
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
    sheet.setFrozenRows(1);
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
  var now = new Date();
  var vnTime = Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');

  // Ghi dong moi
  sheet.appendRow([
    vnTime,
    data.name || '',
    data.phone || '',
    dateStr,
    data.time || '',
    data.guests || '',
    occasionMap[data.occasion] || data.occasion || '',
    data.note || '',
    'Moi'
  ]);
}

function sendTelegram(data) {
  if (TELEGRAM_BOT_TOKEN === 'THAY_TOKEN_BOT_TELEGRAM_VAO_DAY') return;

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

  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: msg,
      parse_mode: 'Markdown'
    })
  });
}

// Test thu (chay ham nay de kiem tra)
function testWebhook() {
  var testData = {
    name: 'Nguyen Van Test',
    phone: '0989765070',
    date: '2026-03-25',
    time: '18:00',
    guests: '4',
    occasion: 'birthday',
    note: 'Ban view sunset',
    timestamp: new Date().toISOString()
  };

  saveToSheet(testData);
  sendTelegram(testData);

  Logger.log('Test thanh cong! Kiem tra Sheet va Telegram.');
}
