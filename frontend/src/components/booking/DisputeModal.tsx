import React, { useState, useEffect } from 'react';
import { Scale, X, HelpCircle } from 'lucide-react';

export interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  bookingId: number;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  bookingId,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!reason.trim() || reason.trim().length < 10) {
      setError('Please provide a detailed explanation (minimum 10 characters).');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register dispute';
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
        aria-labelledby="dispute-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 focus:outline-none"
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Scale className="w-5 h-5" />
            <h3 id="dispute-title" className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Raise Dispute #{bookingId}
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

        <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
          <div className="flex items-center gap-2 font-bold mb-1">
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span>Cooperative Dispute Arbitration (सहकारी मध्यस्थता)</span>
          </div>
          <p>
            UNNATI maintains a democratic peer committee to fairly arbitrate disputes between customers and craftsmen. Funds will be held securely until both parties reach mutual resolution.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="dispute-reason" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Detailed Reason for Dispute *
            </label>
            <textarea
              id="dispute-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe what occurred, service discrepancies, or concerns..."
              className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="unnati-touch-target px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit to Committee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisputeModal;
