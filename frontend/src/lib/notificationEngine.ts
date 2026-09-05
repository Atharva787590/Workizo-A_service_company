/**
 * UNNATI Notification Engine Client Library
 * ----------------------------------------
 * Client-side priority channel tracking, offline queuing,
 * quiet hours checks, and privacy-preserving distance formatters.
 */

import {
  ChannelType,
  NotificationCategory,
  NotificationRecord,
  NotificationPreference,
  DeliveryAttempt
} from '../types/notification';

const OFFLINE_NOTIF_STORAGE_KEY = 'unnati_offline_notifications_queue';

/**
 * Checks whether the given date/time is within user-configured quiet hours.
 */
export function isQuietHoursActive(
  pref: NotificationPreference,
  currentDate: Date = new Date(),
  isUrgent: boolean = false
): boolean {
  if (!pref.quiet_hours_enabled) return false;
  if (isUrgent && pref.urgent_bypasses_quiet_hours) return false;

  const [startH, startM] = pref.quiet_hours_start.split(':').map(Number);
  const [endH, endM] = pref.quiet_hours_end.split(':').map(Number);

  const curMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
  const startMinutes = (startH || 22) * 60 + (startM || 0);
  const endMinutes = (endH || 7) * 60 + (endM || 0);

  if (startMinutes < endMinutes) {
    return curMinutes >= startMinutes && curMinutes <= endMinutes;
  } else {
    // Overnight (e.g. 22:00 to 07:00)
    return curMinutes >= startMinutes || curMinutes <= endMinutes;
  }
}

/**
 * Formats coarse distance protecting exact customer GPS coordinates.
 */
export function formatCoarseDistance(distanceKm: number): string {
  if (distanceKm == null || isNaN(distanceKm)) return 'Nearby';
  if (distanceKm < 0.5) return 'Within ~500m';
  return `~${distanceKm.toFixed(1)} km away`;
}

/**
 * Filter notifications by category.
 */
export function filterNotificationsByCategory(
  items: NotificationRecord[],
  category: 'all' | NotificationCategory
): NotificationRecord[] {
  if (category === 'all') return items;
  return items.filter((item) => item.category === category);
}

/**
 * Scrubs sensitive Aadhaar/PAN/OTP patterns from text on the client side.
 */
export function scrubClientPrivacyData(text: string): string {
  if (!text) return '';
  return text
    .replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, '[AADHAAR PROTECTED]')
    .replace(/\b[A-Za-z]{5}\d{4}[A-Za-z]{1}\b/g, '[PAN PROTECTED]')
    .replace(/(otp|pin|password|secret)[:=\s]+[0-9a-zA-Z]{4,8}/gi, '$1: [REDACTED]');
}

/**
 * Computes channel delivery summary badges including fallback history.
 */
export function getChannelDeliveryBadge(
  deliveredChannel?: ChannelType,
  attempts?: DeliveryAttempt[]
): { label: string; color: string; fallbackText?: string } {
  if (!deliveredChannel) {
    return { label: 'In-App', color: 'bg-slate-100 text-slate-700' };
  }

  const hadFallback = attempts && attempts.some((a) => a.status === 'FALLBACK_TRIGGERED');
  const fallbackCount = attempts ? attempts.filter((a) => a.status === 'FALLBACK_TRIGGERED').length : 0;

  const colorMap: Record<ChannelType, string> = {
    PUSH: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    IN_APP: 'bg-blue-50 text-blue-700 border-blue-300',
    SMS: 'bg-amber-50 text-amber-700 border-amber-300',
    IVR: 'bg-purple-50 text-purple-700 border-purple-300'
  };

  return {
    label: deliveredChannel,
    color: colorMap[deliveredChannel] || 'bg-slate-100 text-slate-700',
    fallbackText: hadFallback ? `(Fallback +${fallbackCount})` : undefined
  };
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Reads offline queued notifications from local storage.
 */
export function getOfflineNotificationQueue(): NotificationRecord[] {
  try {
    const storage = getStorage();
    if (!storage) return [];
    const raw = storage.getItem(OFFLINE_NOTIF_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Enqueues a notification locally when client is offline.
 */
export function enqueueOfflineNotification(record: NotificationRecord): void {
  try {
    const storage = getStorage();
    if (!storage) return;
    const current = getOfflineNotificationQueue();
    const exists = current.some((item) => item.id === record.id);
    if (!exists) {
      current.unshift(record);
      storage.setItem(OFFLINE_NOTIF_STORAGE_KEY, JSON.stringify(current.slice(0, 50)));
    }
  } catch (err) {
    console.warn('[Offline Notification Queue Error]', err);
  }
}

/**
 * Clears offline notification queue after synchronisation.
 */
export function clearOfflineNotificationQueue(): void {
  try {
    const storage = getStorage();
    if (storage) {
      storage.removeItem(OFFLINE_NOTIF_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('[Offline Notification Queue Clear Error]', err);
  }
}
