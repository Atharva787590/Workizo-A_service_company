import React, { useState } from 'react';
import {
  Star,
  ShieldCheck,
  X,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TwoWayRatingType } from '@/types/trust';
import { checkSuspiciousRatingPattern } from '@/lib/trustEngine';
import api from '@/services/api';
import toast from 'react-hot-toast';

export interface TwoWayRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  ratingType: TwoWayRatingType;
  rateeName: string;
  onRatingSubmitted?: (ratingData: any) => void;
  className?: string;
}

export const TwoWayRatingModal: React.FC<TwoWayRatingModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  ratingType,
  rateeName,
  onRatingSubmitted,
  className
}) => {
  const isCustomerRatingWorker = ratingType === 'CUSTOMER_TO_WORKER';

  const [overallRating, setOverallRating] = useState<number>(5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  // Category scores
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>(
    isCustomerRatingWorker
      ? { craftsmanship: 5, punctuality: 5, conduct: 5, cleanliness: 5 }
      : { fair_treatment: 5, payment_promptness: 5, safe_environment: 5, clear_communication: 5 }
  );

  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const categories = isCustomerRatingWorker
    ? [
        { key: 'craftsmanship', label: 'Craftsmanship & Quality (काम की गुणवत्ता)' },
        { key: 'punctuality', label: 'Punctuality & Arrival (समय की पाबंदी)' },
        { key: 'conduct', label: 'Professional Conduct (सभ्य व्यवहार)' },
        { key: 'cleanliness', label: 'Cleanliness & Safety (सफाई और सुरक्षा)' },
      ]
    : [
        { key: 'fair_treatment', label: 'Fair Treatment & Respect (सम्मानजनक व्यवहार)' },
        { key: 'payment_promptness', label: 'Direct Payment Promptness (सीधा भुगतान तत्परता)' },
        { key: 'safe_environment', label: 'Workplace Safety (सुरक्षित कार्यस्थल)' },
        { key: 'clear_communication', label: 'Clear Scope Communication (स्पष्ट संवाद)' },
      ];

  const handleCategoryChange = (key: string, value: number) => {
    setCategoryScores((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Pre-flight anti-bias inspection check
      const biasCheck = checkSuspiciousRatingPattern(overallRating, categoryScores);
      if (biasCheck.isSuspicious) {
        toast('Rating submitted. Our Cooperative Governance Board will review the feedback pattern.', {
          icon: '🛡️',
        });
      }

      const res = await api.post('/api/workers/two-way-rate/', {
        booking_id: bookingId,
        overall_rating: overallRating,
        category_scores: categoryScores,
        review: reviewText,
      });

      toast.success('Evaluation submitted successfully!');
      onRatingSubmitted?.(res.data);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to submit rating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Two-Way Service Evaluation"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4',
        className
      )}
    >
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {isCustomerRatingWorker ? 'Worker Evaluation' : 'Customer Evaluation'}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isCustomerRatingWorker ? `Rate Craftsman: ${rateeName}` : `Rate Customer: ${rateeName}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Rating Modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main 5-Star Rating */}
          <div className="text-center space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
              Overall Experience (समग्र अनुभव)
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoveredStar ?? overallRating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(null)}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    className="p-1 hover:scale-125 transition duration-150"
                  >
                    <Star
                      className={cn(
                        'w-9 h-9',
                        filled
                          ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                          : 'text-slate-300 dark:text-slate-600'
                      )}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {overallRating === 5
                ? 'Excellent (उत्कृष्ट)'
                : overallRating === 4
                ? 'Very Good (बहुत अच्छा)'
                : overallRating === 3
                ? 'Average (सामान्य)'
                : overallRating === 2
                ? 'Below Average (संतोषजनक नहीं)'
                : 'Poor (खराब)'}
            </span>
          </div>

          {/* Category-Specific Scores */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              Category Breakdown (श्रेणीवार अंक)
            </span>

            {categories.map((cat) => {
              const currentScore = categoryScores[cat.key] || 5;
              return (
                <div key={cat.key} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {cat.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleCategoryChange(cat.key, s)}
                        className="p-0.5 hover:scale-110 transition"
                      >
                        <Star
                          className={cn(
                            'w-4 h-4',
                            s <= currentScore
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Optional Written Review */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              Written Review (वैकल्पिक टिप्पणी)
            </label>
            <textarea
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="काम या अनुभव के बारे में संक्षेप में बताएं..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Anti-Bias Notice */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <b>Anti-Bias Protection:</b> Ratings are protected by the UNNATI Peer Governance Shield.
              Retaliatory or abusive feedback is investigated by the Cooperative Review Board.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Evaluation (मूल्यांकन जमा करें)'}
          </button>
        </form>
      </div>
    </div>
  );
};
