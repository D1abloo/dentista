import { createClient } from '@supabase/supabase-js';

/** Alineado con PUBLIC_DEMO_MODE (middleware y APIs en desarrollo). */
export const isDemoMode = () => import.meta.env.PUBLIC_DEMO_MODE === 'true';

const isConfiguredValue = (value: string | undefined) => Boolean(value && !value.includes('YOUR_') && !value.includes('YOUR_PROJECT'));

export const hasSupabaseConfig = () =>
  isConfiguredValue(import.meta.env.PUBLIC_SUPABASE_URL) &&
  isConfiguredValue(import.meta.env.PUBLIC_SUPABASE_ANON_KEY) &&
  isConfiguredValue(import.meta.env.SUPABASE_SERVICE_ROLE_KEY);

export function getSupabaseAdmin() {
  if (!hasSupabaseConfig()) {
    throw new Error('Servicio no configurado. Completa las variables de entorno.');
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
