import { describe, it, expect, vi } from 'vitest';
import {
  ASSISTANT_LANGUAGES,
  getLanguageByCode,
  detectConsequentialAction,
  matchOfflineAssistantIntent,
  BrowserSpeechRecognitionService,
  BrowserSpeechSynthesisService
} from './voiceAssistant';

describe('UNNATI Voice-First Multilingual Assistant', () => {
  describe('1. Indian Language Selection (12+ Languages)', () => {
    it('supports all 12 target Indian languages plus English', () => {
      const targetCodes = [
        'hi', 'mr', 'bn', 'gu', 'ta', 'te', 'kn', 'ml', 'pa', 'or', 'as', 'ur', 'en'
      ];
      const availableCodes = ASSISTANT_LANGUAGES.map((l) => l.code);
      targetCodes.forEach((code) => {
        expect(availableCodes).toContain(code);
      });
      expect(ASSISTANT_LANGUAGES.length).toBeGreaterThanOrEqual(13);
    });

    it('returns native language scripts for low-literacy identification', () => {
      const hi = getLanguageByCode('hi');
      expect(hi.native_name).toBe('हिन्दी');
      expect(hi.bcp47).toBe('hi-IN');

      const gu = getLanguageByCode('gu');
      expect(gu.native_name).toBe('ગુજરાતી');

      const mr = getLanguageByCode('mr');
      expect(mr.native_name).toBe('मराठी');

      const ta = getLanguageByCode('ta');
      expect(ta.native_name).toBe('தமிழ்');

      const te = getLanguageByCode('te');
      expect(te.native_name).toBe('తెలుగు');

      const bn = getLanguageByCode('bn');
      expect(bn.native_name).toBe('বাংলা');
    });

    it('falls back gracefully to Hindi or English when unknown language is requested', () => {
      const fallback = getLanguageByCode('unknown-xyz');
      expect(fallback).toBeDefined();
      expect(fallback.code).toBe('hi');
    });
  });

  describe('2. Safety Guard & Consequential Action Detection', () => {
    it('requires explicit user confirmation when booking service is requested', () => {
      const res = detectConsequentialAction('Please book now for me', 'en');
      expect(res.requiresConfirmation).toBe(true);
      expect(res.action?.action_type).toBe('NAVIGATE_BOOKING');
      expect(res.action?.target_url).toBe('/customer/book');
      expect(res.warning).toContain('cannot auto-book');
    });

    it('detects booking requests in Indian languages and blocks auto-booking', () => {
      const resHi = detectConsequentialAction('तुरंत बुक कर दो', 'hi');
      expect(resHi.requiresConfirmation).toBe(true);
      expect(resHi.action?.action_type).toBe('NAVIGATE_BOOKING');

      const resGu = detectConsequentialAction('હમણાં બુક કરો', 'gu');
      expect(resGu.requiresConfirmation).toBe(true);
    });

    it('requires explicit confirmation before booking cancellation', () => {
      const res = detectConsequentialAction('cancel booking #102', 'en');
      expect(res.requiresConfirmation).toBe(true);
      expect(res.action?.action_type).toBe('CONFIRM_CANCELLATION');
      expect(res.action?.target_url).toBe('/customer/dashboard');
    });

    it('requires explicit confirmation before financial payment execution', () => {
      const res = detectConsequentialAction('pay money to worker now', 'en');
      expect(res.requiresConfirmation).toBe(true);
      expect(res.action?.action_type).toBe('REVIEW_PAYMENT');
      expect(res.warning).toContain('UNNATI does not hold funds');
    });

    it('blocks unauthorized bank account and UPI changes via assistant', () => {
      const res = detectConsequentialAction('change bank account number', 'en');
      expect(res.requiresConfirmation).toBe(true);
      expect(res.action?.action_type).toBe('NAVIGATE_SETTINGS');
    });

    it('allows informational questions without triggering consequential blockers', () => {
      const res = detectConsequentialAction('What are plumbing rates?', 'en');
      expect(res.requiresConfirmation).toBe(false);
      expect(res.action).toBeUndefined();
    });
  });

  describe('3. Offline Fallback & Local Intent Matcher', () => {
    it('provides cached service discovery response without network calls', () => {
      const res = matchOfflineAssistantIntent('Need a plumber', 'en');
      expect(res.is_verified_data).toBe(true);
      expect(res.data_source).toBe('OFFLINE_SERVICE_CATALOG');
      expect(res.text).toContain('Plumbing (₹250 base)');
      expect(res.suggested_chips).toContain('Book Plumber');
    });

    it('provides localized Hindi service information offline', () => {
      const res = matchOfflineAssistantIntent('प्लंबर की सेवा', 'hi');
      expect(res.language).toBe('hi');
      expect(res.text).toContain('प्लंबिंग');
      expect(res.spoken_text).toContain('प्लंबिंग');
    });

    it('explains transparent fair wage policy offline with zero platform hold', () => {
      const res = matchOfflineAssistantIntent('How is wage calculated and prices?', 'en');
      expect(res.is_verified_data).toBe(true);
      expect(res.text).toContain('Zero middleman commission');
      expect(res.text).toContain('6.5% cooperative allocation');
    });

    it('explains cooperative benefits and patronage dividend offline', () => {
      const res = matchOfflineAssistantIntent('What is cooperative dividend?', 'en');
      expect(res.is_verified_data).toBe(true);
      expect(res.text).toContain('patronage dividend');
    });

    it('provides weather & travel advisory with non-medical disclaimer offline', () => {
      const res = matchOfflineAssistantIntent('What about rainy weather work?', 'en');
      expect(res.is_advisory).toBe(true);
      expect(res.is_verified_data).toBe(false);
      expect(res.text).toContain('non-medical');
    });

    it('enforces safety guards even during offline execution', () => {
      const res = matchOfflineAssistantIntent('book now plumber', 'en');
      expect(res.requires_confirmation).toBe(true);
      expect(res.action?.action_type).toBe('NAVIGATE_BOOKING');
      expect(res.data_source).toBe('LOCAL_SAFETY_GUARD');
    });
  });

  describe('4. Speech Recognition & Synthesis Fail-Safes', () => {
    it('handles unavailable SpeechRecognition gracefully', () => {
      // Simulate browser without SpeechRecognition
      const service = new BrowserSpeechRecognitionService();
      const onError = vi.fn();

      service.startListening('hi-IN', vi.fn(), onError, vi.fn());
      expect(onError).toHaveBeenCalledWith(
        'UNAVAILABLE',
        expect.stringContaining('unavailable')
      );
    });

    it('handles microphone permission denied error cleanly', () => {
      const service = new BrowserSpeechRecognitionService();
      // Mock recognition instance
      (service as any).isSupported = true;
      (service as any).recognition = {
        start: vi.fn(),
        stop: vi.fn(),
      };

      const onError = vi.fn();
      service.startListening('hi-IN', vi.fn(), onError, vi.fn());

      // Simulate browser throwing not-allowed
      (service as any).recognition.onerror({ error: 'not-allowed' });
      expect(onError).toHaveBeenCalledWith(
        'PERMISSION_DENIED',
        expect.stringContaining('denied')
      );
    });

    it('clamps speech rate safely for low-literacy clarity (0.7x to 1.3x)', () => {
      const service = new BrowserSpeechSynthesisService();
      (service as any).isSupported = true;

      const mockUtterance: any = {};
      const mockSpeak = vi.fn();

      (globalThis as any).SpeechSynthesisUtterance = function (text: string) {
        mockUtterance.text = text;
        return mockUtterance;
      };
      (globalThis as any).window = {
        speechSynthesis: {
          speak: mockSpeak,
          cancel: vi.fn(),
        },
      };

      // Test extreme slow clamped to 0.7
      service.speak('Hello', 'en-IN', 0.2);
      expect(mockUtterance.rate).toBe(0.7);

      // Test extreme fast clamped to 1.3
      service.speak('Hello', 'en-IN', 2.5);
      expect(mockUtterance.rate).toBe(1.3);

      // Test normal gentle rate preserved
      service.speak('Hello', 'en-IN', 0.9);
      expect(mockUtterance.rate).toBe(0.9);
    });
  });

  describe('5. Hallucination Prevention & Data Grounding', () => {
    it('marks database-grounded records with is_verified_data=true', () => {
      const res = matchOfflineAssistantIntent('plumber services', 'en');
      expect(res.is_verified_data).toBe(true);
      expect(res.is_advisory).toBe(false);
    });

    it('marks recommendations and general greetings with is_advisory=true', () => {
      const res = matchOfflineAssistantIntent('Hello', 'en');
      expect(res.is_advisory).toBe(true);
      expect(res.is_verified_data).toBe(false);
    });
  });
});
