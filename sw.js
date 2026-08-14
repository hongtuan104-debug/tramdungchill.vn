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
const CACHE_NAME = 'tdc-v5';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/menu.html',
    '/blog.html',
    '/dist/style.min.css',
    '/dist/common.min.js',
    '/dist/index.min.js',
    '/dist/blog.min.js',
    '/dist/menu.min.js',
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
