// Minimal service worker to enable PWA install prompt.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Nenhum handler de fetch para evitar overhead/avisos; uso apenas para habilitar install prompt.
