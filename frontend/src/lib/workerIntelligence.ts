/**
 * UNNATI Worker Intelligence Engine
 * ---------------------------------
 * Pure client-side calculations, formatting utilities, and non-medical fatigue boundaries.
 */

import {
  PayoutReadinessStatus,
  WorkloadLevel,
  WorkloadWellbeing,
  WorkerEarningsIntelligence
} from '../types/unnati';

/**
 * Calculates non-medical workload indicator based strictly on platform activity.
 * Does NOT diagnose medical conditions.
 */
export function calculateWorkloadFatigue(
  completedJobsToday: number,
  activeHoursToday: number
): WorkloadWellbeing {
  const safeJobs = Math.max(0, completedJobsToday);
  const safeHours = Math.max(0, activeHoursToday);

  let level: WorkloadLevel = 'LIGHT';
  let label = 'Light Workload';
  let labelHi = 'हल्का कार्यभार';
  let color = 'emerald';
  let restRecommendation = 'Well-rested and ready for incoming service bookings.';

  if (safeHours > 8.0 || safeJobs >= 6) {
    level = 'REST_RECOMMENDED';
    label = 'Heavy Workload — Rest Recommended';
    labelHi = 'अधिक कार्यभार — विश्राम की सलाह';
    color = 'rose';
    restRecommendation = 'You have completed 6+ service visits today. Please take an extended rest break and hydrate.';
  } else if (safeHours >= 5.0 || safeJobs >= 4) {
    level = 'HEAVY';
    label = 'Active Workload';
    labelHi = 'सक्रिय कार्यभार';
    color = 'amber';
    restRecommendation = 'Good progress! Consider a 20-minute rest pause between your upcoming visits.';
  } else if (safeHours >= 2.0 || safeJobs >= 2) {
    level = 'MODERATE';
    label = 'Moderate Workload';
    labelHi = 'मध्यम कार्यभार';
    color = 'blue';
    restRecommendation = 'Steady workload pace. Remember to stay hydrated.';
  }

  return {
    level,
    label,
    labelHi,
    color,
    todayCompletedJobs: safeJobs,
    activeHoursToday: safeHours,
    restRecommendation,
    disclaimer: 'Non-medical platform activity indicator based on completed service jobs.',
  };
}

/**
 * Verifies strictly that platform does not hold worker funds or charge commission.
 */
export function verifyZeroPlatformWorkerHold(earnings: {
  platform_held_balance?: string;
  platform_commission_fee?: string;
}): void {
  const balance = parseFloat(earnings.platform_held_balance || '0.00');
  const commission = parseFloat(earnings.platform_commission_fee || '0.00');

  if (balance !== 0.0) {
    throw new Error('Security Violation: Platform-held worker balance must be strictly 0.00 in UNNATI.');
  }
  if (commission !== 0.0) {
    throw new Error('Security Violation: Platform commission fee must be strictly 0.00 in UNNATI.');
  }
}

/**
 * Formats currency in Indian numbering system.
 */
