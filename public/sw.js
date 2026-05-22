// Version bumped 2026-05-18: previous SW intercepted /audio/rituals/* and
// /audio/affirmations/* Range requests, which broke <audio> streaming
// (Chrome stalls when it gets a 200 OK without Range support). New SW only
// caches the five legacy reset files; everything else under /audio/ passes
// straight through to Vercel's CDN so Range requests work natively.
const CACHE_NAME = 'obriz-v11';
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
