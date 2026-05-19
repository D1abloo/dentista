import { createClient } from '@supabase/supabase-js';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

function requireConfig() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!hasSupabaseConfig() || !url || !anon) {
    throw new Error('Supabase no configurado.');
  }
  return { url, anon };
}

export function getSupabaseAnon() {
  const { url, anon } = requireConfig();
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function signInWithEmailPassword(email: string, password: string) {
  const client = getSupabaseAnon();
  return client.auth.signInWithPassword({ email, password });
}
