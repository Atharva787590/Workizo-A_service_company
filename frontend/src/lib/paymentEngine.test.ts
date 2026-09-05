import { describe, it, expect } from 'vitest';
import {
  calculateDirectPaymentBreakdown,
  validatePaymentStateTransition,
  calculateDirectCancellationRefund,
  generateUpiIntentUrl,
  verifyZeroPlatformEscrow,
  getPaymentLifecycleProgress,
  UNNATI_COOPERATIVE_RATE
} from './paymentEngine';
import { DirectPaymentBreakdown, PaymentLifecycleStatus } from '../types/unnati';

describe('UNNATI Payment Engine: Direct Service-Provider Payment & Safeguards', () => {
  describe('1. Server-Side Direct Amount Calculations & Cooperative Economics', () => {
    it('calculates single worker direct payout, 6.5% cooperative allocation, and zero platform fee', () => {
      const breakdown = calculateDirectPaymentBreakdown(1000, 1, UNNATI_COOPERATIVE_RATE);

      expect(breakdown.totalCustomerPaid).toBe(1000);
      expect(breakdown.cooperativeAllocation).toBe(65); // 6.5% of 1000
      expect(breakdown.workerDirectPayout).toBe(935);   // 1000 - 65
      expect(breakdown.platformFee).toBe(0.0);
      expect(breakdown.platformEscrowBalance).toBe(0.0);
      expect(breakdown.platformHoldsEscrow).toBe(false);
      expect(breakdown.isCollective).toBe(false);
      expect(breakdown.perWorkerShare).toBe(935);
    });

    it('calculates collective multi-worker allocation accurately across 3 workers', () => {
      const workers = [
        { id: 101, full_name: 'Rajesh Kumar' },
        { id: 102, full_name: 'Amit Patel' },
        { id: 103, full_name: 'Sunil Verma' }
      ];
      const breakdown = calculateDirectPaymentBreakdown(3000, 3, 0.065, 'Rajesh Kumar', 'rajesh@upi', workers);

      expect(breakdown.totalCustomerPaid).toBe(3000);
      expect(breakdown.cooperativeAllocation).toBe(195); // 6.5% of 3000
      expect(breakdown.workerDirectPayout).toBe(2805);  // 3000 - 195
      expect(breakdown.isCollective).toBe(true);
      expect(breakdown.perWorkerShare).toBe(935);       // 2805 / 3 = 935 per worker
      expect(breakdown.workerShares).toHaveLength(3);
      expect(breakdown.workerShares![0].allocatedPayout).toBe(935);
      expect(breakdown.workerShares![0].cooperativeDividendShare).toBe(65); // 195 / 3
    });

    it('handles rounding edge cases without penny leaks in collective bookings', () => {
      // 500 divided by 3 workers
      const breakdown = calculateDirectPaymentBreakdown(500, 3, 0.065);
      expect(breakdown.cooperativeAllocation).toBe(32.5);
      expect(breakdown.workerDirectPayout).toBe(467.5);
      
      const totalWorkerSum = (breakdown.firstWorkerShare || 0) + (breakdown.perWorkerShare * 2);
      expect(Math.abs(totalWorkerSum - breakdown.workerDirectPayout)).toBeLessThan(0.02);
    });
  });

  describe('2. Prevention of Platform-Held / Escrow Balances', () => {
    it('passes verification when platform fee is 0 and escrow is false', () => {
      const validBreakdown: DirectPaymentBreakdown = {
        totalCustomerPaid: 500,
        workerDirectPayout: 467.5,
        cooperativeAllocation: 32.5,
        cooperativeRatePercentage: 6.5,
        platformFee: 0.0,
        platformEscrowBalance: 0.0,
        platformHoldsEscrow: false,
        workerCount: 1,
        perWorkerShare: 467.5,
        workerName: 'Craftsman',
        isCollective: false,
      };

      expect(() => verifyZeroPlatformEscrow(validBreakdown)).not.toThrow();
    });

    it('throws security error if platform attempts to charge a middleman fee', () => {
      const invalidBreakdown: DirectPaymentBreakdown = {
        totalCustomerPaid: 500,
        workerDirectPayout: 400,
        cooperativeAllocation: 50,
        cooperativeRatePercentage: 10,
        platformFee: 50.0, // VIOLATION
        platformEscrowBalance: 0.0,
        platformHoldsEscrow: false,
        workerCount: 1,
        perWorkerShare: 400,
        workerName: 'Craftsman',
        isCollective: false,
      };

      expect(() => verifyZeroPlatformEscrow(invalidBreakdown)).toThrow(
        /Platform fee must be 0.00/
      );
    });

    it('throws security error if platform holds an escrow balance', () => {
      const invalidEscrow = {
        totalCustomerPaid: 500,
        workerDirectPayout: 467.5,
        cooperativeAllocation: 32.5,
        cooperativeRatePercentage: 6.5,
        platformFee: 0.0,
        platformEscrowBalance: 500.0, // VIOLATION
        platformHoldsEscrow: true as false, // VIOLATION
        workerCount: 1,
        perWorkerShare: 467.5,
        workerName: 'Craftsman',
        isCollective: false,
      };

      expect(() => verifyZeroPlatformEscrow(invalidEscrow as DirectPaymentBreakdown)).toThrow(
        /Platform escrow balance must be 0.00/
      );
    });
  });

  describe('3. Payment State Machine Transitions & Authorization', () => {
    it('allows customer to initiate payment from PAYMENT_PENDING', () => {
      const res = validatePaymentStateTransition('PAYMENT_PENDING', 'PAYMENT_INITIATED', 'customer');
      expect(res.valid).toBe(true);
    });

    it('blocks unauthorized worker from initiating customer payment', () => {
      const res = validatePaymentStateTransition('PAYMENT_PENDING', 'PAYMENT_INITIATED', 'worker');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/Only customer or admin/);
    });

    it('allows worker or verified adapter to confirm direct payment receipt', () => {
      const resWorker = validatePaymentStateTransition('PAYMENT_INITIATED', 'PAYMENT_CONFIRMED', 'worker');
      expect(resWorker.valid).toBe(true);

      const resAdapter = validatePaymentStateTransition('PAYMENT_INITIATED', 'PAYMENT_COMPLETED', 'customer', true);
      expect(resAdapter.valid).toBe(true);
    });

    it('prevents customer from self-confirming payment without provider/worker confirmation', () => {
      const res = validatePaymentStateTransition('PAYMENT_INITIATED', 'PAYMENT_COMPLETED', 'customer', false);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/Only service provider/);
    });

    it('blocks illegal transition from PAYMENT_COMPLETED back to PAYMENT_PENDING', () => {
      const res = validatePaymentStateTransition('PAYMENT_COMPLETED', 'PAYMENT_PENDING', 'admin');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/Transition from 'PAYMENT_COMPLETED' to 'PAYMENT_PENDING' is not allowed/);
    });

    it('allows refund initiation from PAYMENT_COMPLETED to REFUND_PENDING', () => {
      const res = validatePaymentStateTransition('PAYMENT_COMPLETED', 'REFUND_PENDING', 'customer');
      expect(res.valid).toBe(true);
    });

    it('allows worker or admin to execute REFUNDED from REFUND_PENDING', () => {
      const resWorker = validatePaymentStateTransition('REFUND_PENDING', 'REFUNDED', 'worker');
      expect(resWorker.valid).toBe(true);

      const resCustomer = validatePaymentStateTransition('REFUND_PENDING', 'REFUNDED', 'customer');
      expect(resCustomer.valid).toBe(false);
      expect(resCustomer.error).toMatch(/Refund must be confirmed by service provider/);
    });
  });

  describe('4. Direct UPI URL Generation', () => {
    it('constructs compliant NPCI UPI intent URI with VPA, payee, amount and booking reference', () => {
      const uri = generateUpiIntentUrl({
        vpa: 'rajesh.electrician@upi',
        payeeName: 'Rajesh Kumar',
        amount: 850.5,
        bookingId: 42,
        ref: 'UNN-42-101'
      });

      expect(uri).toContain('upi://pay?pa=rajesh.electrician@upi');
      expect(uri).toContain('pn=Rajesh%20Kumar');
      expect(uri).toContain('am=850.50');
      expect(uri).toContain('cu=INR');
      expect(uri).toContain('tn=UNNATI-Booking-42');
      expect(uri).toContain('tr=UNN-42-101');
    });
  });

  describe('5. Cancellation Safeguards & Direct Refund Calculations', () => {
    const now = Date.now();

    it('grants 100% full direct refund within the 5-minute grace period', () => {
      const res = calculateDirectCancellationRefund({
        totalAmount: 1200,
        bookingStatus: 'WORKER_ARRIVING',
        createdAt: new Date(now - 2 * 60 * 1000).toISOString(), // 2 minutes ago
        now,
      });

      expect(res.isFree).toBe(true);
      expect(res.workerCompensation).toBe(0);
      expect(res.refundAmount).toBe(1200);
      expect(res.platformRetained).toBe(0);
      expect(res.explanation).toContain('5-minute grace period');
    });

    it('grants 100% full direct refund for scheduled booking cancelled >2 hours in advance', () => {
      const res = calculateDirectCancellationRefund({
        totalAmount: 1500,
        bookingStatus: 'SCHEDULED',
        createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        scheduledTime: new Date(now + 4 * 60 * 60 * 1000).toISOString(), // 4 hours in future
        now,
      });

      expect(res.isFree).toBe(true);
      expect(res.workerCompensation).toBe(0);
      expect(res.refundAmount).toBe(1500);
      expect(res.platformRetained).toBe(0);
    });

    it('allocates ₹100 direct compensation to worker if customer cancels while worker is on the way', () => {
      const res = calculateDirectCancellationRefund({
        totalAmount: 800,
        bookingStatus: 'worker_arriving',
        createdAt: new Date(now - 15 * 60 * 1000).toISOString(), // 15 mins ago
        now,
      });

      expect(res.isFree).toBe(false);
      expect(res.workerCompensation).toBe(100);
      expect(res.refundAmount).toBe(700);
      expect(res.platformRetained).toBe(0);
      expect(res.explanation).toContain('₹100 dispatch compensation');
    });

    it('allocates ₹200 direct compensation to worker if customer cancels after worker arrival on site', () => {
      const res = calculateDirectCancellationRefund({
        totalAmount: 800,
        bookingStatus: 'arrived',
        createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
        now,
      });

      expect(res.isFree).toBe(false);
      expect(res.workerCompensation).toBe(200);
      expect(res.refundAmount).toBe(600);
      expect(res.platformRetained).toBe(0);
      expect(res.explanation).toContain('₹200 on-site compensation');
    });
  });

  describe('6. Lifecycle Visual Progress Metadata', () => {
    it('returns valid progress percentages and bilingual labels for every lifecycle status', () => {
      const statuses: PaymentLifecycleStatus[] = [
        'PAYMENT_PENDING',
        'PAYMENT_INITIATED',
        'PAYMENT_CONFIRMED',
        'PAYMENT_COMPLETED',
        'PAYMENT_FAILED',
        'PAYMENT_CANCELLED',
        'REFUND_PENDING',
        'REFUNDED',
      ];

      statuses.forEach(status => {
        const meta = getPaymentLifecycleProgress(status);
        expect(meta.percent).toBeGreaterThanOrEqual(0);
        expect(meta.percent).toBeLessThanOrEqual(100);
        expect(meta.label).toBeDefined();
        expect(meta.labelHi).toBeDefined();
        expect(meta.colorClass).toBeDefined();
      });
    });
  });
});
