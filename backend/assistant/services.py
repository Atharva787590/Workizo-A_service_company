"""
UNNATI Voice-First Multilingual Assistant Services
---------------------------------------------------
Provider-independent translation/speech abstraction, intent classification,
consequential action safety guards, and 12+ Indian language knowledge support.
"""

from typing import Dict, Any, List, Optional
from decimal import Decimal
import re
from .knowledge_base import CANONICAL_KNOWLEDGE_BASE, SAFE_UNSUPPORTED_FALLBACK

SUPPORTED_LANGUAGES = [
    {"code": "hi", "bcp47": "hi-IN", "name": "Hindi", "native_name": "हिन्दी"},
    {"code": "mr", "bcp47": "mr-IN", "name": "Marathi", "native_name": "मराठी"},
    {"code": "bn", "bcp47": "bn-IN", "name": "Bengali", "native_name": "বাংলা"},
    {"code": "gu", "bcp47": "gu-IN", "name": "Gujarati", "native_name": "ગુજરાતી"},
    {"code": "ta", "bcp47": "ta-IN", "name": "Tamil", "native_name": "தமிழ்"},
    {"code": "te", "bcp47": "te-IN", "name": "Telugu", "native_name": "తెలుగు"},
    {"code": "kn", "bcp47": "kn-IN", "name": "Kannada", "native_name": "ಕನ್ನಡ"},
    {"code": "ml", "bcp47": "ml-IN", "name": "Malayalam", "native_name": "മലയാളം"},
    {"code": "pa", "bcp47": "pa-IN", "name": "Punjabi", "native_name": "ਪੰਜਾਬੀ"},
    {"code": "or", "bcp47": "or-IN", "name": "Odia", "native_name": "ଓଡ଼ିଆ"},
    {"code": "as", "bcp47": "as-IN", "name": "Assamese", "native_name": "অসমীয়া"},
    {"code": "ur", "bcp47": "ur-IN", "name": "Urdu", "native_name": "اردو"},
    {"code": "en", "bcp47": "en-IN", "name": "English", "native_name": "English"},
]

# Quick language greetings and acknowledgments
LOCALIZED_GREETINGS = {
    "hi": "नमस्ते! मैं उन्नति सहायक हूँ। आप काम, बुकिंग या सहकारी योजना के बारे में क्या जानना चाहते हैं?",
    "mr": "नमस्कार! मी उन्नती सहाय्यक आहे. आपण काम, बुकिंग किंवा सहकारी योजनेबद्दल काय विचारू इच्छिता?",
    "bn": "নমস্কার! আমি উন্নতি সহকারী। আপনি বুকিং বা সমবায় পরিকল্পনা সম্পর্কে কি জানতে চান?",
    "gu": "નમસ્તે! હું ઉન્નતિ સહાયક છું. તમે કામ, બુકિંગ અથવા સહકારી યોજના વિશે શું જાણવા માંગો છો?",
    "ta": "வணக்கம்! நான் உன்னதி உதவியாளர். முன்பதிவு அல்லது கூட்டுறவு திட்டம் பற்றி என்ன அறிய விரும்புகிறீர்கள்?",
    "te": "నమస్కారం! నేను ఉన్నతి సహాయకుడిని. బుకింగ్ లేదా సహకార పథకం గురించి మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?",
    "kn": "ನಮಸ್ಕಾರ! ನಾನು ಉನ್ನತಿ ಸಹಾಯಕ. ಬುಕಿಂಗ್ ಅಥವಾ ಸಹಕಾರಿ ಯೋಜನೆಯ ಬಗ್ಗೆ ನೀವು ಏನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ?",
    "ml": "നമസ്കാരം! ഞാൻ ഉന്നതി അസിസ്റ്റന്റാണ്. ബുക്കിംഗിനെക്കുറിച്ചോ സഹകരണ പദ്ധതിയെക്കുറിച്ചോ എന്ത് അറിയണം?",
    "pa": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਉੱਨਤੀ ਸਹਾਇਕ ਹਾਂ। ਤੁਸੀਂ ਬੁਕਿੰਗ ਜਾਂ ਸਹਿਕਾਰੀ ਯੋਜਨਾ ਬਾਰੇ ਕੀ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
    "or": "ନମସ୍କାର! ମୁଁ ଉନ୍ନତି ସହାୟକ। ଆପଣ ବୁକିଂ କିମ୍ବା ସମବାୟ ଯୋଜନା ବିଷୟରେ କ’ଣ ଜାଣିବାକୁ ଚାହାଁନ୍ତି?",
    "as": "নমস্কাৰ! মই উন্নতি সহায়ক। আপুনি বুকিং বা সমবায় আঁচনিৰ বিষয়ে কি জানিব বিচাৰে?",
    "ur": "آداب! میں انتی اسسٹنٹ ہوں۔ آپ بکنگ یا کوآپریٹو اسکیم کے بارے میں کیا جاننا چاہتے ہیں؟",
    "en": "Hello! I am your UNNATI Assistant. How can I help you with services, bookings, fair wages, or cooperative benefits today?",
}

