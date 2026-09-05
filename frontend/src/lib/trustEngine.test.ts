import { describe, it, expect } from 'vitest';
import {
  maskAadhaar,
  maskPan,
  canUserRateBooking,
  checkSuspiciousRatingPattern,
  validateEndorsementRule,
  getVerificationBadgeMeta
} from './trustEngine';

describe('UNNATI Trust, Verification & Two-Way Rating Engine', () => {
  describe('1. Sensitive Data Protection (Aadhaar & PAN Masking)', () => {
    it('masks 12-digit Indian Aadhaar number correctly', () => {
      expect(maskAadhaar('123456789012')).toBe('XXXX-XXXX-9012');
      expect(maskAadhaar('987654321099')).toBe('XXXX-XXXX-1099');
    });

    it('handles empty, null, or malformed Aadhaar safely without leaking digits', () => {
      expect(maskAadhaar(null)).toBe('Not Provided');
      expect(maskAadhaar('')).toBe('Not Provided');
      expect(maskAadhaar('123')).toBe('XXXX-XXXX-XXXX');
    });

    it('masks 10-digit Indian PAN number correctly', () => {
      expect(maskPan('ABCDE1234F')).toBe('XXXXX1234F');
      expect(maskPan('BKWPR9999Z')).toBe('XXXXX9999Z');
    });

    it('handles empty or malformed PAN safely', () => {
      expect(maskPan(null)).toBe('Not Provided');
      expect(maskPan('INVALID')).toBe('XXXXXXXXXX');
    });
  });

  describe('2. Two-Way Rating Eligibility & Duplicate Prevention', () => {
    it('allows customer to rate a completed booking', () => {
      const res = canUserRateBooking('completed', 'customer', false);
      expect(res.eligible).toBe(true);
    });

    it('allows worker/captain to rate a completed booking', () => {
      const res = canUserRateBooking('completed', 'worker', false);
      expect(res.eligible).toBe(true);
    });

    it('rejects ratings before job completion', () => {
      const resSearching = canUserRateBooking('searching', 'customer', false);
      expect(resSearching.eligible).toBe(false);
      expect(resSearching.reason).toContain('marked COMPLETED');

      const resInProgress = canUserRateBooking('in_progress', 'customer', false);
      expect(resInProgress.eligible).toBe(false);
    });

    it('prevents duplicate ratings from the same rater', () => {
      const res = canUserRateBooking('completed', 'customer', true);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('already submitted an evaluation');
    });

    it('rejects unauthorized roles from submitting ratings', () => {
      const res = canUserRateBooking('completed', 'admin', false);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('Only the customer or service provider');
    });
  });

  describe('3. Anti-Bias Protection & Suspicious Rating Detection', () => {
    it('passes normal balanced ratings without flagging', () => {
      const res = checkSuspiciousRatingPattern(5, { craftsmanship: 5, punctuality: 4, conduct: 5 }, false);
      expect(res.isSuspicious).toBe(false);
    });

    it('flags retaliatory 1-star ratings submitted during an active dispute', () => {
      const res = checkSuspiciousRatingPattern(1, { craftsmanship: 1, punctuality: 1 }, true);
      expect(res.isSuspicious).toBe(true);
      expect(res.reason).toContain('retaliatory');
    });

    it('flags contradiction where overall rating is 1-star but category ratings are all 5-stars', () => {
      const res = checkSuspiciousRatingPattern(1, { craftsmanship: 5, punctuality: 5, conduct: 5 }, false);
      expect(res.isSuspicious).toBe(true);
      expect(res.reason).toContain('contradicts');
    });

    it('flags contradiction where overall rating is 5-star but category ratings are all 1-stars', () => {
      const res = checkSuspiciousRatingPattern(5, { craftsmanship: 1, punctuality: 1, conduct: 1 }, false);
      expect(res.isSuspicious).toBe(true);
      expect(res.reason).toContain('contradicts');
    });
  });

  describe('4. Peer Endorsement Governance Rules', () => {
    it('blocks self-endorsement strictly', () => {
      const res = validateEndorsementRule(42, 42, true, 'Electrical Wiring', []);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Self-endorsement is prohibited');
    });

    it('blocks unverified members from issuing endorsements', () => {
      const res = validateEndorsementRule(10, 42, false, 'Plumbing', []);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Only verified cooperative members');
    });

    it('blocks duplicate endorsement of the same skill from the same endorser', () => {
      const res = validateEndorsementRule(10, 42, true, 'Plumbing', ['Plumbing', 'Carpentry']);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('already endorsed');
    });

    it('allows valid peer endorsement for a new verified skill', () => {
      const res = validateEndorsementRule(10, 42, true, 'Solar Installation', ['Plumbing']);
      expect(res.valid).toBe(true);
    });
  });

  describe('5. Verification State Distinctions without Fabrication', () => {
    it('correctly labels VERIFIED status', () => {
      const meta = getVerificationBadgeMeta('VERIFIED');
      expect(meta.isVerified).toBe(true);
      expect(meta.label).toContain('Verified');
      expect(meta.colorClass).toContain('emerald');
    });

    it('correctly labels PENDING status', () => {
      const meta = getVerificationBadgeMeta('PENDING');
      expect(meta.isVerified).toBe(false);
      expect(meta.label).toContain('Pending');
      expect(meta.colorClass).toContain('amber');
    });

    it('correctly labels NOT_SUBMITTED status', () => {
      const meta = getVerificationBadgeMeta('NOT_SUBMITTED');
      expect(meta.isVerified).toBe(false);
      expect(meta.label).toContain('Not Submitted');
    });

    it('correctly labels DEMO_UNVERIFIED without claiming real government authentication', () => {
      const meta = getVerificationBadgeMeta('DEMO_UNVERIFIED');
      expect(meta.isVerified).toBe(false);
      expect(meta.label).toContain('Demo');
      expect(meta.colorClass).toContain('purple');
    });
  });
});
