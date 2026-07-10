// IPO Pool — Service Worker (cache-first for app assets, network-first for CDN)
const CACHE = 'ipo-pool-v34';

const APP_ASSETS = [
  './',
  './index.html',
  './src/tokens.css',
  './src/supabase-client.js',
  './src/db.js',
  './src/tweaks-panel.jsx',
  './src/charts.jsx',
  './src/components.jsx',
  './src/screens-auth.jsx',
  './src/screens-dashboard.jsx',
  './src/screens-ipo.jsx',
  './src/screens-pool.jsx',
  './src/screens-settle.jsx',
  './src/screens-manage.jsx',
  './src/screens-settings.jsx',
  './src/app.jsx',
  './icon.svg',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(APP_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;

  const isCDN = url.includes('unpkg.com') || url.includes('fonts.googleapis') || url.includes('fonts.gstatic');

  // Never cache cross-origin API calls (Supabase) — always hit the network,
  // otherwise reads are served stale after writes.
  if (!isCDN && new URL(url).origin !== self.location.origin) return;

  // Network-first for CDN scripts (React, Babel, Google Fonts) — fallback to cache
  if (isCDN) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for all app files
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