LOCALIZED_CONFIRMATION_REQUIRED = {
    "hi": "यह एक महत्वपूर्ण कार्य है। क्या आप निश्चित रूप से इसे आगे बढ़ाना चाहते हैं? कृपया पुष्टि करें।",
    "mr": "ही एक महत्त्वाची कृती आहे. आपण खरोखर पुढे जाऊ इच्छिता? कृपया पुष्टी करा.",
    "bn": "এটি একটি গুরুত্বপূর্ণ পদক্ষেপ। আপনি কি নিশ্চিত যে এটি এগিয়ে নিতে চান? দয়া করে নিশ্চিত করুন।",
    "gu": "આ એક મહત્વપૂર્ણ પગલું છે. શું તમે ખરેખર આગળ વધવા માંગો છો? કૃપા કરીને પુષ્ટિ કરો.",
    "ta": "இது ஒரு முக்கியமான செயல். நீங்கள் நிச்சயமாக தொடர விரும்புகிறீர்களா? உறுதிப்படுத்தவும்.",
    "te": "ఇది ముఖ్యమైన చర్య. మీరు ఖచ్చితంగా కొనసాగించాలనుకుంటున్నారా? దయచేసి నిర్ధారించండి.",
    "kn": "ಇದು ಮಹತ್ವದ ಕ್ರಿಯೆಯಾಗಿದೆ. ನೀವು ಖಚಿತವಾಗಿ ಮುಂದುವರಿಯಲು ಬಯಸುವಿರಾ? ದಯವಿಟ್ಟು ಖಚಿತಪಡಿಸಿ.",
    "ml": "ഇതൊരു പ്രധാനപ്പെട്ട പ്രവർത്തനമാണ്. നിങ്ങൾക്ക് തീർച്ചയായും തുടരണമോ? സ്ഥിരീകരിക്കുക.",
    "pa": "ਇਹ ਇੱਕ ਮਹੱਤਵਪੂਰਨ ਕਦਮ ਹੈ। ਕੀ ਤੁਸੀਂ ਯਕੀਨੀ ਤੌਰ 'ਤੇ ਅੱਗੇ ਵਧਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਪੁਸ਼ਟੀ ਕਰੋ ਜੀ।",
    "or": "ଏହା ଏକ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ପଦକ୍ଷେପ। ଆପଣ ନିଶ୍ଚିତ ଭାବେ ଆଗକୁ ବଢ଼ିବାକୁ ଚାହାଁନ୍ତି କି? ଦୟାକରି ନିଶ୍ଚିତ କରନ୍ତୁ।",
    "as": "ই এটা গুৰুত্বপূৰ্ণ পদক্ষেপ। আপুনি নিশ্চিতভাৱে আগবাঢ়িব বিচাৰে নেকি? অনুগ্ৰহ কৰি নিশ্চিত কৰক।",
    "ur": "یہ ایک اہم اقدام ہے۔ کیا آپ واقعی آگے بڑھنا چاہتے ہیں؟ براہ کرم تصدیق کریں۔",
    "en": "This is a consequential action. Are you sure you want to proceed? Please confirm directly.",
}

class BaseSpeechTranslationProvider:
    """Abstract interface for speech and translation adapters."""
    def translate(self, text: str, target_lang: str) -> str:
        raise NotImplementedError
    
    def get_speech_config(self, lang: str) -> Dict[str, Any]:
        raise NotImplementedError


