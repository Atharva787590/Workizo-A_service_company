import React from 'react';
import { RotateCcw, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RefundStatusBannerProps {
  refundAmount: number;
  workerCompensation: number;
  reason?: string;
  isCompleted?: boolean;
  className?: string;
}

export const RefundStatusBanner: React.FC<RefundStatusBannerProps> = ({
  refundAmount,
  workerCompensation,
  reason,
  isCompleted = true,
  className
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl p-4 border bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 space-y-2',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h4 className="text-sm font-bold text-purple-950 dark:text-purple-100">
            {isCompleted ? 'Direct Refund Settled' : 'Direct Refund Pending'}
          </h4>
        </div>
        {isCompleted && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Processed
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
        <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900">
          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Customer Refunded:</span>
          <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
            ₹{refundAmount.toFixed(2)}
          </span>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900">
          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Worker Compensation:</span>
          <span className="text-base font-bold text-amber-700 dark:text-amber-400">
            ₹{workerCompensation.toFixed(2)}
          </span>
        </div>
      </div>

      {reason && (
        <p className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1 pt-1">
          <ShieldAlert className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
          <span><b>Reason:</b> {reason}</span>
        </p>
      )}
    </div>
  );
};
