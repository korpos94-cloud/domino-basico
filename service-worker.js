/* ========================================
   SERVICE WORKER - PWA OFFLINE SUPPORT
   Cache First, Network Fallback Strategy
   ======================================== */

const CACHE_NAME = 'domino-cache-v7';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './src/css/layout.css',
  './src/css/tiles.css',
  './src/css/tiles-states.css',
  './src/js/game.js',
  './src/js/board.js',
  './src/js/tiles.js',
  './src/js/render.js',
  './src/js/ui.js',
  './src/js/ai.js',
  './src/js/audio.js',
  './src/js/confetti.js'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cacheando archivos del juego');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[Service Worker] Instalación completa');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Error en instalación:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Eliminando caché antigua:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activación completa');
        return self.clients.claim();
      })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean HTTP/HTTPS
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Si está en caché, devolver caché
        if (cachedResponse) {
          console.log('[Service Worker] Sirviendo desde caché:', event.request.url);
          
          // Actualizar caché en background
          fetch(event.request)
            .then((response) => {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, response);
                });
              }
            })
            .catch(() => {
              // Offline, no hacer nada
            });
          
          return cachedResponse;
        }

        // Si no está en caché, ir a la red
        console.log('[Service Worker] Obteniendo de red:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Cachear respuesta válida
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Error de red:', error);
            
            // Si es una página HTML, devolver página offline personalizada
            if (event.request.headers.get('accept').includes('text/html')) {
              return new Response(
                `<!DOCTYPE html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Sin Conexión - Dominó</title>
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      background: linear-gradient(135deg, #1a2980 0%, #26d0ce 100%);
                      color: #f7f7f7;
                      min-height: 100vh;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      text-align: center;
                      padding: 20px;
                    }
                    .offline-container {
                      max-width: 500px;
                    }
                    .offline-icon {
                      font-size: 5rem;
                      margin-bottom: 20px;
                    }
                    h1 {
                      font-size: 2rem;
                      margin-bottom: 15px;
                    }
                    p {
                      font-size: 1.1rem;
                      line-height: 1.6;
                      margin-bottom: 30px;
                      opacity: 0.9;
                    }
                    button {
                      padding: 15px 40px;
                      background: #00b894;
                      color: white;
                      border: none;
                      border-radius: 8px;
                      font-size: 1rem;
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.2s ease;
                    }
                    button:hover {
                      background: #00a081;
                      transform: translateY(-2px);
                    }
                  </style>
                </head>
                <body>
                  <div class="offline-container">
                    <div class="offline-icon">📡❌</div>
                    <h1>Sin Conexión</h1>
                    <p>No se pudo cargar esta página. Por favor, verifica tu conexión a Internet e intenta nuevamente.</p>
                    <button onclick="window.location.reload()">Reintentar</button>
                  </div>
                </body>
                </html>`,
                {
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            }

            return new Response('Sin conexión', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Manejo de mensajes desde el cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[Service Worker] Caché eliminada');
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Sincronización en background (opcional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(
      // Sincronizar puntuaciones cuando vuelva la conexión
      console.log('[Service Worker] Sincronizando datos...')
    );
  }
});

console.log('[Service Worker] Registrado correctamente');
