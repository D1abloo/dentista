import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';

export async function updateClinicLogo(clinicId: string, logoUrl: string | null) {
  if (!hasSupabaseConfig()) throw new Error('Servicio no disponible.');
  const db = getSupabaseAdmin();
  const { error } = await db.from('clinics').update({ logo_url: logoUrl }).eq('id', clinicId);
  if (error) throw error;
  return { logoUrl };
}

export async function getClinicLogo(clinicId: string): Promise<string | null> {
  if (!hasSupabaseConfig()) return null;
  const db = getSupabaseAdmin();
  const { data } = await db.from('clinics').select('logo_url').eq('id', clinicId).maybeSingle();
  return (data?.logo_url as string | null) ?? null;
}
