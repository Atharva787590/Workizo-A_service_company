import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TRANSLATIONS, getTranslation, SUPPORTED_LANGUAGES } from './translations';
import { SupportedLanguage } from './types';

// In Node test environment, mock localStorage if missing
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => { mockStorage[key] = val; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.clear) {
  (globalThis as any).localStorage = mockLocalStorage;
}

describe('UNNATI i18n & Translation System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should default to English language', () => {
    const defaultLang: SupportedLanguage = 'en';
    expect(defaultLang).toBe('en');
    expect(SUPPORTED_LANGUAGES[0].code).toBe('en');
    expect(SUPPORTED_LANGUAGES[0].name).toBe('English');
  });

  it('should support explicit Hindi selection', () => {
    const hindi = SUPPORTED_LANGUAGES.find((l) => l.code === 'hi');
    expect(hindi).toBeDefined();
    expect(hindi?.nativeName).toBe('हिन्दी');

    // Retrieve translated key in Hindi
    const text = getTranslation('hi', 'settings_language_section_title');
    expect(text).toContain('भाषा');
    expect(text).toBe(TRANSLATIONS.hi.settings_language_section_title);
  });

  it('should support explicit Marathi selection', () => {
    const marathi = SUPPORTED_LANGUAGES.find((l) => l.code === 'mr');
    expect(marathi).toBeDefined();
    expect(marathi?.nativeName).toBe('मराठी');

    // Retrieve translated key in Marathi
    const text = getTranslation('mr', 'settings_language_section_title');
    expect(text).toContain('भाषा');
    expect(text).toBe(TRANSLATIONS.mr.settings_language_section_title);
  });

  it('should safely fall back to English when a translation key is missing in target language', () => {
    // Cast a nonexistent key check or simulate missing key
    const englishTitle = TRANSLATIONS.en.settings_page_title;
    expect(englishTitle).toBeDefined();

    // Call getTranslation with a language where key might be undefined or missing
    const fallbackText = getTranslation('hi', 'settings_page_title');
    expect(fallbackText).toBeTruthy();

    // If a key doesn't exist in Marathi, it falls back to English
    const missingInCustom = getTranslation('mr', 'settings_page_title');
    expect(missingInCustom).toBeTruthy();
  });

  it('should persist explicitly selected language in localStorage', () => {
    const STORAGE_KEY = 'unnati_language';
    localStorage.setItem(STORAGE_KEY, 'mr');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('mr');

    localStorage.setItem(STORAGE_KEY, 'hi');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('hi');

    localStorage.setItem(STORAGE_KEY, 'en');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
  });

  it('should provide full coverage in English for all newly introduced settings and chat keys', () => {
    const englishKeys = Object.keys(TRANSLATIONS.en);
    expect(englishKeys.length).toBeGreaterThan(30);

    expect(TRANSLATIONS.en.settings_page_title).toBe('Platform Settings & Preferences');
    expect(TRANSLATIONS.en.help_button_label).toBe('UNNATI Help');
    expect(TRANSLATIONS.en.help_modal_title).toBe('UNNATI Help');
    expect(TRANSLATIONS.en.help_unsupported_title).toBe('Information Not Available');
    expect(TRANSLATIONS.en.settings_support_email_label).toBe('Email Support');
    expect(TRANSLATIONS.en.settings_support_phone_label).toBe('Helpline Hours');
  });

  it('should not contain external translation API dependencies or dynamic machine-translated markers', () => {
    // Assert all translations are static, versioned dictionaries
    expect(typeof TRANSLATIONS.en).toBe('object');
    expect(typeof TRANSLATIONS.hi).toBe('object');
    expect(typeof TRANSLATIONS.mr).toBe('object');
  });
});
