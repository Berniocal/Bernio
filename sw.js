// === Bernio SW – 1 listener, scope-safe cesty ===
const CACHE_STATIC  = 'calc-static-v75';
const CACHE_RUNTIME = 'calc-runtime-v75';

// Odvoď base-path ze scope (např. "/Bernio/")
const BASE = new URL(self.registration.scope).pathname.replace(/\/+$/, '/') ;
// Helper na „scoped“ URL
const P = (p) => (p.startsWith('/') ? (BASE + p.replace(/^\//,'')) : (BASE + p));

const PRECACHE = [
  P('/'),                      // tj. BASE samotný
  P('/index.html'),
  P('/offline.html'),
  P('/manifest.webmanifest'),
  P('/icons/icon-192.png'),
  P('/icons/icon-512.png')
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE_STATIC);
    // vynutíme fresh kopie
    await c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' })));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => ![CACHE_STATIC, CACHE_RUNTIME].includes(k))
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// dovol UI tlačítku „Aktualizovat“ přepnout hned
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Výjimka: nic neděláme pro /zpjevnicek/
  if (url.pathname.startsWith('/zpjevnicek/')) {
    return; // propusť na síť bez SW
  }

  // Navigace (HTML) – network-first s fallbackem na cache/offline
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // zkus síť
        const res = await fetch(req);
        // ulož index do runtime cache pro příště
        const runtime = await caches.open(CACHE_RUNTIME);
        runtime.put(P('/index.html'), res.clone());
        return res;
      } catch {
        // síť nejde → vezmi poslední index, případně offline
        return (await caches.match(P('/index.html'))) ||
               (await caches.match(P('/offline.html')));
      }
    })());
    return;
  }

  // Ostatní GET v rámci stejného originu – cache-first
  if (url.origin === self.location.origin && req.method === 'GET') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_RUNTIME);
      const cached = await cache.match(req);
      if (cached) return cached;

      try {
        const res = await fetch(req);
        if (res && res.status === 200) cache.put(req, res.clone());
        return res;
      } catch {
        return Response.error();
      }
    })());
  }
});







































