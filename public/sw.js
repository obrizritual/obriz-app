const CACHE_NAME = 'obriz-v1';
const AUDIO_CACHE = 'obriz-audio-v1';

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

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)),
      caches.open(AUDIO_CACHE).then(cache => cache.addAll(AUDIO_FILES)),
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== AUDIO_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

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

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
