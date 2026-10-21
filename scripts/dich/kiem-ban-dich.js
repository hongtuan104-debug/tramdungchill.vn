/***
 * scripts/dich/kiem-ban-dich.js — luật cho MỘT câu dịch (21/10/2026). Dùng ở hai nơi:
 *   - dich-trang.js --nap: câu sai bị trả lại, không vào từ điển
 *   - seo-geo-verify.js R33: soát lại cả từ điển trước khi push
 * Mỗi luật ứng với một luật đã có của bản tiếng Việt — bản dịch không được nói khác bản gốc:
 *   chỗ giữ chỗ khớp (link không gãy) · chữ số khớp (giá, giờ, số đánh giá — check-facts.js chỉ đọc
 *   được tiếng Việt) · không tự xưng "duy nhất / số một" (R8l, sếp cấm 13/09/2026) · setup không hứa
 *   hoa tươi / nến / hoa hồng (R8r mẫu 11, bug #39) · không bỏ sót chưa dịch.
 */
'use strict';
const P = require('./phan-tich');
const N = require('../ngon-ngu');

/* "Duy nhất" / "số một" ở 6 thứ tiếng. Chỉ bắt dạng tự xưng rõ ràng — "only 6 km" vẫn được. */
const CAM_DOC_QUYEN = {
    en: /\b(the only|only one|one and only|number one|no\.\s?1\b|no1\b|#\s?1\b|unrivall?ed|unmatched)/i,
    zh: /(唯一|独一无二|第一名|排名第一|首屈一指|No\.?\s?1|NO\.?\s?1|第1名)/,
    ja: /(唯一|ナンバーワン|ナンバー1|No\.?\s?1|NO\.?\s?1|第1位|第一位)/,
    ko: /(유일|넘버원|넘버 원|No\.?\s?1|NO\.?\s?1|1위|일등)/,
    ru: /(единственн|номер один|№\s?1\b|No\.?\s?1\b|#\s?1\b|первое место)/i,
    th: /(แห่งเดียว|ที่เดียวใน|เพียงแห่งเดียว|หนึ่งเดียว|อันดับหนึ่ง|อันดับ\s?1|นัมเบอร์วัน|No\.?\s?1)/
};
/* Setup sinh nhật / cầu hôn: hoa là hoa NHỰA, KHÔNG có nến (sếp chốt 23/09/2026). Nến trên bánh kem của khách thì được. */
const SETUP = {
    en: { ngu: /(set ?up|decorat)/i, cam: /(fresh flower|\bcandles?\b|\broses?\b)/i, banh: /cake/i },
    zh: { ngu: /(布置|装饰|装扮)/, cam: /(鲜花|蜡烛|玫瑰)/, banh: /蛋糕/ },
    // バラ = hoa hồng, NHƯNG 牛バラ / 豚バラ = thịt ba chỉ → loại hai dạng đó
    ja: { ngu: /(装飾|飾り付け|飾りつけ|セッティング|セットアップ|デコレーション)/, cam: /(生花|キャンドル|ろうそく|ロウソク|蝋燭|(?<![牛豚鶏])バラ(?!肉)|薔薇)/, banh: /ケーキ/ },
    ko: { ngu: /(세팅|장식|데코)/, cam: /(생화|촛불|양초|캔들|장미)/, banh: /케이크/ },
    // \b của JS chỉ hiểu chữ Latin → với chữ Kirin phải tự chặn ranh giới bằng (?<![а-яё]) / (?![а-яё]) («розовый» = hồng phấn không tính)
    ru: { ngu: /(оформлен|украш|декор|сервировк)/i, cam: /(живы[ехм] цвет|свеч|(?<![а-яё])роз(?:а|ы|у|е|ой|ами)?(?![а-яё]))/i, banh: /торт/i },
    th: { ngu: /(ตกแต่ง|จัดโต๊ะ|เซ็ตอัพ|เซ็ตอัป)/, cam: /(ดอกไม้สด|เทียน|กุหลาบ)/, banh: /เค้ก/ }
};

const RE_TEN_THANG = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b|январ|феврал|март|апрел|(?<![а-яё])ма[йяе](?![а-яё])|июн|июл|август|сентябр|октябр|ноябр|декабр|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม/gi;

/** Chữ số của một câu, viết về một dạng: "7.344" = "7,344" = "7344"; "95K" ≈ 95000 cũng nhận. */
function chuSo(s) {
    const ds = [];
    // Giờ: "20h" = "20:00" = "20", "16h30" = "16:30" — bản dịch được viết giờ theo kiểu tự nhiên của thứ tiếng đó
    const gio = String(s).replace(/<\/?[a-z]+\d*\/?>/gi, ' ')
        // số quán viết kiểu nào cũng là một số (bài gốc tiếng Anh ghi +84 989 765 070, bản dịch có thể giữ 0989.765.070)
        .replace(/\+84[\s.-]?989[\s.-]?765[\s.-]?070|\b0989[\s.-]?765[\s.-]?070\b/g, ' SDT ')
        .replace(/\b(\d{1,2})h(\d{2})(?!\d)/g, '$1:$2').replace(/\b(\d{1,2})(?::00|h)(?!\d|:\d)/g, '$1');
    for (const m of gio.matchAll(/\d+(?:[.,\s]\d{3})*(?:[.,]\d+)?/g)) {
        ds.push(m[0].replace(/[.,\s]/g, ''));
    }
    return ds;
}
function soKhop(goc, dich) {
    const a = chuSo(goc), b = chuSo(dich);
    const dem = new Map();
    for (const x of a) dem.set(x, (dem.get(x) || 0) + 1);
    const du = [];
    // Câu gốc viết tháng bằng chữ ("18 Oct 2026", "tháng Mười") → bản dịch được ghi tháng bằng số (2026年10月18日)
    let thangChu = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b|tháng (giêng|chạp|một|hai|ba|tư|năm|sáu|bảy|tám|chín|mười)/i.test(goc) ? 1 : 0;
    for (const y of b) {
        if (dem.get(y)) { dem.set(y, dem.get(y) - 1); continue; }
        if (thangChu && /^(0?[1-9]|1[0-2])$/.test(y)) { thangChu--; continue; }
        // 95K → 95000 / 95,000
        const k = y.replace(/000$/, '');
        if (k !== y && dem.get(k)) { dem.set(k, dem.get(k) - 1); continue; }
        du.push(y);
    }
    let thieu = [];
    for (const [x, n] of dem) for (let i = 0; i < n; i++) thieu.push(x);
    // Ngược lại: câu gốc "tháng 12 – tháng 2" → bản dịch viết tên tháng bằng chữ (December, декабрь, ธันวาคม)
    if (thieu.length && /tháng\s*\d/i.test(goc)) {
        let tenThang = (String(dich).match(RE_TEN_THANG) || []).length;
        thieu = thieu.filter((x) => !(tenThang > 0 && /^(0?[1-9]|1[0-2])$/.test(x) && tenThang--));
    }
    return { thieu, du };
}

// Tên riêng có dấu được phép giữ nguyên trong bản dịch (tên quán, địa chỉ, người, địa danh) — không tính khi đếm
const TEN_RIENG = ['Tiệm Nướng Trạm Dừng Chill', 'Trạm Dừng Chill', 'Tiệm Nướng', 'Huỳnh Tấn Phát', 'Phường Xuân Trường', 'Xuân Trường',
    'Đà Lạt', 'Lâm Đồng', 'Trại Mát', 'Hồ Xuân Hương', 'Xóm Lèo'];
const CO_DAU_VIET = /[ạảãàáâậầấẩẫăắằặẳẵóòọõỏôộổỗồốơờớợởỡéèẻẹẽêếềệểễúùủũụưứừựửữíìỉĩịýỳỷỹỵđ]/i;

/** Lỗi của một câu dịch (mảng rỗng = đạt). */
function kiemCau(ma, goc, dich) {
    const loi = [];
    const d = String(dich).trim();
    // Khoảng trắng hai đầu (nhãn tin nhắn "\nSĐT: ") phải giữ: mất là tin nhắn gửi quán dính chữ
    const dauG = (/^\s*/.exec(goc) || [''])[0], cuoiG = (/\s*$/.exec(goc) || [''])[0];
    if ((dauG || cuoiG) && (!String(dich).startsWith(dauG) || !String(dich).endsWith(cuoiG))) loi.push('mất khoảng trắng / xuống dòng ở đầu hoặc cuối câu');
    const l1 = P.kiemChoGiuCho(goc, d);
    if (l1) loi.push('chỗ giữ chỗ: ' + l1);
    const so = soKhop(goc, d);
    if (so.thieu.length || so.du.length) loi.push('chữ số lệch (thiếu ' + (so.thieu.join(',') || '—') + ' · thừa ' + (so.du.join(',') || '—') + ')');
    if (CAM_DOC_QUYEN[ma] && CAM_DOC_QUYEN[ma].test(d) && !CAM_DOC_QUYEN[ma].test(goc)) loi.push('tự xưng độc quyền (cấm "duy nhất / số một"): ' + d.match(CAM_DOC_QUYEN[ma])[0]);
    const st = SETUP[ma];
    if (st && st.ngu.test(d) && st.cam.test(d)) {
        const tu = d.match(st.cam)[0];
        const laNen = /candle|蜡烛|キャンドル|ろうそく|ロウソク|蝋燭|촛불|양초|캔들|свеч|เทียน/i.test(tu);
        if (!(laNen && st.banh.test(d))) loi.push('setup không có hoa tươi / nến / hoa hồng (hoa trang trí là hoa nhựa): ' + tu);
    }
    const tran = goc.replace(/<\/?[a-z]+\d*\/?>/gi, ' ').trim();
    const conChu = P.CO_CHU.test(TEN_RIENG.reduce((x, t) => x.split(t).join(' '), tran));   // câu toàn tên riêng / địa chỉ → giữ nguyên được
    if (d === goc && conChu && tran.split(/\s+/).length >= 2 && !N.GIU_NGUYEN.has(goc) && !/^[\x00-\x7F]*$/.test(tran.replace(/[^\p{L}\s]/gu, ''))) {
        loi.push('chưa dịch (y nguyên câu gốc)');
    }
    // Câu dịch còn nhiều chữ tiếng Việt có dấu → gần như chắc là dịch sót nửa câu. Tên riêng có dấu
    // (Trạm Dừng Chill, Huỳnh Tấn Phát…) chỉ vài chữ, nên ngưỡng là quá nửa số chữ có dấu.
    if (ma !== 'vi') {
        const boTen = TEN_RIENG.reduce((s, t) => s.split(t).join(' '), d);
        const chu = boTen.replace(/<\/?[a-z]+\d*\/?>/gi, ' ').split(/\s+/).filter((w) => /\p{L}/u.test(w));
        const coDau = chu.filter((w) => CO_DAU_VIET.test(w)).length;
        if (chu.length >= 6 && coDau / chu.length > 0.5) loi.push('còn nhiều chữ tiếng Việt (' + coDau + '/' + chu.length + ')');
    }
    return loi;
}

module.exports = { kiemCau, soKhop, CAM_DOC_QUYEN, SETUP };
