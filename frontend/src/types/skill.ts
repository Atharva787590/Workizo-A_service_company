/**
 * UNNATI Worker Skill Development & Certification Type Contracts
 */

export type SkillProficiency = 'BEGINNER' | 'SKILLED' | 'CERTIFIED' | 'EXPERT';

export type CertificationStatus =
  | 'VERIFIED'
  | 'PENDING'
  | 'EXPIRED'
  | 'REJECTED'
  | 'DEMO_UNVERIFIED';

export interface WorkerSkillRecord {
  id: number;
  name: string;
  category_id?: number | null;
  proficiency: SkillProficiency;
  years_of_experience: number;
  is_verified: boolean;
  created_at?: string;
}

export interface WorkerCertificationRecord {
  id: number;
  certification_name: string;
  issuing_organization: string;
  credential_id?: string | null;
  issue_date: string;
  expiry_date?: string | null;
  verification_status: CertificationStatus;
  verification_notes?: string | null;
  document_url?: string | null;
  created_at?: string;
}

export interface LearningRecommendation {
  course_title: string;
  provider: string;
  skill_gained: string;
  estimated_duration: string;
  mode: string;
  certification_level: string;
  demand_trend: string;
}

export interface SkillProgressionMeta {
  level: number;
  title: string;
  description: string;
  progressPercent: number;
  nextMilestone: string;
}
