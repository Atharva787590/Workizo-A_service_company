import { describe, it, expect } from 'vitest';
import { queryUnnatiHelp, CANONICAL_KNOWLEDGE, SAFE_UNSUPPORTED_FALLBACK } from './unnatiHelpEngine';

describe('UNNATI Grounded Help Engine (Client-Side RAG)', () => {
  it('should have structured canonical passages and safe fallback messages', () => {
    expect(CANONICAL_KNOWLEDGE.length).toBeGreaterThanOrEqual(8);
    expect(SAFE_UNSUPPORTED_FALLBACK.en).toContain('verified information');
    expect(SAFE_UNSUPPORTED_FALLBACK.hi).toContain('सत्यापित जानकारी उपलब्ध नहीं है');
    expect(SAFE_UNSUPPORTED_FALLBACK.mr).toContain('माहिती उपलब्ध नाही');
  });

  it('should retrieve verified services information in English', () => {
    const res = queryUnnatiHelp('What services are available on UNNATI?', 'en');
    expect(res.isSupported).toBe(true);
    expect(res.topicId).toBe('services_catalog');
    expect(res.content).toContain('Electrician, Plumber, Carpenter');
  });

  it('should retrieve verified booking process information in English', () => {
    const res = queryUnnatiHelp('How do I book a verified service provider?', 'en');
    expect(res.isSupported).toBe(true);
    expect(res.topicId).toBe('booking_process');
    expect(res.content).toContain('Select your service category');
    expect(res.suggestedAction?.url).toBe('/customer/book');
  });

  it('should retrieve direct payment and cooperative reserve information', () => {
    const res = queryUnnatiHelp('How does payment work on UNNATI? Is there a commission fee?', 'en');
    expect(res.isSupported).toBe(true);
    expect(res.topicId).toBe('direct_payments');
    expect(res.content).toContain('direct customer-to-provider settlement');
    expect(res.content).toContain('cooperative reserve');
  });

  it('should retrieve cancellation policy information', () => {
    const res = queryUnnatiHelp('Can I cancel my booking and get a refund?', 'en');
    expect(res.isSupported).toBe(true);
    expect(res.topicId).toBe('cancellation_policy');
    expect(res.content).toContain('Bookings can be rescheduled or cancelled');
  });

  it('should retrieve worker safety and onboarding verification information', () => {
    const res = queryUnnatiHelp('How are workers vetted and verified for safety?', 'en');
    expect(res.isSupported).toBe(true);
    expect(res.topicId).toBe('safety_and_verification');
    expect(res.content).toContain('trade qualification checks');
  });

  it('should retrieve cooperative principles and democratic governance information', () => {
    const res = queryUnnatiHelp('What is the cooperative model and democratic governance?', 'en');
    expect(res.isSupported).toBe(true);
    expect(res.topicId).toBe('cooperative_principles_governance');
    expect(res.content).toContain('cooperative principles');
  });

  it('should retrieve support contact information without unsupported phone hotline', () => {
    const res = queryUnnatiHelp('How can I contact UNNATI customer support or helpline?', 'en');
    expect(res.isSupported).toBe(true);
    expect(res.topicId).toBe('support_and_contact');
    expect(res.content).toContain('support@unnati.coop');
    expect(res.content).not.toContain('+91 79 4004 0404');
  });

  it('should support explicit Hindi queries and return verified Hindi knowledge', () => {
    const res = queryUnnatiHelp('सेवा कैसे बुक करें?', 'hi');
    expect(res.isSupported).toBe(true);
    expect(res.topicId).toBe('booking_process');
    expect(res.content).toContain('उन्नती पर सेवा बुक करना');
  });

  it('should support explicit Marathi queries and return verified Marathi knowledge', () => {
    const res = queryUnnatiHelp('थेट पेमेंट कसे काम करते?', 'mr');
    expect(res.isSupported).toBe(true);
    expect(res.topicId).toBe('direct_payments');
    expect(res.content).toContain('थेट पेमेंट');
  });

  it('should return safe unsupported response when query is not covered in canonical knowledge', () => {
    const unsupportedQueries = [
      'What is the stock price of Tesla today?',
      'Who won the Cricket World Cup in 2023?',
      'Can you book me a flight ticket to London?',
      'What is the weather forecast in Paris tomorrow?',
      'Tell me about Bitcoin cryptocurrency mining.'
    ];

    for (const query of unsupportedQueries) {
      const res = queryUnnatiHelp(query, 'en');
      expect(res.isSupported).toBe(false);
      expect(res.topicId).toBe('unsupported_query');
      expect(res.content).toContain('verified information');
      expect(res.content).toContain('support@unnati.coop');
    }
  });

  it('should reject inputs that exceed maximum length (500 characters)', () => {
    const longQuery = 'services '.repeat(70); // > 500 chars
    expect(longQuery.length).toBeGreaterThan(500);

    const res = queryUnnatiHelp(longQuery, 'en');
    expect(res.isSupported).toBe(false);
    expect(res.content).toContain('Question exceeds maximum allowed length of 500 characters');
  });

  it('should handle empty or whitespace queries safely', () => {
    const res = queryUnnatiHelp('   ', 'en');
    expect(res.isSupported).toBe(false);
    expect(res.content).toContain('Please enter a question');
  });

  it('should not fabricate worker details, payment transactions, or live database records', () => {
    const res = queryUnnatiHelp('Show me the private home address of worker Ramesh', 'en');
    expect(res.isSupported).toBe(false);
    expect(res.content).not.toContain('address');
    expect(res.content).toContain('support@unnati.coop');
  });
});
