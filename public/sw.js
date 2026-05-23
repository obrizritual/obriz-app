// Version bumped 2026-05-23: added Web Push handlers (push + notificationclick)
// and bumped cache to v15. Previous v14 only handled offline caching; v15
// integrates with Supabase Edge Function `send-push` and the in-app
// notification opt-in flow.
//
// IMPORTANT: We do NOT cache /audio/rituals/* or /audio/affirmations/* — those
// stream via Range requests which the Cache API can't serve correctly.
const CACHE_NAME = 'obriz-v15';
const AUDIO_CACHE = 'obriz-audio-v2';
const SVG_CACHE = 'obriz-svg-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

const AUDIO_FILES = [
  '/audio/general-reset.mp3',
  '/audio/morning-reset.mp3',
  '/audio/pre-meeting-reset.mp3',
  '/audio/transition-reset.mp3',
  '/audio/post-conflict-reset.mp3',
];

const SVG_FILES = [
  '/svgs/face-base.svg',
  '/svgs/gua-sha-zones.svg',
  '/svgs/lymphatic-paths.svg',
  '/svgs/face-lifting-points.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)),
      caches.open(AUDIO_CACHE).then(cache => cache.addAll(AUDIO_FILES)),
      caches.open(SVG_CACHE).then(cache => cache.addAll(SVG_FILES)),
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== AUDIO_CACHE && k !== SVG_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Only the five legacy reset files are pre-cached for offline. Anything else
// under /audio/ (rituals, affirmations) must pass through to network so that
// <audio> Range requests work and Chrome doesn't stall on first play.
const PRECACHED_AUDIO = new Set(AUDIO_FILES);

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Range requests must never be served from the Cache API — cached responses
  // are always 200 OK with the full file, but <audio> needs 206 Partial Content
  // with Content-Range to seek and stream. Bypass SW entirely for Range.
  if (event.request.headers.get('range')) {
    return; // not calling respondWith → browser handles natively
  }

  // Audio: only intercept the precached legacy reset files. Everything else
  // (rituals, affirmations, future audio) passes through untouched.
  if (url.pathname.startsWith('/audio/')) {
    if (!PRECACHED_AUDIO.has(url.pathname)) {
      return; // not calling respondWith → browser handles natively
    }
    event.respondWith(
      caches.open(AUDIO_CACHE).then(cache =>
        cache.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
          // Only cache opaque-clean full responses (200 OK). Skip partials, errors.
          if (resp.ok && resp.status === 200) {
            cache.put(event.request, resp.clone()).catch(() => {});
          }
          return resp;
        }))
      )
    );
    return;
  }

  // SVGs: cache-first with network fallback
  if (url.pathname.startsWith('/svgs/')) {
    event.respondWith(
      caches.open(SVG_CACHE).then(cache =>
        cache.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
          cache.put(event.request, resp.clone());
          return resp;
        }))
      )
    );
    return;
  }

  // Everything else: network-first with cache fallback
  event.respondWith(
    fetch(event.request).then(resp => {
      if (resp.ok) {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return resp;
    }).catch(() => caches.match(event.request))
  );
});

// ════════════════════════════════════════════════════════════════
// WEB PUSH
// ════════════════════════════════════════════════════════════════
// Payload contract (from the `send-push` Supabase Edge Function):
//   { title: string, body: string, url?: string, tag?: string }
// We render the notification with RHEI gold theme via the icon/badge fields.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    // Fallback for plain-text payloads
    data = { title: 'RHEI', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'RHEI';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'rhei-default',
    data: { url: data.url || '/' },
    vibrate: [80, 40, 80],
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// When the user taps the notification, focus an existing tab or open a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Reuse any open RHEI tab if present
      for (const client of clientList) {
        try {
          const u = new URL(client.url);
          if (u.origin === self.location.origin && 'focus' in client) {
            client.navigate(targetUrl).catch(() => {});
            return client.focus();
          }
        } catch (e) { /* ignore */ }
      }
      // Otherwise open a fresh window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
