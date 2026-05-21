import { formatNhc } from '@/lib/nhc';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';

function requireDb() {
  if (!hasSupabaseConfig()) throw new Error('Servicio no disponible.');
  return getSupabaseAdmin();
}

/** Asigna el siguiente NHC libre en la clínica (4 dígitos; pasa a 5+ al agotar). */
export async function allocateNextNhc(clinicId: string): Promise<string> {
  const db = requireDb();
  const { data, error } = await db
    .from('profiles')
    .select('nhc')
    .eq('clinic_id', clinicId)
    .eq('role', 'patient')
    .not('nhc', 'is', null);
  if (error) throw error;

  let maxNum = 0;
  for (const row of data ?? []) {
    const raw = String(row.nhc ?? '').replace(/\D/g, '');
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n > maxNum) maxNum = n;
  }
  return formatNhc(maxNum + 1);
}
