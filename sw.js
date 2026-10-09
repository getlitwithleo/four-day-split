/* Keeps Four-Day Split on the phone so it opens with no internet. Version: 20261008174419 */
const CACHE = 'four-day-split-20261008174419';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
/* The app page: open the saved copy right away, then quietly fetch a newer one for next time.
   A blocked network can answer with its own "site blocked" page, so only a response that is really
   this app replaces the saved copy. */
async function refreshPage(req) {
  try {
    const res = await fetch(req, { cache: 'no-store' });
    if (!res.ok || res.redirected) return;
    const text = await res.clone().text();
    if (text.indexOf('four-day-split-app') < 0) return;
    const c = await caches.open(CACHE);
    await c.put('./index.html', res);
  } catch (e) { /* offline or blocked: keep the saved copy */ }
}
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate' && url.origin === location.origin) {
    e.respondWith(caches.match('./index.html').then((hit) => {
      const update = refreshPage(req);
      if (hit) { e.waitUntil(update); return hit; }
      return fetch(req);
    }));
    return;
  }
  const same = url.origin === location.origin;
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!same && !fonts) return;
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => hit)));
});
