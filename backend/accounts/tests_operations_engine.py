import unittest
import sys
import os

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from accounts.operations_engine import (
    mask_sensitive_identifier,
    sanitize_worker_operational_record,
    compute_operations_overview,
    filter_booking_operations,
    summarize_payment_lifecycle,
    calculate_cooperative_economics,
    build_operational_audit_entry,
    validate_admin_action_authorization
)

class OperationsEngineTests(unittest.TestCase):
    def test_sensitive_identifier_masking(self):
        self.assertEqual(mask_sensitive_identifier("123456789012", "aadhaar"), "XXXX-XXXX-9012")
        self.assertEqual(mask_sensitive_identifier("ABCDE1234F", "pan"), "XXXXX1234F")
        self.assertEqual(mask_sensitive_identifier("9876543210", "phone"), "+91-XXXXX-3210")
        self.assertEqual(mask_sensitive_identifier(None, "aadhaar"), "Not Disclosed")

    def test_worker_record_sanitization(self):
        worker = {
            "id": 12,
            "full_name": "Ramesh Carpenter",
            "aadhaar_number": "123456789012",
            "pan_number": "ABCDE1234F",
            "phone": "9876543210",
            "nsdc_certified": True
        }
        sanitized = sanitize_worker_operational_record(worker, is_superadmin=False)
        self.assertEqual(sanitized['aadhaar_masked'], "XXXX-XXXX-9012")
        self.assertEqual(sanitized['pan_masked'], "XXXXX1234F")
        self.assertNotIn("aadhaar_number", sanitized)
        self.assertNotIn("pan_number", sanitized)

    def test_admin_authorization_and_confirmation(self):
        # Non-admin rejected
        ok, msg = validate_admin_action_authorization(user_role='customer', action='VIEW_STATS')
        self.assertFalse(ok)

        # Admin authorized for standard action
        ok, msg = validate_admin_action_authorization(user_role='admin', action='VIEW_STATS')
        self.assertTrue(ok)

        # Destructive action requires confirmation
        ok, msg = validate_admin_action_authorization(user_role='admin', action='SUSPEND_WORKER', is_confirmed=False)
        self.assertFalse(ok)
        self.assertIn("Confirmation required", msg)

        # Destructive action with confirmation succeeds
        ok, msg = validate_admin_action_authorization(user_role='admin', action='SUSPEND_WORKER', is_confirmed=True)
        self.assertTrue(ok)

    def test_operations_overview_demo_labeling(self):
        stats = {
            "active_workers": 25,
            "active_customers": 140,
            "ongoing_bookings": 8,
            "completed_jobs": 320,
            "cancelled_jobs": 4,
            "disputed_jobs": 1,
            "demand_index": 85.0
        }
        overview = compute_operations_overview(stats)
        metrics = overview['metrics']

        # Live metric
        self.assertTrue(metrics['active_workers']['is_live'])
        self.assertEqual(metrics['active_workers']['value'], 25)

        # Estimated / Demo metric is clearly labeled
        self.assertTrue(metrics['service_demand_index'].get('is_demo', False))
        self.assertFalse(metrics['service_demand_index']['is_live'])

    def test_booking_operational_triage(self):
        bookings = [
            {"id": 1, "status": "in_progress", "worker_id": 5},
            {"id": 2, "status": "searching", "worker_id": None},
            {"id": 3, "status": "scheduled", "worker_id": 6},
            {"id": 4, "status": "cancelled", "is_disputed": True, "worker_id": 7},
            {"id": 5, "status": "in_progress", "is_collective": True, "worker_id": 8}
        ]

        live = filter_booking_operations(bookings, 'LIVE_ACTIVE')
        self.assertEqual(len(live), 2) # ids 1 and 5

        unassigned = filter_booking_operations(bookings, 'UNASSIGNED')
        self.assertEqual(len(unassigned), 1)
        self.assertEqual(unassigned[0]['id'], 2)

        disputed = filter_booking_operations(bookings, 'DISPUTED')
        self.assertEqual(len(disputed), 1)
        self.assertEqual(disputed[0]['id'], 4)

        collective = filter_booking_operations(bookings, 'COLLECTIVE_SHG')
        self.assertEqual(len(collective), 1)
        self.assertEqual(collective[0]['id'], 5)

    def test_payment_monitoring_and_disclaimer(self):
        payments = [
            {"amount": "500.00", "status": "PAID"},
            {"amount": "300.00", "status": "PAID"},
            {"amount": "200.00", "status": "FAILED"},
            {"amount": "100.00", "status": "PAID", "is_refund": True}
        ]
        summary = summarize_payment_lifecycle(payments)
        self.assertEqual(summary['successful_payments']['count'], 3)
        self.assertEqual(summary['successful_payments']['volume'], 900.00)
        self.assertEqual(summary['refunds']['count'], 1)
        self.assertIn("Direct Customer-to-Worker Settlement", summary['cooperative_fund_protocol'])

    def test_cooperative_economics_pools(self):
        econ = calculate_cooperative_economics(
            completed_turnover=100000.0,
            contribution_rate=0.05,
            dividend_share=0.40,
            welfare_share=0.35,
            reserve_share=0.25
        )
        self.assertEqual(econ['cooperative_surplus_generated'], 5000.0)
        self.assertEqual(econ['allocations']['patronage_dividend_pool'], 2000.0)
        self.assertEqual(econ['allocations']['welfare_and_tools_pool'], 1750.0)
        self.assertEqual(econ['allocations']['operational_reserve_pool'], 1250.0)

    def test_audit_entry_builder(self):
        entry = build_operational_audit_entry(
            actor_id=1,
            actor_name="Admin Chief",
            action="VERIFY_WORKER",
            target_type="WORKER",
            target_id="101",
            result="SUCCESS",
            notes="Aadhaar and NSDC certification verified."
        )
        self.assertEqual(entry['action'], "VERIFY_WORKER")
        self.assertEqual(entry['target_id'], "101")
        self.assertIn("timestamp", entry)

if __name__ == '__main__':
    unittest.main()
