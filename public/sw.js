/* ── Activación inmediata ──────────────── */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

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
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body:              payload.body,
      tag:               payload.tag,
      icon:              '/logo.png',
      badge:             '/logo.png',
      vibrate:           [200, 100, 200],
      requireInteraction: false,
      data:              { url: payload.url || '/estudiante' },
    })
  );
});

/* ── Clic en notificación ──────────────── */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/estudiante';
  const fullUrl = self.location.origin + url;

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
