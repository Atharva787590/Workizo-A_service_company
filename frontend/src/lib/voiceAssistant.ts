/**
 * UNNATI Voice-First Multilingual Assistant Engine
 * ------------------------------------------------
 * Browser speech abstraction, 12+ Indian languages dictionary,
 * offline intent fallback, and safety guards against unauthorized consequential actions.
 */

import {
  SupportedLanguage,
  SpeechRecognitionState,
  ConsequentialAction,
  AssistantQueryResponse
} from '../types/assistant';

export const ASSISTANT_LANGUAGES: SupportedLanguage[] = [
  { code: 'hi', bcp47: 'hi-IN', name: 'Hindi', native_name: 'हिन्दी' },
  { code: 'mr', bcp47: 'mr-IN', name: 'Marathi', native_name: 'मराठी' },
  { code: 'bn', bcp47: 'bn-IN', name: 'Bengali', native_name: 'বাংলা' },
  { code: 'gu', bcp47: 'gu-IN', name: 'Gujarati', native_name: 'ગુજરાતી' },
  { code: 'ta', bcp47: 'ta-IN', name: 'Tamil', native_name: 'தமிழ்' },
  { code: 'te', bcp47: 'te-IN', name: 'Telugu', native_name: 'తెలుగు' },
  { code: 'kn', bcp47: 'kn-IN', name: 'Kannada', native_name: 'ಕನ್ನಡ' },
  { code: 'ml', bcp47: 'ml-IN', name: 'Malayalam', native_name: 'മലയാളം' },
  { code: 'pa', bcp47: 'pa-IN', name: 'Punjabi', native_name: 'ਪੰਜਾਬੀ' },
  { code: 'or', bcp47: 'or-IN', name: 'Odia', native_name: 'ଓଡ଼ିଆ' },
  { code: 'as', bcp47: 'as-IN', name: 'Assamese', native_name: 'অসমীয়া' },
  { code: 'ur', bcp47: 'ur-IN', name: 'Urdu', native_name: 'اردو' },
  { code: 'en', bcp47: 'en-IN', name: 'English', native_name: 'English' },
];

export function getLanguageByCode(code: string): SupportedLanguage {
  return (
    ASSISTANT_LANGUAGES.find((l) => l.code === code.toLowerCase()) ||
    ASSISTANT_LANGUAGES[0]
  );
}

/**
 * Consequential action safety check.
 * AI is strictly advisory and must NEVER execute payments or booking changes independently.
 */
export function detectConsequentialAction(
  query: string,
  lang: string = 'en'
): { requiresConfirmation: boolean; action?: ConsequentialAction; warning?: string } {
  const q = query.toLowerCase();

  const isBook =
    q.includes('book now') ||
    q.includes('confirm booking') ||
    q.includes('बुक कर दो') ||
    q.includes('બુક કરો') ||
    q.includes('बुक करा');

  const isCancel =
    q.includes('cancel booking') ||
    q.includes('cancel job') ||
    q.includes('रद्द करें') ||
    q.includes('બુકિંગ રદ') ||
    q.includes('रद्द करा');

  const isPay =
    q.includes('pay money') ||
    q.includes('release payment') ||
    q.includes('send rupees') ||
    q.includes('पैसे भेजो') ||
    q.includes('ચૂકવણી');

  const isAccount =
    q.includes('change bank') ||
    q.includes('update upi') ||
    q.includes('खाता बदलो') ||
    q.includes('બેંક બદલો');

  if (isBook) {
    return {
      requiresConfirmation: true,
      action: {
        action_type: 'NAVIGATE_BOOKING',
        label: lang === 'hi' ? 'बुकिंग समीक्षा और पुष्टि' : 'Review & Confirm Booking',
        target_url: '/customer/book',
      },
      warning:
        'AI Assistant cannot auto-book. Please review task details and confirm directly.',
    };
  }

  if (isCancel) {
    return {
      requiresConfirmation: true,
      action: {
        action_type: 'CONFIRM_CANCELLATION',
        label: lang === 'hi' ? 'बुकिंग प्रबंधन खोलें' : 'Manage Bookings & Cancellations',
        target_url: '/customer/dashboard',
      },
      warning:
        'AI Assistant cannot cancel active bookings. Explicit user confirmation is required.',
    };
  }

  if (isPay) {
    return {
      requiresConfirmation: true,
      action: {
        action_type: 'REVIEW_PAYMENT',
        label: lang === 'hi' ? 'सीधा भुगतान स्क्रीन' : 'Open Direct Payment Screen',
        target_url: '/customer/dashboard',
      },
      warning:
        'UNNATI does not hold funds. Payments flow directly to workers with your explicit verification.',
    };
  }

  if (isAccount) {
    return {
      requiresConfirmation: true,
      action: {
        action_type: 'NAVIGATE_SETTINGS',
        label: lang === 'hi' ? 'प्रोफ़ाइल सेटिंग्स खोलें' : 'Open Profile Settings',
        target_url: '/captain/profile',
      },
      warning:
        'Sensitive account credentials must be updated manually in your secure Profile.',
    };
  }

  return { requiresConfirmation: false };
}

