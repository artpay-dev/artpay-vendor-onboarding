/**
 * Supabase Browser Client
 * Per uso nel client-side (React components)
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Verifica che le variabili d'ambiente siano presenti
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Client Supabase per il browser
 * Usa anon key (pubblico) e RLS policies per sicurezza
 */
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
