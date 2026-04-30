/**
 * Supabase Server Client
 * Per uso nelle API routes e server components
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Verifica che le variabili d'ambiente siano presenti
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Client Supabase con service role key
 * DA USARE SOLO NEL BACKEND (API routes, server actions)
 * NON usare nel client-side!
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Helper per ottenere un client con session token specifico
 * Utile per validare e operare come un utente specifico
 */
export function getSupabaseWithToken(sessionToken: string) {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        headers: {
          'x-session-token': sessionToken,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
