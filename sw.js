/**
 * OmniPOS Service Worker v3.0
 * Strategy: Stale-While-Revalidate for static assets.
 * Network-First for API calls (bypassed by design).
 * App Shell pre-cached for full offline availability.
 */

const CACHE_VERSION = 'omnipos-v3.0.0';
const CACHE_NAME = CACHE_VERSION;

/* Static assets that form the offline app shell */
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/src/css/reset.css',
  '/src/css/tokens.css',
  '/src/css/themes.css',
  '/src/css/typography.css',
  '/src/css/layout.css',
  '/src/css/components.css',
  '/src/css/utilities.css',
  '/src/css/responsive.css',
  '/src/app.js'
];

/* Origins that should NEVER be cached (live data APIs) */
const BYPASS_ORIGINS = [
  'supabase.co',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net'
];

/* ── Install: Pre-cache app shell ──────────────────────────*/
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching OmniPOS app shell');
        return cache.addAll(APP_SHELL_ASSETS);
      })
      .then(() => {
        console.log('[SW] App shell cached — skipping waiting');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.warn('[SW] Pre-cache failed (some assets may be missing):', err);
        // Don't let a single missing asset block the SW install
        return self.skipWaiting();
      })
  );
});

/* ── Activate: Clean up stale caches ───────────────────────*/
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name.startsWith('omnipos-'))
          .map((name) => {
            console.log('[SW] Deleting stale cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Activated — claiming all clients');
      return self.clients.claim();
    })
  );
});

/* ── Fetch: Stale-While-Revalidate strategy ────────────────*/
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only handle GET requests
  if (request.method !== 'GET') return;

  // 2. Bypass all third-party APIs (Supabase, fonts, CDN)
  const isBypass = BYPASS_ORIGINS.some((origin) => url.hostname.includes(origin));
  if (isBypass) return;

  // 3. Bypass chrome-extension and non-http(s) schemes
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);

      // Kick off background network fetch (revalidate)
      const networkFetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
            // Clone before consuming
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed — return null
          return null;
        });

      if (cachedResponse) {
        // Serve cache immediately, update in background (SWR)
        networkFetchPromise; // fire and forget
        return cachedResponse;
      }

      // Not in cache — try network
      const networkResponse = await networkFetchPromise;
      if (networkResponse) return networkResponse;

      // Offline fallback for HTML navigation requests
      if (request.headers.get('accept')?.includes('text/html')) {
        const fallback = await cache.match('/index.html');
        if (fallback) return fallback;
      }

      // Return a generic offline response
      return new Response(
        JSON.stringify({ error: 'offline', message: 'No network connection and no cached response available.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    })
  );
});

/* ── Background Sync support (for offline mutations) ───────*/
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-transactions') {
    console.log('[SW] Background sync: pending transactions');
    // Transaction sync is handled by the app layer via IndexedDB
  }
});

/* ── Push Notifications ────────────────────────────────────*/
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch (e) { data = { title: 'OmniPOS', body: event.data.text() }; }

  const options = {
    body: data.body || 'You have a new notification.',
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    tag: data.tag || 'omnipos-notification',
    data: { url: data.url || '/' },
    requireInteraction: false,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'OmniPOS', options)
  );
});

/* ── Notification click handler ────────────────────────────*/
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existingWindow = windowClients.find((w) => w.url.includes(targetUrl));
      if (existingWindow) return existingWindow.focus();
      return clients.openWindow(targetUrl);
    })
  );
});
