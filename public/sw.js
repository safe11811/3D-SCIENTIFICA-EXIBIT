/*
 * Scientifica offline-first service worker.
 *
 * Exhibition-day reality: hundreds of phones on strained school Wi-Fi.
 * Strategy:
 *  - Pre-cache the app shell (index.html) at install.
 *  - Serve same-origin GET requests cache-first; fill the cache as assets
 *    are fetched, so the second visit — and every visit after the network
 *    collapses — works entirely offline.
 */
const CACHE_NAME = 'scientifica-2026-v3';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/logo.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let fonts/CDNs hit the network

  // For HTML document navigation, do Network-First so updates take effect immediately,
  // falling back to cache when offline on school grounds.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  // For static hashed assets (JS, CSS, images), do Cache-First with Network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => Response.error());
    })
  );
});
