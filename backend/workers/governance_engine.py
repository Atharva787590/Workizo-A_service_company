"""
UNNATI Cooperative Governance Engine
-----------------------------------
Server-authoritative proposal voting, board elections, secret ballot protection,
peer review committee workflows, and public-safe transparency feeds.
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import hashlib
import uuid

# Secret salt for cryptographic voter hashing (secret ballot protection)
VOTER_HASH_SALT = "UNNATI_COOP_GOVERNANCE_SECRET_SALT_2026"

PROPOSAL_CATEGORIES = ['POLICY', 'BUDGET', 'ELECTION', 'WELFARE', 'SAFETY', 'DIVIDEND']
PROPOSAL_STATUSES = ['DRAFT', 'ACTIVE', 'CLOSED', 'PASSED', 'REJECTED']
VOTING_TYPES = ['YES_NO_ABSTAIN', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE']

DEFAULT_OPTIONS = {
    'YES_NO_ABSTAIN': ['YES', 'NO', 'ABSTAIN'],
    'SINGLE_CHOICE': ['OPTION_A', 'OPTION_B'],
    'MULTIPLE_CHOICE': ['OPTION_A', 'OPTION_B', 'OPTION_C']
}


def compute_voter_hash(user_id: int, target_id: str, context: str = 'proposal') -> str:
    """
    Computes a deterministic, anonymized voter hash.
    Ensures one-member-one-vote enforcement without tying member identity to the ballot choice.
    """
    raw = f"{context}:{target_id}:user:{user_id}:{VOTER_HASH_SALT}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()


def generate_ballot_receipt(target_id: str, voter_hash: str, choice: str) -> str:
    """Generates a verifiable, tamper-evident ballot receipt token for the voter."""
    timestamp = datetime.now(timezone.utc).isoformat()
    raw = f"receipt:{target_id}:{voter_hash}:{choice}:{timestamp}"
    token_digest = hashlib.sha256(raw.encode('utf-8')).hexdigest()[:16].upper()
    return f"UNN-VOTE-{token_digest}"


def validate_voting_eligibility(
    user_id: Optional[int],
    is_verified_member: bool,
    proposal: Dict[str, Any],
    existing_voter_hashes: List[str],
    current_time: Optional[datetime] = None
) -> Tuple[bool, str]:
    """
    Authoritative server-side check for proposal voting eligibility.
    Rules:
      1. User must be an authenticated, verified cooperative member.
      2. Proposal must be in 'ACTIVE' status.
      3. Current time must be between start_time and end_time (voting deadlines).
      4. One-member-one-vote: user's voter hash must not already exist in previous ballots.
    """
    if not user_id or not is_verified_member:
        return False, "Only verified cooperative members are eligible to cast ballots."

    status = (proposal.get('status') or '').upper()
    if status != 'ACTIVE':
        return False, f"Voting is not permitted on proposal with status: {status}."

    now = current_time or datetime.now(timezone.utc)
    
    start_time_raw = proposal.get('start_time')
    end_time_raw = proposal.get('end_time')

    if start_time_raw:
        start_time = datetime.fromisoformat(str(start_time_raw).replace('Z', '+00:00')) if isinstance(start_time_raw, str) else start_time_raw
        if now < start_time:
            return False, "Voting window has not opened yet."

    if end_time_raw:
        end_time = datetime.fromisoformat(str(end_time_raw).replace('Z', '+00:00')) if isinstance(end_time_raw, str) else end_time_raw
        if now > end_time:
            return False, "Voting deadline has passed. This proposal is closed."

    voter_hash = compute_voter_hash(user_id, proposal.get('proposal_id', ''), context='proposal')
    if voter_hash in existing_voter_hashes:
        return False, "Duplicate vote rejected: You have already cast your ballot for this resolution."

    return True, "Eligible to vote"


def record_proposal_vote(
    proposal: Dict[str, Any],
    user_id: int,
    is_verified_member: bool,
    choice: str,
    existing_voter_hashes: List[str],
    current_time: Optional[datetime] = None
) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """
    Records a vote on a resolution and returns a receipt while preserving secret ballot privacy.
    """
    eligible, reason = validate_voting_eligibility(
        user_id=user_id,
        is_verified_member=is_verified_member,
        proposal=proposal,
        existing_voter_hashes=existing_voter_hashes,
        current_time=current_time
    )
    if not eligible:
        return False, reason, None

    valid_options = proposal.get('options') or DEFAULT_OPTIONS['YES_NO_ABSTAIN']
    clean_choice = str(choice).strip().upper()
    if clean_choice not in [str(opt).upper() for opt in valid_options]:
        return False, f"Invalid choice '{choice}'. Must be one of: {valid_options}", None

    voter_hash = compute_voter_hash(user_id, proposal.get('proposal_id', ''), context='proposal')
    receipt = generate_ballot_receipt(proposal.get('proposal_id', ''), voter_hash, clean_choice)

    ballot_record = {
        "proposal_id": proposal.get('proposal_id'),
        "voter_hash": voter_hash,
        "choice": clean_choice,
        "receipt_token": receipt,
        "timestamp": (current_time or datetime.now(timezone.utc)).isoformat()
    }

    return True, "Vote recorded successfully", ballot_record


def calculate_proposal_results(
    proposal: Dict[str, Any],
    ballots: List[Dict[str, Any]],
    quorum_needed: int = 5
) -> Dict[str, Any]:
    """
    Authoritative calculation of voting outcomes:
    - Tallies votes per option.
    - Verifies quorum.
    - Determines winning outcome and final resolution status (PASSED/REJECTED).
    """
    options = proposal.get('options') or DEFAULT_OPTIONS['YES_NO_ABSTAIN']
    tallies: Dict[str, int] = {str(opt).upper(): 0 for opt in options}
    
    total_votes = len(ballots)
    for b in ballots:
        ch = str(b.get('choice', '')).upper()
        if ch in tallies:
            tallies[ch] += 1
        else:
            tallies[ch] = tallies.get(ch, 0) + 1

    quorum_reached = total_votes >= quorum_needed

    # Determination
    if not quorum_reached:
        final_status = 'REJECTED'
        summary = f"Resolution rejected: Quorum not met ({total_votes}/{quorum_needed} required votes cast)."
        winning_option = None
    else:
        # Check majority
        # For YES_NO_ABSTAIN, YES must exceed NO
        if set(tallies.keys()) == {'YES', 'NO', 'ABSTAIN'} or ('YES' in tallies and 'NO' in tallies):
            yes_count = tallies.get('YES', 0)
            no_count = tallies.get('NO', 0)
            if yes_count > no_count:
                final_status = 'PASSED'
                winning_option = 'YES'
                summary = f"Resolution PASSED with {yes_count} FOR vs {no_count} AGAINST."
            else:
                final_status = 'REJECTED'
                winning_option = 'NO'
                summary = f"Resolution REJECTED with {no_count} AGAINST vs {yes_count} FOR."
        else:
            # Multi choice: option with max votes
            sorted_options = sorted(tallies.items(), key=lambda x: x[1], reverse=True)
            winning_option, max_count = sorted_options[0] if sorted_options else (None, 0)
            final_status = 'PASSED' if max_count > 0 else 'REJECTED'
            summary = f"Winning choice: {winning_option} with {max_count} votes."

    return {
        "proposal_id": proposal.get('proposal_id'),
        "total_votes": total_votes,
        "quorum_needed": quorum_needed,
        "quorum_reached": quorum_reached,
        "tallies": tallies,
        "winning_option": winning_option,
        "final_status": final_status,
        "summary": summary
    }


def validate_election_voting_eligibility(
    user_id: Optional[int],
    is_verified_member: bool,
    election: Dict[str, Any],
    existing_voter_hashes: List[str],
    current_time: Optional[datetime] = None
) -> Tuple[bool, str]:
    """
    Validates eligibility for casting a secret ballot in a board election.
    """
    if not user_id or not is_verified_member:
        return False, "Only verified cooperative members are eligible to vote in board elections."

    status = (election.get('status') or '').upper()
    if status != 'ACTIVE':
        return False, f"Election is not currently active (status: {status})."

    now = current_time or datetime.now(timezone.utc)
    start_time_raw = election.get('start_time')
    end_time_raw = election.get('end_time')

    if start_time_raw:
        start_time = datetime.fromisoformat(str(start_time_raw).replace('Z', '+00:00')) if isinstance(start_time_raw, str) else start_time_raw
        if now < start_time:
            return False, "Election voting period has not commenced."

    if end_time_raw:
        end_time = datetime.fromisoformat(str(end_time_raw).replace('Z', '+00:00')) if isinstance(end_time_raw, str) else end_time_raw
        if now > end_time:
            return False, "Election voting deadline has concluded."

    voter_hash = compute_voter_hash(user_id, election.get('election_id', ''), context='election')
    if voter_hash in existing_voter_hashes:
        return False, "Duplicate ballot rejected: You have already cast your vote in this election."

    return True, "Eligible to vote"


def record_election_ballot(
    election: Dict[str, Any],
    user_id: int,
    is_verified_member: bool,
    candidate_id: str,
    existing_voter_hashes: List[str],
    current_time: Optional[datetime] = None
) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """
    Casts a secret ballot for a candidate in an election.
    """
    eligible, reason = validate_election_voting_eligibility(
        user_id=user_id,
        is_verified_member=is_verified_member,
        election=election,
        existing_voter_hashes=existing_voter_hashes,
        current_time=current_time
    )
    if not eligible:
        return False, reason, None

    valid_candidate_ids = [str(c.get('id')) for c in election.get('candidates', [])]
    if str(candidate_id) not in valid_candidate_ids:
        return False, f"Candidate ID '{candidate_id}' is not on the official election ballot.", None

    voter_hash = compute_voter_hash(user_id, election.get('election_id', ''), context='election')
    receipt = generate_ballot_receipt(election.get('election_id', ''), voter_hash, str(candidate_id))

    ballot_record = {
        "election_id": election.get('election_id'),
        "voter_hash": voter_hash,
        "candidate_id": str(candidate_id),
        "receipt_token": receipt,
        "timestamp": (current_time or datetime.now(timezone.utc)).isoformat()
    }

    return True, "Ballot cast successfully", ballot_record


def calculate_election_results(
    election: Dict[str, Any],
    ballots: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Tallies election ballots and determines the elected board member."""
    candidates = election.get('candidates', [])
    tally: Dict[str, int] = {str(c.get('id')): 0 for c in candidates}

    for b in ballots:
        cid = str(b.get('candidate_id'))
        if cid in tally:
            tally[cid] += 1

    total_votes = len(ballots)
    sorted_tallies = sorted(tally.items(), key=lambda x: x[1], reverse=True)
    
    winner_id = sorted_tallies[0][0] if sorted_tallies and sorted_tallies[0][1] > 0 else None
    winner_info = next((c for c in candidates if str(c.get('id')) == str(winner_id)), None)

    return {
        "election_id": election.get('election_id'),
        "total_votes": total_votes,
        "candidate_tallies": tally,
        "winner_id": winner_id,
        "winner_name": winner_info.get('full_name') if winner_info else None,
        "winner_role": election.get('role_title'),
        "status": "CONCLUDED"
    }


