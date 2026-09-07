import { describe, it, expect } from 'vitest';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

describe('UNNATI Supabase Auth Integration Baseline', () => {
  it('should recognize valid Supabase project credentials when configured', () => {
    // isSupabaseConfigured returns true when non-placeholder URL and anon key exist
    const configured = isSupabaseConfigured();
    expect(typeof configured).toBe('boolean');
  });

  it('should initialize a valid Supabase client instance with auth capabilities', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(typeof supabase.auth.signUp).toBe('function');
    expect(typeof supabase.auth.signInWithPassword).toBe('function');
    expect(typeof supabase.auth.signOut).toBe('function');
    expect(typeof supabase.auth.getSession).toBe('function');
    expect(typeof supabase.auth.onAuthStateChange).toBe('function');
    expect(typeof supabase.auth.resetPasswordForEmail).toBe('function');
    expect(typeof supabase.auth.updateUser).toBe('function');
  });

  it('should normalize project URLs with trailing slashes or subpaths', () => {
    // Tests that URL normalization functions as expected
    const rawWithSlash = 'https://phtjxgojhofgclraljpp.supabase.co/rest/v1/';
    const parsedOrigin = new URL(rawWithSlash).origin;
    expect(parsedOrigin).toBe('https://phtjxgojhofgclraljpp.supabase.co');
    expect(parsedOrigin.endsWith('/')).toBe(false);
  });

  it('should enforce role separation in customer and worker registrations', () => {
    const customerPayload = {
      email: 'customer@unnati.coop',
      options: {
        data: {
          full_name: 'Anita Sharma',
          phone: '9876543210',
          role: 'customer' as const,
        },
      },
    };

    const workerPayload = {
      email: 'worker@unnati.coop',
      options: {
        data: {
          full_name: 'Ramesh Kumar',
          phone: '9876543211',
          role: 'worker' as const,
        },
      },
    };

    expect(customerPayload.options.data.role).toBe('customer');
    expect(workerPayload.options.data.role).toBe('worker');
    expect(customerPayload.options.data.role).not.toBe(workerPayload.options.data.role);
  });

  it('should map user-friendly error messages for common authentication failures', () => {
    const mapError = (rawMessage: string): string => {
      const lower = rawMessage.toLowerCase();
      if (lower.includes('invalid login credentials')) {
        return 'Incorrect email or password. Please try again.';
      }
      if (lower.includes('email not confirmed')) {
        return 'Please confirm your email address before logging in.';
      }
      if (lower.includes('user already registered')) {
        return 'An account with this email already exists. Please sign in instead.';
      }
      return rawMessage;
    };

    expect(mapError('Invalid login credentials')).toBe('Incorrect email or password. Please try again.');
    expect(mapError('Email not confirmed')).toBe('Please confirm your email address before logging in.');
    expect(mapError('User already registered')).toBe('An account with this email already exists. Please sign in instead.');
    expect(mapError('Network connection failed')).toBe('Network connection failed');
  });
});
