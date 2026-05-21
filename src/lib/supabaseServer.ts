import { createClient } from '@supabase/supabase-js';

/** Producción: sin modo demo en servidor. */
export const isDemoMode = () => false;

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
