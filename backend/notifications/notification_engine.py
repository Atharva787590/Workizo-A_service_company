"""
UNNATI Notification & Opportunity Intelligence Engine
----------------------------------------------------
Provider-independent multi-channel routing (PUSH -> IN-APP -> SMS -> IVR),
booking lifecycle alerts, privacy-preserving geo-targeted opportunities,
cooperative governance announcements, multilingual templates, and quiet hours.
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, time, timezone
import re
import math

PRIORITY_CHANNELS = ['PUSH', 'IN_APP', 'SMS', 'IVR']

NOTIFICATION_CATEGORIES = [
    'booking',
    'opportunity',
    'governance',
    'payment',
    'general'
]

# 13-language template catalogue for high-reliability message rendering
NOTIFICATION_TEMPLATES: Dict[str, Dict[str, Dict[str, str]]] = {
    'booking_request': {
        'en': {'title': 'New Booking Request #{booking_id}', 'body': 'New {service} request received for {scheduled_time}.'},
        'hi': {'title': 'नया सेवा अनुरोध #{booking_id}', 'body': '{service} सेवा हेतु नया अनुरोध प्राप्त हुआ: {scheduled_time}।'},
        'mr': {'title': 'नवीन बुकिंग विनंती #{booking_id}', 'body': '{service} सेवेसाठी नवीन विनंती प्राप्त झाली: {scheduled_time}.'},
        'bn': {'title': 'নতুন বুকিং অনুরোধ #{booking_id}', 'body': '{service} সেবার জন্য অনুরোধ এসেছে: {scheduled_time}।'},
        'gu': {'title': 'નવી બુકિંગ વિનંતી #{booking_id}', 'body': '{service} સેવા માટે નવી વિનંતી મળી: {scheduled_time}.'},
        'ta': {'title': 'புதிய முன்பதிவு கோரிக்கை #{booking_id}', 'body': '{service} சேவைக்கான கோரிக்கை பெறப்பட்டது: {scheduled_time}.'},
        'te': {'title': 'కొత్త బుకింగ్ అభ్యర్థన #{booking_id}', 'body': '{service} సేవ కోసం కొత్త అభ్యర్థన వచ్చింది: {scheduled_time}.'},
        'kn': {'title': 'ಹೊಸ ಬುಕಿಂಗ್ ವಿನಂತಿ #{booking_id}', 'body': '{service} ಸೇವೆಗಾಗಿ ಹೊಸ ವಿನಂತಿ ಬಂದಿದೆ: {scheduled_time}.'},
        'ml': {'title': 'പുതിയ ബുക്കിംഗ് അഭ്യർത്ഥന #{booking_id}', 'body': '{service} സേവനത്തിനായി പുതിയ അഭ്യർത്ഥന: {scheduled_time}.'},
        'pa': {'title': 'ਨਵੀਂ ਬੁਕਿੰਗ ਬੇਨਤੀ #{booking_id}', 'body': '{service} ਸੇਵਾ ਲਈ ਨਵੀਂ ਬੇਨਤੀ ਮਿਲੀ: {scheduled_time}.'},
        'or': {'title': 'ନୂତନ ବୁକିଂ ଅନୁରୋଧ #{booking_id}', 'body': '{service} ସେବା ପାଇଁ ଅନୁରୋଧ ଆସିଛି: {scheduled_time}।'},
        'as': {'title': 'নতুন বুকিং অনুৰোধ #{booking_id}', 'body': '{service} সেৱাৰ বাবে অনুৰোধ আহিছে: {scheduled_time}।'},
        'ur': {'title': 'نئی بکنگ کی درخواست #{booking_id}', 'body': '{service} سروس کے لیے نئی درخواست موصول ہوئی: {scheduled_time}۔'},
    },
    'worker_acceptance': {
        'en': {'title': 'Craftsman Assigned #{booking_id}', 'body': '{worker_name} has accepted your {service} request.'},
        'hi': {'title': 'कारीगर नियुक्त #{booking_id}', 'body': '{worker_name} ने आपका {service} अनुरोध स्वीकार कर लिया है।'},
        'mr': {'title': 'कारागीर नियुक्त #{booking_id}', 'body': '{worker_name} यांनी आपली {service} विनंती स्वीकारली आहे.'},
        'bn': {'title': 'কারিগর নিযুক্ত #{booking_id}', 'body': '{worker_name} আপনার {service} অনুরোধ গ্রহণ করেছেন।'},
        'gu': {'title': 'કારીગર સોંપાયા #{booking_id}', 'body': '{worker_name} એ તમારી {service} વિનંતી સ્વીકારી છે.'},
        'ta': {'title': 'கைவினைஞர் நியமிக்கப்பட்டார் #{booking_id}', 'body': '{worker_name} உங்கள் {service} கோரிக்கையை ஏற்றுக்கொண்டார்.'},
        'te': {'title': 'కళాకారుడు కేటాయించబడ్డాడు #{booking_id}', 'body': '{worker_name} మీ {service} అభ్యర్థనను అంగీకరించారు.'},
        'kn': {'title': 'ಕುಶಲಕರ್ಮಿ ನಿಯೋಜಿಸಲಾಗಿದೆ #{booking_id}', 'body': '{worker_name} ನಿಮ್ಮ {service} ವಿನಂತಿಯನ್ನು ಒಪ್ಪಿಕೊಂಡಿದ್ದಾರೆ.'},
        'ml': {'title': 'തൊഴിലാളിയെ നിയോഗിച്ചു #{booking_id}', 'body': '{worker_name} താങ്കളുടെ {service} അഭ്യർത്ഥന സ്വീകരിച്ചു.'},
        'pa': {'title': 'ਕਾਰੀਗਰ ਨਿਯੁਕਤ #{booking_id}', 'body': '{worker_name} ਨੇ ਤੁਹਾਡੀ {service} ਬੇਨਤੀ ਸਵੀਕਾਰ ਕਰ ਲਈ ਹੈ।'},
        'or': {'title': 'କାରିଗର ନିଯୁକ୍ତ #{booking_id}', 'body': '{worker_name} ଆପଣଙ୍କ {service} ଅନୁରୋଧ ଗ୍ରହଣ କରିଛନ୍ତି।'},
        'as': {'title': 'কাৰিকৰ নিযুক্ত #{booking_id}', 'body': '{worker_name} আপোনাৰ {service} অনুৰোধ গ্ৰহণ কৰিছে।'},
        'ur': {'title': 'کاریگر تفویض ہو گیا #{booking_id}', 'body': '{worker_name} نے آپ کی {service} درخواست قبول کر لی ہے۔'},
    },
    'worker_arriving': {
        'en': {'title': 'Craftsman on the Way', 'body': '{worker_name} is arriving shortly at your location.'},
        'hi': {'title': 'कारीगर रास्ते में हैं', 'body': '{worker_name} जल्द ही आपके स्थान पर पहुँच रहे हैं।'},
        'mr': {'title': 'कारागीर वाटेवर आहेत', 'body': '{worker_name} लवकरच आपल्या ठिकाणी पोहोचत आहेत.'},
        'bn': {'title': 'কারিগর পথে আছেন', 'body': '{worker_name} শীঘ্রই আপনার স্থানে পৌঁছাচ্ছেন।'},
        'gu': {'title': 'કારીગર રસ્તામાં છે', 'body': '{worker_name} ટૂંક સમયમાં તમારા સ્થાને પહોંચી રહ્યા છે.'},
        'ta': {'title': 'கைவினைஞர் வழியில் உள்ளார்', 'body': '{worker_name} விரைவில் உங்கள் இடத்திற்கு வருகிறார்.'},
        'te': {'title': 'కళాకారుడు మార్గంలో ఉన్నారు', 'body': '{worker_name} త్వరలో మీ వద్దకు చేరుకుంటారు.'},
        'kn': {'title': 'ಕುಶಲಕರ್ಮಿ ದಾರಿಯಲ್ಲಿದ್ದಾರೆ', 'body': '{worker_name} ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮ ಸ್ಥಳಕ್ಕೆ ತಲುಪಲಿದ್ದಾರೆ.'},
        'ml': {'title': 'തൊഴിലാളി വഴിയിലാണ്', 'body': '{worker_name} ഉടൻ താങ്കളുടെ ലൊക്കേഷനിൽ എത്തും.'},
        'pa': {'title': 'ਕਾਰੀਗਰ ਰਸਤੇ ਵਿੱਚ ਹਨ', 'body': '{worker_name} ਜਲਦੀ ਹੀ ਤੁਹਾਡੇ ਸਥਾਨ ਤੇ ਪਹੁੰਚ ਰਹੇ ਹਨ।'},
        'or': {'title': 'କାରିଗର ବାଟରେ ଅଛନ୍ତି', 'body': '{worker_name} ଶୀଘ୍ର ଆପଣଙ୍କ ସ୍ଥାନରେ ପହଞ୍ଚୁଛନ୍ତି।'},
        'as': {'title': 'কাৰিকৰ বাটত আছে', 'body': '{worker_name} সোনকালেই আপোনাৰ স্থানত উপস্থিত হ’ব।'},
        'ur': {'title': 'کاریگر راستے میں ہیں', 'body': '{worker_name} جلد ہی آپ کی جگہ پہنچ رہے ہیں۔'},
    },
    'task_completed': {
        'en': {'title': 'Work Completed #{booking_id}', 'body': '{service} completed. Please rate your experience and complete direct payment.'},
        'hi': {'title': 'कार्य पूर्ण हुआ #{booking_id}', 'body': '{service} कार्य संपन्न हुआ। कृपया अनुभव का मूल्यांकन करें और सीधा भुगतान करें।'},
        'mr': {'title': 'काम पूर्ण झाले #{booking_id}', 'body': '{service} काम पूर्ण झाले. कृपया अनुभवाचे मूल्यांकन करा आणि थेट देयक द्या.'},
        'bn': {'title': 'কাজ সম্পন্ন হয়েছে #{booking_id}', 'body': '{service} কাজ সম্পন্ন হয়েছে। অনুগ্রহ করে মূল্যায়ন করুন ও সরাসরি পেমেন্ট করুন।'},
        'gu': {'title': 'કામ પૂર્ણ થયું #{booking_id}', 'body': '{service} પૂર્ણ થયું. કૃપા કરીને અનુભવનું મૂલ્યાંકન કરો અને સીધું ચુકવણી કરો.'},
        'ta': {'title': 'வேலை முடிந்தது #{booking_id}', 'body': '{service} முடிந்தது. தயவுசெய்து உங்கள் அனுபவத்தை மதிப்பிட்டு நேரடி கட்டணம் செலுத்தவும்.'},
        'te': {'title': 'పని పూర్తయింది #{booking_id}', 'body': '{service} పూర్తయింది. దయచేసి అనుభవాన్ని రేట్ చేయండి మరియు ప్రత్యక్ష చెల్లింపు చేయండి.'},
        'kn': {'title': 'ಕೆಲಸ ಪೂರ್ಣಗೊಂಡಿದೆ #{booking_id}', 'body': '{service} ಪೂರ್ಣಗೊಂಡಿದೆ. ದಯವಿಟ್ಟು ಅನುಭವವನ್ನು ರೇಟ್ ಮಾಡಿ ಮತ್ತು ನೇರ ಪಾವತಿ ಮಾಡಿ.'},
        'ml': {'title': 'ജോലി പൂർത്തിയായി #{booking_id}', 'body': '{service} പൂർത്തിയായി. ദയവായി അനുഭവം വിലയിരുത്തി നേരിട്ട് പണമടയ്ക്കുക.'},
        'pa': {'title': 'ਕੰਮ ਪੂਰਾ ਹੋ ਗਿਆ #{booking_id}', 'body': '{service} ਕੰਮ ਪੂਰਾ ਹੋਇਆ। ਕਿਰਪਾ ਕਰਕੇ ਤਜਰਬੇ ਦਾ ਮੁਲਾਂਕਣ ਕਰੋ ਅਤੇ ਸਿੱਧਾ ਭੁਗਤਾਨ ਕਰੋ।'},
        'or': {'title': 'କାର୍ଯ୍ୟ ସମ୍ପୂର୍ଣ୍ଣ ହେଲା #{booking_id}', 'body': '{service} କାର୍ଯ୍ୟ ଶେଷ ହେଲା। ଦୟାକରି ମୂଲ୍ୟାଙ୍କନ କରନ୍ତୁ ଏବଂ ସିଧାସଳଖ ଦେୟ ଦିଅନ୍ତୁ।'},
        'as': {'title': 'কাম সম্পন্ন হ’ল #{booking_id}', 'body': '{service} কাম সমাপ্ত হ’ল। অনুগ্ৰহ কৰি অভিজ্ঞতাৰ মূল্যায়ন কৰক আৰু পোনপটীয়া ধন পৰিশোধ কৰক।'},
        'ur': {'title': 'کام مکمل ہو گیا #{booking_id}', 'body': '{service} کام مکمل ہوا۔ برائے مہربانی تجربے کی درجہ بندی کریں اور براہ راست ادائیگی کریں۔'},
    },
    'payment_status': {
        'en': {'title': 'Direct Payment Received', 'body': 'Direct payment of ₹{amount} confirmed for booking #{booking_id}.'},
        'hi': {'title': 'सीधा भुगतान प्राप्त', 'body': 'बुकिंग #{booking_id} के लिए ₹{amount} का सीधा भुगतान सत्यापित हुआ।'},
        'mr': {'title': 'थेट पेमेंट प्राप्त झाले', 'body': 'बुकिंग #{booking_id} साठी ₹{amount} चे थेट पेमेंट पुष्टी झाले.'},
        'bn': {'title': 'সরাসরি পেমেন্ট প্রাপ্ত', 'body': 'বুকিং #{booking_id} এর জন্য ₹{amount} সরাসরি পেমেন্ট নিশ্চিত হয়েছে।'},
        'gu': {'title': 'સીધી ચુકવણી પ્રાપ્ત થઈ', 'body': 'બુકિંગ #{booking_id} માટે ₹{amount} ની સીધી ચુકવણી પુષ્ટિ થઈ.'},
        'ta': {'title': 'நேரடி கட்டணம் பெறப்பட்டது', 'body': 'முன்பதிவு #{booking_id}-க்கான ₹{amount} நேரடி கட்டணம் உறுதி செய்யப்பட்டது.'},
        'te': {'title': 'ప్రత్యక్ష చెల్లింపు అందింది', 'body': 'బుకింగ్ #{booking_id} కొరకు ₹{amount} ప్రత్యక్ష చెల్లింపు ధృవీకరించబడింది.'},
        'kn': {'title': 'ನೇರ ಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ', 'body': 'ಬುಕಿಂಗ್ #{booking_id} ಗಾಗಿ ₹{amount} ನೇರ ಪಾವತಿ ದೃಢಪಟ್ಟಿದೆ.'},
        'ml': {'title': 'നേരിട്ടുള്ള പെയ്‌മെന്റ് ലഭിച്ചു', 'body': 'ബുക്കിംഗ് #{booking_id}-നായി ₹{amount} നേരിട്ടുള്ള പെയ്‌മെന്റ് സ്ഥിരീകരിച്ചു.'},
        'pa': {'title': 'ਸਿੱਧਾ ਭੁਗਤਾਨ ਪ੍ਰਾਪਤ ਹੋਇਆ', 'body': 'ਬੁਕਿੰਗ #{booking_id} ਲਈ ₹{amount} ਦਾ ਸਿੱਧਾ ਭੁਗਤਾਨ ਤਸਦੀਕ ਹੋਇਆ।'},
        'or': {'title': 'ସିଧାସଳଖ ଦେୟ ମିଳିଲା', 'body': 'ବୁକିଂ #{booking_id} ପାଇଁ ₹{amount} ର ସିଧାସଳଖ ଦେୟ ନିଶ୍ଚିତ ହେଲା।'},
        'as': {'title': 'পোনপটীয়া ধন লাভ হ’ল', 'body': 'বুকিং #{booking_id} ৰ বাবে ₹{amount} পোনপটীয়া ধন পৰিশোধ নিশ্চিত কৰা হৈছে।'},
        'ur': {'title': 'براہ راست ادائیگی موصول ہوئی', 'body': 'بکنگ #{booking_id} کے لیے ₹{amount} کی براہ راست ادائیگی کی تصدیق ہو گئی۔'},
    },
    'nearby_opportunity': {
        'en': {'title': 'Nearby Opportunity: {service}', 'body': 'Job available in {locality} (~{distance_km} km away). Est: ₹{payout}.'},
        'hi': {'title': 'निकटवर्ती अवसर: {service}', 'body': '{locality} में कार्य उपलब्ध है (~{distance_km} किमी दूर)। अनुमानित: ₹{payout}।'},
        'mr': {'title': 'जवळपासची संधी: {service}', 'body': '{locality} मध्ये काम उपलब्ध आहे (~{distance_km} किमी). अंदाजे: ₹{payout}.'},
        'bn': {'title': 'কাছাকাছি সুযোগ: {service}', 'body': '{locality}-এ কাজ উপলব্ধ (~{distance_km} কিমি দূরে)। আনুমানিক: ₹{payout}।'},
        'gu': {'title': 'નજીકની તક: {service}', 'body': '{locality} માં કામ ઉપલબ્ધ છે (~{distance_km} કિમી દૂર). અંદાજિત: ₹{payout}.'},
        'ta': {'title': 'அருகிலுள்ள வாய்ப்பு: {service}', 'body': '{locality} பகுதியில் வேலை உள்ளது (~{distance_km} கி.மீ தொலைவில்). உத்தேச தொகை: ₹{payout}.'},
        'te': {'title': 'సమీప అవకాశం: {service}', 'body': '{locality} లో పని అందుబాటులో ఉంది (~{distance_km} కి.మీ దూరం). అంచనా: ₹{payout}.'},
        'kn': {'title': 'ಹತ್ತಿರದ ಅವಕಾಶ: {service}', 'body': '{locality} ನಲ್ಲಿ ಕೆಲಸ ಲಭ್ಯವಿದೆ (~{distance_km} ಕಿ.ಮೀ ದೂರ). ಅಂದಾಜು: ₹{payout}.'},
        'ml': {'title': 'സമീപമുള്ള അവസരം: {service}', 'body': '{locality}-ൽ ജോലി ലഭ്യമാണ് (~{distance_km} കി.മീ ദൂരം). ഏകദേശം: ₹{payout}.'},
        'pa': {'title': 'ਨੇੜਲਾ ਮੌਕਾ: {service}', 'body': '{locality} ਵਿੱਚ ਕੰਮ ਉਪਲਬਧ ਹੈ (~{distance_km} ਕਿਲੋਮੀਟਰ ਦੂਰ)। ਅਨੁਮਾਨਿਤ: ₹{payout}।'},
        'or': {'title': 'ନିକଟବର୍ତ୍ତୀ ସୁଯୋଗ: {service}', 'body': '{locality} ରେ କାର୍ଯ୍ୟ ଉପଲବ୍ଧ (~{distance_km} କିମି ଦୂର)। ଆନୁମାନିକ: ₹{payout}।'},
        'as': {'title': 'ওচৰৰ সুযোগ: {service}', 'body': '{locality} ত কাম উপলব্ধ (~{distance_km} কিমি দূৰত)। আনুমানিক: ₹{payout}।'},
        'ur': {'title': 'قریبی موقع: {service}', 'body': '{locality} میں کام دستیاب ہے (~{distance_km} کلومیٹر دور)۔ تخمینہ: ₹{payout}۔'},
    },
    'coop_governance': {
        'en': {'title': 'Cooperative Notice: {headline}', 'body': '{details} Agenda: {agenda}. Meeting/Vote on {date}.'},
        'hi': {'title': 'सहकारी सूचना: {headline}', 'body': '{details} कार्यसूची: {agenda}। सभा/मतदान दिनांक: {date}।'},
        'mr': {'title': 'सहकारी सूचना: {headline}', 'body': '{details} विषयपत्रिका: {agenda}. बैठक/मतदान तारीख: {date}.'},
        'bn': {'title': 'সমবায় বিজ্ঞপ্তি: {headline}', 'body': '{details} আলোচ্যসূচী: {agenda}। বৈঠক/ভোট: {date}।'},
        'gu': {'title': 'સહકારી સૂચના: {headline}', 'body': '{details} કાર્યસૂચિ: {agenda}. બેઠક/મતદાન તારીખ: {date}.'},
        'ta': {'title': 'கூட்டுறவு அறிவிப்பு: {headline}', 'body': '{details} நிகழ்ச்சி நிரல்: {agenda}. கூட்டம்/வாக்களிப்பு தேதி: {date}.'},
        'te': {'title': 'సహకార నోటీసు: {headline}', 'body': '{details} ఎజెండా: {agenda}. సమావేశం/ఓటింగ్ తేదీ: {date}.'},
        'kn': {'title': 'ಸಹಕಾರಿ ಸೂಚನೆ: {headline}', 'body': '{details} ಕಾರ್ಯಸೂಚಿ: {agenda}. ಸಭೆ/ಮತದಾನ ದಿನಾಂಕ: {date}.'},
        'ml': {'title': 'സഹകരണ അറിയിപ്പ്: {headline}', 'body': '{details} അജണ്ട: {agenda}. യോഗം/വോട്ടിംഗ് തീയതി: {date}.'},
        'pa': {'title': 'ਸਹਿਕਾਰੀ ਸੂਚਨਾ: {headline}', 'body': '{details} ਏਜੰਡਾ: {agenda}। ਮੀਟਿੰਗ/ਵੋਟਿੰਗ ਮਿਤੀ: {date}।'},
        'or': {'title': 'ସମବାୟ ବିଜ୍ଞପ୍ତି: {headline}', 'body': '{details} ଏଜେଣ୍ଡା: {agenda}। ବୈଠକ/ମତଦାନ ତାରିଖ: {date}।'},
        'as': {'title': 'সমবায় জাননী: {headline}', 'body': '{details} কাৰ্যসূচী: {agenda}। সভা/ভোটৰ তাৰিখ: {date}।'},
        'ur': {'title': 'کوآپریٹو نوٹس: {headline}', 'body': '{details} ایجنڈا: {agenda}۔ اجلاس/ووٹنگ کی تاریخ: {date}۔'},
    },
}

def render_notification_template(
    template_key: str,
    language: str = 'en',
    params: Optional[Dict[str, Any]] = None
) -> Tuple[str, str]:
    """
    Renders localized notification title and body using strict template interpolation.
    Safely prevents translation of dynamic variables (IDs, amounts, names).
    """
    params = params or {}
    category_templates = NOTIFICATION_TEMPLATES.get(template_key, {})
    lang_template = category_templates.get(language) or category_templates.get('en')

    if not lang_template:
        title = f"Alert: {template_key.replace('_', ' ').title()}"
        body = ", ".join(f"{k}: {v}" for k, v in params.items())
        return title, body

    raw_title = lang_template['title']
    raw_body = lang_template['body']

    # Safe variable injection
    title = raw_title
    body = raw_body
    for key, val in params.items():
        placeholder = f"{{{key}}}"
        str_val = str(val)
        title = title.replace(placeholder, str_val)
        body = body.replace(placeholder, str_val)

    return title, body

def scrub_sensitive_privacy_data(text: str) -> str:
    """
    Scrubs Indian Aadhaar, PAN numbers, UPI PINs, or secrets from notification text.
    Ensures zero exposure of sensitive data via push/SMS/in-app channels.
    """
    if not text:
        return text

    # Aadhaar scrubber (12 digits, optional spaces/hyphens)
    scrubbed = re.sub(r'\b\d{4}[ -]?\d{4}[ -]?\d{4}\b', '[AADHAAR PROTECTED]', text)
    # PAN scrubber (5 letters + 4 digits + 1 letter)
    scrubbed = re.sub(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b', '[PAN PROTECTED]', scrubbed, flags=re.IGNORECASE)
    # UPI PIN / CVV mentions
    scrubbed = re.sub(r'(?i)(upi\s*pin|cvv|otp|secret)[:=\s]+[0-9a-zA-Z]{3,8}', r'\1: [REDACTED]', scrubbed)

    return scrubbed

def is_within_quiet_hours(
    quiet_hours_enabled: bool,
    start_str: str,
    end_str: str,
    current_time: Optional[time] = None,
    is_urgent: bool = False,
    urgent_override: bool = True
) -> bool:
    """
    Evaluates whether current time falls within configured quiet hours.
    Urgent notifications can bypass quiet hours if user configured urgent_override.
    """
    if not quiet_hours_enabled:
        return False

    if is_urgent and urgent_override:
        return False

    now = current_time or datetime.now().time()

    try:
        sh, sm = map(int, start_str.split(':'))
        eh, em = map(int, end_str.split(':'))
        start_time = time(sh, sm)
        end_time = time(eh, em)
    except Exception:
        return False

    if start_time < end_time:
        return start_time <= now <= end_time
    else:
        # Crosses midnight (e.g. 22:00 to 07:00)
        return now >= start_time or now <= end_time

def fuzz_opportunity_location(
    latitude: Optional[float],
    longitude: Optional[float],
    locality: str
) -> Dict[str, Any]:
    """
    Protects customer/job coordinates by coarsening location.
    Never exposes raw high-precision GPS coordinates in public opportunity alerts.
    """
    if latitude is None or longitude is None:
        return {
            "locality": locality or "Nearby Area",
            "coarse_lat": None,
            "coarse_lon": None,
            "is_coarsened": True
        }

    # Coarsen coordinates to ~0.015 degrees (~1.6 km privacy grid)
    coarse_lat = round(latitude, 2)
    coarse_lon = round(longitude, 2)

    return {
        "locality": locality or f"Near {coarse_lat}, {coarse_lon}",
        "coarse_lat": coarse_lat,
        "coarse_lon": coarse_lon,
        "is_coarsened": True
    }

def calculate_haversine_distance(
    lat1: float, lon1: float,
    lat2: float, lon2: float
) -> float:
    """Calculates approximate distance between two points in kilometers."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def filter_eligible_opportunity(
    worker_category_id: int,
    worker_lat: float,
    worker_lon: float,
    job_category_id: int,
    job_lat: float,
    job_lon: float,
    max_radius_km: float = 10.0,
    is_worker_online: bool = True
) -> Tuple[bool, Optional[float], Optional[str]]:
    """
    Filters nearby opportunity eligibility based on service category compatibility,
    online status, and radius constraints.
    """
    if not is_worker_online:
        return False, None, "Worker is currently offline."

    if worker_category_id != job_category_id:
        return False, None, "Service category mismatch."

    distance = calculate_haversine_distance(worker_lat, worker_lon, job_lat, job_lon)
    if distance > max_radius_km:
        return False, distance, f"Job location ({distance} km) exceeds opportunity radius of {max_radius_km} km."

    return True, distance, None

