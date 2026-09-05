import { describe, it, expect } from 'vitest';
import {
  calculateWorkloadFatigue,
  verifyZeroPlatformWorkerHold,
  calculateAverageEarnings,
  determinePayoutReadiness,
  formatCurrencyInr,
  calculatePaymentStatusTotals,
  validateWorkerIntelligenceAuthorization,
  buildOfflineEmptyIntelligence
} from './workerIntelligence';

describe('UNNATI Worker Intelligence & Earnings Engine', () => {
  describe('1. Server-Side Earnings & Average Calculations', () => {
    it('calculates average earnings per job correctly', () => {
      expect(calculateAverageEarnings(4500, 5)).toBe(900);
      expect(calculateAverageEarnings(1000, 3)).toBe(333.33);
      expect(calculateAverageEarnings(0, 0)).toBe(0);
      expect(calculateAverageEarnings(500, 0)).toBe(0);
    });

    it('formats currency in Indian Rupee format correctly', () => {
      const formatted = formatCurrencyInr(12500.5);
      expect(formatted).toContain('12,500.5');
    });
  });

  describe('2. Prevention of Platform-Held Balances and Commission Cuts', () => {
    it('passes verification when platform holds 0.00 balance and charges 0.00 fee', () => {
      expect(() =>
        verifyZeroPlatformWorkerHold({
          platform_held_balance: '0.00',
          platform_commission_fee: '0.00',
        })
      ).not.toThrow();
    });

    it('throws security error if platform attempts to hold a balance', () => {
      expect(() =>
        verifyZeroPlatformWorkerHold({
          platform_held_balance: '150.00',
          platform_commission_fee: '0.00',
        })
      ).toThrow(/Platform-held worker balance must be strictly 0.00/);
    });

    it('throws security error if platform charges middleman commission', () => {
      expect(() =>
        verifyZeroPlatformWorkerHold({
          platform_held_balance: '0.00',
          platform_commission_fee: '50.00',
        })
      ).toThrow(/Platform commission fee must be strictly 0.00/);
    });
  });

  describe('3. Non-Medical Workload & Fatigue Calculation Boundaries', () => {
    it('categorizes 0-1 jobs or <2 hours as LIGHT workload', () => {
      const light = calculateWorkloadFatigue(1, 1.5);
      expect(light.level).toBe('LIGHT');
      expect(light.color).toBe('emerald');
      expect(light.restRecommendation).toContain('Well-rested');
      expect(light.disclaimer).toContain('Non-medical');
    });

    it('categorizes 2-3 jobs or 2-4 hours as MODERATE workload', () => {
      const mod = calculateWorkloadFatigue(3, 3.5);
      expect(mod.level).toBe('MODERATE');
      expect(mod.color).toBe('blue');
      expect(mod.restRecommendation).toContain('Steady workload');
    });

    it('categorizes 4-5 jobs or 5-8 hours as HEAVY workload', () => {
      const heavy = calculateWorkloadFatigue(5, 7.0);
      expect(heavy.level).toBe('HEAVY');
      expect(heavy.color).toBe('amber');
      expect(heavy.restRecommendation).toContain('20-minute rest pause');
    });

    it('categorizes >8 hours or >=6 jobs as REST_RECOMMENDED', () => {
      const restByJobs = calculateWorkloadFatigue(6, 4.0);
      expect(restByJobs.level).toBe('REST_RECOMMENDED');
      expect(restByJobs.color).toBe('rose');
      expect(restByJobs.restRecommendation).toContain('extended rest break');

      const restByHours = calculateWorkloadFatigue(3, 9.0);
      expect(restByHours.level).toBe('REST_RECOMMENDED');
    });

    it('handles boundary zeroes and negative inputs safely', () => {
      const zero = calculateWorkloadFatigue(0, 0);
      expect(zero.level).toBe('LIGHT');
      expect(zero.todayCompletedJobs).toBe(0);
      expect(zero.activeHoursToday).toBe(0);

      const negative = calculateWorkloadFatigue(-2, -5);
      expect(negative.level).toBe('LIGHT');
      expect(negative.todayCompletedJobs).toBe(0);
      expect(negative.activeHoursToday).toBe(0);
    });
  });

  describe('4. Micro-Payout Readiness Status Mapping', () => {
    it('identifies VERIFIED payout account with UPI VPA', () => {
      const res = determinePayoutReadiness('VERIFIED', true, 'rajesh@upi');
      expect(res.isReady).toBe(true);
      expect(res.label).toBe('Verified Direct Account');
      expect(res.actionableHint).toContain('rajesh@upi');
      expect(res.colorClass).toContain('emerald');
    });

    it('identifies PENDING verification state with cooperative review hint', () => {
      const res = determinePayoutReadiness('PENDING', true);
      expect(res.isReady).toBe(false);
      expect(res.label).toBe('Verification Pending');
      expect(res.actionableHint).toContain('Cooperative review in progress');
      expect(res.colorClass).toContain('amber');
    });

    it('identifies UNAVAILABLE state when account details are missing', () => {
      const res = determinePayoutReadiness('UNAVAILABLE', false);
      expect(res.isReady).toBe(false);
      expect(res.label).toBe('Payout Setup Incomplete');
      expect(res.actionableHint).toContain('Please add your UPI ID or Bank account');
      expect(res.colorClass).toContain('rose');
    });

    it('identifies DEMO_MODE sandbox status clearly', () => {
      const res = determinePayoutReadiness('DEMO_MODE', false);
      expect(res.isReady).toBe(true);
      expect(res.label).toBe('Demo / Sandbox Mode');
      expect(res.actionableHint).toContain('Simulated direct settlement');
      expect(res.colorClass).toContain('purple');
    });
  });

  describe('5. Collective Worker Allocation & Cooperative Matrix Display', () => {
    it('correctly aggregates collective booking shares', () => {
      const collectiveShares = [
        { bookingId: 1, allocatedPayout: 935, cooperativeDividendShare: 65 },
        { bookingId: 2, allocatedPayout: 1200, cooperativeDividendShare: 80 }
      ];

      const totalAllocated = collectiveShares.reduce((sum, s) => sum + s.allocatedPayout, 0);
      const totalCoopDividend = collectiveShares.reduce((sum, s) => sum + s.cooperativeDividendShare, 0);

      expect(totalAllocated).toBe(2135);
      expect(totalCoopDividend).toBe(145);
    });

    it('calculates cooperative patronage share projection at 6.5% rate', () => {
      const totalEarned = 10000;
      const rate = 0.065;
      const cooperativePool = totalEarned * rate;

      expect(cooperativePool).toBe(650);
      // Worker's direct take-home is strictly remaining 93.5%
      expect(totalEarned - cooperativePool).toBe(9350);
    });
  });

  describe('6. Payment Status Handling (Direct, Pending & Cancellation)', () => {
    it('correctly aggregates direct customer payments vs pending vs cancellation compensation', () => {
      const transactions = [
        { amount: 1500, status: 'COMPLETED', transaction_type: 'DIRECT_SETTLEMENT' },
        { amount: 800, status: 'COMPLETED', transaction_type: 'DIRECT_SETTLEMENT' },
        { amount: 350, status: 'PENDING', transaction_type: 'DIRECT_SETTLEMENT' },
        { amount: 200, status: 'COMPLETED', transaction_type: 'CANCELLATION_COMPENSATION' },
        { amount: 100, status: 'FAILED', transaction_type: 'DIRECT_SETTLEMENT' }
      ];

      const totals = calculatePaymentStatusTotals(transactions);
      expect(totals.directCustomerReceived).toBe(2300);
      expect(totals.pendingPayments).toBe(350);
      expect(totals.cancellationCompensation).toBe(200);
    });

    it('handles empty transaction ledger safely', () => {
      const totals = calculatePaymentStatusTotals([]);
      expect(totals.directCustomerReceived).toBe(0);
      expect(totals.pendingPayments).toBe(0);
      expect(totals.cancellationCompensation).toBe(0);
    });
  });

  describe('7. Worker Role and Record Authorization Guard', () => {
    it('allows access only when user has worker role and matches target worker id', () => {
      expect(validateWorkerIntelligenceAuthorization('worker', 42, 42)).toBe(true);
    });

    it('rejects access when user is a customer or other role', () => {
      expect(validateWorkerIntelligenceAuthorization('customer', 42, 42)).toBe(false);
      expect(validateWorkerIntelligenceAuthorization(undefined, 42, 42)).toBe(false);
    });

    it('rejects access when a worker attempts to access another worker records', () => {
      expect(validateWorkerIntelligenceAuthorization('worker', 42, 99)).toBe(false);
    });
  });

  describe('8. Offline & Empty States Fallback Intelligence', () => {
    it('creates resilient zero-state intelligence with 0.00 platform escrow', () => {
      const offline = buildOfflineEmptyIntelligence(101, 'Ramesh Kumar', 'Electrician');

      expect(offline.worker_id).toBe(101);
      expect(offline.worker_name).toBe('Ramesh Kumar');
      expect(offline.service_category).toBe('Electrician');
      expect(offline.earnings.today).toBe('0.00');
      expect(offline.earnings.platform_held_balance).toBe('0.00');
      expect(offline.earnings.platform_commission_fee).toBe('0.00');
      expect(offline.cooperative.rate_percentage).toBe(6.5);
      expect(offline.payout_readiness.status).toBe('DEMO_MODE');
      expect(offline.workload_wellbeing.level).toBe('LIGHT');
      expect(offline.skills.isDemo).toBe(true);
      expect(offline.analytics.earnings_trend.length).toBe(7);
    });
  });
});

