/**
 * UNNATI Cooperative Operations Engine (Client-Side)
 * ---------------------------------------------------
 * Operational triaging, privacy masking, economics calculations,
 * and high-fidelity fallback mock fixtures.
 */

import {
  OperationsOverviewData,
  BookingTriageFilter,
  TriagedBooking,
  PaymentLifecycleSummary,
  CooperativeEconomicsSummary,
  OperationalAuditLog,
  WorkerOperationalProfile
} from '../types/operations';

/**
 * Masks sensitive 12-digit Indian Aadhaar number.
 */
export function maskAadhaar(aadhaar?: string | null): string {
  if (!aadhaar) return 'Not Provided';
  const clean = String(aadhaar).replace(/\D/g, '');
  if (clean.length !== 12) return 'XXXX-XXXX-XXXX';
  return `XXXX-XXXX-${clean.slice(-4)}`;
}

/**
 * Masks 10-character Indian PAN number: 'XXXXX1234X'.
 */
export function maskPan(pan?: string | null): string {
  if (!pan) return 'Not Provided';
  const clean = String(pan).trim().toUpperCase();
  if (clean.length !== 10) return 'XXXXXXXXXX';
  return `XXXXX${clean.slice(5)}`;
}

/**
 * Filters bookings by operational triage category and search keyword.
 */
export function filterTriagedBookings(
  bookings: TriagedBooking[],
  filter: BookingTriageFilter,
  searchQuery: string = ''
): TriagedBooking[] {
  const query = searchQuery.trim().toLowerCase();

  return bookings.filter(b => {
    // 1. Triage filter match
    const status = (b.status || '').toLowerCase();
    let matchesFilter = true;

    if (filter === 'LIVE_ACTIVE') {
      matchesFilter = ['in_progress', 'repair_in_progress', 'captain_arriving', 'work_started', 'captain_assigned'].includes(status);
    } else if (filter === 'SCHEDULED') {
      matchesFilter = ['scheduled', 'accepted', 'requested'].includes(status);
    } else if (filter === 'UNASSIGNED') {
      matchesFilter = !b.worker_id && ['searching', 'requested'].includes(status);
    } else if (filter === 'DELAYED_PROBLEMATIC') {
      matchesFilter = Boolean(b.is_delayed);
    } else if (filter === 'COLLECTIVE_SHG') {
      matchesFilter = Boolean(b.is_collective);
    } else if (filter === 'DISPUTED') {
      matchesFilter = Boolean(b.is_disputed) || status === 'cancelled';
    }

    // 2. Search keyword match
    const matchesSearch =
      !query ||
      b.service_title.toLowerCase().includes(query) ||
      b.customer_name.toLowerCase().includes(query) ||
      (b.worker_name && b.worker_name.toLowerCase().includes(query)) ||
      String(b.id).includes(query);

    return matchesFilter && matchesSearch;
  });
}

/**
 * Returns color classes for booking operational status.
 */
