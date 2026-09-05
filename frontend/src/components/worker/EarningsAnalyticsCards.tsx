import React from 'react';
import { BarChart3, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkerEarningsIntelligence } from '@/types/unnati';

export interface EarningsAnalyticsCardsProps {
  analytics: WorkerEarningsIntelligence['analytics'];
  jobs: WorkerEarningsIntelligence['jobs'];
  className?: string;
}

export const EarningsAnalyticsCards: React.FC<EarningsAnalyticsCardsProps> = ({
  analytics,
  jobs,
  className
}) => {
  const maxTrendAmount = Math.max(...analytics.earnings_trend.map((d) => d.amount), 100);

  const totalJobs = Math.max(jobs.total, 1);
  const completionPercent = Math.round((jobs.completed / totalJobs) * 100);
  const cancellationPercent = Math.round((jobs.cancelled / totalJobs) * 100);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Transparent Earnings Analytics (कमाई विश्लेषण)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. 7-Day Earnings Trend with Visual Height Bars */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              7-Day Earnings Trend (पिछले 7 दिनों की कमाई)
            </span>
            <span className="text-[11px] text-slate-400">Daily Total</span>
          </div>

          <div className="h-36 flex items-end justify-between gap-2 pt-4 px-1">
            {analytics.earnings_trend.map((day, idx) => {
              const heightPercent = Math.round((day.amount / maxTrendAmount) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition">
                    ₹{day.amount}
                  </span>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-24 flex items-end overflow-hidden">
                    <div
                      className="w-full bg-emerald-500 dark:bg-emerald-600 rounded-t-lg transition-all duration-300 group-hover:bg-emerald-600"
                      style={{ height: `${Math.max(8, heightPercent)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Completed vs Cancelled Work */}
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Service Delivery Reliability (कार्य पूर्णता दर)
            </span>
            <span className="text-[11px] text-slate-400">{jobs.total} Total Bookings</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Completed ({completionPercent}%)
              </div>
              <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
                {jobs.completed}
              </div>
              <div className="text-[10px] text-slate-500">Service delivered & verified</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
                <XCircle className="w-4 h-4 text-rose-600" />
                Cancelled ({cancellationPercent}%)
              </div>
              <div className="text-2xl font-black text-rose-900 dark:text-rose-200">
                {jobs.cancelled}
              </div>
              <div className="text-[10px] text-slate-500">Includes customer cancellations</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" />
              Estimated Active Platform Time:
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              ~{analytics.hours_worked_estimate} Hours
            </span>
          </div>
        </div>
      </div>

      {/* 3. Skill Category Breakdown */}
      {analytics.category_breakdown && analytics.category_breakdown.length > 0 && (
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Completed Visits by Service Category (सेवा श्रेणी अनुसार कार्य)
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {analytics.category_breakdown.map((cat, i) => (
              <div
                key={i}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
              >
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 block truncate">
                  {cat.category}
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {cat.count} <span className="text-[11px] font-normal text-slate-400">jobs</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
