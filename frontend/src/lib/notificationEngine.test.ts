import { describe, it, expect, beforeEach } from 'vitest';
import {
  isQuietHoursActive,
  formatCoarseDistance,
  filterNotificationsByCategory,
  scrubClientPrivacyData,
  getChannelDeliveryBadge,
  getOfflineNotificationQueue,
  enqueueOfflineNotification,
  clearOfflineNotificationQueue
} from './notificationEngine';
import { NotificationPreference, NotificationRecord } from '../types/notification';

class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

const mockStorage = new LocalStorageMock();
(globalThis as any).localStorage = mockStorage;

describe('UNNATI Notification Engine Client Library', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe('Quiet Hours Evaluation', () => {
    const defaultPref: NotificationPreference = {
      enabled_channels: ['PUSH', 'IN_APP'],
      quiet_hours_enabled: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00',
      preferred_language: 'hi',
      opportunity_radius_km: 10,
      urgent_bypasses_quiet_hours: true
    };

    it('returns true when time falls in overnight quiet hours window (e.g. 23:15)', () => {
      const lateNight = new Date(2026, 8, 5, 23, 15);
      expect(isQuietHoursActive(defaultPref, lateNight, false)).toBe(true);
    });

    it('returns true when time is early morning within quiet hours (e.g. 05:45)', () => {
      const earlyMorning = new Date(2026, 8, 5, 5, 45);
      expect(isQuietHoursActive(defaultPref, earlyMorning, false)).toBe(true);
    });

    it('returns false during regular daytime hours (e.g. 14:30)', () => {
      const daytime = new Date(2026, 8, 5, 14, 30);
      expect(isQuietHoursActive(defaultPref, daytime, false)).toBe(false);
    });

    it('allows urgent notifications to bypass quiet hours when configured', () => {
      const lateNight = new Date(2026, 8, 5, 23, 15);
      expect(isQuietHoursActive(defaultPref, lateNight, true)).toBe(false);
    });

    it('returns false when quiet hours is disabled', () => {
      const prefDisabled = { ...defaultPref, quiet_hours_enabled: false };
      const lateNight = new Date(2026, 8, 5, 23, 15);
      expect(isQuietHoursActive(prefDisabled, lateNight, false)).toBe(false);
    });
  });

  describe('Coarse Distance Privacy Formatting', () => {
    it('formats close distance under 500m', () => {
      expect(formatCoarseDistance(0.3)).toBe('Within ~500m');
    });

    it('formats coarse kilometers with one decimal precision', () => {
      expect(formatCoarseDistance(3.421)).toBe('~3.4 km away');
    });

    it('handles null or invalid numbers gracefully', () => {
      expect(formatCoarseDistance(NaN)).toBe('Nearby');
    });
  });

  describe('Category Filtering', () => {
    const mockNotifications: NotificationRecord[] = [
      {
        id: 1,
        title: 'Booking Confirmed',
        message: 'Your booking has been accepted',
        category: 'booking',
        is_read: false,
        created_at: '2026-09-05T10:00:00Z'
      },
      {
        id: 2,
        title: 'Nearby Opportunity',
        message: 'New plumbing request nearby',
        category: 'opportunity',
        is_read: true,
        created_at: '2026-09-05T10:05:00Z'
      },
      {
        id: 3,
        title: 'Cooperative Vote',
        message: 'Annual general meeting vote open',
        category: 'governance',
        is_read: false,
        created_at: '2026-09-05T10:10:00Z'
      }
    ];

    it('returns all notifications when filter is "all"', () => {
      expect(filterNotificationsByCategory(mockNotifications, 'all')).toHaveLength(3);
    });

    it('filters correctly for "opportunity"', () => {
      const opps = filterNotificationsByCategory(mockNotifications, 'opportunity');
      expect(opps).toHaveLength(1);
      expect(opps[0].id).toBe(2);
    });

    it('filters correctly for "governance"', () => {
      const gov = filterNotificationsByCategory(mockNotifications, 'governance');
      expect(gov).toHaveLength(1);
      expect(gov[0].id).toBe(3);
    });
  });

  describe('Client-Side Privacy Scrubber', () => {
    it('replaces 12-digit Aadhaar numbers with privacy mask', () => {
      const text = 'Identity verification with Aadhaar 9876 5432 1098 complete.';
      expect(scrubClientPrivacyData(text)).toBe(
        'Identity verification with Aadhaar [AADHAAR PROTECTED] complete.'
      );
    });

    it('replaces PAN numbers with protection tag', () => {
      const text = 'Worker PAN ABCDE1234F verified.';
      expect(scrubClientPrivacyData(text)).toBe(
        'Worker PAN [PAN PROTECTED] verified.'
      );
    });

    it('redacts OTP and PIN secrets', () => {
      const text = 'Your booking otp: 5491 for task start.';
      expect(scrubClientPrivacyData(text)).toBe(
        'Your booking otp: [REDACTED] for task start.'
      );
    });
  });

  describe('Channel Delivery Badges', () => {
    it('returns green badge for PUSH delivery', () => {
      const badge = getChannelDeliveryBadge('PUSH');
      expect(badge.label).toBe('PUSH');
      expect(badge.color).toContain('emerald');
      expect(badge.fallbackText).toBeUndefined();
    });

    it('indicates fallback when previous channel attempts failed', () => {
      const badge = getChannelDeliveryBadge('IN_APP', [
        { channel: 'PUSH', status: 'FALLBACK_TRIGGERED', timestamp: '2026-09-05T10:00:00Z' },
        { channel: 'IN_APP', status: 'DELIVERED', timestamp: '2026-09-05T10:00:01Z' }
      ]);
      expect(badge.label).toBe('IN_APP');
      expect(badge.fallbackText).toBe('(Fallback +1)');
    });
  });

  describe('Offline Notification Queue', () => {
    const sampleNotification: NotificationRecord = {
      id: 99,
      title: 'Offline Cached Alert',
      message: 'Network temporarily offline',
      category: 'general',
      is_read: false,
      created_at: '2026-09-05T12:00:00Z'
    };

    it('starts with empty queue', () => {
      expect(getOfflineNotificationQueue()).toEqual([]);
    });

    it('enqueues item without duplicates', () => {
      enqueueOfflineNotification(sampleNotification);
      enqueueOfflineNotification(sampleNotification); // duplicate
      const queue = getOfflineNotificationQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe(99);
    });

    it('clears queue properly', () => {
      enqueueOfflineNotification(sampleNotification);
      clearOfflineNotificationQueue();
      expect(getOfflineNotificationQueue()).toEqual([]);
    });
  });
});
