// BUMPED TO v3.1 TO FORCE CLEAR OLD CACHED DASHBOARD
const CACHE_NAME = 'utility-studio-v3.1';

const CORE_ASSETS = [
    '/',
    '/index.html',
    '/404.html',
    '/manifest.json',
    '/assets/master.css',
    '/assets/logo.png',
    '/assets/pdf.png',
    
    '/projects/date-converter/index.html',
    '/projects/date-converter/libs/date-style.css',
    '/projects/date-converter/libs/script.js',
    '/projects/date-converter/libs/date-widget.js',

    '/projects/image-tools/index.html',
    '/projects/image-tools/libs/image-style.css',
    '/projects/image-tools/libs/cropper.min.css',
    '/projects/image-tools/libs/cropper.min.js',
    '/projects/image-tools/libs/jszip.min.js',

    '/projects/pdf-tools/index.html',
    '/projects/pdf-tools/libs/pdf-style.css',
    '/projects/pdf-tools/libs/pdf-lib.min.js',
    '/projects/pdf-tools/libs/pdf.min.js',
    '/projects/pdf-tools/libs/Sortable.min.js',

    '/projects/qr-tools/index.html',
    '/projects/qr-tools/libs/qr-style.css',
    '/projects/qr-tools/libs/cropper.min.css',
    '/projects/qr-tools/libs/cropper.min.js',
    '/projects/qr-tools/libs/FileSaver.min.js',
    '/projects/qr-tools/libs/html5-qrcode.min.js',
    '/projects/qr-tools/libs/JsBarcode.all.min.js',
    '/projects/qr-tools/libs/qrcode.min.js',

    '/projects/uni-tools/index.html',
    '/projects/uni-tools/libs/uni-style.css',
    '/projects/uni-tools/libs/mammoth.browser.min.js',
    '/projects/uni-tools/libs/script.js',

    '/projects/video-tools/index.html',
    '/projects/video-tools/libs/video-style.css',
    '/projects/video-tools/libs/814.ffmpeg.js',
    '/projects/video-tools/libs/ffmpeg.js',
    '/projects/video-tools/libs/index.js',
    '/projects/video-tools/libs/download.js',
    '/projects/video-tools/libs/util.js'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => Promise.all(
            cacheNames.map((name) => {
                if (name !== CACHE_NAME && name.startsWith('utility-studio')) {
                    console.log('[Service Worker] Clearing old cache:', name);
                    return caches.delete(name);
                }
            })
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (!event.request.url.startsWith(self.location.origin) || event.request.url.includes('/projects/unit-converter/')) {
        return;
    }

    if (url.pathname.endsWith('ffmpeg-core.js') || url.pathname.endsWith('ffmpeg-core.wasm')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then((networkResponse) => {
                    if (!networkResponse || !networkResponse.ok) throw new Error('Local file missing');
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                    return networkResponse;
                }).catch(() => {
                    const fileName = url.pathname.split('/').pop();
                    const cdnUrl = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.4/dist/umd/${fileName}`;
                    return fetch(cdnUrl).then(cdnResponse => {
                        if(cdnResponse && cdnResponse.status === 200) {
                            const responseToCache = cdnResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                        }
                        return cdnResponse;
                    });
                });
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') return networkResponse;
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                return networkResponse;
            });
        })
    );
});