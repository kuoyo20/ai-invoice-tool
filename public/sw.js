// Bump version on every breaking change to force cache invalidation.
const CACHE_NAME = "ai-invoice-v3";

self.addEventListener("install", () => {
  // Take over immediately — don't wait for old tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Wipe all old caches.
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      // Claim all open tabs so the new SW handles their requests immediately.
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET requests; let POST/PUT/DELETE go straight to network.
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never cache cross-origin (Supabase API, Google OAuth, etc.).
  if (url.origin !== self.location.origin) return;

  // HTML / navigation requests: always network-first.
  // This guarantees the latest HTML (with current asset hashes) is served,
  // preventing the "stale HTML references deleted JS bundle" bug.
  const isHTML =
    req.mode === "navigate" ||
    req.headers.get("accept")?.includes("text/html");

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Cache fresh HTML for offline fallback.
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || Response.error()))
    );
    return;
  }

  // Hashed static assets (/assets/*-[hash].js|css): safe to cache aggressively.
  // The hash changes whenever the file changes, so no staleness possible.
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
    )
  );
});
