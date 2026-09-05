/**
 * UNNATI — SIH26-26089 Cooperative Gig Services Platform
 * Core Domain TypeScript Type Definitions
 */

export type CooperativeRole = 'worker' | 'customer' | 'admin' | 'guild_lead' | 'cooperative_admin';

export type GuildTier = 'apprentice' | 'member' | 'guild_lead' | 'master_craftsman';

export type GovernanceVoteChoice = 'for' | 'against' | 'abstain';

export interface CooperativeMemberProfile {
  id: string;
  userId: number;
  cooperativeMembershipId: string;
  guildTier: GuildTier;
  serviceCategoryId: number;
  categoryName: string;
  shareUnits: number;
  votingEligibility: boolean;
  patronageDividendEarned: number;
  welfareFundContribution: number;
  insuranceCoverageActive: boolean;
  peerEndorsementsCount: number;
  joinedAt: string;
}

export interface CooperativeDividend {
  id: string;
  period: string;
  totalPoolAmount: number;
  workerShareAmount: number;
  disbursedAt?: string;
  status: 'pending' | 'credited' | 'withdrawn';
}

export interface GovernanceResolution {
  id: string;
  title: string;
  description: string;
  category: 'commission_rate' | 'welfare_policy' | 'service_standard' | 'payout_rule';
  proposedBy: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'passed' | 'rejected';
  totalVotes: number;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  userVotedChoice?: GovernanceVoteChoice;
}

export interface WelfareFundRecord {
  id: string;
  memberId: string;
  fundType: 'health_cover' | 'emergency_credit' | 'accident_relief' | 'equipment_loan';
  balance: number;
  maxEligibleAmount: number;
  activeClaimsCount: number;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  lowBandwidthMode: boolean;
  language: 'en' | 'hi' | 'gu' | 'mr' | 'ta' | 'te';
}

export type BookingType = 'instant' | 'scheduled' | 'collective';

export type UnnatiBookingStatus =
  | 'REQUESTED'
  | 'MATCHING'
  | 'ACCEPTED'
  | 'SCHEDULED'
  | 'WORKER_ARRIVING'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PAYMENT_RELEASED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface UnnatiBooking {
  id: number;
  tracking_id?: string;
  booking_type: BookingType;
  status: string;
  problem_type: string;
  problem_description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  arrival_radius_meters: number;
  geofence_verified: boolean;
  geofence_verified_at?: string | null;
  scheduled_time?: string | null;
  required_worker_count: number;
  total_contract_value: number;
  cooperative_allocation: number;
  cancellation_fee: number;
  cancellation_reason?: string | null;
  dispute_reason?: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    id: number;
    full_name: string;
    phone: string;
  };
  worker?: {
    id: number;
    full_name: string;
    phone: string;
    profile_photo?: string;
  } | null;
  assigned_workers?: Array<{
    id: number;
    full_name: string;
    phone: string;
  }>;
  service_category?: number;
  service_category_detail?: {
    id: number;
    name: string;
    base_labour_charge: number;
  };
}

export interface GeofenceVerificationResult {
  verified: boolean;
  distanceMeters: number;
  arrivalRadiusMeters: number;
  fallbackUsed?: boolean;
  message: string;
}

export interface CancellationBreakdown {
  fee: number;
  isFree: boolean;
  workerCompensation: number;
  explanation: string;
}

// =============================================================================
// UNNATI DIRECT PAYMENT ARCHITECTURE TYPES
// =============================================================================

export type PaymentLifecycleStatus =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type PaymentAdapterType = 'DIRECT_UPI' | 'DIRECT_CASH' | 'MOCK_PROVIDER';

export interface WorkerAllocationShare {
  workerId: number;
  workerName: string;
  allocatedPayout: number;
  cooperativeDividendShare: number;
  status: string;
}

