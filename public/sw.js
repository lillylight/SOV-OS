// Service Worker for SovereignOS
// Fix for chrome-extension caching error

const CACHE_NAME = 'sovereign-os-v1';
const urlsToCache = [
  '/',
  '/agent',
  '/register',
  '/demo'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event with chrome-extension fix
self.addEventListener('fetch', event => {
  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // Skip other unsupported schemes
  if (event.request.url.startsWith('moz-extension://') || 
      event.request.url.startsWith('safari-extension://') ||
      event.request.url.startsWith('edge-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).catch(() => {
          // Return offline page if network fails
          return new Response('Offline', { 
            status: 503, 
            statusText: 'Service Unavailable' 
          });
        });
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});
