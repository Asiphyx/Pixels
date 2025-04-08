
// This is the service worker with the combined offline experience
// Add a comment
const CACHE = "pixel-tavern-v1";

const ASSETS = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
  '/assets/background.png',
  '/manifest.webmanifest',
  '/assets/amethyst_avatar.png',
  '/assets/ruby_avatar.png',
  '/assets/sapphire_avatar.png'
];

// Installation - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE) {
            return caches.delete(key);
          }
        }));
      })
      .then(() => self.clients.claim())
  );
});

// Network-first strategy with fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // API calls - network only
  if (event.request.url.includes('/api/') || event.request.url.includes('/ws')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we got a valid response, clone it and store it in the cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If the network is unavailable, get from cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If it's an HTML request, return the offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
          });
      })
  );
});
