const CACHE_NAME = 'cashflow-v1.0.3';
const urlsToCache = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/web-app-manifest-192x192.png', 
  '/web-app-manifest-512x512.png'
];

// Skip caching untuk external resources
const dontCache = [
  'https://www.gstatic.com/firebasejs/',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/',
  'https://fonts.googleapis.com'
];

self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  self.skipWaiting(); // Aktifkan segera
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('Cache install failed:', error);
      })
  );
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external resources yang tidak perlu di-cache
  const requestUrl = event.request.url;
  if (dontCache.some(url => requestUrl.includes(url))) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version
        if (response) {
          return response;
        }

        // Clone request karena body hanya bisa digunakan sekali
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Check jika response valid
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response karena body hanya bisa digunakan sekali
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                // Only cache same-origin requests
                if (requestUrl.startsWith(self.location.origin)) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        ).catch(function(error) {
          console.log('Fetch failed; returning offline page:', error);
          // Fallback untuk halaman utama
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      }
    )
  );
});
