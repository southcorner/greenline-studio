const CACHE_NAME = 'greenline-v3';
const PAGES = ['/', '/services'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function(c) { return c.addAll(PAGES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(
      keys.filter(function(k) { return k !== CACHE_NAME; })
          .map(function(k) { return caches.delete(k); })
    );
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(e.request).then(function(cached) {
        // Fetch by URL — avoids "navigate mode" restrictions on re-fetching e.request
        var networkFetch = fetch(e.request.url).then(function(res) {
          if (res && res.status === 200) cache.put(e.request, res.clone());
          return res;
        });
        if (cached) {
          // Serve cache instantly; update in background, silencing background failures
          networkFetch.catch(function() {});
          return cached;
        }
        // No cache yet — go to network; let errors propagate (no silent swallow)
        return networkFetch;
      });
    })
  );
});
