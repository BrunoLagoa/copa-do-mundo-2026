/**
 * Service worker mínimo do Copa 2026 — habilita instalação (PWA) e um shell
 * offline básico. Estratégia network-first só para mesmo-origem (os assets do
 * app); chamadas externas (ESPN) sempre vão direto à rede, nunca são cacheadas.
 */

const CACHE = 'copa2026-shell-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // ESPN e demais externos: rede direta

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match(`${self.registration.scope}index.html`)),
      ),
  );
});
