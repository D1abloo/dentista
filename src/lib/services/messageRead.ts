import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from '@/lib/supabaseServer';

async function resolveTenantId(clinicId: string) {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('clinics').select('tenant_id').eq('id', clinicId).single();
  if (error || !data?.tenant_id) throw error ?? new Error('Clínica sin tenant_id.');
  return data.tenant_id as string;
}

/** Marca como leídos los mensajes del paciente pendientes de revisión en la clínica. */
export async function markPatientMessagesReadForClinic(clinicId: string, messageIds: string[]) {
  if (!messageIds.length || isDemoMode() || !hasSupabaseConfig()) return;
  const db = getSupabaseAdmin();
  const tenantId = await resolveTenantId(clinicId);
  const { error } = await db
    .from('messages')
    .update({ read: true })
    .in('id', messageIds)
    .eq('tenant_id', tenantId)
    .eq('from_patient', true);
  if (error) throw error;
}
