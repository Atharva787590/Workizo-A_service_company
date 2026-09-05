import React from 'react';
import { AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaymentFailureRetryProps {
  errorMessage?: string;
  onRetry: () => void;
  onChangeMethod?: () => void;
  className?: string;
}

export const PaymentFailureRetry: React.FC<PaymentFailureRetryProps> = ({
  errorMessage = 'Direct payment could not be completed with the service provider.',
  onRetry,
  onChangeMethod,
  className
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl p-4 border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 space-y-3',
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
            Payment Attempt Unsuccessful (भुगतान असफल)
          </h4>
          <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
            {errorMessage}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Direct Payment
        </button>

        {onChangeMethod && (
          <button
            type="button"
            onClick={onChangeMethod}
            className="flex-1 py-2 px-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-800 dark:text-rose-200 font-semibold text-xs transition flex items-center justify-center gap-1"
          >
            Switch to Cash / Alternate
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
