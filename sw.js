const CACHE_NAME = 'timbrature-v8';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './manifest.json',
    './config.js',
    './assets/logo-v2.png',
    './js/utils.js',
    './js/supabase-client.js',
    './js/database.js',
    './js/excel-export.js',
    './js/employee-login.js',
    './js/employee-tracking.js',
    './js/admin-login.js',
    './js/admin-dashboard.js',
    './js/router.js'
];

// Installazione Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching assets...');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Attivazione Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Cancellazione vecchia cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Gestione richieste (Fetch) - Strategia: Cache First with Network Fallback
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Se è in cache, restituisci; altrimenti prova con il network
                return response || fetch(event.request).catch(() => {
                    // Fallback se anche il network fallisce (opzionale: potresti restituire una pagina offline)
                    console.log('Fetch failed, returning offline fallback if available');
                });
            })
    );
});

