/* Cards Central service worker — minimal offline support for the PWA.
 *
 * Strategy:
 *   - Navigation requests: network-first, falling back to the cached app shell
 *     (so the app still opens offline once it has been visited).
 *   - Same-origin GET assets (JS/CSS/fonts/images): stale-while-revalidate.
 *
 * The cache version is bumped on each deploy by build-web.js so old assets are
 * cleaned up. Nothing here is app-specific beyond the base scope.
 */

const CACHE = 'cardscentral-20260715100152';
const BASE = '/cardscentral/qa/';
const APP_SHELL = BASE + 'index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([BASE, APP_SHELL])).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // App navigations → network first, fall back to cached shell (offline).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(APP_SHELL, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(APP_SHELL).then((r) => r || caches.match(BASE)))
    );
    return;
  }

  // Static assets → stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
