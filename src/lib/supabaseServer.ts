import { createClient } from '@supabase/supabase-js';

/** Por defecto LIVE; solo demo si PUBLIC_DEMO_MODE=true explícito. */
export const isDemoMode = () => import.meta.env.PUBLIC_DEMO_MODE === 'true';

const isConfiguredValue = (value: string | undefined) => Boolean(value && !value.includes('YOUR_') && !value.includes('YOUR_PROJECT'));

export const hasSupabaseConfig = () =>
  isConfiguredValue(import.meta.env.PUBLIC_SUPABASE_URL) &&
  isConfiguredValue(import.meta.env.PUBLIC_SUPABASE_ANON_KEY) &&
  isConfiguredValue(import.meta.env.SUPABASE_SERVICE_ROLE_KEY);

export function getSupabaseAdmin() {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase no está configurado. Usa modo demo o completa .env.');
  }

  return createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}
