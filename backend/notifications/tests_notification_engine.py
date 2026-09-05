import unittest
import sys
import os
from datetime import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from notifications.notification_engine import (
    route_multi_channel_notification,
    is_within_quiet_hours,
    fuzz_opportunity_location,
    filter_eligible_opportunity,
    render_notification_template,
    scrub_sensitive_privacy_data,
    calculate_haversine_distance
)

class NotificationEngineTests(unittest.TestCase):
    def test_multi_channel_priority_fallback(self):
        # When PUSH is available, delivery succeeds on PUSH
        res1 = route_multi_channel_notification(
            recipient_user_id=1,
            title="Workizo Alert",
            message="Your booking is confirmed.",
            channel_availability={'PUSH': True, 'IN_APP': True, 'SMS': True}
        )
        self.assertEqual(res1['status'], 'DELIVERED')
        self.assertEqual(res1['delivered_channel'], 'PUSH')
        self.assertEqual(len(res1['attempts']), 1)

        # When PUSH fails/unavailable, falls back to IN_APP
        res2 = route_multi_channel_notification(
            recipient_user_id=1,
            title="Workizo Alert",
            message="Your booking is confirmed.",
            channel_availability={'PUSH': False, 'IN_APP': True, 'SMS': True}
        )
        self.assertEqual(res2['status'], 'DELIVERED')
        self.assertEqual(res2['delivered_channel'], 'IN_APP')
        self.assertEqual(len(res2['attempts']), 2)
        self.assertEqual(res2['attempts'][0]['status'], 'FALLBACK_TRIGGERED')
        self.assertEqual(res2['attempts'][1]['status'], 'DELIVERED')

        # When PUSH and IN_APP fail, falls back to SMS
        res3 = route_multi_channel_notification(
            recipient_user_id=1,
            title="Workizo Alert",
            message="Your booking is confirmed.",
            channel_availability={'PUSH': False, 'IN_APP': False, 'SMS': True}
        )
        self.assertEqual(res3['status'], 'DELIVERED')
        self.assertEqual(res3['delivered_channel'], 'SMS')
        self.assertEqual(len(res3['attempts']), 3)

    def test_idempotency_and_duplicate_suppression(self):
        existing_keys = ['booking_101_accepted_user_5']
        res = route_multi_channel_notification(
            recipient_user_id=5,
            title="Test",
            message="Duplicate test",
            idempotency_key='booking_101_accepted_user_5',
            existing_keys=existing_keys
        )
        self.assertEqual(res['status'], 'DUPLICATE_SUPPRESSED')
        self.assertIsNone(res['delivered_channel'])

    def test_quiet_hours_enforcement(self):
        # Overnight quiet hours: 22:00 to 07:00
        # Time 23:30 is within quiet hours
        in_quiet = is_within_quiet_hours(
            quiet_hours_enabled=True,
            start_str="22:00",
            end_str="07:00",
            current_time=time(23, 30),
            is_urgent=False
        )
        self.assertTrue(in_quiet)

        # Urgent notification with override bypasses quiet hours
        in_quiet_urgent = is_within_quiet_hours(
            quiet_hours_enabled=True,
            start_str="22:00",
            end_str="07:00",
            current_time=time(23, 30),
            is_urgent=True,
            urgent_override=True
        )
        self.assertFalse(in_quiet_urgent)

        # Daytime: 14:00 is outside quiet hours
        outside_quiet = is_within_quiet_hours(
            quiet_hours_enabled=True,
            start_str="22:00",
            end_str="07:00",
            current_time=time(14, 0),
            is_urgent=False
        )
        self.assertFalse(outside_quiet)

    def test_geo_targeted_opportunity_filtering(self):
        # Worker at (18.5204, 73.8567) - Pune Center
        # Job 1: 3 km away, matching category, worker online -> Eligible
        ok, dist, reason = filter_eligible_opportunity(
            worker_category_id=1,
            worker_lat=18.5204,
            worker_lon=73.8567,
            job_category_id=1,
            job_lat=18.5304,
            job_lon=73.8667,
            max_radius_km=10.0,
            is_worker_online=True
        )
        self.assertTrue(ok)
        self.assertLess(dist, 5.0)

        # Job 2: 50 km away -> Ineligible (exceeds radius)
        ok2, dist2, reason2 = filter_eligible_opportunity(
            worker_category_id=1,
            worker_lat=18.5204,
            worker_lon=73.8567,
            job_category_id=1,
            job_lat=18.9000,
            job_lon=74.2000,
            max_radius_km=10.0,
            is_worker_online=True
        )
        self.assertFalse(ok2)
        self.assertIn("exceeds opportunity radius", reason2)

        # Job 3: Worker offline -> Ineligible
        ok3, _, reason3 = filter_eligible_opportunity(
            worker_category_id=1,
            worker_lat=18.5204,
            worker_lon=73.8567,
            job_category_id=1,
            job_lat=18.5304,
            job_lon=73.8667,
            max_radius_km=10.0,
            is_worker_online=False
        )
        self.assertFalse(ok3)
        self.assertIn("offline", reason3)

    def test_privacy_location_coarsening(self):
        fuzzed = fuzz_opportunity_location(
            latitude=18.5204321,
            longitude=73.8567432,
            locality="Shivajinagar"
        )
        self.assertTrue(fuzzed['is_coarsened'])
        self.assertEqual(fuzzed['coarse_lat'], 18.52)
        self.assertEqual(fuzzed['coarse_lon'], 73.86)
        self.assertEqual(fuzzed['locality'], "Shivajinagar")

    def test_privacy_scrubber(self):
        text_with_aadhaar = "Worker Aadhaar is 1234 5678 9012 for job verification."
        scrubbed = scrub_sensitive_privacy_data(text_with_aadhaar)
        self.assertNotIn("1234 5678 9012", scrubbed)
        self.assertIn("[AADHAAR PROTECTED]", scrubbed)

        text_with_pan = "Craftsman PAN ABCDE1234F submitted."
        scrubbed_pan = scrub_sensitive_privacy_data(text_with_pan)
        self.assertNotIn("ABCDE1234F", scrubbed_pan)
        self.assertIn("[PAN PROTECTED]", scrubbed_pan)

    def test_multilingual_template_rendering(self):
        # Hindi rendering
        title_hi, body_hi = render_notification_template(
            template_key='worker_arriving',
            language='hi',
            params={'worker_name': 'रामेश्वर'}
        )
        self.assertIn('कारीगर', title_hi)
        self.assertIn('रामेश्वर', body_hi)

        # Marathi rendering
        title_mr, body_mr = render_notification_template(
            template_key='worker_arriving',
            language='mr',
            params={'worker_name': 'ज्ञानेश्वर'}
        )
        self.assertIn('कारागीर', title_mr)
        self.assertIn('ज्ञानेश्वर', body_mr)

        # English rendering
        title_en, body_en = render_notification_template(
            template_key='payment_status',
            language='en',
            params={'amount': '650', 'booking_id': '402'}
        )
        self.assertIn('Direct Payment', title_en)
        self.assertIn('₹650', body_en)
        self.assertIn('#402', body_en)

if __name__ == '__main__':
    unittest.main()