def evaluate_review_case_safety(
    case_type: str,
    evidence: Dict[str, Any],
    ai_suggested_action: Optional[str] = None
) -> Dict[str, Any]:
    """
    Ensures peer review governance boundaries:
    AI may assist with recommendations, but must NEVER independently suspend, ban or remove accounts.
    Only human review committee members / administrators can enact permanent account changes.
    """
    is_suspension_or_ban = ai_suggested_action in ['SUSPEND_ACCOUNT', 'TERMINATE_MEMBERSHIP', 'BAN_USER']
    
    return {
        "ai_recommendation": ai_suggested_action or "HUMAN_COMMITTEE_REVIEW_REQUIRED",
        "is_advisory_only": True,
        "requires_human_committee_quorum": True,
        "ai_can_auto_enact": False,
        "policy_rule": "AI assistance is advisory. Any account suspension or permanent removal mandates a human committee review vote.",
        "case_type": case_type,
        "evidence_summary": evidence.get('summary', 'Evidence submitted for peer review')
    }


def project_public_governance_feed(
    proposals: List[Dict[str, Any]],
    elections: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Projects a public-safe governance summary without exposing sensitive member PII,
    personal voting records, voter hashes, or internal dispute files.
    """
    public_proposals = []
    for p in proposals:
        if not p.get('is_public', True):
            continue
        public_proposals.append({
            "proposal_id": p.get('proposal_id'),
            "title": p.get('title'),
            "description": p.get('description'),
            "category": p.get('category'),
            "status": p.get('status'),
            "start_time": p.get('start_time'),
            "end_time": p.get('end_time'),
            "total_votes": p.get('total_votes', 0),
            "quorum_needed": p.get('quorum_needed', 5),
            "tallies": p.get('tally', {}) if p.get('status') in ['CLOSED', 'PASSED', 'REJECTED'] else None,
            "result_summary": p.get('result_summary', '')
        })

    public_elections = []
    for e in elections:
        public_elections.append({
            "election_id": e.get('election_id'),
            "title": e.get('title'),
            "role_title": e.get('role_title'),
            "term": e.get('term'),
            "status": e.get('status'),
            "start_time": e.get('start_time'),
            "end_time": e.get('end_time'),
            "candidates": [
                {
                    "id": c.get('id'),
                    "full_name": c.get('full_name'),
                    "role_sought": c.get('role_sought'),
                    "vision": c.get('vision'),
                    "endorsements_count": c.get('endorsements_count', 0)
                }
                for c in e.get('candidates', [])
            ],
            "total_votes": e.get('total_votes', 0),
            "winner_name": e.get('winner_name') if e.get('status') == 'CONCLUDED' else None
        })

    return {
        "cooperative_name": "UNNATI Worker Guild Cooperative (उन्नति श्रमिक मंच)",
        "transparency_standard": "ICA One-Member-One-Vote & Secret Ballot Protocol",
        "active_proposals_count": len([p for p in public_proposals if p['status'] == 'ACTIVE']),
        "proposals": public_proposals,
        "elections": public_elections,
        "published_at": datetime.now(timezone.utc).isoformat()
    }
