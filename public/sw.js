// Self-destructing service worker.
// This replaces the previous SW and immediately unregisters itself,
// clearing all caches. This fixes users stuck with a broken old SW
// that cached HTML referencing deleted asset hashes.
//
// After everyone has visited once, we can re-introduce a proper SW.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        // Force reload so the client picks up fresh HTML + assets.
        client.navigate(client.url);
      }
      await self.registration.unregister();
    })()
  );
});
