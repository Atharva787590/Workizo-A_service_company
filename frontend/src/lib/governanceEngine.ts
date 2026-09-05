/**
 * UNNATI Cooperative Governance Engine (Client-Side)
 * ---------------------------------------------------
 * Quorum calculation, voting window deadlines, secret ballot validation,
 * AI recommendation boundary enforcement, and public transparency filters.
 */

import {
  CooperativeProposal,
  CooperativeElection,
  ReviewCase,
  ProposalCategory,
  ProposalStatus
} from '../types/governance';

/**
 * Checks if current time is within the start and end voting period.
 */
export function isVotingWindowOpen(
  startTime?: string | null,
  endTime?: string | null,
  currentDate: Date = new Date()
): { isOpen: boolean; reason?: string } {
  const nowMs = currentDate.getTime();

  if (startTime) {
    const startMs = new Date(startTime).getTime();
    if (nowMs < startMs) {
      return {
        isOpen: false,
        reason: `Voting opens on ${new Date(startTime).toLocaleDateString()}`
      };
    }
  }

  if (endTime) {
    const endMs = new Date(endTime).getTime();
    if (nowMs > endMs) {
      return {
        isOpen: false,
        reason: `Voting closed on ${new Date(endTime).toLocaleDateString()}`
      };
    }
  }

  return { isOpen: true };
}

/**
 * Validates member eligibility on client side prior to modal dispatch.
 */
export function canMemberVoteOnProposal(
  proposal: CooperativeProposal,
  isVerifiedMember: boolean
): { canVote: boolean; reason?: string } {
  if (!isVerifiedMember) {
    return {
      canVote: false,
      reason: 'Only verified cooperative members can cast ballots on resolutions.'
    };
  }

  if (proposal.status !== 'ACTIVE') {
    return {
      canVote: false,
      reason: `Voting is closed for proposals with status '${proposal.status}'.`
    };
  }

  if (proposal.has_voted) {
    return {
      canVote: false,
      reason: 'You have already cast a secret ballot for this resolution.'
    };
  }

  const windowCheck = isVotingWindowOpen(proposal.start_time, proposal.end_time);
  if (!windowCheck.isOpen) {
    return {
      canVote: false,
      reason: windowCheck.reason
    };
  }

  return { canVote: true };
}

/**
 * Calculates percentage of quorum reached.
 */
export function calculateQuorumProgress(
  totalVotes: number,
  quorumNeeded: number
): { percentage: number; reached: boolean; remaining: number } {
  if (quorumNeeded <= 0) return { percentage: 100, reached: true, remaining: 0 };
  const percentage = Math.min(100, Math.round((totalVotes / quorumNeeded) * 100));
  const reached = totalVotes >= quorumNeeded;
  const remaining = Math.max(0, quorumNeeded - totalVotes);

  return { percentage, reached, remaining };
}

/**
 * Enforces peer review boundary: AI recommendations are advisory ONLY.
 * Account suspension or permanent removal mandates human review committee.
 */
export function verifyAIRecommendationSafety(caseItem: ReviewCase): {
  isSafe: boolean;
  requiresHumanCommittee: boolean;
  warning?: string;
} {
  const rec = (caseItem.ai_recommendation || '').toUpperCase();
  const isBanning = rec.includes('SUSPEND') || rec.includes('BAN') || rec.includes('TERMINATE');

  if (isBanning) {
    return {
      isSafe: false,
      requiresHumanCommittee: true,
      warning: 'CRITICAL: AI advisory recommendation flags suspension. Cooperative bylaws strictly forbid automated suspensions. A human review committee vote is mandatory.'
    };
  }

  return {
    isSafe: true,
    requiresHumanCommittee: false
  };
}

/**
 * Returns color token for proposal category badge.
 */
