import { isClinicProfileManager } from '@/lib/services/clinicalProfessionals';

export { isClinicProfileManager };
import { getStaffContextForSession } from '@/lib/services/staffContext';
import type { SessionUser } from '@/lib/auth';
import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from '@/lib/supabaseServer';

export type DentistProfileInput = {
  clinicId: string;
  dentistId: string;
  fullName: string;
  specialty: string;
  collegiateNumber: string;
  email?: string;
  phone?: string;
};

export async function updateDentistProfileRecord(
  user: SessionUser,
  input: DentistProfileInput
): Promise<Record<string, unknown>> {
  if (isDemoMode() || !hasSupabaseConfig()) {
    throw new Error('Modo demo: guarda desde el panel sin API.');
  }

  const role = user.staffRole ?? user.role;
  const staffCtx = await getStaffContextForSession(user);
  const isManager = isClinicProfileManager(role) || user.role === 'admin';

  if (!isManager) {
    if (role !== 'dentist' || !staffCtx?.dentistId) {
      throw new Error('Solo puedes editar tu propio perfil profesional.');
    }
    if (staffCtx.dentistId !== input.dentistId) {
      throw new Error('No puedes modificar el perfil de otro profesional.');
    }
  }

  const db = getSupabaseAdmin();
  const { data: existing, error: readErr } = await db
    .from('dentists')
    .select('id, clinic_id, profile_id')
    .eq('id', input.dentistId)
    .maybeSingle();
  if (readErr || !existing) throw new Error('Profesional no encontrado.');
  if (existing.clinic_id !== input.clinicId) {
    throw new Error('El profesional no pertenece a esta clínica.');
  }

  const patch: Record<string, unknown> = {
    name: input.fullName.trim(),
    specialty: input.specialty.trim() || 'Odontología general',
    collegiate_number: input.collegiateNumber.trim(),
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null
  };

  const { data, error } = await db
    .from('dentists')
    .update(patch)
    .eq('id', input.dentistId)
    .eq('clinic_id', input.clinicId)
    .select('*')
    .single();
  if (error) throw error;

  if (existing.profile_id) {
    await db
      .from('profiles')
      .update({ full_name: input.fullName.trim() })
      .eq('id', existing.profile_id as string);
  }

  return data as Record<string, unknown>;
}
