import React, { useState } from 'react';
import { PiggyBank, TrendingUp, HeartHandshake, Percent, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PatronageDividendSummaryProps {
  dividendEarned?: number;
  projectedAnnualDividend?: number;
  platformTakeRate?: number; // e.g., 6.5 (%)
  aggregatorFeeComparison?: number; // e.g., 25 (%)
  welfareContribution?: number;
  emergencyFundEligible?: boolean;
  className?: string;
}

export const PatronageDividendSummary: React.FC<PatronageDividendSummaryProps> = ({
  dividendEarned = 3450,
  projectedAnnualDividend = 14200,
  platformTakeRate = 6.5,
  aggregatorFeeComparison = 25.0,
  welfareContribution = 680,
  emergencyFundEligible = true,
  className,
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  const savingsPercentage = (aggregatorFeeComparison - platformTakeRate).toFixed(1);

  return (
    <div
      className={cn(
        'w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs transition-colors',
        className
      )}
      role="region"
      aria-label="Cooperative Profit Share and Patronage Dividend Summary"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
            <PiggyBank className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Cooperative Dividend & Welfare
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              सहकारी लाभांश एवं कल्याण कोष • Transparent cooperative surplus share
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="unnati-touch-target text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-2 py-1"
          aria-expanded={showExplanation}
          aria-controls="dividend-explanation-panel"
        >
          <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>How it works</span>
          {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Explanatory Collapsible Note */}
      {showExplanation && (
        <div
          id="dividend-explanation-panel"
          className="my-3 p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 leading-relaxed"
        >
          <p className="font-semibold mb-1">
            🌱 What is a Patronage Dividend (सहकारी लाभांश)?
          </p>
          <p>
            Unlike traditional aggregators that take 20-30% of your earnings for private profit, UNNATI operates as a cooperative. Platform operating costs are capped at <strong>{platformTakeRate}%</strong>, and all surplus revenue is credited directly back to active workers based on the service jobs you deliver!
          </p>
        </div>
      )}

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
        {/* Metric 1: Accrued Dividend */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Accrued Dividend (अर्जित लाभांश)
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              ₹{dividendEarned.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">
            Est. Annual: ₹{projectedAnnualDividend.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Metric 2: Transparent Take-Rate Savings */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
              Fair Take Rate (प्लेटफ़ॉर्म शुल्क)
            </span>
            <Percent className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-700 dark:text-blue-300">
              {platformTakeRate}%
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              vs {aggregatorFeeComparison}% industry avg
            </span>
          </div>
          <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80 mt-1">
            You keep <strong>+{savingsPercentage}%</strong> more per job
          </p>
        </div>

        {/* Metric 3: Welfare Pool Contribution */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              Welfare Pool (कल्याण सुरक्षा कोष)
            </span>
            <HeartHandshake className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-700 dark:text-amber-300">
              ₹{welfareContribution.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-800/90 dark:text-amber-300/90">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>{emergencyFundEligible ? 'Eligible for Emergency Relief' : 'Accruing Benefits'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatronageDividendSummary;