export interface DirectPaymentBreakdown {
  totalCustomerPaid: number;
  workerDirectPayout: number;
  cooperativeAllocation: number;
  cooperativeRatePercentage: number;
  platformFee: number; // Strictly 0.00
  platformEscrowBalance: number; // Strictly 0.00
  platformHoldsEscrow: false; // Explicit proof that platform holds 0 funds
  workerCount: number;
  perWorkerShare: number;
  firstWorkerShare?: number;
  workerName: string;
  workerVpa?: string;
  isCollective: boolean;
  workerShares?: WorkerAllocationShare[];
}

export interface PaymentTransactionRecord {
  id: number;
  paymentId?: number;
  bookingId: number;
  transactionType:
    | 'CUSTOMER_DIRECT_PAYMENT'
    | 'WORKER_PAYOUT_SHARE'
    | 'COOPERATIVE_ALLOCATION'
    | 'CANCELLATION_COMPENSATION'
    | 'REFUND'
    | 'ADJUSTMENT';
  senderName?: string;
  recipientName?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  adapterName: string;
  isMock: boolean;
  idempotencyKey?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface WorkerEarningsSummary {
  workerId: number;
  workerName: string;
  totalDirectEarned: number;
  totalCooperativeContribution: number;
  totalPlatformFeesDeducted: number; // Guaranteed 0.00
  completedJobsCount: number;
  recentTransactions: PaymentTransactionRecord[];
}

// =============================================================================
// UNNATI WORKER EARNINGS INTELLIGENCE & WELL-BEING TYPES
// =============================================================================

export type PayoutReadinessStatus = 'VERIFIED' | 'PENDING' | 'UNAVAILABLE' | 'DEMO_MODE';

export type WorkloadLevel = 'LIGHT' | 'MODERATE' | 'HEAVY' | 'REST_RECOMMENDED';

export interface WorkloadWellbeing {
  level: WorkloadLevel;
  label: string;
  labelHi: string;
  color: 'emerald' | 'blue' | 'amber' | 'rose' | string;
  todayCompletedJobs: number;
  activeHoursToday: number;
  restRecommendation: string;
  disclaimer: string;
}

export interface SkillCertificationProfile {
  nsdcCertified: boolean;
  nsdcCertNumber?: string | null;
  nsdcTradeName?: string | null;
  skillIndiaVerified: boolean;
  skillBadges: string[];
  isDemoCertificate: boolean;
  tradeName?: string;
  isDemo?: boolean;
}

export interface WorkerEarningsIntelligence {
  worker_id: number;
  worker_name: string;
  service_category?: string;
  earnings: {
    today: string;
    week: string;
    month: string;
    all_time: string;
    pending_amount: string;
    pending_count: number;
    average_per_job: string;
    cancellation_compensation: string;
    collective_earnings: string;
    platform_held_balance: string; // Strictly 0.00
    platform_commission_fee: string; // Strictly 0.00
    direct_customer_received?: number;
    pending_payouts?: number;
    collective_booking_earnings?: number;
    average_earnings_per_job?: number;
  };
  jobs: {
    total: number;
    completed: number;
    cancelled: number;
    active: number;
    active_hours_today?: number;
  };
  cooperative: {
    rate_percentage: number;
    total_contribution: string;
    current_patronage_balance: string;
    contributions_total?: number;
    patronage_dividend_balance?: number;
    collective_work_contributions?: number;
    historical_allocations: Array<{
      booking_id: number;
      amount: string;
      date: string;
      status: string;
      is_mock: boolean;
    }>;
  };
  analytics: {
    earnings_trend: Array<{ day: string; date: string; amount: number }>;
    category_breakdown: Array<{ category: string; count: number }>;
    hours_worked_estimate: number;
    working_hours_today?: number;
    job_categories?: Array<{ category: string; count: number; earnings?: number }>;
  };
  payout_readiness: {
    status: PayoutReadinessStatus;
    upi_vpa?: string | null;
    bank_configured: boolean;
    aeps_enabled: boolean;
    is_mock_mode: boolean;
    provider_label: string;
  };
  workload_wellbeing: WorkloadWellbeing;
  wellbeing?: WorkloadWellbeing;
  skills: SkillCertificationProfile;
}