export function getProposalCategoryColor(category: ProposalCategory): { bg: string; text: string; border: string } {
  switch (category) {
    case 'WELFARE':
      return { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' };
    case 'BUDGET':
      return { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' };
    case 'SAFETY':
      return { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' };
    case 'DIVIDEND':
      return { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' };
    case 'ELECTION':
      return { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' };
    case 'POLICY':
    default:
      return { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' };
  }
}

/**
 * Returns badge styling for proposal status.
 */
export function getProposalStatusBadge(status: ProposalStatus): { label: string; bg: string; text: string } {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Active Voting (मतदान जारी)', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', text: 'text-emerald-700' };
    case 'PASSED':
      return { label: 'Passed (स्वीकृत)', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', text: 'text-blue-700' };
    case 'REJECTED':
      return { label: 'Rejected (अस्वीकृत)', bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300', text: 'text-slate-600' };
    case 'CLOSED':
      return { label: 'Voting Closed (मतदान समाप्त)', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', text: 'text-amber-700' };
    case 'DRAFT':
    default:
      return { label: 'Draft (प्रारूप)', bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', text: 'text-gray-600' };
  }
}

/**
 * Filters public governance proposals safely.
 */
export function filterPublicGovernanceProposals(
  proposals: CooperativeProposal[],
  searchQuery: string,
  categoryFilter?: string
): CooperativeProposal[] {
  return proposals.filter(p => {
    if (!p.is_public) return false;
    const matchesCategory = !categoryFilter || categoryFilter === 'ALL' || p.category === categoryFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.proposal_id.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
}

/**
 * High-fidelity fallback / demo fixtures for offline mode and instant testability.
 */
export const MOCK_PROPOSALS: CooperativeProposal[] = [
  {
    proposal_id: 'PROP-2026-001',
    title: 'Monsoon Equipment Emergency Repair Fund (मानसून उपकरण मरम्मत कोष)',
    description: 'Allocate 2.5% of quarterly cooperative surplus to provide zero-interest emergency equipment micro-loans and rainproofing kits for field technicians.',
    category: 'WELFARE',
    proposer_name: 'Guild Welfare Council (कल्याण समिति)',
    status: 'ACTIVE',
    voting_type: 'YES_NO_ABSTAIN',
    options: ['YES', 'NO', 'ABSTAIN'],
    start_time: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    end_time: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    quorum_needed: 10,
    total_votes: 14,
    tallies: { YES: 12, NO: 1, ABSTAIN: 1 },
    has_voted: false,
    is_public: true,
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    proposal_id: 'PROP-2026-002',
    title: 'Fair-Wage Living Rate Indexation 2026-Q3 (उचित मजदूरी सूचकांक अद्यतन)',
    description: 'Mandate baseline minimum wage adjustment from ₹280/hr to ₹310/hr in metro tier-1 clusters aligned with urban inflation indices.',
    category: 'POLICY',
    proposer_name: 'Compensation & Standards Board',
    status: 'ACTIVE',
    voting_type: 'YES_NO_ABSTAIN',
    options: ['YES', 'NO', 'ABSTAIN'],
    start_time: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    end_time: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
    quorum_needed: 15,
    total_votes: 18,
    tallies: { YES: 16, NO: 2, ABSTAIN: 0 },
    has_voted: true,
    receipt_token: 'UNN-VOTE-9A4F2C71B80E',
    is_public: true,
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  },
  {
    proposal_id: 'PROP-2026-003',
    title: 'Annual Cooperative Surplus Patronage Dividend Distribution 2025-26',
    description: 'Approved distribution of ₹4,20,000 cooperative surplus to verified active members proportionally based on completed job hours.',
    category: 'DIVIDEND',
    proposer_name: 'Executive Trustee Council',
    status: 'PASSED',
    voting_type: 'YES_NO_ABSTAIN',
    options: ['YES', 'NO', 'ABSTAIN'],
    start_time: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    end_time: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    quorum_needed: 10,
    total_votes: 38,
    tallies: { YES: 36, NO: 2, ABSTAIN: 0 },
    result_summary: 'Resolution PASSED unanimously with 94.7% affirmative ballots. Payouts credited to member wallets.',
    has_voted: true,
    receipt_token: 'UNN-VOTE-4E82F109A11C',
    is_public: true,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  }
];

export const MOCK_ELECTIONS: CooperativeElection[] = [
  {
    election_id: 'ELEC-2026-01',
    title: '2026 Worker Guild Executive Board Election (श्रमिक मंच कार्यकारी बोर्ड चुनाव)',
    description: 'Democratic secret-ballot election for the two-year term of the Cooperative Welfare & Safety Trustee.',
    role_title: 'Welfare & Safety Trustee (कल्याण एवं सुरक्षा न्यासी)',
    term: '2026-2028',
    status: 'ACTIVE',
    start_time: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    end_time: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    total_votes: 46,
    has_voted: false,
    candidates: [
      {
        id: 'cand_ramesh',
        full_name: 'Ramesh Kumar Sharma (रमेश कुमार शर्मा)',
        role_sought: 'Welfare Trustee',
        bio: 'Senior Master Electrician with 12 years of field experience and 48 peer endorsements.',
        vision: 'Expansion of 100% cashless outpatient medical reimbursement and emergency accidental cover for all active guild craftsmen.',
        endorsements_count: 54
      },
      {
        id: 'cand_sunita',
        full_name: 'Sunita Devi Patel (सुनीता देवी पटेल)',
        role_sought: 'Welfare Trustee',
        bio: 'Lead Appliance Specialist, SHG Representative with 8 years of certified cooperative leadership.',
        vision: 'Establishment of local tool banks in every zone and quarterly guaranteed cooperative dividend reviews.',
        endorsements_count: 67
      }
    ],
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  }
];

export const MOCK_REVIEW_CASES: ReviewCase[] = [
  {
    case_id: 'CASE-2026-081',
    case_type: 'RATING_DISPUTE',
    status: 'OPEN_IN_QUEUE',
    target_rating_id: 104,
    raised_by_name: 'Mukesh Verma (Plumber Guild)',
    resolution_notes: null,
    evidence_items: [
      {
        title: 'Geotagged Arrival Logs',
        description: 'GPS timestamp shows worker arrived at 10:02 AM. Customer logged cancellation at 10:04 AM.'
      },
      {
        title: 'In-App Chat Transcript',
        description: 'Customer confirmed gate entry code provided at 10:03 AM.'
      }
    ],
    ai_recommendation: 'DISMISS_RETALIATORY_NEGATIVE_RATING',
    appeal_status: 'NONE',
    ai_safety_notice: 'AI recommendation is strictly advisory. Account actions require human committee review.',
    audit_trail: [
      {
        timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
        actor_id: 105,
        actor_name: 'Mukesh Verma',
        action: 'DISPUTE_FILED',
        decision: 'PENDING_REVIEW',
        notes: 'Dispute submitted for 1-star rating given after customer was absent.'
      }
    ],
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
  }
];
