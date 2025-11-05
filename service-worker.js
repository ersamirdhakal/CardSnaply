/**
 * Service Worker for Business Card Scanner PWA
 * Handles offline caching of static assets
 */

const CACHE_NAME = 'business-card-scanner-v1';

// Get base path dynamically
const basePath = self.location.pathname.substring(0, self.location.pathname.lastIndexOf('/') + 1);
const STATIC_ASSETS = [
    basePath || '/',
    basePath + 'index.html',
    basePath + 'app.js',
    basePath + 'contacts.js',
    basePath + 'vcard.js',
    basePath + 'qr.js',
    basePath + 'ocr.js',
    basePath + 'share.js',
    basePath + 'styles.css',
    basePath + 'manifest.json',
    // Tesseract.js local files for offline OCR
    basePath + 'tesseract/worker.min.js',
    basePath + 'tesseract/tesseract-core.wasm.js',
    basePath + 'tessdata/en.traineddata'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                // Skip waiting to activate immediately
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
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
        }).then(() => {
            // Claim clients to control pages immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Cache CDN resources for offline use (only jsQR and Tailwind now)
    // Tesseract.js v4 is loaded from CDN but we use local worker/core/lang files
    const cdnUrls = [
        'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js',
        'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',
        'https://cdn.tailwindcss.com'
    ];
    
    const isCdnResource = cdnUrls.some(url => event.request.url.startsWith(url));
    
    // Skip other cross-origin requests
    if (!event.request.url.startsWith(self.location.origin) && !isCdnResource) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // Otherwise fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response (response can only be used once)
                        const responseToCache = response.clone();

                        // Cache the response
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Network request failed, return offline page if available
                        return caches.match(basePath + 'index.html');
                    });
            })
    );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

