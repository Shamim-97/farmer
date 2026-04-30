const CACHE_NAME = 'freshmarket-v2';
const urlsToCache = [
  '/',
  '/agent',
  '/offline.html',
  '/manifest.json',
  '/pwa/icon.svg',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.log('Cache error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // For navigation requests, use network-first strategy
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache if offline
          return caches.match(request).then((response) => {
            return response || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // For API requests, use stale-while-revalidate
  if (request.url.includes('/api/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((response) => {
          // Cache successful API responses
          if (response.status === 200) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        });

        // Return cached response if available, or wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // For static assets, use cache-first strategy
  event.respondWith(
    caches.match(request).then((response) => {
      return (
        response ||
        fetch(request).then((response) => {
          // Cache new resources
          if (response.status === 200) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
      );
    })
  );
});

// Background sync for offline order collection photos
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-collection-proofs') {
    event.waitUntil(syncCollectionProofs());
  }
});

async function syncCollectionProofs() {
  try {
    // Get pending uploads from IndexedDB
    const db = await openIndexedDB();
    const pendingUploads = await getPendingUploads(db);

    for (const upload of pendingUploads) {
      try {
        const formData = new FormData();
        formData.append('order_id', upload.orderId);
        formData.append('gps_lat', upload.gpsLat);
        formData.append('gps_lng', upload.gpsLng);
        formData.append('photo', await blob(upload.photoData));

        const response = await fetch('/api/collect-order', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          await removePendingUpload(db, upload.id);
        }
      } catch (err) {
        console.error('Sync error for upload:', upload.id, err);
      }
    }
  } catch (err) {
    console.error('Background sync failed:', err);
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FreshMarketAgent', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('pendingUploads')) {
        db.createObjectStore('pendingUploads', { keyPath: 'id' });
      }

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingUploads')) {
        db.createObjectStore('pendingUploads', { keyPath: 'id' });
      }
    };
  });
}

function getPendingUploads(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingUploads'], 'readonly');
    const store = transaction.objectStore('pendingUploads');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removePendingUpload(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingUploads'], 'readwrite');
    const store = transaction.objectStore('pendingUploads');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(true);
  });
}
