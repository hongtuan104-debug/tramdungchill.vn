/**
 * XUẤT ẢNH MENU CHO GOOGLE MAPS / GBP
 * ===================================
 * Copy nguyên bản PNG gốc (nét nhất, chưa nén) từ assets/menu-pages/_goc/
 * ra một thư mục NGOÀI repo, đổi tên theo cụm từ khoá local Đà Lạt.
 *
 * Vì sao copy PNG gốc chứ không lấy WebP trong assets/menu-pages/:
 *   bản WebP đã nén cho web (560/1000px) — chữ trong menu bị mềm khi Google
 *   phóng to. PNG gốc 1054x1492 vẫn dưới mức 5MB mà GBP cho phép.
 *
 * Vì sao đặt ngoài repo: 26 ảnh x ~2,6MB = ~68MB, không có lý do gì đẩy lên
 * GitHub Pages — đây là file để sếp upload tay lên Google Business Profile.
 *
 * Số thứ tự đặt ở ĐẦU tên file để Explorer sort đúng thứ tự cần upload;
 * từ khoá đứng ngay sau.
 *
 * ⚠️ THỨ TỰ ĐẢO NGƯỢC (26 → 1): prefix 01 là trang 26 của quyển menu,
 * prefix 26 là trang bìa. Vì Google Maps xếp ảnh upload SAU lên trước —
 * upload xuôi 1→26 thì trang cuối (liên hệ) đứng đầu album, bìa menu chìm
 * xuống dưới. Đảo lại để bìa là thứ khách nhìn thấy đầu tiên.
 * Đổi ý thì set DAO_NGUOC = false.
 *
 * Chạy:  node scripts/xuat-anh-google-maps.js
 */

const fs = require('fs');
const path = require('path');

const THU_MUC_GOC = path.join(__dirname, '..', 'assets', 'menu-pages', '_goc');
const THU_MUC_DICH = path.join(__dirname, '..', '..', 'anh-google-maps');

/* Tên file đích cho từng trang menu (khớp số file gốc 1..26).
   Nguyên tắc đặt tên:
   - Xoay vòng biến thể từ khoá (quán nướng / tiệm nướng / bbq / nướng tại bàn /
     quán nhậu / lẩu) thay vì lặp một cụm 26 lần — lặp y hệt là nhồi từ khoá,
     Google coi 26 ảnh đó là một khối trùng lặp.
   - Nửa sau tên file mô tả ĐÚNG món có trên trang đó. Tên file lệch nội dung
     ảnh thì phản tác dụng, vì Google có đọc được chữ trong ảnh menu.
   - Có "tram-dung-chill" ở các trang mốc (bìa, liên hệ) để buộc bộ ảnh vào
     đúng thực thể quán. */
