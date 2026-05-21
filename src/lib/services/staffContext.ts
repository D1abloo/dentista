import type { SessionUser } from '@/lib/auth';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';

const STAFF_ROLES = new Set(['clinic_admin', 'admin', 'owner', 'dentist', 'receptionist']);

export type StaffContext = {
  profileId: string;
  clinicId: string;
  tenantId: string | null;
  role: string;
  fullName: string;
  email: string;
  dentistId: string | null;
  hasLinkedDentist: boolean;
  canAccessPatientPortal: boolean;
  agendaScope: 'own' | 'clinic';
};

export async function getStaffContextForSession(user: SessionUser): Promise<StaffContext | null> {
  if (!hasSupabaseConfig() || !user.profileId || !user.clinicId) return null;
  const role = user.staffRole ?? user.role;
  if (!STAFF_ROLES.has(role) && user.role !== 'admin') return null;

  const db = getSupabaseAdmin();
  const { data: profile, error } = await db
    .from('profiles')
    .select('id, clinic_id, tenant_id, role, full_name, email')
    .eq('id', user.profileId)
    .maybeSingle();
  if (error || !profile) return null;

  const { data: dentist } = await db
    .from('dentists')
    .select('id, profile_id')
    .eq('profile_id', user.profileId)
    .eq('clinic_id', user.clinicId)
    .maybeSingle();

  const profileRole = String(profile.role);
  const dentistId = (dentist?.id as string | undefined) ?? null;
  const isDentist = profileRole === 'dentist';

  return {
    profileId: profile.id as string,
    clinicId: user.clinicId,
    tenantId: user.tenantId ?? (profile.tenant_id as string | null) ?? null,
    role: profileRole,
    fullName: profile.full_name as string,
    email: profile.email as string,
    dentistId,
    hasLinkedDentist: Boolean(dentistId),
    canAccessPatientPortal: Boolean(profile.id),
    agendaScope: isDentist && dentistId ? 'own' : 'clinic'
  };
}
