import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  WifiOff,
  AlertCircle,
  X,
  Gauge
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  SupportedLanguage,
  AssistantMessage,
  SpeechRecognitionState
} from '@/types/assistant';
import {
  ASSISTANT_LANGUAGES,
  getLanguageByCode,
  BrowserSpeechRecognitionService,
  BrowserSpeechSynthesisService,
  matchOfflineAssistantIntent
} from '@/lib/voiceAssistant';
import api from '@/services/api';
import { useAccessibility } from '@/context/AccessibilityContext';

export interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  className
}) => {
  const navigate = useNavigate();
  const { lowBandwidth } = useAccessibility();

  // Selected language (defaults to Hindi or English)
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
    ASSISTANT_LANGUAGES[0] // Hindi default
  );

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'नमस्ते! मैं उन्नति सहायक हूँ। आप काम, बुकिंग, उचित मजदूरी या सहकारी लाभांश के बारे में बोलकर या लिखकर पूछ सकते हैं।',
      spoken_text: 'नमस्ते! मैं उन्नति सहायक हूँ। आप काम, बुकिंग या सहकारी योजना के बारे में क्या जानना चाहते हैं?',
      language: 'hi',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_verified_data: false,
      is_advisory: true,
      suggested_chips: ['प्लंबर बुक करें', 'बुकिंग स्थिति', 'उचित मजदूरी', 'सहकारी लाभांश']
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [speechState, setSpeechState] = useState<SpeechRecognitionState>('IDLE');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speechRate, setSpeechRate] = useState<number>(0.9); // Gentle 0.9x for low-literacy
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionService = useRef<BrowserSpeechRecognitionService | null>(null);
  const synthesisService = useRef<BrowserSpeechSynthesisService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Services
  useEffect(() => {
    recognitionService.current = new BrowserSpeechRecognitionService();
    synthesisService.current = new BrowserSpeechSynthesisService();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      recognitionService.current?.stopListening();
      synthesisService.current?.stop();
    };
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle language change
  const handleLanguageChange = (code: string) => {
    const lang = getLanguageByCode(code);
    setSelectedLanguage(lang);
    setErrorMessage(null);
  };

  // Toggle voice recognition
  const handleToggleListening = () => {
    if (speechState === 'LISTENING') {
      recognitionService.current?.stopListening();
      setSpeechState('IDLE');
      setLiveTranscript('');
      return;
    }

    setErrorMessage(null);
    setSpeechState('LISTENING');
    setLiveTranscript('');

    recognitionService.current?.startListening(
      selectedLanguage.bcp47,
      (transcript, isFinal) => {
        setLiveTranscript(transcript);
        if (isFinal && transcript.trim()) {
          handleSendQuery(transcript);
          setSpeechState('IDLE');
          setLiveTranscript('');
        }
      },
      (state, err) => {
        setSpeechState(state);
        if (state === 'PERMISSION_DENIED') {
          setErrorMessage('माइक्रोफ़ोन अनुमति नहीं मिली। कृपया नीचे लिखकर संदेश भेजें। (Microphone access denied)');
        } else if (state === 'UNAVAILABLE') {
          setErrorMessage('माइक्रोफ़ोन उपलब्ध नहीं है। कृपया लिखकर पूछें। (Voice unavailable)');
        } else if (state === 'ERROR') {
          setErrorMessage(err);
        }
      },
      () => {
        setSpeechState('IDLE');
      }
    );
  };

  // Speak response
  const handleSpeakText = (text: string) => {
    if (isSpeaking) {
      synthesisService.current?.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    synthesisService.current?.speak(
      text,
      selectedLanguage.bcp47,
      speechRate,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  // Process query via API or Local Offline Cache
  const handleSendQuery = async (queryToSend?: string) => {
    const query = (queryToSend || inputText).trim();
    if (!query) return;

    setInputText('');
    setErrorMessage(null);

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      language: selectedLanguage.code,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);

    // If offline or low-bandwidth emergency, use local intent matching
    if (isOffline || !navigator.onLine) {
      const offlineResult = matchOfflineAssistantIntent(query, selectedLanguage.code);
      const assistantMessage: AssistantMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: offlineResult.text,
        spoken_text: offlineResult.spoken_text,
        language: offlineResult.language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_verified_data: offlineResult.is_verified_data,
        is_advisory: offlineResult.is_advisory,
        data_source: offlineResult.data_source,
        requires_confirmation: offlineResult.requires_confirmation,
        action: offlineResult.action,
        suggested_chips: offlineResult.suggested_chips,
        is_offline_fallback: true
      };

      setMessages((prev) => [...prev, assistantMessage]);
      handleSpeakText(offlineResult.spoken_text);
      return;
    }

    try {
      const res = await api.post('/api/assistant/query/', {
        query,
        language: selectedLanguage.code
      });

      const data = res.data;
      const assistantMessage: AssistantMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.text,
        spoken_text: data.spoken_text,
        language: data.language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_verified_data: data.is_verified_data,
        is_advisory: data.is_advisory,
        data_source: data.data_source,
        requires_confirmation: data.requires_confirmation,
        action: data.action,
        suggested_chips: data.suggested_chips
      };

      setMessages((prev) => [...prev, assistantMessage]);
      handleSpeakText(data.spoken_text);
    } catch (e: any) {
      // Fallback to local offline cache if API fails
      const offlineFallback = matchOfflineAssistantIntent(query, selectedLanguage.code);
      const assistantMessage: AssistantMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: offlineFallback.text,
        spoken_text: offlineFallback.spoken_text,
        language: selectedLanguage.code,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_verified_data: offlineFallback.is_verified_data,
        is_advisory: offlineFallback.is_advisory,
        data_source: 'LOCAL_FALLBACK',
        requires_confirmation: offlineFallback.requires_confirmation,
        action: offlineFallback.action,
        suggested_chips: offlineFallback.suggested_chips,
        is_offline_fallback: true
      };
      setMessages((prev) => [...prev, assistantMessage]);
      handleSpeakText(offlineFallback.spoken_text);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="UNNATI Voice-First Multilingual Assistant"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4',
        className
      )}
    >
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  UNNATI Voice Assistant
                </h3>
                {isOffline && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <WifiOff className="w-3 h-3" />
                    Offline Mode
                  </span>
                )}
                {lowBandwidth && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                    Low Data
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                सहकारी बहुभाषी आवाज़ सहायक (12+ Indian Languages)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="relative">
              <select
                value={selectedLanguage.code}
                onChange={(e) => handleLanguageChange(e.target.value)}
                aria-label="Select Language"
                className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {ASSISTANT_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.native_name} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                synthesisService.current?.stop();
                recognitionService.current?.stopListening();
                onClose();
              }}
              aria-label="Close Voice Assistant"
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[260px] max-h-[420px] bg-slate-50/50 dark:bg-slate-950/40">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-xs space-y-2',
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                  )}
                >
                  {/* Status Badges for Grounding */}
                  {!isUser && (
                    <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-700">
                      {msg.is_verified_data ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified Platform Record
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300">
                          <ShieldCheck className="w-3 h-3" />
                          AI Advisory
                        </span>
                      )}

                      {msg.is_offline_fallback && (
                        <span className="text-[10px] text-slate-400">
                          (Cached Local)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                  {/* Consequential Action Card requiring Explicit User Confirmation */}
                  {!isUser && msg.requires_confirmation && msg.action && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        Explicit Confirmation Required (स्पष्ट पुष्टि आवश्यक)
                      </div>
                      <p className="text-xs text-amber-900/90 dark:text-amber-200">
                        AI will not auto-execute this action. Please proceed manually:
                      </p>
                      <button
                        onClick={() => {
                          onClose();
                          navigate(msg.action!.target_url);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition"
                      >
                        {msg.action.label}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Audio Replay & Slow Speed Controls */}
                  {!isUser && msg.spoken_text && (
                    <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                      <button
                        onClick={() => handleSpeakText(msg.spoken_text!)}
                        aria-label="Replay audio spoken response"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold transition"
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>{isSpeaking ? 'Stop Audio' : 'बोलकर सुनाएं (Replay)'}</span>
                      </button>

                      {/* Slow Speed Toggle for Low-Literacy Clarity */}
                      <button
                        onClick={() => setSpeechRate((r) => (r === 0.8 ? 1.0 : 0.8))}
                        aria-label="Toggle speech playback rate"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        <Gauge className="w-3 h-3" />
                        {speechRate === 0.8 ? 'Slow (0.8x)' : 'Normal (1.0x)'}
                      </button>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>

                {/* Suggested Quick Prompt Chips */}
                {!isUser && msg.suggested_chips && msg.suggested_chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                    {msg.suggested_chips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendQuery(chip)}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Live Microphone Transcript Banner */}
        {speechState === 'LISTENING' && (
          <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                सुन रहा हूँ (Listening in {selectedLanguage.native_name})...
              </span>
            </div>
            <span className="text-xs italic text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
              {liveTranscript || 'कृपया बोलें...'}
            </span>
          </div>
        )}

        {/* Error / Permission Denied Warning */}
        {errorMessage && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Control Footer: Large Microphone & Text Fallback */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          {/* Main Large Voice Control */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleToggleListening}
              aria-label={
                speechState === 'LISTENING'
                  ? 'Stop Voice Recording'
                  : 'Start Speaking into Microphone'
              }
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300',
                speechState === 'LISTENING'
                  ? 'bg-rose-500 hover:bg-rose-600 scale-110 ring-4 ring-rose-200 dark:ring-rose-900 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 ring-4 ring-emerald-100 dark:ring-emerald-950'
              )}
            >
              {speechState === 'LISTENING' ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>
          <p className="text-center text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {speechState === 'LISTENING'
              ? 'बोलना समाप्त करने के लिए टैप करें (Tap to stop)'
              : 'बोलने के लिए माइक दबाएं (Tap mic to speak)'}
          </p>

          {/* Text Input Fallback */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`या यहाँ टाइप करें (${selectedLanguage.name})...`}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              aria-label="Send query"
              className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Audio Privacy & Safety Disclaimer */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span>🔒 आवाज़ रिकॉर्डिंग संग्रहित नहीं की जाती (Zero audio retention)</span>
            <span>WCAG 2.1 AA</span>
          </div>
        </div>
      </div>
    </div>
  );
};
