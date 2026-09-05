import React from 'react';
import { Users, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateCollectiveContract } from '@/lib/bookingEngine';

export interface CollectiveWorkerSelectorProps {
  workerCount: number;
  baseLabourCharge?: number;
  onChange: (count: number) => void;
  className?: string;
}

export const CollectiveWorkerSelector: React.FC<CollectiveWorkerSelectorProps> = ({
  workerCount,
  baseLabourCharge = 250,
  onChange,
  className,
}) => {
  const count = Math.max(2, Math.min(10, workerCount));
  const contract = calculateCollectiveContract(baseLabourCharge, count);

  const handleDecrement = () => {
    if (count > 2) onChange(count - 1);
  };

  const handleIncrement = () => {
    if (count < 10) onChange(count + 1);
  };

  return (
    <div className={cn('p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
            <Users className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Collective Multi-Worker Contract
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              सामूहिक अनुबंध • Unified work order with pooled fair payout
            </p>
          </div>
        </div>
      </div>

      {/* Stepper / Counter */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
        <div>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
            Craftsmen Required (श्रमिकों की संख्या)
          </span>
          <span className="text-[11px] text-zinc-500">Min 2, Max 10 craftsmen</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={count <= 2}
            className="unnati-touch-target p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Decrease worker count"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-lg font-black text-zinc-900 dark:text-zinc-100 w-8 text-center" aria-live="polite">
            {count}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={count >= 10}
            className="unnati-touch-target p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Increase worker count"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transparent Cooperative Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <span className="text-zinc-500 block text-[11px]">Total Contract Value</span>
          <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            ₹{contract.totalContractValue.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <span className="text-emerald-800 dark:text-emerald-300 block text-[11px]">Individual Payout (Each)</span>
          <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">
            ₹{contract.individualWorkerPayout.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
          <span className="text-blue-800 dark:text-blue-300 block text-[11px]">Coop Reserve (6.5%)</span>
          <span className="text-base font-bold text-blue-700 dark:text-blue-300">
            ₹{contract.cooperativeReserve.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CollectiveWorkerSelector;
