/* Service Worker — Tram Dung Chill
   Cache-first for static assets, network-first for HTML */

// Đổi tên cache mỗi khi JS/CSS dùng chung thay đổi kiểu "phải có bản mới mới
// đúng". JS/CSS chạy cache-first, giữ nguyên tên là máy khách cũ còn dùng bản
// cũ thêm nhiều lượt ghé. v2: footer dùng chung cho mọi trang (30/07/2026).
// v3: menu ảnh lật trang — đổi common.min.js, menu.min.js và style.min.css (04/08/2026).
// v4: dọn ảnh menu cũ còn kẹt trong cache sau khi thay trang 01 và 10 (07/08/2026).
//     Từ nay ảnh menu mang vân tay ?v= trong URL nên đổi ảnh không cần bump nữa —
//     bump lần này là để xoá bản đã kẹt ở máy khách từ trước khi có vân tay.
// v5: mục lục nhảy trang trong bài blog — style.min.css có thêm khối .toc
//     (12/08/2026). Bài blog nạp CSS kèm ?v=<md5> nên trình duyệt tự tải lại,
//     nhưng service worker giữ '/dist/style.min.css' KHÔNG query ở nhánh
//     cache-first, lớp đó chỉ chịu buông khi tên cache đổi.
// v6: trang chu bo bang gia dang tab, thay bang khoi xem truoc quyen menu anh
//     (24/08/2026) — doi style.min.css, common.min.js va index.min.js.
// v7: phông lót khớp số đo chặn CLS — style.min.css có thêm 3 @font-face
//     Fallback và font stack đổi (29/08/2026). Lớp cache-first giữ
//     '/dist/style.min.css' không query nên phải đổi tên cache mới buông.
// v8: bo cac so do layout thay vi doc offsetTop/scrollHeight moi khung hinh cuon
//     (29/08/2026) — doi common.min.js va index.min.js. Hai file nay KHONG mang
//     van tay ?v= trong URL nen doi ten cache la cach duy nhat de khach cu nhan.
// v10: danh sach precache tu 14 muc (600 KB, do that 31/08/2026) xuong 3 muc
//      (137 KB), va js/app.js hoan dang ky SW toi sau 'load'.
//      Ba khoan lang phi thuan cua ban cu:
//        - '/' va '/index.html' la HAI URL khac nhau nhung CUNG mot noi dung
//          -> tai trang 134 KB hai lan.
//        - '/dist/style.min.css' KHONG mang van tay ?v=, ma bo xu ly fetch duoi
//          day khop URL chinh xac (caches.match(event.request)) -> ban cache nay
//          khong bao gio duoc dung. 91 KB tai xong vut di.
//        - menu.html + blog.html + 2 bundle rieng cua chung = 155 KB cua trang
//          khach chua chac ghe.
//      Nhung thu bo di khong mat gi: bo xu ly fetch ben duoi VAN tu cache lai
//      moi file khi khach thuc su tai no, nen sau lan ghe dau la day du nhu cu.
//      Chi giu lai dung phan lam "vo offline": index.html cho nhanh du phong
//      caches.match('/index.html'), manifest va favicon cho PWA.
// v11: (1) 3 commit sau v10 (9a3aa2f, 22b3361, d379415) đổi dist/common.min.js
//      và dist/index.min.js mà quên bump — vi phạm quy tắc trong CLAUDE.md, khách
//      cũ bị dính bundle cũ thêm một lượt ghé vì nhánh JS/CSS là cache-first.
//      (2) Trả 5 file nhỏ không mang vân tay vào precache: bản v10 cắt hết khiến
//      offline-sau-một-lượt-ghé tệ hơn v9 (SW chưa điều khiển trang ở lượt đầu
//      nên runtime cache chưa có gì; HTML mở được mà không có JS/data).
//      style.min.css KHÔNG precache được: URL thật mang ?v=<md5> mà SW không biết,
//      cache bản trần chỉ phí 91 KB (bài học v9).
const CACHE_NAME = 'tdc-v12';
const STATIC_ASSETS = [
    '/index.html',
    '/dist/common.min.js',
    '/dist/index.min.js',
    '/data/site-config.js',
    '/data/translations.js',
    '/data/schema-data.js',
    '/manifest.json',
    '/assets/images/favicon.svg'
];

// Install: pre-cache critical assets
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(k) { return k !== CACHE_NAME; })
                    .map(function(k) { return caches.delete(k); })
            );
        })
    );
    self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', function(event) {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip external requests (analytics, fonts CDN, etc.)
    if (url.origin !== self.location.origin) return;

    // HTML pages: network-first (always get latest)
    if (event.request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(event.request).then(function(response) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request, clone);
                });
                return response;
            }).catch(function() {
                return caches.match(event.request).then(function(cached) {
                    return cached || caches.match('/index.html');
                });
            })
        );
        return;
    }

    // Images: cache-first with long TTL
    if (url.pathname.startsWith('/assets/images/')) {
        event.respondWith(
            caches.match(event.request).then(function(cached) {
                if (cached) return cached;
                return fetch(event.request).then(function(response) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, clone);
                    });
                    return response;
                });
            })
        );
        return;
    }

    // JS/CSS/data: cache-first, update in background
    event.respondWith(
        caches.match(event.request).then(function(cached) {
            const fetchPromise = fetch(event.request).then(function(response) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request, clone);
                });
                return response;
            });
            return cached || fetchPromise;
        })
    );
});
