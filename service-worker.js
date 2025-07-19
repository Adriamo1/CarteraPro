// service-worker.js
const CACHE_NAME = 'cartera-pro-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/icon192.png',
  '/icon512.png',
  // Añade tus scripts si quieres cachearlos:
  '/js/app.js',
  '/js/core.js',
  '/js/db.js',
  '/js/settings.js',
  '/js/dashboard.js',
  // Añade widgets y vistas según vayas completando
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
