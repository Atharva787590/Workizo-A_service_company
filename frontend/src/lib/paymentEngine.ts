/**
 * UNNATI Payment Engine: Direct Service-Provider Payment & Cooperative Economics
 * -------------------------------------------------------------------------------
 * Core Rule: UNNATI must NOT act as a financial middleman or hold customer money in platform escrow.
 * The payment relationship is strictly direct between customer and service provider.
 */

import {
  PaymentLifecycleStatus,
  DirectPaymentBreakdown,
  WorkerAllocationShare
} from '../types/unnati';

export const UNNATI_COOPERATIVE_RATE = 0.065; // 6.5% transparent cooperative reserve
export const PLATFORM_FEE_DIRECT = 0.0;       // Exactly 0.00 - zero escrow, zero middleman rake

export const ALLOWED_PAYMENT_TRANSITIONS: Record<PaymentLifecycleStatus, PaymentLifecycleStatus[]> = {
  PAYMENT_PENDING: ['PAYMENT_INITIATED', 'PAYMENT_CANCELLED', 'PAYMENT_FAILED'],
  PAYMENT_INITIATED: ['PAYMENT_CONFIRMED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'PAYMENT_CANCELLED'],
  PAYMENT_CONFIRMED: ['PAYMENT_COMPLETED', 'REFUND_PENDING'],
  PAYMENT_COMPLETED: ['REFUND_PENDING'],
  PAYMENT_FAILED: ['PAYMENT_INITIATED', 'PAYMENT_CANCELLED'],
  REFUND_PENDING: ['REFUNDED', 'PAYMENT_COMPLETED'],
  PAYMENT_CANCELLED: [],
  REFUNDED: [],
};

/**
 * Calculates transparent client-side and server-side matching breakdown.
 * Ensures platform fee is zero and platform never holds escrow balance.
 */
export function calculateDirectPaymentBreakdown(
  amount: number,
  workerCount = 1,
  cooperativeRate = UNNATI_COOPERATIVE_RATE,
  workerName = 'Assigned Craftsman',
  workerVpa?: string,
  assignedWorkers?: Array<{ id: number; full_name: string }>
): DirectPaymentBreakdown {
  const safeAmount = Math.max(0, Math.round(amount * 100) / 100);
  const safeCount = Math.max(1, Math.floor(workerCount));

  // 6.5% transparent cooperative reserve
  const cooperativeAllocation = Math.round(safeAmount * cooperativeRate * 100) / 100;
  
  // Direct Worker Payout is total customer paid minus the cooperative reserve
  const workerDirectPayout = Math.round((safeAmount - cooperativeAllocation) * 100) / 100;

  // Split equally per worker for collective crew bookings
  const perWorkerShare = Math.round((workerDirectPayout / safeCount) * 100) / 100;
  const roundingDiff = Math.round((workerDirectPayout - perWorkerShare * safeCount) * 100) / 100;
  const firstWorkerShare = Math.round((perWorkerShare + roundingDiff) * 100) / 100;

  // Build worker shares if assigned workers are present
  const workerShares: WorkerAllocationShare[] = [];
  if (assignedWorkers && assignedWorkers.length > 0) {
    assignedWorkers.forEach((w, idx) => {
      workerShares.push({
        workerId: w.id,
        workerName: w.full_name,
        allocatedPayout: idx === 0 ? firstWorkerShare : perWorkerShare,
        cooperativeDividendShare: Math.round((cooperativeAllocation / safeCount) * 100) / 100,
        status: 'assigned',
      });
    });
  }

  const breakdown: DirectPaymentBreakdown = {
    totalCustomerPaid: safeAmount,
    workerDirectPayout,
    cooperativeAllocation,
    cooperativeRatePercentage: Math.round(cooperativeRate * 1000) / 10,
    platformFee: PLATFORM_FEE_DIRECT,
    platformEscrowBalance: 0.0,
    platformHoldsEscrow: false,
    workerCount: safeCount,
    perWorkerShare,
    firstWorkerShare,
    workerName,
    workerVpa,
    isCollective: safeCount > 1,
    workerShares: workerShares.length > 0 ? workerShares : undefined,
  };

  verifyZeroPlatformEscrow(breakdown);
  return breakdown;
}

/**
 * Validates strictly that platform holds 0 escrow and charges 0 fee.
 */
export function verifyZeroPlatformEscrow(breakdown: DirectPaymentBreakdown): void {
  if (breakdown.platformFee !== 0.0) {
    throw new Error('Security Violation: Platform fee must be 0.00 in UNNATI direct payment model.');
  }
  if (breakdown.platformEscrowBalance !== 0.0) {
    throw new Error('Security Violation: Platform escrow balance must be 0.00.');
  }
  if (breakdown.platformHoldsEscrow !== false) {
    throw new Error('Security Violation: UNNATI must never hold platform escrow.');
  }
}

/**
 * Validates payment state machine transitions with role authorizations.
 */
export function validatePaymentStateTransition(
  current: PaymentLifecycleStatus,
  next: PaymentLifecycleStatus,
  role: string,
  isWorkerConfirmed = false
): { valid: boolean; error?: string } {
  const allowed = ALLOWED_PAYMENT_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    return {
      valid: false,
      error: `Transition from '${current}' to '${next}' is not allowed.`,
    };
  }

  // Authorization checks
  if ((next === 'PAYMENT_INITIATED' || next === 'PAYMENT_CANCELLED') && current === 'PAYMENT_PENDING') {
    if (role !== 'customer' && role !== 'admin') {
      return { valid: false, error: 'Only customer or admin can initiate or cancel pending payment.' };
    }
  }

  if (next === 'PAYMENT_CONFIRMED' || next === 'PAYMENT_COMPLETED') {
    if (role !== 'worker' && role !== 'admin' && !isWorkerConfirmed) {
      return { valid: false, error: 'Only service provider or verified adapter can confirm direct payment receipt.' };
    }
  }

  if (next === 'REFUNDED') {
    if (role !== 'worker' && role !== 'admin') {
      return { valid: false, error: 'Refund must be confirmed by service provider or admin.' };
    }
  }

  return { valid: true };
}

