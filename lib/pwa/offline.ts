export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function requestInstallPrompt() {
  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });

  return () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
      });
    }
  };
}

export async function saveOfflineData(key: string, data: any) {
  try {
    if ('indexedDB' in window) {
      const db = await openDB('FreshMarketAgent');
      const tx = db.transaction('cache', 'readwrite');
      await tx.objectStore('cache').put({ key, data, timestamp: Date.now() });
    } else {
      localStorage.setItem(`offline-${key}`, JSON.stringify(data));
    }
  } catch (err) {
    console.error('Failed to save offline data:', err);
  }
}

export async function getOfflineData(key: string) {
  try {
    if ('indexedDB' in window) {
      const db = await openDB('FreshMarketAgent');
      const tx = db.transaction('cache', 'readonly');
      const request = tx.objectStore('cache').get(key);
      const result = await new Promise<{ data?: unknown } | undefined>(
        (resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        }
      );
      return result?.data;
    } else {
      const data = localStorage.getItem(`offline-${key}`);
      return data ? JSON.parse(data) : null;
    }
  } catch (err) {
    console.error('Failed to get offline data:', err);
    return null;
  }
}

function openDB(dbName: string): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
    };
  });
}
