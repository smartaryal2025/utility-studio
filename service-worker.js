// BUMPED TO v2.2 FOR PATH UPDATE
const CACHE_NAME = 'utility-studio-v2.2';

// 1. Core assets to pre-cache immediately upon installation
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/master.css',
    '/assets/logo.png',
    '/assets/pdf.png',
    
    // Nepali Date Converter (Widget moved here)
    '/projects/date-converter/index.html',
    '/projects/date-converter/libs/script.js',
    '/projects/date-converter/libs/date-widget.js',

    // Image Tools
    '/projects/image-tools/index.html',
    '/projects/image-tools/libs/cropper.min.css',
    '/projects/image-tools/libs/cropper.min.js',
    '/projects/image-tools/libs/jszip.min.js',

    // PDF Tools
    '/projects/pdf-tools/index.html',
    '/projects/pdf-tools/libs/pdf-lib.min.js',
    '/projects/pdf-tools/libs/pdf.min.js',
    '/projects/pdf-tools/libs/Sortable.min.js',

    // QR & Barcode Tools
    '/projects/qr-tools/index.html',
    '/projects/qr-tools/libs/cropper.min.css',
    '/projects/qr-tools/libs/cropper.min.js',
    '/projects/qr-tools/libs/FileSaver.min.js',
    '/projects/qr-tools/libs/html5-qrcode.min.js',
    '/projects/qr-tools/libs/JsBarcode.all.min.js',
    '/projects/qr-tools/libs/qrcode.min.js',

    // Unicode Tools
    '/projects/uni-tools/index.html',
    '/projects/uni-tools/libs/mammoth.browser.min.js',
    '/projects/uni-tools/libs/script.js',

    // Media Studio (Video)
    '/projects/video-tools/index.html',
    '/projects/video-tools/libs/814.ffmpeg.js',
    '/projects/video-tools/libs/ffmpeg-core.js',
    '/projects/video-tools/libs/ffmpeg-core.wasm',
    '/projects/video-tools/libs/ffmpeg.js',
    '/projects/video-tools/libs/index.js',
    '/projects/video-tools/libs/download.js',
    '/projects/video-tools/libs/util.js'
];

// INSTALL: Cache all core assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Pre-caching offline assets');
                return cache.addAll(CORE_ASSETS);
            })
            .catch(err => console.error('[Service Worker] Precaching failed:', err))
    );
});

// ACTIVATE: Clean up old caches if the version number changes
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName.startsWith('utility-studio')) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// FETCH: "Cache First, fallback to Network" Strategy
self.addEventListener('fetch', (event) => {
    // Ignore external APIs, browser extensions, and the Unit Converter (Flutter has its own service worker)
    if (!event.request.url.startsWith(self.location.origin) || event.request.url.includes('/projects/unit-converter/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                console.warn('[Service Worker] Network request failed and no cache available for:', event.request.url);
            });
        })
    );
});