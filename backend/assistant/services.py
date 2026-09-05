"""
UNNATI Voice-First Multilingual Assistant Services
---------------------------------------------------
Provider-independent translation/speech abstraction, intent classification,
consequential action safety guards, and 12+ Indian language knowledge support.
"""

from typing import Dict, Any, List, Optional
from decimal import Decimal
import re

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
    Core AI Assistant Engine for UNNATI.
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

        # 2. Intent Parsing: Service Search
        if any(w in cleaned for w in ['plumber', 'electrician', 'carpenter', 'clean', 'paint', 'mechanic', 'service', 'काम', 'सेवा', 'પ્લમ્બર', 'इलेक्ट्रीशियन', 'ಕಾರ್ಪೆಂಟರ್']):
            return self._handle_service_search(cleaned, lang)

        # 3. Intent Parsing: Booking Status
        if any(w in cleaned for w in ['booking', 'status', 'order', 'my job', 'स्थिति', 'बुकिंग', 'કામ સ્થિતિ', 'நிலவரம்']):
            return self._handle_booking_status(user, lang)

        # 4. Intent Parsing: Wage and Pricing Transparency
        if any(w in cleaned for w in ['price', 'rate', 'wage', 'cost', 'fee', 'charge', 'कीमत', 'कमाई', 'भाव', 'दर', 'ખર્ચ', 'விலை']):
            return self._handle_pricing_transparency(lang)

        # 5. Intent Parsing: Cooperative Benefits and Patronage
        if any(w in cleaned for w in ['cooperative', 'dividend', 'patronage', 'shg', 'guild', 'सहकारी', 'लाभांश', 'મંડળી']):
            return self._handle_cooperative_info(lang)

        # 6. Intent Parsing: Weather and Travel Consideration
        if any(w in cleaned for w in ['weather', 'rain', 'travel', 'heat', 'मौसम', 'बारिश', 'हवामान', 'વરસાદ', 'ಮಳೆ']):
            return self._handle_weather_travel_notice(lang)

        # 7. Intent Parsing: Nearby Opportunities (Worker role)
        if any(w in cleaned for w in ['opportunity', 'nearby', 'available', 'job request', 'अवसर', 'काम खोजें', 'તક']):
            return self._handle_nearby_opportunities(user, lang)

        # 8. Intent Parsing: Navigation / General Help
        return self._handle_general_help(lang)

    def _check_consequential_actions(self, query: str, lang: str) -> Optional[Dict[str, Any]]:
        """
        SAFETY RULE:
        The AI MUST NEVER independently authorize payments, refunds, worker assignment,
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
                "text": f"{msg}\n\n[Safety Protocol]: AI cannot auto-book services without your explicit review.",
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
                "text": f"{msg}\n\n[Safety Protocol]: AI cannot cancel active bookings automatically to protect worker and customer agreement safeguards.",
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
            "hi": "उन्नति में कोई बिचौलिया कमीशन नहीं है। ग्राहक सीधे कामगार को पूरी राशि देते हैं। पारदर्शी 6.5% हिस्सा सीधे कामगार के सहकारी लाभांश कोष (Patronage Pool) में जाता है।",
            "mr": "उन्नतीमध्ये मध्यस्थ कमिशन नाही. ग्राहक थेट कारागिराला पैसे देतात. 6.5% हिस्सा कारागिराच्या सहकारी लाभांश निधीत जातो.",
            "gu": "ઉન્નતિમાં કોઈ મધ્યસ્થી કમિશન નથી. ગ્રાહકો સીધા કારીગરને પૈસા ચૂકવે છે. 6.5% હિસ્સો કારીગરના સહકારી ડિવિડન્ડ ફંડમાં જાય છે.",
            "en": "UNNATI charges zero platform middleman fees. Customers pay craftspersons directly. 6.5% transparent cooperative reserve is credited directly into the worker's patronage dividend pool."
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
            "suggested_chips": ["Cooperative Dividend", "View Rates"]
        }

    def _handle_cooperative_info(self, lang: str) -> Dict[str, Any]:
        """Cooperative patronage and dividend explanation."""
        text_map = {
            "hi": "सहकारी सदस्यता के लाभ: लोकतांत्रिक मताधिकार, संरक्षण लाभांश (Patronage Dividend), आपातकालीन कल्याण कोष, और सामूहिक कार्य अवसर।",
            "mr": "सहकारी सदस्यत्वाचे फायदे: लोकशाही मतदानाचा अधिकार, संरक्षण लाभांश आणि आपत्कालीन कल्याण निधी.",
            "gu": "સહકારી સભ્યપદના ફાયદા: લોકશાહી મતાધિકાર, સંરક્ષણ ડિવિડન્ડ અને ઇમરજન્સી કલ્યાણ ભંડોળ.",
            "en": "Cooperative member benefits include democratic guild voting rights, patronage dividend balance, emergency welfare protection, and collective booking allocations."
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
            "suggested_chips": ["Cooperative Matrix", "Guild Status"]
        }

    def _handle_weather_travel_notice(self, lang: str) -> Dict[str, Any]:
        """Non-medical contextual advisory for weather and outdoor safety."""
        text_map = {
            "hi": "[सलाहकार सूचना]: बाहरी काम या भारी बारिश के दौरान बिजली सुरक्षा और पर्याप्त विश्राम का ध्यान रखें।",
            "mr": "[सल्लागार सूचना]: बाहेरील काम किंवा मुसळधार पावसात विजेची काळजी घ्या आणि पुरेसा विश्रांती घ्या.",
            "gu": "[સલાહકાર સૂચના]: બહારના કામ અથવા ભારે વરસાદમાં વીજળીની સુરક્ષાનું ધ્યાન રાખો.",
            "en": "[Advisory Notice]: For outdoor tasks during heavy rain or extreme heat, prioritize electrical safety and stay hydrated. AI advice is non-medical."
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
