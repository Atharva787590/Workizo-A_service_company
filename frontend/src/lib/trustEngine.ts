/**
 * UNNATI Trust & Two-Way Rating Engine
 * ------------------------------------
 * Pure client-side validation, sensitive identity masking,
 * anti-bias pattern checking, and peer endorsement rules.
 */

import { VerificationState } from '../types/trust';

/**
 * Masks 12-digit Indian Aadhaar number: 'XXXX-XXXX-1234'.
 * Prevents exposing sensitive identity numbers in UI or state.
 */
export function maskAadhaar(aadhaar?: string | null): string {
  if (!aadhaar) return 'Not Provided';
  const clean = String(aadhaar).replace(/\D/g, '');
  if (clean.length !== 12) return 'XXXX-XXXX-XXXX';
  return `XXXX-XXXX-${clean.slice(-4)}`;
}

/**
 * Masks 10-character Indian PAN number: 'XXXXX1234X'.
 */
export function maskPan(pan?: string | null): string {
  if (!pan) return 'Not Provided';
  const clean = String(pan).trim().toUpperCase();
  if (clean.length !== 10) return 'XXXXXXXXXX';
  return `XXXXX${clean.slice(5)}`;
}

/**
 * Verifies whether a user is eligible to rate a completed booking.
 */
export function canUserRateBooking(
  bookingStatus: string,
  userRole: string,
  hasAlreadyRated: boolean
): { eligible: boolean; reason?: string } {
  const normalized = (bookingStatus || '').toLowerCase();
  if (normalized !== 'completed') {
    return {
      eligible: false,
      reason: 'Ratings can only be submitted after the service has been marked COMPLETED.',
    };
  }

  if (userRole !== 'customer' && userRole !== 'worker') {
    return {
      eligible: false,
      reason: 'Only the customer or service provider of this booking can submit an evaluation.',
    };
  }

  if (hasAlreadyRated) {
    return {
      eligible: false,
      reason: 'You have already submitted an evaluation for this booking.',
    };
  }

  return { eligible: true };
}

/**
 * Anti-bias anomaly detector.
 * Detects suspicious rating patterns for cooperative review without deleting legitimate feedback.
 */
export function checkSuspiciousRatingPattern(
  overallRating: number,
  categoryScores: Record<string, number>,
  hasActiveDispute: boolean = false
): { isSuspicious: boolean; reason?: string } {
  // Retaliatory low-rating submitted during dispute
  if (overallRating <= 1 && hasActiveDispute) {
    return {
      isSuspicious: true,
      reason: 'Potential retaliatory rating submitted during an active dispute.',
    };
  }

  // Contradiction: 1-star overall with 5-stars in all categories
  const scores = Object.values(categoryScores);
  if (scores.length > 0) {
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    if (overallRating <= 1 && avg >= 4.5) {
      return {
        isSuspicious: true,
        reason: 'Anomaly: 1-star overall rating contradicts 5-star category ratings.',
      };
    }
    if (overallRating >= 5 && avg <= 1.5) {
      return {
        isSuspicious: true,
        reason: 'Anomaly: 5-star overall rating contradicts 1-star category ratings.',
      };
    }
  }

  return { isSuspicious: false };
}

/**
 * Peer endorsement rules:
 *   - No self-endorsement
 *   - Endorser must be a verified cooperative member
 *   - No duplicate skill endorsement
 */
export function validateEndorsementRule(
  endorserId: number,
  endorseeId: number,
  endorserIsVerified: boolean,
  skillName: string,
  existingSkillsEndorsed: string[] = []
): { valid: boolean; error?: string } {
  if (endorserId === endorseeId) {
    return {
      valid: false,
      error: 'Self-endorsement is prohibited. Only peer cooperative craftspersons can endorse skills.',
    };
  }

  if (!endorserIsVerified) {
    return {
      valid: false,
      error: 'Only verified cooperative members are authorized to endorse peer skills.',
    };
  }

  const cleanSkill = (skillName || '').trim().toLowerCase();
  if (!cleanSkill) {
    return { valid: false, error: 'Please specify a valid skill to endorse.' };
  }

  if (existingSkillsEndorsed.map((s) => s.toLowerCase()).includes(cleanSkill)) {
    return {
      valid: false,
      error: `You have already endorsed this member for '${skillName.trim()}'.`,
    };
  }

  return { valid: true };
}

/**
 * Provider-ready verification state badge styling and honest labeling without fabrication.
 */
export function getVerificationBadgeMeta(state: VerificationState): {
  label: string;
  labelHi: string;
  colorClass: string;
  isVerified: boolean;
} {
  switch (state) {
    case 'VERIFIED':
      return {
        label: 'Verified (सत्यापित)',
        labelHi: 'सत्यापित',
        colorClass:
          'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800',
        isVerified: true,
      };
    case 'PENDING':
      return {
        label: 'Verification Pending (सत्यापन लंबित)',
        labelHi: 'प्रक्रिया में',
        colorClass:
          'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800',
        isVerified: false,
      };
    case 'FAILED':
      return {
        label: 'Verification Failed (अस्वीकृत)',
        labelHi: 'अस्वीकृत',
        colorClass:
          'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800',
        isVerified: false,
      };
    case 'NOT_SUBMITTED':
      return {
        label: 'Not Submitted (जमा नहीं किया)',
        labelHi: 'जमा नहीं',
        colorClass:
          'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:border-slate-700',
        isVerified: false,
      };
    case 'DEMO_UNVERIFIED':
    default:
      return {
        label: 'Sandbox / Demo Unverified (डेमो)',
        labelHi: 'डेमो असत्यापित',
        colorClass:
          'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:border-purple-800',
        isVerified: false,
      };
  }
}
