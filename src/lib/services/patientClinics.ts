import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from '@/lib/supabaseServer';
import type { PatientClinicOption } from '@/lib/patient/patientClinics';

function requireDb() {
  if (isDemoMode() || !hasSupabaseConfig()) throw new Error('Servicio no disponible.');
  return getSupabaseAdmin();
}

/** Clínicas a las que el paciente puede escribir (perfil, citas, facturas, pagos, mensajes previos). */
export async function listLinkedClinicsForPatient(patientProfileId: string): Promise<PatientClinicOption[]> {
  const db = requireDb();

  const { data: profile, error: profileErr } = await db
    .from('profiles')
    .select('id, clinic_id')
    .eq('id', patientProfileId)
    .eq('role', 'patient')
    .single();
  if (profileErr || !profile) throw new Error('Paciente no encontrado.');

  const clinicIds = new Set<string>();
  if (profile.clinic_id) clinicIds.add(profile.clinic_id as string);

  const [{ data: appts }, { data: invoices }, { data: payments }, { data: messages }] = await Promise.all([
    db.from('appointments').select('clinic_id').eq('patient_id', patientProfileId),
    db.from('invoices').select('clinic_id').eq('patient_id', patientProfileId),
    db.from('payments').select('clinic_id').eq('patient_id', patientProfileId),
    db.from('messages').select('tenant_id').eq('patient_id', patientProfileId)
  ]);

  for (const row of appts ?? []) {
    if (row.clinic_id) clinicIds.add(row.clinic_id as string);
  }
  for (const row of invoices ?? []) {
    if (row.clinic_id) clinicIds.add(row.clinic_id as string);
  }
  for (const row of payments ?? []) {
    if (row.clinic_id) clinicIds.add(row.clinic_id as string);
  }

  const tenantIds = [...new Set((messages ?? []).map((m) => m.tenant_id as string).filter(Boolean))];
  if (tenantIds.length) {
    const { data: tenantClinics } = await db
      .from('clinics')
      .select('id')
      .in('tenant_id', tenantIds)
      .eq('active', true);
    for (const row of tenantClinics ?? []) {
      clinicIds.add(row.id as string);
    }
  }

  if (!clinicIds.size) return [];

  const { data: clinics, error } = await db
    .from('clinics')
    .select('id, name, city, tenant_id, active')
    .in('id', [...clinicIds])
    .eq('active', true);
  if (error) throw error;

  const primaryId = profile.clinic_id as string | null;
  return (clinics ?? [])
    .map((c) => ({
      id: c.id as string,
      name: c.name as string,
      city: (c.city as string) || undefined,
      tenantId: c.tenant_id as string,
      isPrimary: c.id === primaryId
    }))
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return a.name.localeCompare(b.name, 'es');
    });
}

export async function assertPatientCanMessageClinic(patientProfileId: string, clinicId: string) {
  const linked = await listLinkedClinicsForPatient(patientProfileId);
  if (!linked.some((c) => c.id === clinicId)) {
    throw new Error('No puedes enviar mensajes a esta clínica. Selecciona una sede asociada a tu cuenta.');
  }
}
