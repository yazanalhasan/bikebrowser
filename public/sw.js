const APP_VERSION = '1.0.5';
const SHELL_CACHE = `bikebrowser-shell-${APP_VERSION}`;
const ASSET_CACHE = `bikebrowser-assets-${APP_VERSION}`;
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isHashedAsset(url) {
  return /^\/assets\/.+-[A-Za-z0-9_-]+\.(?:js|mjs|css|wasm|png|jpg|jpeg|webp|svg)$/.test(url.pathname);
}

async function putIfOk(cacheName, request, response) {
  if (!response || !response.ok) {
    return;
  }
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL_CACHE, ASSET_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => (keep.has(key) ? null : caches.delete(key)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isApiRequest(url)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          await putIfOk(SHELL_CACHE, request, response);
          return response;
        })
        .catch(async () => (
          caches.match(request)
          || caches.match('/')
          || caches.match('/offline.html')
        ))
    );
    return;
  }

  if (isHashedAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then(async (response) => {
          await putIfOk(ASSET_CACHE, request, response);
          return response;
        });
      })
    );
  }
});
