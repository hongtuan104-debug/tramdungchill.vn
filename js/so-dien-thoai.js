/**
 * Số điện thoại khách đặt bàn — dùng chung cho form trang chủ (booking.js) và 4 trang dịp (22/10/2026).
 *
 * Vì sao: khách nước ngoài hay gõ số NỘI ĐỊA nước họ, không có mã nước — Malaysia "017 523 3899", Hàn "010…",
 * Úc "04…". Nhân viên tư vấn không biết thêm +mấy để nhắn WhatsApp. Đo 22/10/2026 (90 ngày, 5.609 đơn đặt bàn):
 * ~13 đơn khách nước ngoài để số kiểu đó, 10 đơn bị huỷ vì không liên lạc được. Form cũ coi mọi số "0 + 9 chữ số"
 * là số Việt nên số Malaysia lọt qua; 4 trang dịp không kiểm số gì.
 *
 * Luật:
 *   - Số Việt hợp lệ (di động 03/05/07/08/09 đủ 10 số, máy bàn 02x 11 số; +84/84/0084 đổi về 0…; "+901234567",
 *     "00983123456", "+84 0901…" cũng là số Việt) → giữ dạng 0… như cũ. Trang tiếng Việt: di động quên số 0 đầu → thêm 0.
 *   - Số có mã nước ("+60 17…", "0060 17…") → giữ "+<mã nước><số>" (bỏ số 0 trung kế viết thừa: "+82 010…" → "+82 10…";
 *     nước biết rõ độ dài thì kiểm độ dài) — app lưu nguyên (PR app #1192).
 *   - Còn lại → KHÔNG cho gửi. Đoán mã nước: di động Việt quên 0 (trang nước ngoài) → khuôn số của nước theo tiếng trang →
 *     vùng trình duyệt → khuôn đầu số nội địa → mã nước gõ thiếu "+". Đoán được thì form điền sẵn số đã thêm mã để khách
 *     kiểm rồi bấm gửi lại; không đoán được thì xin khách ghi kèm mã nước.
 *   - Trang tiếng Việt: số giống số Việt gõ thiếu/thừa 1 chữ số (0[35789] 9 hoặc 11 số) → KHÔNG đoán nước ngoài.
 *
 * ⚠️ bundle-js.js nén mã bằng biểu thức dò chuỗi: đừng viết chuỗi sao-gạch / gạch-sao hay hai dấu gạch chéo liền nhau
 *    trong biểu thức chính quy ở file này (nó tưởng là chú thích và cắt mất mã).
 * Kiểm: node scripts/kiem-so-dien-thoai.js
 */
