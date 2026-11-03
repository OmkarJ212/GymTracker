const CACHE_NAME = 'iron-log-v13';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './css/styles.css?v=3.4',
  './js/data.js',
  './js/data.js?v=3.4',
  './js/storage.js',
  './js/storage.js?v=3.4',
  './js/sheets.js',
  './js/sheets.js?v=3.4',
  './js/views.js',
  './js/views.js?v=3.4',
  './js/app.js',
  './js/app.js?v=3.4',
  './manifest.json',
  './icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Do not intercept external / third-party requests (e.g. YouTube embeds)
  if (!e.request.url.startsWith(self.location.origin)) return;

  // For HTML documents, fetch from network first so updates are discovered, with cache fallback
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response && response.status === 200) {
            var copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
    return;
  }

  // Exact cache match first for speed & reliability, falling back to network fetch + cache update,
  // or ignoreSearch cache fallback when offline.
  e.respondWith(
    caches.match(e.request).then((exactMatch) => {
      if (exactMatch) {
        // Stale-While-Revalidate: serve cached immediately, update in background
        fetch(e.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              var copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
            }
          })
          .catch(() => {});
        return exactMatch;
      }

      // If not in cache (e.g. a new version query param), fetch from network
      return fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            var responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(e.request, { ignoreSearch: true }));
    })
  );
});
