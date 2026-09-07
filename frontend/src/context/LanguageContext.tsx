import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { SupportedLanguage, LanguageInfo, TranslationKey } from '../i18n/types';
import { SUPPORTED_LANGUAGES, getTranslation } from '../i18n/translations';

export interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  supportedLanguages: LanguageInfo[];
}

const STORAGE_KEY = 'unnati_language';
const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // CRITICAL REQUIREMENT:
  // Default is STRICTLY English ('en').
  // NEVER read navigator.language or IP geolocation to auto-switch languages.
  // Language changes ONLY after explicit user selection.
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'hi' || stored === 'mr') {
        return stored;
      }
    } catch {
      // Fallback on default
    }
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = (newLang: SupportedLanguage) => {
    if (newLang !== 'en' && newLang !== 'hi' && newLang !== 'mr') return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch (err) {
      console.warn('Failed to save language preference to storage', err);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = useMemo(() => {
    return (key: TranslationKey, params?: Record<string, string>) => {
      return getTranslation(language, key, params);
    };
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t,
    supportedLanguages: SUPPORTED_LANGUAGES
  }), [language, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