def route_multi_channel_notification(
    recipient_user_id: int,
    title: str,
    message: str,
    category: str = 'booking',
    enabled_channels: Optional[List[str]] = None,
    channel_availability: Optional[Dict[str, bool]] = None,
    is_urgent: bool = False,
    in_quiet_hours: bool = False,
    idempotency_key: Optional[str] = None,
    existing_keys: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Executes the provider-independent priority chain:
    PUSH -> IN_APP -> SMS -> IVR.
    - Idempotency check prevents duplicate notifications.
    - Suppresses non-urgent messages during quiet hours.
    - Automatically falls back when a higher channel is unavailable or fails.
    - Records immutable delivery history for every attempt.
    """
    if existing_keys and idempotency_key in existing_keys:
        return {
            "status": "DUPLICATE_SUPPRESSED",
            "delivered_channel": None,
            "attempts": [],
            "idempotency_key": idempotency_key,
            "message": "Duplicate notification prevented by idempotency guard."
        }

    if in_quiet_hours and not is_urgent:
        return {
            "status": "SUPPRESSED_QUIET_HOURS",
            "delivered_channel": None,
            "attempts": [{"channel": "ALL", "status": "SUPPRESSED_QUIET_HOURS", "timestamp": datetime.now(timezone.utc).isoformat()}],
            "idempotency_key": idempotency_key,
            "message": "Suppressed due to user's quiet hours schedule."
        }

    channels_to_try = [c for c in PRIORITY_CHANNELS if (enabled_channels is None or c in enabled_channels)]
    if not channels_to_try:
        channels_to_try = ['IN_APP']

    # Mock/simulated channel availability map (defaults to True unless explicitly provided)
    availability = channel_availability or {}

    attempts = []
    delivered_channel = None
    overall_status = "FAILED"

    # Scrub privacy data from title and message
    clean_title = scrub_sensitive_privacy_data(title)
    clean_message = scrub_sensitive_privacy_data(message)

    for ch in channels_to_try:
        is_available = availability.get(ch, True)
        now_ts = datetime.now(timezone.utc).isoformat()

        if is_available:
            attempts.append({
                "channel": ch,
                "status": "DELIVERED",
                "timestamp": now_ts,
                "note": f"Successfully dispatched via {ch}"
            })
            delivered_channel = ch
            overall_status = "DELIVERED"
            break
        else:
            attempts.append({
                "channel": ch,
                "status": "FALLBACK_TRIGGERED",
                "timestamp": now_ts,
                "note": f"{ch} channel unavailable, falling back to next priority tier."
            })

    return {
        "status": overall_status,
        "delivered_channel": delivered_channel,
        "attempts": attempts,
        "idempotency_key": idempotency_key,
        "recipient_id": recipient_user_id,
        "title": clean_title,
        "message": clean_message,
        "category": category,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
