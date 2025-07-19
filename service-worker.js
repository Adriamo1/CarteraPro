// service-worker.js
const CACHE_NAME = 'cartera-pro-valpha-0.7.1.4';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/icon192.png',
  '/icon512.png',
  // Añade tus scripts si quieres cachearlos:
  '/js/app.js',
  '/version.json'
  // Añade widgets y vistas según vayas completando
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.url.endsWith('version.json')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
