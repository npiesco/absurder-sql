// Service Worker for AbsurderSQL PWA
importScripts('/sw-assets.js');

const CACHE_NAME = 'absurdersql-v3';
const RUNTIME_CACHE = 'absurdersql-runtime-v3';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/db',
  '/db/query',
  '/db/schema',
  '/db/browse',
  '/worker-test',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  ...(self.__ABSURDER_PRECACHE || []),
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function navigationRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) ||
      (await caches.match('/')) ||
      new Response(
        '<html><body><h1>Offline</h1><p>The requested page has not been cached yet.</p></body></html>',
        { headers: { 'Content-Type': 'text/html' } },
      );
  }
}

// Fetch event - keep navigations fresh while making code, workers, and WASM
// available from the cache when the network disappears.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(navigationRequest(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});
