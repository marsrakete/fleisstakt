const CACHE_NAME = "fleisstakt-shell-v96";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./vendor-jsQR.js",
  "./styles.css",
  "./teacher.html",
  "./teacher-manifest.webmanifest",
  "./teacher.js",
  "./teacher.css",
  "./version.js",
  "./manifest.webmanifest",
  "./icons/favicon.svg",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg",
  "./icons/fleisstakt-share-qr.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        const cloned = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return networkResponse;
      });
    }),
  );
});
