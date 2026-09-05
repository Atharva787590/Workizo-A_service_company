import React, { useState, useEffect } from 'react';
import {
  Vote,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Users,
  PlusCircle,
  Copy,
  Check,
  Search,
  Filter,
  Eye,
  X,
  FileCheck,
  Building,
  UserCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import {
  CooperativeProposal,
  CooperativeElection,
  ReviewCase,
  ProposalCategory,
  CandidateProfile
} from '../types/governance';
import {
  MOCK_PROPOSALS,
  MOCK_ELECTIONS,
  MOCK_REVIEW_CASES,
  calculateQuorumProgress,
  canMemberVoteOnProposal,
  getProposalCategoryColor,
  getProposalStatusBadge,
  filterPublicGovernanceProposals,
  verifyAIRecommendationSafety
} from '../lib/governanceEngine';

export const CooperativeGovernanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'proposals' | 'elections' | 'review' | 'history'>('proposals');
  const [proposals, setProposals] = useState<CooperativeProposal[]>(MOCK_PROPOSALS);
  const [elections, setElections] = useState<CooperativeElection[]>(MOCK_ELECTIONS);
  const [reviewCases, setReviewCases] = useState<ReviewCase[]>(MOCK_REVIEW_CASES);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Voting Modal State
  const [selectedProposal, setSelectedProposal] = useState<CooperativeProposal | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [voteReceipt, setVoteReceipt] = useState<string | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Election Ballot Modal State
  const [selectedElection, setSelectedElection] = useState<CooperativeElection | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);
  const [electionReceipt, setElectionReceipt] = useState<string | null>(null);

  // New Proposal Form Modal
  const [isNewProposalOpen, setIsNewProposalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<ProposalCategory>('POLICY');
  const [newDurationDays, setNewDurationDays] = useState('7');
  const [newQuorumNeeded, setNewQuorumNeeded] = useState('5');

  // Appeal Modal State
  const [appealCase, setAppealCase] = useState<ReviewCase | null>(null);
  const [appealReason, setAppealReason] = useState('');

  // Fetch real data on mount with fallback to offline mock data
  useEffect(() => {
    fetchGovernanceData();
  }, []);

  const fetchGovernanceData = async () => {
    setIsLoading(true);
    try {
      const [propRes, elecRes, caseRes] = await Promise.allSettled([
        api.get('/api/workers/governance/proposals/'),
        api.get('/api/workers/governance/elections/'),
        api.get('/api/workers/governance/cases/')
      ]);

      if (propRes.status === 'fulfilled' && Array.isArray(propRes.value.data) && propRes.value.data.length > 0) {
        setProposals(propRes.value.data);
      }
      if (elecRes.status === 'fulfilled' && Array.isArray(elecRes.value.data) && elecRes.value.data.length > 0) {
        setElections(elecRes.value.data);
      }
      if (caseRes.status === 'fulfilled' && Array.isArray(caseRes.value.data) && caseRes.value.data.length > 0) {
        setReviewCases(caseRes.value.data);
      }
    } catch {
      // Retain offline default mocks
    } finally {
      setIsLoading(false);
    }
  };

  const handleCastVote = async () => {
    if (!selectedProposal || !selectedChoice) {
      toast.error('Please select a voting option.');
      return;
    }

    setIsSubmittingVote(true);
    try {
      const idempotencyKey = `vote-${selectedProposal.proposal_id}-${Date.now()}`;
      const res = await api.post(`/api/workers/governance/proposals/${selectedProposal.proposal_id}/vote/`, {
        choice: selectedChoice,
        idempotency_key: idempotencyKey
      });

      const receipt = res.data?.receipt_token || `UNN-VOTE-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      setVoteReceipt(receipt);
      toast.success('Your secret ballot has been cast and recorded!');

      // Update local state
      setProposals(prev =>
        prev.map(p => {
          if (p.proposal_id === selectedProposal.proposal_id) {
            const tallies = { ...(p.tallies || {}) };
            tallies[selectedChoice] = (tallies[selectedChoice] || 0) + 1;
            return {
              ...p,
              has_voted: true,
              receipt_token: receipt,
              total_votes: p.total_votes + 1,
              tallies
            };
          }
          return p;
        })
      );
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to submit ballot.';
      toast.error(errorMsg);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleCastElectionBallot = async () => {
    if (!selectedElection || !selectedCandidate) {
      toast.error('Please select a candidate.');
      return;
    }

    setIsSubmittingVote(true);
    try {
      const idempotencyKey = `elec-${selectedElection.election_id}-${Date.now()}`;
      const res = await api.post(`/api/workers/governance/elections/${selectedElection.election_id}/vote/`, {
        candidate_id: selectedCandidate.id,
        idempotency_key: idempotencyKey
      });

      const receipt = res.data?.receipt_token || `UNN-ELEC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      setElectionReceipt(receipt);
      toast.success('Election ballot cast securely!');

      setElections(prev =>
        prev.map(e => {
          if (e.election_id === selectedElection.election_id) {
            return {
              ...e,
              has_voted: true,
              receipt_token: receipt,
              total_votes: e.total_votes + 1
            };
          }
          return e;
        })
      );
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to cast election ballot.';
      toast.error(errorMsg);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      toast.error('Please provide both title and description.');
      return;
    }

    try {
      const res = await api.post('/api/workers/governance/proposals/', {
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        options: ['YES', 'NO', 'ABSTAIN'],
        duration_days: parseInt(newDurationDays, 10) || 7,
        quorum_needed: parseInt(newQuorumNeeded, 10) || 5
      });

      toast.success('Cooperative resolution tabled successfully!');
      setIsNewProposalOpen(false);
      setNewTitle('');
      setNewDescription('');

      if (res.data?.proposal_id) {
        const createdProposal: CooperativeProposal = {
          proposal_id: res.data.proposal_id,
          title: newTitle.trim(),
          description: newDescription.trim(),
          category: newCategory,
          proposer_name: 'You (Guild Member)',
          status: 'ACTIVE',
          voting_type: 'YES_NO_ABSTAIN',
          options: ['YES', 'NO', 'ABSTAIN'],
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + (parseInt(newDurationDays, 10) || 7) * 86400000).toISOString(),
          quorum_needed: parseInt(newQuorumNeeded, 10) || 5,
          total_votes: 0,
          has_voted: false,
          is_public: true,
          created_at: new Date().toISOString()
        };
        setProposals(prev => [createdProposal, ...prev]);
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to submit proposal.';
      toast.error(errorMsg);
    }
  };

  const handleLodgeAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealCase || !appealReason.trim()) return;

    try {
      await api.post(`/api/workers/governance/cases/${appealCase.case_id}/appeal/`, {
        appeal_reason: appealReason.trim()
      });
      toast.success('Appeal submitted for Review Board re-examination.');
      setReviewCases(prev =>
        prev.map(c =>
          c.case_id === appealCase.case_id
            ? { ...c, appeal_status: 'APPEAL_REQUESTED', appeal_notes: appealReason.trim() }
            : c
        )
      );
      setAppealCase(null);
      setAppealReason('');
    } catch {
      toast.error('Failed to lodge appeal.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    toast.success('Ballot receipt copied to clipboard!');
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const filteredProposals = filterPublicGovernanceProposals(proposals, searchQuery, categoryFilter);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Cooperative Identity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 mb-3">
              <Building className="w-3.5 h-3.5 text-amber-700" />
              <span>UNNATI Worker Guild Cooperative (उन्नति श्रमिक मंच)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <Vote className="w-8 h-8 text-sky-600 dark:text-sky-400" />
              <span>Cooperative Governance & Voting</span>
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              One Member, One Vote. Transparent democratic decision-making with cryptographic secret ballots and zero automated account suspensions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isLoading && (
              <span className="text-xs text-sky-600 dark:text-sky-400 font-medium animate-pulse flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                Syncing resolutions...
              </span>
            )}
            <button
              onClick={() => setIsNewProposalOpen(true)}
              className="unnati-touch-target inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Table New Proposal (नया प्रस्ताव)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 dark:border-slate-800 flex overflow-x-auto no-scrollbar gap-2 sm:gap-6">
          <button
            onClick={() => setActiveTab('proposals')}
            className={`unnati-touch-target flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'proposals'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Vote className="w-4 h-4" />
            <span>Active Resolutions ({proposals.filter(p => p.status === 'ACTIVE').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('elections')}
            className={`unnati-touch-target flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'elections'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Board Elections ({elections.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`unnati-touch-target flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'review'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Peer Review Board ({reviewCases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`unnati-touch-target flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Finalized Decisions ({proposals.filter(p => p.status !== 'ACTIVE').length})</span>
          </button>
        </div>

        {/* TAB 1: ACTIVE RESOLUTIONS */}
        {activeTab === 'proposals' && (
          <div className="space-y-6">
            {/* Search & Category Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search resolutions by keyword..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                {['ALL', 'POLICY', 'WELFARE', 'BUDGET', 'DIVIDEND', 'SAFETY'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      categoryFilter === cat
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolutions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProposals
                .filter(p => p.status === 'ACTIVE')
                .map(proposal => {
                  const categoryStyle = getProposalCategoryColor(proposal.category);
                  const statusBadge = getProposalStatusBadge(proposal.status);
                  const quorum = calculateQuorumProgress(proposal.total_votes, proposal.quorum_needed);
                  const eligibility = canMemberVoteOnProposal(proposal, true);

                  return (
                    <div
                      key={proposal.proposal_id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                              {proposal.category}
                            </span>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusBadge.bg}`}>
                              {statusBadge.label}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                            {proposal.proposal_id}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                            {proposal.title}
                          </h3>
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                            {proposal.description}
                          </p>
                        </div>

                        {/* Proposer & Deadlines */}
                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>Proposer: {proposal.proposer_name}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Voting closes in 4 days</span>
                          </span>
                        </div>

                        {/* Quorum Meter */}
                        <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-600 dark:text-slate-300">Participation & Quorum</span>
                            <span className={quorum.reached ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500'}>
                              {proposal.total_votes} votes cast ({quorum.reached ? 'Quorum Met' : `${quorum.remaining} needed`})
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${quorum.reached ? 'bg-emerald-500' : 'bg-sky-500'}`}
                              style={{ width: `${quorum.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Vote Action or Receipt Confirmation */}
                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        {proposal.has_voted ? (
                          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-medium">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <div>
                                <div>Secret Ballot Recorded</div>
                                <div className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                                  Receipt: {proposal.receipt_token || 'UNN-VOTE-CONFIRMED'}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => copyToClipboard(proposal.receipt_token || 'UNN-VOTE-CONFIRMED')}
                              className="p-1.5 text-emerald-700 hover:text-emerald-900 rounded-lg hover:bg-emerald-100/50"
                              title="Copy ballot receipt"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setSelectedChoice('YES');
                              setVoteReceipt(null);
                            }}
                            disabled={!eligibility.canVote}
                            className="w-full unnati-touch-target py-2.5 px-4 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                          >
                            <Vote className="w-4 h-4" />
                            <span>Cast Secret Ballot (गुप्त मतदान करें)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 2: BOARD ELECTIONS */}
        {activeTab === 'elections' && (
          <div className="space-y-6">
            {elections.map(election => (
              <div
                key={election.election_id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      Term: {election.term} • Official Ballot
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {election.title}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {election.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <Clock className="w-3.5 h-3.5" />
                      Voting Active
                    </span>
                    <div className="text-xs text-slate-400 mt-1">{election.total_votes} ballots cast</div>
                  </div>
                </div>

                {/* Candidate Slate */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {election.candidates.map(candidate => (
                    <div
                      key={candidate.id}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {candidate.full_name}
                          </h4>
                          <span className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                            ★ {candidate.endorsements_count} endorsements
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                          "{candidate.vision}"
                        </p>
                        {candidate.bio && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {candidate.bio}
                          </p>
                        )}
                      </div>

                      {election.has_voted ? (
                        <div className="text-xs text-emerald-600 font-medium text-center py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                          ✓ Ballot Cast
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedElection(election);
                            setSelectedCandidate(candidate);
                            setElectionReceipt(null);
                          }}
                          className="w-full unnati-touch-target py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Vote for {candidate.full_name.split(' ')[0]}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {election.has_voted && (
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Your election ballot receipt token: <strong className="font-mono text-sky-600 dark:text-sky-400">{election.receipt_token || 'UNN-ELEC-48B1C9'}</strong></span>
                    <button
                      onClick={() => copyToClipboard(election.receipt_token || 'UNN-ELEC-48B1C9')}
                      className="inline-flex items-center gap-1 text-sky-600 hover:underline"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Receipt
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: PEER REVIEW BOARD */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            {/* AI Safety Boundary Notice Banner */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-5 flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-bold">Cooperative Principle: Human Committee Sovereign Authority</div>
                <p>
                  AI algorithms may detect patterns and suggest advisory actions, but <strong>AI is strictly forbidden from independently suspending or terminating accounts</strong>. All dispute verdicts require human peer review committee quorum.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {reviewCases.map(c => {
                const safety = verifyAIRecommendationSafety(c);

                return (
                  <div
                    key={c.case_id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-mono text-slate-400">{c.case_id}</span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          Dispute Review: {c.case_type} (Raised by {c.raised_by_name})
                        </h4>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        {c.status}
                      </span>
                    </div>

                    {/* Evidence Logs */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Submitted Evidence:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(c.evidence_items || []).map((item, idx) => (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-xs space-y-1">
                            <div className="font-semibold text-slate-900 dark:text-white">{item.title}</div>
                            <div className="text-slate-500 dark:text-slate-400">{item.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Advisory Recommendation */}
                    <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-3.5 text-xs space-y-1">
                      <div className="font-semibold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-sky-600" />
                        <span>AI Advisory Suggestion (परामर्श मात्र): {c.ai_recommendation}</span>
                      </div>
                      <div className="text-sky-700 dark:text-sky-300">{c.ai_safety_notice}</div>
                      {safety.warning && (
                        <div className="text-rose-600 dark:text-rose-400 font-semibold mt-1">
                          {safety.warning}
                        </div>
                      )}
                    </div>

                    {/* Appeal Status & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-xs text-slate-500">
                        Appeal Status: <strong className="text-slate-700 dark:text-slate-300">{c.appeal_status}</strong>
                      </div>
                      {c.appeal_status === 'NONE' && (
                        <button
                          onClick={() => setAppealCase(c)}
                          className="unnati-touch-target px-3 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                        >
                          Lodge Appeal (अपील प्रस्तुत करें)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: FINALIZED DECISIONS & HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Cooperative Governance Transparency Archive
                </h3>
                <span className="text-xs text-slate-500">Public ICA Cooperative Audit Standard</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                All finalized resolutions and aggregate voter tallies are archived publicly for complete cooperative accountability. Member ballot choices remain strictly confidential.
              </p>

              <div className="space-y-4 pt-2">
                {proposals
                  .filter(p => p.status !== 'ACTIVE')
                  .map(p => {
                    const statusBadge = getProposalStatusBadge(p.status);
                    return (
                      <div
                        key={p.proposal_id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {p.title}
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusBadge.bg}`}>
                            {statusBadge.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{p.description}</p>
                        {p.result_summary && (
                          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            {p.result_summary}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                          <span>Total participation: {p.total_votes} members</span>
                          <span>Outcome ratified</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Cast Secret Ballot on Resolution */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 relative">
            <button
              onClick={() => setSelectedProposal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-mono text-sky-600 dark:text-sky-400">{selectedProposal.proposal_id}</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {selectedProposal.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                {selectedProposal.description}
              </p>
            </div>

            {voteReceipt ? (
              <div className="space-y-4 bg-emerald-50 dark:bg-emerald-950/40 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div>
                  <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
                    Ballot Cast & Confirmed!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    Your choice is protected by the UNNATI cryptographic secret ballot protocol.
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-300 dark:border-emerald-700 font-mono text-xs font-bold text-slate-800 dark:text-slate-100 select-all">
                  {voteReceipt}
                </div>
                <button
                  onClick={() => copyToClipboard(voteReceipt)}
                  className="unnati-touch-target inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  {copiedReceipt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedReceipt ? 'Copied!' : 'Copy Verification Receipt'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Select Your Vote (मतदान विकल्प चुनें):
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {selectedProposal.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelectedChoice(opt)}
                      className={`py-3 px-2 rounded-xl text-center text-xs font-bold transition-all border ${
                        selectedChoice === opt
                          ? opt === 'YES'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                            : opt === 'NO'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-105'
                            : 'bg-amber-600 text-white border-amber-600 shadow-md scale-105'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt === 'YES' && '✓ FOR (हाँ)'}
                      {opt === 'NO' && '✗ AGAINST (नहीं)'}
                      {opt === 'ABSTAIN' && '— ABSTAIN (तटस्थ)'}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <span>One-member-one-vote rule enforced. Your voting choice will NEVER be displayed publicly.</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setSelectedProposal(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCastVote}
                    disabled={isSubmittingVote}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    {isSubmittingVote ? 'Submitting Ballot...' : 'Confirm Vote (मत दर्ज करें)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Board Election Ballot Confirmation */}
      {selectedElection && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative">
            <button
              onClick={() => {
                setSelectedElection(null);
                setSelectedCandidate(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold uppercase text-sky-600 dark:text-sky-400">
                Board Election Ballot
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Confirm Vote for {selectedCandidate.full_name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Role: {selectedElection.role_title} ({selectedElection.term})
              </p>
            </div>

            {electionReceipt ? (
              <div className="space-y-4 bg-emerald-50 dark:bg-emerald-950/40 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                  Election Ballot Sealed & Counted
                </h4>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
                  {electionReceipt}
                </div>
                <button
                  onClick={() => {
                    setSelectedElection(null);
                    setSelectedCandidate(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Candidate Manifesto:</div>
                  <p className="text-slate-600 dark:text-slate-400 italic">"{selectedCandidate.vision}"</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedElection(null);
                      setSelectedCandidate(null);
                    }}
                    className="flex-1 py-2 px-3 border border-slate-300 dark:border-slate-700 text-xs font-medium rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCastElectionBallot}
                    disabled={isSubmittingVote}
                    className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl"
                  >
                    {isSubmittingVote ? 'Sealing Ballot...' : 'Cast Secret Ballot'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Table New Proposal Form */}
      {isNewProposalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative">
            <button
              onClick={() => setIsNewProposalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Table a Cooperative Resolution (नया प्रस्ताव दर्ज करें)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                All cooperative members can introduce policy, welfare, and rate resolutions for democratic guild voting.
              </p>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Title (प्रस्ताव शीर्षक) *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., Annual Tool Subsidy & Rainproofing Gear"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category (श्रेणी) *
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as ProposalCategory)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="POLICY">POLICY (नीति)</option>
                  <option value="WELFARE">WELFARE (कल्याण)</option>
                  <option value="BUDGET">BUDGET (बजट)</option>
                  <option value="DIVIDEND">DIVIDEND (लाभांश)</option>
                  <option value="SAFETY">SAFETY (सुरक्षा)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Justification (विस्तृत विवरण) *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Explain why this resolution benefits the cooperative and how it will be funded..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Voting Period (Days)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="30"
                    value={newDurationDays}
                    onChange={e => setNewDurationDays(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quorum Required (Votes)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="100"
                    value={newQuorumNeeded}
                    onChange={e => setNewQuorumNeeded(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProposalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  Table Resolution (प्रस्ताव प्रस्तुत करें)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Dispute Appeal Modal */}
      {appealCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 relative">
            <button
              onClick={() => setAppealCase(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Lodge Governance Appeal: {appealCase.case_id}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your appeal will be reviewed directly by the elected Senior Governance Committee.
              </p>
            </div>

            <form onSubmit={handleLodgeAppeal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Appeal Justification & Additional Evidence *
                </label>
                <textarea
                  required
                  rows={4}
                  value={appealReason}
                  onChange={e => setAppealReason(e.target.value)}
                  placeholder="Detail the facts, arrival logs, or photographic proof supporting this appeal..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAppealCase(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold"
                >
                  Submit Appeal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CooperativeGovernanceDashboard;
