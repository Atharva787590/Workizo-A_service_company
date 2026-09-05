import unittest
import sys
import os

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from workers.trust_engine import (
    mask_aadhaar_number,
    mask_pan_number,
    validate_rating_eligibility,
    detect_suspicious_rating,
    validate_peer_endorsement,
    build_governance_audit_record
)

class TrustEngineTests(unittest.TestCase):
    def test_aadhaar_masking(self):
        self.assertEqual(mask_aadhaar_number("123456789012"), "XXXX-XXXX-9012")
        self.assertEqual(mask_aadhaar_number("1234 5678 9012"), "XXXX-XXXX-9012")
        self.assertIsNone(mask_aadhaar_number(None))
        self.assertEqual(mask_aadhaar_number("123"), "XXXX-XXXX-XXXX")

    def test_pan_masking(self):
        self.assertEqual(mask_pan_number("ABCDE1234F"), "XXXXX1234F")
        self.assertIsNone(mask_pan_number(None))

    def test_rating_eligibility(self):
        # Eligible customer rating
        ok, msg, rating_type = validate_rating_eligibility(
            booking_status='completed',
            user_id=1,
            customer_id=1,
            worker_id=2,
            existing_rater_ids=[]
        )
        self.assertTrue(ok)
        self.assertEqual(rating_type, "CUSTOMER_TO_WORKER")

        # Ineligible status
        ok, err, _ = validate_rating_eligibility(
            booking_status='in_progress',
            user_id=1,
            customer_id=1,
            worker_id=2,
            existing_rater_ids=[]
        )
        self.assertFalse(ok)
        self.assertIn("completion", err)

        # Duplicate rating prevention
        ok, err, _ = validate_rating_eligibility(
            booking_status='completed',
            user_id=1,
            customer_id=1,
            worker_id=2,
            existing_rater_ids=[1]
        )
        self.assertFalse(ok)
        self.assertIn("already submitted", err)

        # Unauthorized rater
        ok, err, _ = validate_rating_eligibility(
            booking_status='completed',
            user_id=99,
            customer_id=1,
            worker_id=2,
            existing_rater_ids=[]
        )
        self.assertFalse(ok)
        self.assertIn("not authorized", err)

    def test_suspicious_rating_detection(self):
        # Severe score contradiction (overall 1-star but categories 5-star)
        flagged, reason, score = detect_suspicious_rating(
            overall_rating=1,
            category_scores={'punctuality': 5, 'quality_of_work': 5},
            review_text="Everything was great"
        )
        self.assertTrue(flagged)
        self.assertIn("anomaly", reason)
        self.assertGreaterEqual(score, 0.5)

        # Retaliatory rating after dispute
        flagged, reason, score = detect_suspicious_rating(
            overall_rating=1,
            category_scores={'punctuality': 1, 'quality_of_work': 1},
            review_text="Terrible",
            has_active_dispute=True,
            time_since_completion_minutes=5.0
        )
        self.assertTrue(flagged)
        self.assertIn("retaliatory", reason)

        # Normal clean rating
        flagged, reason, score = detect_suspicious_rating(
            overall_rating=5,
            category_scores={'punctuality': 5, 'quality_of_work': 5},
            review_text="Excellent work by cooperative artisan."
        )
        self.assertFalse(flagged)
        self.assertIsNone(reason)
        self.assertEqual(score, 0.0)

    def test_peer_endorsement_rules(self):
        # Self endorsement blocked
        ok, err = validate_peer_endorsement(
            endorser_id=5,
            endorsee_id=5,
            endorser_is_verified=True,
            skill_name="Plumbing",
            existing_endorsements=[]
        )
        self.assertFalse(ok)
        self.assertIn("Self-endorsement is prohibited", err)

        # Non-verified member endorsement blocked
        ok, err = validate_peer_endorsement(
            endorser_id=5,
            endorsee_id=6,
            endorser_is_verified=False,
            skill_name="Plumbing",
            existing_endorsements=[]
        )
        self.assertFalse(ok)
        self.assertIn("verified cooperative members", err)

        # Duplicate endorsement blocked
        ok, err = validate_peer_endorsement(
            endorser_id=5,
            endorsee_id=6,
            endorser_is_verified=True,
            skill_name="Plumbing",
            existing_endorsements=[{'endorser_id': 5, 'skill_name': 'Plumbing'}]
        )
        self.assertFalse(ok)
        self.assertIn("already endorsed", err)

        # Valid endorsement
        ok, msg = validate_peer_endorsement(
            endorser_id=5,
            endorsee_id=6,
            endorser_is_verified=True,
            skill_name="Carpentry",
            existing_endorsements=[{'endorser_id': 5, 'skill_name': 'Plumbing'}]
        )
        self.assertTrue(ok)
        self.assertEqual(msg, "Endorsement valid")

    def test_audit_record_builder(self):
        record = build_governance_audit_record(
            action="DISPUTE_REVIEW",
            actor_id=10,
            actor_name="Committee Lead Priya",
            decision="RESOLVED_UPHELD",
            notes="Witness evidence corroborated task delay."
        )
        self.assertEqual(record["actor_id"], 10)
        self.assertEqual(record["decision"], "RESOLVED_UPHELD")
        self.assertTrue(record["timestamp"])

if __name__ == '__main__':
    unittest.main()
