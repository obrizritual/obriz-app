// ════════════════════════════════════════════════════════════════
// RHEI — Web Push client helpers
//
// Subscribes the browser to Web Push using the VAPID public key,
// stores the PushSubscription in Supabase `public.push_subscriptions`,
// and unsubscribes cleanly. All functions are no-ops on browsers
// without support so the call sites stay simple.
// ════════════════════════════════════════════════════════════════
import { supabase, supabaseEnabled } from './supabaseClient';

// VAPID public key — paired with the private key stored in the
// `send-push` Edge Function. Safe to ship to the client (designed for it).
const VAPID_PUBLIC_KEY =
  'BPbP7MvglF86LFnAk5Bpfuo4bWZ7XIhje2_sIJPUpd9V6zwU1ViUVxjTkYUCXP2BsEIqo2p-nlm_odpoxFUMAyM';

// Standard helper — converts a base64url VAPID key into the Uint8Array
// shape the PushManager.subscribe API requires.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function notificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

// Returns the current PushSubscription if one exists, otherwise null.
export async function currentSubscription() {
  if (!pushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

// Prompts for permission, subscribes via the SW, and stores the
// PushSubscription in Supabase. Returns { ok: true } or { ok: false, reason }.
export async function subscribeToPush() {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };
  if (!supabaseEnabled || !supabase) return { ok: false, reason: 'no_supabase' };

  // Permission
  let perm = Notification.permission;
  if (perm === 'default') {
    try {
      perm = await Notification.requestPermission();
    } catch {
      return { ok: false, reason: 'permission_error' };
    }
  }
  if (perm !== 'granted') return { ok: false, reason: 'denied' };

  // Subscribe via the SW's pushManager
  let sub;
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    sub = existing || await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  } catch (err) {
    return { ok: false, reason: 'subscribe_error' };
  }

  // Persist to Supabase against the signed-in user. If the user isn't
  // signed in we can't tag the subscription to anyone, so we bail.
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, reason: 'not_signed_in' };

    const json = sub.toJSON();
    const endpoint = json.endpoint;
    const p256dh = json.keys && json.keys.p256dh;
    const auth = json.keys && json.keys.auth;

    if (!endpoint || !p256dh || !auth) {
      return { ok: false, reason: 'invalid_subscription' };
    }

    // Upsert against unique (user_id, endpoint) so re-subscribing on the
    // same device just refreshes last_seen_at.
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent.slice(0, 240),
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'user_id,endpoint' });

    if (error) {
      // Surface to caller; UI shows a soft retry toast.
      return { ok: false, reason: 'db_error' };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'persist_error' };
  }
}

// Cleanly unsubscribes the device and deletes the row from Supabase.
export async function unsubscribeFromPush() {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return { ok: true };
    const endpoint = sub.endpoint;
    await sub.unsubscribe();

    if (supabaseEnabled && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', endpoint);
      }
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
