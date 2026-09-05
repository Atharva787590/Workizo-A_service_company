import React from 'react';
import { IndianRupee, ShieldCheck, Award, Briefcase, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkerEarningsSummary } from '@/types/unnati';

export interface WorkerEarningsCardProps {
  summary: WorkerEarningsSummary;
  className?: string;
}

export const WorkerEarningsCard: React.FC<WorkerEarningsCardProps> = ({
  summary,
  className
}) => {
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-6 shadow-sm space-y-5',
        className
      )}
    >
      {/* Header with Title & Middleman-Free Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Direct Earnings & Dividends
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
            {summary.workerName}
          </h3>
        </div>
        <div className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>₹0 Platform Middleman Rake</span>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Total Direct Payout */}
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            Direct Payout
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            ₹{summary.totalDirectEarned.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            100% Retained by You
          </div>
        </div>

        {/* Metric 2: Cooperative Dividend Accrued */}
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
            <Award className="w-4 h-4 text-purple-600" />
            Coop Dividend
          </div>
          <div className="text-xl font-black text-purple-700 dark:text-purple-300">
            ₹{summary.totalCooperativeContribution.toFixed(2)}
          </div>
          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
            Member Reserve Pool
          </div>
        </div>

        {/* Metric 3: Platform Rake / Deduction */}
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            Platform Cut
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            ₹0.00
          </div>
          <div className="text-[10px] text-slate-500 font-semibold">
            Zero Commission Fee
          </div>
        </div>

        {/* Metric 4: Completed Jobs */}
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
            <Briefcase className="w-4 h-4 text-blue-600" />
            Jobs Settled
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {summary.completedJobsCount}
          </div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
            Direct Contracts
          </div>
        </div>
      </div>
    </div>
  );
};
