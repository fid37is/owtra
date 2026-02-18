self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Don't cache API
  if (request.url.includes('/api/')) {
    return
  }

  // Cache static assets
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.open('static-cache').then((cache) =>
        cache.match(request).then((response) => {
          return (
            response ||
            fetch(request).then((networkResponse) => {
              cache.put(request, networkResponse.clone())
              return networkResponse
            })
          )
        })
      )
    )
  }
})
