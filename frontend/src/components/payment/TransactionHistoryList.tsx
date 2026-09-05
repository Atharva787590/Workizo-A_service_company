import React from 'react';
import { History, ArrowDownRight, ArrowUpRight, ShieldCheck, RefreshCw, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentTransactionRecord } from '@/types/unnati';

export interface TransactionHistoryListProps {
  transactions: PaymentTransactionRecord[];
  className?: string;
  loading?: boolean;
}

export const TransactionHistoryList: React.FC<TransactionHistoryListProps> = ({
  transactions,
  className,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className={cn('p-6 text-center text-slate-500 space-y-2', className)}>
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600" />
        <p className="text-xs">Loading transaction records...</p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className={cn('p-6 text-center text-slate-400 dark:text-slate-500 space-y-1', className)}>
        <History className="w-6 h-6 mx-auto opacity-40 mb-1" />
        <p className="text-xs font-medium">No financial transactions recorded yet.</p>
        <p className="text-[11px] opacity-75">Transactions will appear upon direct payment initiation.</p>
      </div>
    );
  }

  const getTxTypeBadge = (type: PaymentTransactionRecord['transactionType']) => {
    switch (type) {
      case 'CUSTOMER_DIRECT_PAYMENT':
        return {
          icon: <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Customer Payment',
          color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200'
        };
      case 'WORKER_PAYOUT_SHARE':
        return {
          icon: <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />,
          label: 'Worker Payout',
          color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200'
        };
      case 'COOPERATIVE_ALLOCATION':
        return {
          icon: <Award className="w-3.5 h-3.5 text-purple-600" />,
          label: 'Coop Dividend Reserve',
          color: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200'
        };
      case 'CANCELLATION_COMPENSATION':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Worker Compensation',
          color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200'
        };
      case 'REFUND':
        return {
          icon: <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />,
          label: 'Direct Refund',
          color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200'
        };
      default:
        return {
          icon: <History className="w-3.5 h-3.5 text-slate-500" />,
          label: 'Adjustment',
          color: 'text-slate-700 dark:text-slate-300 bg-slate-50 border-slate-200'
        };
    }
  };

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-4 h-4 text-emerald-600" />
          Immutable Transaction Ledger (लेनदेन विवरण)
        </h4>
        <span className="text-[10px] text-slate-400">
          {transactions.length} record{transactions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2">
        {transactions.map((tx) => {
          const badge = getTxTypeBadge(tx.transactionType);
          return (
            <div
              key={tx.id}
              className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs flex items-center justify-between transition hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                  {badge.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {badge.label}
                    </span>
                    {tx.isMock && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        Demo
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {tx.senderName ? `${tx.senderName} → ` : ''}
                    {tx.recipientName || 'Cooperative Pool'} •{' '}
                    {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  ₹{tx.amount.toFixed(2)}
                </span>
                <span className="block text-[10px] text-slate-400 capitalize">
                  {tx.paymentMethod.replace('_', ' ').toLowerCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
