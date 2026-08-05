// Minimal service worker: just enough to receive Web Push events and show an
// OS-level notification, plus route a tap on that notification back into the app.
// Not a full offline/caching service worker — that's a separate concern.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "EasyService", body: event.data.text() };
  }

  const title = payload.title || "EasyService";
  const options = {
    body: payload.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const transactionId = event.notification.data?.transaction_id;
  const transferId = event.notification.data?.transfer_id;
  const targetUrl = transactionId
    ? `/transactions/${transactionId}`
    : transferId
    ? `/staff-transfers`
    : `/notifications`;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
