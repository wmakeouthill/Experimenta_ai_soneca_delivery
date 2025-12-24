// PWA Service Worker para "Experimenta aí - Motoboy"
// Permite instalação do app e funciona offline para recursos estáticos
// Suporta processamento em segundo plano para atualizações de pedidos

const CACHE_NAME = 'experimenta-ai-motoboy-v1';
const STATIC_ASSETS = [
  '/',
  '/motoboy/kanban',
  '/cadastro-motoboy',
  '/assets/manifest-motoboy.webmanifest',
  '/assets/experimenta_ai_banner_circular.webp'
];

// Instala o Service Worker e faz cache dos recursos estáticos
self.addEventListener('install', (event) => {
  console.log('[PWA SW Motoboy] Instalando Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[PWA SW Motoboy] Cache aberto, adicionando recursos estáticos');
        // Não falha se algum recurso não for encontrado
        return Promise.allSettled(
          STATIC_ASSETS.map(url =>
            cache.add(url).catch(err => {
              console.log(`[PWA SW Motoboy] Não foi possível cachear ${url}:`, err.message);
            })
          )
        );
      })
      .then(() => {
        console.log('[PWA SW Motoboy] Instalação concluída');
        self.skipWaiting();
      })
  );
});

// Ativa o Service Worker e limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('[PWA SW Motoboy] Ativando Service Worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[PWA SW Motoboy] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[PWA SW Motoboy] Ativação concluída');
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
            return caches.match('/motoboy/kanban');
          }
          // Para outros recursos, deixa falhar
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Listener para mensagens (útil para atualizações e sincronização em background)
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  // Suporta sincronização em background quando o app está fechado
  if (event.data && event.data.type === 'SYNC_PEDIDOS') {
    // Quando o app é instalado como PWA, pode receber mensagens mesmo em background
    // Isso permite que o service worker sincronize dados quando necessário
    console.log('[PWA SW Motoboy] Mensagem de sincronização recebida');
  }
});

// Background Sync para sincronizar pedidos quando voltar online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pedidos') {
    event.waitUntil(
      // Aqui você pode implementar lógica de sincronização
      // Por exemplo, buscar pedidos atualizados quando voltar online
      console.log('[PWA SW Motoboy] Sincronizando pedidos em background')
    );
  }
});

// Push notifications (opcional - para notificações de novos pedidos)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Novo pedido disponível',
      icon: '/assets/experimenta_ai_banner_circular.webp',
      badge: '/assets/experimenta_ai_banner_circular.webp',
      tag: 'novo-pedido',
      requireInteraction: true,
      actions: [
        {
          action: 'ver',
          title: 'Ver Pedidos'
        },
        {
          action: 'fechar',
          title: 'Fechar'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Novo Pedido', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'ver') {
    event.waitUntil(
      clients.openWindow('/motoboy/kanban')
    );
  }
});

