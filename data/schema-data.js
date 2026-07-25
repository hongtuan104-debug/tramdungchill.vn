/* Data: Schema.org - Tram Dung Chill */

const SCHEMA_DATA = {
    restaurant: {
        name: 'Tiệm Nướng Trạm Dừng Chill',
        alternateName: ['Tram Dung Chill BBQ', 'Tiệm Nướng & Chill Xóm Lèo', 'Xóm Lèo'],
        description: 'Quán nướng BBQ view đẹp nhất Đà Lạt - Ngắm xe lửa, hoàng hôn và nhà lồng lên đèn lung linh. Đặc biệt: setup sinh nhật, kỷ niệm miễn phí.',
        images: [
            'https://tramdungchill.vn/assets/images/hero-sunset.jpg',
            'https://tramdungchill.vn/assets/images/hero-night.jpg',
            'https://tramdungchill.vn/assets/images/hero-couple.jpg'
        ],
        url: 'https://tramdungchill.vn',
        telephone: '+84989765070',
        address: {
            street: '111 Huỳnh Tấn Phát',
            locality: 'Đà Lạt',
            region: 'Lâm Đồng',
            postalCode: '670000',
            country: 'VN'
        },
        geo: { latitude: 11.9542, longitude: 108.4946 },
        cuisine: ['Vietnamese BBQ', 'Korean BBQ', 'Hotpot', 'Grilled Seafood'],
        hours: { open: '15:00', close: '23:00' },
        priceRange: '₫95.000 - ₫300.000',
        currenciesAccepted: 'VND',
        paymentAccepted: 'Cash, Bank Transfer',
        rating: { value: '4.8', count: '6500', best: '5' },
        amenities: [
            { name: 'Sunset View', value: true },
            { name: 'Train View', value: true },
            { name: 'Birthday Setup', value: true },
            { name: 'Outdoor Seating', value: true }
        ],
        sameAs: [
            'https://www.facebook.com/tiemnuongtramdungchill',
            'https://www.instagram.com/tiemnuongtramdungchill/',
            'https://www.tiktok.com/@tiemnuongtramdungchill',
            'https://www.youtube.com/@TramDungChill',
            'https://www.threads.com/@tiemnuongtramdungchill',
            'https://maps.app.goo.gl/LYKSGggSms2nwTWq7'
        ]
    },
    faq: [
        {
            question: 'Quán nướng Trạm Dừng Chill ở đâu?',
            answer: 'Trạm Dừng Chill tọa lạc tại 111 Huỳnh Tấn Phát, Phường Xuân Trường - Đà Lạt, Lâm Đồng. Quán có view ngắm xe lửa, hoàng hôn và nhà lồng lên đèn.'
        },
        {
            question: 'Giờ mở cửa của Trạm Dừng Chill?',
            answer: 'Quán mở cửa từ 15:00 đến 23:00 hàng ngày, kể cả cuối tuần và ngày lễ.'
        },
        {
            question: 'Có đặt bàn trước được không?',
            answer: 'Có! Bạn có thể đặt bàn online trên website hoặc gọi hotline 0989.765.070. Xác nhận qua Zalo trong 15 phút. Đặt trước để được chọn vị trí view hoàng hôn hoặc nhà lồng đêm.'
        },
        {
            question: 'Quán có setup sinh nhật không?',
            answer: 'Có! Trạm Dừng Chill setup tiệc sinh nhật và kỷ niệm MIỄN PHÍ với hoa, nến, bảng chúc mừng. Liên hệ đặt trước qua Zalo.'
        },
        {
            question: 'Giá nướng BBQ tại Trạm Dừng Chill bao nhiêu?',
            answer: 'Giá từ 95.000đ đến 300.000đ/người, đã bao gồm VAT. Menu gồm nướng BBQ, lẩu, hải sản và đồ uống.'
        },
        {
            question: 'Where is Tram Dung Chill BBQ in Da Lat?',
            answer: 'Tram Dung Chill is located at 111 Huynh Tan Phat, Xuan Truong Ward, Da Lat City. The restaurant offers unique views of the Da Lat railway, sunset over the valley, and thousands of glowing greenhouses at night.'
        }
    ],
    // Review THẬT — đồng bộ đúng với các review đang hiển thị trên index.html
    // (guideline Google: structured data review phải khớp nội dung hiển thị).
    reviews: [
        {
            author: 'Quyên Quyên',
            rating: '5',
            body: 'Đầu tiên nói về phục vụ, dù quán rất đông khách nhưng nhân viên cực kỳ chu đáo. Mấy bạn siêu nhiệt tình, mình rất ấn tượng. Cái bò phô mai siêu ngon, recommend mọi người lần đầu đến thì nên gọi.'
        },
        {
            author: 'Phương Mai Lưu',
            rating: '5',
            body: 'Mình ăn nhiều quán ở Xóm Lèo rồi nhưng đánh giá quán này vẫn là OK nhất. Đồ ăn ngon, giá hợp lý, nhân viên nhiệt tình. Sẽ quay lại lần nữa!'
        },
        {
            author: 'Trung Nguyễn Chí',
            rating: '5',
            body: 'Đồ ăn ngon, nhân viên phục vụ tốt. Nên thử bò tảng sốt trứng muối. Trời mưa tiệm còn phát áo mưa đi về nữa, quá dễ thương.'
        },
        {
            author: 'Jeremy',
            rating: '5',
            body: 'The staff were so helpful even though we didn\'t have a reservation. Food was great and would come again with the family. Highly recommended!'
        }
    ]
};
