/* ============================================
   Tram Dung Chill - Booking Form
   Doc SITE_CONFIG tu data/site-config.js
   ============================================ */

/**
 * Get traffic source from UTM params or referrer.
 * Saves to sessionStorage so it persists across page navigation.
 */
function getTrafficSource() {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');

    // If UTM params present, save and return
    if (utmSource) {
        const source = {
            source: utmSource,
            medium: utmMedium || '',
            campaign: utmCampaign || ''
        };
        sessionStorage.setItem('tdc_source', JSON.stringify(source));
        return source;
    }

    // Check saved source from earlier page visit
    const saved = sessionStorage.getItem('tdc_source');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
    }

    // Auto-detect from referrer
    const ref = document.referrer;
    let detected = 'direct';
    if (ref.indexOf('facebook.com') !== -1 || ref.indexOf('fb.com') !== -1) detected = 'facebook_organic';
    else if (ref.indexOf('tiktok.com') !== -1) detected = 'tiktok';
    else if (ref.indexOf('google.') !== -1) detected = 'google_organic';
    else if (ref.indexOf('zalo.') !== -1) detected = 'zalo';
    else if (ref && ref.indexOf('tramdungchill.vn') === -1) detected = ref;

    const source = { source: detected, medium: '', campaign: '' };
    sessionStorage.setItem('tdc_source', JSON.stringify(source));
    return source;
}

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
            showNotification(t('notify.required', 'Vui lòng điền đầy đủ thông tin bắt buộc!'), 'error');
            return;
        }

        // Phone validation (Vietnamese: 0xxx or +84xxx or 84xxx)
        let cleanPhone = data.phone.replace(/[\.\s\-\(\)]/g, '');
        if (/^\+84/.test(cleanPhone)) cleanPhone = '0' + cleanPhone.slice(3);
        if (/^84[0-9]{9}$/.test(cleanPhone)) cleanPhone = '0' + cleanPhone.slice(2);
        if (!/^0[0-9]{9}$/.test(cleanPhone)) {
            showNotification(t('notify.phone', 'Số điện thoại không hợp lệ (cần 10 số)!'), 'error');
            return;
        }

        // Show loading
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        submitBtn.disabled = true;

        // Format message
        const message = formatZaloMessage(data);

        // Get traffic source (UTM or referrer)
        const trafficSource = getTrafficSource();

        // Send data via webhook (Google Apps Script → Google Sheet)
        // mode: 'no-cors' — GAS redirects POST, browser blocks cross-origin redirects
        const webhookUrl = SITE_CONFIG.webhookUrl;
        let webhookOk = true;
        if (webhookUrl) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    mode: 'no-cors',
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
                        source: trafficSource.source,
                        medium: trafficSource.medium,
                        campaign: trafficSource.campaign,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (err) {
                console.warn('Webhook failed:', err);
                webhookOk = false;
            }
        }

        // === TDC Booking App — auto-create booking ===
        try {
            await fetch('https://app.tramdungchill.vn/api/webhook/booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    phone: cleanPhone,
                    date: data.date,
                    time: data.time,
                    guests: parseInt(data.guests) || 2,
                    occasion: data.occasion || '',
                    note: data.note || '',
                    source: trafficSource.source,
                    medium: trafficSource.medium,
                    campaign: trafficSource.campaign
                })
            });
        } catch (e) { console.warn('App webhook skip:', e); }

        // Telegram notification is handled by Google Apps Script webhook

        // ============================================
        // CONVERSION TRACKING — All platforms
        // Fire after successful form submission
        // ============================================

        // 1. Google Ads conversion
        if (typeof gtag === 'function') {
            gtag('event', 'conversion_event_submit_lead_form', {});
        }

        // 2. GA4 — generate_lead event (for GA4 reporting + conversion)
        if (typeof gtag === 'function') {
            gtag('event', 'generate_lead', {
                currency: 'VND',
                value: 0,
                event_category: 'booking',
                event_label: trafficSource.source,
                guests: data.guests,
                occasion: data.occasion || ''
            });
        }

        // 3. Meta/Facebook Pixel — Lead event
        if (typeof fbq === 'function') {
            fbq('track', 'Lead', {
                content_name: 'Booking Form',
                content_category: 'restaurant_reservation',
                num_guests: data.guests,
                source: trafficSource.source
            });
        }

        // 4. TikTok Pixel — CompleteRegistration event
        if (typeof ttq !== 'undefined') {
            ttq.track('CompleteRegistration', {
                content_name: 'Booking Form',
                quantity: parseInt(data.guests) || 1
            });
        }

        // Open Zalo with pre-filled message
        const zaloUrl = 'https://zalo.me/' + zaloNumber + '?text=' + encodeURIComponent(message);

        setTimeout(() => {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;

            if (!webhookOk) {
                showNotification(
                    t('notify.webhook_fail', 'Lưu đặt bàn tạm lỗi — vui lòng nhắn Zalo để xác nhận!'),
                    'error'
                );
            }

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
    // Append traffic source if available
    const src = (typeof getTrafficSource === 'function') ? getTrafficSource() : null;
    if (src && src.source && src.source !== 'direct') {
        msg += 'Nguồn: ' + src.source + '\n';
    }
    msg += '---\nĐặt qua website tramdungchill.vn';

    return msg;
}
