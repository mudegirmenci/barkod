const CACHE_NAME = "esnafpos-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/auth/signin",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  // Sadece GET isteklerini önbellekle
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // API ve Auth istekleri doğrudan ağa gitsin (stok, satış ve fiyat anlık olmalı)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: "Çevrimdışı moddasınız. Lütfen internet bağlantınızı kontrol edin." }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" }
          }
        );
      })
    );
    return;
  }

  // Statik dosyalar ve sayfalar için Network First, fallback Cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Sayfa isteği ise kök sayfayı döndür
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Çevrimdışı mod", { status: 503, statusText: "Offline" });
        });
      })
  );
});
