export const OFFLINE_CACHE_NAME = 'auto-rally-offline-cache';

const CORE_STATIC_ASSETS = [
  '/',
  '/index.html',
  '/Auto-Rally-Offline.html',
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
  '/@vite/client',
  '/@react-refresh',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/src/components/MobileOrientationGuard.tsx',
  '/src/components/PWAInstallModal.tsx',
  '/src/components/PlayingHUD.tsx',
  '/src/components/SettingsModal.tsx',
  '/src/components/StatusModals.tsx',
  '/src/components/TitleScreen.tsx',
  '/src/game/audio.ts',
  '/src/game/autoModel3D.ts',
  '/src/game/renderer.ts',
  '/src/game/rules.ts',
  '/src/game/track.ts',
  '/src/utils/offlineCacheManager.ts',
  '/src/utils/usePWAInstall.ts',
];

export interface OfflineCacheStatus {
  isCaching: boolean;
  isReady: boolean;
  cachedCount: number;
}

export function isCloudRunProxyHost(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname.endsWith('.run.app') ||
    window.location.protocol === 'file:' ||
    window.location.protocol === 'blob:'
  );
}

export async function ensureOfflineServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    // On AI Studio Cloud Run proxy domains (.run.app), the host platform uses its own
    // root Service Worker for authentication. Never replace it, and clean up any old
    // /offline-sw.js or /dev-sw.js registration so the browser never refreshes in a loop.
    if (isCloudRunProxyHost()) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        const scriptUrl =
          reg.active?.scriptURL ||
          reg.waiting?.scriptURL ||
          reg.installing?.scriptURL ||
          '';
        if (
          scriptUrl.includes('offline-sw.js') ||
          scriptUrl.includes('dev-sw.js')
        ) {
          await reg.unregister();
        }
      }
      return;
    }

    // If another non-offline-sw Service Worker is already controlling the page, do not overwrite it
    const currentControllerUrl =
      navigator.serviceWorker.controller?.scriptURL || '';
    if (
      currentControllerUrl &&
      !currentControllerUrl.includes('offline-sw.js') &&
      !currentControllerUrl.includes('sw.js')
    ) {
      return;
    }

    await navigator.serviceWorker.register('/offline-sw.js', { scope: '/' });
  } catch {
    // Ignore registration error in unsupported contexts
  }
}

function extractModuleImports(code: string, baseUrl: string): string[] {
  const discovered: string[] = [];
  const importRegex =
    /(?:^|\n)\s*(?:import|export)\s+(?:[^"'\n;]+?\s+from\s+)?["']([^"'\n]+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(code)) !== null) {
    const specifier = match[1];
    const isRealModulePath =
      specifier &&
      (specifier.startsWith('/@') ||
        /\.(?:js|ts|tsx|css)(?:\?|$)/.test(specifier));
    if (
      isRealModulePath &&
      (specifier.startsWith('/') ||
        specifier.startsWith('./') ||
        specifier.startsWith('../'))
    ) {
      try {
        discovered.push(new URL(specifier, baseUrl).href);
      } catch {
        // Ignore malformed specifier
      }
    }
  }
  return discovered;
}