export function getBookingStatusBadge(status: string): { label: string; bg: string; text: string } {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'in_progress':
    case 'repair_in_progress':
    case 'work_started':
      return { label: 'In Progress (कार्यरत)', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300' };
    case 'captain_arriving':
      return { label: 'En Route (रास्ते में)', bg: 'bg-sky-100 dark:bg-sky-950/60', text: 'text-sky-700 dark:text-sky-300' };
    case 'scheduled':
    case 'accepted':
      return { label: 'Scheduled (नियत)', bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300' };
    case 'searching':
    case 'requested':
      return { label: 'Unassigned (असाइन लंबित)', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300' };
    case 'completed':
      return { label: 'Completed (पूर्ण)', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' };
    case 'cancelled':
      return { label: 'Cancelled (रद्द)', bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300' };
    default:
      return { label: status.toUpperCase(), bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
  }
}

/**
 * Calculates cooperative economics from turnover.
 */
export function calculateSurplusDistribution(
  turnover: number,
  contributionRate: number = 0.05
): CooperativeEconomicsSummary {
  const surplus = Math.round(turnover * contributionRate);
  return {
    total_cooperative_turnover: turnover,
    cooperative_contribution_rate: contributionRate,
    cooperative_surplus_generated: surplus,
    allocations: {
      patronage_dividend_pool: Math.round(surplus * 0.40),
      welfare_and_tools_pool: Math.round(surplus * 0.35),
      operational_reserve_pool: Math.round(surplus * 0.25)
    },
    shares: {
      patronage_dividend_share: 0.40,
      welfare_and_tools_share: 0.35,
      operational_reserve_share: 0.25
    },
    policy_rule: 'Non-custodial cooperative surplus distribution ratified democratically.'
  };
}

// ----------------------------------------------------
// Fallback Demo Fixtures
// ----------------------------------------------------

export const MOCK_OPERATIONS_OVERVIEW: OperationsOverviewData = {
  metrics: {
    active_workers: { value: 34, is_live: true, label: 'Active On-Duty Craftsmen' },
    active_customers: { value: 182, is_live: true, label: 'Active Registered Customers' },
    ongoing_bookings: { value: 9, is_live: true, label: 'Ongoing In-Progress Tasks' },
    scheduled_bookings: { value: 16, is_live: true, label: 'Scheduled Ahead' },
    completed_jobs: { value: 412, is_live: true, label: 'Completed Work Units' },
    cancelled_jobs: { value: 7, is_live: true, label: 'Cancelled Requests' },
    disputed_jobs: { value: 1, is_live: true, label: 'Active Disputes' },
    avg_service_rating: { value: 4.8, is_live: true, label: 'Average Platform Rating' },
    service_demand_index: { value: 87.2, is_live: false, is_demo: true, label: 'Regional Demand Index (AI Estimated)' }
  },
  cooperative_membership: {
    total_members: 64,
    tiers: {
      apprentice: 14,
      member: 36,
      guild_lead: 9,
      master_craftsman: 5
    },
    is_live: true
  },
  operational_health: 'OPTIMAL',
  generated_at: new Date().toISOString()
};

export const MOCK_TRIAGED_BOOKINGS: TriagedBooking[] = [
  {
    id: 101,
    booking_id: 101,
    service_title: 'Submersible Water Pump Motor Rewinding',
    customer_name: 'Vikram Mehta',
    worker_name: 'Mukesh Sharma (Master Electrician)',
    worker_id: 201,
    status: 'in_progress',
    address: 'Flat 402, Sai Vihar, Bandra East, Mumbai',
    scheduled_time: new Date(Date.now() - 3600000).toISOString(),
    is_delayed: false,
    is_collective: false,
    is_disputed: false,
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 102,
    booking_id: 102,
    service_title: 'Emergency Main Line Pipe Replacement',
    customer_name: 'Anjali Deshmukh',
    worker_name: null,
    worker_id: null,
    status: 'searching',
    address: 'Sector 14, Vashi, Navi Mumbai',
    scheduled_time: new Date(Date.now() + 1800000).toISOString(),
    is_delayed: true,
    is_collective: false,
    is_disputed: false,
    created_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 103,
    booking_id: 103,
    service_title: 'Community Solar Panel Inspection & Maintenance',
    customer_name: 'Green Heights RWA',
    worker_name: 'Guild Team A (3 Craftsmen)',
    worker_id: 202,
    status: 'scheduled',
    address: 'Tower B Rooftop, Green Heights Society, Andheri',
    scheduled_time: new Date(Date.now() + 86400000).toISOString(),
    is_delayed: false,
    is_collective: true,
    is_disputed: false,
    created_at: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: 104,
    booking_id: 104,
    service_title: 'Split AC Deep Foam Cleansing',
    customer_name: 'Rajesh Kothari',
    worker_name: 'Sunil Verma',
    worker_id: 203,
    status: 'cancelled',
    address: 'B-12, Malad West, Mumbai',
    scheduled_time: new Date(Date.now() - 86400000).toISOString(),
    is_delayed: false,
    is_collective: false,
    is_disputed: true,
    created_at: new Date(Date.now() - 90000000).toISOString()
  }
];

export const MOCK_PAYMENT_SUMMARY: PaymentLifecycleSummary = {
  cooperative_fund_protocol: 'Direct Customer-to-Worker Settlement Protocol. UNNATI operates as a non-custodial labor cooperative; zero platform balances are held.',
  successful_payments: { count: 398, volume: 184500.0 },
  pending_payments: { count: 6, volume: 3200.0 },
  failed_payments: { count: 8, volume: 4100.0 },
  refunds: { count: 3, volume: 1450.0 },
  cancellation_compensations: { count: 5, volume: 1250.0 },
  total_turnover_settled: 184500.0
};

export const MOCK_ECONOMICS: CooperativeEconomicsSummary = {
  total_cooperative_turnover: 184500.0,
  cooperative_contribution_rate: 0.05,
  cooperative_surplus_generated: 9225.0,
  allocations: {
    patronage_dividend_pool: 3690.0,
    welfare_and_tools_pool: 3228.75,
    operational_reserve_pool: 2306.25
  },
  shares: {
    patronage_dividend_share: 0.40,
    welfare_and_tools_share: 0.35,
    operational_reserve_share: 0.25
  },
  policy_rule: 'Non-custodial cooperative surplus distribution ratified democratically by member resolution.'
};

export const MOCK_AUDIT_LOGS: OperationalAuditLog[] = [
  {
    id: 1,
    actor_name: 'Admin Supervisor (Pooja Rao)',
    action: 'VERIFY_WORKER',
    target_type: 'WORKER',
    target_id: '201',
    result: 'SUCCESS',
    notes: 'NSDC Skill India Master Electrician credentials verified via QR portal.',
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 2,
    actor_name: 'Operations Dispatcher (Karan Singh)',
    action: 'BOOKING_REASSIGN',
    target_type: 'BOOKING',
    target_id: '102',
    result: 'SUCCESS',
    notes: 'Reassigned delayed plumbing emergency to nearby standby craftsman.',
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 3,
    actor_name: 'Peer Governance Board',
    action: 'DISPUTE_MEDIATE',
    target_type: 'DISPUTE',
    target_id: 'CASE-2026-081',
    result: 'SUCCESS',
    notes: 'Upheld worker geotagged arrival evidence; removed retaliatory low rating.',
    created_at: new Date(Date.now() - 14400000).toISOString()
  }
];

export const MOCK_WORKER_PROFILES: WorkerOperationalProfile[] = [
  {
    id: 201,
    user_id: 201,
    full_name: 'Mukesh Sharma (मुकेश शर्मा)',
    email: 'mukesh.sharma@example.com',
    phone_masked: '+91-XXXXX-4821',
    service_category: 'Electrical & Motor Repairs',
    cooperative_tier: 'master_craftsman',
    approval_status: 'approved',
    is_verified: true,
    aadhaar_masked: 'XXXX-XXXX-8821',
    pan_masked: 'XXXXX9012F',
    nsdc_certified: true,
    police_verification_status: 'VERIFIED',
    rating: 4.9,
    completed_jobs: 142
  },
  {
    id: 202,
    user_id: 202,
    full_name: 'Sunita Devi Patel (सुनीता देवी पटेल)',
    email: 'sunita.patel@example.com',
    phone_masked: '+91-XXXXX-9934',
    service_category: 'Solar & Heavy Appliances',
    cooperative_tier: 'guild_lead',
    approval_status: 'approved',
    is_verified: true,
    aadhaar_masked: 'XXXX-XXXX-4419',
    pan_masked: 'XXXXX3310K',
    nsdc_certified: true,
    police_verification_status: 'VERIFIED',
    rating: 4.95,
    completed_jobs: 198
  },
  {
    id: 203,
    user_id: 203,
    full_name: 'Kailash Yadav (कैलाश यादव)',
    email: 'kailash.yadav@example.com',
    phone_masked: '+91-XXXXX-1120',
    service_category: 'Carpentry & Woodcraft',
    cooperative_tier: 'apprentice',
    approval_status: 'pending',
    is_verified: false,
    aadhaar_masked: 'XXXX-XXXX-6621',
    pan_masked: 'XXXXX7741P',
    nsdc_certified: false,
    police_verification_status: 'NOT_SUBMITTED',
    rating: 4.5,
    completed_jobs: 12
  }
];
