/* usurp.games service worker: makes the games installable and quick to reopen.
   Pages are always fetched fresh from the network (a saved copy is used only when offline), versioned game files,
   fonts and images come from the cache. It never touches /api/ calls, ads, analytics or anything on other sites. */
const V = 'usurp-v1';
const OFFLINE = ['/games/', '/games/games.css', '/styles.css', '/studio.css', '/pages.css', '/icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(OFFLINE)).catch(() => {}).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/') || u.pathname.startsWith('/_vercel/')) return;
  if (r.mode === 'navigate') {                     // pages: network first, the saved copy when offline
    e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(ca => ca.put(r, c)); } return res; })
      .catch(() => caches.match(r).then(m => m || caches.match('/games/'))));
    return;
  }
  const fixed = u.search.includes('v=') || /^\/(fonts|img)\//.test(u.pathname) || /\.(woff2|webp|png|svg)$/.test(u.pathname) || u.pathname.startsWith('/games/vendor/');
  if (fixed) {                                     // versioned or unchanging files: cache first
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(ca => ca.put(r, c)); } return res; })));
    return;
  }
  e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(ca => ca.put(r, c)); } return res; }).catch(() => caches.match(r)));
});
