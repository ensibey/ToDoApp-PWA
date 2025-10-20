self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('planner-cache').then(cache => {
      return cache.addAll([
        './index.html',
        './plans.html',
        './style.css',
        './renderer.js',
        './plans.js',
        './manifest.json'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
