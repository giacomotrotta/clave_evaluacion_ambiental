
// Service Worker per la PWA della chiave
// ↑ Incrementa questa versione ad ogni aggiornamento per forzare il refresh
const CACHE = 'clave-cache-v3.2.1';

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './key.json',
  './species.json',
  './manifest.json',
  './images/placeholder.webp',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Installa: precache + attiva subito la nuova versione
self.addEventListener('install', (e) => {
  self.skipWaiting(); // passa subito alla nuova SW
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS))
  );
});

// Attiva: pulizia dei cache vecchi + prendi controllo delle pagine aperte
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: try cache first, then network; aggiorna la cache in background
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return resp;
      }).catch(() => cached); // offline: usa cached se c'è
      return cached || fetchPromise;
    })
  );
});
