import unittest
import sys
import os
from datetime import date, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.catalog_engine import (
    search_and_filter_catalog,
    sanitize_public_provider_profile,
    filter_eligible_providers,
    calculate_transparency_metrics,
    evaluate_social_security_status,
    authorize_public_private_access,
    ESTIMATED_PRICING_DISCLAIMER,
    SUPPORTED_SOCIAL_SECURITY_SCHEMES,
    DEFAULT_CATALOG_ITEMS
)


class CatalogEngineTests(unittest.TestCase):
    def test_service_search_and_filtering(self):
        # 1. Search by keyword
        fan_results = search_and_filter_catalog(query="fan")
        self.assertGreaterEqual(len(fan_results), 1)
        self.assertTrue(any("Fan" in item['name'] for item in fan_results))

        # 2. Filter by category
        plumber_results = search_and_filter_catalog(category_name="Plumber")
        self.assertGreaterEqual(len(plumber_results), 3)
        self.assertTrue(all(item['category'] == 'Plumber' for item in plumber_results))

        # 3. Filter by max duration
        quick_services = search_and_filter_catalog(max_duration=30)
        self.assertGreaterEqual(len(quick_services), 2)
        self.assertTrue(all(item['typical_duration_minutes'] <= 30 for item in quick_services))

        # 4. Filter by restricted services
        restricted_items = search_and_filter_catalog(is_restricted=True)
        self.assertGreaterEqual(len(restricted_items), 2)
        self.assertTrue(all(item['is_restricted'] is True for item in restricted_items))

        # 5. Pricing transparency disclaimer attached
        for item in quick_services:
            self.assertEqual(item['pricing_disclaimer'], ESTIMATED_PRICING_DISCLAIMER)
            self.assertTrue(item['is_estimated_pricing'])

    def test_provider_privacy_sanitization(self):
        raw_worker = {
            'id': 42,
            'full_name': 'Rameshchandra Kumar',
            'phone': '+919876543210', # SENSITIVE
            'email': 'ramesh@secret.com', # SENSITIVE
            'aadhaar_number': '123456789012', # SENSITIVE
            'pan_number': 'ABCDE1234F', # SENSITIVE
            'bank_account': '9876543210123', # SENSITIVE
            'address': 'Flat 402, Shivalik High Street, Near Shivranjani', # SENSITIVE
            'city': 'Ahmedabad',
            'state': 'Gujarat',
            'latitude': 23.0225, # SENSITIVE
            'longitude': 72.5714, # SENSITIVE
            'service_category': 'Electrician',
            'experience': 7,
            'rating': 4.9,
            'review_count': 54,
            'is_verified': True,
            'guild_tier': 'master_craftsman',
            'verified_skills': ['High Voltage Wiring', 'Circuit Diagnostics'],
            'verified_certifications_count': 2,
            'online_status': True,
        }

        sanitized = sanitize_public_provider_profile(raw_worker)

        # Sensitive fields must NOT exist in sanitized output
        self.assertNotIn('phone', sanitized)
        self.assertNotIn('email', sanitized)
        self.assertNotIn('aadhaar_number', sanitized)
        self.assertNotIn('pan_number', sanitized)
        self.assertNotIn('bank_account', sanitized)
        self.assertNotIn('latitude', sanitized)
        self.assertNotIn('longitude', sanitized)
        self.assertNotIn('address', sanitized)

        # Public fields are safely formatted
        self.assertEqual(sanitized['id'], 42)
        self.assertEqual(sanitized['display_name'], 'Rameshchandra K.')
        self.assertEqual(sanitized['avatar_initials'], 'RK')
        self.assertEqual(sanitized['approximate_area'], 'Ahmedabad, Gujarat')
        self.assertEqual(sanitized['cooperative_tier'], 'Master Craftsman')
        self.assertEqual(sanitized['rating'], 4.9)
        self.assertTrue(sanitized['is_verified'])

    def test_provider_eligibility_and_restricted_task_safeguards(self):
        restricted_service = {
            'id': 4,
            'category': 'Electrician',
            'name': 'High-Voltage Distribution Panel Overhaul',
            'is_restricted': True,
            'required_skills': ['High Voltage Wiring', 'Circuit Breaker Diagnostics'],
            'required_certification_level': 'CERTIFIED',
        }

        providers = [
            # Eligible: Electrician with cert and required skill
            {
                'id': 101,
                'full_name': 'Anil Sharma',
                'service_category': 'Electrician',
                'verified_certifications_count': 1,
                'verified_skills': ['High Voltage Wiring'],
                'is_verified': True,
            },
            # Ineligible 1: Category mismatch (Plumber)
            {
                'id': 102,
                'full_name': 'Sunil Patel',
                'service_category': 'Plumber',
                'verified_certifications_count': 1,
                'verified_skills': ['High Voltage Wiring'],
                'is_verified': True,
            },
            # Ineligible 2: Missing required certification for restricted service
            {
                'id': 103,
                'full_name': 'Karan Verma',
                'service_category': 'Electrician',
                'verified_certifications_count': 0, # Zero certs
                'verified_skills': ['High Voltage Wiring'],
                'is_verified': True,
            },
            # Ineligible 3: Missing required specialized skill
            {
                'id': 104,
                'full_name': 'Dinesh Joshi',
                'service_category': 'Electrician',
                'verified_certifications_count': 2,
                'verified_skills': ['General Bulb Fitting'], # Missing HV skill
                'is_verified': True,
            }
        ]

        eligible, ineligible = filter_eligible_providers(providers, restricted_service)

        self.assertEqual(len(eligible), 1)
        self.assertEqual(eligible[0]['id'], 101)
        self.assertEqual(len(ineligible), 3)

    def test_transparency_metrics_calculations(self):
        bookings = [
            {'status': 'completed'},
            {'status': 'completed'},
            {'status': 'cancelled'},
        ]
        workers = [
            {'is_verified': True},
            {'is_verified': True},
            {'is_verified': False},
        ]
        payments = [
            {'worker_direct_payout': 1500.00},
            {'worker_direct_payout': 2500.00},
        ]

        metrics = calculate_transparency_metrics(bookings, workers, payments)

        self.assertEqual(metrics['total_completed_jobs'], 2)
        self.assertEqual(metrics['active_cooperative_members'], 2)
        self.assertEqual(metrics['total_direct_worker_earnings_inr'], 4000.00)
        self.assertEqual(metrics['cooperative_welfare_reserve_inr'], 200.00) # 5%
        # Strictly ZERO platform commission and zero escrow
        self.assertEqual(metrics['platform_commission_rate_percent'], 0.0)
        self.assertEqual(metrics['platform_held_escrow_balance_inr'], 0.0)

    def test_social_security_status_evaluation(self):
        today = date.today()
        past_date = today - timedelta(days=60)
        future_date = today + timedelta(days=300)

        # 1. Not enrolled
        status, details = evaluate_social_security_status('PMSBY', enrolled_date=None)
        self.assertEqual(status, 'NOT_ENROLLED')
        self.assertFalse(details['is_verified'])

        # 2. Enrolled but pending verification
        status, details = evaluate_social_security_status(
            'PMSBY',
            enrolled_date=past_date,
            expiry_date=future_date,
            is_verified=False,
            reference_date=today
        )
        self.assertEqual(status, 'PENDING')
        self.assertFalse(details['is_verified'])

        # 3. Active and verified
        status, details = evaluate_social_security_status(
            'PMSBY',
            enrolled_date=past_date,
            expiry_date=future_date,
            is_verified=True,
            reference_date=today
        )
        self.assertEqual(status, 'ACTIVE')
        self.assertTrue(details['is_verified'])
        self.assertEqual(details['coverage_inr'], 200000.0)

        # 4. Expired
        status, details = evaluate_social_security_status(
            'PMSBY',
            enrolled_date=past_date - timedelta(days=400),
            expiry_date=past_date,
            is_verified=True,
            reference_date=today
        )
        self.assertEqual(status, 'EXPIRED')

    def test_public_private_authorization(self):
        # Public catalog and transparency metrics accessible to any actor
        ok, err = authorize_public_private_access(actor_role='anonymous', resource_type='SERVICE_CATALOG')
        self.assertTrue(ok)
        self.assertIsNone(err)

        ok, err = authorize_public_private_access(actor_role='anonymous', resource_type='TRANSPARENCY_METRICS')
        self.assertTrue(ok)

        # Private worker financials denied to anonymous or unowned user
        ok, err = authorize_public_private_access(actor_role='customer', resource_type='WORKER_FINANCIALS', is_owner=False)
        self.assertFalse(ok)
        self.assertIn('Access denied', err)

        # Private worker financials allowed to owner worker
        ok, err = authorize_public_private_access(actor_role='worker', resource_type='WORKER_FINANCIALS', is_owner=True)
        self.assertTrue(ok)

        # Verification audit allowed to admin or guild lead
        ok, err = authorize_public_private_access(actor_role='guild_lead', resource_type='VERIFY_SOCIAL_SECURITY')
        self.assertTrue(ok)

        ok, err = authorize_public_private_access(actor_role='worker', resource_type='VERIFY_SOCIAL_SECURITY')
        self.assertFalse(ok)


if __name__ == '__main__':
    unittest.main()
