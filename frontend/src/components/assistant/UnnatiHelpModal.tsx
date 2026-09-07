import React, { useState, useEffect, useRef } from 'react';
import {
  HelpCircle,
  Send,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  WifiOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { queryUnnatiHelp, GroundedAnswer } from '@/lib/unnatiHelpEngine';
import api from '@/services/api';
import { SupportedLanguage } from '@/i18n/types';

export interface UnnatiHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'unnati';
  text: string;
  timestamp: string;
  isVerified?: boolean;
  isUnsupported?: boolean;
  topicId?: string;
  actionUrl?: string;
  actionLabel?: string;
}

const EXAMPLE_QUESTIONS: Record<SupportedLanguage, { label: string; query: string }[]> = {
  en: [
    { label: 'Available Services', query: 'What services are available on UNNATI?' },
    { label: 'Booking Process', query: 'How do I book a verified service?' },
    { label: 'Direct Payments', query: 'How does direct customer payment work?' },
    { label: 'Cancellation Policy', query: 'What is the cancellation policy?' },
    { label: 'Safety & Verification', query: 'How are workers verified?' },
    { label: 'Cooperative Principles', query: 'How does the worker cooperative model work?' },
    { label: 'Support Inquiries', query: 'How can I contact UNNATI support?' }
  ],
  hi: [
    { label: 'उपलब्ध सेवाएं', query: 'उन्नति पर कौन सी सेवाएं उपलब्ध हैं?' },
    { label: 'बुकिंग प्रक्रिया', query: 'सेवा कैसे बुक करें?' },
    { label: 'सीधा भुगतान', query: 'सीधा भुगतान कैसे काम करता है?' },
    { label: 'रद्दीकरण नीति', query: 'रद्दीकरण और रिफंड की नीति क्या है?' },
    { label: 'सुरक्षा और सत्यापन', query: 'श्रमिकों का सत्यापन कैसे होता है?' },
    { label: 'सहकारी सिद्धांत', query: 'सहकारी मंच कैसे काम करता है?' },
    { label: 'सहायता संपर्क', query: 'उन्नति सहायता से कैसे संपर्क करें?' }
  ],
  mr: [
    { label: 'उपलब्ध सेवा', query: 'उन्नतीवर कोणत्या सेवा उपलब्ध आहेत?' },
    { label: 'बुकिंग प्रक्रिया', query: 'सेवा कशी बुक करावी?' },
    { label: 'थेट पेमेंट', query: 'थेट ग्राहक पेमेंट कसे चालते?' },
    { label: 'रद्द करण्याचे धोरण', query: 'बुकिंग रद्द करण्याचे धोरण काय आहे?' },
    { label: 'सुरक्षा आणि पडताळणी', query: 'कामगारांची पडताळणी कशी केली जाते?' },
    { label: 'सहकारी तत्त्वे', query: 'सहकारी संस्था कशी काम करते?' },
    { label: 'मदत संपर्क', query: 'उन्नती ग्राहक मदतीशी कसा संपर्क साधावा?' }
  ]
};

const MAX_INPUT_LENGTH = 500;

