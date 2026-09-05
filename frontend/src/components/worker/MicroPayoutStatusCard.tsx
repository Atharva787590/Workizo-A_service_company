import React from 'react';
import { QrCode, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkerEarningsIntelligence } from '@/types/unnati';
import { determinePayoutReadiness } from '@/lib/workerIntelligence';

export interface MicroPayoutStatusCardProps {
  payoutReadiness: WorkerEarningsIntelligence['payout_readiness'];
  className?: string;
}

export const MicroPayoutStatusCard: React.FC<MicroPayoutStatusCardProps> = ({
  payoutReadiness,
  className
}) => {
  const meta = determinePayoutReadiness(
    payoutReadiness.status,
    payoutReadiness.bank_configured,
    payoutReadiness.upi_vpa
  );

  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-emerald-600" />
            Micro-Payout & Account Settlement Readiness
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            सीधा निकासी खाता स्थिति (Direct Payout Status)
          </h3>
        </div>

        {/* Status Badge */}
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto',
            meta.colorClass
          )}
        >
          {meta.isReady ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
          <span>{meta.label}</span>
          <span className="text-[10px] font-normal opacity-80">({meta.labelHi})</span>
        </span>
      </div>

      {/* Account Details Box */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 block">UPI Virtual Address (VPA):</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
              {payoutReadiness.upi_vpa || 'Not configured'}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 block">Bank Account on File:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {payoutReadiness.bank_configured ? 'Bank Verified ✓' : 'Pending Details'}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 block">AePS Readiness:</span>
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              {payoutReadiness.aeps_enabled ? 'AePS Active' : 'Provider-Ready Adapter'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
          {meta.actionableHint}
        </p>
      </div>

      {/* Mock Sandbox Notice if applicable */}
      {payoutReadiness.is_mock_mode && (
        <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-300 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <span>
            <b>Development Sandbox Mode:</b> Payout readiness is in simulation mode. Live payment gateway credentials are not configured in this environment.
          </span>
        </div>
      )}
    </div>
  );
};
