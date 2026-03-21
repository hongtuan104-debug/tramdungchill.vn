/**
 * THONG TIN QUAN - Tram Dung Chill
 * ===================================
 * Cap nhat thong tin quan tai day.
 * Khong can sua file nao khac!
 *
 * Huong dan:
 * - Doi so dien thoai: sua truong "phone" va "phoneDisplay"
 * - Doi gio mo cua: sua truong "open" va "close"
 * - Doi link mang xa hoi: sua trong phan "social"
 */

const SITE_CONFIG = {
    name: 'Trạm Dừng Chill',
    nameVi: 'Tiệm Nướng Trạm Dừng Chill',
    tagline: 'Nơi bạn vừa ăn nướng ngắm xe lửa, hoàng hôn và nhà lồng lên đèn lung linh',

    contact: {
        phone: '0989765070',
        phoneDisplay: '0989.765.070',
        zaloNumber: '0989765070',
    },

    address: {
        street: '111 Huỳnh Tấn Phát',
        ward: 'Phường 11',
        city: 'Đà Lạt',
        province: 'Lâm Đồng',
        country: 'VN',
        full: '111 Huỳnh Tấn Phát, P11, Đà Lạt',
    },

    hours: {
        open: '15:00',
        close: '23:00',
        display: '15:00 - 23:00 hàng ngày',
    },

    social: {
        facebook: 'https://www.facebook.com/tiemnuongtramdungchill',
        tiktok: 'https://www.tiktok.com/@tiemnuongtramdungchill',
        googleMaps: 'https://maps.app.goo.gl/LYKSGggSms2nwTWq7',
    },

    seo: {
        url: 'https://tramdungchill.vn',
        ogImage: 'https://tramdungchill.vn/assets/images/hero-sunset.jpg',
    },

    // Webhook dat ban - Dan URL Google Apps Script vao day
    // Xem huong dan: docs/SETUP-WEBHOOK.md
    webhookUrl: 'https://script.google.com/macros/s/AKfycbw3y1TpNm_mFkHtWqWXj9CVmMvQV_l7Hd1bOEh7NBE-prRnyNztHNHiQQqntvHOlSBG/exec',

    // Telegram Bot (de trong neu chua setup)
    telegram: {
        botToken: '',
        chatId: '',
    },

    googleMapsEmbed: 'https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=111+Huỳnh+Tấn+Phát,+Phường+11,+Đà+Lạt,+Lâm+Đồng&zoom=16&language=vi',
};
