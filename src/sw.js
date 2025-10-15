// service worker for Tigris PWA
// Caches all routes, key assets, and an offline page

const CACHE_NAME = "tigris-pwa-v1";
const OFFLINE_PAGE = "/offline.html";

// List all routes (compiled Handlebars pages)
const ROUTES_TO_CACHE = [
  "/",
  "/menu",
  "/gallery",
  "/catering",
  "/our-story",
  "/contact",
  "/privacy",
  "/terms"
];

// List static assets to cache (CSS, JS, key images)
const ASSETS_TO_CACHE = [
  "/assets/css/custom_css.css",
  "/assets/js/jarallax.js",
  "/assets/js/gallery.js",
  "/assets/js/menu.js",
  "/assets/js/a11y-ux.js",
  "/assets/js/showMenuItems.js",
  "/assets/js/scrollspye.js",
  "/assets/js/scrollbar.js",
  "/assets/js/prefetch.js",
  "/assets/js/navbar.js",
  "/assets/js/menu-schema.js",
  "/assets/js/itemModal.js",
  "/assets/js/homeAnimation.js",
  "/assets/js/formHandler.js",
  "/assets/js/contact.js",
  "/assets/js/catering.js",
  "/assets/js/alertModal.js",
  "/assets/images/logo/red_logo_240x170.jpeg",
  "/assets/images/logo/red_logo_120X85.jpeg",
  "/offline"
];

// Combine routes + assets + offline page
const CACHE_ASSETS = [...ROUTES_TO_CACHE, ...ASSETS_TO_CACHE, OFFLINE_PAGE];

// Install event: cache all files
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker and caching assets...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event: cleanup old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event: serve from cache first, fallback to network, then offline page
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Only cache successful requests
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return response;
        })
        .catch(() => {
          // Network failed, fallback to offline page
          return caches.match(OFFLINE_PAGE);
        });
    })
  );
});
