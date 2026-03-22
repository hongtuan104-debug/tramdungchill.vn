/* ============================================
   Tram Dung Chill - Booking Form
   Doc SITE_CONFIG tu data/site-config.js
   ============================================ */

function initBookingForm() {
    const form = document.getElementById('bookingForm');
    if (!form) return;

    const zaloNumber = SITE_CONFIG.contact.zaloNumber;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Validation
        if (!data.name || !data.phone || !data.date || !data.time || !data.guests) {
            var lang = document.documentElement.lang || 'vi';
            var msg = (window.TRANSLATIONS && TRANSLATIONS[lang] && TRANSLATIONS[lang]['notify.required']) || 'Vui lòng điền đầy đủ thông tin bắt buộc!';
            showNotification(msg, 'error');
            return;
        }

        // Phone validation (Vietnamese: 0xxx or +84xxx or 84xxx)
        var cleanPhone = data.phone.replace(/[\.\s\-\(\)]/g, '');
        if (/^\+84/.test(cleanPhone)) cleanPhone = '0' + cleanPhone.slice(3);
        if (/^84[0-9]{9}$/.test(cleanPhone)) cleanPhone = '0' + cleanPhone.slice(2);
        if (!/^0[0-9]{9}$/.test(cleanPhone)) {
            var lang = document.documentElement.lang || 'vi';
            var msg = (window.TRANSLATIONS && TRANSLATIONS[lang] && TRANSLATIONS[lang]['notify.phone']) || 'Số điện thoại không hợp lệ (cần 10 số)!';
            showNotification(msg, 'error');
            return;
        }

        // Show loading
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        submitBtn.disabled = true;

        // Format message
        const message = formatZaloMessage(data);

        // Gui du lieu qua webhook (Google Apps Script → Google Sheet)
        const webhookUrl = SITE_CONFIG.webhookUrl;
        if (webhookUrl) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({
                        name: data.name,
                        phone: data.phone,
                        date: data.date,
                        time: data.time,
                        guests: data.guests,
                        occasion: data.occasion || '',
                        note: data.note || '',
                        message: message,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (err) {
                console.warn('Webhook failed:', err);
            }
        }

        // Gui thong bao Telegram
        var tg = SITE_CONFIG.telegram;
        if (tg && tg.botToken && tg.chatId) {
            try {
                var occasionNames = {'birthday':'Sinh nhật','anniversary':'Kỷ niệm','date':'Hẹn hò','gathering':'Họp mặt bạn bè','company':'Công ty / team','other':'Khác'};
                var dd = data.date.split('-');
                var dateStr = dd[2] + '/' + dd[1] + '/' + dd[0];
                var tgMsg = '🔔 ĐẶT BÀN MỚI\n\n';
                tgMsg += '👤 Tên: ' + data.name + '\n';
                tgMsg += '📱 SĐT: ' + data.phone + '\n';
                tgMsg += '📅 Ngày: ' + dateStr + '\n';
                tgMsg += '⏰ Giờ: ' + data.time + '\n';
                tgMsg += '👥 Số khách: ' + data.guests + '\n';
                if (data.occasion) tgMsg += '🎉 Dịp: ' + (occasionNames[data.occasion] || data.occasion) + '\n';
                if (data.note) tgMsg += '📝 Ghi chú: ' + data.note + '\n';
                tgMsg += '\n🕐 ' + new Date().toLocaleString('vi-VN') + '\n';
                tgMsg += '🌐 tramdungchill.vn';

                await fetch('https://api.telegram.org/bot' + tg.botToken + '/sendMessage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: tg.chatId,
                        text: tgMsg,
                        parse_mode: 'HTML'
                    })
                });
            } catch (err) {
                console.warn('Telegram failed:', err);
            }
        }

        // Open Zalo with pre-filled message
        const zaloUrl = 'https://zalo.me/' + zaloNumber + '?text=' + encodeURIComponent(message);

        setTimeout(() => {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;

            const modal = document.getElementById('successModal');
            if (modal) modal.classList.add('active');
            form.reset();

            window.open(zaloUrl, '_blank', 'noopener,noreferrer');
        }, 1000);
    });
}

function formatZaloMessage(data) {
    const occasionMap = {
        'birthday': 'Sinh nhật',
        'anniversary': 'Kỷ niệm',
        'date': 'Hẹn hò',
        'gathering': 'Họp mặt bạn bè',
        'company': 'Công ty / team',
        'other': 'Khác'
    };

    const [y, m, d] = data.date.split('-');
    const dateStr = d + '/' + m + '/' + y;

    let msg = '--- ĐẶT BÀN ONLINE ---\n';
    msg += 'Tên: ' + data.name + '\n';
    msg += 'SĐT: ' + data.phone + '\n';
    msg += 'Ngày: ' + dateStr + '\n';
    msg += 'Giờ: ' + data.time + '\n';
    msg += 'Số khách: ' + data.guests + '\n';
    if (data.occasion) msg += 'Dịp: ' + (occasionMap[data.occasion] || data.occasion) + '\n';
    if (data.note) msg += 'Ghi chú: ' + data.note + '\n';
    msg += '---\nĐặt qua website tramdungchill.vn';

    return msg;
}
