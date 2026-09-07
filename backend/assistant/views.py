"""
UNNATI Voice Assistant Views
----------------------------
REST API endpoints for multilingual query handling, language options,
and assistant capabilities declaration.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .services import UnnatiAssistantEngine, SUPPORTED_LANGUAGES, NativeMultilingualProvider

engine = UnnatiAssistantEngine()

class AssistantQueryView(APIView):
    """
    Handles text or voice transcripts sent to the UNNATI assistant.
    Does not require authentication for public queries (services, pricing, cooperative rules),
    but safely isolates user-specific queries (bookings, opportunities) when authenticated.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        query = request.data.get('query', '').strip()
        language = request.data.get('language', 'en').strip().lower()

        if not query:
            return Response(
                {"detail": "Query cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(query) > 500:
            return Response(
                {"detail": "Query exceeds maximum limit of 500 characters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user if request.user.is_authenticated else None
        result = engine.process_query(query=query, user=user, language=language)

        # Attach speech synthesis metadata for provider-independent playback
        speech_config = engine.provider.get_speech_config(result['language'])
        result['speech_config'] = speech_config

        # Explicit privacy confirmation
        result['privacy'] = {
            "audio_retention": "NONE",
            "audio_stored": False,
            "data_retention_policy": "Zero raw audio storage; transient in-memory speech processing only."
        }

        return Response(result, status=status.HTTP_200_OK)


class AssistantLanguagesView(APIView):
    """Returns the list of 12+ supported Indian languages."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "languages": SUPPORTED_LANGUAGES,
            "default_language": "en"
        }, status=status.HTTP_200_OK)


class AssistantCapabilitiesView(APIView):
    """Declares assistant capabilities, safety boundaries, and offline support."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "assistant_name": "UNNATI Help — Knowledge-based support",
            "capabilities": [
                "Service catalog discovery",
                "Service details & base rates",
                "Authenticated booking status tracking",
                "Fair wage & direct payment transparency",
                "Nearby opportunity discovery for craftspersons",
                "Weather & travel consideration advisories",
                "Cooperative principles & governance explanation",
            ],
            "safety_boundaries": [
                "Zero independent authorization of financial transfers or booking cancellations",
                "Explicit user confirmation required for consequential actions",
                "Strict non-medical advisory disclaimer",
                "Strict isolation of private user records",
                "Direct customer-to-worker settlement model"
            ],
            "privacy_guarantees": {
                "raw_audio_retention": False,
                "audio_storage": "NONE",
                "pii_leak_prevention": "Strict server-side role and user ID isolation"
            },
            "offline_resilience": {
                "browser_cache_enabled": True,
                "local_intent_matching": True,
                "text_fallback": True
            }
        }, status=status.HTTP_200_OK)
