import type { UnnatiBookingStatus, CancellationBreakdown } from '@/types/unnati';

/**
 * Calculates great-circle distance between two coordinates using Haversine formula (in meters)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Verify if worker coordinates are within arrival radius of job site
 */
export function verifyArrivalWithinGeofence(
  jobLat: number,
  jobLon: number,
  workerLat: number,
  workerLon: number,
  radiusMeters = 300
): { verified: boolean; distanceMeters: number } {
  const distanceMeters = calculateHaversineDistance(jobLat, jobLon, workerLat, workerLon);
  return {
    verified: distanceMeters <= radiusMeters,
    distanceMeters,
  };
}

/**
 * Progressive cancellation calculation safeguards
 */
export function calculateCancellationSafeguards(
  bookingCreatedAt: Date | string,
  scheduledTime: Date | string | null | undefined,
  currentStatus: string,
  baseLabourCharge = 250
): CancellationBreakdown {
  const now = Date.now();
  const created = new Date(bookingCreatedAt).getTime();

  // 1. Within 5-minute free grace period
  if (now - created <= 5 * 60 * 1000) {
    return {
      fee: 0,
      isFree: true,
      workerCompensation: 0,
      explanation: 'Cancelled within 5-minute free cancellation grace period.',
    };
  }

  // 2. Scheduled booking cancelled > 2 hours before appointment
  if (scheduledTime) {
    const scheduled = new Date(scheduledTime).getTime();
    if (scheduled - now > 2 * 60 * 60 * 1000) {
      return {
        fee: 0,
        isFree: true,
        workerCompensation: 0,
        explanation: 'Cancelled more than 2 hours before scheduled time.',
      };
    }
  }

  // 3. Status-based progressive compensation
  const normalizedStatus = currentStatus.toLowerCase();

  if (normalizedStatus === 'on_the_way' || normalizedStatus === 'worker_arriving') {
    const fee = Math.max(100, Math.round(baseLabourCharge * 0.2));
    return {
      fee,
      isFree: false,
      workerCompensation: fee,
      explanation: `Worker is travelling. ₹${fee} travel compensation credited to worker.`,
    };
  }

  if (
    normalizedStatus === 'arrived' ||
    normalizedStatus === 'verified' ||
    normalizedStatus === 'inspection'
  ) {
    const fee = Math.max(200, Math.round(baseLabourCharge * 0.5));
    return {
      fee,
      isFree: false,
      workerCompensation: fee,
      explanation: `Worker has already arrived on site. ₹${fee} site compensation credited to worker.`,
    };
  }

  return {
    fee: 0,
    isFree: true,
    workerCompensation: 0,
    explanation: 'Standard cancellation without fee.',
  };
}

/**
 * Calculate collective / multi-worker contract values
 */
export function calculateCollectiveContract(
  baseLabourCharge = 250,
  workerCount = 1
): {
  totalContractValue: number;
  individualWorkerPayout: number;
  cooperativeReserve: number;
  workerPool: number;
} {
  const count = Math.max(1, Math.min(10, Math.round(workerCount)));
  const totalContractValue = baseLabourCharge * count;
  const cooperativeReserve = Math.round(totalContractValue * 0.065 * 100) / 100; // 6.5% platform reserve
  const workerPool = totalContractValue - cooperativeReserve;
  const individualWorkerPayout = Math.round((workerPool / count) * 100) / 100;

  return {
    totalContractValue,
    individualWorkerPayout,
    cooperativeReserve,
    workerPool,
  };
}

/**
 * Map existing Workizo status strings to canonical UNNATI lifecycle
 */
export function mapWorkizoStatusToUnnati(status: string): UnnatiBookingStatus {
  const s = status.toLowerCase();
  switch (s) {
    case 'searching':
      return 'REQUESTED';
    case 'matching':
      return 'MATCHING';
    case 'accepted':
      return 'ACCEPTED';
    case 'scheduled':
      return 'SCHEDULED';
    case 'on_the_way':
    case 'worker_arriving':
      return 'WORKER_ARRIVING';
    case 'arrived':
    case 'verified':
    case 'inspection':
      return 'ARRIVED';
    case 'repair_started':
    case 'in_progress':
      return 'IN_PROGRESS';
    case 'repair_completed':
    case 'waiting_approval':
    case 'waiting_for_cash_confirmation':
    case 'completed':
      return 'COMPLETED';
    case 'ready_to_complete':
    case 'payment_released':
      return 'PAYMENT_RELEASED';
    case 'cancelled':
      return 'CANCELLED';
    case 'disputed':
      return 'DISPUTED';
    default:
      return 'REQUESTED';
  }
}

/**
 * Get visual lifecycle completion percentage (0 - 100)
 */
export function getUnnatiLifecycleProgress(status: string): number {
  const canonical = mapWorkizoStatusToUnnati(status);
  switch (canonical) {
    case 'REQUESTED':
    case 'MATCHING':
      return 15;
    case 'ACCEPTED':
    case 'SCHEDULED':
      return 30;
    case 'WORKER_ARRIVING':
      return 50;
    case 'ARRIVED':
      return 70;
    case 'IN_PROGRESS':
      return 85;
    case 'COMPLETED':
    case 'PAYMENT_RELEASED':
      return 100;
    case 'CANCELLED':
    case 'DISPUTED':
      return 100;
    default:
      return 10;
  }
}
