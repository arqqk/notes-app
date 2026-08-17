const CACHE_NAME = 'notes-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/storage.js',
  '/js/notes.js',
  '/js/calendar.js',
  '/js/table.js',
  '/js/app.js',
  '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Стратегия: cache first, потом network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем из кеша, если есть
        if (response) {
          return response;
        }
        
        // Иначе делаем запрос в сеть
        return fetch(event.request)
          .then(response => {
            // Проверяем, что ответ валидный
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Клонируем ответ и сохраняем в кеш
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
      .catch(() => {
        // Если нет сети и нет в кеше
        if (event.request.url.indexOf('.html') > -1) {
          return caches.match('/index.html');
        }
      })
  );
});

// Обновление кеша при активации
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});