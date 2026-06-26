const TP_CACHE_VERSION = "top-planejados-v113-optimized-secure";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/app.css",
  "./src/app.js",
  "./src/pwa-register.js",
  "./assets/material-roble-catedral.jpg",
  "./assets/sink-stainless.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/favicon-32.png",
  "./assets/icons/favicon-64.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(TP_CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => {
        if (key !== TP_CACHE_VERSION && key.startsWith("top-planejados-")) {
          return caches.delete(key);
        }
        return null;
      })))
      .then(() => self.clients.claim())
  );
});

function isSupabaseRequest(url) {
  return url.includes("/rest/v1/") || url.includes("/auth/v1/") || url.includes(".supabase.co/") || url.includes(".supabase.in/");
}

function isStaticSameOrigin(url) {
  return url.origin === self.location.origin;
}

async function networkFirst(request) {
  const cache = await caches.open(TP_CACHE_VERSION);
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === "basic") {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") return cache.match("./index.html");
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(TP_CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok && response.type === "basic") {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  if (!isStaticSameOrigin(url)) return;
  if (isSupabaseRequest(request.url)) return;

  const isAsset = /\.(css|js|png|jpg|jpeg|webp|svg|ico)$/i.test(url.pathname);
  event.respondWith(isAsset ? cacheFirst(request) : networkFirst(request));
});
