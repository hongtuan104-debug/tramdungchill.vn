# Hướng Dẫn Cập Nhật Website - Trạm Dừng Chill

## Cập nhật giá / thêm món / xóa món

Mở file: `data/menu-data.js`

### Đổi giá:
Tìm tên món, sửa số sau `price:`:
```
{ name: 'Bò Tảng Nướng Phô Mai Trứng Muối', price: '199K' },
                                                       ^^^^ đổi số này
```

### Thêm món mới:
Copy 1 dòng, paste bên dưới, sửa tên + giá:
```
{ name: 'Tên Món Mới', price: '100K' },
```

Thêm badge (Best/Hot/New):
```
{ name: 'Tên Món Mới', price: '100K', badge: 'New' },
```

### Xóa món:
Xóa cả dòng chứa món đó.

### Thêm danh mục mới:
Trong `MENU_CATEGORIES`, thêm 1 dòng:
```
{ id: 'tenmoi', label: 'Tên Hiển Thị' },
```
Trong `MENU_ITEMS`, thêm:
```
tenmoi: [
    { name: 'Món 1', price: '100K' },
    { name: 'Món 2', price: '150K' },
],
```

---

## Cập nhật thông tin liên hệ

Mở file: `data/site-config.js`

### Đổi số điện thoại:
```
contact: {
    phone: '0989765070',        ← đổi số này
    phoneDisplay: '0989.765.070', ← đổi cách hiển thị
    zaloNumber: '0989765070',    ← đổi số Zalo
},
```

### Đổi giờ mở cửa:
```
hours: {
    open: '15:00',
    close: '23:00',
    display: '15:00 - 23:00 hàng ngày',
},
```

### Đổi link mạng xã hội:
```
social: {
    facebook: 'https://www.facebook.com/...',
    tiktok: 'https://www.tiktok.com/@...',
    googleMaps: 'https://maps.app.goo.gl/...',
},
```

---

## Cấu trúc thư mục

```
tiem-nuong-tram-dung-chill/
  index.html          ← Trang chính (ít khi cần sửa)
  data/
    site-config.js    ← Thông tin quán (SĐT, giờ, link)
    menu-data.js      ← Thực đơn + giá (SỬA Ở ĐÂY)
  css/                ← Giao diện (không cần sửa)
  js/                 ← Chức năng (không cần sửa)
  assets/images/      ← Hình ảnh
  docs/               ← Tài liệu
```

---

## Thay đổi hình ảnh

1. Đặt ảnh mới vào `assets/images/`
2. Đặt tên file giống file cũ (ví dụ: `hero-sunset.jpg`)
3. Ảnh sẽ tự động cập nhật

---

## Lưu ý quan trọng

- Sau khi sửa, **lưu file** rồi **refresh trình duyệt** (Ctrl+F5) để thấy thay đổi
- Nếu website bị lỗi sau khi sửa, kiểm tra lại file vừa sửa — có thể thiếu dấu phẩy `,` hoặc ngoặc `}`
- Không sửa các file trong thư mục `css/` và `js/` nếu không biết code
