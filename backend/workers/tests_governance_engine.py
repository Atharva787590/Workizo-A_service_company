import unittest
import sys
import os
from datetime import datetime, timedelta, timezone

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from workers.governance_engine import (
    compute_voter_hash,
    generate_ballot_receipt,
    validate_voting_eligibility,
    record_proposal_vote,
    calculate_proposal_results,
    validate_election_voting_eligibility,
    record_election_ballot,
    calculate_election_results,
    evaluate_review_case_safety,
    project_public_governance_feed
)

class GovernanceEngineTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 9, 6, 12, 0, 0, tzinfo=timezone.utc)
        self.active_proposal = {
            "proposal_id": "PROP-2026-001",
            "title": "Establish Monsoon Tool Insurance Pool",
            "description": "Allocating 2% of platform cooperative surplus to repair tool grants.",
            "category": "WELFARE",
            "status": "ACTIVE",
            "options": ["YES", "NO", "ABSTAIN"],
            "start_time": (self.now - timedelta(days=2)).isoformat(),
            "end_time": (self.now + timedelta(days=3)).isoformat(),
            "quorum_needed": 3,
            "is_public": True
        }

        self.election = {
            "election_id": "ELEC-2026-01",
            "title": "2026 Worker Guild Executive Board Trustee Election",
            "role_title": "Welfare & Safety Trustee",
            "term": "2026-2028",
            "status": "ACTIVE",
            "start_time": (self.now - timedelta(days=1)).isoformat(),
            "end_time": (self.now + timedelta(days=2)).isoformat(),
            "candidates": [
                {
                    "id": "cand_01",
                    "full_name": "Ramesh Kumar Sharma",
                    "role_sought": "Welfare Trustee",
                    "vision": "100% emergency medical assistance coverage for all active guild craftsmen.",
                    "endorsements_count": 42
                },
                {
                    "id": "cand_02",
                    "full_name": "Sunita Devi Patel",
                    "role_sought": "Welfare Trustee",
                    "vision": "Transparent fair-wage floor adjustments with quarterly dividend payouts.",
                    "endorsements_count": 58
                }
            ]
        }

    def test_voter_hashing_and_receipt(self):
        hash1 = compute_voter_hash(user_id=101, target_id="PROP-2026-001")
        hash2 = compute_voter_hash(user_id=101, target_id="PROP-2026-001")
        hash3 = compute_voter_hash(user_id=102, target_id="PROP-2026-001")
        
        # Deterministic for same user/target
        self.assertEqual(hash1, hash2)
        # Distinct for different users
        self.assertNotEqual(hash1, hash3)
        # Does not leak user id
        self.assertNotIn("101", hash1)

        receipt = generate_ballot_receipt("PROP-2026-001", hash1, "YES")
        self.assertTrue(receipt.startswith("UNN-VOTE-"))

    def test_voting_eligibility_enforcement(self):
        # 1. Eligible member
        ok, msg = validate_voting_eligibility(
            user_id=101,
            is_verified_member=True,
            proposal=self.active_proposal,
            existing_voter_hashes=[],
            current_time=self.now
        )
        self.assertTrue(ok)

        # 2. Unverified user rejected
        ok, msg = validate_voting_eligibility(
            user_id=102,
            is_verified_member=False,
            proposal=self.active_proposal,
            existing_voter_hashes=[],
            current_time=self.now
        )
        self.assertFalse(ok)
        self.assertIn("verified", msg.lower())

        # 3. Inactive proposal rejected
        inactive_prop = dict(self.active_proposal, status="CLOSED")
        ok, msg = validate_voting_eligibility(
            user_id=101,
            is_verified_member=True,
            proposal=inactive_prop,
            existing_voter_hashes=[],
            current_time=self.now
        )
        self.assertFalse(ok)

    def test_voting_deadline_enforcement(self):
        # Premature voting
        future_proposal = dict(self.active_proposal, start_time=(self.now + timedelta(days=1)).isoformat())
        ok, msg = validate_voting_eligibility(
            user_id=101,
            is_verified_member=True,
            proposal=future_proposal,
            existing_voter_hashes=[],
            current_time=self.now
        )
        self.assertFalse(ok)
        self.assertIn("not opened", msg.lower())

        # Expired voting deadline
        expired_proposal = dict(self.active_proposal, end_time=(self.now - timedelta(hours=1)).isoformat())
        ok, msg = validate_voting_eligibility(
            user_id=101,
            is_verified_member=True,
            proposal=expired_proposal,
            existing_voter_hashes=[],
            current_time=self.now
        )
        self.assertFalse(ok)
        self.assertIn("deadline has passed", msg.lower())

    def test_one_member_one_vote_and_duplicate_prevention(self):
        voter_id = 105
        existing_hash = compute_voter_hash(voter_id, self.active_proposal['proposal_id'])

        # First vote succeeds
        ok, msg, ballot = record_proposal_vote(
            proposal=self.active_proposal,
            user_id=voter_id,
            is_verified_member=True,
            choice="YES",
            existing_voter_hashes=[],
            current_time=self.now
        )
        self.assertTrue(ok)
        self.assertIsNotNone(ballot)
        self.assertEqual(ballot['choice'], "YES")

        # Second vote from same member rejected
        ok, msg, ballot2 = record_proposal_vote(
            proposal=self.active_proposal,
            user_id=voter_id,
            is_verified_member=True,
            choice="NO",
            existing_voter_hashes=[existing_hash],
            current_time=self.now
        )
        self.assertFalse(ok)
        self.assertIn("duplicate vote rejected", msg.lower())
        self.assertIsNone(ballot2)

    def test_proposal_result_and_quorum_calculation(self):
        # Scenario A: Quorum NOT met (only 2 votes, quorum is 3)
        ballots_subquorum = [
            {"choice": "YES"},
            {"choice": "YES"}
        ]
        res_sub = calculate_proposal_results(self.active_proposal, ballots_subquorum, quorum_needed=3)
        self.assertFalse(res_sub['quorum_reached'])
        self.assertEqual(res_sub['final_status'], 'REJECTED')
        self.assertIn("Quorum not met", res_sub['summary'])

        # Scenario B: Quorum MET, YES wins
        ballots_passed = [
            {"choice": "YES"},
            {"choice": "YES"},
            {"choice": "NO"},
            {"choice": "ABSTAIN"}
        ]
        res_passed = calculate_proposal_results(self.active_proposal, ballots_passed, quorum_needed=3)
        self.assertTrue(res_passed['quorum_reached'])
        self.assertEqual(res_passed['final_status'], 'PASSED')
        self.assertEqual(res_passed['winning_option'], 'YES')
        self.assertEqual(res_passed['tallies']['YES'], 2)
        self.assertEqual(res_passed['tallies']['NO'], 1)

    def test_board_election_voting_and_secret_ballot(self):
        # Cast ballot for cand_02
        ok, msg, ballot = record_election_ballot(
            election=self.election,
            user_id=201,
            is_verified_member=True,
            candidate_id="cand_02",
            existing_voter_hashes=[],
            current_time=self.now
        )
        self.assertTrue(ok)
        self.assertEqual(ballot['candidate_id'], "cand_02")
        self.assertTrue(ballot['receipt_token'].startswith("UNN-VOTE-"))

        # Duplicate election ballot rejected
        voter_hash = compute_voter_hash(201, self.election['election_id'], context='election')
        ok2, msg2, _ = record_election_ballot(
            election=self.election,
            user_id=201,
            is_verified_member=True,
            candidate_id="cand_01",
            existing_voter_hashes=[voter_hash],
            current_time=self.now
        )
        self.assertFalse(ok2)
        self.assertIn("duplicate ballot rejected", msg2.lower())

        # Election result tally
        ballots = [
            {"candidate_id": "cand_02"},
            {"candidate_id": "cand_02"},
            {"candidate_id": "cand_01"}
        ]
        results = calculate_election_results(self.election, ballots)
        self.assertEqual(results['winner_id'], "cand_02")
        self.assertEqual(results['winner_name'], "Sunita Devi Patel")
        self.assertEqual(results['candidate_tallies']['cand_02'], 2)
        self.assertEqual(results['candidate_tallies']['cand_01'], 1)

    def test_peer_review_governance_safety_boundaries(self):
        # AI recommendation must never independently ban or suspend accounts
        safety = evaluate_review_case_safety(
            case_type="RATING_DISPUTE",
            evidence={"summary": "Customer claims no-show; GPS logs show craftsman arrived on schedule."},
            ai_suggested_action="SUSPEND_ACCOUNT"
        )
        self.assertTrue(safety['is_advisory_only'])
        self.assertTrue(safety['requires_human_committee_quorum'])
        self.assertFalse(safety['ai_can_auto_enact'])
        self.assertIn("mandates a human committee", safety['policy_rule'])

    def test_public_transparency_privacy_protection(self):
        proposals = [self.active_proposal]
        elections = [self.election]

        feed = project_public_governance_feed(proposals, elections)
        
        self.assertIn("cooperative_name", feed)
        self.assertEqual(feed['active_proposals_count'], 1)
        self.assertEqual(len(feed['proposals']), 1)
        self.assertEqual(len(feed['elections']), 1)

        # Ensure no voter hashes, user IDs or private details leak into public feed
        serialized = str(feed)
        self.assertNotIn("voter_hash", serialized)
        self.assertNotIn("UNNATI_COOP_GOVERNANCE_SECRET_SALT", serialized)

if __name__ == '__main__':
    unittest.main()
