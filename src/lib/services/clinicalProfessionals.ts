import type { SessionUser } from '@/lib/auth';
import { profileCompletionPercent } from '@/lib/clinical/professionalProfile';
import { dentistToRowPatch, mapDentistRow, type DentistRow } from '@/lib/records/dentistMapper';
import type { Dentist } from '@/types/demo';
import { getStaffContextForSession } from '@/lib/services/staffContext';
import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from '@/lib/supabaseServer';

const MANAGER_ROLES = new Set(['clinic_admin', 'admin', 'owner']);

export function isClinicProfileManager(role: string) {
  return MANAGER_ROLES.has(role);
}

async function resolveTenantId(clinicId: string): Promise<string> {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('clinics').select('tenant_id').eq('id', clinicId).maybeSingle();
  if (error || !data?.tenant_id) throw new Error('Clínica no encontrada.');
  return data.tenant_id as string;
}

async function assertCanEdit(
  user: SessionUser,
  clinicId: string,
  dentistId: string,
  allowCreate = false
): Promise<{ isManager: boolean; staffDentistId: string | null }> {
  const role = user.staffRole ?? user.role;
  const isManager = isClinicProfileManager(role) || user.role === 'admin';
  const staffCtx = await getStaffContextForSession(user);
  if (!isManager) {
    if (role !== 'dentist' || !staffCtx?.dentistId) {
      throw new Error('Solo puedes editar tu propio perfil profesional.');
    }
    if (!allowCreate && staffCtx.dentistId !== dentistId) {
      throw new Error('No puedes modificar el perfil de otro profesional.');
    }
  }
  return { isManager, staffDentistId: staffCtx?.dentistId ?? null };
}

export async function listClinicalProfessionals(clinicId: string): Promise<DentistRow[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('dentists')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('name');
  if (error) throw error;
  return (data ?? []) as DentistRow[];
}

export async function getClinicalProfessional(clinicId: string, dentistId: string): Promise<DentistRow | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('dentists')
    .select('*')
    .eq('id', dentistId)
    .eq('clinic_id', clinicId)
    .maybeSingle();
  if (error) throw error;
  return (data as DentistRow | null) ?? null;
}

export async function createClinicalProfessionalRecord(
  user: SessionUser,
  clinicId: string,
  dentist: Dentist
): Promise<DentistRow> {
  if (isDemoMode() || !hasSupabaseConfig()) throw new Error('Modo demo: crea desde el panel.');
  await assertCanEdit(user, clinicId, dentist.id, true);
  const tenantId = await resolveTenantId(clinicId);
  const db = getSupabaseAdmin();

  if (dentist.collegiateNumber?.trim()) {
    const { data: dup } = await db
      .from('dentists')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('collegiate_number', dentist.collegiateNumber.trim())
      .maybeSingle();
    if (dup) throw new Error('Ya existe un profesional con este nº de colegiado en la clínica.');
  }

  const row = {
    clinic_id: clinicId,
    ...dentistToRowPatch(dentist, tenantId),
    profile_id: dentist.profileId ?? null
  };

  const { data, error } = await db.from('dentists').insert(row).select('*').single();
  if (error) throw error;
  return data as DentistRow;
}

export async function updateClinicalProfessionalRecord(
  user: SessionUser,
  clinicId: string,
  dentist: Dentist
): Promise<DentistRow> {
  if (isDemoMode() || !hasSupabaseConfig()) throw new Error('Modo demo: guarda desde el panel.');
  await assertCanEdit(user, clinicId, dentist.id);

  const tenantId = await resolveTenantId(clinicId);
  const db = getSupabaseAdmin();

  if (dentist.collegiateNumber?.trim()) {
    const { data: dup } = await db
      .from('dentists')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('collegiate_number', dentist.collegiateNumber.trim())
      .neq('id', dentist.id)
      .maybeSingle();
    if (dup) throw new Error('Ya existe un profesional con este nº de colegiado en la clínica.');
  }

  const patch = dentistToRowPatch(dentist, tenantId);
  const { data, error } = await db
    .from('dentists')
    .update(patch)
    .eq('id', dentist.id)
    .eq('clinic_id', clinicId)
    .select('*')
    .single();
  if (error) throw error;

  if (dentist.profileId) {
    await db.from('profiles').update({ full_name: dentist.fullName.trim() }).eq('id', dentist.profileId);
  }

  return data as DentistRow;
}

export async function linkClinicalProfessionalUser(
  user: SessionUser,
  clinicId: string,
  dentistId: string,
  profileId: string
): Promise<DentistRow> {
  if (isDemoMode() || !hasSupabaseConfig()) throw new Error('Modo demo.');
  const { isManager } = await assertCanEdit(user, clinicId, dentistId, true);
  if (!isManager) throw new Error('Solo administración puede vincular usuarios.');

  const db = getSupabaseAdmin();
  const { data: profile, error: pErr } = await db
    .from('profiles')
    .select('id, clinic_id, full_name, email, role')
    .eq('id', profileId)
    .maybeSingle();
  if (pErr || !profile) throw new Error('Usuario no encontrado.');
  if (profile.clinic_id !== clinicId) throw new Error('El usuario no pertenece a esta clínica.');

  const { data: linked } = await db
    .from('dentists')
    .select('id, name')
    .eq('profile_id', profileId)
    .neq('id', dentistId)
    .maybeSingle();
  if (linked) throw new Error('Este usuario ya está vinculado a otro profesional.');

  const { data, error } = await db
    .from('dentists')
    .update({ profile_id: profileId, updated_at: new Date().toISOString() })
    .eq('id', dentistId)
    .eq('clinic_id', clinicId)
    .select('*')
    .single();
  if (error) throw error;
  return data as DentistRow;
}

export async function unlinkClinicalProfessionalUser(
  user: SessionUser,
  clinicId: string,
  dentistId: string
): Promise<DentistRow> {
  if (isDemoMode() || !hasSupabaseConfig()) throw new Error('Modo demo.');
  const { isManager } = await assertCanEdit(user, clinicId, dentistId, true);
  if (!isManager) throw new Error('Solo administración puede desvincular usuarios.');

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('dentists')
    .update({ profile_id: null, updated_at: new Date().toISOString() })
    .eq('id', dentistId)
    .eq('clinic_id', clinicId)
    .select('*')
    .single();
  if (error) throw error;
  return data as DentistRow;
}

export { mapDentistRow, profileCompletionPercent };
