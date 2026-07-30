// public/sw.js

const CACHE_NAME = 'health-ai-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {
    title: '🏥 Health AI',
    body: 'Time to check your health plan!',
    icon: null, // Will use emoji instead
    badge: null,
    tag: 'health-reminder',
    requireInteraction: true,
    data: {
      url: '/dashboard'
    }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      console.log('Push data parse error:', e);
    }
  }

  // Create notification with emoji icon (no image needed)
  const options = {
    body: data.body,
    tag: data.tag || 'health-reminder',
    requireInteraction: data.requireInteraction || true,
    vibrate: [200, 100, 200],
    silent: false,
    actions: [
      {
        action: 'open',
        title: '📱 Open App'
      },
      {
        action: 'snooze',
        title: '⏰ Snooze 30m'
      },
      {
        action: 'dismiss',
        title: '✕ Dismiss'
      }
    ],
    data: data.data || {},
    // Add badge color for Android (if supported)
    badge: null,
    // Customize notification style
    icon: null // We'll use emoji in title instead
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  if (event.action === 'snooze') {
    // Snooze for 30 minutes
    const snoozeTime = new Date(Date.now() + 30 * 60 * 1000);
    // You can implement snooze logic here
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      const url = event.notification.data?.url || '/';
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});