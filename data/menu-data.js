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
    { id: 'nuong', label: 'Nướng Tại Bàn' },
    { id: 'laurai', label: 'Món Lai Rai' },
    { id: 'lau', label: 'Lẩu' },
    { id: 'com', label: 'No Cái Bụng' },
    { id: 'ankem', label: 'Ăn Kèm' },
    { id: 'douong', label: 'Đồ Uống' },
];

const MENU_ITEMS = {
    bestseller: [
        { name: 'Bò Tảng Nướng Phô Mai Trứng Muối', price: '199K', badge: 'Best' },
        { name: 'Ba Chỉ Bò Cuộn Kim Châm', price: '127K' },
        { name: 'Ba Chỉ Bò Nướng Muối Tiêu', price: '150K' },
        { name: 'Ốc Nhồi Thịt', price: '165K' },
        { name: 'Sườn Cay Thái Lan', price: '250K', badge: 'Hot' },
        { name: 'Cá Tầm Lúc Lắc', price: '157K' },
    ],

    nuong: [
        { name: 'Ba Chỉ Heo Nướng Ngũ Vị', price: '122K' },
        { name: 'Ba Chỉ Heo Hàn Quốc', price: '160K' },
        { name: 'Sườn Que Nướng', price: '145K' },
        { name: 'Chân Gà Nướng Muối Ớt', price: '95K' },
        { name: 'Cánh Gà Nướng Muối Ớt', price: '125K' },
        { name: 'Ếch Nướng Muối Ớt', price: '135K' },
        { name: 'Tôm Nướng Muối Ớt', price: '140K' },
        { name: 'Mực Ướp Sate', price: '155K' },
        { name: 'Cá Tầm Nướng', price: '157K' },
        { name: 'Bạch Tuột Nướng', price: '150K' },
        { name: 'Vây Cá Hồi Nướng Muối Ớt', price: '125K' },
    ],

    laurai: [
        { name: 'Tôm Chiên Trứng Muối', price: '150K' },
        { name: 'Ếch Chiên Nước Mắm', price: '150K' },
        { name: 'Cánh Gà Chiên Nước Mắm', price: '140K' },
        { name: 'Bò Lúc Lắc', price: '155K' },
    ],

    lau: [
        { name: 'Lẩu Gà Lá É', price: '260K' },
        { name: 'Lẩu Hải Sản', price: '300K' },
        { name: 'Lẩu Cá Tầm', price: '300K' },
    ],

    com: [
        { name: 'Mì Xào Hải Sản', price: '127K' },
        { name: 'Mì Xào Bò', price: '130K' },
        { name: 'Cơm Chiên Cao Nguyên', price: '135K' },
        { name: 'Cơm Chiên Hải Sản', price: '110K' },
    ],

    ankem: [
        { name: 'Chả Ram Tôm Đất', price: '95K' },
        { name: 'Khoai Tây Chiên', price: '65K' },
        { name: 'Khoai Lang Kén', price: '65K' },
        { name: 'Salad Trộn Dầu Giấm', price: '85K' },
        { name: 'Xúc Xích Đức', price: '15K' },
        { name: 'Kim Chi', price: '30K' },
        { name: 'Rau Thêm', price: '20K' },
    ],

    douong: [
        { name: 'Coca Cola / Pepsi / 7Up', price: '20K' },
        { name: 'Nước suối', price: '10K' },
        { name: 'Bia Tiger / Heineken', price: '25K' },
        { name: 'Bia Sài Gòn', price: '20K' },
        { name: 'Trà đào cam sả', price: '39K' },
        { name: 'Trà vải', price: '39K' },
        { name: 'Nước ép cam / dưa hấu', price: '35K' },
        { name: 'Sữa đậu nành', price: '25K' },
    ],
};

const MENU_NOTES = {
    general: '* Giá đã bao gồm VAT. Menu có thể thay đổi theo mùa.',
    drinks: '* Giá đồ uống có thể thay đổi. Vui lòng hỏi nhân viên để biết thêm.',
};
