// PWA Service Worker para "Experimenta aí - Delivery"
// Permite instalação do app e funciona offline para recursos estáticos

const CACHE_NAME = 'experimenta-ai-delivery-v1';
const STATIC_ASSETS = [
  '/',
  '/delivery',
  '/assets/manifest.webmanifest',
  '/assets/experimenta_ai_banner_circular.webp'
];

// Instala o Service Worker e faz cache dos recursos estáticos
self.addEventListener('install', (event) => {
  console.log('[PWA SW] Instalando Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[PWA SW] Cache aberto, adicionando recursos estáticos');
        // Não falha se algum recurso não for encontrado
        return Promise.allSettled(
          STATIC_ASSETS.map(url =>
            cache.add(url).catch(err => {
              console.log(`[PWA SW] Não foi possível cachear ${url}:`, err.message);
            })
          )
        );
      })
      .then(() => {
        console.log('[PWA SW] Instalação concluída');
        self.skipWaiting();
      })
  );
});

// Ativa o Service Worker e limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('[PWA SW] Ativando Service Worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[PWA SW] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[PWA SW] Ativação concluída');
      return self.clients.claim();
    })
  );
});

// Estratégia: Network First com fallback para Cache
// Prioritiza a rede para ter dados atualizados, mas usa cache se offline
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignora requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignora requisições que não são HTTP/HTTPS (extensões do Chrome, etc.)
  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
    return;
  }

  // Ignora requisições de API (sempre vai para a rede)
  if (request.url.includes('/api/')) {
    return;
  }

  // Para outros recursos (HTML, CSS, JS, imagens)
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Se a resposta for válida, atualiza o cache
        if (response.ok && request.url.startsWith(self.location.origin)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone).catch(() => {
              // Ignora erros de cache (ex: quota exceeded)
            });
          });
        }
        return response;
      })
      .catch(() => {
        // Se offline, tenta buscar do cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se não encontrar no cache, retorna uma página offline simples para navegação
          if (request.mode === 'navigate') {
            return caches.match('/delivery');
          }
          // Para outros recursos, deixa falhar
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Listener para mensagens (útil para atualizações)
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
