self.addEventListener('push', (event) => {
  let payload = {
    title: 'PsicoEscolar',
    body: 'Tienes una nueva notificación.',
    url: '/',
    tag: 'psicoescolar',
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
      body:    payload.body,
      tag:     payload.tag,
      icon:    '/logo.png',
      badge:   '/logo.png',
      vibrate: [200, 100, 200],
      data:    { url: payload.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (new URL(client.url).pathname.startsWith(url) && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
        return undefined;
      })
  );
});
