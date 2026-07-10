// IPO Pool — Service Worker.
// Strategy: network-first for app files and CDN libs (so deploys reach users
// without bumping this version), cache fallback for offline, and network-only
// for Supabase API calls (so reads are never served stale after writes).
const CACHE = 'ipo-pool-v35';

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

  // CDN libraries we depend on (React, Babel, the Supabase client, fonts).
  // These are safe to cache for offline use.
  const isCDN = url.includes('unpkg.com') || url.includes('cdn.jsdelivr.net')
             || url.includes('fonts.googleapis') || url.includes('fonts.gstatic');
  const isSameOrigin = new URL(url).origin === self.location.origin;

  // Supabase (and any other cross-origin API): network-only, never cached,
  // otherwise reads would be served stale after writes.
  if (!isCDN && !isSameOrigin) return;

  // App files and CDN libs: network-first so a deploy is picked up on the next
  // load without bumping CACHE; fall back to cache when offline.
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
  );
});
