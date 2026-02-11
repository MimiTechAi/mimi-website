/**
 * MIMI PWA - Service Worker
 * Gemäß Lastenheft §3.2 - Offline-Capability
 * 
 * Ermöglicht vollständige Offline-Nutzung der /mimi Route
 */

const CACHE_NAME = 'mimi-pwa-v1';
const STATIC_CACHE = 'mimi-static-v1';

// Assets die beim Install gecacht werden
const PRECACHE_ASSETS = [
    '/mimi',
    '/icon.svg'
];

// Install Event - Statische Assets cachen
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Precaching assets...');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                // Sofort aktivieren
                return self.skipWaiting();
            })
    );
});

// Activate Event - Alte Caches löschen
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                // Sofort für alle Clients übernehmen
                return self.clients.claim();
            })
    );
});

// Fetch Event - Caching-Strategien
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Nur Same-Origin Requests behandeln
    if (url.origin !== location.origin) {
        return;
    }

    // /mimi Route - Network first, dann Cache
    if (url.pathname.startsWith('/mimi')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Response klonen und cachen
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clonedResponse);
                    });
                    return response;
                })
                .catch(() => {
                    // Offline - aus Cache laden
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Fallback zur Hauptseite
                        return caches.match('/mimi');
                    });
                })
        );
        return;
    }

    // Statische Assets - Cache first
    if (
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'image' ||
        request.destination === 'font'
    ) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    // Im Hintergrund aktualisieren (stale-while-revalidate)
                    fetch(request).then((response) => {
                        caches.open(STATIC_CACHE).then((cache) => {
                            cache.put(request, response);
                        });
                    });
                    return cachedResponse;
                }

                return fetch(request).then((response) => {
                    const clonedResponse = response.clone();
                    caches.open(STATIC_CACHE).then((cache) => {
                        cache.put(request, clonedResponse);
                    });
                    return response;
                });
            })
        );
        return;
    }

    // Alle anderen Requests - Network only
    event.respondWith(fetch(request));
});

// Message Handler für manuelle Cache-Kontrolle
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
        });
    }
});

console.log('[SW] MIMI Service Worker loaded');
