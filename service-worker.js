const CACHE_NAME = 'utility-studio-v3.6';

// Core assets to pre-cache (Using root-relative paths for Clean URLs)
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/404.html',
    '/manifest.json',
    '/assets/master.css',
    '/assets/hub.css',
    '/assets/logo.png',
    '/assets/pdf.png',
    
    '/projects/date-converter/',
    '/projects/date-converter/index.html',
    '/projects/date-converter/libs/date-style.css',
    '/projects/date-converter/libs/script.js',
    '/projects/date-converter/libs/date-widget.js',

    '/projects/image-tools/',
    '/projects/image-tools/index.html',
    '/projects/image-tools/libs/image-style.css',
    '/projects/image-tools/libs/cropper.min.css',
    '/projects/image-tools/libs/cropper.min.js',
    '/projects/image-tools/libs/jszip.min.js',

    '/projects/pdf-tools/',
    '/projects/pdf-tools/index.html',
    '/projects/pdf-tools/libs/pdf-style.css',
    '/projects/pdf-tools/libs/pdf-lib.min.js',
    '/projects/pdf-tools/libs/pdf.min.js',
    '/projects/pdf-tools/libs/Sortable.min.js',

    '/projects/qr-tools/',
    '/projects/qr-tools/index.html',
    '/projects/qr-tools/libs/qr-style.css',
    '/projects/qr-tools/libs/cropper.min.css',
    '/projects/qr-tools/libs/cropper.min.js',
    '/projects/qr-tools/libs/FileSaver.min.js',
    '/projects/qr-tools/libs/html5-qrcode.min.js',
    '/projects/qr-tools/libs/JsBarcode.all.min.js',
    '/projects/qr-tools/libs/qrcode.min.js',

    '/projects/uni-tools/',
    '/projects/uni-tools/index.html',
    '/projects/uni-tools/libs/uni-style.css',
    '/projects/uni-tools/libs/mammoth.browser.min.js',
    '/projects/uni-tools/libs/script.js',

    '/projects/video-tools/',
    '/projects/video-tools/index.html',
    '/projects/video-tools/libs/video-style.css',
    '/projects/video-tools/libs/814.ffmpeg.js',
    '/projects/video-tools/libs/ffmpeg.js',
    '/projects/video-tools/libs/index.js',
    '/projects/video-tools/libs/download.js',
    '/projects/video-tools/libs/util.js'
];

self.addEventListener('install', (event) => {
    // Force the new service worker to activate immediately
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Fault-tolerant caching: Continues installing even if one file 404s
            return Promise.allSettled(
                CORE_ASSETS.map(asset => 
                    cache.add(asset).catch(err => console.warn(`[SW] Minor cache skip for ${asset}`, err))
                )
            );
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete any old versions of the cache to prevent trapped CSS/HTML
                    if (cacheName !== CACHE_NAME && cacheName.startsWith('utility-studio')) {
                        console.log('[SW] Clearing old cache version:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. BYPASS RULE: Ignore external APIs and the Flutter Unit Converter entirely
    if (!event.request.url.startsWith(self.location.origin) || url.pathname.includes('/projects/unit-converter/')) {
        return;
    }

    // 2. FFMPEG FALLBACK RULE: Try local first, fallback to CDN if missing (live deployment)
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
                    console.log('[SW] Local FFmpeg engine missing. Fetching from Cloud CDN...');
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

    // 3. GLOBAL STRATEGY: Network-First (Always get freshest code if online, fallback to cache if offline)
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Ensure we only cache valid responses
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // If network fails (user is offline), serve the cached version
                return caches.match(event.request);
            })
    );
});
