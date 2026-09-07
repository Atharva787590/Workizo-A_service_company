"""
Comprehensive Security Regression Test Suite for Prompt 11:
UNNATI Production Security & Deployment Readiness
-------------------------------------------------
Covers:
  1. MockPaymentAdapter and PaymentAdapterFactory rejection in production (DEBUG=False).
  2. Direct initiation & verification endpoints rejecting mock payments when DEBUG=False.
  3. BookingViewSet REST method restrictions: PUT, PATCH, DELETE strictly return HTTP 405.
  4. BookingSerializer field immutability: status, total_contract_value, cooperative_allocation are read-only.
  5. Supabase JWT authentication rejects self-assigned 'admin' in user_metadata.
  6. Production settings validation: validate_production_settings() raises ImproperlyConfigured for default SECRET_KEY or wildcard ALLOWED_HOSTS.
  7. ServiceProviderDiscoveryView returns empty list and count=0 when no workers exist (no fake profiles).
"""

from decimal import Decimal
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ImproperlyConfigured
from rest_framework.test import APIClient
from rest_framework import status

from accounts.authentication import SupabaseAuthentication
from billing.models import Payment
from billing.payment_adapters import PaymentAdapterFactory, MockPaymentAdapter
from bookings.models import Booking
from config.settings import validate_production_settings, INSECURE_DEV_SECRET_KEY
from services.models import ServiceCategory
from workers.models import WorkerProfile

User = get_user_model()


