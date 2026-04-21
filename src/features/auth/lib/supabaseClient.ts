import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// PLACEHOLDER: these are read from .env. Ensure your .env contains:
//   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
//   VITE_SUPABASE_ANON_KEY=<anon-key>

// Read at call time (not module load) so tests can override import.meta.env.
function getUrl(): string { return import.meta.env.VITE_SUPABASE_URL ?? ''; }
function getAnonKey(): string { return import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''; }

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = getUrl();
  const key = getAnonKey();
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getUrl() && getAnonKey());
}
