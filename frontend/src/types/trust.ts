/**
 * UNNATI Trust, Verification & Two-Way Rating Types
 */

export type VerificationState =
  | 'VERIFIED'
  | 'PENDING'
  | 'FAILED'
  | 'NOT_SUBMITTED'
  | 'DEMO_UNVERIFIED';

export type TwoWayRatingType = 'CUSTOMER_TO_WORKER' | 'WORKER_TO_CUSTOMER';

export interface CustomerRatingCategories {
  craftsmanship: number; // 1-5
  punctuality: number; // 1-5
  conduct: number; // 1-5
  cleanliness: number; // 1-5
}

export interface WorkerRatingCategories {
  fair_treatment: number; // 1-5
  payment_promptness: number; // 1-5
  safe_environment: number; // 1-5
  clear_communication: number; // 1-5
}

export interface TwoWayRatingRecord {
  id: number;
  booking_id: number;
  rating_type: TwoWayRatingType;
  rater_id: number;
  rater_name: string;
  ratee_id: number;
  ratee_name: string;
  overall_rating: number;
  category_scores: Record<string, number>;
  review?: string | null;
  is_flagged: boolean;
  flag_reason?: string | null;
  is_disputed: boolean;
  dispute_status: 'NONE' | 'PENDING_REVIEW' | 'UPHELD' | 'DISMISSED';
  created_at: string;
}

export interface PeerEndorsementRecord {
  id: number;
  skill_name: string;
  endorsement_note?: string | null;
  endorser_id: number;
  endorser_name: string;
  created_at: string;
}

export interface WorkerTrustProfile {
  worker_id: number;
  full_name: string;
  email: string;
  service_category: string;
  experience_years: number;
  trust_score: number; // 0-100
  average_rating: number;
  total_reviews: number;
  verification_states: {
    identity_verification: VerificationState;
    aadhaar_ekyc: VerificationState;
    police_verification: VerificationState;
    skill_certification: VerificationState;
    is_demo: boolean;
  };
  masked_identifiers: {
    aadhaar_masked?: string | null;
    pan_masked?: string | null;
  };
  peer_endorsements: {
    count: number;
    endorsements: PeerEndorsementRecord[];
  };
  skill_badges: string[];
  nsdc_certified: boolean;
  nsdc_trade_name?: string | null;
  skill_india_verified: boolean;
}

export interface GovernanceAuditEntry {
  timestamp: string;
  actor_id: number;
  actor_name: string;
  action: string;
  decision: string;
  notes: string;
}

export interface GovernanceCaseRecord {
  case_id: string;
  case_type: 'RATING_DISPUTE' | 'SUSPICIOUS_BIAS_FLAG' | 'VERIFICATION_APPEAL';
  status: 'OPEN_IN_QUEUE' | 'UNDER_PEER_REVIEW' | 'RESOLVED_UPHELD' | 'RESOLVED_DISMISSED';
  target_rating_id?: number | null;
  raised_by_name: string;
  resolution_notes?: string | null;
  audit_trail: GovernanceAuditEntry[];
  created_at: string;
  updated_at: string;
}
