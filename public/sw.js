// Service Worker for SovereignOS
// Fix for chrome-extension caching error

const CACHE_NAME = 'sovereign-os-v2';
const urlsToCache = [
  '/',
  '/agent',
  '/register',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching essential assets');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', event => {
  // Only process http/https requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);

  // Skip caching for API calls, Next.js internal data, and browser extensions
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.includes('_next') ||
    url.protocol !== 'http:' && url.protocol !== 'https:'
  ) {
    return;
  }

  // Network-first strategy for everything else to avoid stale chunks/HTML
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses for supported routes
        if (response.status === 200 && (url.pathname === '/' || url.pathname.startsWith('/agent'))) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      })
  );
});

// Activate event - clear old caches
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
  return self.clients.claim();
});
