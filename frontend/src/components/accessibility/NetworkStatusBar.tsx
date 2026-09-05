import React, { useState } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { OfflineQueueDrawer } from '../offline/OfflineQueueDrawer';
import {
  WifiOff,
  Zap,
  SignalLow,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ListOrdered
} from 'lucide-react';

export const NetworkStatusBar: React.FC = () => {
  const {
    isOnline,
    lowBandwidth,
    toggleLowBandwidth,
    networkQuality,
    pendingSyncCount,
    retryFailedSync,
    triggerManualSync
  } = useAccessibility();

  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // If online, good connection, not low-bandwidth, and no pending sync issues, stay hidden
  if (
    isOnline &&
    !lowBandwidth &&
    networkQuality === 'ONLINE' &&
    pendingSyncCount === 0
  ) {
    return null;
  }

  // Visual styling based on network state
  let bgClass = 'bg-amber-600 text-white border-amber-700';
  let icon = <Zap className="w-4 h-4 shrink-0" aria-hidden="true" />;
  let message = (
    <span>
      <strong>Low-Bandwidth Mode Active.</strong> Heavy animations and non-essential assets are disabled for speed.
    </span>
  );

  if (networkQuality === 'OFFLINE' || !isOnline) {
    bgClass = 'bg-rose-700 text-white border-rose-800';
    icon = <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />;
    message = (
      <span>
        <strong>You are offline.</strong> UNNATI is operating in offline-first mode. Cached jobs available.
        {pendingSyncCount > 0 && (
          <span className="ml-1.5 px-2 py-0.5 rounded-full bg-white/20 font-bold text-xs">
            {pendingSyncCount} action{pendingSyncCount === 1 ? '' : 's'} queued
          </span>
        )}
      </span>
    );
  } else if (networkQuality === 'POOR_CONNECTION') {
    bgClass = 'bg-amber-700 text-white border-amber-800';
    icon = <SignalLow className="w-4 h-4 shrink-0" aria-hidden="true" />;
    message = (
      <span>
        <strong>Weak Network Detected.</strong> Low-bandwidth optimization active to prevent timeouts.
      </span>
    );
  } else if (networkQuality === 'SYNCING') {
    bgClass = 'bg-indigo-700 text-white border-indigo-800';
    icon = <RefreshCw className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" />;
    message = (
      <span>
        <strong>Synchronizing...</strong> Uploading queued offline actions to cooperative server.
      </span>
    );
  } else if (networkQuality === 'SYNC_COMPLETE') {
    bgClass = 'bg-emerald-700 text-white border-emerald-800';
    icon = <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />;
    message = (
      <span>
        <strong>Sync Complete!</strong> All offline changes synchronized successfully with live ledger.
      </span>
    );
  } else if (networkQuality === 'SYNC_FAILED') {
    bgClass = 'bg-orange-700 text-white border-orange-800';
    icon = <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />;
    message = (
      <span>
        <strong>Sync Interrupted.</strong> Failed to sync {pendingSyncCount} item{pendingSyncCount === 1 ? '' : 's'}. Check connection.
      </span>
    );
  }

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className={`w-full py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium flex items-center justify-between border-b transition-colors z-50 shadow-sm ${bgClass}`}
        id="network-status-bar"
      >
        <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto w-full flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2.5">
            {icon}
            {message}
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* Action buttons */}
            {networkQuality === 'SYNC_FAILED' && (
              <button
                onClick={retryFailedSync}
                className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors"
                id="bar-retry-sync-btn"
              >
                Retry
              </button>
            )}

            {isOnline && pendingSyncCount > 0 && networkQuality !== 'SYNCING' && (
              <button
                onClick={triggerManualSync}
                className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors"
                id="bar-sync-now-btn"
              >
                Sync Now
              </button>
            )}

            {pendingSyncCount > 0 && (
              <button
                onClick={() => setIsQueueOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/25 hover:bg-black/35 text-white text-xs font-semibold"
                id="bar-view-queue-btn"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                Queue ({pendingSyncCount})
              </button>
            )}

            {lowBandwidth && isOnline && networkQuality === 'ONLINE' && (
              <button
                onClick={toggleLowBandwidth}
                className="underline text-white hover:text-amber-100 text-xs px-1.5 py-0.5 rounded"
                aria-label="Disable Low-Bandwidth Mode"
              >
                Turn Off
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Offline Sync Queue Drawer */}
      <OfflineQueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
      />
    </>
  );
};

export default NetworkStatusBar;
