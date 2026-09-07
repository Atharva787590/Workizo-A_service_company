import { SupportedLanguage, LanguageInfo, TranslationKey } from './types';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    description: 'Default interface language with full platform support'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    description: 'भारतीय राष्ट्रीय भाषा - सेटिंग्स और सहायता के लिए उपलब्ध'
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    description: 'महाराष्ट्र प्रादेशिक भाषा - सेटिंग्ज आणि मदतीसाठी उपलब्ध'
  }
];

export const TRANSLATIONS: Record<SupportedLanguage, Partial<Record<TranslationKey, string>>> = {
  en: {
    // Navigation
    nav_home: 'Home',
    nav_services: 'Services',
    nav_transparency: 'Transparency Hub',
    nav_governance: 'Governance',
    nav_dashboard: 'Dashboard',
    nav_settings: 'Settings',
    nav_logout: 'Logout',
    nav_profile: 'Profile Settings',
    nav_help: 'Help',

    // Settings Page
    settings_page_title: 'Platform Settings & Preferences',
    settings_page_subtitle: 'Configure your language preferences, accessibility options, and notification channels.',
    settings_back_to_dashboard: 'Back to Dashboard',
    settings_save_success: 'Preferences saved successfully!',
    settings_reset_success: 'Settings reset to platform defaults.',
    settings_language_section_title: 'Language Selection (भाषा)',
    settings_language_section_subtitle: 'English is the default language. Hindi and Marathi are available when explicitly selected.',
    settings_language_en_desc: 'Standard platform language (Default)',
    settings_language_hi_desc: 'हिंदी भाषा इंटरफ़ेस (स्पष्ट चयन पर)',
    settings_language_mr_desc: 'मराठी भाषा इंटरफेस (स्पष्ट निवडीवर)',
    settings_language_explicit_note: 'Language changes strictly upon your explicit selection and persists across sessions without browser auto-switching.',
    settings_accessibility_section_title: 'Accessibility & Display (पहुंच योग्यता)',
    settings_accessibility_section_subtitle: 'Tailor contrast, typography sizing, and system animations to your comfort.',
    settings_high_contrast_label: 'High Contrast Mode',
    settings_high_contrast_desc: 'Increases contrast borders and text readability for low-vision users.',
    settings_text_size_label: 'Typography Sizing',
    settings_text_size_desc: 'Scale text sizing across all dashboard layouts and interactive tables.',
    settings_text_size_normal: 'Normal (100%)',
    settings_text_size_large: 'Large (115%)',
    settings_text_size_xlarge: 'Extra Large (130%)',
    settings_reduced_motion_label: 'Reduced Motion',
    settings_reduced_motion_desc: 'Disables smooth panning animations and transitions for vestibular ease.',
    settings_low_bandwidth_label: 'Low Bandwidth Data Saver',
    settings_low_bandwidth_desc: 'Compresses image assets and prioritizes offline data synchronization.',
    settings_reset_accessibility: 'Reset Accessibility Defaults',
    settings_notifications_section_title: 'Notification Preferences',
    settings_notifications_section_subtitle: 'Manage job alerts, booking updates, and sound alerts.',
    settings_sound_alerts_label: 'Audio Sound Alerts',
    settings_sound_alerts_desc: 'Play sound chimes for incoming booking requests and status changes.',
    settings_support_section_title: 'Help & Cooperative Support',
    settings_support_section_subtitle: 'Direct assistance channels from our cooperative support team.',
    settings_support_email_label: 'Email Support',
    settings_support_phone_label: 'Helpline Hours',
    settings_support_hours_label: 'Support Hours',
    settings_support_hours_val: 'Monday – Saturday, 9:00 AM – 6:00 PM IST',
    settings_legal_section_title: 'Policies & Platform Terms',
    settings_legal_terms_title: 'Terms of Service & Guidelines',
    settings_legal_terms_desc: 'Bookings, service agreements, and direct settlements are governed by UNNATI cooperative guidelines and platform terms of service.',
    settings_legal_privacy_title: 'Privacy & Data Protection Policy',
    settings_legal_privacy_desc: 'Account details and booking information are protected and used strictly for platform authentication and service coordination.',

    // UNNATI Help / Chat
    help_button_label: 'UNNATI Help',
    help_modal_title: 'UNNATI Help',
    help_modal_subtitle: 'Knowledge-based support for services, bookings, direct payments, and platform policies.',
    help_clear_history: 'Clear Chat',
    help_close: 'Close',
    help_input_placeholder: 'Ask about services, direct payments, booking or cancellations...',
    help_send_button: 'Send',
    help_empty_heading: 'How can UNNATI help you today?',
    help_empty_subtitle: 'Select an example topic or type your question below for instant verified guidance:',
    help_chip_services: 'Available Services',
    help_chip_booking: 'How Booking Works',
    help_chip_payment: 'Direct Payments',
    help_chip_wages: 'Fair Wage Model',
    help_chip_cancellation: 'Cancellation Policy',
    help_chip_governance: 'Cooperative Principles',
    help_chip_safety: 'Safety & Verification',
    help_verified_badge: 'Verified UNNATI Knowledge',
    help_advisory_badge: 'Cooperative Guidance',
    help_unsupported_title: 'Information Not Available',
    help_error_length: 'Question must be under 500 characters.',
    help_error_empty: 'Please enter a question.',
    help_offline_notice: 'Working in offline mode with cached knowledge base.',
    help_contact_prompt: 'Need personalized support? Contact our team at support@unnati.coop or +91 79 4004 0404.'
  },

  hi: {
    // Navigation
    nav_home: 'होम',
    nav_services: 'सेवाएं',
    nav_transparency: 'पारदर्शिता केंद्र',
    nav_governance: 'प्रशासन',
    nav_dashboard: 'डैशबोर्ड',
    nav_settings: 'सेटिंग्स',
    nav_logout: 'लॉगआउट',
    nav_profile: 'प्रोफ़ाइल सेटिंग्स',
    nav_help: 'सहायता',

    // Settings Page
    settings_page_title: 'प्लेटफ़ॉर्म सेटिंग्स और प्राथमिकताएं',
    settings_page_subtitle: 'अपनी भाषा, पहुंच योग्यता (Accessibility), और सूचना प्राथमिकताओं को अनुकूलित करें।',
    settings_back_to_dashboard: 'डैशबोर्ड पर वापस जाएं',
    settings_save_success: 'प्राथमिकताएं सफलतापूर्वक सहेजी गईं!',
    settings_reset_success: 'सेटिंग्स डिफ़ॉल्ट पर रीसेट कर दी गईं।',
    settings_language_section_title: 'भाषा चयन (Language)',
    settings_language_section_subtitle: 'अंग्रेजी डिफ़ॉल्ट भाषा है। स्पष्ट रूप से चुने जाने पर ही हिन्दी और मराठी उपलब्ध होती हैं।',
    settings_language_en_desc: 'मानक प्लेटफ़ॉर्म भाषा (डिफ़ॉल्ट)',
    settings_language_hi_desc: 'हिन्दी भाषा इंटरफ़ेस (सक्रिय)',
    settings_language_mr_desc: 'मराठी भाषा इंटरफेस (निवडा)',
    settings_language_explicit_note: 'भाषा केवल आपके स्पष्ट चयन पर बदलती है और बिना ब्राउज़र ऑटो-स्विचिंग के सभी सत्रों में सुरक्षित रहती है।',
    settings_accessibility_section_title: 'पहुंच योग्यता और प्रदर्शन (Accessibility)',
    settings_accessibility_section_subtitle: 'अपनी सुविधा के अनुसार कंट्रास्ट, टेक्स्ट आकार, और एनिमेशन को समायोजित करें।',
    settings_high_contrast_label: 'हाई कंट्रास्ट मोड',
    settings_high_contrast_desc: 'कम दृष्टि वाले उपयोगकर्ताओं के लिए बॉर्डर और टेक्स्ट की स्पष्टता बढ़ाता है।',
    settings_text_size_label: 'टेक्स्ट आकार (Typography)',
    settings_text_size_desc: 'डैशबोर्ड और तालिकाओं में टेक्स्ट का आकार समायोजित करें।',
    settings_text_size_normal: 'सामान्य (100%)',
    settings_text_size_large: 'बड़ा (115%)',
    settings_text_size_xlarge: 'अतिरिक्त बड़ा (130%)',
    settings_reduced_motion_label: 'कम गति (Reduced Motion)',
    settings_reduced_motion_desc: 'आंखों के आराम के लिए स्क्रीन एनिमेशन और बदलावों को कम करता है।',
    settings_low_bandwidth_label: 'कम डेटा मोड (Data Saver)',
    settings_low_bandwidth_desc: 'चित्रों को संकुचित करता है और ऑफ़लाइन डेटा को प्राथमिकता देता है।',
    settings_reset_accessibility: 'डिफ़ॉल्ट सेटिंग्स रीसेट करें',
    settings_notifications_section_title: 'सूचना प्राथमिकताएं',
    settings_notifications_section_subtitle: 'कार्य अलर्ट, बुकिंग अपडेट, और ध्वनि अलर्ट प्रबंधित करें।',
    settings_sound_alerts_label: 'ऑडियो ध्वनि अलर्ट',
    settings_sound_alerts_desc: 'नए बुकिंग अनुरोधों और स्थिति परिवर्तनों के लिए ध्वनि अलर्ट बजाएं।',
    settings_support_section_title: 'सहकारी सहायता और संपर्क',
    settings_support_section_subtitle: 'हमारी सहकारी सहायता टीम से संपर्क करें।',
    settings_support_email_label: 'ईमेल सहायता',
    settings_support_phone_label: 'हेल्पलाइन समय',
    settings_support_hours_label: 'सहायता समय',
    settings_support_hours_val: 'सोमवार – शनिवार, सुबह 9:00 – शाम 6:00 बजे IST',
    settings_legal_section_title: 'नीतियां और मंच की शर्तें',
    settings_legal_terms_title: 'सेवा की शर्तें और दिशानिर्देश',
    settings_legal_terms_desc: 'बुकिंग, सेवा समझौते और सीधे भुगतान उन्नती सहकारी दिशानिर्देशों और सेवा शर्तों द्वारा शासित होते हैं।',
    settings_legal_privacy_title: 'गोपनीयता और डेटा सुरक्षा नीति',
    settings_legal_privacy_desc: 'खाता विवरण और बुकिंग जानकारी सुरक्षित रखी जाती है और केवल प्रमाणीकरण व सेवा समन्वय के लिए उपयोग की जाती है।',

    // UNNATI Help / Chat
    help_button_label: 'उन्नती सहायता',
    help_modal_title: 'उन्नती सहायता',
    help_modal_subtitle: 'सेवाओं, बुकिंग, सीधे भुगतान और नीतियों के लिए ज्ञान-आधारित सहायता।',
    help_clear_history: 'चैट साफ़ करें',
    help_close: 'बंद करें',
    help_input_placeholder: 'सेवाएं, भुगतान, बुकिंग या रद्दीकरण के बारे में पूछें...',
    help_send_button: 'भेजें',
    help_empty_heading: 'आज उन्नती आपकी क्या सहायता कर सकती है?',
    help_empty_subtitle: 'त्वरित सत्यापित मार्गदर्शन के लिए नीचे दिए गए उदाहरण चुनें या अपना प्रश्न लिखें:',
    help_chip_services: 'उपलब्ध सेवाएं',
    help_chip_booking: 'बुकिंग कैसे करें',
    help_chip_payment: 'सीधा भुगतान',
    help_chip_wages: 'उचित मजदूरी मॉडल',
    help_chip_cancellation: 'रद्दीकरण नीति',
    help_chip_governance: 'सहकारी सिद्धांत',
    help_chip_safety: 'सुरक्षा और सत्यापन',
    help_verified_badge: 'सत्यापित उन्नती ज्ञान',
    help_advisory_badge: 'सहकारी मार्गदर्शन',
    help_unsupported_title: 'जानकारी उपलब्ध नहीं',
    help_error_length: 'प्रश्न 500 अक्षरों से कम होना चाहिए।',
    help_error_empty: 'कृपया एक प्रश्न दर्ज करें।',
    help_offline_notice: 'ऑफ़लाइन मोड में कैश्ड ज्ञानकोष के साथ काम कर रहा है।',
    help_contact_prompt: 'क्या आपको व्यक्तिगत सहायता चाहिए? support@unnati.coop या +91 79 4004 0404 पर संपर्क करें।'
  },

  mr: {
    // Navigation
    nav_home: 'मुख्यपृष्ठ',
    nav_services: 'सेवा',
    nav_transparency: 'पारदर्शकता केंद्र',
    nav_governance: 'प्रशासन',
    nav_dashboard: 'डॅशबोर्ड',
    nav_settings: 'सेटिंग्ज',
    nav_logout: 'लॉगआउट',
    nav_profile: 'प्रोफाइल सेटिंग्ज',
    nav_help: 'मदत',

    // Settings Page
    settings_page_title: 'प्लॅटफॉर्म सेटिंग्ज आणि प्राधान्ये',
    settings_page_subtitle: 'आपली भाषा, सुलभता (Accessibility), आणि सूचना प्राधान्ये नियंत्रित करा.',
    settings_back_to_dashboard: 'डॅशबोर्डवर परत जा',
    settings_save_success: 'प्राधान्ये यशस्वीरीत्या जतन केली!',
    settings_reset_success: 'सेटिंग्ज मूळ स्थितीत रीसेट केली.',
    settings_language_section_title: 'भाषा निवड (Language)',
    settings_language_section_subtitle: 'इंग्रजी ही मूळ भाषा आहे. स्पष्ट निवड केल्यावरच मराठी आणि हिंदी उपलब्ध होतात.',
    settings_language_en_desc: 'प्रमाणित प्लॅटफॉर्म भाषा (डिफॉल्ट)',
    settings_language_hi_desc: 'हिंदी भाषा इंटरफेस (निवडा)',
    settings_language_mr_desc: 'मराठी भाषा इंटरफेस (सक्रिय)',
    settings_language_explicit_note: 'भाषा केवळ आपल्या स्पष्ट निवडीनंतर बदलते आणि कोणत्याही स्वयंचलित बदलाशिवाय कायम राहते.',
    settings_accessibility_section_title: 'सुलभता आणि प्रदर्शन (Accessibility)',
    settings_accessibility_section_subtitle: 'आपल्या सोयीनुसार कॉन्ट्रास्ट, फॉन्ट आकार आणि ॲनिमेशन समायोजित करा.',
    settings_high_contrast_label: 'हाय कॉन्ट्रास्ट मोड',
    settings_high_contrast_desc: 'कमी दृष्टी असलेल्या वापरकर्त्यांसाठी स्पष्टता वाढवते.',
    settings_text_size_label: 'फॉन्ट आकार',
    settings_text_size_desc: 'डॅशबोर्ड आणि सारणीमधील मजकुराचा आकार वाढवा.',
    settings_text_size_normal: 'सामान्य (100%)',
    settings_text_size_large: 'मोठा (115%)',
    settings_text_size_xlarge: 'अति मोठा (130%)',
    settings_reduced_motion_label: 'कमी हालचाल (Reduced Motion)',
    settings_reduced_motion_desc: 'डोळ्यांच्या सोयीसाठी ॲनिमेशन कमी करते.',
    settings_low_bandwidth_label: 'डेटा बचत मोड (Data Saver)',
    settings_low_bandwidth_desc: 'इंटरनेट डेटा वाचवण्यासाठी प्रतिमा संकुचित करते.',
    settings_reset_accessibility: 'मूळ सुलभता सेटिंग्ज पुनर्संचयित करा',
    settings_notifications_section_title: 'सूचना प्राधान्ये',
    settings_notifications_section_subtitle: 'कामाच्या सूचना आणि ध्वनी अलर्ट नियंत्रित करा.',
    settings_sound_alerts_label: 'ध्वनी अलर्ट',
    settings_sound_alerts_desc: 'नवीन बुकिंग विनंत्यांसाठी ध्वनी वाजवा.',
    settings_support_section_title: 'सहकारी मदत आणि संपर्क',
    settings_support_section_subtitle: 'आमच्या सहकारी मदत केंद्राशी संपर्क साधा.',
    settings_support_email_label: 'ईमेल मदत',
    settings_support_phone_label: 'हेल्पलाइन वेळ',
    settings_support_hours_label: 'मदत वेळ',
    settings_support_hours_val: 'सोमवार ते शनिवार, सकाळी 9:00 ते संध्याकाळी 6:00 IST',
    settings_legal_section_title: 'नियम आणि मंच अटी',
    settings_legal_terms_title: 'सेवा अटी आणि मार्गदर्शक तत्त्वे',
    settings_legal_terms_desc: 'बुकिंग, सेवा करार आणि थेट व्यवहार उन्नती सहकारी मार्गदर्शक तत्त्वे आणि सेवा अटींनुसार चालतात.',
    settings_legal_privacy_title: 'गोपनीयता आणि माहिती सुरक्षा',
    settings_legal_privacy_desc: 'खाते तपशील आणि बुकिंग माहिती सुरक्षित ठेवली जाते आणि फक्त प्रमाणीकरण व सेवा समन्वयासाठी वापरली जाते.',

    // UNNATI Help / Chat
    help_button_label: 'उन्नती मदत',
    help_modal_title: 'उन्नती मदत',
    help_modal_subtitle: 'सेवा, बुकिंग, थेट पेमेंट आणि नियमांबद्दल ज्ञान-आधारित मदत.',
    help_clear_history: 'चॅट साफ करा',
    help_close: 'बंद करा',
    help_input_placeholder: 'सेवा, थेट पेमेंट किंवा बुकिंगबद्दल विचारा...',
    help_send_button: 'पाठवा',
    help_empty_heading: 'आज उन्नती आपल्याला कशी मदत करू शकते?',
    help_empty_subtitle: 'त्वरित मार्गदर्शनासाठी खालीलपैकी एक विषय निवडा किंवा आपला प्रश्न टाइप करा:',
    help_chip_services: 'उपलब्ध सेवा',
    help_chip_booking: 'बुकिंग कसे करावे',
    help_chip_payment: 'थेट पेमेंट',
    help_chip_wages: 'वाजवी दर मॉडेल',
    help_chip_cancellation: 'रद्द करण्याचे नियम',
    help_chip_governance: 'सहकारी तत्त्वे',
    help_chip_safety: 'सुरक्षा आणि पडताळणी',
    help_verified_badge: 'पडताळणीकृत उन्नती माहिती',
    help_advisory_badge: 'सहकारी मार्गदर्शन',
    help_unsupported_title: 'माहिती उपलब्ध नाही',
    help_error_length: 'प्रश्न 500 अक्षरांपेक्षा कमी असावा.',
    help_error_empty: 'कृपया एक प्रश्न प्रविष्ट करा.',
    help_offline_notice: 'ऑफलाइन मोडमध्ये माहिती दाखवली जात आहे.',
    help_contact_prompt: 'वैयक्तिक मदतीसाठी support@unnati.coop किंवा +91 79 4004 0404 वर संपर्क साधा.'
  }
};

/**
 * Safe translation resolver.
 * Looks up translation for target language, automatically falls back to English
 * if key is missing in target language.
 */
export function getTranslation(
  lang: SupportedLanguage,
  key: TranslationKey,
  params?: Record<string, string>
): string {
  const targetDict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let text = targetDict[key] || TRANSLATIONS.en[key] || String(key);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
  }

  return text;
}
