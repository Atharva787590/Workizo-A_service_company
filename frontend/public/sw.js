/**
 * UNNATI Service Worker
 * ---------------------
 * Offline-first static asset caching and network-first application data caching.
 * STRICT SECURITY: Never caches sensitive financial, payment, or auth credentials.
 */

const CACHE_NAME = 'unnati-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/logo.png',
  '/manifest.json',
];

// Sensitive endpoints that MUST NEVER be cached
const SENSITIVE_ENDPOINTS = [
  '/api/auth/',
  '/api/billing/',
  '/api/accounts/',
  '/api/ocr/',
  '/ws/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Non-fatal SW precache error:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Non-GET requests should always bypass cache
  if (request.method !== 'GET') {
    return;
  }

  // Strictly block sensitive endpoints from ever being cached
  const isSensitive = SENSITIVE_ENDPOINTS.some((ep) => url.pathname.startsWith(ep));
  if (isSensitive) {
    return;
  }

  // HTML navigation requests: Network-first with offline /index.html fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html').then((response) => {
          return response || new Response('Offline - UNNATI Cooperative App', {
            headers: { 'Content-Type': 'text/html' },
          });
        });
      })
    );
    return;
  }

  // Safe API GET requests: Network-first with cache fallback
  if (url.pathname.startsWith('/api/services/') || url.pathname.startsWith('/api/workers/dashboard-stats/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images): Cache-first with network fallback
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.origin.includes('fonts.googleapis.com') ||
    url.origin.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
  }
});
