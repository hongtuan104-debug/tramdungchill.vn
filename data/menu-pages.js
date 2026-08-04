/**
 * MENU-PAGES — 26 trang menu ảnh (flipbook lật trang)
 * ===================================================
 * NGUỒN DUY NHẤT cho: tên file ảnh, thứ tự trang, alt text, mục lục nhóm.
 *
 * Dùng bởi:
 *   - scripts/tao-anh-menu.js        → đổi tên + xuất WebP 3 kích cỡ từ ảnh gốc
 *   - scripts/generate-menu-flipbook.js → sinh HTML tĩnh vào menu.html (SEO + no-JS)
 *   - js/menu-flipbook.js            → nâng cấp HTML tĩnh thành sách lật có âm thanh
 *
 * ⚠️ PHẢI dùng `var` (KHÔNG dùng `const`): const không tạo window property,
 *    menu-flipbook.js đọc qua window.MENU_PAGES sẽ hỏng — đúng lỗi cũ của TRANSLATIONS.
 *
 * ĐỔI ẢNH 1 TRANG: thay file gốc trong assets/menu-pages/_goc/ (giữ số thứ tự),
 *   chạy `node scripts/tao-anh-menu.js` rồi `node scripts/bundle-js.js`.
 *
 * THÊM/BỚT TRANG: sửa mảng dưới đây + đặt lại số thứ tự file gốc. Đừng sửa HTML tay
 *   trong menu.html — vùng giữa marker MENU_FLIPBOOK do generator ghi đè.
 *
 * QUY ƯỚC TÊN FILE (SEO): menu-quan-nuong-da-lat-<số>-<món chính trong trang>
 *   → nhắm cụm "menu quán nướng đà lạt", "thực đơn bbq đà lạt" + tên món trên Google Images.
 *
 * ALT TEXT: mô tả đúng món có trong trang, KHÔNG ghi giá.
 *   Giá chỉ có một nguồn duy nhất là data/menu-data.js (bảng giá text bên dưới flipbook)
 *   — ghi giá ở hai nơi là cách chắc chắn nhất để đẻ ra hai mức giá lệch nhau.
 */

var MENU_PAGE_GROUPS = [
    { id: 'bia-sach', label: 'Bìa', i18n: 'flip.group.cover' },
    { id: 'bestseller', label: 'Best Seller', i18n: 'flip.group.bestseller' },
    { id: 'nuong', label: 'BBQ Nướng Tại Bàn', i18n: 'flip.group.bbq' },
    { id: 'ankem', label: 'Món Ăn Kèm', i18n: 'flip.group.sides' },
    { id: 'com', label: 'No Cái Bụng', i18n: 'flip.group.mains' },
    { id: 'lau', label: 'Lẩu', i18n: 'flip.group.hotpot' },
    { id: 'laurai', label: 'Món Lai Rai', i18n: 'flip.group.snacks' },
    { id: 'tra', label: 'Trà Nóng & Trà Lạnh', i18n: 'flip.group.tea' },
    { id: 'soda', label: 'Soda & Nước Lon', i18n: 'flip.group.soda' },
    { id: 'bia', label: 'Bia', i18n: 'flip.group.beer' },
    { id: 'ruou', label: 'Rượu', i18n: 'flip.group.wine' },
    { id: 'lien-he', label: 'Liên hệ', i18n: 'flip.group.contact' }
];

