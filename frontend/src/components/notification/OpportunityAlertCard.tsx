import React from 'react';
import { MapPin, ArrowRight, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OpportunityAlertRecord } from '@/types/notification';
import { formatCoarseDistance } from '@/lib/notificationEngine';

export interface OpportunityAlertCardProps {
  alert: OpportunityAlertRecord;
  onAccept?: (id: number) => void;
  onDismiss?: (id: number) => void;
  isProcessing?: boolean;
  className?: string;
}

export const OpportunityAlertCard: React.FC<OpportunityAlertCardProps> = ({
  alert,
  onAccept,
  onDismiss,
  isProcessing = false,
  className
}) => {
  const isAvailable = alert.status === 'AVAILABLE';

  return (
    <div
      className={cn(
        'p-4 rounded-2xl border transition-all space-y-3',
        isAvailable
          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-300'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-75',
        className
      )}
    >
      {/* Header with Coarse Distance */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {formatCoarseDistance(alert.coarse_distance_km)} in {alert.coarse_locality}
          </span>
          <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
            {alert.service_title}
          </h4>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-semibold">Est. Fair Payout</span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
            ₹{alert.estimated_payout}
          </span>
        </div>
      </div>

      {/* Privacy Notice on Coarse Location */}
      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span>Approximate locality shown to protect customer privacy. Exact address provided upon acceptance.</span>
      </div>

      {/* Actions */}
      {isAvailable && (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onAccept?.(alert.id)}
            disabled={isProcessing}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <span>Accept Opportunity (स्वीकार करें)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDismiss?.(alert.id)}
            disabled={isProcessing}
            aria-label="Dismiss opportunity"
            className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {!isAvailable && (
        <div className="text-right">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
            {alert.status}
          </span>
        </div>
      )}
    </div>
  );
};
