import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { z } from 'zod';
import { NetworkQualityState } from '../types/offline';
import {
  getPendingSyncCount,
  processSyncQueue,
  resetFailedItemsForRetry,
  getSyncQueue
} from '../lib/offlineSyncEngine';
import api from '../services/api';

export type TextSize = 'normal' | 'large' | 'extra-large';

export interface AccessibilityState {
  highContrast: boolean;
  textSize: TextSize;
  reducedMotion: boolean;
  lowBandwidth: boolean;
  isOnline: boolean;
  networkQuality: NetworkQualityState;
  pendingSyncCount: number;
}

export interface AccessibilityContextValue extends AccessibilityState {
  toggleHighContrast: () => void;
  setTextSize: (size: TextSize) => void;
  toggleReducedMotion: () => void;
  toggleLowBandwidth: () => void;
  resetSettings: () => void;
  triggerManualSync: () => Promise<void>;
  retryFailedSync: () => void;
}

const AccessibilityStorageSchema = z.object({
  highContrast: z.boolean().catch(false),
  textSize: z.enum(['normal', 'large', 'extra-large']).catch('normal'),
  reducedMotion: z.boolean().catch(false),
  lowBandwidth: z.boolean().catch(false),
});

const STORAGE_KEY = 'unnati_accessibility_v1';

export type SavedPreferences = Omit<AccessibilityState, 'isOnline' | 'networkQuality' | 'pendingSyncCount'>;

const defaultSettings: SavedPreferences = {
  highContrast: false,
  textSize: 'normal',
  reducedMotion: false,
  lowBandwidth: false,
};

const getInitialPreferences = (): SavedPreferences => {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Check system reduced-motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return { ...defaultSettings, reducedMotion: prefersReducedMotion };
    }
    const parsed = JSON.parse(stored);
    return AccessibilityStorageSchema.parse(parsed);
  } catch {
    return defaultSettings;
  }
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<Omit<AccessibilityState, 'isOnline' | 'networkQuality' | 'pendingSyncCount'>>(getInitialPreferences);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [networkQuality, setNetworkQuality] = useState<NetworkQualityState>(() => {
    if (typeof navigator === 'undefined' || !navigator.onLine) return 'OFFLINE';
    const conn = (navigator as unknown as { connection?: { effectiveType?: string; downlink?: number } }).connection;
    if (conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g' || (conn.downlink && conn.downlink < 0.5))) {
      return 'POOR_CONNECTION';
    }
    return 'ONLINE';
  });
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getPendingSyncCount());

  // Function to refresh pending count
  const refreshPendingCount = () => {
    setPendingSyncCount(getPendingSyncCount());
  };

  // Online / Offline and Network Quality Monitor
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const conn = (navigator as unknown as { connection?: { effectiveType?: string; downlink?: number } }).connection;
      if (conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g' || (conn.downlink && conn.downlink < 0.5))) {
        setNetworkQuality('POOR_CONNECTION');
      } else {
        setNetworkQuality('ONLINE');
      }
      refreshPendingCount();
      // Auto-flush offline queue upon reconnect
      triggerManualSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkQuality('OFFLINE');
      refreshPendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API change listener if available
    const conn = (navigator as unknown as { connection?: EventTarget & { effectiveType?: string; downlink?: number } }).connection;
    const handleConnectionChange = () => {
      if (!navigator.onLine) {
        setNetworkQuality('OFFLINE');
      } else if (conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g' || (conn.downlink && conn.downlink < 0.5))) {
        setNetworkQuality('POOR_CONNECTION');
      } else {
        setNetworkQuality('ONLINE');
      }
    };
    if (conn && typeof conn.addEventListener === 'function') {
      conn.addEventListener('change', handleConnectionChange);
    }

    // Interval to refresh queue count
    const interval = setInterval(refreshPendingCount, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (conn && typeof conn.removeEventListener === 'function') {
        conn.removeEventListener('change', handleConnectionChange);
      }
      clearInterval(interval);
    };
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (err) {
      console.warn('Failed to persist accessibility preferences', err);
    }
  }, [preferences]);

  // Apply DOM classes for global CSS hooks
  useEffect(() => {
    const root = document.documentElement;

    // High Contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Text Scaling
    root.classList.remove('text-scale-normal', 'text-scale-large', 'text-scale-xlarge');
    if (preferences.textSize === 'large') {
      root.classList.add('text-scale-large');
    } else if (preferences.textSize === 'extra-large') {
      root.classList.add('text-scale-xlarge');
    } else {
      root.classList.add('text-scale-normal');
    }

    // Reduced Motion
    if (preferences.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Low Bandwidth Mode
    if (preferences.lowBandwidth || !isOnline || networkQuality === 'POOR_CONNECTION') {
      root.classList.add('low-bandwidth-mode');
    } else {
      root.classList.remove('low-bandwidth-mode');
    }
  }, [preferences, isOnline, networkQuality]);

  const toggleHighContrast = () => {
    setPreferences((prev: SavedPreferences) => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const setTextSize = (size: TextSize) => {
    setPreferences((prev: SavedPreferences) => ({ ...prev, textSize: size }));
  };

  const toggleReducedMotion = () => {
    setPreferences((prev: SavedPreferences) => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  const toggleLowBandwidth = () => {
    setPreferences((prev: SavedPreferences) => ({ ...prev, lowBandwidth: !prev.lowBandwidth }));
  };

  const resetSettings = () => {
    setPreferences(defaultSettings);
  };

  const triggerManualSync = async () => {
    const queue = getSyncQueue();
    if (queue.length === 0) {
      setPendingSyncCount(0);
      return;
    }

    if (!navigator.onLine) {
      setNetworkQuality('OFFLINE');
      return;
    }

    setNetworkQuality('SYNCING');

    try {
      const result = await processSyncQueue(async (item) => {
        const response = await api({
          url: item.endpoint,
          method: item.method,
          data: item.payload,
          headers: {
            'Idempotency-Key': item.idempotencyKey,
            'X-Unnati-Offline-Sync': 'true',
          },
        });
        return {
          success: response.status >= 200 && response.status < 300,
          serverTimestamp: response.data?.timestamp || response.data?.updated_at || new Date().toISOString(),
        };
      });

      refreshPendingCount();

      if (result.failedCount === 0) {
        setNetworkQuality('SYNC_COMPLETE');
        setTimeout(() => {
          setNetworkQuality(navigator.onLine ? 'ONLINE' : 'OFFLINE');
        }, 4000);
      } else {
        setNetworkQuality('SYNC_FAILED');
      }
    } catch {
      refreshPendingCount();
      setNetworkQuality('SYNC_FAILED');
    }
  };

  const retryFailedSync = () => {
    resetFailedItemsForRetry();
    refreshPendingCount();
    triggerManualSync();
  };

  const value = useMemo<AccessibilityContextValue>(() => ({
    ...preferences,
    isOnline,
    networkQuality,
    pendingSyncCount,
    toggleHighContrast,
    setTextSize,
    toggleReducedMotion,
    toggleLowBandwidth,
    resetSettings,
    triggerManualSync,
    retryFailedSync,
  }), [preferences, isOnline, networkQuality, pendingSyncCount]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextValue => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return ctx;
};
