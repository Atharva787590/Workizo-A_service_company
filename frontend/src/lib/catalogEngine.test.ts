import { describe, it, expect } from 'vitest';
import {
  formatInr,
  formatLargeInr,
  getSocialSecurityStatusBadge,
  verifyZeroPlatformMiddleman,
  assertPrivacySanitized,
  filterClientCatalog,
  FALLBACK_CATALOG_ITEMS,
  MANDATORY_PRICING_DISCLAIMER
} from './catalogEngine';

describe('catalogEngine unit tests', () => {
  describe('filterClientCatalog', () => {
    it('filters services by category correctly', () => {
      const electricians = filterClientCatalog(FALLBACK_CATALOG_ITEMS, '', 'Electrician');
      expect(electricians.length).toBeGreaterThanOrEqual(2);
      expect(electricians.every((i) => i.category === 'Electrician')).toBe(true);
    });

    it('searches services by title, description, and required skills', () => {
      const fanResults = filterClientCatalog(FALLBACK_CATALOG_ITEMS, 'fan', 'all');
      expect(fanResults.length).toBeGreaterThanOrEqual(1);
      expect(fanResults.some((i) => i.name.includes('Fan'))).toBe(true);

      const skillResults = filterClientCatalog(FALLBACK_CATALOG_ITEMS, 'Wiring', 'all');
      expect(skillResults.length).toBeGreaterThanOrEqual(1);
    });

    it('returns all services when query is empty and category is all', () => {
      const all = filterClientCatalog(FALLBACK_CATALOG_ITEMS, '', 'all');
      expect(all.length).toBe(FALLBACK_CATALOG_ITEMS.length);
    });

    it('ensures mandatory pricing disclaimer is present on all fallback items', () => {
      FALLBACK_CATALOG_ITEMS.forEach((item) => {
        expect(item.pricing_disclaimer).toBe(MANDATORY_PRICING_DISCLAIMER);
        expect(item.is_estimated_pricing).toBe(true);
      });
    });
  });

  describe('assertPrivacySanitized', () => {
    it('passes for properly sanitized public provider profile', () => {
      const cleanProfile = {
        id: 101,
        display_name: 'Rameshchandra P.',
        avatar_initials: 'RP',
        service_category: 'Electrician',
        approximate_area: 'Ahmedabad, Gujarat',
        years_of_experience: 5,
        rating: 4.9,
        is_verified: true,
      };
      expect(assertPrivacySanitized(cleanProfile)).toBe(true);
    });

    it('throws error when sensitive phone number is present', () => {
      const leakedProfile = {
        id: 102,
        display_name: 'Suresh K.',
        phone: '+919876543210',
      };
      expect(() => assertPrivacySanitized(leakedProfile)).toThrow(
        /Privacy Violation: Public profile must not contain sensitive field 'phone'/
      );
    });

    it('throws error when exact latitude/longitude or street address is present', () => {
      const leakedGeo = {
        id: 103,
        display_name: 'Dinesh V.',
        latitude: 23.0225,
      };
      expect(() => assertPrivacySanitized(leakedGeo)).toThrow(
        /Privacy Violation: Public profile must not contain sensitive field 'latitude'/
      );

      const leakedAddress = {
        id: 104,
        display_name: 'Dinesh V.',
        address: 'Flat 12, Rosewood Heights',
      };
      expect(() => assertPrivacySanitized(leakedAddress)).toThrow(
        /Privacy Violation: Public profile must not contain sensitive field 'address'/
      );
    });

    it('throws error when financial credentials (bank/pan/aadhaar) are leaked', () => {
      expect(() => assertPrivacySanitized({ id: 1, pan_number: 'ABCDE1234F' })).toThrow(/pan_number/);
      expect(() => assertPrivacySanitized({ id: 1, aadhaar_number: '123456789012' })).toThrow(/aadhaar_number/);
      expect(() => assertPrivacySanitized({ id: 1, bank_account: '9876543210' })).toThrow(/bank_account/);
    });
  });

  describe('verifyZeroPlatformMiddleman', () => {
    it('passes when commission is 0.0% and escrow balance is 0.00', () => {
      expect(() =>
        verifyZeroPlatformMiddleman({
          platform_commission_rate_percent: 0,
          platform_held_escrow_balance_inr: 0,
        })
      ).not.toThrow();
    });

    it('fails when commission is non-zero', () => {
      expect(() =>
        verifyZeroPlatformMiddleman({
          platform_commission_rate_percent: 5.0,
          platform_held_escrow_balance_inr: 0,
        })
      ).toThrow(/UNNATI platform commission must be strictly 0.0%/);
    });

    it('fails when escrow balance is non-zero', () => {
      expect(() =>
        verifyZeroPlatformMiddleman({
          platform_commission_rate_percent: 0,
          platform_held_escrow_balance_inr: 500,
        })
      ).toThrow(/UNNATI platform-held escrow balance must be strictly 0.00/);
    });
  });

  describe('getSocialSecurityStatusBadge', () => {
    it('returns correct visual classes and labels for statuses', () => {
      const active = getSocialSecurityStatusBadge('ACTIVE');
      expect(active.label).toBe('Active & Verified');
      expect(active.color).toBe('emerald');

      const pending = getSocialSecurityStatusBadge('PENDING');
      expect(pending.label).toBe('Verification Pending');
      expect(pending.color).toBe('amber');

      const expired = getSocialSecurityStatusBadge('EXPIRED');
      expect(expired.label).toBe('Renewal Due');
      expect(expired.color).toBe('rose');

      const unverified = getSocialSecurityStatusBadge('UNVERIFIED');
      expect(unverified.label).toBe('Self-Reported Claim');
      expect(unverified.color).toBe('blue');

      const notEnrolled = getSocialSecurityStatusBadge('NOT_ENROLLED');
      expect(notEnrolled.label).toBe('Not Enrolled');
      expect(notEnrolled.color).toBe('slate');
    });
  });

  describe('currency formatting', () => {
    it('formats currency in Indian numbering', () => {
      expect(formatInr(499)).toMatch(/₹\s*499/);
      expect(formatLargeInr(1500000)).toBe('₹15.0 Lakh');
      expect(formatLargeInr(25000000)).toBe('₹2.50 Cr');
    });
  });
});
