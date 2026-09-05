import React, { useState, useEffect } from 'react';
import { AlertOctagon, X, Clock, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateCancellationSafeguards } from '@/lib/bookingEngine';

export interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  bookingCreatedAt: string;
  scheduledTime?: string | null;
  currentStatus: string;
  baseLabourCharge?: number;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  bookingCreatedAt,
  scheduledTime,
  currentStatus,
  baseLabourCharge = 250,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const breakdown = calculateCancellationSafeguards(
    bookingCreatedAt,
    scheduledTime,
    currentStatus,
    baseLabourCharge
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('Please provide a reason with at least 5 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cancellation failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancellation-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 focus:outline-none"
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertOctagon className="w-5 h-5" />
            <h3 id="cancellation-title" className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Cancel Service Booking
            </h3>
          </div>
          <button
            onClick={onClose}
            className="unnati-touch-target p-2 text-zinc-400 hover:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safeguard Fee Notice */}
        <div
          className={cn(
            'p-3.5 rounded-xl border text-xs leading-relaxed',
            breakdown.isFree
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          )}
        >
          <div className="flex items-center gap-2 font-bold mb-1">
            {breakdown.isFree ? (
              <Clock className="w-4 h-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-600" />
            )}
            <span>
              {breakdown.isFree ? 'Free Cancellation Applicable' : 'Worker Compensation Policy Active'}
            </span>
          </div>
          <p>{breakdown.explanation}</p>
          {!breakdown.isFree && (
            <p className="mt-1 font-semibold">
              Compensation Fee: ₹{breakdown.fee} (Credited directly to the craftsman for time and transit).
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="cancel-reason" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Reason for Cancellation (रद्दीकरण का कारण) *
            </label>
            <textarea
              id="cancel-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Problem solved, reschedule required, emergency..."
              className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="unnati-touch-target px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Keep Booking
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="unnati-touch-target px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-50"
            >
              {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancellationModal;