export async function warmOfflineCache(
  onProgress?: (status: OfflineCacheStatus) => void
): Promise<OfflineCacheStatus> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return { isCaching: false, isReady: true, cachedCount: 1 };
  }

  // When running from a local downloaded file:// or on .run.app, avoid caching '/' over the proxy
  if (window.location.protocol === 'file:') {
    const readyStatus = { isCaching: false, isReady: true, cachedCount: 1 };
    onProgress?.(readyStatus);
    return readyStatus;
  }

  onProgress?.({ isCaching: true, isReady: false, cachedCount: 0 });

  try {
    await ensureOfflineServiceWorker();

    if (isCloudRunProxyHost()) {
      const proxyReady: OfflineCacheStatus = {
        isCaching: false,
        isReady: true,
        cachedCount: CORE_STATIC_ASSETS.length,
      };
      onProgress?.(proxyReady);
      return proxyReady;
    }

    const origin = window.location.origin;
    const urlsToCache = new Set<string>();

    for (const path of CORE_STATIC_ASSETS) {
      urlsToCache.add(new URL(path, origin).href);
    }
    urlsToCache.add(window.location.href);

    document
      .querySelectorAll<HTMLScriptElement>('script[src]')
      .forEach((el) => {
        if (el.src) urlsToCache.add(el.src);
      });
    document
      .querySelectorAll<HTMLLinkElement>('link[href]')
      .forEach((el) => {
        if (el.href) urlsToCache.add(el.href);
      });

    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const resources = performance.getEntriesByType(
        'resource'
      ) as PerformanceResourceTiming[];
      for (const res of resources) {
        if (
          res.name &&
          (res.name.startsWith(origin) ||
            res.name.includes('fonts.googleapis.com') ||
            res.name.includes('fonts.gstatic.com') ||
            res.name.includes('cdn.jsdelivr.net'))
        ) {
          if (
            res.name.includes('dev-sw.js') ||
            res.name.includes('offline-sw.js')
          ) {
            continue;
          }
          urlsToCache.add(res.name);
        }
      }
    }

    const cache = await window.caches.open(OFFLINE_CACHE_NAME);
    const visited = new Set<string>();
    let cachedCount = 0;

    const cacheUrlAndDiscoverImports = async (
      url: string
    ): Promise<string[]> => {
      if (visited.has(url)) return [];
      visited.add(url);

      try {
        const response = await fetch(url, { credentials: 'same-origin' });
        if (!response || (!response.ok && response.type !== 'opaque')) {
          return [];
        }

        await cache.put(url, response.clone());
        cachedCount++;

        const parsed = new URL(url);
        if (
          parsed.origin === origin &&
          (parsed.pathname === '/' || parsed.pathname === '/index.html')
        ) {
          await cache.put(new URL('/', origin).href, response.clone());
          await cache.put(
            new URL('/index.html', origin).href,
            response.clone()
          );
        }

        const isLocalScript =
          parsed.origin === origin &&
          (parsed.pathname.startsWith('/src/') ||
            parsed.pathname.startsWith('/node_modules/.vite/') ||
            parsed.pathname.startsWith('/@'));

        if (isLocalScript) {
          const text = await response.clone().text();
          return extractModuleImports(text, url);
        }
      } catch {
        // Ignore individual fetch failures
      }
      return [];
    };

    let currentBatch = Array.from(urlsToCache);
    for (let depth = 0; depth < 3 && currentBatch.length > 0; depth++) {
      const nextBatchSet = new Set<string>();
      const results = await Promise.allSettled(
        currentBatch.map((u) => cacheUrlAndDiscoverImports(u))
      );
      for (const res of results) {
        if (res.status === 'fulfilled') {
          for (const discoveredUrl of res.value) {
            if (!visited.has(discoveredUrl)) {
              nextBatchSet.add(discoveredUrl);
            }
          }
        }
      }
      currentBatch = Array.from(nextBatchSet);
    }

    const finalStatus: OfflineCacheStatus = {
      isCaching: false,
      isReady: cachedCount > 0,
      cachedCount,
    };
    onProgress?.(finalStatus);
    return finalStatus;
  } catch {
    const failedStatus: OfflineCacheStatus = {
      isCaching: false,
      isReady: false,
      cachedCount: 0,
    };
    onProgress?.(failedStatus);
    return failedStatus;
  }
}

/**
 * Triggers a direct browser download of the self-contained standalone
 * Auto-Rally-Offline.html file so the user can open it from Chrome Downloads
 * or iPhone Files and play 100% offline with zero internet connection.
 */
export function downloadStandaloneOfflineGameFile(): void {
  if (typeof document === 'undefined') return;
  const link = document.createElement('a');
  link.href = '/Auto-Rally-Offline.html';
  link.download = 'Auto-Rally-Offline.html';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
