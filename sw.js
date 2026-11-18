/* Vagha Management System — service worker
 *
 * Scope: app shell only. Booking data lives in Google Sheets and login is
 * handled by Firebase, so neither is ever cached or intercepted here.
 *
 * IMPORTANT: bump CACHE_VERSION on every deploy that changes the shell.
 */
const CACHE_VERSION = 'v1';
const CACHE_NAME = `vagha-shell-${CACHE_VERSION}`;

const SHELL = [
  './',
  './index.html',
  './login.html',
  './offline.html',
  './manifest.webmanifest',
  './frontend/assets/logo.png',
  './frontend/css/main.css',
  './frontend/css/base.css',
  './frontend/css/layout.css',
  './frontend/css/forms.css',
  './frontend/css/buttons.css',
  './frontend/css/entries.css',
  './frontend/css/calendar.css',
  './frontend/css/overlays.css',
  './frontend/css/responsive.css',
];

// Only these cross-origin hosts are cached (versioned, immutable CDN files).
// Everything else cross-origin (Apps Script, Firebase, gstatic) goes straight to the network.
const CACHEABLE_CDN = ['cdn.jsdelivr.net'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // one missing file must not block installation
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('vagha-shell-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Never touch Apps Script, Firebase, or any other third-party API
  if (!sameOrigin && !CACHEABLE_CDN.includes(url.hostname)) return;

  // Pinned CDN files (e.g. fullcalendar@6.1.8): cache-first, they never change
  if (!sameOrigin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Pages: network-first so a new deploy is always picked up, cache as fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request).catch(() => caches.match('./offline.html')),
    );
    return;
  }

  // Same-origin CSS/JS/images: network-first too (no stale code after deploys)
  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
  return response;
}
