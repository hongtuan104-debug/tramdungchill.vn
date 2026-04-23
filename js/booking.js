/* ============================================
   Tram Dung Chill - Booking Form
   Doc SITE_CONFIG tu data/site-config.js
   ============================================ */

/**
 * Đọc cookie theo tên. Trả '' nếu không có.
 */
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Lấy các click-ID / browser-ID để Meta + TikTok dedupe + match khách ads.
 * Ưu tiên cookie (Pixel đã set), fallback URL param (khách click ads lần đầu,
 * pixel chưa kịp set cookie trước khi submit form).
 *
 * Why: tăng Event Match Quality (Meta 5.2 → 7-8, TikTok tương tự) → attribution
 * chính xác hơn → ads optimizer biết đúng người convert.
 */
function getAdsClickIds() {
    const params = new URLSearchParams(window.location.search);

    // Meta Pixel cookies
    const fbp = getCookie('_fbp');
    let fbc = getCookie('_fbc');

    // Nếu không có _fbc cookie nhưng URL có fbclid → build format Meta chuẩn
    const fbclid = params.get('fbclid');
    if (!fbc && fbclid) {
        fbc = 'fb.1.' + Date.now() + '.' + fbclid;
    }

    // TikTok: ttclid từ URL, ttp (TikTok browser ID) từ cookie
    const ttclid = params.get('ttclid') || getCookie('ttclid') || '';
    const ttp = getCookie('_ttp') || getCookie('ttp') || '';

    return { fbp, fbc, ttclid, ttp };
}

/**
 * Get traffic source — first-touch attribution với persistence 30 ngày.
 *
 * Flow:
 *  1. URL có UTM → save first-touch (chỉ write nếu chưa có tdc_source_first)
 *  2. URL có UTM → save last-touch (overwrite mỗi lần)
 *  3. Không UTM → fallback: tdc_source_last → tdc_source_first → referrer detect → direct
 *
 * Store localStorage để survive close browser. TTL 30 ngày để tránh stale attribution.
 * Return last-touch (industry standard), nhưng payload gửi thêm first-touch cho analyst.
 */
function getTrafficSource() {
    const KEY_FIRST = 'tdc_source_first';
    const KEY_LAST = 'tdc_source_last';
    const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 ngày

    function readStore(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const obj = JSON.parse(raw);
            if (!obj.ts || Date.now() - obj.ts > TTL_MS) {
                localStorage.removeItem(key);
                return null;
            }
            return obj;
        } catch (e) { return null; }
    }

    function writeStore(key, data) {
        try { localStorage.setItem(key, JSON.stringify({ ...data, ts: Date.now() })); } catch (e) {}
    }

    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    const utmContent = params.get('utm_content');

    if (utmSource) {
        const cur = { source: utmSource, medium: utmMedium || '', campaign: utmCampaign || '', content: utmContent || '' };
        if (!readStore(KEY_FIRST)) writeStore(KEY_FIRST, cur);
        writeStore(KEY_LAST, cur);
        const first = readStore(KEY_FIRST) || cur;
        return { ...cur, first_source: first.source, first_campaign: first.campaign };
    }

    // Click-ID fallback (khi ads không tag UTM đầy đủ): gclid/fbclid/ttclid
    // Ưu tiên hơn referrer vì click-ID là tín hiệu ads TRỰC TIẾP, không bị strip referrer
    const clickIdSources = [
        { param: 'gclid', source: 'google_ads' },
        { param: 'fbclid', source: 'facebook_ads' },
        { param: 'ttclid', source: 'tiktok_ads' }
    ];
    for (let i = 0; i < clickIdSources.length; i++) {
        const { param, source } = clickIdSources[i];
        if (params.get(param)) {
            const cur = { source, medium: 'cpc', campaign: '', content: '' };
            if (!readStore(KEY_FIRST)) writeStore(KEY_FIRST, cur);
            writeStore(KEY_LAST, cur);
            const first = readStore(KEY_FIRST) || cur;
            return { ...cur, first_source: first.source, first_campaign: first.campaign };
        }
    }

    const last = readStore(KEY_LAST);
    if (last) {
        const first = readStore(KEY_FIRST) || last;
        return { source: last.source, medium: last.medium, campaign: last.campaign, content: last.content, first_source: first.source, first_campaign: first.campaign };
    }

    // Referrer detection — ưu tiên hơn (Maps, Organic Search, Social)
    const ref = (document.referrer || '').toLowerCase();
    let detected = 'direct';
    if (/maps\.app\.goo\.gl|maps\.google\.|google\.[a-z.]+\/maps/.test(ref)) detected = 'google_maps';
    else if (/facebook\.com|fb\.com|l\.facebook/.test(ref)) detected = 'facebook_organic';
    else if (/instagram\.com/.test(ref)) detected = 'instagram_organic';
    else if (/tiktok\.com/.test(ref)) detected = 'tiktok_organic';
    else if (/google\.[a-z.]+/.test(ref)) detected = 'google_organic';
    else if (/bing\.com|duckduckgo|yahoo\./.test(ref)) detected = 'search_other';
    else if (/zalo\.[a-z]+/.test(ref)) detected = 'zalo';
    else if (/youtube\.com|youtu\.be/.test(ref)) detected = 'youtube';
    else if (ref && ref.indexOf('tramdungchill.vn') === -1) detected = new URL(ref).hostname;

    const fallback = { source: detected, medium: '', campaign: '', content: '' };
    writeStore(KEY_LAST, fallback);
    if (!readStore(KEY_FIRST)) writeStore(KEY_FIRST, fallback);
    const first = readStore(KEY_FIRST) || fallback;
    return { ...fallback, first_source: first.source, first_campaign: first.campaign };
}

