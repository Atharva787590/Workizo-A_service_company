import time
import jwt
from django.test import TestCase, override_settings
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
from customers.models import CustomerProfile
from workers.models import WorkerProfile

User = get_user_model()


class SupabaseAuthenticationTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Generate an EC key pair (ES256) for deterministic, fast, offline JWT testing
        cls.private_key = ec.generate_private_key(ec.SECP256R1())
        cls.public_key = cls.private_key.public_key()
        cls.private_pem = cls.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')
        cls.public_pem = cls.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')

        # Different key for testing signature mismatch
        cls.other_key = ec.generate_private_key(ec.SECP256R1())
        cls.other_private_pem = cls.other_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')

    def setUp(self):
        self.client = APIClient()
        self.me_url = reverse('current_user')
        self.categories_url = reverse('list_categories')
        self.worker_stats_url = reverse('dashboard_stats')

    def make_supabase_token(self, sub="sb-user-1234", email="sb.user@unnati.example",
                            role="customer", exp_offset=3600, key_pem=None, **extra_claims):
        now = int(time.time())
        payload = {
            "sub": sub,
            "email": email,
            "aud": "authenticated",
            "iss": "https://phtjxgojhofgclraljpp.supabase.co/auth/v1",
            "iat": now,
            "exp": now + exp_offset,
            "user_metadata": {
                "full_name": "Supabase Test User",
                "role": role,
                "phone": "9876543210",
                **extra_claims
            }
        }
        signing_key = key_pem or self.private_pem
        return jwt.encode(payload, signing_key, algorithm="ES256", headers={"kid": "test-key-id"})

    def test_valid_supabase_token_authenticates_and_creates_user(self):
        """A valid Supabase access token establishes authenticated identity and creates Django user."""
        token = self.make_supabase_token(sub="sb-sub-001", email="newuser@example.com", role="customer")

        with override_settings(SUPABASE_JWT_VERIFYING_KEY=self.public_pem):
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
            response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], "newuser@example.com")
        self.assertEqual(response.data['user']['role'], "customer")

        # Verify database record
        user = User.objects.filter(supabase_uid="sb-sub-001").first()
        self.assertIsNotNone(user)
        self.assertEqual(user.email, "newuser@example.com")
        self.assertEqual(user.auth_provider, "SUPABASE")
        self.assertFalse(user.has_usable_password())
        self.assertTrue(CustomerProfile.objects.filter(user=user).exists())

    def test_subsequent_requests_do_not_create_duplicate_users(self):
        """Repeated authenticated requests reuse the existing user record without duplicating."""
        token = self.make_supabase_token(sub="sb-sub-002", email="repeat@example.com", role="customer")

        with override_settings(SUPABASE_JWT_VERIFYING_KEY=self.public_pem):
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
            res1 = self.client.get(self.me_url)
            self.assertEqual(res1.status_code, status.HTTP_200_OK)

            initial_count = User.objects.count()

            res2 = self.client.get(self.me_url)
            self.assertEqual(res2.status_code, status.HTTP_200_OK)

            res3 = self.client.get(self.me_url)
            self.assertEqual(res3.status_code, status.HTTP_200_OK)

            final_count = User.objects.count()
            self.assertEqual(initial_count, final_count)

    def test_expired_token_is_rejected(self):
        """Expired Supabase access tokens are rejected with HTTP 401."""
        expired_token = self.make_supabase_token(exp_offset=-60)  # expired 60 seconds ago

        with override_settings(SUPABASE_JWT_VERIFYING_KEY=self.public_pem):
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {expired_token}")
            response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("expired", str(response.data).lower())

    def test_invalid_signature_is_rejected(self):
        """Tokens signed by an unverified key are rejected with HTTP 401."""
        tampered_token = self.make_supabase_token(key_pem=self.other_private_pem)

        with override_settings(SUPABASE_JWT_VERIFYING_KEY=self.public_pem):
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tampered_token}")
            response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_token_on_protected_endpoint_rejected(self):
        """Protected endpoints reject requests without an Authorization token."""
        self.client.credentials()  # No token
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_public_endpoint_accessible(self):
        """Public endpoints remain accessible without any token."""
        self.client.credentials()  # No token
        response = self.client.get(self.categories_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_link_existing_user_by_email(self):
        """Existing legacy user record with matching email is linked to supabase_uid safely."""
        existing_user = User.objects.create_user(
            email="existing@example.com",
            full_name="Existing User",
            phone="9988776655",
            password="LegacyPassword123!",
            role="customer",
            auth_provider="EMAIL"
        )
        self.assertIsNone(existing_user.supabase_uid)

        token = self.make_supabase_token(sub="sb-linked-uid", email="existing@example.com", role="customer")

        with override_settings(SUPABASE_JWT_VERIFYING_KEY=self.public_pem):
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
            response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        existing_user.refresh_from_db()
        self.assertEqual(existing_user.supabase_uid, "sb-linked-uid")
        self.assertEqual(existing_user.auth_provider, "SUPABASE")

    def test_role_authorization_worker_and_customer_separation(self):
        """Worker role token can access worker dashboard; customer role token is rejected (HTTP 403)."""
        worker_token = self.make_supabase_token(sub="sb-worker-001", email="worker@example.com", role="worker")
        customer_token = self.make_supabase_token(sub="sb-cust-002", email="customer@example.com", role="customer")

        with override_settings(SUPABASE_JWT_VERIFYING_KEY=self.public_pem):
            # Customer accessing worker-only endpoint receives 403 Forbidden
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {customer_token}")
            cust_res = self.client.get(self.worker_stats_url)
            self.assertEqual(cust_res.status_code, status.HTTP_403_FORBIDDEN)

            # Worker accessing worker-only endpoint succeeds with 200 OK
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {worker_token}")
            work_res = self.client.get(self.worker_stats_url)
            self.assertEqual(work_res.status_code, status.HTTP_200_OK)

    def test_request_body_role_tampering_is_ignored(self):
        """Roles passed in request bodies or query params cannot elevate privileges."""
        token = self.make_supabase_token(sub="sb-cust-005", email="cust5@example.com", role="customer")

        with override_settings(SUPABASE_JWT_VERIFYING_KEY=self.public_pem):
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
            # Try to pass an admin role in query param or body
            response = self.client.get(f"{self.me_url}?role=admin")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['role'], "customer")

        user = User.objects.get(supabase_uid="sb-cust-005")
        self.assertEqual(user.role, "customer")
        self.assertFalse(user.is_staff)