export const UnnatiHelpModal: React.FC<UnnatiHelpModalProps> = ({
  isOpen,
  onClose,
  className
}) => {
  const navigate = useNavigate();
  const { language, setLanguage, t, supportedLanguages } = useLanguage();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleClearHistory = () => {
    setMessages([]);
    setErrorMessage(null);
  };

  const handleSendQuery = async (queryToSend?: string) => {
    const query = (queryToSend !== undefined ? queryToSend : inputText).trim();
    if (!query) return;

    if (query.length > MAX_INPUT_LENGTH) {
      setErrorMessage(t('help_error_length'));
      return;
    }

    setErrorMessage(null);
    setInputText('');

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let answer: GroundedAnswer;

      if (!isOffline) {
        try {
          const res = await api.post('/api/assistant/query/', {
            query,
            language
          });
          const data = res.data;
          const isUnsupported = Boolean(data.is_unsupported) ||
            data.text.indexOf('Information Not Available') !== -1 ||
            data.text.indexOf('जानकारी उपलब्ध नहीं है') !== -1 ||
            data.text.indexOf('माहिती उपलब्ध नाही') !== -1;
          answer = {
            text: data.text,
            content: data.text,
            language,
            is_verified_data: Boolean(data.is_verified_data),
            is_advisory: false,
            is_unsupported: isUnsupported,
            isSupported: !isUnsupported,
            topic: data.data_source || 'backend_canonical',
            topicId: data.data_source || 'backend_canonical',
            title: data.is_verified_data ? 'Verified UNNATI Knowledge' : 'UNNATI Information',
            action: data.action ? { label: data.action.label, target_url: data.action.target_url } : undefined,
            suggestedAction: data.action ? { label: data.action.label, url: data.action.target_url } : undefined,
            suggested_chips: data.suggested_chips || []
          };
        } catch {
          // Gracefully fall back to the canonical frontend engine
          answer = queryUnnatiHelp(query, language);
        }
      } else {
        // Offline canonical retrieval
        answer = queryUnnatiHelp(query, language);
      }

      const unnatiMessage: ChatMessage = {
        id: `unnati-${Date.now()}`,
        sender: 'unnati',
        text: answer.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isVerified: answer.isSupported,
        isUnsupported: !answer.isSupported,
        topicId: answer.topicId,
        actionUrl: answer.suggestedAction?.url,
        actionLabel: answer.suggestedAction?.label
      };

      setMessages((prev) => [...prev, unnatiMessage]);
    } catch {
      // Local fallback in case of unexpected errors
      const fallback = queryUnnatiHelp(query, language);
      const fallbackMsg: ChatMessage = {
        id: `unnati-${Date.now()}`,
        sender: 'unnati',
        text: fallback.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isVerified: fallback.isSupported,
        isUnsupported: !fallback.isSupported
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentExamples = EXAMPLE_QUESTIONS[language] || EXAMPLE_QUESTIONS.en;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('help_modal_title')}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4',
        className
      )}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {t('help_modal_title')}
                </h2>
                {isOffline && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <WifiOff className="w-3 h-3" />
                    Offline Knowledge
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {t('help_modal_subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              aria-label="Select Chat Language"
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              {supportedLanguages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName}
                </option>
              ))}
            </select>

            {/* Clear History Button */}
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                title={t('help_clear_history')}
                aria-label={t('help_clear_history')}
                className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label={t('help_close')}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Log & Empty State */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-[300px] max-h-[460px] bg-slate-50/50">
          {messages.length === 0 ? (
            /* Empty State with Curated Topics */
            <div className="py-6 px-2 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t('help_empty_heading')}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  {t('help_empty_subtitle')}
                </p>
              </div>

              {/* Example Question Chips */}
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mt-2">
                {currentExamples.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuery(item.query)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 shadow-2xs transition-all text-left"
                  >
                    💬 {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message Thread */
            messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}
                >
                  <div
                    className={cn(
                      'max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-xs space-y-2',
                      isUser
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                    )}
                  >
                    {/* Verified vs Unsupported Badge */}
                    {!isUser && (
                      <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-slate-100">
                        {msg.isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            {t('help_verified_badge')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertCircle className="w-3 h-3" />
                            {t('help_unsupported_title')}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message Text (Safe text rendering, no dangerouslySetInnerHTML) */}
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">
                      {msg.text}
                    </p>

                    {/* Consequential / Suggested Platform Action Button */}
                    {!isUser && msg.actionUrl && msg.actionLabel && (
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            onClose();
                            navigate(msg.actionUrl!);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                        >
                          {msg.actionLabel}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs px-2 py-1">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Retrieving verified UNNATI knowledge...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 flex items-center gap-2 text-xs font-semibold text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Input Footer */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              maxLength={MAX_INPUT_LENGTH}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('help_input_placeholder')}
              aria-label={t('help_input_placeholder')}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-300 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              aria-label={t('help_send_button')}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-40 transition shadow-xs flex items-center gap-1.5"
            >
              <span>{t('help_send_button')}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>UNNATI Help — Knowledge-based support</span>
            <span>{inputText.length}/{MAX_INPUT_LENGTH}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnnatiHelpModal;
