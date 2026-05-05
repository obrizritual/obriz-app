const CACHE_NAME = 'obriz-v2';
const AUDIO_CACHE = 'obriz-audio-v1';
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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Audio: cache-first with network fallback
  if (url.pathname.startsWith('/audio/')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(cache =>
        cache.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
          cache.put(event.request, resp.clone());
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
