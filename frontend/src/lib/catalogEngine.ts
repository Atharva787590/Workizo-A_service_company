/**
 * UNNATI Client-Side Service Catalog & Transparency Engine
 */

import {
  ServiceCatalogItem,
  TransparencyMetrics,
  SocialSecurityStatus
} from '../types/catalog';

export const MANDATORY_PRICING_DISCLAIMER =
  'Estimated pricing is an advisory baseline calculated from standard cooperative labor rates. Final service booking price is determined on-site by task scope and duration with full transparency and strictly ZERO platform commission fees.';

export function formatInr(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatLargeInr(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} Lakh`;
  }
  return formatInr(amount);
}

export function getSocialSecurityStatusBadge(status: SocialSecurityStatus): {
  label: string;
  color: 'emerald' | 'amber' | 'rose' | 'slate' | 'blue';
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'Active & Verified',
        color: 'emerald',
        bgClass: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
        textClass: 'text-emerald-700 dark:text-emerald-400',
        borderClass: 'border-emerald-300 dark:border-emerald-800',
      };
    case 'PENDING':
      return {
        label: 'Verification Pending',
        color: 'amber',
        bgClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
        textClass: 'text-amber-700 dark:text-amber-400',
        borderClass: 'border-amber-300 dark:border-amber-800',
      };
    case 'EXPIRED':
      return {
        label: 'Renewal Due',
        color: 'rose',
        bgClass: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
        textClass: 'text-rose-700 dark:text-rose-400',
        borderClass: 'border-rose-300 dark:border-rose-800',
      };
    case 'UNVERIFIED':
      return {
        label: 'Self-Reported Claim',
        color: 'blue',
        bgClass: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
        textClass: 'text-blue-700 dark:text-blue-400',
        borderClass: 'border-blue-300 dark:border-blue-800',
      };
    case 'NOT_ENROLLED':
    default:
      return {
        label: 'Not Enrolled',
        color: 'slate',
        bgClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        textClass: 'text-slate-600 dark:text-slate-400',
        borderClass: 'border-slate-300 dark:border-slate-700',
      };
  }
}

/**
 * Ensures zero platform commission and zero platform escrow.
 */
export function verifyZeroPlatformMiddleman(metrics: Partial<TransparencyMetrics>): void {
  if (metrics.platform_commission_rate_percent !== 0) {
    throw new Error('Violation: UNNATI platform commission must be strictly 0.0%');
  }
  if (metrics.platform_held_escrow_balance_inr !== 0) {
    throw new Error('Violation: UNNATI platform-held escrow balance must be strictly 0.00');
  }
}

/**
 * Validates that a provider profile contains NO sensitive PII.
 */
export function assertPrivacySanitized(profile: Record<string, unknown>): boolean {
  const sensitiveKeys = [
    'phone',
    'email',
    'aadhaar_number',
    'pan_number',
    'bank_account',
    'ifsc_code',
    'latitude',
    'longitude',
    'street',
    'address',
  ];
  for (const key of sensitiveKeys) {
    if (key in profile && profile[key] !== null && profile[key] !== undefined) {
      throw new Error(`Privacy Violation: Public profile must not contain sensitive field '${key}'`);
    }
  }
  return true;
}

/**
 * Client-side catalog filter and search.
 */
export function filterClientCatalog(
  items: ServiceCatalogItem[],
  query: string,
  category: string
): ServiceCatalogItem[] {
  const q = query.trim().toLowerCase();
  const cat = category.trim().toLowerCase();

  return items.filter((item) => {
    if (cat && cat !== 'all' && item.category.toLowerCase() !== cat) {
      return false;
    }
    if (q) {
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchSkills = item.required_skills.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchSkills) {
        return false;
      }
    }
    return true;
  });
}

export const FALLBACK_CATALOG_ITEMS: ServiceCatalogItem[] = [
  {
    id: 1,
    category: 'Electrician',
    name: 'Switchboard & Socket Repair',
    slug: 'switchboard-socket-repair',
    description: 'Diagnostics and repair of malfunctioning wall switches, loose terminals, blown sockets, or MCB trips.',
    typical_duration_minutes: 30,
    estimated_base_price: 199,
    estimated_max_price: 349,
    pricing_guidance: 'Covers travel + first 30 mins diagnostics and switch replacement. Replacement switches/sockets billed at cost.',
    required_skills: ['Basic Wiring', 'Circuit Diagnostics'],
    required_certification_level: 'SKILLED',
    is_restricted: false,
    icon: 'Zap',
    pricing_disclaimer: MANDATORY_PRICING_DISCLAIMER,
    is_estimated_pricing: true,
  },
  {
    id: 2,
    category: 'Electrician',
    name: 'Ceiling Fan Installation & Servicing',
    slug: 'ceiling-fan-installation',
    description: 'Assembly, secure ceiling bracket mounting, speed regulator wiring, and balancing for noiseless airflow.',
    typical_duration_minutes: 45,
    estimated_base_price: 249,
    estimated_max_price: 499,
    pricing_guidance: 'Includes down-rod attachment, capacitor inspection, and motor test run.',
    required_skills: ['Fan Assembly', 'Wiring'],
    required_certification_level: 'SKILLED',
    is_restricted: false,
    icon: 'Wind',
    pricing_disclaimer: MANDATORY_PRICING_DISCLAIMER,
    is_estimated_pricing: true,
  },
  {
    id: 3,
    category: 'Electrician',
    name: 'High-Voltage Distribution Panel Overhaul',
    slug: 'high-voltage-distribution-panel',
    description: 'Three-phase main panel balancing, busbar overhaul, and high-capacity contactor replacement.',
    typical_duration_minutes: 90,
    estimated_base_price: 799,
    estimated_max_price: 1499,
    pricing_guidance: 'Restricted hazardous service requiring active NCVT/ITI electrical trade qualification.',
    required_skills: ['High Voltage Wiring', 'Circuit Breaker Diagnostics'],
    required_certification_level: 'CERTIFIED',
    is_restricted: true,
    icon: 'ShieldAlert',
    pricing_disclaimer: MANDATORY_PRICING_DISCLAIMER,
    is_estimated_pricing: true,
  },
  {
    id: 4,
    category: 'Plumber',
    name: 'Tap & Pipe Leakage Repair',
    slug: 'tap-pipe-leakage-repair',
    description: 'Rapid leak sealing for bib taps, mixer valves, braided hoses, and under-sink drainage pipes.',
    typical_duration_minutes: 30,
    estimated_base_price: 199,
    estimated_max_price: 349,
    pricing_guidance: 'Includes washer replacement and thread seal tape installation.',
    required_skills: ['Pipe Joint Sealing', 'Valve Replacement'],
    required_certification_level: 'SKILLED',
    is_restricted: false,
    icon: 'Droplets',
    pricing_disclaimer: MANDATORY_PRICING_DISCLAIMER,
    is_estimated_pricing: true,
  },
  {
    id: 5,
    category: 'Plumber',
    name: 'Water Tank & Booster Pump Overhaul',
    slug: 'water-tank-pump-overhaul',
    description: 'Overhead water tank float valve replacement, non-return valve fitting, and pressure booster pump plumbing.',
    typical_duration_minutes: 90,
    estimated_base_price: 599,
    estimated_max_price: 1199,
    pricing_guidance: 'Covers pipe line rerouting up to 10 feet and pressure testing.',
    required_skills: ['Motor Pump Diagnostics', 'Pressure Testing'],
    required_certification_level: 'CERTIFIED',
    is_restricted: false,
    icon: 'Gauge',
    pricing_disclaimer: MANDATORY_PRICING_DISCLAIMER,
    is_estimated_pricing: true,
  },
  {
    id: 6,
    category: 'Carpenter',
    name: 'Door & Lock Repair / Fitting',
    slug: 'door-lock-repair',
    description: 'Mortise lock installation, cylinder replacement, door realignment, hinge lubrication, and door closer fitting.',
    typical_duration_minutes: 45,
    estimated_base_price: 249,
    estimated_max_price: 449,
    pricing_guidance: 'Covers mortise pocket mortising and striker plate alignment.',
    required_skills: ['Lock Alignment', 'Hinge Fitting'],
    required_certification_level: 'SKILLED',
    is_restricted: false,
    icon: 'Lock',
    pricing_disclaimer: MANDATORY_PRICING_DISCLAIMER,
    is_estimated_pricing: true,
  },
  {
    id: 7,
    category: 'Carpenter',
    name: 'Furniture Assembly & Restoration',
    slug: 'furniture-assembly',
    description: 'Assembly of flat-pack wardrobes, bed frames, study desks, and reinforcing wobbling wooden chairs/tables.',
    typical_duration_minutes: 90,
    estimated_base_price: 499,
    estimated_max_price: 999,
    pricing_guidance: 'Includes cam-lock fastening, dowel gluing, and leveling.',
    required_skills: ['Precision Woodworking', 'Joint Fastening'],
    required_certification_level: 'SKILLED',
    is_restricted: false,
    icon: 'Layers',
    pricing_disclaimer: MANDATORY_PRICING_DISCLAIMER,
    is_estimated_pricing: true,
  },
  {
    id: 8,
    category: 'AC Technician',
    name: 'AC Filter Cleaning & Performance Tune-up',
    slug: 'ac-filter-cleaning',
    description: 'Air filter jet washing, indoor cooling fin brushing, condenser coil flush, and temperature delta testing.',
    typical_duration_minutes: 45,
    estimated_base_price: 349,
    estimated_max_price: 599,
    pricing_guidance: 'Includes airflow velocity measurement and drain tray descaling.',
    required_skills: ['Filter Cleaning', 'Airflow Inspection'],
    required_certification_level: 'SKILLED',
    is_restricted: false,
    icon: 'ThermometerSnowflake',
    pricing_disclaimer: MANDATORY_PRICING_DISCLAIMER,
    is_estimated_pricing: true,
  },
  {
    id: 9,
    category: 'Mechanic',
    name: 'Two-Wheeler General Inspection & Oil Service',
    slug: 'twowheeler-inspection-oil',
    description: 'Engine oil drain & fresh 4T oil refill, spark plug cleanup, carburetor tuning, and brake cable adjustment.',
    typical_duration_minutes: 45,
    estimated_base_price: 299,
    estimated_max_price: 499,
    pricing_guidance: 'Labor fee for doorstep service. Consumables billed transparently at MRP.',
    required_skills: ['Engine Oil Servicing', 'Brake Adjustment'],
    required_certification_level: 'SKILLED',
    is_restricted: false,
    icon: 'Truck',
    pricing_disclaimer: MANDATORY_PRICING_DISCLAIMER,
    is_estimated_pricing: true,
  },
  {
    id: 10,
    category: 'Home Cleaning',
    name: 'Bathroom Deep Cleaning & Descaling',
    slug: 'bathroom-deep-cleaning',
    description: 'Intensive descaling of hard-water stains on tiles, showerhead unclogging, grout scrubbing, and sanitization.',
    typical_duration_minutes: 60,
    estimated_base_price: 399,
    estimated_max_price: 799,
    pricing_guidance: 'Includes eco-friendly non-toxic cleaning agents and machine scrubbers.',
    required_skills: ['Tile Descaling', 'Sanitary Deep Clean'],
    required_certification_level: 'BEGINNER',
    is_restricted: false,
    icon: 'Sparkles',
    pricing_disclaimer: MANDATORY_PRICING_DISCLAIMER,
    is_estimated_pricing: true,
  },
];

export const FALLBACK_TRANSPARENCY_METRICS: TransparencyMetrics = {
  total_completed_jobs: 1248,
  active_cooperative_members: 384,
  total_direct_worker_earnings_inr: 1486500,
  cooperative_welfare_reserve_inr: 74325,
  platform_commission_rate_percent: 0.0,
  platform_held_escrow_balance_inr: 0.0,
  average_customer_rating: 4.88,
  average_arrival_time_minutes: 24,
  social_security_coverage_percent: 89.4,
  cooperative_model: '100% Worker-Owned Cooperative Guild (Zero Middleman)',
  direct_payment_settlement: 'Customer pays Provider Directly (UPI / Cash)',
  governance_mode: 'One Member One Vote Democratic Cooperative Assembly',
};
