/* Network-first for page navigations, with the last good copy as an offline fallback.
   Pages always come fresh from the network, so a deploy shows up on the next visit. */
const CACHE = 'greenline-v4';

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    const old = keys.filter((k) => k !== CACHE);
    await Promise.all(old.map((k) => caches.delete(k)));
    await self.clients.claim();
    /* Upgrading from an older worker that served cached pages first: reload open tabs once
       so nobody is left looking at the previous version of the site. */
    if (old.length) {
      const tabs = await self.clients.matchAll({ type: 'window' });
      tabs.forEach((t) => { if (t.url && 'navigate' in t) t.navigate(t.url).catch(() => {}); });
    }
  })());
});

self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  if (new URL(e.request.url).pathname.startsWith('/admin')) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request);
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      return (await caches.match(e.request)) || (await caches.match('/')) || Response.error();
    }
  })());
});
