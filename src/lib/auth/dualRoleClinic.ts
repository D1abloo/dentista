import type { SessionUser } from '@/lib/auth';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';

const STAFF_ROLES = new Set(['admin', 'owner', 'clinic_admin', 'dentist', 'receptionist']);

type StaffProfileRow = {
  id: string;
  clinic_id: string;
  tenant_id: string | null;
  role: string;
};

async function authUserIdForSession(user: SessionUser): Promise<string | null> {
  const db = getSupabaseAdmin();

  if (user.profileId) {
    const { data: profile } = await db
      .from('profiles')
      .select('auth_user_id')
      .eq('id', user.profileId)
      .maybeSingle();
    if (profile?.auth_user_id) return profile.auth_user_id as string;
  }

  const email = user.email.trim().toLowerCase();
  const { data: platformRow } = await db
    .from('platform_admins')
    .select('auth_user_id')
    .eq('email', email)
    .eq('active', true)
    .maybeSingle();
  if (platformRow?.auth_user_id) return platformRow.auth_user_id as string;

  const { data: byEmail } = await db
    .from('profiles')
    .select('auth_user_id')
    .ilike('email', email)
    .limit(1)
    .maybeSingle();
  return (byEmail?.auth_user_id as string | undefined) ?? null;
}

async function firstActiveStaffProfile(authUserId: string): Promise<StaffProfileRow | null> {
  const db = getSupabaseAdmin();
  const { data: staffRows } = await db
    .from('profiles')
    .select('id, clinic_id, tenant_id, role')
    .eq('auth_user_id', authUserId)
    .in('role', [...STAFF_ROLES]);

  for (const row of (staffRows ?? []) as StaffProfileRow[]) {
    const { data: clinic } = await db
      .from('clinics')
      .select('id, status, tenant_id')
      .eq('id', row.clinic_id)
      .maybeSingle();
    if (clinic?.status === 'active') {
      return {
        ...row,
        tenant_id: row.tenant_id ?? (clinic.tenant_id as string | null)
      };
    }
  }
  return null;
}

/** Super admin (u otro rol) con perfil staff: adjunta clinicId/profileId para el panel clínica. */
export async function enrichDualRoleClinicSession(user: SessionUser): Promise<SessionUser> {
  if (!hasSupabaseConfig()) return user;
  if (user.platformInspect || user.clinicId) return user;
  if (user.role !== 'super_admin' && user.role !== 'admin') return user;

  try {
    const authUserId = await authUserIdForSession(user);
    if (!authUserId) return user;

    const staff = await firstActiveStaffProfile(authUserId);
    if (!staff) return user;

    return {
      ...user,
      profileId: staff.id,
      clinicId: staff.clinic_id,
      tenantId: staff.tenant_id ?? undefined,
      staffRole: staff.role
    };
  } catch {
    return user;
  }
}