/**
 * Generates an Indian NPCI UPI intent URI for direct customer-to-worker payment.
 */
export function generateUpiIntentUrl(params: {
  vpa: string;
  payeeName: string;
  amount: number;
  bookingId: number;
  ref?: string;
}): string {
  const cleanName = encodeURIComponent(params.payeeName);
  const ref = params.ref || `UNN-${params.bookingId}`;
  const amtStr = params.amount.toFixed(2);
  return `upi://pay?pa=${params.vpa}&pn=${cleanName}&am=${amtStr}&cu=INR&tn=UNNATI-Booking-${params.bookingId}&tr=${ref}`;
}

/**
 * Computes direct refund and worker compensation based on booking cancellation stage.
 */
export function calculateDirectCancellationRefund(params: {
  totalAmount: number;
  bookingStatus: string;
  createdAt: string | number | Date;
  scheduledTime?: string | number | Date | null;
  now?: number;
}): {
  refundAmount: number;
  workerCompensation: number;
  isFree: boolean;
  explanation: string;
  platformRetained: number;
} {
  const now = params.now || Date.now();
  const created = new Date(params.createdAt).getTime();
  const totalAmount = Math.max(0, params.totalAmount);

  // 5 minute grace period
  const gracePeriodMs = 5 * 60 * 1000;
  const isWithinGrace = now - created <= gracePeriodMs;

  // Scheduled booking >2h buffer
  let isAdvanceScheduledFree = false;
  if (params.scheduledTime) {
    const sched = new Date(params.scheduledTime).getTime();
    if (sched - now >= 2 * 60 * 60 * 1000) {
      isAdvanceScheduledFree = true;
    }
  }

  const status = (params.bookingStatus || '').toLowerCase();

  let workerCompensation = 0;
  let explanation = '';
  let isFree = false;

  if (
    isWithinGrace ||
    isAdvanceScheduledFree ||
    ['requested', 'matching', 'searching', 'accepted', 'scheduled'].includes(status)
  ) {
    workerCompensation = 0;
    isFree = true;
    explanation = isWithinGrace
      ? 'Free cancellation within 5-minute grace period.'
      : isAdvanceScheduledFree
      ? 'Free cancellation: Scheduled >2 hours in advance.'
      : 'Free cancellation prior to worker departure.';
  } else if (['worker_arriving', 'on_the_way'].includes(status)) {
    workerCompensation = Math.min(100, totalAmount);
    isFree = false;
    explanation = '₹100 dispatch compensation credited directly to worker for on-the-way cancellation.';
  } else if (['arrived', 'in_progress', 'repair_started'].includes(status)) {
    workerCompensation = Math.min(200, totalAmount);
    isFree = false;
    explanation = '₹200 on-site compensation credited directly to worker for cancellation after arrival.';
  } else {
    workerCompensation = 0;
    isFree = true;
    explanation = 'Standard cancellation.';
  }

  const refundAmount = Math.max(0, Math.round((totalAmount - workerCompensation) * 100) / 100);

  return {
    refundAmount,
    workerCompensation,
    isFree,
    explanation,
    platformRetained: 0, // Always 0 platform middleman fee
  };
}

/**
 * Returns mobile-first visual progress metadata for UNNATI payment lifecycle.
 */
export function getPaymentLifecycleProgress(status: PaymentLifecycleStatus): {
  percent: number;
  label: string;
  labelHi: string;
  colorClass: string;
} {
  switch (status) {
    case 'PAYMENT_PENDING':
      return { percent: 15, label: 'Payment Pending', labelHi: 'भुगतान बाकी', colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-300' };
    case 'PAYMENT_INITIATED':
      return { percent: 45, label: 'Payment Initiated', labelHi: 'भुगतान शुरू किया गया', colorClass: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-300' };
    case 'PAYMENT_CONFIRMED':
      return { percent: 80, label: 'Payment Confirmed', labelHi: 'भुगतान सत्यापित', colorClass: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300' };
    case 'PAYMENT_COMPLETED':
      return { percent: 100, label: 'Payment Completed', labelHi: 'भुगतान संपन्न', colorClass: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300' };
    case 'PAYMENT_FAILED':
      return { percent: 40, label: 'Payment Failed', labelHi: 'भुगतान असफल', colorClass: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-300' };
    case 'PAYMENT_CANCELLED':
      return { percent: 0, label: 'Payment Cancelled', labelHi: 'भुगतान रद्द', colorClass: 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-300' };
    case 'REFUND_PENDING':
      return { percent: 70, label: 'Refund Pending', labelHi: 'रिफंड प्रक्रिया में', colorClass: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-300' };
    case 'REFUNDED':
      return { percent: 100, label: 'Directly Refunded', labelHi: 'सीधा रिफंड पूरा', colorClass: 'text-teal-700 bg-teal-50 dark:bg-teal-950/40 border-teal-300' };
    default:
      return { percent: 0, label: 'Unknown', labelHi: 'अज्ञात', colorClass: 'text-slate-500 bg-slate-50' };
  }
}
