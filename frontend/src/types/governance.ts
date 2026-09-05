/**
 * UNNATI Cooperative Governance & Democratic Voting Types
 */

export type ProposalCategory = 'POLICY' | 'BUDGET' | 'ELECTION' | 'WELFARE' | 'SAFETY' | 'DIVIDEND';

export type ProposalStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'PASSED' | 'REJECTED';

export type VotingType = 'YES_NO_ABSTAIN' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';

export type ElectionStatus = 'UPCOMING' | 'ACTIVE' | 'CLOSED' | 'CONCLUDED';

export type AppealStatus = 'NONE' | 'APPEAL_REQUESTED' | 'APPEAL_UPHELD' | 'APPEAL_REJECTED';

export interface CooperativeProposal {
  proposal_id: string;
  title: string;
  description: string;
  category: ProposalCategory;
  proposer_name: string;
  status: ProposalStatus;
  voting_type: VotingType;
  options: string[];
  start_time: string | null;
  end_time: string | null;
  quorum_needed: number;
  total_votes: number;
  tallies?: Record<string, number> | null;
  result_summary?: string | null;
  has_voted?: boolean;
  receipt_token?: string | null;
  is_public: boolean;
  created_at: string;
}

export interface CandidateProfile {
  id: string;
  full_name: string;
  role_sought: string;
  bio?: string;
  vision: string;
  avatar_url?: string;
  endorsements_count?: number;
  worker_profile_id?: number;
}

export interface CooperativeElection {
  election_id: string;
  title: string;
  description?: string;
  role_title: string;
  term: string;
  status: ElectionStatus;
  candidates: CandidateProfile[];
  start_time: string | null;
  end_time: string | null;
  winner_id?: string | null;
  winner_name?: string | null;
  total_votes: number;
  results?: Record<string, number>;
  has_voted?: boolean;
  receipt_token?: string | null;
  created_at: string;
}

export interface GovernanceAuditRecord {
  timestamp: string;
  actor_id: number;
  actor_name: string;
  action: string;
  decision: string;
  notes: string;
}

export interface ReviewCase {
  case_id: string;
  case_type: string;
  status: string;
  target_rating_id?: number | null;
  raised_by_name: string;
  resolution_notes?: string | null;
  evidence_items?: Array<{ id?: string; title: string; description?: string; file_url?: string }>;
  ai_recommendation?: string;
  appeal_status: AppealStatus;
  appeal_notes?: string | null;
  ai_safety_notice?: string;
  audit_trail: GovernanceAuditRecord[];
  created_at: string;
  updated_at: string;
}

export interface BallotSubmissionReceipt {
  receipt_token: string;
  target_id: string;
  choice: string;
  timestamp: string;
  verified: boolean;
}

export interface PublicGovernanceFeed {
  cooperative_name: string;
  transparency_standard: string;
  active_proposals_count: number;
  proposals: CooperativeProposal[];
  elections: CooperativeElection[];
  published_at: string;
}
