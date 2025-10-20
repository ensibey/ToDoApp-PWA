/**
 * Planner Pro - Service Worker
 * Çevrimdışı çalışma ve önbellekleme desteği sağlar
 */

const CACHE_NAME = 'planner-pro-v1.0.0';
const urlsToCache = [
  './',
  './index.html',
  './plans.html',
  './style.css',
  './renderer.js',
  './plans.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Kurulum olayı
self.addEventListener('install', event => {
  console.log('Service Worker: Kurulum başlatıldı');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Dosyalar önbelleğe alınıyor');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Kurulum tamamlandı');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Kurulum hatası:', error);
      })
  );
});

// Aktivasyon olayı
self.addEventListener('activate', event => {
  console.log('Service Worker: Aktivasyon başlatıldı');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Eski önbellek temizleniyor:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Aktivasyon tamamlandı');
      return self.clients.claim();
    })
  );
});

// Fetch olayı
self.addEventListener('fetch', event => {
  // Yalnızca GET isteklerini işle
  if (event.request.method !== 'GET') return;
  
  // Harici kaynaklar için ağ öncelikli strateji
  if (event.request.url.startsWith('http') && !event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Başarılı yanıtı önbelleğe al
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          // Ağ hatasında önbellekten getir
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Yerel kaynaklar için önbellek öncelikli strateji
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Önbellekte bulunursa döndür
        if (response) {
          return response;
        }
        
        // Ağdan getir ve önbelleğe al
        return fetch(event.request)
          .then(response => {
            // Geçerli yanıt kontrolü
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Yanıtı klonla (stream sadece bir kez okunabilir)
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('Service Worker: Fetch hatası:', error);
            // Önbellekte yoksa ve ağ da yoksa fallback döndür
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Mesaj işleme
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});