var SoDienThoai = (function () {
    'use strict';

    // Mã nước theo vùng (ISO 3166-1) — các nước khách hay tới Đà Lạt + các nước lớn
    var MA = {
        VN: '84', SG: '65', MY: '60', KR: '82', CN: '86', TW: '886', HK: '852', MO: '853', JP: '81',
        TH: '66', PH: '63', ID: '62', KH: '855', LA: '856', MM: '95', IN: '91', AU: '61', NZ: '64',
        US: '1', CA: '1', GB: '44', IE: '353', FR: '33', DE: '49', NL: '31', BE: '32', CH: '41', AT: '43',
        IT: '39', ES: '34', PT: '351', SE: '46', NO: '47', DK: '45', FI: '358', PL: '48', CZ: '420',
        RU: '7', UA: '380', IL: '972', AE: '971', SA: '966', TR: '90', BR: '55', MX: '52'
    };
    // Độ dài số trong nước (đã bỏ số 0 trung kế) — bảng HẸP (chủ yếu di động) dùng khi ĐOÁN nước: đoán sai còn tệ hơn không đoán.
    var DAI_DOAN = {
        SG: [8, 8], MY: [9, 10], KR: [9, 10], CN: [11, 11], TW: [9, 9], HK: [8, 8], JP: [9, 10], TH: [8, 9],
        PH: [10, 10], ID: [9, 12], KH: [8, 9], AU: [9, 9], NZ: [8, 10], US: [10, 10], CA: [10, 10], GB: [10, 10],
        FR: [9, 9], DE: [10, 11], RU: [10, 10], IN: [10, 10]
    };
    // Bảng RỘNG (cả máy bàn) dùng khi KIỂM số khách đã tự ghi "+mã nước" — khách ghi mã thì tin khách, đừng chặn oan.
    // Nước ngoài bảng: 6–13 chữ số.
    var DAI_NHAN = {
        SG: [8, 8], HK: [8, 8], MO: [8, 8], MY: [8, 10], KR: [8, 10], CN: [10, 11], TW: [8, 9], JP: [9, 10],
        TH: [8, 9], PH: [8, 10], ID: [8, 12], KH: [8, 9], AU: [9, 9], NZ: [8, 10], US: [10, 10], CA: [10, 10],
        GB: [9, 10], FR: [9, 9], DE: [6, 11], RU: [10, 10], IN: [10, 10]
    };
    // Khuôn số NỘI ĐỊA (có số 0 trung kế) → nước. Thứ tự = ưu tiên khi nhiều khuôn cùng khớp.
    var KHUON = [
        { nuoc: 'KR', re: /^010\d{8}$/ },        // Hàn: 010-1234-5678 (11 số)
        { nuoc: 'MY', re: /^01\d{8}$/ },         // Malaysia: 01x-xxx xxxx (10 số) — ca khách Sandra 21/10 "0175233899"
        { nuoc: 'MY', re: /^011\d{8}$/ },        // Malaysia: 011-xxxx xxxx (11 số). 012x/016x… 11 số là số Việt CŨ (trước 2018) — không đoán
        { nuoc: 'AU', re: /^04\d{8}$/ },         // Úc: 04xx xxx xxx
        { nuoc: 'JP', re: /^0[789]0\d{8}$/ },    // Nhật: 090/080/070 + 8 số
        { nuoc: 'GB', re: /^07\d{9}$/ },         // Anh: 07xxx xxxxxx (11 số)
        { nuoc: 'PH', re: /^09\d{9}$/ },         // Philippines: 09xx xxx xxxx (11 số)
        { nuoc: 'ID', re: /^08\d{9,11}$/ },      // Indonesia: 08xx-xxxx-xxxx (11–13 số)
        { nuoc: 'TH', re: /^06\d{8}$/ },         // Thái: 06x… (08x/09x trùng khuôn số Việt — không đoán được)
        { nuoc: 'SG', re: /^[3689]\d{7}$/ },     // Singapore: 8 số, không có số 0 đầu
        { nuoc: 'CN', re: /^1[3-9]\d{9}$/ },     // Trung Quốc: 1xx xxxx xxxx (11 số, không có số 0 đầu)
        { nuoc: 'RU', re: /^89\d{9}$/ }          // Nga: 8 9xx xxx xx xx (số 8 trung kế)
    ];
    // Tiếng của trang → nước: khuôn số của nước đó xét TRƯỚC vùng máy (khách Trung/Hàn/Nhật để máy tiếng Anh-Mỹ rất nhiều —
    // soát chéo 22/10: số Trung "139 1234 5678" máy vùng US bị gợi ý +1 trước +86)
    var NUOC_THEO_TIENG = { zh: 'CN', ko: 'KR', ja: 'JP', th: 'TH', ru: 'RU' };
    // Nước KHÔNG có số 0 trung kế: số khách gõ bắt đầu bằng 0 thì không thể là số nước đó (E2E 22/10: số Hàn
    // "010-1234-5678" máy vùng US từng bị đoán "+1 1012345678")
    var KHONG_SO_0 = { US: 1, CA: 1, SG: 1, HK: 1, MO: 1 };

    // Dọn chuỗi khách gõ/dán: chữ số toàn khổ (bộ gõ Nhật/Trung) → ASCII, bỏ ký tự ẩn khi dán, chỉ giữ chữ số + dấu "+" đầu
    function donChuoi(raw) {
        var s = String(raw || '');
        if (s.normalize) s = s.normalize('NFKC');
        s = s.replace(/[​-‏‪-‮⁠-⁩﻿]/g, '');
        var dauCong = /^[\s(]{0,3}\+/.test(s);
        s = s.replace(/\D/g, '');
        return dauCong ? '+' + s : s;
    }
    function laSoViet(so) { return /^0[35789]\d{8}$/.test(so) || /^02\d{9}$/.test(so); }
    function laSoQuocTe(so) { return /^\+[1-9]\d{6,14}$/.test(so) && !/^\+84/.test(so); }
    // Gõ thiếu/thừa 1 chữ số của số di động Việt — trang tiếng Việt đừng đoán sang nước khác
    function giongSoVietGoSai(chiSo) { return /^0[35789]\d{7}$/.test(chiSo) || /^0[35789]\d{9}$/.test(chiSo); }

    // Tách mã nước khỏi số "+…" (mã dài nhất khớp trước) — để hiện "+60 175233899"
    function tachMa(so) {
        var chiSo = so.slice(1);
        var dsMa = Object.keys(MA).map(function (k) { return MA[k]; })
            .filter(function (m, i, a) { return a.indexOf(m) === i; })
            .sort(function (a, b) { return b.length - a.length; });
        for (var i = 0; i < dsMa.length; i++) {
            if (chiSo.indexOf(dsMa[i]) === 0) return { ma: dsMa[i], conLai: chiSo.slice(dsMa[i].length) };
        }
        return null;
    }
    function hienThi(so) {
        var t = tachMa(so);
        return t ? '+' + t.ma + ' ' + t.conLai : so;
    }
    function nuocCuaMa(ma) {
        for (var k in MA) { if (MA[k] === ma) return k; }
        return null;
    }
    // Số trong nước (đã bỏ số trung kế) có hợp lệ với nước đó không: độ dài theo bảng + khuôn mã vùng Bắc Mỹ
    function hopLeTrongNuoc(nuoc, trongNuoc, bang, macDinh) {
        var dai = bang[nuoc] || macDinh;
        if (trongNuoc.length < dai[0] || trongNuoc.length > dai[1]) return false;
        if ((nuoc === 'US' || nuoc === 'CA') && !/^[2-9]\d{2}[2-9]\d{6}$/.test(trongNuoc)) return false;
        return true;
    }

    // Ghép số nội địa với mã nước để GỢI Ý: bỏ số 0 trung kế (Nga bỏ số 8; Ý giữ số 0), kiểm độ dài bảng hẹp
    function ghep(nuoc, chiSo) {
        var ma = MA[nuoc];
        if (!ma) return null;
        if (KHONG_SO_0[nuoc] && chiSo.charAt(0) === '0') return null;
        var trongNuoc = chiSo;
        if (nuoc === 'RU' && /^8\d{10}$/.test(trongNuoc)) trongNuoc = trongNuoc.slice(1);
        else if (nuoc !== 'IT' && trongNuoc.charAt(0) === '0') trongNuoc = trongNuoc.slice(1);
        if (!hopLeTrongNuoc(nuoc, trongNuoc, DAI_DOAN, [7, 11])) return null;
        var so = '+' + ma + trongNuoc;
        if (!/^\+[1-9]\d{6,14}$/.test(so)) return null;
        return { nuoc: nuoc, so: so, hienThi: '+' + ma + ' ' + trongNuoc };
    }

    // Số khách đã ghi "+": bỏ số 0 trung kế viết thừa ("+82 010…", "+44 (0)7…" — Ý giữ số 0), kiểm độ dài bảng rộng.
    // Trả null nếu chắc chắn sai (vd "+65 8123 456" thiếu số).
    function chuanQuocTe(s) {
        if (!laSoQuocTe(s)) return null;
        var t = tachMa(s);
        if (!t) return { so: s, hienThi: s }; // mã nước ngoài bảng: nhận như khách gõ
        var conLai = t.conLai;
        if (t.ma !== '39' && conLai.charAt(0) === '0') conLai = conLai.slice(1);
        var nuoc = nuocCuaMa(t.ma);
        if (!hopLeTrongNuoc(nuoc, conLai, DAI_NHAN, [6, 13])) return null;
        var so = '+' + t.ma + conLai;
        if (!laSoQuocTe(so)) return null;
        return { so: so, hienThi: '+' + t.ma + ' ' + conLai };
    }

    // Vùng của trình duyệt: "en-MY" → "MY", "zh-Hant-TW" → "TW"; không có vùng → null
    function vungTrinhDuyet() {
        try {
            var ds = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ''];
            for (var i = 0; i < ds.length; i++) {
                var m = /-([A-Za-z]{2})(?:-|$)/.exec(ds[i] || '');
                if (m) return m[1].toUpperCase();
            }
        } catch (e) {}
        return null;
    }

    /**
     * phanTich(soKhachGo, vung?, lang) →
     *   { loai: 'vn',     so: '0901234567',    hienThi: '0901234567' }
     *   { loai: 'quocte', so: '+60175233899',  hienThi: '+60 175233899' }
     *   { loai: 'sai',    goiY: [{ nuoc: 'MY', so: '+60175233899', hienThi: '+60 175233899' }, …] }  (goiY có thể rỗng)
     * vung: mã vùng 2 chữ (bỏ trống = đọc từ trình duyệt; truyền '' để tắt đoán theo vùng — dùng khi chạy thử).
     * lang: tiếng của trang ('vi', 'en', 'zh'…).
     */
    function phanTich(raw, vung, lang) {
        var s = donChuoi(raw);
        // Số Việt gõ "+"/"00" mà thiếu 84: "+901234567", "00983123456"
        if (/^(\+|00)[35789]\d{8}$/.test(s)) s = '0' + s.replace(/^(\+|00)/, '');
        if (s.indexOf('00') === 0) s = '+' + s.slice(2);
        if (s.indexOf('+84') === 0) s = '0' + s.slice(3);
        else if (/^84\d{9}$/.test(s)) s = '0' + s.slice(2);
        if (/^00[35789]\d{8}$/.test(s)) s = s.slice(1); // "+84 0901…" viết thừa số 0
        if (laSoViet(s)) return { loai: 'vn', so: s, hienThi: s };
        // Trang tiếng Việt: di động Việt quên số 0 đầu → thêm 0 (app vẫn làm vậy). Soát chéo 22/10: trước đó "90 123 4567"
        // bị đoán thành số Thổ Nhĩ Kỳ +90.
        if (lang === 'vi' && /^[35789]\d{8}$/.test(s)) return { loai: 'vn', so: '0' + s, hienThi: '0' + s };
        if (s.charAt(0) === '+') {
            var q = chuanQuocTe(s);
            return q ? { loai: 'quocte', so: q.so, hienThi: q.hienThi } : { loai: 'sai', goiY: [], chiSo: s };
        }

        var goiY = [];
        var them = function (g) {
            if (g && !goiY.some(function (x) { return x.so === g.so; })) goiY.push(g);
        };
        var chiSo = s;
        var i;
        if (chiSo && !(lang === 'vi' && giongSoVietGoSai(chiSo))) {
            // 0) Trang tiếng nước ngoài: di động Việt quên số 0 (khách dùng SIM Việt) → +84 trước tiên
            if (/^[35789]\d{8}$/.test(chiSo)) them(ghep('VN', chiSo));
            // 1) Khuôn số của nước theo tiếng trang
            var nt = NUOC_THEO_TIENG[lang];
            if (nt) {
                for (i = 0; i < KHUON.length; i++) {
                    if (KHUON[i].nuoc === nt && KHUON[i].re.test(chiSo)) them(ghep(nt, chiSo));
                }
            }
            // 2) Vùng trình duyệt (khách để máy theo nước nhà)
            var v = (vung === undefined) ? vungTrinhDuyet() : vung;
            if (v && v !== 'VN' && MA[v]) {
                // khách gõ cả mã nước của chính vùng máy mà quên "+" (máy Mỹ gõ "1 415 555 0123", máy Malaysia gõ "60 17…")
                var conLaiV = chiSo.indexOf(MA[v]) === 0 ? chiSo.slice(MA[v].length) : '';
                if (conLaiV && conLaiV.charAt(0) !== '0' && hopLeTrongNuoc(v, conLaiV, DAI_DOAN, [7, 11])) {
                    them({ nuoc: v, so: '+' + chiSo, hienThi: '+' + MA[v] + ' ' + conLaiV });
                }
                them(ghep(v, chiSo));
            }
            // 3) Khuôn đầu số nội địa
            for (i = 0; i < KHUON.length; i++) {
                if (KHUON[i].re.test(chiSo)) them(ghep(KHUON[i].nuoc, chiSo));
            }
            // 4) Gõ cả mã nước nhưng quên "+" (vd 6581234567) — CHỈ với nước biết rõ độ dài; nước lạ thì đừng đoán
            //    (soát chéo 22/10: số Mỹ "415 555 0123" từng bị hiểu thành mã nước Thuỵ Sĩ +41)
            var tm = tachMa('+' + chiSo);
            if (tm && tm.ma !== '84' && tm.conLai.charAt(0) !== '0') {
                var n4 = nuocCuaMa(tm.ma);
                if (n4 && DAI_DOAN[n4] && hopLeTrongNuoc(n4, tm.conLai, DAI_DOAN, [7, 11])) {
                    them({ nuoc: n4, so: '+' + chiSo, hienThi: '+' + tm.ma + ' ' + tm.conLai });
                }
            }
        }
        return { loai: 'sai', goiY: goiY, chiSo: chiSo };
    }

    // Tiếng Anh: "a Australia / a India number" → "an …" (tên nước bắt đầu bằng nguyên âm; "United…"/"Ukraine" giữ "a")
    function anMaoTu(s) { return s.replace(/\ba (?=[AEIO])/, 'an '); }

    // Tên nước theo tiếng của trang (trình duyệt tự dịch) — không có thì trả mã vùng
    function tenNuoc(nuoc, lang) {
        try {
            if (typeof Intl !== 'undefined' && Intl.DisplayNames) {
                return new Intl.DisplayNames([lang || 'en'], { type: 'region' }).of(nuoc) || nuoc;
            }
        } catch (e) {}
        return nuoc;
    }

    /**
     * Câu báo cho khách khi số chưa đúng. lang = tiếng của trang.
     * Trang tiếng Việt: khách Việt gõ sai số (bắt đầu bằng 0, thiếu/thừa chữ số) chỉ thấy câu ngắn y như form cũ — chủ dặn
     * 22/10: khách Việt không phải ghi gì thêm, càng đơn giản càng không mất khách. Câu hướng dẫn mã nước (kèm 1 câu tiếng
     * Anh) chỉ hiện khi số trông như số nước ngoài — khách nước ngoài vẫn hay vào trang chủ tiếng Việt từ Google.
     * Khoá chữ nằm trong data/translations.js; trang dịch lấy bản dịch từ dist/chu-<mã>.js (dich-trang.js).
     */
    function cauBao(kq, lang) {
        var tr = (typeof t === 'function') ? t : function (k, d) { return d; };
        var g = kq.goiY && kq.goiY[0];
        var cau, anh;
        if (g) {
            cau = tr('notify.phone_goi_y', 'Số này giống số {nuoc} — đã thêm mã nước: {so}. Kiểm tra rồi bấm Gửi lại nhé.');
            anh = 'This looks like a {nuoc} number — we added the country code: {so}. Please check it and submit again.';
            cau = cau.replace('{nuoc}', tenNuoc(g.nuoc, lang)).replace('{so}', g.hienThi);
            anh = anMaoTu(anh.replace('{nuoc}', tenNuoc(g.nuoc, 'en')).replace('{so}', g.hienThi));
            if (lang === 'en') cau = anMaoTu(cau);
        } else if (lang === 'vi' && /^0\d{7,10}$/.test(kq.chiSo || '')) {
            cau = tr('notify.phone', 'Số điện thoại không hợp lệ (cần 10 số)!');
            anh = '';
        } else if (lang === 'vi') {
            cau = tr('notify.phone_nuoc_ngoai', 'Số điện thoại chưa đúng (số Việt cần 10 số, đầu 03/05/07/08/09). Số nước ngoài: ghi kèm mã nước, ví dụ +60 17 523 3899.');
            anh = 'Foreign number? Please add your country code, e.g. +60 17 523 3899.';
        } else {
            cau = tr('notify.phone_intl', 'Số điện thoại chưa đúng — ghi cả mã quốc gia, ví dụ +65 8123 4567.');
            anh = '';
        }
        return (lang === 'vi' && anh) ? cau + '\n' + anh : cau;
    }

    var api = { phanTich: phanTich, cauBao: cauBao, tenNuoc: tenNuoc, hienThi: hienThi, vungTrinhDuyet: vungTrinhDuyet };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