export function formatCurrencyInr(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Computes average earnings per completed service visit.
 */
export function calculateAverageEarnings(totalEarnings: number, completedJobs: number): number {
  if (completedJobs <= 0) return 0;
  return Math.round((totalEarnings / completedJobs) * 100) / 100;
}

/**
 * Returns accessible metadata for micro-payout readiness states.
 */
export function determinePayoutReadiness(
  status: PayoutReadinessStatus,
  bankConfigured: boolean,
  upiVpa?: string | null
): {
  label: string;
  labelHi: string;
  colorClass: string;
  actionableHint: string;
  isReady: boolean;
} {
  const accountType = upiVpa ? `UPI (${upiVpa})` : bankConfigured ? 'Direct Bank IFSC' : 'Direct Account';
  switch (status) {
    case 'VERIFIED':
      return {
        label: 'Verified Direct Account',
        labelHi: 'सत्यापित सीधा खाता',
        colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800',
        actionableHint: `Ready for direct settlement via ${accountType}.`,
        isReady: true,
      };
    case 'PENDING':
      return {
        label: 'Verification Pending',
        labelHi: 'सत्यापन प्रक्रिया में',
        colorClass: 'text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800',
        actionableHint: 'Bank/UPI credentials submitted. Cooperative review in progress.',
        isReady: false,
      };
    case 'UNAVAILABLE':
      return {
        label: 'Payout Setup Incomplete',
        labelHi: 'खाता विवरण अधूरा',
        colorClass: 'text-rose-700 bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800',
        actionableHint: 'Please add your UPI ID or Bank account in Profile settings.',
        isReady: false,
      };
    case 'DEMO_MODE':
    default:
      return {
        label: 'Demo / Sandbox Mode',
        labelHi: 'डेमो / टेस्ट मोड',
        colorClass: 'text-purple-700 bg-purple-50 border-purple-300 dark:bg-purple-950/40 dark:border-purple-800',
        actionableHint: 'Simulated direct settlement without live banking credentials.',
        isReady: true,
      };
  }
}

/**
 * Validates that only authorized workers can access their own earnings intelligence.
 * Security rule: Worker can only access their own earnings and payment records.
 */
export function validateWorkerIntelligenceAuthorization(
  userRole: string | undefined,
  currentUserId: number | undefined,
  targetWorkerId: number
): boolean {
  if (!userRole || userRole !== 'worker') {
    return false;
  }
  if (!currentUserId || currentUserId !== targetWorkerId) {
    return false;
  }
  return true;
}

/**
 * Aggregates payment status totals for direct customer payments, pending payouts,
 * and cancellation compensations.
 */
export function calculatePaymentStatusTotals(
  transactions: Array<{
    amount: number | string;
    status: string;
    transaction_type?: string;
  }>
): {
  directCustomerReceived: number;
  pendingPayments: number;
  cancellationCompensation: number;
} {
  let directCustomerReceived = 0;
  let pendingPayments = 0;
  let cancellationCompensation = 0;

  for (const tx of transactions) {
    const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) || 0 : tx.amount || 0;
    if (tx.status === 'COMPLETED') {
      if (tx.transaction_type === 'CANCELLATION_COMPENSATION') {
        cancellationCompensation += amount;
      } else {
        directCustomerReceived += amount;
      }
    } else if (tx.status === 'PENDING' || tx.status === 'INITIATED') {
      pendingPayments += amount;
    }
  }

  return {
    directCustomerReceived: Math.round(directCustomerReceived * 100) / 100,
    pendingPayments: Math.round(pendingPayments * 100) / 100,
    cancellationCompensation: Math.round(cancellationCompensation * 100) / 100,
  };
}

/**
 * Builds safe offline / empty state intelligence when worker has no network or empty records.
 */
export function buildOfflineEmptyIntelligence(
  workerId: number,
  workerName: string,
  serviceCategory: string = 'Craftsman'
): WorkerEarningsIntelligence {
  const wellbeing = calculateWorkloadFatigue(0, 0);
  return {
    worker_id: workerId,
    worker_name: workerName,
    service_category: serviceCategory,
    earnings: {
      today: '0.00',
      week: '0.00',
      month: '0.00',
      all_time: '0.00',
      pending_amount: '0.00',
      pending_count: 0,
      average_per_job: '0.00',
      cancellation_compensation: '0.00',
      collective_earnings: '0.00',
      platform_held_balance: '0.00',
      platform_commission_fee: '0.00',
      direct_customer_received: 0,
      pending_payouts: 0,
      collective_booking_earnings: 0,
      average_earnings_per_job: 0,
    },
    jobs: {
      total: 0,
      completed: 0,
      cancelled: 0,
      active: 0,
      active_hours_today: 0,
    },
    cooperative: {
      rate_percentage: 6.5,
      total_contribution: '0.00',
      current_patronage_balance: '0.00',
      contributions_total: 0,
      patronage_dividend_balance: 0,
      collective_work_contributions: 0,
      historical_allocations: [],
    },
    analytics: {
      earnings_trend: [
        { day: 'Mon', date: 'Mon', amount: 0 },
        { day: 'Tue', date: 'Tue', amount: 0 },
        { day: 'Wed', date: 'Wed', amount: 0 },
        { day: 'Thu', date: 'Thu', amount: 0 },
        { day: 'Fri', date: 'Fri', amount: 0 },
        { day: 'Sat', date: 'Sat', amount: 0 },
        { day: 'Sun', date: 'Sun', amount: 0 },
      ],
      category_breakdown: [
        { category: serviceCategory, count: 0 },
      ],
      job_categories: [
        { category: serviceCategory, count: 0, earnings: 0 },
      ],
      hours_worked_estimate: 0,
      working_hours_today: 0,
    },
    payout_readiness: {
      status: 'DEMO_MODE',
      upi_vpa: null,
      bank_configured: false,
      aeps_enabled: false,
      is_mock_mode: true,
      provider_label: 'UNNATI Sandboxed Micro-Payout Provider',
    },
    workload_wellbeing: wellbeing,
    wellbeing,
    skills: {
      nsdcCertified: false,
      nsdcCertNumber: null,
      nsdcTradeName: serviceCategory,
      skillIndiaVerified: false,
      skillBadges: ['UNNATI Apprentice Member'],
      isDemoCertificate: true,
      tradeName: serviceCategory,
      isDemo: true,
    },
  };
}

