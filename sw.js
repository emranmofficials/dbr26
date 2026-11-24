/* Service worker for DBR Complete Auto Centre — offline support for the static site. */
var DBR_CACHE = "dbr26-v2";
var DBR_CORE = [
  "./",
  "./index.html",
  "./dbr-website.html",
  "./dbr-content-defaults.js",
  "./dbr-backend-config.js",
  "./dbr-backend.js",
  "./dbr-features.js",
  "./manifest.json",
  "./favicon.svg",
  "./icon-192.svg",
  "./icon-512.svg",
  "./icon-180.svg"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(DBR_CACHE)
      .then(function (cache) { return cache.addAll(DBR_CORE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== DBR_CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;

  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(function (response) {
        var copy = response.clone();
        caches.open(DBR_CACHE).then(function (cache) { cache.put(request, copy); });
        return response;
      }).catch(function () {
        return caches.match(request)
          .then(function (hit) { return hit || caches.match("./dbr-website.html"); });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (hit) {
      if (hit) return hit;
      return fetch(request).then(function (response) {
        if (response && response.status === 200 && response.type === "basic") {
          var copy = response.clone();
          caches.open(DBR_CACHE).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      });
    })
  );
});
