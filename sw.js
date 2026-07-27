// IPO Pool — Service Worker.
// Strategy: network-first for app files and CDN libs (so deploys reach users
// without bumping this version), cache fallback for offline, and network-only
// for Supabase API calls (so reads are never served stale after writes).
const CACHE = 'ipo-pool-v37';

const APP_ASSETS = [
  './',
  './index.html',
  './src/tokens.css',
  './src/supabase-client.js',
  './src/qrcode.js',
  './src/db.js',
  './src/tweaks-panel.jsx',
  './src/charts.jsx',
  './src/components.jsx',
  './src/screens-auth.jsx',
  './src/screens-member.jsx',
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
    // Cache assets individually: cache.addAll is atomic, so a single missing or
    // renamed file (e.g. a script added in a deploy that hasn't fully propagated)
    // would abort the whole install and leave the old, possibly broken, worker in
    // control. allSettled installs whatever it can and always moves forward.
    caches.open(CACHE)
      .then(cache => Promise.allSettled(APP_ASSETS.map(a => cache.add(a))))
      .then(() => self.skipWaiting())
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
      .catch(() => caches.match(e.request).then(c => {
        if (c) return c;
        // Only a page navigation may fall back to the app shell. A failed
        // SUB-RESOURCE (script, style, image) must NOT be answered with
        // index.html — doing so serves HTML where JavaScript is expected, which
        // Babel rejects with "Unexpected token <", leaving components undefined
        // and the whole page blank. Fail honestly instead so the error is real
        // and the error boundary can offer a recovery.
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      }))
  );
});
