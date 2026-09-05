/**
 * UNNATI Service Catalog & Cooperative Transparency Types
 */

export interface ServiceCatalogItem {
  id: number;
  category: string;
  name: string;
  slug: string;
  description: string;
  typical_duration_minutes: number;
  estimated_base_price: number;
  estimated_max_price: number;
  pricing_guidance: string;
  required_skills: string[];
  required_certification_level: 'BEGINNER' | 'SKILLED' | 'CERTIFIED' | 'EXPERT';
  is_restricted: boolean;
  icon?: string;
  pricing_disclaimer?: string;
  is_estimated_pricing?: boolean;
}

export interface PublicProviderProfile {
  id: number;
  display_name: string;
  avatar_initials: string;
  service_category: string;
  approximate_area: string;
  years_of_experience: number;
  rating: number;
  review_count: number;
  is_verified: boolean;
  cooperative_tier: string;
  verified_skills: string[];
  verified_certifications_count: number;
  online_status: boolean;
}

export interface TransparencyMetrics {
  total_completed_jobs: number;
  active_cooperative_members: number;
  total_direct_worker_earnings_inr: number;
  cooperative_welfare_reserve_inr: number;
  platform_commission_rate_percent: number;
  platform_held_escrow_balance_inr: number;
  average_customer_rating: number;
  average_arrival_time_minutes: number;
  social_security_coverage_percent: number;
  cooperative_model: string;
  direct_payment_settlement: string;
  governance_mode: string;
}

export type SocialSecurityStatus = 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'NOT_ENROLLED' | 'UNVERIFIED';

export interface SocialSecurityRecord {
  id: number | null;
  scheme_code: 'PMSBY' | 'PMJJBY' | 'PM_JAY' | 'E_SHRAM' | 'PM_SYM' | 'COOP_WELFARE' | string;
  scheme_name: string;
  scheme_type: string;
  coverage_amount_inr: number;
  status: SocialSecurityStatus;
  policy_reference?: string | null;
  enrolled_date?: string | null;
  expiry_date?: string | null;
  verified_by_cooperative: boolean;
  verification_notes?: string;
  administering_body: string;
  is_enrolled: boolean;
}

export interface TransparencyPolicyItem {
  title: string;
  description: string;
  formula?: string;
  tiers?: string[];
}

export interface TransparencyPolicies {
  cooperative_structure: TransparencyPolicyItem;
  direct_payment_model: TransparencyPolicyItem;
  fair_wage_formula: TransparencyPolicyItem;
  cooperative_dividend: TransparencyPolicyItem;
  booking_cancellation_rules: TransparencyPolicyItem;
  verification_methodology: TransparencyPolicyItem;
}
