import React from 'react';
import { TransparencyMetrics } from '../../types/catalog';
import { formatLargeInr, formatInr } from '../../lib/catalogEngine';
import { CheckCircle2, Users, IndianRupee, HeartHandshake, ShieldCheck, Scale } from 'lucide-react';

interface TransparencyMetricsCardsProps {
  metrics: TransparencyMetrics;
}

export const TransparencyMetricsCards: React.FC<TransparencyMetricsCardsProps> = ({ metrics }) => {
  return (
    <div className="space-y-6" id="transparency-metrics-section">
      {/* Platform Zero-Commission Guarantee Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black leading-tight">
              0% Platform Commission • 100% Direct Settlement
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
              Customers pay service artisans directly via UPI or cash. Platform holds ₹0.00 escrow and extracts 0% commission.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-950/40 px-3.5 py-1.5 rounded-full border border-emerald-400/30 text-xs font-bold shrink-0">
          <Scale className="w-3.5 h-3.5 text-emerald-300" />
          Democratic Cooperative Guild
        </div>
      </div>

      {/* Aggregate Statistics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Completed Jobs */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed Work</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
            {metrics.total_completed_jobs.toLocaleString('en-IN')}+
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Verified completed service contracts
          </p>
        </div>

        {/* Metric 2: Active Members */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Guild Members</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
            {metrics.active_cooperative_members.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Verified artisans with share units
          </p>
        </div>

        {/* Metric 3: Direct Worker Payouts */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Direct Earnings</span>
            <IndianRupee className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
            {formatLargeInr(metrics.total_direct_worker_earnings_inr)}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Paid directly to workers without cuts
          </p>
        </div>

        {/* Metric 4: Cooperative Welfare Reserve */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Welfare Pool</span>
            <HeartHandshake className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
            {formatInr(metrics.cooperative_welfare_reserve_inr)}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Reserved for medical & accident relief
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransparencyMetricsCards;
