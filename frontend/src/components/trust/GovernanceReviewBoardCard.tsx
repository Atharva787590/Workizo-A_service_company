import React, { useState } from 'react';
import {
  Scale,
  CheckCircle2,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GovernanceCaseRecord } from '@/types/trust';
import api from '@/services/api';
import toast from 'react-hot-toast';

export interface GovernanceReviewBoardCardProps {
  cases: GovernanceCaseRecord[];
  onCaseResolved?: (caseId: string) => void;
  className?: string;
}

export const GovernanceReviewBoardCard: React.FC<GovernanceReviewBoardCardProps> = ({
  cases,
  onCaseResolved,
  className
}) => {
  const [selectedCase, setSelectedCase] = useState<GovernanceCaseRecord | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResolve = async (caseId: string, decision: 'RESOLVED_UPHELD' | 'RESOLVED_DISMISSED') => {
    if (!resolutionNotes.trim()) {
      toast.error('Please enter resolution notes explaining the decision.');
      return;
    }

    setIsProcessing(true);
    try {
      await api.post(`/api/workers/governance/cases/${caseId}/resolve/`, {
        decision,
        notes: resolutionNotes.trim()
      });

      toast.success(`Case ${caseId} marked ${decision.replace('RESOLVED_', '')}!`);
      setResolutionNotes('');
      setSelectedCase(null);
      onCaseResolved?.(caseId);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to resolve case.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-4 h-4" />
            Cooperative Peer Governance Review Queue
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
            सहकारी समीक्षा मंडल (Disputes & Anti-Bias Board)
          </h3>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 self-start sm:self-auto">
          {cases.filter((c) => c.status === 'OPEN_IN_QUEUE').length} Open Cases
        </span>
      </div>

      {/* Case List */}
      {cases.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No pending disputes or flagged reviews
          </p>
          <p className="text-xs text-slate-500">
            All rating patterns comply with cooperative fairness standards.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => {
            const isOpen = c.status === 'OPEN_IN_QUEUE';
            const isDispute = c.case_type === 'RATING_DISPUTE';

            return (
              <div
                key={c.case_id}
                className={cn(
                  'p-4 rounded-2xl border transition space-y-3',
                  isOpen
                    ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-80'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {c.case_id}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border',
                        isDispute
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      {c.case_type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[11px] font-bold border self-start sm:self-auto',
                      isOpen
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    )}
                  >
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <p>
                    <b>Raised By:</b> {c.raised_by_name}
                  </p>
                  {c.resolution_notes && (
                    <p className="italic text-slate-600 dark:text-slate-400">
                      "{c.resolution_notes}"
                    </p>
                  )}
                </div>

                {/* Immutable Audit Trail Ledger */}
                {c.audit_trail && c.audit_trail.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <History className="w-3 h-3" />
                      Immutable Governance Audit Trail:
                    </span>
                    {c.audit_trail.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-500">
                        <span className="font-mono text-[10px]">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{entry.action}</span>
                        <span>({entry.decision})</span>
                        <span>by {entry.actor_name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reviewer Action Form (Only for open cases) */}
                {isOpen && (
                  <div className="pt-3 border-t border-amber-200/60 dark:border-amber-900/40 space-y-2">
                    <input
                      type="text"
                      value={selectedCase?.case_id === c.case_id ? resolutionNotes : ''}
                      onChange={(e) => {
                        setSelectedCase(c);
                        setResolutionNotes(e.target.value);
                      }}
                      placeholder="Enter resolution notes and rationale..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolve(c.case_id, 'RESOLVED_UPHELD')}
                        disabled={isProcessing}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                      >
                        Upheld Dispute (स्वीकार करें)
                      </button>
                      <button
                        onClick={() => handleResolve(c.case_id, 'RESOLVED_DISMISSED')}
                        disabled={isProcessing}
                        className="px-3 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs shadow-xs transition"
                      >
                        Dismiss Dispute (खारिज करें)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
