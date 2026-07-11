/* Handlers de Web Push, importados pelo service worker gerado (Workbox).
   Recebe o payload enviado por web-push na function `tick`/`api` e exibe a
   notificação; ao clicar, foca/abre a aba do app. */
/* global self, clients */

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = { title: 'MinhaCasinha', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'MinhaCasinha';
  const options = {
    body: data.body || '',
    icon: 'pwa-192x192.png',
    badge: 'pwa-192x192.png',
    data: { url: data.url || '/' },
    lang: 'pt-BR',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          if ('navigate' in client) client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
      return undefined;
    }),
  );
});
