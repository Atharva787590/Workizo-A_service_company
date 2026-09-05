import React from 'react';
import { ShieldCheck, Users, IndianRupee, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DirectPaymentBreakdown } from '@/types/unnati';

export interface PaymentSummaryCardProps {
  breakdown: DirectPaymentBreakdown;
  className?: string;
  showPayeeDetails?: boolean;
}

export const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({
  breakdown,
  className,
  showPayeeDetails = true,
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Direct Worker Payment Breakdown
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            पारदर्शी सीधा कारीगर भुगतान (Zero Platform Escrow)
          </p>
        </div>
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Direct Settlement</span>
        </div>
      </div>

      {/* Payee Info Banner */}
      {showPayeeDetails && (
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Service Provider / Craftsman:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              {breakdown.workerName}
            </span>
          </div>
          {breakdown.workerVpa && (
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 block">UPI VPA:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                {breakdown.workerVpa}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Pricing Matrix */}
      <div className="space-y-2 text-sm pt-1">
        <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
          <span>Customer Payable Amount (कुल देय राशि)</span>
          <span className="font-semibold text-slate-900 dark:text-white text-base">
            ₹{breakdown.totalCustomerPaid.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-medium">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Direct Worker Payout (कारीगर का सीधा हिस्सा)
          </span>
          <span>₹{breakdown.workerDirectPayout.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center text-indigo-600 dark:text-indigo-400 text-xs">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3 text-indigo-500" />
            Cooperative Reserve Contribution ({breakdown.cooperativeRatePercentage}% लाभांश कोष)
          </span>
          <span>₹{breakdown.cooperativeAllocation.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs">
          <span>Platform Middleman Fee (प्लेटफॉर्म बिचौलिया शुल्क)</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            ₹{breakdown.platformFee.toFixed(2)} (FREE)
          </span>
        </div>
      </div>

      {/* Collective Booking Breakdown */}
      {breakdown.isCollective && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1.5">
            <Users className="w-4 h-4 text-blue-600" />
            Collective Crew Split ({breakdown.workerCount} Workers)
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Each worker receives an equal direct payout of{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              ₹{breakdown.perWorkerShare.toFixed(2)}
            </span>{' '}
            directly into their account.
          </p>
        </div>
      )}

      {/* Policy Guarantee Banner */}
      <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-2.5 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">UNNATI Non-Intermediary Guarantee:</span> The platform does NOT hold customer funds in escrow. 100% of your service fee is settled directly with the craftsman and their cooperative.
        </div>
      </div>
    </div>
  );
};