/**
 * Offline intent matcher for low-bandwidth and offline environments.
 * Provides resilient, privacy-safe domain answers without network calls.
 */
export function matchOfflineAssistantIntent(
  query: string,
  lang: string = 'en'
): AssistantQueryResponse {
  const q = query.toLowerCase();

  // Safety check even offline
  const safety = detectConsequentialAction(q, lang);
  if (safety.requiresConfirmation && safety.action) {
    return {
      text: `[Safety Notice - Action Required]\n${safety.warning}`,
      spoken_text: safety.warning || 'Please confirm this action directly.',
      language: lang,
      is_verified_data: false,
      is_advisory: true,
      data_source: 'LOCAL_SAFETY_GUARD',
      requires_confirmation: true,
      action: safety.action,
      suggested_chips: ['View Pricing', 'Check Status'],
    };
  }

  // Service Discovery
  if (
    q.includes('plumber') ||
    q.includes('electrician') ||
    q.includes('carpenter') ||
    q.includes('service') ||
    q.includes('काम') ||
    q.includes('सेवा') ||
    q.includes('પ્લમ્બર')
  ) {
    const text =
      lang === 'hi'
        ? '[प्रमाणित सेवाएं (ऑफ़लाइन)]: प्लंबिंग (₹250), इलेक्ट्रीशियन (₹300), बढ़ईगीरी (₹350)। सभी में सीधा कारीगर भुगतान लागू है।'
        : lang === 'mr'
        ? '[प्रमाणित सेवा (ऑफलाइन)]: प्लंबिंग (₹250), इलेक्ट्रिशियन (₹300), सुतारकाम (₹350). थेट कारागीर पेमेंट.'
        : lang === 'gu'
        ? '[પ્રમાણિત સેવાઓ (ઑફલાઇન)]: પ્લમ્બિંગ (₹250), ઇલેક્ટ્રિશિયન (₹300), સુથારીકામ (₹350). સીધા કારીગર ચુકવણી.'
        : '[Verified Services (Offline Cache)]: Plumbing (₹250 base), Electrical (₹300 base), Carpentry (₹350 base). Direct customer-to-worker payment with ₹0 platform escrow.';

    return {
      text,
      spoken_text:
        lang === 'hi'
          ? 'प्लंबिंग, इलेक्ट्रीशियन और बढ़ईगीरी सेवाएं उपलब्ध हैं।'
          : 'Verified plumbing, electrical and carpentry services are available with direct payments.',
      language: lang,
      is_verified_data: true,
      is_advisory: false,
      data_source: 'OFFLINE_SERVICE_CATALOG',
      requires_confirmation: false,
      suggested_chips: ['Book Plumber', 'Book Electrician', 'Fair Wage Info'],
    };
  }

  // Fair Wage & Pricing Transparency
  if (
    q.includes('price') ||
    q.includes('wage') ||
    q.includes('rate') ||
    q.includes('cost') ||
    q.includes('कीमत') ||
    q.includes('दर') ||
    q.includes('भाव')
  ) {
    const text =
      lang === 'hi'
        ? '[पारदर्शी मूल्य निर्धारण]: कोई बिचौलिया कटौती नहीं। ग्राहक 100% कारीगर को देते हैं। 6.5% सहकारी अंशदान सीधे कामगार के संरक्षण कोष (Patronage Pool) में जुड़ता है।'
        : '[Transparent Wage Policy]: Zero middleman commission. 100% direct customer-to-worker payment. 6.5% cooperative allocation goes to member patronage reserve.';

    return {
      text,
      spoken_text:
        lang === 'hi'
          ? 'उन्नति में कोई बिचौलिया कमीशन नहीं है। ग्राहक सीधे कारीगर को भुगतान करते हैं।'
          : 'UNNATI charges zero middleman fee. Customers pay craftspersons directly.',
      language: lang,
      is_verified_data: true,
      is_advisory: false,
      data_source: 'OFFLINE_PRICING_RULES',
      requires_confirmation: false,
      suggested_chips: ['Cooperative Dividend', 'Service Rates'],
    };
  }

  // Cooperative Benefits
  if (
    q.includes('cooperative') ||
    q.includes('dividend') ||
    q.includes('सहकारी') ||
    q.includes('लाभांश')
  ) {
    const text =
      lang === 'hi'
        ? '[सहकारी लाभ]: 6.5% संरक्षण लाभांश (Patronage Dividend), आपातकालीन कल्याण कोष और लोकतांत्रिक गिल्ड मताधिकार।'
        : '[Cooperative Guild]: 6.5% patronage dividend allocation, emergency welfare coverage, and democratic guild voting rights.';

    return {
      text,
      spoken_text:
        lang === 'hi'
          ? 'सहकारी सदस्यों को संरक्षण लाभांश और कल्याण सुरक्षा मिलती है।'
          : 'Cooperative members receive patronage dividends and emergency welfare protection.',
      language: lang,
      is_verified_data: true,
      is_advisory: false,
      data_source: 'OFFLINE_COOPERATIVE_RULES',
      requires_confirmation: false,
      suggested_chips: ['Check Dividend', 'Guild Status'],
    };
  }

  // Weather & Safety
  if (
    q.includes('weather') ||
    q.includes('rain') ||
    q.includes('मौसम') ||
    q.includes('बारिश')
  ) {
    const text =
      lang === 'hi'
        ? '[सलाहकार सूचना]: बारिश या तेज गर्मी में बाहरी विद्युत कार्य में अतिरिक्त सावधानी बरतें और पर्याप्त पानी पिएं।'
        : '[Advisory Notice]: Prioritize electrical safety during rainfall and stay hydrated during extreme heat. AI guidance is non-medical.';

    return {
      text,
      spoken_text:
        lang === 'hi'
          ? 'बारिश में विद्युत कार्यों में अतिरिक्त सावधानी बरतें।'
          : 'Prioritize electrical safety during rainfall and stay hydrated.',
      language: lang,
      is_verified_data: false,
      is_advisory: true,
      data_source: 'OFFLINE_WEATHER_ADVISORY',
      requires_confirmation: false,
      suggested_chips: ['Worker Rest Advice', 'Safety Guidelines'],
    };
  }

  // General Fallback
  const defaultText =
    lang === 'hi'
      ? 'नमस्ते! मैं उन्नति सहायक हूँ। आप काम, बुकिंग या सहकारी योजना के बारे में क्या जानना चाहते हैं?'
      : 'Hello! I am UNNATI Assistant. Ask me about services, bookings, fair wages, or cooperative benefits.';

  return {
    text: defaultText,
    spoken_text: defaultText,
    language: lang,
    is_verified_data: false,
    is_advisory: true,
    data_source: 'OFFLINE_FALLBACK',
    requires_confirmation: false,
    suggested_chips: ['Book Plumber', 'Fair Wage Info', 'Cooperative Benefits'],
  };
}

