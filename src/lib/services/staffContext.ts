import type { SessionUser } from '@/lib/auth';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';

const STAFF_ROLES = new Set(['clinic_admin', 'admin', 'owner', 'dentist', 'receptionist']);
const BLOCK_MANAGER_ROLES = new Set(['clinic_admin', 'admin', 'owner', 'receptionist']);

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
  /** Clínicas independientes donde el usuario tiene perfil staff. */
  assignedClinicIds: string[];
  /** Administración / recepción: puede gestionar bloqueos de toda la sede. */
  canManageBlocks: boolean;
};

/** Clínicas donde el usuario tiene perfil staff (cada una con su propio tenant). */
export async function listAssignedClinicIdsForSession(user: SessionUser): Promise<string[]> {
  if (!user.profileId) return user.clinicId ? [user.clinicId] : [];
  const db = getSupabaseAdmin();
  const { data: anchor } = await db
    .from('profiles')
    .select('auth_user_id')
    .eq('id', user.profileId)
    .maybeSingle();
  if (!anchor?.auth_user_id) return user.clinicId ? [user.clinicId] : [];

  const { data: rows } = await db
    .from('profiles')
    .select('clinic_id, role')
    .eq('auth_user_id', anchor.auth_user_id as string);

  const ids = (rows ?? [])
    .filter((r) => STAFF_ROLES.has(String(r.role)) && r.clinic_id)
    .map((r) => r.clinic_id as string);
  const unique = [...new Set(ids)];
  return unique.length ? unique : user.clinicId ? [user.clinicId] : [];
}

async function listAssignedClinicIds(user: SessionUser): Promise<string[]> {
  return listAssignedClinicIdsForSession(user);
}

function syntheticClinicAdminContext(user: SessionUser, assignedClinicIds: string[]): StaffContext {
  return {
    profileId: user.profileId ?? '',
    clinicId: user.clinicId as string,
    tenantId: user.tenantId ?? null,
    role: 'clinic_admin',
    fullName: user.name ?? user.email,
    email: user.email,
    dentistId: null,
    hasLinkedDentist: false,
    canAccessPatientPortal: false,
    agendaScope: 'clinic',
    assignedClinicIds,
    canManageBlocks: true
  };
}

export async function getStaffContextForSession(user: SessionUser): Promise<StaffContext | null> {
  if (!hasSupabaseConfig() || !user.clinicId) return null;

  const assignedClinicIds = await listAssignedClinicIdsForSession(user);

  if (user.role === 'super_admin' || user.role === 'admin') {
    return syntheticClinicAdminContext(user, assignedClinicIds.length ? assignedClinicIds : [user.clinicId]);
  }

  if (!user.profileId) return null;
  const role = user.staffRole ?? user.role;
  if (!STAFF_ROLES.has(role)) return null;

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
  const canManageBlocks = BLOCK_MANAGER_ROLES.has(profileRole) || user.role === 'admin';

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
    agendaScope: isDentist && dentistId ? 'own' : 'clinic',
    assignedClinicIds,
    canManageBlocks
  };
}
