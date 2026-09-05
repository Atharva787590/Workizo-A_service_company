"""
Unit tests for UNNATI Voice Assistant Backend Engine
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .services import (
    UnnatiAssistantEngine,
    SUPPORTED_LANGUAGES,
    NativeMultilingualProvider,
)

User = get_user_model()


class AssistantEngineTest(TestCase):
    def setUp(self):
        self.engine = UnnatiAssistantEngine()
        self.user = User.objects.create_user(
            email="assistant_user@workizo.com",
            full_name="Pooja Sharma",
            role="customer",
            password="password123"
        )

    def test_language_detection(self):
        # Devanagari -> Hindi
        self.assertEqual(self.engine.detect_language("मुझे प्लंबर चाहिए"), "hi")
        # Bengali -> Bengali
        self.assertEqual(self.engine.detect_language("আমার একজন প্লাম্বার দরকার"), "bn")
        # Gujarati -> Gujarati
        self.assertEqual(self.engine.detect_language("મને પ્લમ્બર જોઈએ છે"), "gu")
        # Gurmukhi -> Punjabi
        self.assertEqual(self.engine.detect_language("ਮੈਨੂੰ ਪਲੰਬਰ ਚਾਹੀਦਾ ਹੈ"), "pa")
        # Tamil -> Tamil
        self.assertEqual(self.engine.detect_language("எனக்கு பிளம்பர் தேவை"), "ta")
        # English -> English
        self.assertEqual(self.engine.detect_language("I need a plumber"), "en")

    def test_consequential_booking_action_safety_guard(self):
        result = self.engine.process_query("book now plumber service", user=self.user, language="en")
        self.assertTrue(result["requires_confirmation"])
        self.assertEqual(result["action"]["action_type"], "NAVIGATE_BOOKING")
        self.assertEqual(result["action"]["target_url"], "/customer/book")
        self.assertFalse(result["is_verified_data"])
        self.assertTrue(result["is_advisory"])

    def test_consequential_cancellation_action_safety_guard(self):
        result = self.engine.process_query("cancel booking immediately", user=self.user, language="en")
        self.assertTrue(result["requires_confirmation"])
        self.assertEqual(result["action"]["action_type"], "CONFIRM_CANCELLATION")

    def test_consequential_payment_action_safety_guard(self):
        result = self.engine.process_query("pay money to worker now", user=self.user, language="en")
        self.assertTrue(result["requires_confirmation"])
        self.assertEqual(result["action"]["action_type"], "REVIEW_PAYMENT")

    def test_pricing_transparency_information(self):
        result = self.engine.process_query("What is the price and fair wage policy?", language="en")
        self.assertFalse(result["requires_confirmation"])
        self.assertTrue(result["is_verified_data"])
        self.assertIn("zero platform middleman fees", result["text"])
        self.assertIn("6.5%", result["text"])

    def test_cooperative_information(self):
        result = self.engine.process_query("tell me about cooperative patronage dividend", language="en")
        self.assertTrue(result["is_verified_data"])
        self.assertIn("patronage dividend", result["text"])

    def test_weather_advisory_non_medical(self):
        result = self.engine.process_query("weather rain safety", language="en")
        self.assertTrue(result["is_advisory"])
        self.assertIn("non-medical", result["text"])


class AssistantAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_languages_endpoint(self):
        response = self.client.get('/api/assistant/languages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('languages', response.data)
        self.assertGreaterEqual(len(response.data['languages']), 12)

    def test_capabilities_endpoint(self):
        response = self.client.get('/api/assistant/capabilities/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['privacy_guarantees']['raw_audio_retention'], False)
        self.assertEqual(response.data['privacy_guarantees']['audio_storage'], 'NONE')

    def test_query_endpoint_empty(self):
        response = self.client.post('/api/assistant/query/', {'query': '   '}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_query_endpoint_success(self):
        response = self.client.post('/api/assistant/query/', {
            'query': 'How are fair wages calculated?',
            'language': 'en'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('text', response.data)
        self.assertIn('speech_config', response.data)
        self.assertEqual(response.data['privacy']['audio_stored'], False)