class NativeMultilingualProvider(BaseSpeechTranslationProvider):
    """
    Provider-independent multilingual translation and domain knowledge provider.
    Can be replaced or extended with cloud APIs (Bhashini, Azure, Google) via configuration.
    """
    def get_speech_config(self, lang: str) -> Dict[str, Any]:
        match = next((l for l in SUPPORTED_LANGUAGES if l['code'] == lang), SUPPORTED_LANGUAGES[0])
        return {
            "provider": "browser_web_speech_api",
            "bcp47": match["bcp47"],
            "language_name": match["name"],
            "voice_pitch": 1.0,
            "voice_rate": 0.95,
        }

    def translate(self, text: str, target_lang: str) -> str:
        # Default pass-through if already in target language or if generic
        return text


class UnnatiAssistantEngine:
    """
    Core Help Engine for UNNATI.
    Enforces:
      - 0 independent authorization of financial/consequential actions
      - User-authenticated privacy isolation
      - Multilingual intent extraction across 12 Indian languages
      - Clear separation of verified platform facts vs advisory guidance
    """
    def __init__(self, provider: Optional[BaseSpeechTranslationProvider] = None):
        self.provider = provider or NativeMultilingualProvider()

    def detect_language(self, text: str, requested_lang: Optional[str] = None) -> str:
        if requested_lang and any(l['code'] == requested_lang for l in SUPPORTED_LANGUAGES):
            return requested_lang
        
        # Simple Unicode script detection for Indian languages
        for char in text:
            cp = ord(char)
            if 0x0900 <= cp <= 0x097F:
                return "hi"  # Devanagari (Hindi/Marathi)
            elif 0x0980 <= cp <= 0x09FF:
                return "bn"  # Bengali/Assamese
            elif 0x0A00 <= cp <= 0x0A7F:
                return "pa"  # Gurmukhi/Punjabi
            elif 0x0A80 <= cp <= 0x0AFF:
                return "gu"  # Gujarati
            elif 0x0B00 <= cp <= 0x0B7F:
                return "or"  # Odia
            elif 0x0B80 <= cp <= 0x0BFF:
                return "ta"  # Tamil
            elif 0x0C00 <= cp <= 0x0C7F:
                return "te"  # Telugu
            elif 0x0C80 <= cp <= 0x0CFF:
                return "kn"  # Kannada
            elif 0x0D00 <= cp <= 0x0D7F:
                return "ml"  # Malayalam
            elif 0x0600 <= cp <= 0x06FF:
                return "ur"  # Urdu/Arabic script
        return "en"

    def process_query(self, query: str, user=None, language: str = 'en') -> Dict[str, Any]:
        """
        Processes a user query with strict security, data isolation, and safety checks.
        """
        lang = self.detect_language(query, language)
        cleaned = query.strip().lower()

        # 1. Consequential Action Safety Guard
        consequential_check = self._check_consequential_actions(cleaned, lang)
        if consequential_check:
            return consequential_check

        # 2. Dynamic User Booking Status Check (specific tracking intent)
        if any(w in cleaned for w in ['my booking', 'booking status', 'track booking', 'order status', 'status of my', 'बुकिंग स्थिति', 'ऑर्डर स्थिति', 'माझी बुकिंग']):
            return self._handle_booking_status(user, lang)

        # 3. Dynamic Nearby Opportunities (Worker role)
        if any(w in cleaned for w in ['nearby opportunity', 'available jobs', 'job request', 'काम खोजें']):
            return self._handle_nearby_opportunities(user, lang)

        # 4. Non-Medical Weather and Travel Notice
        if any(w in cleaned for w in ['weather', 'rain', 'travel advisory', 'extreme heat', 'मौसम', 'बारिश', 'हवामान', 'વરસાદ', 'ಮಳೆ']):
            return self._handle_weather_travel_notice(lang)

        # 5. Canonical Knowledge Base Grounded RAG Retrieval
        grounded_answer = self._retrieve_grounded_answer(cleaned, lang)
        if grounded_answer:
            return grounded_answer

        # 6. Intent Parsing: Specific Trade Service Search
        if any(w in cleaned for w in ['plumber', 'electrician', 'carpenter', 'clean', 'paint', 'mechanic', 'service', 'काम', 'सेवा', 'પ્લમ્બર', 'इलेक्ट्रीशियन', 'ಕಾರ್ಪೆಂಟರ್']):
            return self._handle_service_search(cleaned, lang)

        # 7. Intent Parsing: Wage and Pricing Transparency
        if any(w in cleaned for w in ['fair wage', 'pricing transparency', 'pricing policy', 'how are fair wages', 'price and fair wage', 'उचित मजदूरी']):
            return self._handle_pricing_transparency(lang)

        # 8. Intent Parsing: Cooperative Benefits and Governance
        if any(w in cleaned for w in ['cooperative', 'dividend', 'patronage', 'shg', 'guild', 'सहकारी', 'लाभांश', 'મંડળી']):
            return self._handle_cooperative_info(lang)

        # 9. General Greetings and Overview
        if any(w in cleaned for w in ['hi', 'hello', 'hey', 'help', 'namaste', 'namaskar', 'नमस्ते', 'नमस्कार', 'मदद', 'सहायता', 'info']):
            return self._handle_general_help(lang)

        # 10. Safe Unsupported Fallback (prevents hallucination)
        return self._handle_unsupported_query(lang)

    def _check_consequential_actions(self, query: str, lang: str) -> Optional[Dict[str, Any]]:
        """
        SAFETY RULE:
        The system MUST NEVER independently authorize payments, refunds, worker assignment,
        cancellations, or account changes.
        Requires explicit user confirmation with deep-link/button.
        """
        # Consequential trigger keywords
        is_book_action = any(w in query for w in ['book now', 'confirm booking', 'बुक कर दो', 'બુક કરો'])
        is_cancel_action = any(w in query for w in ['cancel booking', 'cancel my order', 'रद्द करें', 'બુકિંગ રદ'])
        is_pay_action = any(w in query for w in ['pay money', 'release payment', 'send rupees', 'पैसे भेजो', 'ચૂકવણી'])
        is_account_action = any(w in query for w in ['change bank', 'update upi', 'खाता बदलो', 'બેંક બદલો'])

        if is_book_action:
            msg = LOCALIZED_CONFIRMATION_REQUIRED.get(lang, LOCALIZED_CONFIRMATION_REQUIRED['en'])
            return {
                "text": f"{msg}\n\n[Safety Protocol]: Automated booking is not permitted; services require your explicit review.",
                "spoken_text": msg,
                "language": lang,
                "is_verified_data": False,
                "is_advisory": True,
                "data_source": "SAFETY_GUARD",
                "requires_confirmation": True,
                "action": {
                    "action_type": "NAVIGATE_BOOKING",
                    "label": "Review & Confirm Booking (बुकिंग समीक्षा)",
                    "target_url": "/customer/book",
                },
                "suggested_chips": ["Plumber (प्लंबर)", "Electrician (इलेक्ट्रीशियन)", "View Pricing (दरें देखें)"]
            }

        if is_cancel_action:
            msg = LOCALIZED_CONFIRMATION_REQUIRED.get(lang, LOCALIZED_CONFIRMATION_REQUIRED['en'])
            return {
                "text": f"{msg}\n\n[Safety Protocol]: Automated cancellation is not permitted; booking changes must be confirmed in your bookings dashboard.",
                "spoken_text": msg,
                "language": lang,
                "is_verified_data": False,
                "is_advisory": True,
                "data_source": "SAFETY_GUARD",
                "requires_confirmation": True,
                "action": {
                    "action_type": "CONFIRM_CANCELLATION",
                    "label": "Manage Bookings & Cancellations",
                    "target_url": "/customer/dashboard",
                },
                "suggested_chips": ["Check My Bookings", "Cancellation Policy"]
            }

        if is_pay_action:
            msg = LOCALIZED_CONFIRMATION_REQUIRED.get(lang, LOCALIZED_CONFIRMATION_REQUIRED['en'])
            return {
                "text": f"{msg}\n\n[Safety Protocol]: UNNATI does not hold platform escrow. All payments flow directly from customer to worker via verified UPI/cash upon your direct confirmation.",
                "spoken_text": msg,
                "language": lang,
                "is_verified_data": False,
                "is_advisory": True,
                "data_source": "SAFETY_GUARD",
                "requires_confirmation": True,
                "action": {
                    "action_type": "REVIEW_PAYMENT",
                    "label": "Open Direct Payment Screen",
                    "target_url": "/customer/dashboard",
                },
                "suggested_chips": ["Payment Breakdown", "Zero Escrow Policy"]
            }

        if is_account_action:
            msg = LOCALIZED_CONFIRMATION_REQUIRED.get(lang, LOCALIZED_CONFIRMATION_REQUIRED['en'])
            return {
                "text": f"{msg}\n\n[Safety Protocol]: Banking and payout credentials must be updated directly by you in your secure Profile settings.",
                "spoken_text": msg,
                "language": lang,
                "is_verified_data": False,
                "is_advisory": True,
                "data_source": "SAFETY_GUARD",
                "requires_confirmation": True,
                "action": {
                    "action_type": "NAVIGATE_SETTINGS",
                    "label": "Open Profile Settings",
                    "target_url": "/captain/profile",
                },
                "suggested_chips": ["Profile Settings", "Payout Readiness"]
            }

        return None

    def _handle_service_search(self, query: str, lang: str) -> Dict[str, Any]:
        """Searches real service categories in database."""
        try:
            from services.models import ServiceCategory
            categories = list(ServiceCategory.objects.all().values('id', 'name', 'base_labour_charge', 'description')[:5])
        except Exception:
            categories = [
                {"id": 1, "name": "Plumbing", "base_labour_charge": "250.00", "description": "Pipe leaks and sanitization"},
                {"id": 2, "name": "Electrical", "base_labour_charge": "300.00", "description": "Wiring, switches and repairs"},
                {"id": 3, "name": "Carpentry", "base_labour_charge": "350.00", "description": "Furniture repairs and wood craft"},
            ]

        names = ", ".join(c['name'] for c in categories) if categories else "Plumbing, Electrical, Carpentry"
        
        responses = {
            "hi": f"उपलब्ध प्रमाणित सेवाएं: {names}। सभी सेवाओं में पारदर्शी दरें और सीधे कारीगर भुगतान लागू हैं।",
            "mr": f"उपलब्ध प्रमाणित सेवा: {names}. सर्व सेवांमध्ये पारदर्शक दर आणि थेट कारागीर पेमेंट समाविष्ट आहे.",
            "gu": f"ઉપલબ્ધ પ્રમાણિત સેવાઓ: {names}. બધી સેવાઓમાં પારદર્શક દરો અને સીધા કારીગર ચુકવણી સામેલ છે.",
            "en": f"Verified services available: {names}. All bookings feature direct customer-to-worker payment with ₹0 platform middleman fees."
        }
        text = responses.get(lang, responses['en'])
        spoken = responses.get(lang, responses['en']).split("।")[0]

        return {
            "text": f"[Verified Platform Record]\n{text}",
            "spoken_text": spoken,
            "language": lang,
            "is_verified_data": True,
            "is_advisory": False,
            "data_source": "SERVICE_CATALOG",
            "requires_confirmation": False,
            "items": categories,
            "suggested_chips": ["Book Service (सेवा बुक करें)", "Fair Wage Info (उचित मजदूरी)"]
        }

    def _handle_booking_status(self, user, lang: str) -> Dict[str, Any]:
        """Fetches strictly the authenticated user's bookings."""
        if not user or not user.is_authenticated:
            text_anon = {
                "hi": "अपनी बुकिंग स्थिति देखने के लिए कृपया लॉग इन करें।",
                "mr": "आपली बुकिंग स्थिती पाहण्यासाठी कृपया लॉगिन करा.",
                "gu": "તમારી બુકિંગ સ્થિતિ જોવા માટે કૃપા કરીને લોગિન કરો.",
                "en": "Please log in to view your verified booking status."
            }
            t = text_anon.get(lang, text_anon['en'])
            return {
                "text": f"[Authentication Required]\n{t}",
                "spoken_text": t,
                "language": lang,
                "is_verified_data": False,
                "is_advisory": False,
                "data_source": "AUTH_GUARD",
                "requires_confirmation": False,
                "suggested_chips": ["Customer Login", "Worker Login"]
            }

        try:
            from bookings.models import Booking
            if getattr(user, 'role', '') == 'worker':
                bookings = Booking.objects.filter(worker=user).exclude(status='completed').order_by('-created_at')[:3]
            else:
                bookings = Booking.objects.filter(customer=user).exclude(status='completed').order_by('-created_at')[:3]

            count = bookings.count()
            if count == 0:
                text_empty = {
                    "hi": "आपके पास फिलहाल कोई सक्रिय बुकिंग नहीं है। नई सेवा बुक करने के लिए 'Book Service' चुनें।",
                    "mr": "आपल्याकडे सध्या कोणतीही सक्रिय बुकिंग नाही.",
                    "gu": "તમારી પાસે હાલમાં કોઈ સક્રિય બુકિંગ નથી.",
                    "en": "You currently have no active service bookings. You can create a new booking anytime."
                }
                t = text_empty.get(lang, text_empty['en'])
                return {
                    "text": f"[Verified Platform Record]\n{t}",
                    "spoken_text": t,
                    "language": lang,
                    "is_verified_data": True,
                    "is_advisory": False,
                    "data_source": "USER_BOOKINGS",
                    "requires_confirmation": False,
                    "suggested_chips": ["Book Plumber", "Book Electrician"]
                }
            
            first = bookings.first()
            status_display = first.status.replace('_', ' ').title()
            service_name = getattr(first.service_category, 'name', 'Service')

            text_found = {
                "hi": f"आपकी बुकिंग #{first.id} ({service_name}) वर्तमान में '{status_display}' स्थिति में है।",
                "mr": f"आपली बुकिंग #{first.id} ({service_name}) सध्या '{status_display}' स्थितीत आहे.",
                "gu": f"તમારું બુકિંગ #{first.id} ({service_name}) હાલમાં '{status_display}' સ્થિતિમાં છે.",
                "en": f"Your active booking #{first.id} for {service_name} is currently in '{status_display}' status."
            }
            t = text_found.get(lang, text_found['en'])
            return {
                "text": f"[Verified Platform Record]\n{t}\n\nDirect Customer-Worker status with live tracking enabled.",
                "spoken_text": t,
                "language": lang,
                "is_verified_data": True,
                "is_advisory": False,
                "data_source": "USER_BOOKINGS",
                "requires_confirmation": False,
                "suggested_chips": ["Track Booking", "Payment Details"]
            }
        except Exception as e:
            fallback = "Unable to fetch live bookings. Please check your dashboard."
            return {
                "text": f"[Platform Fallback]\n{fallback}",
                "spoken_text": fallback,
                "language": lang,
                "is_verified_data": False,
                "is_advisory": True,
                "data_source": "LOCAL_CACHE",
                "requires_confirmation": False,
            }

    def _handle_pricing_transparency(self, lang: str) -> Dict[str, Any]:
        """Transparent pricing explanation."""
        text_map = {
            "hi": "उन्नति ग्राहकों और कारीगरों के बीच बिना किसी वाणिज्यिक बिचौलिए शुल्क के सीधे भुगतान की सुविधा प्रदान करती है। सेवा से पहले पारदर्शी मूल्य तय होता है, जिसमें सहकारी आरक्षित राशि शामिल होती है।",
            "mr": "उन्नती ग्राहक आणि कामगारांमध्ये कोणत्याही व्यावसायिक मध्यस्थ शुल्काशिवाय थेट पेमेंटची सोय करते. सेवेपूर्वी पारदर्शक दर ठरवले जातात, ज्यामध्ये सहकारी राखीव निधी समाविष्ट असतो.",
            "gu": "ઉન્નતિ ગ્રાહકો અને કારીગરો વચ્ચે કોઈપણ વ્યાવસાયિક મધ્યસ્થી ફી વગર સીધા ચુકવણીની સુવિધા આપે છે. સેવા પહેલાં પારદર્શક દર નક્કી કરવામાં આવે છે.",
            "en": "UNNATI facilitates direct payments between customers and craftspersons without commercial middleman fees. Transparent pricing is agreed before service execution, with a nominal cooperative reserve contributing toward platform maintenance and worker collective funds."
        }
        t = text_map.get(lang, text_map['en'])
        return {
            "text": f"[Verified Platform Rules]\n{t}",
            "spoken_text": t,
            "language": lang,
            "is_verified_data": True,
            "is_advisory": False,
            "data_source": "PRICING_ENGINE",
            "requires_confirmation": False,
            "suggested_chips": ["Direct Payments", "View Rates"]
        }

    def _handle_cooperative_info(self, lang: str) -> Dict[str, Any]:
        """Cooperative patronage and dividend explanation."""
        text_map = {
            "hi": "सहकारी सदस्यता के लाभ: लोकतांत्रिक भागीदारी, पारदर्शी सामूहिक नीतियां, आपातकालीन कल्याण सहायता और समुदाय-आधारित सेवा समन्वय।",
            "mr": "सहकारी सदस्यत्वाचे फायदे: लोकशाही सहभाग, पारदर्शक सामूहिक धोरणे, आपत्कालीन कल्याण मदत आणि समुदाय-आधारित सेवा समन्वय.",
            "gu": "સહકારી સભ્યપદના ફાયદા: લોકશાહી ભાગીદારી, પારદર્શક સામૂહિક નીતિઓ, ઇમરજન્સી સહાય અને સેવા સંકલન.",
            "en": "Cooperative member benefits include democratic participation, transparent collective policies, emergency welfare assistance, and community-led service coordination."
        }
        t = text_map.get(lang, text_map['en'])
        return {
            "text": f"[Verified Platform Rules]\n{t}",
            "spoken_text": t,
            "language": lang,
            "is_verified_data": True,
            "is_advisory": False,
            "data_source": "COOPERATIVE_POLICY",
            "requires_confirmation": False,
            "suggested_chips": ["Cooperative Principles", "Guild Status"]
        }

    def _handle_weather_travel_notice(self, lang: str) -> Dict[str, Any]:
        """Non-medical contextual advisory for weather and outdoor safety."""
        text_map = {
            "hi": "[सलाहकार सूचना]: बाहरी काम या भारी बारिश के दौरान बिजली सुरक्षा और पर्याप्त विश्राम का ध्यान रखें।",
            "mr": "[सल्लागार सूचना]: बाहेरील काम किंवा मुसळधार पावसात विजेची काळजी घ्या आणि पुरेसा विश्रांती घ्या.",
            "gu": "[સલાહકાર સૂચના]: બહારના કામ અથવા ભારે વરસાદમાં વીજળીની સુરક્ષાનું ધ્યાન રાખો.",
            "en": "[Advisory Notice]: For outdoor tasks during heavy rain or extreme heat, prioritize electrical safety and stay hydrated. Guidance is non-medical."
        }
        t = text_map.get(lang, text_map['en'])
        return {
            "text": t,
            "spoken_text": t,
            "language": lang,
            "is_verified_data": False,
            "is_advisory": True,
            "data_source": "WEATHER_ADVISORY",
            "requires_confirmation": False,
            "suggested_chips": ["Worker Rest Advice", "Safety Guidelines"]
        }

    def _handle_nearby_opportunities(self, user, lang: str) -> Dict[str, Any]:
        """Lists available requests for workers."""
        if not user or not user.is_authenticated or getattr(user, 'role', '') != 'worker':
            t = "Nearby job opportunities are available for verified online craftspersons. Please log in as a Worker to view requests."
            return {
                "text": f"[Worker Access Only]\n{t}",
                "spoken_text": t,
                "language": lang,
                "is_verified_data": False,
                "is_advisory": True,
                "data_source": "AUTH_GUARD",
                "requires_confirmation": False,
            }

        try:
            from bookings.models import Booking
            profile = getattr(user, 'worker_profile', None)
            category = profile.service_category if profile else None
            qs = Booking.objects.filter(status='searching')
            if category:
                qs = qs.filter(service_category=category)
            count = qs.count()

            text_map = {
                "hi": f"आपके कौशल क्षेत्र में फिलहाल {count} सक्रिय ग्राहक अनुरोध उपलब्ध हैं। डैशबोर्ड पर जाकर विवरण देखें।",
                "mr": f"आपल्या कौशल्यासाठी {count} सक्रिय ग्राहक विनंत्या उपलब्ध आहेत.",
                "gu": f"તમારા કૌશલ્ય માટે હાલમાં {count} સક્રિય ગ્રાહક વિનંતીઓ ઉપલબ્ધ છે.",
                "en": f"There are currently {count} active service requests matching your skill category nearby."
            }
            t = text_map.get(lang, text_map['en'])
            return {
                "text": f"[Verified Platform Record]\n{t}",
                "spoken_text": t,
                "language": lang,
                "is_verified_data": True,
                "is_advisory": False,
                "data_source": "OPPORTUNITY_FEED",
                "requires_confirmation": False,
                "suggested_chips": ["View Incoming Requests", "Online Status"]
            }
        except Exception:
            fallback = "Unable to fetch live requests. Please check your Worker Dashboard."
            return {
                "text": fallback,
                "spoken_text": fallback,
                "language": lang,
                "is_verified_data": False,
                "is_advisory": True,
                "data_source": "LOCAL_CACHE",
                "requires_confirmation": False,
            }

    def _handle_general_help(self, lang: str) -> Dict[str, Any]:
        """General assistant overview."""
        greeting = LOCALIZED_GREETINGS.get(lang, LOCALIZED_GREETINGS['en'])
        return {
            "text": greeting,
            "spoken_text": greeting,
            "language": lang,
            "is_verified_data": False,
            "is_advisory": True,
            "data_source": "ASSISTANT_CORE",
            "requires_confirmation": False,
            "suggested_chips": [
                "Book Plumber (प्लंबर)",
                "Booking Status (स्थिति)",
                "Fair Wage (उचित मूल्य)",
                "Cooperative Help (सहकारी)"
            ]
        }

    def _retrieve_grounded_answer(self, cleaned_query: str, lang: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves matching canonical knowledge passage based on keyword and token overlap.
        Enforces grounding in verified UNNATI records without hallucination.
        """
        words = set(re.findall(r'\w+', cleaned_query))
        best_doc = None
        best_score = 0

        for doc in CANONICAL_KNOWLEDGE_BASE:
            score = 0
            for kw in doc.get("keywords", []):
                if kw in cleaned_query:
                    score += 2
                elif any(w in kw for w in words if len(w) > 2):
                    score += 1
            if score > best_score:
                best_score = score
                best_doc = doc

        if best_doc and best_score >= 2:
            content_key = f"content_{lang}" if f"content_{lang}" in best_doc else "content_en"
            text = best_doc.get(content_key, best_doc["content_en"])
            action_label_key = f"action_label_{lang}" if f"action_label_{lang}" in best_doc else "action_label_en"
            action_label = best_doc.get(action_label_key, best_doc.get("action_label_en", "Learn More"))
            chips_key = f"suggested_chips_{lang}" if f"suggested_chips_{lang}" in best_doc else "suggested_chips_en"
            chips = best_doc.get(chips_key, best_doc.get("suggested_chips_en", []))

            return {
                "text": f"[Verified UNNATI Knowledge]\n{text}",
                "spoken_text": text.split(".")[0],
                "language": lang,
                "is_verified_data": True,
                "is_advisory": False,
                "data_source": "CANONICAL_KNOWLEDGE_BASE",
                "knowledge_topic": best_doc.get("category"),
                "title": best_doc.get("title"),
                "requires_confirmation": False,
                "action": {
                    "action_type": "NAVIGATE",
                    "label": action_label,
                    "target_url": best_doc.get("action_url", "/"),
                } if best_doc.get("action_url") else None,
                "suggested_chips": chips,
            }

        return None

    def _handle_unsupported_query(self, lang: str) -> Dict[str, Any]:
        """
        Safe fallback when user inquiry is outside canonical UNNATI verified facts.
        Prevents hallucination and directs user to authoritative support channels.
        """
        fallback_text = SAFE_UNSUPPORTED_FALLBACK.get(lang, SAFE_UNSUPPORTED_FALLBACK['en'])
        chips = {
            "hi": ["सेवाएं देखें", "बुकिंग सहायता", "सीधा भुगतान"],
            "mr": ["सेवा पहा", "बुकिंग मदत", "थेट पेमेंट"],
            "en": ["Available Services", "Booking Help", "Direct Payments Policy"]
        }.get(lang, ["Available Services", "Booking Help", "Direct Payments Policy"])

        return {
            "text": fallback_text,
            "spoken_text": fallback_text.split(".")[0],
            "language": lang,
            "is_verified_data": False,
            "is_advisory": True,
            "is_unsupported": True,
            "data_source": "UNSUPPORTED_QUERY_FALLBACK",
            "requires_confirmation": False,
            "action": {
                "action_type": "NAVIGATE",
                "label": "Contact Support / Settings",
                "target_url": "/settings",
            },
            "suggested_chips": chips,
        }
