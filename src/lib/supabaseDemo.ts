import { demoSeed } from '@/data/demoData';
import type { DemoState } from '@/types/demo';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';

export const DEMO_STATE_SCOPE = 'global';

/** Datos de app en Supabase (tabla demo_app_state) cuando hay credenciales — demo y LIVE. */
export function useSupabaseDemoStorage(): boolean {
  return hasSupabaseConfig();
}

/** @deprecated Usa useSupabaseDemoStorage */
export const useSupabaseAppStorage = useSupabaseDemoStorage;

export function isDemoStatePayload(value: unknown): value is DemoState {
  if (!value || typeof value !== 'object') return false;
  const v = value as DemoState;
  return Array.isArray(v.tenants) && Array.isArray(v.patients) && Array.isArray(v.appointments);
}

export async function loadDemoStateFromSupabase(): Promise<DemoState | null> {
  if (!hasSupabaseConfig()) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('demo_app_state')
    .select('payload')
    .eq('scope', DEMO_STATE_SCOPE)
    .maybeSingle();

  if (error) throw error;
  if (!data?.payload || !isDemoStatePayload(data.payload)) return null;
  return data.payload;
}

export async function saveDemoStateToSupabase(state: DemoState): Promise<void> {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase no está configurado.');
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('demo_app_state').upsert(
    {
      scope: DEMO_STATE_SCOPE,
      payload: state,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'scope' }
  );
  if (error) throw error;
}

/** Carga desde Supabase o inserta la semilla demo la primera vez. */
export async function ensureDemoStateInSupabase(): Promise<DemoState> {
  const existing = await loadDemoStateFromSupabase();
  if (existing) return existing;
  const seed = structuredClone(demoSeed);
  await saveDemoStateToSupabase(seed);
  return seed;
}
