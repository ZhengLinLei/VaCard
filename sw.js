//GET VERSION
const CURRENT_CACHE = `VaCard`;
let filesToCache = [
    "./",
    "./source/favicon.ico",
    "./css/style.css",
    "./js/script.min.js",
    "./manifest.json",
    "./manifest.webmanifest",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js",
    "https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js",
    "https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"
];
//INSTALL
self.addEventListener("install", eo => {
  console.log("Installing service worker");
  eo.waitUntil(
    caches.open(CURRENT_CACHE)
      .then(cache => {
        console.log("Caching...")
        cache.addAll(filesToCache);
      })
  );
});
// on activation we clean up the previously registered service workers
self.addEventListener('activate', evt => {
  console.log("Activating service worker");
  evt.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CURRENT_CACHE) {
            console.log("Deleting old cache");
            return caches.delete(cacheName);
          }
        })
      )
    })
  );
});
const updateCache = request => {
  if (!request.url.includes(".woff")) {
    caches.open(CURRENT_CACHE)
      .then(cache => {
        cache.match(request)
          .then(response => {
            if (response) {
              fetch(request)
                .then(res => {
                  cache.put(request, res.clone());
                });
            }
          })
      })
  }
}

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CURRENT_CACHE)
      .then(cache => {
        return cache.match(event.request.url)
          .then(response => {
            return (response) ? response : fetch(event.request);
          })
      })
  );
  updateCache(event.request);
});