const TEN_FILE = {
    1:  'quan-nuong-da-lat-tram-dung-chill-bia-menu',
    2:  'menu-quan-nuong-da-lat-bo-kobe-nuong-tang-pho-mai-trung-muoi',
    3:  'tiem-nuong-da-lat-veu-heo-uop-chao-oc-nhoi-thit',
    4:  'quan-nuong-ngon-da-lat-ca-tam-rang-muoi-suon-cay-thai',
    5:  'nuong-tai-ban-da-lat-bo-nuong-cuc-bo-nuong-xien',
    6:  'bbq-da-lat-ba-chi-heo-han-quoc-suon-que-chan-ga-nuong',
    7:  'hai-san-nuong-da-lat-ca-tam-tom-bach-tuoc-nuong',
    8:  'quan-nuong-da-lat-mon-an-kem-cha-ram-tom-dat-khoai-lang-ken',
    9:  'tiem-nuong-da-lat-com-chien-cao-nguyen-mi-xao-hai-san',
    10: 'lau-da-lat-tram-dung-chill-lau-ga-la-e-lau-hai-san-lau-ca-tam',
    11: 'quan-nhau-da-lat-mon-lai-rai-dau-hu-non-bo-luc-lac',
    12: 'tiem-nuong-da-lat-sun-ga-chien-mam-veu-heo-chay-toi',
    13: 'quan-nuong-da-lat-tra-nong-hoa-cuc-tao-do-tra-thao-moc',
    14: 'menu-do-uong-quan-nuong-da-lat-tra-chanh-nong-hat-chia-lipton',
    15: 'tiem-nuong-da-lat-tra-lanh-tra-vai-hat-chia-tra-dua-dao',
    16: 'quan-nuong-da-lat-tra-dao-cam-sa-tra-tac-xi-muoi-tra-oi-hong',
    17: 'thuc-don-quan-nuong-da-lat-soda-viet-quoc-soda-chanh-soda-blue',
    18: 'tiem-nuong-da-lat-soda-dau-tay-soda-dao',
    19: 'quan-nuong-da-lat-nuoc-lon-coca-cola-sprite-sting',
    20: 'tiem-nuong-da-lat-nuoc-lon-strongbow-nuoc-suoi',
    21: 'quan-nuong-bia-da-lat-tiger-bac-tiger-nau-sai-gon-xanh',
    22: 'menu-bia-quan-nuong-da-lat-sai-gon-chill-lager-heineken-lun',
    23: 'tiem-nuong-da-lat-ruou-mo-huong-dao-ruou-mo-300ml',
    24: 'quan-nuong-da-lat-ruou-mo-500ml-soju-mix-vi-ruou-vang-classic',
    25: 'tiem-nuong-da-lat-ruou-vang-export-ruou-tao-meo-ruou-mo-ume',
    26: 'quan-nuong-da-lat-tram-dung-chill-dia-chi-huynh-tan-phat-gio-mo-cua'
};

const TONG_SO_TRANG = 26;
const DAO_NGUOC = true;

function main() {
    if (!fs.existsSync(THU_MUC_GOC)) {
        console.error('✗ Không thấy thư mục ảnh gốc: ' + THU_MUC_GOC);
        process.exit(1);
    }
    fs.mkdirSync(THU_MUC_DICH, { recursive: true });

    // Dọn bản xuất lần trước, nếu không đổi kiểu đánh số sẽ để lại 2 bộ file
    // trùng nội dung khác tên. Chỉ xoá file khớp đúng mẫu do script này sinh ra.
    fs.readdirSync(THU_MUC_DICH)
        .filter(f => /^\d{2}-.+\.(png|jpe?g)$/i.test(f))
        .forEach(f => fs.unlinkSync(path.join(THU_MUC_DICH, f)));

    let daChep = 0;
    const thieu = [];

    for (let n = 1; n <= TONG_SO_TRANG; n++) {
        // Ảnh gốc có thể là .png hoặc .jpg — lấy cái nào có
        const nguon = ['.png', '.jpg', '.jpeg']
            .map(ext => path.join(THU_MUC_GOC, n + ext))
            .find(p => fs.existsSync(p));

        if (!nguon) { thieu.push(n); continue; }

        const thuTu = DAO_NGUOC ? (TONG_SO_TRANG + 1 - n) : n;
        const stt = String(thuTu).padStart(2, '0');
        const dich = path.join(THU_MUC_DICH, `${stt}-${TEN_FILE[n]}${path.extname(nguon)}`);
        fs.copyFileSync(nguon, dich);

        const kb = (fs.statSync(dich).size / 1048576).toFixed(1);
        console.log(`  ${path.basename(dich)}  (${kb} MB)  ← trang ${n}`);
        daChep++;
    }

    console.log(`\n✓ Đã chép ${daChep}/${TONG_SO_TRANG} ảnh sang: ${THU_MUC_DICH}`);
    if (thieu.length) {
        console.log(`⚠ Thiếu ảnh gốc cho trang: ${thieu.join(', ')}`);
    }
}

main();
