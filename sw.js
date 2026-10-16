/**
 * P13 Service Worker — same-origin cache-first.
 *
 * Cache names are prefixed with this tool only. Cache Storage is origin-wide
 * on yuuqq.github.io, so activate must not delete other tools' caches.
 *
 * Strategy:
 * 1. Pre-cache this project's core files and the shared files index.html actually loads
 * 2. Cache-first (stale-while-revalidate) for same-origin GET
 * 3. Cross-origin requests are not intercepted
 * 4. Offline document fallback to ./index.html
 */
const CACHE_PREFIX = "p13-sankey-board-";
const CACHE_NAME = "p13-sankey-board-v2";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./graph.js",
  "./app.js",
  "./pm-metrics.js",
  "../shared/design-tokens.css",
  "../shared/vendor/echarts.min.js",
  "../shared/releases/v2.6/loader.js",
  "../shared/releases/v2.6/dark-toggle.js",
  "../shared/releases/v2.6/cmd-palette.js",
  "../shared/releases/v2.6/toast.js",
  "../shared/releases/v2.6/onboarding.js",
  "../shared/releases/v2.6/pedagogy-data-p1.js",
  "../shared/releases/v2.6/pedagogy-data-p2.js",
  "../shared/releases/v2.6/global-nav.js",
  "../shared/releases/v2.6/kbd-hints.js"
];

function offlineResponse() {
  return new Response("Offline", {
    status: 504,
    statusText: "Offline",
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

// Install: Pre-cache core assets. One missing file must not fail the rest.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        CORE_ASSETS.map((url) => cache.add(url).catch((err) => {
          console.warn("Failed to cache:", url, err);
        }))
      );
    })
  );
  self.skipWaiting();
});

// Activate: drop only previous caches from this tool.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for same-origin GET. Cross-origin is left to the browser.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.destination === "document") {
          return caches.match("./index.html").then((fallback) => fallback || offlineResponse());
        }
        return offlineResponse();
      });
    })
  );
});
