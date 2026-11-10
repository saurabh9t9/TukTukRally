const CACHE_NAME = 'auto-rally-offline-cache';
const IS_CLOUD_RUN_PROXY =
  typeof self !== 'undefined' &&
  self.location &&
  self.location.hostname.endsWith('.run.app');

const INITIAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/assets/textures/grass.jpg',
  '/assets/textures/water.jpg',
  '/assets/textures/terracotta_brick.jpg',
  '/assets/textures/wood.jpg',
  '/assets/textures/carbon.png',
];

const OFFLINE_VITE_CLIENT_STUB = `
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.querySelector('style[data-vite-dev-id="' + id + '"]');
    if (!style) {
      style = document.createElement('style');
      style.setAttribute('type', 'text/css');
      style.setAttribute('data-vite-dev-id', id);
      document.head.appendChild(style);
    }
    sheetsMap.set(id, style);
  }
  style.textContent = content;
}
export function removeStyle(id) {
  const style = sheetsMap.get(id) || document.querySelector('style[data-vite-dev-id="' + id + '"]');
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    accept() {},
    dispose() {},
    prune() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
    data: {},
  };
}
export function injectQuery(url) {
  return url;
}
export class ErrorOverlay extends HTMLElement {}
`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  if (IS_CLOUD_RUN_PROXY) {
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        INITIAL_ASSETS.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((res) => {
              if (res && res.ok) {
                return cache.put(url, res);
              }
            })
            .catch(() => {})
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  if (IS_CLOUD_RUN_PROXY) {
    // On AI Studio .run.app domains, the platform proxy owns the root Service Worker.
    // Clean up our cache and unregister /offline-sw.js so we never cause a reload loop.
    event.waitUntil(
      (async () => {
        try {
          await caches.delete(CACHE_NAME);
        } catch {}
        try {
          await self.registration.unregister();
        } catch {}
      })()
    );
    return;
  }

  event.waitUntil(
    (async () => {
      await self.clients.claim();
    })()
  );
});

if (!IS_CLOUD_RUN_PROXY) {
  self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (!url.protocol.startsWith('http')) return;
    if (url.pathname === '/offline-sw.js') return;

    // Serve offline-safe Vite client stub when offline
    if (url.pathname === '/@vite/client' && !navigator.onLine) {
      event.respondWith(
        new Response(OFFLINE_VITE_CLIENT_STUB, {
          status: 200,
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        })
      );
      return;
    }

    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        const findInCache = async () => {
          let cached = await cache.match(request);
          if (cached) return cached;

          cached = await cache.match(request.url);
          if (cached) return cached;

          cached = await cache.match(request, { ignoreSearch: true });
          if (cached) return cached;

          cached = await cache.match(url.pathname, { ignoreSearch: true });
          if (cached) return cached;

          if (
            request.mode === 'navigate' ||
            request.destination === 'document'
          ) {
            const rootMatch =
              (await cache.match('/')) ||
              (await cache.match('/index.html')) ||
              (await cache.match('/index.html', { ignoreSearch: true }));
            if (rootMatch) return rootMatch;
          }

          return null;
        };

        if (!navigator.onLine) {
          const offlineCached = await findInCache();
          if (offlineCached) return offlineCached;
        }

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const networkResponse = await fetch(request, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (
            networkResponse &&
            (networkResponse.status === 200 ||
              networkResponse.type === 'opaque')
          ) {
            cache.put(request, networkResponse.clone()).catch(() => {});
            if (request.mode === 'navigate') {
              cache.put('/', networkResponse.clone()).catch(() => {});
              cache.put('/index.html', networkResponse.clone()).catch(() => {});
            }
          }
          return networkResponse;
        } catch {
          if (url.pathname === '/@vite/client') {
            return new Response(OFFLINE_VITE_CLIENT_STUB, {
              status: 200,
              headers: {
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'no-cache',
              },
            });
          }

          const fallback = await findInCache();
          if (fallback) return fallback;

          if (
            request.mode === 'navigate' ||
            request.destination === 'document'
          ) {
            const rootFallback =
              (await cache.match('/')) || (await cache.match('/index.html'));
            if (rootFallback) return rootFallback;
          }

          return new Response('Offline resource unavailable', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      })()
    );
  });
}
