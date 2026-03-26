/**
 * THUC DON - Tram Dung Chill
 * ===================================
 * DE CAP NHAT GIA: Sua so trong truong "price"
 * DE THEM MON: Copy 1 dong va sua ten + gia
 * DE XOA MON: Xoa dong do
 * DE THEM BADGE: Them "badge: 'Hot'" hoac "badge: 'Best'" hoac "badge: 'New'"
 *
 * Vi du them mon moi:
 *   { name: 'Ten Mon Moi', price: '100K' },
 *
 * Vi du them mon co badge:
 *   { name: 'Ten Mon Moi', price: '100K', badge: 'New' },
 */

const MENU_CATEGORIES = [
    { id: 'bestseller', label: 'Best Seller' },
    { id: 'nuong', label: 'BBQ Nướng Tại Bàn' },
    { id: 'ankem', label: 'Món Ăn Kèm' },
    { id: 'com', label: 'No Cái Bụng' },
    { id: 'lau', label: 'Lẩu' },
    { id: 'laurai', label: 'Món Lai Rai' },
    { id: 'tralanh', label: 'Trà Lạnh' },
    { id: 'tranong', label: 'Trà Nóng' },
    { id: 'soda', label: 'Soda' },
    { id: 'nuoc', label: 'Món Nước' },
    { id: 'bia', label: 'Bia' },
    { id: 'ruou', label: 'Rượu' },
];

const MENU_ITEMS = {
    bestseller: [
        { name: 'Ba Chỉ Bò Cuộn Kim Châm', price: '137K', badge: 'Best' },
        { name: 'Ba Chỉ Bò Nướng Muối Tiêu', price: '155K' },
        { name: 'Bò Tảng Nướng Phô Mai Trứng Muối', price: '210K', badge: 'Best' },
        { name: 'Ốc Nhồi Thịt', price: '165K' },
        { name: 'Cá Tầm Lúc Lắc', price: '165K' },
        { name: 'Cá Tầm Rang Muối', price: '200K' },
        { name: 'Sườn Cay Thái Lan', price: '260K', badge: 'Hot' },
        { name: 'Tôm Chiên Trứng Muối', price: '160K' },
    ],

    nuong: [
        { name: 'Ba Chỉ Heo Hàn Quốc', price: '170K' },
        { name: 'Ba Chỉ Heo Nướng Ngũ Vị', price: '132K' },
        { name: 'Sườn Que Nướng', price: '155K' },
        { name: 'Chân Gà Nướng Muối Ớt', price: '105K' },
        { name: 'Cánh Gà Nướng Muối Ớt', price: '130K' },
        { name: 'Ếch Nướng Muối Ớt', price: '145K' },
        { name: 'Tôm Nướng Muối Ớt', price: '150K' },
        { name: 'Mực Ướp Sate', price: '160K' },
        { name: 'Bạch Tuột Nướng', price: '155K' },
        { name: 'Cá Tầm Nướng', price: '162K' },
    ],

    ankem: [
        { name: 'Chả Ram Tôm Đất', price: '95K' },
        { name: 'Khoai Tây Chiên', price: '70K' },
        { name: 'Khoai Lang Kén', price: '70K' },
        { name: 'Salad Trộn Dầu Giấm', price: '95K' },
        { name: 'Kim Chi', price: '30K' },
        { name: 'Rau Thêm', price: '20K' },
        { name: 'Khăn Ướt', price: '2K' },
    ],

    com: [
        { name: 'Cơm Chiên Cao Nguyên', price: '140K' },
        { name: 'Cơm Chiên Hải Sản', price: '120K' },
        { name: 'Mì Xào Hải Sản', price: '132K' },
        { name: 'Mì Xào Bò', price: '135K' },
    ],

    lau: [
        { name: 'Lẩu Gà Lá É', price: '300K' },
        { name: 'Lẩu Hải Sản', price: '320K' },
        { name: 'Lẩu Cá Tầm', price: '320K' },
    ],

    laurai: [
        { name: 'Xúc Xích Đức Nướng', price: '20K' },
        { name: 'Ếch Chiên Nước Mắm', price: '155K' },
        { name: 'Cánh Gà Chiên Nước Mắm', price: '145K' },
        { name: 'Bò Lúc Lắc', price: '160K' },
    ],

    tralanh: [
        { name: 'Trà Vải Hạt Chia', price: '49K' },
        { name: 'Trà Dứa Đào', price: '49K' },
        { name: 'Trà Trái Cây Nhiệt Đới', price: '49K' },
        { name: 'Trà Đào Cam Sả', price: '44K' },
        { name: 'Trà Tắc Xí Muội', price: '44K' },
        { name: 'Trà Ổi Hồng', price: '44K' },
    ],

    tranong: [
        { name: 'Trà Hoa Cúc Táo Đỏ', price: '39K' },
        { name: 'Trà Thảo Mộc', price: '39K' },
        { name: 'Trà Gừng Táo Đỏ Mật Ong', price: '39K' },
        { name: 'Trà Chanh Nóng Hạt Chia', price: '37K' },
        { name: 'Trà Lipton Nóng', price: '37K' },
    ],

    soda: [
        { name: 'Soda Việt Quốc', price: '42K' },
        { name: 'Soda Chanh', price: '42K' },
        { name: 'Soda Blue', price: '42K' },
        { name: 'Soda Dâu Tây', price: '42K' },
        { name: 'Soda Đào', price: '42K' },
    ],

    nuoc: [
        { name: 'Coca Cola', price: '19K' },
        { name: 'Sprite', price: '19K' },
        { name: 'Sting', price: '19K' },
        { name: 'StrongBow', price: '34K' },
        { name: 'Nước Suối', price: '12K' },
    ],

    bia: [
        { name: 'Tiger Bạc', price: '28K' },
        { name: 'Tiger Nâu', price: '26K' },
        { name: 'Sài Gòn Xanh (Special)', price: '26K' },
        { name: 'Sài Gòn Chill', price: '27K' },
        { name: 'Sài Gòn Lager', price: '19K' },
        { name: 'Heineken Lùn', price: '27K' },
    ],

    ruou: [
        { name: 'Rượu Mơ Hương Đào (18%)', price: '160K' },
        { name: 'Rượu Mơ 300ml (29%)', price: '110K' },
        { name: 'Rượu Mơ 350ml (18%)', price: '130K' },
        { name: 'Rượu Mơ 500ml (18%)', price: '170K' },
        { name: 'Soju Mix Vị 360ml', price: '110K' },
        { name: 'Rượu Vang Classic 750ml', price: '190K' },
        { name: 'Rượu Vang Export 750ml', price: '210K' },
        { name: 'Rượu Táo Mèo 300ml (29%)', price: '110K' },
        { name: 'Rượu Mơ Ume (Classic)', price: '140K' },
        { name: 'Rượu Táo Mèo 350ml (18%)', price: '130K' },
    ],
};

const MENU_NOTES = {
    general: '* Giá đã bao gồm VAT. Menu có thể thay đổi theo mùa.',
    drinks: '* Giá đồ uống có thể thay đổi. Vui lòng hỏi nhân viên để biết thêm.',
    holiday: '* Tiệm áp dụng phụ thu lễ Tết 10% (Mùng 2 - Mùng 8 Âm lịch).',
};
