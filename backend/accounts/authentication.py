import logging
import jwt
from jwt import PyJWKClient, PyJWKClientError, ExpiredSignatureError, InvalidTokenError
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)
User = get_user_model()


class SupabaseJWKManager:
    """
    Manages cached PyJWKClient instances per Supabase URL.
    JWKS keys are cached to minimize outbound network requests.
    """
    _clients = {}

    @classmethod
    def get_client(cls, supabase_url: str) -> PyJWKClient:
        normalized_url = supabase_url.rstrip('/')
        if normalized_url not in cls._clients:
            jwks_url = f"{normalized_url}/auth/v1/.well-known/jwks.json"
            cls._clients[normalized_url] = PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=3600)
        return cls._clients[normalized_url]

    @classmethod
    def clear_cache(cls):
        cls._clients.clear()


class SupabaseAuthentication(BaseAuthentication):
    """
    Cryptographic verification of Supabase Auth access tokens (JWTs).
    
    Verifies:
      - Asymmetric signature (ES256 / RS256) via Supabase JWKS (.well-known/jwks.json)
      - Audience ('authenticated')
      - Issuer ('{SUPABASE_URL}/auth/v1')
      - Expiration and not-before claims
      
    Maps verified Supabase identity ('sub', 'email', 'user_metadata') to the Django
    User model without storing passwords or trusting client-supplied role parameters.
    """

    def authenticate(self, request):
        auth_header = get_authorization_header(request).split()
        if not auth_header or auth_header[0].lower() != b'bearer':
            return None

        if len(auth_header) == 1:
            raise AuthenticationFailed('Invalid authorization header. No token provided.')
        elif len(auth_header) > 2:
            raise AuthenticationFailed('Invalid authorization header. Token string should not contain spaces.')

        raw_token = auth_header[1].decode('utf-8')
        return self.authenticate_token(raw_token, request=request)

    def authenticate_header(self, request):
        return 'Bearer realm="api"'

    def is_supabase_token(self, raw_token: str) -> bool:
        """
        Determines whether the token format and claims match a Supabase-issued JWT
        rather than a legacy SimpleJWT token.
        """
        try:
            unverified_header = jwt.get_unverified_header(raw_token)
            unverified_payload = jwt.decode(raw_token, options={"verify_signature": False})
        except Exception:
            # If the token is not even a valid JWT structure, treat it as a malformed token
            return True

        # Supabase tokens typically include a `kid` in the header, or audience 'authenticated',
        # or issuer ending in '/auth/v1' or containing 'supabase'
        if unverified_header.get('kid'):
            return True
        if unverified_payload.get('aud') == 'authenticated':
            return True
        iss = str(unverified_payload.get('iss', '')).lower()
        if 'supabase' in iss or iss.endswith('/auth/v1'):
            return True

        # If it has SimpleJWT characteristics (token_type in access/refresh, user_id, no kid)
        if 'token_type' in unverified_payload and 'user_id' in unverified_payload:
            return False

        return True

    def authenticate_token(self, raw_token: str, request=None):
        if not self.is_supabase_token(raw_token):
            # Allow fallback to SimpleJWT (for legacy test compatibility)
            return None

        supabase_url = getattr(settings, 'SUPABASE_URL', None)
        test_verifying_key = getattr(settings, 'SUPABASE_JWT_VERIFYING_KEY', None)

        if not supabase_url and not test_verifying_key:
            logger.error("SupabaseAuthentication enabled but neither SUPABASE_URL nor SUPABASE_JWT_VERIFYING_KEY is configured.")
            raise AuthenticationFailed("Authentication service is not properly configured on the server.")

        # Decode & cryptographically verify signature and claims
        try:
            if test_verifying_key:
                # Test/Override verification key
                payload = jwt.decode(
                    raw_token,
                    test_verifying_key,
                    algorithms=["ES256", "RS256", "HS256"],
                    audience="authenticated",
                    issuer=f"{supabase_url.rstrip('/')}/auth/v1" if supabase_url else None,
                    options={
                        "verify_signature": True,
                        "verify_aud": True,
                        "verify_iss": bool(supabase_url),
                        "verify_exp": True,
                    }
                )
            else:
                jwks_client = SupabaseJWKManager.get_client(supabase_url)
                signing_key = jwks_client.get_signing_key_from_jwt(raw_token)
                payload = jwt.decode(
                    raw_token,
                    signing_key.key,
                    algorithms=["ES256", "RS256"],
                    audience="authenticated",
                    issuer=f"{supabase_url.rstrip('/')}/auth/v1",
                    options={
                        "verify_signature": True,
                        "verify_aud": True,
                        "verify_iss": True,
                        "verify_exp": True,
                    }
                )
        except ExpiredSignatureError:
            raise AuthenticationFailed("Supabase access token has expired.")
        except (InvalidTokenError, PyJWKClientError) as exc:
            logger.warning(f"Supabase token verification failed: {exc}")
            raise AuthenticationFailed(f"Invalid Supabase access token: {str(exc)}")

        # Establish authenticated Django User from verified claims
        user = self.get_or_create_user_from_payload(payload)
        return (user, payload)

    def get_or_create_user_from_payload(self, payload: dict):
        supabase_uid = payload.get('sub')
        email = payload.get('email')

        if not supabase_uid:
            raise AuthenticationFailed("Verified Supabase token is missing the 'sub' identifier.")

        user_metadata = payload.get('user_metadata') or {}
        token_role = user_metadata.get('role')
        # Security: Client-controlled metadata may ONLY specify 'customer' or 'worker'.
        # 'admin' cannot be self-assigned via public signup or user_metadata.
        valid_client_roles = ('customer', 'worker')
        sanitized_role = token_role if token_role in valid_client_roles else 'customer'

        # 1. Match by existing supabase_uid
        user = User.objects.filter(supabase_uid=supabase_uid).first()

        # 2. Match by email if not found by supabase_uid (linking pre-existing user)
        if not user and email:
            user = User.objects.filter(email__iexact=email).first()
            if user:
                user.supabase_uid = supabase_uid
                if user.auth_provider != 'SUPABASE':
                    user.auth_provider = 'SUPABASE'
                user.save(update_fields=['supabase_uid', 'auth_provider'])

        # 3. Create fresh Django user if not found
        if not user:
            if not email:
                email = f"{supabase_uid}@supabase.unnati.local"
            
            full_name = (
                user_metadata.get('full_name')
                or user_metadata.get('name')
                or email.split('@')[0]
            )
            phone = user_metadata.get('phone')
            role = sanitized_role

            # Avoid unique phone collision if already taken
            if phone and User.objects.filter(phone=phone).exists():
                phone = None

            user = User.objects.create_user(
                email=email,
                full_name=full_name,
                phone=phone,
                role=role,
                auth_provider='SUPABASE',
                supabase_uid=supabase_uid
            )
            user.set_unusable_password()
            user.save()

        # 4. Synchronize role from verified JWT claim (never trusting request body)
        # Client metadata can never promote to 'admin'
        if token_role in valid_client_roles and user.role != token_role:
            # Preserve administrative status if already admin locally
            if user.role != 'admin':
                user.role = token_role
                user.save(update_fields=['role'])

        # 5. Ensure corresponding role profile exists
        self.ensure_profile(user)

        return user

    def ensure_profile(self, user):
        """
        Ensures CustomerProfile or WorkerProfile exists for the user.
        """
        try:
            if user.role == 'customer':
                from customers.models import CustomerProfile
                CustomerProfile.objects.get_or_create(user=user)
            elif user.role == 'worker':
                from workers.models import WorkerProfile
                WorkerProfile.objects.get_or_create(user=user)
        except Exception as exc:
            logger.warning(f"Failed to ensure profile for user {user.id}: {exc}")
