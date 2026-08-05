"use client";

import { api } from "@/lib/api";

// Push endpoint payloads need the VAPID public key as a Uint8Array, but browsers
// hand it to you (and the server generates it) as a URL-safe base64 string.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export async function getPushPermissionState(): Promise<NotificationPermission | "unsupported"> {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

// Whether there's an ACTUAL live subscription right now — separate from browser
// permission, which stays "granted" forever once granted even after you
// unsubscribe. This is the signal the UI should actually key off of.
export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

export async function enablePush(): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) return { ok: false, error: "This browser doesn't support push notifications." };

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return { ok: false, error: "Push isn't configured on the server yet." };

  // If permission was already denied on an earlier attempt, the browser won't
  // show a prompt at all this time — it just silently stays denied. Surface
  // that clearly instead of leaving it looking like nothing happened.
  if (Notification.permission === "denied") {
    return {
      ok: false,
      error: "Notifications are blocked for this site in your browser. You'll need to allow them in your browser's site settings (tap the lock/info icon next to the address bar), then try again.",
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, error: "Notification permission was not granted." };

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
      });
    }

    await api.registerPushSubscription(subscription.toJSON());
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Could not enable push notifications." };
  }
}

export async function disablePush(): Promise<void> {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await api.unregisterPushSubscription(subscription.endpoint);
    await subscription.unsubscribe();
  }
}
