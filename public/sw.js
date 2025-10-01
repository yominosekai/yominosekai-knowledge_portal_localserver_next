// Service Worker for Knowledge Portal Offline Mode

const CACHE_NAME = 'knowledge-portal-v1';
const OFFLINE_URLS = [
  '/',
  '/content',
  '/progress',
  '/profile',
  '/offline.html',
  '/manifest.json'
];

// インストール時の処理
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching offline URLs');
        return cache.addAll(OFFLINE_URLS);
      })
      .then(() => {
        console.log('Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// アクティベート時の処理
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// フェッチ時の処理
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // APIリクエストの場合はネットワークファースト
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功した場合はキャッシュに保存
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // ネットワークエラーの場合はキャッシュから返す
          return caches.match(request);
        })
    );
    return;
  }

  // 静的リソースの場合はキャッシュファースト
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(request)
            .then((response) => {
              // 成功した場合はキャッシュに保存
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              // オフライン時のフォールバック
              if (request.destination === 'document') {
                return caches.match('/offline.html');
              }
              return new Response('Offline', { status: 503 });
            });
        })
    );
  }
});

// バックグラウンド同期
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

// プッシュ通知
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: data.tag,
      data: data.data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 通知クリック
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// バックグラウンド同期の実装
async function doBackgroundSync() {
  try {
    // オフライン時に保存されたデータを同期
    const offlineData = await getOfflineData();
    if (offlineData) {
      await fetch('/api/sync-offline-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offlineData)
      });
      console.log('Background sync completed');
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// オフラインデータの取得
async function getOfflineData() {
  return new Promise((resolve) => {
    const request = indexedDB.open('KnowledgePortalOffline', 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const getRequest = store.get('critical');
      
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
}


