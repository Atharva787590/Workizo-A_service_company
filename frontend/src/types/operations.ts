/**
 * UNNATI Cooperative Operations Center Types
 */

export interface OperationalMetric {
  value: number;
  is_live: boolean;
  is_demo?: boolean;
  label: string;
}

export interface CooperativeMembershipTiers {
  apprentice: number;
  member: number;
  guild_lead: number;
  master_craftsman: number;
}

export interface OperationsOverviewData {
  metrics: {
    active_workers: OperationalMetric;
    active_customers: OperationalMetric;
    ongoing_bookings: OperationalMetric;
    scheduled_bookings: OperationalMetric;
    completed_jobs: OperationalMetric;
    cancelled_jobs: OperationalMetric;
    disputed_jobs: OperationalMetric;
    avg_service_rating: OperationalMetric;
    service_demand_index: OperationalMetric;
  };
  cooperative_membership: {
    total_members: number;
    tiers: CooperativeMembershipTiers;
    is_live: boolean;
  };
  operational_health: 'OPTIMAL' | 'STABLE' | 'ATTENTION_REQUIRED';
  generated_at: string;
}

export type BookingTriageFilter =
  | 'ALL'
  | 'LIVE_ACTIVE'
  | 'SCHEDULED'
  | 'UNASSIGNED'
  | 'DELAYED_PROBLEMATIC'
  | 'COLLECTIVE_SHG'
  | 'DISPUTED';

export interface TriagedBooking {
  id: number;
  booking_id: number;
  service_title: string;
  customer_name: string;
  worker_name: string | null;
  worker_id: number | null;
  status: string;
  address?: string;
  scheduled_time: string | null;
  is_delayed?: boolean;
  is_collective?: boolean;
  is_disputed?: boolean;
  created_at: string;
}

export interface PaymentLifecycleSummary {
  cooperative_fund_protocol: string;
  successful_payments: { count: number; volume: number };
  pending_payments: { count: number; volume: number };
  failed_payments: { count: number; volume: number };
  refunds: { count: number; volume: number };
  cancellation_compensations: { count: number; volume: number };
  total_turnover_settled: number;
}

export interface CooperativeEconomicsSummary {
  total_cooperative_turnover: number;
  cooperative_contribution_rate: number;
  cooperative_surplus_generated: number;
  allocations: {
    patronage_dividend_pool: number;
    welfare_and_tools_pool: number;
    operational_reserve_pool: number;
  };
  shares: {
    patronage_dividend_share: number;
    welfare_and_tools_share: number;
    operational_reserve_share: number;
  };
  policy_rule: string;
}

export interface OperationalAuditLog {
  id: number;
  actor_name: string;
  action: string;
  target_type: string;
  target_id: string;
  result: string;
  notes: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface WorkerOperationalProfile {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone_masked: string;
  service_category?: string;
  cooperative_tier: 'apprentice' | 'member' | 'guild_lead' | 'master_craftsman';
  approval_status: 'pending' | 'approved' | 'rejected';
  is_verified: boolean;
  aadhaar_masked: string;
  pan_masked: string;
  nsdc_certified: boolean;
  police_verification_status: string;
  rating: number;
  completed_jobs: number;
}
