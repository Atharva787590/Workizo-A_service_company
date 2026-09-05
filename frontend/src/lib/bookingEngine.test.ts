import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistance,
  verifyArrivalWithinGeofence,
  calculateCancellationSafeguards,
  calculateCollectiveContract,
  mapWorkizoStatusToUnnati,
  getUnnatiLifecycleProgress,
} from './bookingEngine';
import { UnnatiBookingCreateSchema } from '../schemas/unnati';

describe('UNNATI Booking & Scheduling Engine', () => {
  describe('1. Booking Lifecycle State Transitions', () => {
    it('should map legacy and new status values to canonical UNNATI lifecycle', () => {
      expect(mapWorkizoStatusToUnnati('searching')).toBe('REQUESTED');
      expect(mapWorkizoStatusToUnnati('matching')).toBe('MATCHING');
      expect(mapWorkizoStatusToUnnati('accepted')).toBe('ACCEPTED');
      expect(mapWorkizoStatusToUnnati('scheduled')).toBe('SCHEDULED');
      expect(mapWorkizoStatusToUnnati('on_the_way')).toBe('WORKER_ARRIVING');
      expect(mapWorkizoStatusToUnnati('arrived')).toBe('ARRIVED');
      expect(mapWorkizoStatusToUnnati('repair_started')).toBe('IN_PROGRESS');
      expect(mapWorkizoStatusToUnnati('completed')).toBe('COMPLETED');
      expect(mapWorkizoStatusToUnnati('ready_to_complete')).toBe('PAYMENT_RELEASED');
      expect(mapWorkizoStatusToUnnati('cancelled')).toBe('CANCELLED');
      expect(mapWorkizoStatusToUnnati('disputed')).toBe('DISPUTED');
    });

    it('should calculate lifecycle progress percentage accurately', () => {
      expect(getUnnatiLifecycleProgress('searching')).toBe(15);
      expect(getUnnatiLifecycleProgress('accepted')).toBe(30);
      expect(getUnnatiLifecycleProgress('on_the_way')).toBe(50);
      expect(getUnnatiLifecycleProgress('arrived')).toBe(70);
      expect(getUnnatiLifecycleProgress('repair_started')).toBe(85);
      expect(getUnnatiLifecycleProgress('completed')).toBe(100);
    });
  });

  describe('2. Scheduling Limits (Up to 30 Days in Advance)', () => {
    it('should accept a scheduled booking within the next 30 days', () => {
      const validFutureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      const payload = {
        serviceCategoryId: 1,
        bookingType: 'scheduled' as const,
        problemType: 'AC Maintenance',
        problemDescription: 'Seasonal checkup and gas refill',
        address: '402 Sunrise Heights, Drive-In Road',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380054',
        scheduledTime: validFutureDate,
        requiredWorkerCount: 1,
      };

      const result = UnnatiBookingCreateSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject a scheduled booking with date in the past', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const payload = {
        serviceCategoryId: 1,
        bookingType: 'scheduled' as const,
        problemType: 'AC Maintenance',
        problemDescription: 'Seasonal checkup and gas refill',
        address: '402 Sunrise Heights, Drive-In Road',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380054',
        scheduledTime: pastDate,
        requiredWorkerCount: 1,
      };

      const result = UnnatiBookingCreateSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject a scheduled booking exceeding 30 days in advance', () => {
      const farFutureDate = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString();
      const payload = {
        serviceCategoryId: 1,
        bookingType: 'scheduled' as const,
        problemType: 'AC Maintenance',
        problemDescription: 'Seasonal checkup and gas refill',
        address: '402 Sunrise Heights, Drive-In Road',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380054',
        scheduledTime: farFutureDate,
        requiredWorkerCount: 1,
      };

      const result = UnnatiBookingCreateSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('3. Cancellation Safeguards & Progressive Compensation', () => {
    it('should provide free cancellation within the 5-minute grace period', () => {
      const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
      const breakdown = calculateCancellationSafeguards(threeMinutesAgo, null, 'accepted', 300);

      expect(breakdown.isFree).toBe(true);
      expect(breakdown.fee).toBe(0);
      expect(breakdown.workerCompensation).toBe(0);
    });

    it('should provide free cancellation when cancelled > 2 hours before scheduled slot', () => {
      const hoursAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString(); // >5m ago
      const scheduledIn3Hours = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      const breakdown = calculateCancellationSafeguards(hoursAgo, scheduledIn3Hours, 'scheduled', 300);

      expect(breakdown.isFree).toBe(true);
      expect(breakdown.fee).toBe(0);
    });

    it('should apply travel compensation fee when worker is already on the way', () => {
      const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      const breakdown = calculateCancellationSafeguards(twentyMinsAgo, null, 'on_the_way', 500);

      expect(breakdown.isFree).toBe(false);
      expect(breakdown.fee).toBe(100); // 20% of 500 = 100
      expect(breakdown.workerCompensation).toBe(100);
    });

    it('should apply arrival compensation fee when worker has arrived on site', () => {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const breakdown = calculateCancellationSafeguards(thirtyMinsAgo, null, 'arrived', 600);

      expect(breakdown.isFree).toBe(false);
      expect(breakdown.fee).toBe(300); // 50% of 600 = 300
      expect(breakdown.workerCompensation).toBe(300);
    });
  });

  describe('4. Collective Multi-Worker Group Bookings', () => {
    it('should compute total contract value, individual payouts, and cooperative reserve', () => {
      const baseLabour = 400;
      const workersCount = 4;
      const result = calculateCollectiveContract(baseLabour, workersCount);

      expect(result.totalContractValue).toBe(1600); // 400 * 4
      expect(result.cooperativeReserve).toBe(104); // 6.5% of 1600
      expect(result.workerPool).toBe(1496); // 1600 - 104
      expect(result.individualWorkerPayout).toBe(374); // 1496 / 4
    });

    it('should constrain collective worker count between 1 and 10 in schema', () => {
      const validGroup = {
        serviceCategoryId: 2,
        bookingType: 'collective' as const,
        problemType: 'Complete House Wiring',
        problemDescription: 'Full rewiring for 3BHK flat',
        address: 'B-201 Orchid Greens',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380058',
        requiredWorkerCount: 5,
      };
      expect(UnnatiBookingCreateSchema.safeParse(validGroup).success).toBe(true);

      const invalidGroup = {
        ...validGroup,
        requiredWorkerCount: 15, // exceeds 10
      };
      expect(UnnatiBookingCreateSchema.safeParse(invalidGroup).success).toBe(false);
    });
  });

  describe('5. Geo-Fencing & Arrival Radius Verification', () => {
    it('should accurately calculate distance using the Haversine formula', () => {
      // Ahmedabad ISKCON Temple to SG Highway junction (~750m)
      const lat1 = 23.0298;
      const lon1 = 72.5074;
      const lat2 = 23.0335;
      const lon2 = 72.5132;

      const distance = calculateHaversineDistance(lat1, lon1, lat2, lon2);
      expect(distance).toBeGreaterThan(600);
      expect(distance).toBeLessThan(900);
    });

    it('should verify arrival when worker is within configurable arrival radius (e.g. 300m)', () => {
      const jobLat = 23.0225;
      const jobLon = 72.5714;
      // Coordinates ~80m away
      const workerLat = 23.0227;
      const workerLon = 72.5721;

      const verification = verifyArrivalWithinGeofence(jobLat, jobLon, workerLat, workerLon, 300);
      expect(verification.verified).toBe(true);
      expect(verification.distanceMeters).toBeLessThan(300);
    });

    it('should fail arrival verification when worker is outside the arrival radius', () => {
      const jobLat = 23.0225;
      const jobLon = 72.5714;
      // Coordinates ~1.2km away
      const workerLat = 23.0330;
      const workerLon = 72.5790;

      const verification = verifyArrivalWithinGeofence(jobLat, jobLon, workerLat, workerLon, 300);
      expect(verification.verified).toBe(false);
      expect(verification.distanceMeters).toBeGreaterThan(300);
    });
  });

  describe('6. Idempotency & Validation Safeguards', () => {
    it('should accept valid idempotency keys in booking payloads', () => {
      const payload = {
        serviceCategoryId: 1,
        bookingType: 'instant' as const,
        problemType: 'Circuit Tripping',
        problemDescription: 'MCB trips repeatedly when geyser is switched on',
        address: 'Flat 102, Shivalik Residency',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380015',
        requiredWorkerCount: 1,
        idempotencyKey: 'IDEMP-TEST-2026-XYZ99',
      };

      const parsed = UnnatiBookingCreateSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.idempotencyKey).toBe('IDEMP-TEST-2026-XYZ99');
      }
    });
  });
});
