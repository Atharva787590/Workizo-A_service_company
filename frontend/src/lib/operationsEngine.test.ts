import { describe, it, expect } from 'vitest';
import {
  maskAadhaar,
  maskPan,
  filterTriagedBookings,
  getBookingStatusBadge,
  calculateSurplusDistribution,
  MOCK_TRIAGED_BOOKINGS
} from './operationsEngine';

describe('UNNATI Operations Engine (Client-Side)', () => {
  describe('Sensitive Data Masking', () => {
    it('masks Aadhaar numbers accurately', () => {
      expect(maskAadhaar('123456789012')).toBe('XXXX-XXXX-9012');
      expect(maskAadhaar('1234 5678 9012')).toBe('XXXX-XXXX-9012');
      expect(maskAadhaar(null)).toBe('Not Provided');
      expect(maskAadhaar('123')).toBe('XXXX-XXXX-XXXX');
    });

    it('masks PAN numbers accurately', () => {
      expect(maskPan('ABCDE1234F')).toBe('XXXXX1234F');
      expect(maskPan(null)).toBe('Not Provided');
      expect(maskPan('ABC')).toBe('XXXXXXXXXX');
    });
  });

  describe('Booking Operational Triage', () => {
    it('filters LIVE_ACTIVE tasks', () => {
      const live = filterTriagedBookings(MOCK_TRIAGED_BOOKINGS, 'LIVE_ACTIVE');
      expect(live.length).toBe(1);
      expect(live[0].id).toBe(101);
    });

    it('filters UNASSIGNED tasks', () => {
      const unassigned = filterTriagedBookings(MOCK_TRIAGED_BOOKINGS, 'UNASSIGNED');
      expect(unassigned.length).toBe(1);
      expect(unassigned[0].id).toBe(102);
    });

    it('filters DELAYED_PROBLEMATIC tasks', () => {
      const delayed = filterTriagedBookings(MOCK_TRIAGED_BOOKINGS, 'DELAYED_PROBLEMATIC');
      expect(delayed.length).toBe(1);
      expect(delayed[0].id).toBe(102);
    });

    it('filters COLLECTIVE_SHG tasks', () => {
      const collective = filterTriagedBookings(MOCK_TRIAGED_BOOKINGS, 'COLLECTIVE_SHG');
      expect(collective.length).toBe(1);
      expect(collective[0].id).toBe(103);
    });

    it('filters DISPUTED tasks', () => {
      const disputed = filterTriagedBookings(MOCK_TRIAGED_BOOKINGS, 'DISPUTED');
      expect(disputed.length).toBe(1);
      expect(disputed[0].id).toBe(104);
    });

    it('matches search keywords across customer and service', () => {
      const searchRes = filterTriagedBookings(MOCK_TRIAGED_BOOKINGS, 'ALL', 'Solar');
      expect(searchRes.length).toBe(1);
      expect(searchRes[0].id).toBe(103);
    });
  });

  describe('Cooperative Economics Calculations', () => {
    it('calculates cooperative surplus and dividend pools accurately', () => {
      const econ = calculateSurplusDistribution(200000, 0.05);
      expect(econ.total_cooperative_turnover).toBe(200000);
      expect(econ.cooperative_surplus_generated).toBe(10000);
      expect(econ.allocations.patronage_dividend_pool).toBe(4000);
      expect(econ.allocations.welfare_and_tools_pool).toBe(3500);
      expect(econ.allocations.operational_reserve_pool).toBe(2500);
    });
  });

  describe('Status Badges', () => {
    it('returns appropriate bilingual badges', () => {
      const inProg = getBookingStatusBadge('in_progress');
      expect(inProg.label).toContain('कार्यरत');
      expect(inProg.bg).toContain('emerald');

      const searching = getBookingStatusBadge('searching');
      expect(searching.label).toContain('असाइन लंबित');
    });
  });
});