class Prompt11SecurityRegressionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.customer = User.objects.create_user(
            email="cust11@unnati.coop",
            phone="9876543220",
            role="customer",
            full_name="Anil Customer"
        )
        self.worker_user = User.objects.create_user(
            email="worker11@unnati.coop",
            phone="9876543221",
            role="worker",
            full_name="Sunil Craftsman"
        )

        # Service Category
        self.category = ServiceCategory.objects.create(
            name="Sanitary Plumbing",
            base_labour_charge=Decimal('350.00'),
            description="Cooperative plumbing maintenance"
        )

        # Worker Profile
        self.worker_profile = WorkerProfile.objects.create(
            user=self.worker_user,
            service_category=self.category,
            approval_status='approved',
            online_status=True
        )

        # Booking
        self.booking = Booking.objects.create(
            customer=self.customer,
            worker=self.worker_user,
            service_category=self.category,
            problem_type="Pipe Leak",
            problem_description="Kitchen pipe leak under sink",
            address="Block B, Cooperative Colony",
            city="Ahmedabad",
            state="Gujarat",
            pincode="380015",
            status="repair_started",
            total_contract_value=Decimal('450.00'),
            cooperative_allocation=Decimal('29.25')
        )

    # ─────────────────────────────────────────────────────────────
    # 1. PAYMENT MOCK BYPASS SECURITY
    # ─────────────────────────────────────────────────────────────
    def test_mock_payment_adapter_verify_rejected_in_production(self):
        """MockPaymentAdapter.verify_payment must return verified=False when not debug/test."""
        adapter = MockPaymentAdapter()
        payment = Payment.objects.create(
            booking=self.booking,
            customer=self.customer,
            captain=self.worker_user,
            amount=Decimal('450.00'),
            currency='INR',
            adapter_type='MOCK_PROVIDER',
            is_mock_provider=True,
            status='PENDING'
        )

        # Test with helper mocked to production mode
        from billing import payment_adapters
        original_helper = payment_adapters._is_development_or_test
        try:
            payment_adapters._is_development_or_test = lambda: False
            res = adapter.verify_payment(payment, {'transaction_id': 'fake_tx_123'})
            self.assertFalse(res['verified'])
            self.assertIn("prohibited in production", res['detail'])

            with self.assertRaises(ValueError):
                adapter.initiate_payment(self.booking, Decimal('450.00'), self.worker_user, 'idemp_key')

            with self.assertRaises(ValueError):
                PaymentAdapterFactory.get_adapter('MOCK')
        finally:
            payment_adapters._is_development_or_test = original_helper

    def test_verify_direct_payment_view_rejects_mock_in_production(self):
        """VerifyDirectPaymentView must reject mock adapter verification when DEBUG=False."""
        self.client.force_authenticate(user=self.worker_user)
        payment = Payment.objects.create(
            booking=self.booking,
            customer=self.customer,
            captain=self.worker_user,
            direct_recipient=self.worker_user,
            amount=Decimal('450.00'),
            currency='INR',
            adapter_type='MOCK_PROVIDER',
            is_mock_provider=True,
            status='PENDING',
            lifecycle_status='PAYMENT_INITIATED'
        )

        with override_settings(DEBUG=False):
            # Temporarily simulate non-test production environment
            import sys
            sys_argv_backup = sys.argv[:]
            sys.argv = ['gunicorn', 'config.wsgi']
            try:
                response = self.client.post(
                    f"/api/billing/{self.booking.id}/verify-direct-payment/",
                    {"confirmed_by_worker": True}
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn("Mock payment adapter is disabled in production", response.data['detail'])
            finally:
                sys.argv = sys_argv_backup

    # ─────────────────────────────────────────────────────────────
    # 2. BOOKING REST METHOD RESTRICTIONS (PATCH / PUT / DELETE)
    # ─────────────────────────────────────────────────────────────
    def test_booking_direct_patch_put_delete_return_405(self):
        """Generic REST update/delete on BookingViewSet must be strictly blocked with HTTP 405."""
        self.client.force_authenticate(user=self.customer)

        # Attempt PATCH
        patch_res = self.client.patch(
            f"/api/bookings/bookings/{self.booking.id}/",
            {"status": "completed", "total_contract_value": "1.00"},
            format="json"
        )
        self.assertEqual(patch_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, "repair_started")
        self.assertEqual(self.booking.total_contract_value, Decimal('450.00'))

        # Attempt PUT
        put_res = self.client.put(
            f"/api/bookings/bookings/{self.booking.id}/",
            {"status": "completed", "problem_type": "Tampered"},
            format="json"
        )
        self.assertEqual(put_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # Attempt DELETE
        del_res = self.client.delete(f"/api/bookings/bookings/{self.booking.id}/")
        self.assertEqual(del_res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(Booking.objects.filter(id=self.booking.id).exists())

    def test_booking_serializer_status_and_financials_are_read_only(self):
        """BookingSerializer must treat status, total_contract_value, and cooperative_allocation as read-only."""
        from bookings.serializers import BookingSerializer
        serializer = BookingSerializer(data={
            "service_category": self.category.id,
            "problem_type": "Wiring",
            "problem_description": "Short circuit in kitchen",
            "address": "Sample address",
            "city": "Ahmedabad",
            "state": "Gujarat",
            "pincode": "380015",
            "status": "completed",
            "total_contract_value": "1.00",
            "cooperative_allocation": "0.01"
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        # Validated data must NOT contain status or financial values from request payload
        self.assertNotIn('status', serializer.validated_data)
        self.assertNotIn('total_contract_value', serializer.validated_data)
        self.assertNotIn('cooperative_allocation', serializer.validated_data)

    # ─────────────────────────────────────────────────────────────
    # 3. PREVENT SELF-ASSIGNMENT OF ADMIN ROLE
    # ─────────────────────────────────────────────────────────────
    def test_supabase_auth_rejects_admin_role_in_client_metadata(self):
        """Supabase authentication must never grant 'admin' from user_metadata."""
        auth = SupabaseAuthentication()
        payload = {
            "sub": "supabase_attacker_uid_999",
            "email": "attacker@evil.com",
            "user_metadata": {
                "role": "admin",
                "full_name": "Malicious Admin"
            }
        }

        user = auth.get_or_create_user_from_payload(payload)
        self.assertNotEqual(user.role, 'admin')
        self.assertEqual(user.role, 'customer')
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

        # Test that an existing customer cannot promote themselves to admin
        payload_promote = {
            "sub": "supabase_attacker_uid_999",
            "email": "attacker@evil.com",
            "user_metadata": {
                "role": "admin"
            }
        }
        user_again = auth.get_or_create_user_from_payload(payload_promote)
        self.assertNotEqual(user_again.role, 'admin')
        self.assertEqual(user_again.role, 'customer')

    # ─────────────────────────────────────────────────────────────
    # 4. PRODUCTION DJANGO SETTINGS HARDENING
    # ─────────────────────────────────────────────────────────────
    def test_validate_production_settings_raises_on_insecure_defaults(self):
        """validate_production_settings must raise ImproperlyConfigured in production mode."""
        # 1. Insecure default SECRET_KEY
        with self.assertRaises(ImproperlyConfigured) as ctx:
            validate_production_settings(
                debug_mode=False,
                secret=INSECURE_DEV_SECRET_KEY,
                hosts=['api.unnati.coop']
            )
        self.assertIn("SECRET_KEY must be set to a secure, unique value", str(ctx.exception))

        # 2. Wildcard ALLOWED_HOSTS
        with self.assertRaises(ImproperlyConfigured) as ctx:
            validate_production_settings(
                debug_mode=False,
                secret="a-very-strong-production-random-secret-key-that-is-valid-50-chars",
                hosts=['*']
            )
        self.assertIn("ALLOWED_HOSTS cannot contain wildcard '*'", str(ctx.exception))

        # 3. Empty ALLOWED_HOSTS
        with self.assertRaises(ImproperlyConfigured) as ctx:
            validate_production_settings(
                debug_mode=False,
                secret="a-very-strong-production-random-secret-key-that-is-valid-50-chars",
                hosts=[]
            )
        self.assertIn("ALLOWED_HOSTS cannot contain wildcard '*'", str(ctx.exception))

        # 4. Safe production settings must succeed
        try:
            validate_production_settings(
                debug_mode=False,
                secret="a-very-strong-production-random-secret-key-that-is-valid-50-chars",
                hosts=['unnati.coop', 'api.unnati.coop']
            )
        except ImproperlyConfigured:
            self.fail("validate_production_settings raised ImproperlyConfigured unexpectedly on safe config")

    # ─────────────────────────────────────────────────────────────
    # 5. REMOVAL OF FABRICATED WORKER DATA
    # ─────────────────────────────────────────────────────────────
    def test_service_provider_discovery_empty_db_returns_no_fake_profiles(self):
        """ServiceProviderDiscoveryView must return empty list and zero count without synthetic workers."""
        # Query a category with no workers
        empty_cat = ServiceCategory.objects.create(
            name="Roofing & Waterproofing",
            base_labour_charge=Decimal('500.00')
        )

        response = self.client.get(f"/api/services/providers/?category={empty_cat.name}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['providers'], [])
        self.assertIn("No verified cooperative service providers found", response.data['message'])

        # Verify none of the synthetic names exist
        names = [p.get('full_name', '') for p in response.data['providers']]
        self.assertNotIn("Mohan A. Sharma", names)
        self.assertNotIn("Rameshchandra Patel", names)
