"""
Comprehensive Test Suite for Prompt 10: UNNATI Trust, Fair-Wage & Demand Intelligence Foundation
-----------------------------------------------------------------------------------------------
Covers:
  1. Deterministic Fair-Wage Engine & Missing-Input Fallbacks
  2. Fair-Price Transparency Quote API
  3. Two-Way Ratings Hardening, Participation, and Duplicate Prevention
  4. Dispute & Rework Foundation Lifecycle (OPEN -> UNDER_REVIEW)
  5. Deterministic AI Evidence Assessor Signals & Heuristics
  6. Demand Intelligence Aggregation & Honest Insufficient-Data States
  7. Strict Cross-User RBAC & Permission Controls
"""

from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from bookings.models import Booking, BookingDispute, BookingAuditLog
from bookings.fair_wage_engine import calculate_fair_wage
from bookings.evidence_assessor import assess_booking_dispute_evidence
from bookings.demand_engine import aggregate_demand_intelligence
from services.models import ServiceCategory
from workers.models import TwoWayRating, WorkerProfile

User = get_user_model()


class Prompt10IntelligenceTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.customer = User.objects.create_user(
            email="cust10@unnati.coop",
            phone="9876543210",
            role="customer",
            full_name="Ramesh Customer"
        )
        self.other_customer = User.objects.create_user(
            email="other10@unnati.coop",
            phone="9876543211",
            role="customer",
            full_name="Suresh Other"
        )
        self.worker = User.objects.create_user(
            email="worker10@unnati.coop",
            phone="9876543212",
            role="worker",
            full_name="Amit Craftsman"
        )
        self.other_worker = User.objects.create_user(
            email="otherworker10@unnati.coop",
            phone="9876543213",
            role="worker",
            full_name="Vijay OtherWorker"
        )

        # Service Category
        self.category = ServiceCategory.objects.create(
            name="Electrical Maintenance",
            base_labour_charge=Decimal('300.00'),
            description="Cooperative electrical services"
        )

        # Worker Profile
        self.worker_profile = WorkerProfile.objects.create(
            user=self.worker,
            service_category=self.category,
            approval_status='approved',
            online_status=True
        )

    # ─────────────────────────────────────────────────────────────
    # 1. FAIR-WAGE ENGINE & TRANSPARENCY
    # ─────────────────────────────────────────────────────────────
    def test_fair_wage_calculation_standard(self):
        """Validates base, skill multiplier, duration, and 6.5% reserve breakdown."""
        quote = calculate_fair_wage(
            base_charge=Decimal('300.00'),
            duration_minutes=60,
            skill_tier='SKILLED',
            travel_distance_km=0.0,
            hazard_level='STANDARD',
            required_worker_count=1,
            category_name="Electrical"
        )

        self.assertEqual(quote['base_amount'], '300.00')
        self.assertEqual(quote['duration_adjustment'], '0.00')
        # Skilled multiplier 1.10 -> 30.00
        self.assertEqual(quote['skill_adjustment'], '30.00')
        self.assertEqual(quote['travel_allowance'], '0.00')
        self.assertEqual(quote['hazard_allowance'], '0.00')
        # Total = 300 + 30 = 330.00
        self.assertEqual(quote['customer_total'], '330.00')
        # Reserve = 330 * 0.065 = 21.45
        self.assertEqual(quote['cooperative_reserve'], '21.45')
        # Worker Earning = 330 - 21.45 = 308.55
        self.assertEqual(quote['worker_earning'], '308.55')
        self.assertTrue(len(quote['explanation']) >= 3)

    def test_fair_wage_modifiers_and_collective(self):
        """Tests duration tier, distance beyond base radius, hazard fee, and collective workers."""
        quote = calculate_fair_wage(
            base_charge=Decimal('200.00'),
            duration_minutes=120,   # +2 blocks of 30 mins -> 2 * (200 * 0.25) * 2 workers = 200.00
            skill_tier='CERTIFIED', # 1.20 multiplier -> (400 * 0.20) = 80.00
            travel_distance_km=9.0, # 4 km beyond 5 km radius -> 4 * 15 = 60.00
            hazard_level='HIGH',    # 100.00 per worker * 2 workers = 200.00
            required_worker_count=2
        )

        self.assertEqual(quote['base_amount'], '400.00')
        self.assertEqual(quote['duration_adjustment'], '200.00')
        self.assertEqual(quote['skill_adjustment'], '80.00')
        self.assertEqual(quote['travel_allowance'], '60.00')
        self.assertEqual(quote['hazard_allowance'], '200.00')
        # Total = 400 + 200 + 80 + 60 + 200 = 940.00
        self.assertEqual(quote['customer_total'], '940.00')
        # Reserve = 940 * 0.065 = 61.10
        self.assertEqual(quote['cooperative_reserve'], '61.10')
        self.assertEqual(quote['worker_earning'], '878.90')

    def test_fair_wage_missing_inputs_fallback(self):
        """Missing or None inputs fall back safely to documented neutral defaults without crashing."""
        quote = calculate_fair_wage(
            base_charge=None,
            duration_minutes=None,
            skill_tier=None,
            travel_distance_km=None,
            hazard_level=None,
            required_worker_count=0
        )
        self.assertEqual(quote['base_amount'], '250.00')
        self.assertEqual(quote['duration_minutes'], 60)
        self.assertEqual(quote['skill_tier'], 'SKILLED')
        self.assertEqual(quote['required_worker_count'], 1)
        self.assertIn('0%', quote['disclaimer'])

    def test_fair_wage_quote_api_endpoint(self):
        """Tests the public/authenticated fair-wage-quote API endpoint."""
        self.client.force_authenticate(user=self.customer)
        response = self.client.post('/api/bookings/bookings/fair-wage-quote/', {
            "category_id": self.category.id,
            "duration_minutes": 90,
            "required_worker_count": 1
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('customer_total', response.data)
        self.assertIn('worker_earning', response.data)
        self.assertIn('cooperative_reserve', response.data)

    # ─────────────────────────────────────────────────────────────
    # 2. TWO-WAY RATINGS & DUPLICATE PREVENTION
    # ─────────────────────────────────────────────────────────────
    def test_two_way_rating_only_completed_bookings(self):
        """Ratings cannot be submitted for searching, scheduled, or cancelled bookings."""
        booking = Booking.objects.create(
            customer=self.customer,
            worker=self.worker,
            service_category=self.category,
            problem_type="Fan repair",
            problem_description="Fan issue",
            address="Street 1",
            city="Ahmedabad",
            state="Gujarat",
            pincode="380001",
            status="accepted" # Not completed
        )

        self.client.force_authenticate(user=self.customer)
        response = self.client.post('/api/workers/two-way-rate/', {
            "booking_id": booking.id,
            "rating": 5,
            "review": "Good work"
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Ratings can only be submitted after eligible job completion", response.data['detail'])

    def test_two_way_rating_duplicate_prevention_and_participants(self):
        """Completed booking can be rated once by each participant, but duplicate rating is blocked."""
        booking = Booking.objects.create(
            customer=self.customer,
            worker=self.worker,
            service_category=self.category,
            problem_type="Fan repair",
            problem_description="Fan issue",
            address="Street 1",
            city="Ahmedabad",
            state="Gujarat",
            pincode="380001",
            status="completed"
        )

        # 1. Customer rates worker
        self.client.force_authenticate(user=self.customer)
        res1 = self.client.post('/api/workers/two-way-rate/', {
            "booking_id": booking.id,
            "rating": 5,
            "review": "Excellent craftsperson!"
        })
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res1.data['rating_type'], 'CUSTOMER_TO_WORKER')

        # 2. Duplicate rating by customer rejected
        res2 = self.client.post('/api/workers/two-way-rate/', {
            "booking_id": booking.id,
            "rating": 4,
            "review": "Trying duplicate"
        })
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already submitted a rating", res2.data['detail'])

        # 3. Worker rates customer
        self.client.force_authenticate(user=self.worker)
        res3 = self.client.post('/api/workers/two-way-rate/', {
            "booking_id": booking.id,
            "rating": 5,
            "review": "Polite customer, clear instructions"
        })
        self.assertEqual(res3.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res3.data['rating_type'], 'WORKER_TO_CUSTOMER')

        # 4. Third-party rater blocked
        self.client.force_authenticate(user=self.other_customer)
        res4 = self.client.post('/api/workers/two-way-rate/', {
            "booking_id": booking.id,
            "rating": 1,
            "review": "Malicious outsider"
        })
        self.assertEqual(res4.status_code, status.HTTP_400_BAD_REQUEST)

    # ─────────────────────────────────────────────────────────────
    # 3. DISPUTE LIFECYCLE & EVIDENCE RECORD
    # ─────────────────────────────────────────────────────────────
    def test_dispute_creation_and_worker_response(self):
        """Customer raises dispute, evidence record is assembled, and worker responds."""
        booking = Booking.objects.create(
            customer=self.customer,
            worker=self.worker,
            service_category=self.category,
            problem_type="Switchboard sparks",
            problem_description="Sparks after repair",
            address="Street 2",
            city="Ahmedabad",
            state="Gujarat",
            pincode="380001",
            status="repair_completed"
        )
        BookingAuditLog.objects.create(
            booking=booking,
            from_status='repair_started',
            to_status='repair_completed',
            changed_by=self.worker,
            reason='Repairs done'
        )

        # 1. Customer raises dispute
        self.client.force_authenticate(user=self.customer)
        res = self.client.post(f'/api/bookings/bookings/{booking.id}/raise-dispute/', {
            "reason": "The electrical switch started sparking again after 2 hours."
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'disputed')
        self.assertIn('dispute', res.data)
        self.assertEqual(res.data['dispute']['status'], 'OPEN')

        # Check DB record
        dispute = BookingDispute.objects.get(booking=booking)
        self.assertEqual(dispute.status, 'OPEN')
        self.assertIn('audit_trail', dispute.evidence_record)
        self.assertIn('signals', dispute.assessment_report)

        # 2. Worker responds to dispute
        self.client.force_authenticate(user=self.worker)
        resp_res = self.client.post(f'/api/bookings/bookings/{booking.id}/respond-dispute/', {
            "response": "I replaced the fuse box; the customer may have overloaded the outlet."
        })
        self.assertEqual(resp_res.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_res.data['dispute']['status'], 'UNDER_REVIEW')

        # Verify updated in DB
        dispute.refresh_from_db()
        self.assertEqual(dispute.status, 'UNDER_REVIEW')
        self.assertIsNotNone(dispute.worker_responded_at)

    def test_dispute_rbac_controls(self):
        """Unrelated customer cannot raise dispute or view dispute details."""
        booking = Booking.objects.create(
            customer=self.customer,
            worker=self.worker,
            service_category=self.category,
            problem_type="Wiring",
            problem_description="Wiring work",
            address="Street 3",
            city="Ahmedabad",
            state="Gujarat",
            pincode="380001",
            status="completed"
        )

        # Other customer raises dispute -> 404 (filtered out by get_queryset customer=request.user) or 403
        self.client.force_authenticate(user=self.other_customer)
        res = self.client.post(f'/api/bookings/bookings/{booking.id}/raise-dispute/', {
            "reason": "Unauthorized dispute attempt"
        })
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

        # Other worker tries to respond to dispute
        self.client.force_authenticate(user=self.other_worker)
        res_resp = self.client.post(f'/api/bookings/bookings/{booking.id}/respond-dispute/', {
            "response": "Outsider statement"
        })
        self.assertIn(res_resp.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    # ─────────────────────────────────────────────────────────────
    # 4. DETERMINISTIC AI EVIDENCE ASSESSOR
    # ─────────────────────────────────────────────────────────────
    def test_evidence_assessor_detects_signals(self):
        """Assessor detects unverified arrival, rapid duration, and missing photos without declaring guilt."""
        assessment = assess_booking_dispute_evidence(
            booking_data={
                "id": 99,
                "status": "completed",
                "arrival_pin_verified": False,
                "geofence_verified": False,
                "before_photo": None,
                "after_photo": None,
                "created_at": "2026-09-01T10:00:00Z"
            },
            dispute_data={"reason": "Technician never arrived but marked finished"},
            payment_data={"status": "FAILED", "amount": "250.00"},
            audit_trail=[
                {"from_status": "in_progress", "to_status": "completed", "timestamp": "2026-09-01T10:02:00Z"}
            ]
        )

        self.assertTrue(assessment['is_advisory_only'])
        signal_codes = [s['code'] for s in assessment['signals']]
        self.assertIn('MISSING_ARRIVAL_VERIFICATION', signal_codes)
        self.assertIn('PAYMENT_SETTLEMENT_MISMATCH', signal_codes)
        self.assertIn('DOCUMENTATION_INCOMPLETE', signal_codes)
        self.assertGreater(assessment['confidence_strength'], 0.5)
        self.assertIn("Human committee arbitration is strongly recommended", assessment['explanation'])

    # ─────────────────────────────────────────────────────────────
    # 5. DEMAND INTELLIGENCE & HONEST DATA BEHAVIOR
    # ─────────────────────────────────────────────────────────────
    def test_demand_intelligence_insufficient_data(self):
        """Returns honest INSUFFICIENT_DATA status when sample count is under minimum threshold."""
        data = aggregate_demand_intelligence(city="NonExistentCity", days=30)
        self.assertEqual(data['status'], 'INSUFFICIENT_DATA')
        self.assertEqual(data['sample_count'], 0)
        self.assertEqual(data['categories'], [])
        self.assertIn("Insufficient real booking activity", data['message'])

    def test_demand_intelligence_real_data(self):
        """Returns aggregated categories and completion rates when real bookings meet threshold."""
        for i in range(4):
            Booking.objects.create(
                customer=self.customer,
                worker=self.worker,
                service_category=self.category,
                problem_type=f"Issue {i}",
                problem_description="Short desc",
                address="Address",
                city="Surat",
                state="Gujarat",
                pincode="395001",
                status="completed" if i % 2 == 0 else "searching"
            )

        data = aggregate_demand_intelligence(city="Surat", days=30)
        self.assertEqual(data['status'], 'SUFFICIENT_DATA')
        self.assertGreaterEqual(data['sample_count'], 4)
        self.assertTrue(len(data['categories']) > 0)
        cat_info = data['categories'][0]
        self.assertEqual(cat_info['category_name'], self.category.name)
        self.assertEqual(cat_info['total_requests'], 4)
        self.assertEqual(cat_info['completed_count'], 2)
        self.assertEqual(cat_info['completion_rate_percent'], 50.0)

    def test_demand_intelligence_api_endpoint(self):
        """Tests the demand-intelligence API endpoint returns valid structure."""
        self.client.force_authenticate(user=self.worker)
        response = self.client.get('/api/bookings/bookings/demand-intelligence/?days=30')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.data)
        self.assertIn(response.data['status'], ['INSUFFICIENT_DATA', 'SUFFICIENT_DATA'])
