import React from 'react';
import { Award, Info, Users, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkerEarningsIntelligence } from '@/types/unnati';
import { formatCurrencyInr } from '@/lib/workerIntelligence';

export interface CooperativeDividendMatrixProps {
  cooperative: WorkerEarningsIntelligence['cooperative'];
  className?: string;
}

export const CooperativeDividendMatrix: React.FC<CooperativeDividendMatrixProps> = ({
  cooperative,
  className
}) => {
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            Cooperative Profit-Sharing & Patronage Matrix
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
            सहकारी लाभांश एवं संरक्षण कोष (Patronage Dividend)
          </h3>
        </div>
        <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 self-start sm:self-auto">
          {cooperative.rate_percentage}% Cooperative Allocation Rate
        </span>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Contributed */}
        <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/60 space-y-1">
          <span className="text-xs text-purple-800 dark:text-purple-300 font-medium">
            Total Cooperative Contributions (कुल सहकारी अंशदान)
          </span>
          <div className="text-3xl font-black text-purple-900 dark:text-purple-200">
            {formatCurrencyInr(cooperative.total_contribution)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            6.5% allocated from completed service bookings into the member collective pool.
          </p>
        </div>

        {/* Current Patronage Balance */}
        <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/60 space-y-1">
          <span className="text-xs text-teal-800 dark:text-teal-300 font-medium">
            Current Patronage Dividend Entitlement (संरक्षण लाभांश पात्रता)
          </span>
          <div className="text-3xl font-black text-teal-900 dark:text-teal-200">
            {formatCurrencyInr(cooperative.current_patronage_balance)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Accrued based on member hours and peer ratings, disbursed during annual general meetings.
          </p>
        </div>
      </div>

      {/* Collective Work Contribution Note */}
      <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
        <Users className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Collective Bookings Multiplier:</span> Working in multi-craftsman crews accelerates both direct take-home earnings and guild patronage dividend shares.
        </div>
      </div>

      {/* Historical Allocations Table / List */}
      <div className="space-y-2.5 pt-1">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-purple-600" />
          Recent Cooperative Allocation Ledger (हालिया अंशदान)
        </h4>

        {(!cooperative.historical_allocations || cooperative.historical_allocations.length === 0) ? (
          <p className="text-xs text-slate-400 py-2">No historical allocations recorded yet.</p>
        ) : (
          <div className="space-y-1.5">
            {cooperative.historical_allocations.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Booking #{h.booking_id}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-2">{h.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  {h.is_mock && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                      Demo
                    </span>
                  )}
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{Number(h.amount).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Regulatory Transparency Note */}
      <div className="text-[11px] text-slate-400 flex items-start gap-1.5 pt-1">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.2" />
        <span>
          Cooperative allocations represent member patronage distributions governed by the Multi-State Co-operative Societies Act. No fixed financial returns or speculative yields are guaranteed.
        </span>
      </div>
    </div>
  );
};
