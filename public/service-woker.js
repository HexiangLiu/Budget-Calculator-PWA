const static_file = [
  '/',
  '/index.html',
  '/index.js',
  '/db.js',
  '/styles.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/fonts/fontawesome-webfont.woff2?v=4.7.0',
  'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@2.8.0',
  '/api/transaction',
];

const static_cache = 'static_cache';
const DATA_CACHE = 'data_cache';

self.oninstall = (event) => {
  event.waitUntil(
    caches
      .open(static_cache)
      .then((cache) => cache.addAll(static_file))
      .then(() => self.skipWaiting())
  );
};

self.onactivate = (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheList) =>
        Promise.all(
          cacheList.map((cache) => {
            if (cache !== static_cache) {
              return caches.delete(cache);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
};

self.onfetch = (event) => {
  console.log('Handling fetch event for', event.request.url);

  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches
        .open(DATA_CACHE)
        .then((cache) => {
          return fetch(event.request)
            .then((response) => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(event.request.url, response.clone());
              }

              return response;
            })
            .catch((err) => {
              // Network request failed, try to get it from the cache.
              return cache.match(event.request);
            });
        })
        .catch((err) => console.log(err))
    );

    return;
  }
  event.respondWith(
    caches.match(event.request).then((res) => {
      if (res) {
        console.log('Found response in cache:', res);
        return res;
      }

      console.log('No response found in cache. About to fetch from network...');

      return fetch(event.request)
        .then((res) => {
          console.log('Response from network is:', response);
          return res;
        })
        .catch((err) => {
          console.log(err);
        });
    })
  );
};
