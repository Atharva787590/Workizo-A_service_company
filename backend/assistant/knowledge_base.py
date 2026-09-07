"""
UNNATI Canonical Knowledge Base
-------------------------------
Version-controlled, ground-truth documentation for the UNNATI Cooperative Platform.
Used by the grounded knowledge retrieval engine to answer customer and worker inquiries
using strictly factual, implemented platform records.
"""

from typing import Dict, List, Any

CANONICAL_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "id": "services_catalog",
        "category": "services",
        "title": "Available UNNATI Services",
        "keywords": [
            "service", "services", "electrician", "plumber", "carpenter",
            "cleaning", "cleaner", "ac technician", "ac repair", "mechanic",
            "appliance", "home repair", "craftsman", "artisan", "category", "categories",
            "सेवा", "सेवाएं", "इलेक्ट्रीशियन", "प्लंबर", "बढ़ई", "सफाई", "एसी", "मैकेनिक",
            "सुविधा", "सुविधाएं", "सेवा सूची"
        ],
        "content_en": (
            "UNNATI offers 6 cooperative service categories: Electrician, Plumber, "
            "Carpenter, AC Technician, Mechanic, and Home Cleaning. Service providers are "
            "verified cooperative members. Standard inspection rates are published in the service "
            "catalog, and any parts or materials are billed according to job requirements."
        ),
        "content_hi": (
            "उन्नती 6 सहकारी सेवा श्रेणियां प्रदान करता है: इलेक्ट्रीशियन, प्लंबर, बढ़ई, "
            "एसी तकनीशियन, मैकेनिक, और घर की सफाई। सेवा प्रदाता सत्यापित सहकारी सदस्य हैं। "
            "मानक निरीक्षण दरें सेवा सूची में दी गई हैं, और सामग्री का खर्च कार्य आवश्यकता के अनुसार होता है।"
        ),
        "content_mr": (
            "उन्नती 6 सहकारी सेवा श्रेणी उपलब्ध करते: इलेक्ट्रिशियन, प्लंबर, सुतार, "
            "एसी तंत्रज्ञ, मेकॅनिक, आणि घर स्वच्छता. सेवा प्रदाते पडताळणी केलेले सहकारी सदस्य आहेत. "
            "तपासणी दर सेवा सूचीमध्ये दिलेले आहेत आणि साहित्याचा खर्च गरजेनुसार आकारला जातो."
        ),
        "action_url": "/services",
        "action_label_en": "View Service Catalog",
        "action_label_hi": "सेवा सूची देखें",
        "action_label_mr": "सेवा सूची पहा",
        "suggested_chips_en": ["Electrician Services", "Plumber Services", "Service Rates"],
        "suggested_chips_hi": ["इलेक्ट्रीशियन सेवा", "प्लंबर सेवा", "सेवा दर"],
        "suggested_chips_mr": ["इलेक्ट्रिशियन सेवा", "प्लंबर सेवा", "सेवा दर"],
    },
    {
        "id": "booking_process",
        "category": "booking",
        "title": "How Booking Works",
        "keywords": [
            "book", "booking", "how to book", "schedule", "hire", "appointment",
            "request service", "customer booking", "order service", "how do i book",
            "बुकिंग", "बुक कैसे करें", "सेवा बुक", "सेवा कैसे बुक करें", "बुक", "ऑर्डर", "नियुक्ति",
            "नोंदणी", "कसे बुक करावे", "सेवा बुक करा", "बुक करा"
        ],
        "content_en": (
            "Booking a service on UNNATI takes 4 steps: 1) Select your service category. "
            "2) Choose your preferred date and time slot. 3) Enter your service location. "
            "4) Review the service estimate and confirm. You can monitor your booking "
            "status on the Booking Tracker screen."
        ),
        "content_hi": (
            "उन्नती पर सेवा बुक करना 4 चरणों में होता है: 1) अपनी सेवा श्रेणी चुनें। "
            "2) अपनी पसंदीदा तारीख और समय स्लॉट चुनें। 3) सेवा का पता दर्ज करें। "
            "4) सेवा अनुमान की समीक्षा करें और पुष्टि करें। आप बुकिंग ट्रैकर स्क्रीन पर "
            "बुकिंग स्थिति देख सकते हैं।"
        ),
        "content_mr": (
            "उन्नतीवर सेवा बुक करणे 4 चरणांमध्ये होते: 1) तुमची सेवा श्रेणी निवडा. "
            "2) तारीख आणि वेळ निवडा. 3) पत्ता टाका. "
            "4) सेवेचा अंदाज तपासा आणि पुष्टी करा. तुम्ही बुकिंग ट्रॅकरवर स्थिती पाहू शकता."
        ),
        "action_url": "/customer/book",
        "action_label_en": "Book a Service",
        "action_label_hi": "सेवा बुक करें",
        "action_label_mr": "सेवा बुक करा",
        "suggested_chips_en": ["Book Now", "Track Existing Booking", "Payment Options"],
        "suggested_chips_hi": ["अभी बुक करें", "बुकिंग ट्रैक करें", "भुगतान विकल्प"],
        "suggested_chips_mr": ["आता बुक करा", "बुकिंग ट्रॅक करा", "पेमेंट पर्याय"],
    },
    {
        "id": "worker_onboarding_process",
        "category": "worker",
        "title": "Worker Onboarding Process",
        "keywords": [
            "join as worker", "become a worker", "worker registration", "worker onboarding",
            "captain onboarding", "partner registration", "earn money", "technician job", "worker verification",
            "कारीगर", "कारीगर पंजीकरण", "कारीगर कैसे जुड़ें", "कारीगर कैसे जुड़ सकते हैं", "कारीगर के रूप में जुड़ें", "कामगार नोंदणी", "कारागीर व्हा", "कामाच्या संधी"
        ],
        "content_en": (
            "Service providers register through the Worker Portal by providing trade qualifications "
            "and identity documentation. Once reviewed and approved, providers can toggle their status "
            "to receive nearby booking requests. Earnings and cooperative allocations are recorded in the Worker Dashboard."
        ),
        "content_hi": (
            "सेवा प्रदाता कार्य कौशल और पहचान विवरण देकर वर्कर पोर्टल के माध्यम से पंजीकरण करते हैं। "
            "समीक्षा और अनुमोदन के बाद, वे आसपास के बुकिंग अनुरोध प्राप्त करने के लिए ऑनलाइन स्थिति चालू कर सकते हैं। "
            "कमाई और सहकारी आवंटन वर्कर डैशबोर्ड में दर्ज होते हैं।"
        ),
        "content_mr": (
            "सेवा प्रदाते कौशल्य आणि ओळख माहिती देऊन कामगार पोर्टलवर नोंदणी करतात. "
            "पडताळणीनंतर, ते जवळच्या बुकिंग विनंत्या मिळवण्यासाठी ऑनलाइन स्थिती सुरू करू शकतात. "
            "कमाई आणि सहकारी वाटप डॅशबोर्डवर नोंदवले जाते."
        ),
        "action_url": "/captain/login",
        "action_label_en": "Worker Portal",
        "action_label_hi": "वर्कर पोर्टल",
        "action_label_mr": "कामगार पोर्टल",
        "suggested_chips_en": ["Worker Registration", "Dashboard Access", "Earnings Overview"],
        "suggested_chips_hi": ["कारीगर पंजीकरण", "डैशबोर्ड लॉगिन", "कमाई विवरण"],
        "suggested_chips_mr": ["कामगार नोंदणी", "डॅशबोर्ड लॉगिन", "कमाई तपशील"],
    },
    {
        "id": "direct_payments",
        "category": "payments",
        "title": "Direct Payments & Transparent Pricing",
        "keywords": [
            "payment", "pay", "fee", "commission", "middleman", "upi", "cash",
            "direct payment", "zero commission", "0% commission", "0% platform commission", "razorpay", "qr code", "escrow", "cost", "pricing", "rate", "charges",
            "भुगतान", "पैसे", "कमीशन", "फीस", "दलाली", "यूपीआई", "कैश", "दर", "सीधा भुगतान",
            "पेमेंट", "पैसे देणे", "कमिशन", "शुल्क", "रोख", "थेट पेमेंट", "थेट"
        ],
        "content_en": (
            "UNNATI supports direct customer-to-provider settlements upon service completion using "
            "standard UPI or Cash payment. Platform service details and cooperative reserve allocations "
            "are presented transparently in the booking breakdown without commercial middleman fees."
        ),
        "content_hi": (
            "उन्नती सेवा पूरी होने पर मानक यूपीआई या नकद के माध्यम से ग्राहक और कारीगर के बीच सीधे भुगतान का समर्थन करती है। "
            "बुकिंग विवरण में सेवा शुल्क और सहकारी रिजर्व पारदर्शी रूप से दिखाए जाते हैं।"
        ),
        "content_mr": (
            "उन्नती काम पूर्ण झाल्यावर थेट यूपीआय किंवा रोखीने ग्राहक आणि कारागीर यांच्यातील थेट पेमेंटला समर्थन देते. "
            "बुकिंग तपशिलामध्ये सर्व दर आणि सहकारी राखीव निधी पारदर्शकपणे दाखवले जातात."
        ),
        "action_url": "/transparency",
        "action_label_en": "Transparency Hub",
        "action_label_hi": "पारदर्शिता केंद्र",
        "action_label_mr": "पारदर्शकता केंद्र",
        "suggested_chips_en": ["Payment Methods", "UPI Settlement", "Pricing Overview"],
        "suggested_chips_hi": ["भुगतान विधियां", "यूपीआई भुगतान", "दर अवलोकन"],
        "suggested_chips_mr": ["पेमेंट पद्धती", "यूपीआय पेमेंट", "दर माहिती"],
    },
    {
        "id": "cancellation_policy",
        "category": "cancellations",
        "title": "Cancellation and Rescheduling Policy",
        "keywords": [
            "cancel", "cancellation", "reschedule", "refund", "cancel booking", "cancelling",
            "change time", "compensation", "penalty",
            "रद्द", "कैंसिल", "रद्द करना", "समय बदलना", "मुआवजा", "रिफंड", "रद्दीकरण",
            "रद्द करणे", "बुकिंग रद्द", "वेळ बदलणे", "परतावा"
        ],
        "content_en": (
            "Bookings can be rescheduled or cancelled directly from the Booking Tracker or Customer Dashboard "
            "before service completion. Updated status is reflected immediately on your booking screen. "
            "For assistance with an active or dispatched booking, contact support."
        ),
        "content_hi": (
            "सेवा पूरी होने से पहले बुकिंग ट्रैकर या कस्टमर डैशबोर्ड से सीधे बुकिंग का समय बदला या रद्द किया जा सकता है। "
            "अद्यतन स्थिति आपकी स्क्रीन पर तुरंत दिखाई देती है। "
            "सक्रिय बुकिंग में सहायता के लिए सहायता डेस्क से संपर्क करें।"
        ),
        "content_mr": (
            "काम पूर्ण होण्यापूर्वी बुकिंग ट्रॅकर किंवा ग्राहक डॅशबोर्डवरून बुकिंग रद्द किंवा वेळ बदलता येते. "
            "नवीन स्थिती स्क्रीनवर लगेच दिसते. "
            "मदतीसाठी कृपया सपोर्टशी संपर्क साधा."
        ),
        "action_url": "/customer/dashboard",
        "action_label_en": "My Bookings",
        "action_label_hi": "मेरी बुकिंग्स",
        "action_label_mr": "माझी बुकिंग",
        "suggested_chips_en": ["Manage Bookings", "Reschedule Details", "Support Help"],
        "suggested_chips_hi": ["बुकिंग प्रबंधन", "समय परिवर्तन", "सहायता"],
        "suggested_chips_mr": ["बुकिंग व्यवस्थापन", "वेळ बदला", "मदत"],
    },
    {
        "id": "safety_and_verification",
        "category": "safety",
        "title": "Safety & Service Verification",
        "keywords": [
            "safety", "trust", "verification", "verified", "vetting", "vetted", "secure", "background check",
            "emergency", "police", "sos", "otp", "pin", "id proof",
            "सुरक्षा", "भरोसा", "सत्यापन", "आपातकालीन", "ओटीपी", "पिन", "पहचान",
            "सुरक्षा", "विश्वास", "पडताळणी", "आपत्कालीन", "पिन"
        ],
        "content_en": (
            "UNNATI incorporates account authentication, service verification, and mutual booking tracking. "
            "Service providers complete trade qualification checks and onboarding review. "
            "Arrival PIN verification is used during service handoff to confirm the assigned provider."
        ),
        "content_hi": (
            "उन्नती खाता प्रमाणीकरण, सेवा सत्यापन और पारस्परिक बुकिंग ट्रैकिंग की सुविधा देती है। "
            "सेवा प्रदाता कार्य योग्यता समीक्षा पूरी करते हैं। "
            "सेवा शुरू करने से पहले सही प्रदाता की पुष्टि के लिए अराइवल पिन सत्यापन का उपयोग किया जाता है।"
        ),
        "content_mr": (
            "उन्नती खाते प्रमाणीकरण, सेवा पडताळणी आणि बुकिंग ट्रॅकिंग प्रदान करते. "
            "सेवा प्रदाते कौशल्य तपासणी पूर्ण करतात. "
            "काम सुरू करण्यापूर्वी अरायव्हल पिन पडताळणी केली जाते."
        ),
        "action_url": "/transparency",
        "action_label_en": "Verification Standards",
        "action_label_hi": "सत्यापन मानक",
        "action_label_mr": "पडताळणी मानके",
        "suggested_chips_en": ["Arrival PIN", "Provider Verification", "Booking Safety"],
        "suggested_chips_hi": ["अराइवल पिन", "प्रदाता सत्यापन", "बुकिंग सुरक्षा"],
        "suggested_chips_mr": ["अरायव्हल पिन", "प्रदाता पडताळणी", "बुकिंग सुरक्षा"],
    },
    {
        "id": "cooperative_principles_governance",
        "category": "cooperative",
        "title": "Cooperative Model & Governance",
        "keywords": [
            "cooperative", "governance", "democracy", "vote", "patronage", "dividend",
            "ica principles", "surplus", "owner", "co-owner", "assembly", "election",
            "सहकारी", "प्रशासन", "लोकतंत्र", "मतदान", "लाभांश", "मुनाफा", "मालिक", "चुनाव",
            "सहकारी संस्था", "लोकशाही", "मतदान", "लाभांश", "निवडणूक"
        ],
        "content_en": (
            "UNNATI is designed on cooperative principles where registered worker-members "
            "participate in platform governance and collective decision-making. "
            "Cooperative resolutions, policies, and platform reserve allocations are reviewed "
            "through the Governance dashboard."
        ),
        "content_hi": (
            "उन्नती सहकारी सिद्धांतों पर आधारित है जहाँ पंजीकृत कामगार-सदस्य मंच प्रशासन "
            "और सामूहिक निर्णयों में भाग लेते हैं। "
            "सहकारी प्रस्तावों और नीतियों की समीक्षा गवर्नेंस डैशबोर्ड के माध्यम से की जाती है।"
        ),
        "content_mr": (
            "उन्नती सहकारी तत्त्वांवर आधारित आहे जिथे कामगार सदस्य कारभारात सहभागी होतात. "
            "सहकारी ठराव आणि नियमांचा आढावा गव्हर्नन्स डॅशबोर्डद्वारे घेतला जातो."
        ),
        "action_url": "/governance",
        "action_label_en": "Governance Hub",
        "action_label_hi": "प्रशासन केंद्र",
        "action_label_mr": "प्रशासन केंद्र",
        "suggested_chips_en": ["Governance Overview", "Member Resolutions", "Cooperative Model"],
        "suggested_chips_hi": ["प्रशासन अवलोकन", "सदस्य प्रस्ताव", "सहकारी मॉडल"],
        "suggested_chips_mr": ["प्रशासन माहिती", "सदस्य ठराव", "सहकारी मॉडेल"],
    },
    {
        "id": "ratings_and_disputes",
        "category": "ratings",
        "title": "Ratings, Feedback & Inquiries",
        "keywords": [
            "rating", "review", "feedback", "stars", "dispute", "unfair review",
            "appeal", "peer review", "complaint",
            "रेटिंग", "समीक्षा", "फीडबैक", "विवाद", "झूठी रेटिंग", "अपील", "शिकायत",
            "रेटिंग", "अभिप्राय", "तक्रार", "अपील", "वाद निवारण"
        ],
        "content_en": (
            "UNNATI provides a mutual review system where customers and service providers share "
            "feedback on completed jobs. Review scores help maintain service quality. "
            "Questions or dispute inquiries can be raised through the support channels."
        ),
        "content_hi": (
            "उन्नती पारस्परिक समीक्षा प्रणाली प्रदान करती है जहाँ ग्राहक और सेवा प्रदाता पूर्ण हुए कार्यों पर फीडबैक देते हैं। "
            "समीक्षाएं सेवा गुणवत्ता बनाए रखने में मदद करती हैं। "
            "किसी भी विवाद या प्रश्न के लिए सहायता चैनल से संपर्क किया जा सकता है।"
        ),
        "content_mr": (
            "उन्नती परस्पर पुनरावलोकन पद्धत प्रदान करते जिथे ग्राहक आणि कारागीर अभिप्राय नोंदवतात. "
            "यामुळे सेवेचा दर्जा राखला जातो. "
            "तक्रार किंवा चौकशीसाठी सपोर्टशी संपर्क करता येतो."
        ),
        "action_url": "/governance",
        "action_label_en": "Governance & Feedback",
        "action_label_hi": "प्रशासन और फीडबैक",
        "action_label_mr": "प्रशासन आणि अभिप्राय",
        "suggested_chips_en": ["Ratings Overview", "Submit Feedback", "Dispute Inquiry"],
        "suggested_chips_hi": ["रेटिंग अवलोकन", "फीडबैक दें", "विवाद पूछताछ"],
        "suggested_chips_mr": ["रेटिंग माहिती", "अभिप्राय द्या", "तक्रार चौकशी"],
    },
    {
        "id": "support_and_contact",
        "category": "support",
        "title": "Contact UNNATI Support",
        "keywords": [
            "support", "contact", "help", "phone", "email", "helpline", "customer care",
            "office", "hours", "assistance",
            "सहायता", "संपर्क", "फोन", "ईमेल", "हेल्पलाइन", "कस्टमर केयर", "मदद",
            "मदत", "संपर्क", "फोन नंबर", "ईमेल", "हेल्पलाईन"
        ],
        "content_en": (
            "For assistance with bookings, platform features, or account questions, "
            "contact the support team via email at support@unnati.coop or consult the "
            "UNNATI Help section in Settings."
        ),
        "content_hi": (
            "बुकिंग, मंच सुविधाओं या खाते से जुड़े प्रश्नों में सहायता के लिए, "
            "ईमेल support@unnati.coop के माध्यम से सहायता टीम से संपर्क करें या सेटिंग्स में उन्नती सहायता अनुभाग देखें।"
        ),
        "content_mr": (
            "बुकिंग किंवा खात्याशी संबंधित प्रश्नांसाठी, "
            "support@unnati.coop वर ईमेलद्वारे संपर्क साधा किंवा सेटिंग्जमधील उन्नती मदत विभाग पहा."
        ),
        "action_url": "/settings",
        "action_label_en": "Settings & Support",
        "action_label_hi": "सेटिंग्स और सहायता",
        "action_label_mr": "सेटिंग्ज आणि मदत",
        "suggested_chips_en": ["Email Support", "Help & FAQ", "Account Settings"],
        "suggested_chips_hi": ["ईमेल सहायता", "मदद और अक्सर पूछे जाने वाले सवाल", "खाता सेटिंग्स"],
        "suggested_chips_mr": ["ईमेल मदत", "मदत आणि माहिती", "खाते सेटिंग्ज"],
    },
]

SAFE_UNSUPPORTED_FALLBACK: Dict[str, str] = {
    "en": (
        "I don't have verified information about that topic in the UNNATI knowledge base. "
        "To ensure accuracy and prevent incorrect guidance, please visit the Help & Support section "
        "in Settings or contact support@unnati.coop."
    ),
    "hi": (
        "उन्नती ज्ञानकोष में इस विषय पर कोई सत्यापित जानकारी उपलब्ध नहीं है। "
        "सटीक जानकारी के लिए और गलत मार्गदर्शन से बचने के लिए, कृपया सेटिंग्स में सहायता अनुभाग देखें "
        "या support@unnati.coop पर संपर्क करें।"
    ),
    "mr": (
        "उन्नती माहिती पुस्तिकेत या विषयाबद्दल पडताळणी केलेली माहिती उपलब्ध नाही. "
        "अचूक माहितीसाठी, कृपया सेटिंग्जमधील मदत विभागाला भेट द्या "
        "किंवा support@unnati.coop वर संपर्क साधा."
    ),
}
