const CACHE_NAME = "fleisstakt-shell-v108";
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

const NETWORK_FIRST_FILES = [
  "/",
  "/index.html",
  "/app.js",
  "/styles.css",
  "/version.js",
  "/manifest.webmanifest",
  "/teacher.html",
  "/teacher.js",
  "/teacher.css",
  "/teacher-manifest.webmanifest",
  "/vendor-jsQR.js",
];

function shouldUseNetworkFirst(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return false;
  }

  if (request.mode === "navigate") {
    return true;
  }

  return NETWORK_FIRST_FILES.some((path) => url.pathname.endsWith(path));
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request, { cache: "no-store" });
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  const cloned = networkResponse.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
  return networkResponse;
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)).then(() => self.skipWaiting()));
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

  event.respondWith(shouldUseNetworkFirst(event.request) ? networkFirst(event.request) : cacheFirst(event.request));
});
