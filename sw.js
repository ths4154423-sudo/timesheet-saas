// Service Worker ל"שעונית". אסטרטגיה: "רשת קודם, מטמון כגיבוי" (Network First).

const CACHE_VERSION = 'v1';
const CACHE_NAME = 'timesheet-saas-cache-' + CACHE_VERSION;

const CORE_ASSETS = [
  './',
  'index.html',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(CORE_ASSETS.map(async (url) => {
        try{ await cache.add(url); }
        catch(e){ console.warn('SW: לא הצלחתי לשמור במטמון:', url, e); }
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return; // לא נוגעים ב-Firebase/CDN חיצוניים

  event.respondWith(
    fetch(req)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return response;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('index.html')))
  );
});
