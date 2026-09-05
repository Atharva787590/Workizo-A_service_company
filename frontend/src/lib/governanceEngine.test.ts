import { describe, it, expect } from 'vitest';
import {
  isVotingWindowOpen,
  canMemberVoteOnProposal,
  calculateQuorumProgress,
  verifyAIRecommendationSafety,
  getProposalCategoryColor,
  getProposalStatusBadge,
  filterPublicGovernanceProposals,
  MOCK_PROPOSALS
} from './governanceEngine';
import { CooperativeProposal, ReviewCase } from '../types/governance';

describe('UNNATI Governance Engine (Client-Side)', () => {
  const baseProposal: CooperativeProposal = {
    proposal_id: 'PROP-2026-TEST',
    title: 'Test Resolution for Tool Subsidies',
    description: 'Providing subsidized tool maintenance to all cooperative technicians.',
    category: 'WELFARE',
    proposer_name: 'Cooperative Standards Committee',
    status: 'ACTIVE',
    voting_type: 'YES_NO_ABSTAIN',
    options: ['YES', 'NO', 'ABSTAIN'],
    start_time: '2026-09-01T00:00:00Z',
    end_time: '2026-09-15T00:00:00Z',
    quorum_needed: 10,
    total_votes: 6,
    has_voted: false,
    is_public: true,
    created_at: '2026-09-01T00:00:00Z'
  };

  describe('isVotingWindowOpen', () => {
    it('returns true when current time is within window', () => {
      const result = isVotingWindowOpen(
        '2026-09-01T00:00:00Z',
        '2026-09-15T00:00:00Z',
        new Date('2026-09-06T12:00:00Z')
      );
      expect(result.isOpen).toBe(true);
    });

    it('returns false when window has not opened yet', () => {
      const result = isVotingWindowOpen(
        '2026-09-10T00:00:00Z',
        '2026-09-15T00:00:00Z',
        new Date('2026-09-06T12:00:00Z')
      );
      expect(result.isOpen).toBe(false);
      expect(result.reason).toContain('opens on');
    });

    it('returns false when window has expired', () => {
      const result = isVotingWindowOpen(
        '2026-09-01T00:00:00Z',
        '2026-09-05T00:00:00Z',
        new Date('2026-09-06T12:00:00Z')
      );
      expect(result.isOpen).toBe(false);
      expect(result.reason).toContain('closed on');
    });
  });

  describe('canMemberVoteOnProposal', () => {
    it('approves eligible verified member on active proposal', () => {
      const result = canMemberVoteOnProposal(baseProposal, true);
      expect(result.canVote).toBe(true);
    });

    it('blocks unverified member', () => {
      const result = canMemberVoteOnProposal(baseProposal, false);
      expect(result.canVote).toBe(false);
      expect(result.reason).toContain('verified cooperative members');
    });

    it('blocks member if proposal is not ACTIVE', () => {
      const closedProposal = { ...baseProposal, status: 'CLOSED' as const };
      const result = canMemberVoteOnProposal(closedProposal, true);
      expect(result.canVote).toBe(false);
      expect(result.reason).toContain('Voting is closed');
    });

    it('blocks member if already voted', () => {
      const alreadyVoted = { ...baseProposal, has_voted: true };
      const result = canMemberVoteOnProposal(alreadyVoted, true);
      expect(result.canVote).toBe(false);
      expect(result.reason).toContain('already cast');
    });
  });

  describe('calculateQuorumProgress', () => {
    it('correctly reports quorum when reached', () => {
      const result = calculateQuorumProgress(12, 10);
      expect(result.reached).toBe(true);
      expect(result.percentage).toBe(100);
      expect(result.remaining).toBe(0);
    });

    it('correctly reports pending quorum', () => {
      const result = calculateQuorumProgress(4, 10);
      expect(result.reached).toBe(false);
      expect(result.percentage).toBe(40);
      expect(result.remaining).toBe(6);
    });
  });

  describe('verifyAIRecommendationSafety', () => {
    it('flags AI recommendations that propose account suspensions as unsafe without human quorum', () => {
      const caseWithBan: ReviewCase = {
        case_id: 'CASE-01',
        case_type: 'RATING_DISPUTE',
        status: 'OPEN_IN_QUEUE',
        raised_by_name: 'Member',
        ai_recommendation: 'SUSPEND_ACCOUNT_FOR_POLICY_BREACH',
        appeal_status: 'NONE',
        audit_trail: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const safety = verifyAIRecommendationSafety(caseWithBan);
      expect(safety.isSafe).toBe(false);
      expect(safety.requiresHumanCommittee).toBe(true);
      expect(safety.warning).toContain('Cooperative bylaws strictly forbid automated suspensions');
    });

    it('approves benign recommendations for human review', () => {
      const benignCase: ReviewCase = {
        case_id: 'CASE-02',
        case_type: 'RATING_DISPUTE',
        status: 'OPEN_IN_QUEUE',
        raised_by_name: 'Member',
        ai_recommendation: 'DISMISS_RETALIATORY_NEGATIVE_RATING',
        appeal_status: 'NONE',
        audit_trail: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const safety = verifyAIRecommendationSafety(benignCase);
      expect(safety.isSafe).toBe(true);
      expect(safety.requiresHumanCommittee).toBe(false);
    });
  });

  describe('getProposalCategoryColor & getProposalStatusBadge', () => {
    it('returns valid color classes for each category', () => {
      expect(getProposalCategoryColor('WELFARE').text).toContain('emerald');
      expect(getProposalCategoryColor('BUDGET').text).toContain('amber');
      expect(getProposalCategoryColor('SAFETY').text).toContain('rose');
      expect(getProposalCategoryColor('POLICY').text).toContain('sky');
    });

    it('returns bilingual badges for statuses', () => {
      expect(getProposalStatusBadge('ACTIVE').label).toContain('मतदान जारी');
      expect(getProposalStatusBadge('PASSED').label).toContain('स्वीकृत');
      expect(getProposalStatusBadge('REJECTED').label).toContain('अस्वीकृत');
    });
  });

  describe('filterPublicGovernanceProposals', () => {
    it('filters by category and search term correctly', () => {
      const filtered = filterPublicGovernanceProposals(MOCK_PROPOSALS, 'Monsoon', 'WELFARE');
      expect(filtered.length).toBe(1);
      expect(filtered[0].proposal_id).toBe('PROP-2026-001');

      const noMatch = filterPublicGovernanceProposals(MOCK_PROPOSALS, 'NonExistentXYZ');
      expect(noMatch.length).toBe(0);
    });
  });
});
