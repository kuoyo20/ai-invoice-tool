import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured =
  !!SUPABASE_URL &&
  !!SUPABASE_PUBLISHABLE_KEY &&
  SUPABASE_PUBLISHABLE_KEY !== 'your_supabase_anon_key_here' &&
  SUPABASE_PUBLISHABLE_KEY.length > 20;

// Use a dummy client when not configured to prevent module-load crashes.
// The UI will show a config error screen instead.
export const supabase: SupabaseClient<Database> = isSupabaseConfigured
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key-not-configured',
      {
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );
