/* ── Activación inmediata ──────────────── */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/* ── Recibir push ──────────────────────── */
self.addEventListener('push', (event) => {
  let payload = {
    title: 'PsicoEscolar',
    body:  'Tienes una nueva notificación.',
    url:   '/estudiante',
    tag:   'psicoescolar',
    count: 1,
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    (async () => {
      // Mostrar notificación con sonido del sistema
      await self.registration.showNotification(payload.title, {
        body:               payload.body,
        tag:                payload.tag,
        renotify:           true,           // vibra/suena aunque el tag ya exista
        icon:               '/iconomobil.png',
        badge:              '/iconomobil.png',
        vibrate:            [200, 100, 200],
        silent:             false,          // usa el sonido del sistema
        requireInteraction: false,
        data:               { url: payload.url || '/estudiante', count: payload.count },
      });

      // Badge en el ícono de la app (Android Chrome / Edge)
      if ('setAppBadge' in self.navigator) {
        await self.navigator.setAppBadge(payload.count ?? 1);
      }
    })()
  );
});

/* ── Clic en notificación ──────────────── */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url      = event.notification.data?.url || '/estudiante';
  const fullUrl  = self.location.origin + url;

  // Limpiar badge al abrir la app
  if ('clearAppBadge' in self.navigator) {
    self.navigator.clearAppBadge();
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            client.navigate(fullUrl);
            return client.focus();
          }
        }
        return self.clients.openWindow(fullUrl);
      })
  );
});

/* ── Limpiar badge cuando se abre la app ── */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_BADGE' && 'clearAppBadge' in self.navigator) {
    self.navigator.clearAppBadge();
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
