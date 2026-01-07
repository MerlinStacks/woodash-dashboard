/**
 * Service Worker for Web Push Notifications
 * 
 * Handles incoming push events and notification click actions.
 */

self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};

    const options = {
        body: data.body || 'You have a new notification',
        icon: '/logo192.png',
        badge: '/badge72.png',
        data: data.data || {},
        requireInteraction: true,
        tag: data.tag || 'overseek-notification',
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'OverSeek', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if app is already open
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(url);
                    return;
                }
            }
            // Open new window if app not open
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
