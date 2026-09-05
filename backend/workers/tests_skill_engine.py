import unittest
import sys
import os
from datetime import date, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from workers.skill_engine import (
    validate_skill_entry,
    evaluate_certification_status,
    check_task_eligibility,
    generate_learning_recommendations,
    authorize_certification_review,
    PROFICIENCY_LEVELS,
    CERTIFICATION_STATUSES
)

class SkillEngineTests(unittest.TestCase):
    def test_skill_entry_validation(self):
        # Valid skill entry
        ok, err = validate_skill_entry(
            skill_name="Appliance Diagnostics",
            proficiency="SKILLED",
            years_experience=2
        )
        self.assertTrue(ok)
        self.assertIsNone(err)

        # Blank or too short skill name
        ok, err = validate_skill_entry(
            skill_name=" ",
            proficiency="SKILLED",
            years_experience=2
        )
        self.assertFalse(ok)
        self.assertIn("between 2 and 80 characters", err)

        # Invalid proficiency level
        ok, err = validate_skill_entry(
            skill_name="Wiring",
            proficiency="SUPER_HERO",
            years_experience=2
        )
        self.assertFalse(ok)
        self.assertIn("Invalid proficiency", err)

        # CERTIFIED level requires verified certificate
        ok, err = validate_skill_entry(
            skill_name="High Voltage Wiring",
            proficiency="CERTIFIED",
            years_experience=3,
            has_verified_certificate=False
        )
        self.assertFalse(ok)
        self.assertIn("requires an approved vocational certification", err)

        # CERTIFIED level with certificate is valid
        ok, err = validate_skill_entry(
            skill_name="High Voltage Wiring",
            proficiency="CERTIFIED",
            years_experience=3,
            has_verified_certificate=True
        )
        self.assertTrue(ok)
        self.assertIsNone(err)

        # EXPERT requires >= 3 years experience
        ok, err = validate_skill_entry(
            skill_name="Pipe Welding",
            proficiency="EXPERT",
            years_experience=1
        )
        self.assertFalse(ok)
        self.assertIn("at least 3 years", err)

    def test_certification_expiry_evaluation(self):
        today = date.today()
        past_date = today - timedelta(days=30)
        future_date = today + timedelta(days=365)

        # Valid active verified certificate
        status = evaluate_certification_status("VERIFIED", future_date, reference_date=today)
        self.assertEqual(status, "VERIFIED")

        # Expired certificate automatically transitions to EXPIRED
        status_expired = evaluate_certification_status("VERIFIED", past_date, reference_date=today)
        self.assertEqual(status_expired, "EXPIRED")

        # Rejected certificate remains REJECTED even if not expired
        status_rejected = evaluate_certification_status("REJECTED", future_date, reference_date=today)
        self.assertEqual(status_rejected, "REJECTED")

        # Pending certificate without expiry remains PENDING
        status_pending = evaluate_certification_status("PENDING", None, reference_date=today)
        self.assertEqual(status_pending, "PENDING")

    def test_restricted_task_eligibility(self):
        today = date.today()
        future_date = today + timedelta(days=200)

        # Case 1: Worker has required skill AND active verified cert -> Eligible
        worker_skills = [
            {'name': 'High Voltage Wiring', 'proficiency': 'CERTIFIED'},
            {'name': 'Circuit Breaker Diagnostics', 'proficiency': 'CERTIFIED'}
        ]
        worker_certs = [
            {
                'certification_name': 'Electrician Trade Certificate (NCVT/ITI)',
                'verification_status': 'VERIFIED',
                'expiry_date': future_date
            }
        ]

        eligible, missing = check_task_eligibility(
            service_slug='high_voltage_electrical',
            worker_skills=worker_skills,
            worker_certifications=worker_certs,
            reference_date=today
        )
        self.assertTrue(eligible)
        self.assertEqual(len(missing), 0)

        # Case 2: Certificate is EXPIRED -> Ineligible
        expired_certs = [
            {
                'certification_name': 'Electrician Trade Certificate (NCVT/ITI)',
                'verification_status': 'VERIFIED',
                'expiry_date': today - timedelta(days=10) # Expired
            }
        ]
        eligible, missing = check_task_eligibility(
            service_slug='high_voltage_electrical',
            worker_skills=worker_skills,
            worker_certifications=expired_certs,
            reference_date=today
        )
        self.assertFalse(eligible)
        self.assertTrue(any("active verified certificate" in m for m in missing))

        # Case 3: Missing required specialized skill -> Ineligible
        incomplete_skills = [{'name': 'High Voltage Wiring', 'proficiency': 'SKILLED'}]
        eligible, missing = check_task_eligibility(
            service_slug='high_voltage_electrical',
            worker_skills=incomplete_skills,
            worker_certifications=worker_certs,
            reference_date=today
        )
        self.assertFalse(eligible)
        self.assertTrue(any("Circuit Breaker Diagnostics" in m for m in missing))

    def test_authorization_for_certification_review(self):
        # Worker cannot approve or reject certificates
        ok, err = authorize_certification_review(actor_role='worker', new_status='VERIFIED')
        self.assertFalse(ok)
        self.assertIn("Unauthorized", err)

        # Admin can approve
        ok, err = authorize_certification_review(actor_role='admin', new_status='VERIFIED')
        self.assertTrue(ok)
        self.assertIsNone(err)

        # Cooperative reviewer can reject
        ok, err = authorize_certification_review(actor_role='cooperative_reviewer', new_status='REJECTED')
        self.assertTrue(ok)
        self.assertIsNone(err)

        # Invalid resolution status
        ok, err = authorize_certification_review(actor_role='admin', new_status='RANDOM_STATUS')
        self.assertFalse(ok)
        self.assertIn("Invalid resolution status", err)

    def test_learning_recommendations(self):
        # Electrician with gaps receives Solar PV and Inverter recommendations
        recs = generate_learning_recommendations(
            worker_category='Electrician',
            existing_skills=['General Wiring'],
            existing_certs=[]
        )
        self.assertGreaterEqual(len(recs), 2)
        titles = [r['course_title'] for r in recs]
        self.assertTrue(any("Solar PV" in t for t in titles))
        self.assertTrue(all(r.get('demand_trend') for r in recs))

if __name__ == '__main__':
    unittest.main()
