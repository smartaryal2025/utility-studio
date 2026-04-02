// Change this version number every time you update a file!
const CACHE_NAME = 'utility-studio-v4.1';

// The complete list of everything needed to run offline
const CORE_ASSETS = [
    // Root Files
    '/',
    '/index.html',
    '/manifest.json',
    '/404.html',
    
    // Global Assets (Crucial for Theme & Layout)
    '/assets/logo.png',
    '/assets/logo-192.png',
    '/assets/logo-512.png',
    '/assets/theme.js',
    '/assets/master.css',
    '/assets/master-light.css',
    '/assets/hub.css',
    '/assets/hub-light.css',

    // Date Converter
    '/projects/date-converter/index.html',
    '/projects/date-converter/libs/date-style.css',
    '/projects/date-converter/libs/date-widget.js',
    '/projects/date-converter/libs/script.js',

    // Image Tools
    '/projects/image-tools/index.html',
    '/projects/image-tools/libs/cropper.min.css',
    '/projects/image-tools/libs/cropper.min.js',
    '/projects/image-tools/libs/image-style.css',
    '/projects/image-tools/libs/jszip.min.js',

    // PDF Tools
    '/projects/pdf-tools/index.html',
    '/projects/pdf-tools/libs/pdf-lib.min.js',
    '/projects/pdf-tools/libs/pdf-style.css',
    '/projects/pdf-tools/libs/pdf.min.js',
    '/projects/pdf-tools/libs/Sortable.min.js',

    // QR Tools
    '/projects/qr-tools/index.html',
    '/projects/qr-tools/libs/cropper.min.css',
    '/projects/qr-tools/libs/cropper.min.js',
    '/projects/qr-tools/libs/FileSaver.min.js',
    '/projects/qr-tools/libs/html5-qrcode.min.js',
    '/projects/qr-tools/libs/JsBarcode.all.min.js',
    '/projects/qr-tools/libs/qr-style.css',
    '/projects/qr-tools/libs/qrcode.min.js',

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
    '/projects/video-tools/libs/video-style.css'
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
            // Return cached version if found
            if (cachedResponse) {
                // Fetch new version in background to update cache for next time
                fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                }).catch(() => { /* Ignore background fetch errors */ });
                
                return cachedResponse;
            }

            // If not in cache, fetch from network
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
            // Optional: Return an offline fallback page here if the network fails 
            // and the page isn't in the cache
            if (event.request.headers.get('accept').includes('text/html')) {
                return caches.match('/404.html'); // Ensure you have a 404/Offline page
            }
        })
    );
});
