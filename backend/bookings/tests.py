from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
import datetime
from rest_framework.test import APIClient
from rest_framework import status

from services.models import ServiceCategory
from workers.models import WorkerProfile
from bookings.models import Booking, BookingRejection, BookingWorkerAllocation
from billing.models import Payment

User = get_user_model()

class BookingLifecycleAndOperationsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Service Category
        self.category = ServiceCategory.objects.create(
            name="Plumbing Services",
            base_labour_charge=300.00
        )
        
        # Customers
        self.customer = User.objects.create_user(
            email="cust1@workizo.com",
            full_name="Aarav Sharma",
            phone="9876543210",
            password="securepassword123",
            role="customer"
        )
        self.other_customer = User.objects.create_user(
            email="cust2@workizo.com",
            full_name="Rohan Verma",
            phone="9876543211",
            password="securepassword123",
            role="customer"
        )
        
        # Workers
        self.worker1 = User.objects.create_user(
            email="worker1@workizo.com",
            full_name="Suresh Kumar",
            phone="9123456780",
            password="securepassword123",
            role="worker"
        )
        self.profile1 = WorkerProfile.objects.create(
            user=self.worker1,
            service_category=self.category,
            approval_status="approved",
            online_status=True
        )
        
        self.worker2 = User.objects.create_user(
            email="worker2@workizo.com",
            full_name="Ramesh Yadav",
            phone="9123456781",
            password="securepassword123",
            role="worker"
        )
        self.profile2 = WorkerProfile.objects.create(
            user=self.worker2,
            service_category=self.category,
            approval_status="approved",
            online_status=True
        )

    # 1. SCHEDULED BOOKINGS VALIDATION
    def test_scheduled_booking_creation_valid(self):
        self.client.force_authenticate(user=self.customer)
        future_time = timezone.now() + datetime.timedelta(days=2)
        payload = {
            "service_category": self.category.id,
            "problem_type": "Pipe Leak",
            "problem_description": "Kitchen pipe leaking",
            "address": "101 MG Road",
            "city": "Ahmedabad",
            "state": "Gujarat",
            "pincode": "380015",
            "booking_type": "scheduled",
            "scheduled_time": future_time.isoformat()
        }
        res = self.client.post('/api/bookings/bookings/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn(res.data['status'], ['SCHEDULED', 'scheduled'])
        self.assertIsNotNone(res.data.get('arrival_pin'))

    def test_scheduled_booking_past_date_rejected(self):
        self.client.force_authenticate(user=self.customer)
        past_time = timezone.now() - datetime.timedelta(days=1)
        payload = {
            "service_category": self.category.id,
            "problem_type": "Pipe Leak",
            "problem_description": "Kitchen pipe leaking",
            "address": "101 MG Road",
            "city": "Ahmedabad",
            "state": "Gujarat",
            "pincode": "380015",
            "booking_type": "scheduled",
            "scheduled_time": past_time.isoformat()
        }
        res = self.client.post('/api/bookings/bookings/', payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("past", str(res.data.get('detail', '')).lower())

    def test_scheduled_booking_30_day_limit_rejected(self):
        self.client.force_authenticate(user=self.customer)
        too_far = timezone.now() + datetime.timedelta(days=32)
        payload = {
            "service_category": self.category.id,
            "problem_type": "Pipe Leak",
            "problem_description": "Kitchen pipe leaking",
            "address": "101 MG Road",
            "city": "Ahmedabad",
            "state": "Gujarat",
            "pincode": "380015",
            "booking_type": "scheduled",
            "scheduled_time": too_far.isoformat()
        }
        res = self.client.post('/api/bookings/bookings/', payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("30 days", str(res.data.get('detail', '')))

    # 2. WORKER ACCEPT & REJECT FLOW WITH REASON
    def test_worker_accept_and_reject_with_reason(self):
        booking = Booking.objects.create(
            customer=self.customer,
            service_category=self.category,
            problem_type="Tap Repair",
            problem_description="Bathroom tap broken",
            address="12 Satellite",
            city="Ahmedabad",
            state="Gujarat",
            pincode="380015",
            status="searching"
        )
        
        # Worker 2 rejects with reason
        self.client.force_authenticate(user=self.worker2)
        reject_res = self.client.post(f'/api/bookings/bookings/{booking.id}/reject/', {
            "reason": "Outside my service area today"
        })
        self.assertEqual(reject_res.status_code, status.HTTP_200_OK)
        rejection = BookingRejection.objects.filter(worker=self.worker2, booking=booking).first()
        self.assertIsNotNone(rejection)
        self.assertEqual(rejection.reason, "Outside my service area today")
        
        # Worker 1 accepts
        self.client.force_authenticate(user=self.worker1)
        accept_res = self.client.post(f'/api/bookings/bookings/{booking.id}/accept/')
        self.assertEqual(accept_res.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.worker, self.worker1)
        self.assertEqual(booking.status, 'accepted')

    # 3. RESCHEDULING & CANCELLATION VALIDATION
    def test_customer_reschedule_success(self):
        booking = Booking.objects.create(
            customer=self.customer,
            service_category=self.category,
            problem_type="Drainage block",
            problem_description="Water overflowing",
            address="Vastrapur",
            city="Ahmedabad",
            state="Gujarat",
            pincode="380015",
            status="searching"
        )
        self.client.force_authenticate(user=self.customer)
        new_time = timezone.now() + datetime.timedelta(days=5)
        res = self.client.post(f'/api/bookings/bookings/{booking.id}/reschedule/', {
            "scheduled_time": new_time.isoformat()
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.booking_type, 'scheduled')
        self.assertIn(booking.status, ['scheduled', 'SCHEDULED'])

    def test_customer_reschedule_forbidden_after_service_started(self):
        booking = Booking.objects.create(
            customer=self.customer,
            worker=self.worker1,
            service_category=self.category,
            problem_type="Drainage block",
            problem_description="Water overflowing",
            address="Vastrapur",
            city="Ahmedabad",
            state="Gujarat",
            pincode="380015",
            status="repair_started"
        )
        self.client.force_authenticate(user=self.customer)
        new_time = timezone.now() + datetime.timedelta(days=2)
        res = self.client.post(f'/api/bookings/bookings/{booking.id}/reschedule/', {
            "scheduled_time": new_time.isoformat()
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("service has started", str(res.data.get('detail', '')))

    # 4. START-OF-SERVICE VERIFICATION & PIN SECURITY
    def test_start_of_service_pin_verification(self):
        booking = Booking.objects.create(
            customer=self.customer,
            worker=self.worker1,
            service_category=self.category,
            problem_type="Heater Repair",
            problem_description="Not heating",
            address="Vastrapur",
            city="Ahmedabad",
            state="Gujarat",
            pincode="380015",
            status="arrived"
        )
        pin = booking.arrival_pin

        # Security check: Worker should NOT receive arrival_pin in GET response!
        self.client.force_authenticate(user=self.worker1)
        worker_view_res = self.client.get(f'/api/bookings/bookings/{booking.id}/')
        self.assertEqual(worker_view_res.status_code, status.HTTP_200_OK)
        self.assertIsNone(worker_view_res.data.get('arrival_pin'))

        # Customer CAN see arrival_pin
        self.client.force_authenticate(user=self.customer)
        cust_view_res = self.client.get(f'/api/bookings/bookings/{booking.id}/')
        self.assertEqual(cust_view_res.status_code, status.HTTP_200_OK)
        self.assertEqual(cust_view_res.data.get('arrival_pin'), pin)

        # Worker cannot enter in_progress without verification
        self.client.force_authenticate(user=self.worker1)
        premature_start = self.client.post(f'/api/bookings/bookings/{booking.id}/update-status/', {
            "status": "in_progress"
        })
        self.assertEqual(premature_start.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("verification", str(premature_start.data.get('detail', '')).lower())

        # Worker tries wrong PIN
        wrong_pin_res = self.client.post(f'/api/bookings/bookings/{booking.id}/verify-pin/', {
            "pin": "0000" if pin != "0000" else "9999"
        })
        self.assertEqual(wrong_pin_res.status_code, status.HTTP_400_BAD_REQUEST)

        # Worker enters correct PIN
        correct_pin_res = self.client.post(f'/api/bookings/bookings/{booking.id}/verify-pin/', {
            "pin": pin
        })
        self.assertEqual(correct_pin_res.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertTrue(booking.arrival_pin_verified)
        self.assertEqual(booking.status, 'verified')

        # Now worker can start work
        start_res = self.client.post(f'/api/bookings/bookings/{booking.id}/update-status/', {
            "status": "in_progress"
        })
        self.assertEqual(start_res.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'in_progress')

    # 5. PAYMENT INTEGRITY
    def test_payment_integrity_blocks_completion_if_unpaid(self):
        booking = Booking.objects.create(
            customer=self.customer,
            worker=self.worker1,
            service_category=self.category,
            problem_type="Wiring",
            problem_description="Short circuit",
            address="Vastrapur",
            city="Ahmedabad",
            state="Gujarat",
            pincode="380015",
            status="in_progress",
            arrival_pin_verified=True
        )
        
        # Payment is pending/missing
        payment = Payment.objects.create(
            booking=booking,
            customer=self.customer,
            captain=self.worker1,
            amount=500.00,
            method="ONLINE",
            status="PENDING"
        )
        
        self.client.force_authenticate(user=self.worker1)
        complete_res = self.client.post(f'/api/bookings/bookings/{booking.id}/update-status/', {
            "status": "completed"
        })
        self.assertEqual(complete_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("payment has been verified", str(complete_res.data.get('detail', '')))

    # 6. RBAC & PERMISSION BOUNDARIES
    def test_rbac_cross_customer_access_blocked(self):
        booking = Booking.objects.create(
            customer=self.customer,
            service_category=self.category,
            problem_type="Tap Repair",
            problem_description="Broken tap",
            address="Vastrapur",
            city="Ahmedabad",
            state="Gujarat",
            pincode="380015",
            status="searching"
        )
        
        # Other customer attempts to reschedule
        self.client.force_authenticate(user=self.other_customer)
        new_time = timezone.now() + datetime.timedelta(days=2)
        reschedule_res = self.client.post(f'/api/bookings/bookings/{booking.id}/reschedule/', {
            "scheduled_time": new_time.isoformat()
        })
        self.assertIn(reschedule_res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

        # Other customer attempts to cancel
        cancel_res = self.client.post(f'/api/bookings/bookings/{booking.id}/cancel-booking/')
        self.assertIn(cancel_res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    # 7. MULTI-WORKER / COLLECTIVE BOOKING ALLOCATION
    def test_collective_booking_allocation(self):
        booking = Booking.objects.create(
            customer=self.customer,
            service_category=self.category,
            problem_type="Full Pipeline overhaul",
            problem_description="Requires 2 plumbers",
            address="Vastrapur",
            city="Ahmedabad",
            state="Gujarat",
            pincode="380015",
            booking_type="collective",
            required_worker_count=2,
            status="searching"
        )

        # Worker 1 accepts -> status MATCHING
        self.client.force_authenticate(user=self.worker1)
        res1 = self.client.post(f'/api/bookings/bookings/{booking.id}/accept/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'MATCHING')
        self.assertEqual(booking.worker, self.worker1)
        self.assertTrue(BookingWorkerAllocation.objects.filter(booking=booking, worker=self.worker1).exists())

        # Worker 2 accepts -> status accepted (all required workers joined)
        self.client.force_authenticate(user=self.worker2)
        res2 = self.client.post(f'/api/bookings/bookings/{booking.id}/accept/')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'accepted')
        self.assertEqual(booking.assigned_workers.count(), 2)
        self.assertTrue(BookingWorkerAllocation.objects.filter(booking=booking, worker=self.worker2).exists())
