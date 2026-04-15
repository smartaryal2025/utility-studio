// Change this version number every time you update a file!
const CACHE_NAME = 'utility-studio-v5.7';

// The complete list of everything needed to run offline
const CORE_ASSETS = [
    // Root Files
    '/',
    '/index.html',
    '/manifest.json',
    '/404.html',
    '/about.html',
    '/privacy.html',
    '/faq.html',
    
    // Global Assets (Crucial for Theme & Layout)
    '/assets/logo.png',
    '/assets/logo-192.png',
    '/assets/logo-512.png',
    '/assets/theme.js',
    '/assets/master.css',
    '/assets/hub.css',

    // Articles & Guides
    '/articles/index.html',
    '/articles/secure-offline-pdf-editing.html',
    '/articles/hidden-photo-data-privacy.html',
    '/articles/offline-nepali-date-converter.html',
    '/articles/offline-preeti-unicode-converter.html',
    '/articles/offline-qr-barcode-generator.html',
    '/articles/offline-video-media-converter.html',
    '/articles/offline-unit-converter.html',

    // Date Converter
    '/projects/date-converter/index.html',
    '/projects/date-converter/libs/date-style.css',
    '/projects/date-converter/libs/date-widget.js',
    '/projects/date-converter/libs/script.js',
    '/projects/date-converter/libs/date.js',
    '/projects/date-converter/libs/events/2082.json',
    '/projects/date-converter/libs/events/2083.json',

    // Image Tools
    '/projects/image-tools/index.html',
    '/projects/image-tools/libs/cropper.min.css',
    '/projects/image-tools/libs/cropper.min.js',
    '/projects/image-tools/libs/image-style.css',
    '/projects/image-tools/libs/jszip.min.js',
    '/projects/image-tools/libs/script.js',

    // PDF Tools
    '/projects/pdf-tools/index.html',
    '/projects/pdf-tools/libs/pdf-lib.min.js',
    '/projects/pdf-tools/libs/pdf-style.css',
    '/projects/pdf-tools/libs/pdf.min.js',
    '/projects/pdf-tools/libs/Sortable.min.js',
    '/projects/pdf-tools/libs/script.js',

    // QR Tools
    '/projects/qr-tools/index.html',
    '/projects/qr-tools/libs/cropper.min.css',
    '/projects/qr-tools/libs/cropper.min.js',
    '/projects/qr-tools/libs/FileSaver.min.js',
    '/projects/qr-tools/libs/html5-qrcode.min.js',
    '/projects/qr-tools/libs/JsBarcode.all.min.js',
    '/projects/qr-tools/libs/qr-style.css',
    '/projects/qr-tools/libs/qrcode.min.js',
    '/projects/qr-tools/libs/script.js',

    // Unicode Tools
    '/projects/uni-tools/index.html',
    '/projects/uni-tools/libs/mammoth.browser.min.js',
    '/projects/uni-tools/libs/script.js',
    '/projects/uni-tools/libs/uni-style.css',

    // Video Tools
    '/projects/video-tools/index.html',
    '/projects/video-tools/libs/814.ffmpeg.js',
    '/projects/video-tools/libs/download.js',
    '/projects/video-tools/libs/ffmpeg-core.js',
    '/projects/video-tools/libs/ffmpeg-core.wasm',
    '/projects/video-tools/libs/ffmpeg.js',
    '/projects/video-tools/libs/index.js',
    '/projects/video-tools/libs/util.js',
    '/projects/video-tools/libs/video-style.css',
    '/projects/video-tools/libs/script.js',

    // ---------------------------------------------
    // Unit Converter (Flutter Web App Assets)
    // ---------------------------------------------
    '/projects/unit-converter/index.html',
    '/projects/unit-converter/flutter.js',
    '/projects/unit-converter/main.dart.js',
    '/projects/unit-converter/manifest.json',
    '/projects/unit-converter/version.json',
    '/projects/unit-converter/favicon.png',
    
    // Flutter Asset Manifests
    '/projects/unit-converter/assets/AssetManifest.bin',
    '/projects/unit-converter/assets/AssetManifest.bin.json',
    '/projects/unit-converter/assets/AssetManifest.json',
    '/projects/unit-converter/assets/FontManifest.json',
    '/projects/unit-converter/assets/NOTICES',
    '/projects/unit-converter/assets/fonts/MaterialIcons-Regular.otf',
    '/projects/unit-converter/assets/packages/cupertino_icons/assets/CupertinoIcons.ttf',
    '/projects/unit-converter/assets/shaders/ink_sparkle.frag',
    
    // Flutter Image SVGs
    '/projects/unit-converter/assets/assets/Area.svg',
    '/projects/unit-converter/assets/assets/Date.svg',
    '/projects/unit-converter/assets/assets/DigitalStorage.svg',
    '/projects/unit-converter/assets/assets/Length.svg',
    '/projects/unit-converter/assets/assets/Speed.svg',
    '/projects/unit-converter/assets/assets/Temperature.svg',
    '/projects/unit-converter/assets/assets/Time.svg',
    '/projects/unit-converter/assets/assets/Volume.svg',
    '/projects/unit-converter/assets/assets/Weight.svg',
    
    // CanvasKit (WASM Engine for Flutter)
    '/projects/unit-converter/canvaskit/canvaskit.js',
    '/projects/unit-converter/canvaskit/canvaskit.wasm',
    '/projects/unit-converter/canvaskit/skwasm.js',
    '/projects/unit-converter/canvaskit/skwasm.wasm',
    '/projects/unit-converter/canvaskit/skwasm.worker.js',
    '/projects/unit-converter/canvaskit/chromium/canvaskit.js',
    '/projects/unit-converter/canvaskit/chromium/canvaskit.wasm',
    
    // Flutter Icons
    '/projects/unit-converter/icons/Icon-192.png',
    '/projects/unit-converter/icons/Icon-512.png',
    '/projects/unit-converter/icons/Icon-maskable-192.png',
    '/projects/unit-converter/icons/Icon-maskable-512.png'
];

// Install Event - Caches all core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache and saving assets');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event - Cleans up old caches from previous versions
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Stale-While-Revalidate Strategy
self.addEventListener('fetch', (event) => {
    // Only intercept GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                }).catch(() => { /* Ignore background fetch errors */ });
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
            });
        }).catch(() => {
            if (event.request.headers.get('accept').includes('text/html')) {
                return caches.match('/404.html');
            }
        })
    );
});