var MENU_PAGES = [
    {
        n: 1,
        group: 'bia-sach',
        slug: 'menu-quan-nuong-da-lat-01-bia-tram-dung-chill',
        alt: 'Bìa menu Tiệm Nướng Trạm Dừng Chill — quán nướng Đà Lạt view hoàng hôn và tàu cổ, 111-113 Huỳnh Tấn Phát, mở cửa 15h-23h'
    },
    {
        n: 2,
        group: 'bestseller',
        slug: 'menu-quan-nuong-da-lat-02-best-seller-bo-kobe-pho-mai-trung-muoi',
        alt: 'Trang best seller menu quán nướng Đà Lạt: bò Kobe nướng tảng phô mai trứng muối, bò Okachi nướng tảng, ba chỉ bò nướng muối tiêu, vếu heo ướp sate'
    },
    {
        n: 3,
        group: 'bestseller',
        slug: 'menu-quan-nuong-da-lat-03-best-seller-veu-heo-uop-chao-oc-nhoi-thit',
        alt: 'Món best seller Trạm Dừng Chill: vếu heo ướp chao, ba chỉ bò cuộn nấm kim châm, ốc nhồi thịt, cá tầm lúc lắc'
    },
    {
        n: 4,
        group: 'bestseller',
        slug: 'menu-quan-nuong-da-lat-04-best-seller-ca-tam-rang-muoi-suon-cay-thai',
        alt: 'Best seller quán nướng Đà Lạt: cá tầm rang muối, sườn cay Thái Lan, tôm chiên trứng muối'
    },
    {
        n: 5,
        group: 'nuong',
        slug: 'menu-quan-nuong-da-lat-05-bbq-nuong-tai-ban-bo-nuong-cuc-bo-xien',
        alt: 'Thực đơn BBQ nướng tại bàn Đà Lạt: bò nướng cục, bò nướng xiên, ba chỉ heo nướng ngũ vị'
    },
    {
        n: 6,
        group: 'nuong',
        slug: 'menu-quan-nuong-da-lat-06-bbq-ba-chi-heo-han-quoc-suon-que-chan-ga',
        alt: 'Menu nướng tại bàn: ba chỉ heo Hàn Quốc, sườn que nướng, chân gà nướng muối ớt'
    },
    {
        n: 7,
        group: 'nuong',
        slug: 'menu-quan-nuong-da-lat-07-hai-san-nuong-ca-tam-tom-bach-tuoc',
        alt: 'Hải sản nướng tại quán nướng Đà Lạt: cá tầm nướng, tôm nướng muối ớt, bạch tuộc nướng'
    },
    {
        n: 8,
        group: 'ankem',
        slug: 'menu-quan-nuong-da-lat-08-mon-an-kem-cha-ram-tom-dat-khoai-lang-ken',
        alt: 'Món ăn kèm: chả ram tôm đất, khoai tây chiên, khoai lang kén, salad trộn dầu giấm'
    },
    {
        n: 9,
        group: 'com',
        slug: 'menu-quan-nuong-da-lat-09-com-chien-cao-nguyen-mi-xao-hai-san',
        alt: 'Món no cái bụng: cơm chiên cao nguyên, cơm chiên hải sản, mì xào hải sản, mì xào bò'
    },
    {
        n: 10,
        group: 'lau',
        slug: 'menu-quan-nuong-da-lat-10-lau-ga-la-e-lau-hai-san-lau-ca-tam',
        alt: 'Menu lẩu Đà Lạt: lẩu gà lá é, lẩu hải sản, lẩu cá tầm — nồi lẩu nóng cho nhóm đông'
    },
    {
        n: 11,
        group: 'laurai',
        slug: 'menu-quan-nuong-da-lat-11-mon-lai-rai-dau-hu-non-bo-luc-lac',
        alt: 'Món lai rai nhâm nhi: đậu hũ non chiên chà bông, xúc xích Đức nướng, bò lúc lắc'
    },
    {
        n: 12,
        group: 'laurai',
        slug: 'menu-quan-nuong-da-lat-12-mon-lai-rai-sun-ga-chien-mam-vu-heo-chay-toi',
        alt: 'Món lai rai: sụn gà chiên mắm, vú heo cháy tỏi'
    },
    {
        n: 13,
        group: 'tra',
        slug: 'menu-quan-nuong-da-lat-13-tra-nong-hoa-cuc-tao-do-thao-moc',
        alt: 'Trà nóng Đà Lạt: trà hoa cúc táo đỏ, trà thảo mộc, trà gừng táo đỏ mật ong'
    },
    {
        n: 14,
        group: 'tra',
        slug: 'menu-quan-nuong-da-lat-14-tra-chanh-nong-hat-chia-tra-lipton',
        alt: 'Trà nóng: trà chanh nóng hạt chia, trà Lipton nóng'
    },
    {
        n: 15,
        group: 'tra',
        slug: 'menu-quan-nuong-da-lat-15-tra-lanh-tra-vai-hat-chia-tra-dua-dao',
        alt: 'Trà lạnh: trà vải hạt chia, trà dứa đào, trà trái cây nhiệt đới'
    },
    {
        n: 16,
        group: 'tra',
        slug: 'menu-quan-nuong-da-lat-16-tra-dao-cam-sa-tra-tac-xi-muoi-tra-oi-hong',
        alt: 'Trà lạnh: trà đào cam sả, trà tắc xí muội, trà ổi hồng'
    },
    {
        n: 17,
        group: 'soda',
        slug: 'menu-quan-nuong-da-lat-17-soda-viet-quoc-soda-chanh-soda-blue',
        alt: 'Soda tại quán nướng Đà Lạt: soda việt quốc, soda chanh, soda blue'
    },
    {
        n: 18,
        group: 'soda',
        slug: 'menu-quan-nuong-da-lat-18-soda-dau-tay-soda-dao',
        alt: 'Soda: soda dâu tây, soda đào'
    },
    {
        n: 19,
        group: 'soda',
        slug: 'menu-quan-nuong-da-lat-19-nuoc-lon-coca-cola-sprite-sting',
        alt: 'Nước lon: Coca Cola, Sprite, Sting'
    },
    {
        n: 20,
        group: 'soda',
        slug: 'menu-quan-nuong-da-lat-20-nuoc-lon-strongbow-nuoc-suoi',
        alt: 'Nước lon: Strongbow, nước suối'
    },
    {
        n: 21,
        group: 'bia',
        slug: 'menu-quan-nuong-da-lat-21-bia-tiger-bac-tiger-nau-sai-gon-xanh',
        alt: 'Menu bia: Tiger bạc (Tiger Crystal), Tiger nâu, Sài Gòn xanh Special'
    },
    {
        n: 22,
        group: 'bia',
        slug: 'menu-quan-nuong-da-lat-22-bia-sai-gon-chill-lager-heineken-lun',
        alt: 'Menu bia: Sài Gòn Chill, Sài Gòn Lager, Heineken lùn'
    },
    {
        n: 23,
        group: 'ruou',
        slug: 'menu-quan-nuong-da-lat-23-ruou-mo-huong-dao-ruou-mo-300ml',
        alt: 'Menu rượu: rượu mơ hương đào 18%, rượu mơ 300ml 29%, rượu mơ 350ml'
    },
    {
        n: 24,
        group: 'ruou',
        slug: 'menu-quan-nuong-da-lat-24-ruou-mo-500ml-soju-mix-vi-vang-classic',
        alt: 'Menu rượu: rượu mơ 500ml, soju mix vị 360ml, rượu vang Classic 750ml'
    },
    {
        n: 25,
        group: 'ruou',
        slug: 'menu-quan-nuong-da-lat-25-ruou-vang-export-ruou-tao-meo-mo-ume',
        alt: 'Menu rượu: rượu vang Export 750ml, rượu táo mèo 300ml, rượu mơ Ume Classic'
    },
    {
        n: 26,
        group: 'lien-he',
        slug: 'menu-quan-nuong-da-lat-26-dia-chi-gio-mo-cua-danh-gia-google',
        alt: 'Trang cuối menu Trạm Dừng Chill: địa chỉ 111-113 Huỳnh Tấn Phát, Xuân Trường - Đà Lạt, hotline 0989 765 070, giờ mở cửa 15h-23h, mã QR đánh giá Google Maps'
    }
];

/* Kích cỡ WebP xuất ra (px chiều rộng) — dùng chung cho script tối ưu ảnh và srcset.
   560: điện thoại · 1000: điện thoại retina + sách mở trên desktop · 1600: phóng to đọc chữ.
   200: ảnh nhỏ trong bảng mục lục (chỉ tải khi khách bấm "Mục lục"). */
var MENU_PAGE_SIZES = [560, 1000, 1600];
var MENU_PAGE_THUMB = 200;

/* Thư mục chứa ảnh đã tối ưu (đường dẫn tương đối từ gốc site) */
var MENU_PAGE_DIR = 'assets/menu-pages';
