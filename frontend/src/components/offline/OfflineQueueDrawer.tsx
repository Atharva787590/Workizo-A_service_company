import React from 'react';
import { getSyncQueue } from '../../lib/offlineSyncEngine';
import { useAccessibility } from '../../context/AccessibilityContext';
import {
  X,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ZapOff
} from 'lucide-react';

interface OfflineQueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineQueueDrawer: React.FC<OfflineQueueDrawerProps> = ({ isOpen, onClose }) => {
  const { networkQuality, triggerManualSync, retryFailedSync, isOnline } = useAccessibility();
  const queue = getSyncQueue();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offline-queue-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <ZapOff className="w-4 h-4" />
            </div>
            <div>
              <h3 id="offline-queue-title" className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
                Offline Task Sync Queue
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {queue.length} action{queue.length === 1 ? '' : 's'} queued for synchronization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close sync queue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-3">
          {queue.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                All Offline Changes Synchronized
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                Any task notes or milestone updates you record offline will appear here and sync automatically when connection restores.
              </p>
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/60 space-y-2"
                id={`sync-item-${item.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {item.description}
                    </span>
                  </div>

                  {item.status === 'PENDING_SYNC' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                      <Clock className="w-3 h-3" />
                      Pending Sync
                    </span>
                  )}
                  {item.status === 'SYNCING' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Syncing
                    </span>
                  )}
                  {item.status === 'SYNC_FAILED' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300">
                      <AlertTriangle className="w-3 h-3" />
                      Failed
                    </span>
                  )}
                  {item.status === 'CONFLICT_DETECTED' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300">
                      Server Authoritative
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono flex items-center justify-between">
                  <span>Key: {item.idempotencyKey.substring(0, 22)}...</span>
                  <span>Retries: {item.retryCount}/{item.maxRetries}</span>
                </div>

                {item.lastError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg leading-tight">
                    {item.lastError}
                  </p>
                )}
              </div>
            ))
          )}

          {/* Safety Notice */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Safety Guarantee & Financial Protection
            </div>
            <p className="text-[11px] leading-relaxed">
              Customer payments, wallet payouts, and identity verifications require live banking network verification and are strictly prohibited offline to protect funds.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Close
          </button>

          {queue.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={retryFailedSync}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-indigo-200 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                id="retry-failed-sync-btn"
              >
                Retry Failed
              </button>
              <button
                onClick={triggerManualSync}
                disabled={!isOnline || networkQuality === 'SYNCING'}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 transition-all active:scale-95"
                id="sync-now-btn"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${networkQuality === 'SYNCING' ? 'animate-spin' : ''}`} />
                {networkQuality === 'SYNCING' ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineQueueDrawer;
