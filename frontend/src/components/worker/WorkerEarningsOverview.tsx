import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkerEarningsIntelligence } from '@/types/unnati';
import { formatCurrencyInr } from '@/lib/workerIntelligence';

export interface WorkerEarningsOverviewProps {
  intelligence: WorkerEarningsIntelligence;
  className?: string;
}

export const WorkerEarningsOverview: React.FC<WorkerEarningsOverviewProps> = ({
  intelligence,
  className
}) => {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all_time'>('today');

  const { earnings, jobs } = intelligence;

  const currentDisplayAmount =
    timeframe === 'today'
      ? earnings.today
      : timeframe === 'week'
      ? earnings.week
      : timeframe === 'month'
      ? earnings.month
      : earnings.all_time;

  const timeframeLabels: Record<typeof timeframe, { en: string; hi: string }> = {
    today: { en: "Today's Direct Earnings", hi: 'आज की सीधी कमाई' },
    week: { en: 'This Week (7 Days)', hi: 'इस सप्ताह (7 दिन)' },
    month: { en: 'This Month (30 Days)', hi: 'इस महीने (30 दिन)' },
    all_time: { en: 'All-Time Direct Earnings', hi: 'कुल आज तक की कमाई' },
  };

  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6',
        className
      )}
    >
      {/* Top Banner: Timeframe Switcher & Zero Escrow Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Direct Craftsman Earnings
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
            {timeframeLabels[timeframe].en}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              ({timeframeLabels[timeframe].hi})
            </span>
          </h2>
        </div>

        {/* Timeframe Toggle Buttons */}
        <div
          className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl self-start sm:self-auto border border-slate-200 dark:border-slate-700"
          role="tablist"
          aria-label="Earnings timeframe"
        >
          {(['today', 'week', 'month', 'all_time'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={timeframe === t}
              onClick={() => setTimeframe(t)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 capitalize',
                timeframe === t
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Number: Large Readable Figures */}
      <div className="bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 p-6 rounded-3xl border border-emerald-200/60 dark:border-emerald-800/40 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
            Direct Customer Payouts Received (सीधा भुगतान)
          </span>
          <div className="text-4xl sm:text-5xl font-black text-emerald-700 dark:text-emerald-400 mt-1 tracking-tight">
            {formatCurrencyInr(currentDisplayAmount)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            100% credited directly to your UPI/bank account with zero deductions.
          </p>
        </div>

        {/* Zero Escrow Guarantee Pill */}
        <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Platform-Held Balance
          </div>
          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
            ₹0.00 (Zero Middleman Escrow)
          </div>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Completed Jobs & Average */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Completed Visits (पूर्ण कार्य)
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {jobs.completed}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Avg: <span className="font-bold text-slate-700 dark:text-slate-200">₹{earnings.average_per_job}</span> / job
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Pending Verification
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            ₹{earnings.pending_amount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {earnings.pending_count} visit awaiting confirmation
          </div>
        </div>

        {/* Collective Bookings Earnings */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            Collective Crew Work
          </span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            ₹{earnings.collective_earnings}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Group contract shares
          </div>
        </div>

        {/* Cancellation Compensation */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            Cancellation Safeguard
          </span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            ₹{earnings.cancellation_compensation}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Dispatch compensation credited
          </div>
        </div>
      </div>
    </div>
  );
};
