/* ══════════════════════════════════════════════════════════════════════════
   WarGrid service worker — offline arena
   • app shell (html, manifest, icons) is precached on install
   • hashed /assets/* are cache-first (immutable filenames)
   • navigations are network-first so new releases land instantly,
     with an offline fallback to the cached shell
   • google fonts are stale-while-revalidate
   Bump CACHE on every deploy that changes precached files.
   ══════════════════════════════════════════════════════════════════════════ */
const CACHE = 'wargrid-shell-v1'
const RUNTIME = 'wargrid-runtime-v1'

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  /* navigations: network first, offline falls back to the cached shell */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('./index.html', copy))
          return res
        })
        .catch(() => caches.match('./index.html'))
    )
    return
  }

  /* hashed build output: cache first (content-addressed, never stale) */
  if (url.origin === self.location.origin && url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(RUNTIME).then((c) => c.put(request, copy))
            return res
          })
      )
    )
    return
  }

  /* webfonts: serve fast, refresh in the background */
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.open(RUNTIME).then((cache) =>
        cache.match(request).then((hit) => {
          const refresh = fetch(request)
            .then((res) => {
              cache.put(request, res.clone())
              return res
            })
            .catch(() => hit)
          return hit || refresh
        })
      )
    )
    return
  }

  /* everything same-origin: try network, fall back to cache */
  if (url.origin === self.location.origin) {
    event.respondWith(fetch(request).catch(() => caches.match(request)))
  }
})
