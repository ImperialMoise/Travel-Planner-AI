const CACHE_NAME =
  'la-fabrique-static-v1';

const OFFLINE_URL =
  '/offline.html';

const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/app-icon-192.svg',
  '/icons/app-icon-512.svg'
];

self.addEventListener(
  'install',
  function installWorker(event) {
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(function precache(cache) {
          return cache.addAll(
            PRECACHE_URLS
          );
        })
        .then(function activateImmediately() {
          return self.skipWaiting();
        })
    );
  }
);

self.addEventListener(
  'activate',
  function activateWorker(event) {
    event.waitUntil(
      caches
        .keys()
        .then(function removeOldCaches(
          cacheNames
        ) {
          return Promise.all(
            cacheNames
              .filter(function isOldCache(
                cacheName
              ) {
                return (
                  cacheName.startsWith(
                    'la-fabrique-static-'
                  ) &&
                  cacheName !== CACHE_NAME
                );
              })
              .map(function deleteCache(
                cacheName
              ) {
                return caches.delete(
                  cacheName
                );
              })
          );
        })
        .then(function controlPages() {
          return self.clients.claim();
        })
    );
  }
);

self.addEventListener(
  'fetch',
  function handleFetch(event) {
    const request = event.request;

    if (request.method !== 'GET') {
      return;
    }

    if (request.mode === 'navigate') {
      event.respondWith(
        fetch(request).catch(
          function showOfflinePage() {
            return caches.match(
              OFFLINE_URL
            );
          }
        )
      );

      return;
    }

    const url =
      new URL(request.url);

    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }

    const isStaticAsset =
      /\.(?:css|js|svg|png|html|webmanifest)$/i
        .test(url.pathname);

    if (!isStaticAsset) {
      return;
    }

    event.respondWith(
      caches
        .match(request)
        .then(async function useCache(
          cachedResponse
        ) {
          const networkResponse =
            fetch(request)
              .then(
                function cacheResponse(
                  response
                ) {
                  if (response.ok) {
                    const copy =
                      response.clone();

                    caches
                      .open(CACHE_NAME)
                      .then(
                        function saveResponse(
                          cache
                        ) {
                          return cache.put(
                            request,
                            copy
                          );
                        }
                      );
                  }

                  return response;
                }
              )
              .catch(function ignoreFailure() {
                return null;
              });

          return (
            cachedResponse ||
            await networkResponse ||
            Response.error()
          );
        })
    );
  }
);