/**
 * Speech Recognition Wrapper with safety and graceful error handling.
 */
export class BrowserSpeechRecognitionService {
  private recognition: any = null;
  public isSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        this.isSupported = true;
      }
    }
  }

  public startListening(
    langBcp47: string,
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (errorType: SpeechRecognitionState, message: string) => void,
    onEnd: () => void
  ): void {
    if (!this.isSupported || !this.recognition) {
      onError('UNAVAILABLE', 'Microphone or Speech Recognition is unavailable in this browser.');
      return;
    }

    this.recognition.lang = langBcp47;

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      onResult(final || interim, Boolean(final));
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        onError('PERMISSION_DENIED', 'Microphone access was denied. Please allow microphone permissions.');
      } else if (event.error === 'no-speech') {
        onError('IDLE', 'No speech detected.');
      } else {
        onError('ERROR', `Voice recognition error: ${event.error || 'Unknown'}`);
      }
    };

    this.recognition.onend = () => {
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (e) {
      onError('ERROR', 'Unable to start microphone.');
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Safe ignore
      }
    }
  }
}

/**
 * Speech Synthesis Wrapper with safe speech rate clamping.
 */
export class BrowserSpeechSynthesisService {
  public isSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.isSupported = true;
    }
  }

  public speak(
    text: string,
    langBcp47: string,
    rate: number = 1.0,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: Error) => void
  ): void {
    if (!this.isSupported) {
      onError?.(new Error('Speech synthesis not supported in this browser.'));
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langBcp47;
      // Clamped speech rate for low-literacy clarity (0.7x to 1.3x)
      utterance.rate = Math.max(0.7, Math.min(1.3, rate));
      utterance.pitch = 1.0;

      if (onStart) utterance.onstart = onStart;
      if (onEnd) utterance.onend = onEnd;
      utterance.onerror = (e) => {
        onError?.(new Error(`Speech error: ${e.error || 'Synthesis failed'}`));
      };

      window.speechSynthesis.speak(utterance);
    } catch (err: any) {
      onError?.(err);
    }
  }

  public stop(): void {
    if (this.isSupported) {
      window.speechSynthesis.cancel();
    }
  }
}