function initBookingForm() {
    const form = document.getElementById('bookingForm');
    if (!form) return;

    const zaloNumber = SITE_CONFIG.contact.zaloNumber;

    // Pre-fill date = today + set min = today (prevent past dates)
    const dateInput = form.querySelector('input[type="date"][name="date"]');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = yyyy + '-' + mm + '-' + dd;
        if (!dateInput.value) dateInput.value = todayStr;
        dateInput.min = todayStr;
    }

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

        // Shared event_id cho browser pixel + server CAPI (Meta/TikTok dedupe)
        const eventId = 'tdc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);

        // Ads click-IDs để CAPI match với người click ads (boost match quality)
        const clickIds = getAdsClickIds();

        // === TDC Booking App — auto-create booking (FIRST để đảm bảo event_id từ client được dùng) ===
        let webhookOk = true;
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
                    campaign: trafficSource.campaign,
                    content: trafficSource.content || '',
                    first_source: trafficSource.first_source || '',
                    first_campaign: trafficSource.first_campaign || '',
                    referrer: document.referrer || '',
                    landing_url: window.location.href,
                    event_id: eventId,
                    fbp: clickIds.fbp,
                    fbc: clickIds.fbc,
                    ttclid: clickIds.ttclid,
                    ttp: clickIds.ttp
                })
            });
        } catch (e) { console.warn('App webhook skip:', e); }

        // Send data via webhook (Google Apps Script → Google Sheet) — AFTER để dedup 5min catch sendToApp
        const webhookUrl = SITE_CONFIG.webhookUrl;
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

        // 3. Meta/Facebook Pixel — Lead event (eventID match với server CAPI)
        if (typeof fbq === 'function') {
            fbq('track', 'Lead', {
                content_name: 'Booking Form',
                content_category: 'restaurant_reservation',
                num_guests: data.guests,
                source: trafficSource.source
            }, { eventID: eventId });
        }

        // 4. TikTok Pixel — CompleteRegistration event (event_id match với server Events API)
        if (typeof ttq !== 'undefined') {
            ttq.track('CompleteRegistration', {
                content_name: 'Booking Form',
                content_type: 'restaurant_reservation',
                quantity: parseInt(data.guests) || 1
            }, { event_id: eventId });
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
