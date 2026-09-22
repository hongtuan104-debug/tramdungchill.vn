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

    /* Đánh dấu ô sai rồi đưa con trỏ về đúng ô đó.

       Trước đây khi thiếu trường, form chỉ bắn một toast chung ở góc TRÊN PHẢI
       màn hình — còn ô nào thiếu thì khách phải tự dò. Trên điện thoại, khối
       đặt bàn dài 7 ô và toast lại nằm ngoài tầm mắt khách đang nhìn nút Gửi ở
       cuối form, nên khách không biết phải sửa gì (checklist Mobile #142).

       focus() giải quyết cả hai: cuộn đúng ô vào tầm nhìn VÀ mở sẵn bàn phím
       đúng loại (type=tel ra bàn phím số). aria-invalid để trình đọc màn hình
       và CSS cùng biết ô nào đang sai. */
    function clearInvalid() {
        form.querySelectorAll('[aria-invalid="true"]').forEach(function (el) {
            el.removeAttribute('aria-invalid');
        });
    }
    function markInvalid(name) {
        const el = form.querySelector('[name="' + name + '"]');
        if (!el) return;
        el.setAttribute('aria-invalid', 'true');
        el.focus();
    }
    // Khách vừa gõ lại là gỡ dấu đỏ ngay, không bắt chờ tới lượt Gửi sau
    form.addEventListener('input', clearInvalid);
    form.addEventListener('change', clearInvalid);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Validation
        clearInvalid();
        const oThieu = ['name', 'phone', 'date', 'time', 'guests'].find(function (k) { return !data[k]; });
        if (oThieu) {
            showNotification(t('notify.required', 'Vui lòng điền đầy đủ thông tin bắt buộc!'), 'error');
            markInvalid(oThieu);
            return;
        }

        // Phone validation (Vietnamese: 0xxx or +84xxx or 84xxx)
        let cleanPhone = data.phone.replace(/[\.\s\-\(\)]/g, '');
        if (/^\+84/.test(cleanPhone)) cleanPhone = '0' + cleanPhone.slice(3);
        if (/^84[0-9]{9}$/.test(cleanPhone)) cleanPhone = '0' + cleanPhone.slice(2);
        if (!/^0[0-9]{9}$/.test(cleanPhone)) {
            showNotification(t('notify.phone', 'Số điện thoại không hợp lệ (cần 10 số)!'), 'error');
            markInvalid('phone');
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

        /* ── Hai đường đưa đơn tới quán, theo dõi RIÊNG (sửa 17/09/2026, CLAUDE.md #35) ──
           appOk   = đơn đã vào app đặt bàn (biết chắc, đọc được mã trả về)
           sheetOk = Apps Script đã nhận (Sheet + Telegram + Zalo nhóm)
           Chuyển đổi chỉ được bắn khi CÓ ÍT NHẤT MỘT đường thành công — trước đây
           bắn vô điều kiện, nên lúc cả hai webhook chết thì khách đọc "lưu đặt bàn
           tạm lỗi" mà Google Ads vẫn đếm xong một chuyển đổi. Đúng loại lỗi bug #4
           từng gây ra: deployment Apps Script sai quyền, đơn rớt sạch, số vẫn đẹp. */
        let appOk = false;
        let sheetOk = false;
        let donTrung = false;
        try {
            const appRes = await fetch('https://app.tramdungchill.vn/api/webhook/booking', {
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
            // fetch KHÔNG ném lỗi khi máy chủ trả 4xx/5xx — phải tự kiểm mã trả về,
            // không thì đơn rớt mà khách vẫn thấy màn hình cảm ơn (lỗi rơi âm thầm).
            // Đơn TRÙNG được máy chủ trả 200 kèm deduped:true ⇒ không báo động oan.
            if (appRes.ok) {
                appOk = true;
                /* deduped:true = cùng khách gửi lại trong 5 phút. Đơn không mất (bản đầu đã
                   nằm trong app) nhưng cũng KHÔNG phải lead mới: đo 19/09/2026 (Chrome, webhook
                   giả lập) cả 4 nền tảng vẫn đếm chuyển đổi lần hai — checklist #30 mục 279. */
                try { const kq = await appRes.json(); donTrung = !!(kq && kq.deduped); } catch (e) {}
            }
            else console.warn('App webhook trả mã lỗi:', appRes.status);
        } catch (e) {
            console.warn('App webhook skip:', e);
        }

        // Send data via webhook (Google Apps Script → Google Sheet) — AFTER để dedup 5min catch sendToApp
        const webhookUrl = SITE_CONFIG.webhookUrl;
        if (webhookUrl) {
            try {
                /* ⚠️ KHÔNG dùng mode:'no-cors' (bản cũ dùng). Với no-cors trình duyệt trả
                   "opaque response": promise resolve kể cả khi máy chủ trả 500 hay URL
                   deployment đã chết, res.ok luôn false, status luôn 0 — tức mình MÙ,
                   không cách nào biết đơn có tới hay không.
                   Deployment này trả CORS thật (đo 17/09/2026: GET → type "cors",
                   Access-Control-Allow-Origin có, đọc được thân JSON), và Content-Type
                   text/plain là "simple request" nên không sinh preflight → bỏ no-cors đi
                   là đọc được kết quả thật mà không phải đổi gì phía Apps Script. */
                const sheetRes = await fetch(webhookUrl, {
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
                        source: trafficSource.source,
                        medium: trafficSource.medium,
                        campaign: trafficSource.campaign,
                        timestamp: new Date().toISOString()
                    })
                });
                /* ⚠️ res.ok CHƯA đủ với Apps Script (sửa 19/09/2026, checklist #30 mục 279):
                   ContentService không đặt được mã HTTP, nên doPost bắt lỗi rồi trả
                   {"status":"error"} vẫn là 200 (xem doPost trong docs/google-apps-script.js;
                   bản đang chạy trả đúng quy ước {"status":...} đó cho GET). Đo 19/09/2026 bằng
                   Chrome, webhook giả lập: app 500 + Apps Script {"status":"error"} → cả 4 nền
                   tảng vẫn đếm chuyển đổi. Chỉ coi là hỏng khi thân trả lời nói rõ là lỗi; thân
                   lạ hay không đọc được thì vẫn tin res.ok, để một lần đổi định dạng phía Apps
                   Script không tắt sạch chuyển đổi. */
                if (sheetRes.ok) {
                    let kq = null;
                    try { kq = await sheetRes.json(); } catch (e) {}
                    if (kq && kq.status === 'error') console.warn('Apps Script báo lỗi:', kq.message || '');
                    else sheetOk = true;
                }
                else console.warn('Apps Script trả mã lỗi:', sheetRes.status);
            } catch (err) {
                console.warn('Webhook failed:', err);
            }
        }

        // Telegram notification is handled by Google Apps Script webhook

        /* Hai câu hỏi KHÁC NHAU, đừng gộp làm một cờ:
           - webhookOk (mọi đường đều thông) quyết định có cảnh báo khách hay không.
             Chỉ cần Apps Script hỏng là nhân viên KHÔNG nhận Telegram/Zalo, dù đơn
             đã nằm trong app — khách vẫn phải được nhắc nhắn Zalo cho chắc.
           - daLuuDuoc (ít nhất một đường thông) quyết định có đếm chuyển đổi hay
             không: đơn đã vào được hệ thống thì đó là lead thật. */
        const webhookOk = appOk && sheetOk;
        const daLuuDuoc = appOk || sheetOk;

        // ============================================
        // CONVERSION TRACKING — All platforms
        // CHỈ bắn khi đơn thật sự vào được hệ thống (17/09/2026).
        // Cả hai đường chết ⇒ khách được nhắc nhắn Zalo, và KHÔNG có chuyển đổi nào
        // được đếm — số trong Google Ads / Meta / TikTok khớp với đơn có thật.
        // Đơn trùng (app báo deduped) cũng không đếm lại (19/09/2026).
        // ============================================
        if (daLuuDuoc && !donTrung) {
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
