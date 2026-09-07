import { createClient, SupabaseClient } from '@supabase/supabase-js';

const normalizeSupabaseUrl = (raw: string): string => {
  if (!raw) return '';
  const trimmed = raw.trim();
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  }
};

const rawUrl: string = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseUrl: string = normalizeSupabaseUrl(rawUrl);
const supabaseAnonKey: string = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseAnonKey !== 'your-supabase-anon-key'
  );
};

if (!isSupabaseConfigured()) {
  console.warn(
    '[UNNATI Auth] Supabase URL or Anon Key is missing or using placeholder values. Please check frontend/.env.local.'
  );
}

// Create a single centralized client instance
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);
