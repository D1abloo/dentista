import type { SessionUser } from '@/lib/auth';
import { evaluatePasswordStatus } from '@/lib/auth/passwordPolicy';
import type { ClinicProfileRow } from '@/lib/auth/profilePick';
import { listEnterPortalChoices } from '@/lib/auth/portalChoices';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';
import {
  isPlatformAppAdminSession,
  switchPlatformAdminToClinic
} from '@/lib/auth/platformClinicAccess';
import { postLoginPathForUser } from '@/lib/auth/sessionPortal';
import { listAssignedClinicIdsForSession } from '@/lib/services/staffContext';

const STAFF_ROLES = new Set(['admin', 'owner', 'clinic_admin', 'dentist', 'receptionist']);

export type AssignedCenter = {
  clinicId: string;
  tenantId: string;
  name: string;
  city: string | null;
  address: string | null;
  profileId: string;
  staffRole: string;
  isCurrent: boolean;
};

function toPortalSession(profile: ClinicProfileRow): Omit<SessionUser, 'expiresAt'> {
  const pwd = evaluatePasswordStatus(profile);
  return {
    role: 'admin',
    email: profile.email,
    name: profile.full_name,
    profileId: profile.id,
    clinicId: profile.clinic_id,
    tenantId: profile.tenant_id ?? undefined,
    staffRole: profile.role,
    mustChangePassword: pwd.requiresPasswordChange,
    passwordExpired: pwd.passwordExpired,
    sessionPortal: 'clinic'
  };
}

async function authUserIdForSession(user: Omit<SessionUser, 'expiresAt'>): Promise<string | null> {
  const db = getSupabaseAdmin();
  if (user.profileId) {
    const { data } = await db.from('profiles').select('auth_user_id').eq('id', user.profileId).maybeSingle();
    if (data?.auth_user_id) return data.auth_user_id as string;
  }
  if (user.role === 'super_admin' || (await isPlatformAppAdminSession(user))) {
    const { data } = await db
      .from('platform_admins')
      .select('auth_user_id')
      .eq('email', user.email.trim().toLowerCase())
      .eq('active', true)
      .maybeSingle();
    if (data?.auth_user_id) return data.auth_user_id as string;
  }
  const { data: byEmail } = await db
    .from('profiles')
    .select('auth_user_id')
    .ilike('email', user.email.trim())
    .limit(1)
    .maybeSingle();
  return (byEmail?.auth_user_id as string | undefined) ?? null;
}

/** Centros clínicos independientes donde el usuario tiene perfil staff. */
export async function listAssignedCenters(user: Omit<SessionUser, 'expiresAt'>): Promise<AssignedCenter[]> {
  if (!hasSupabaseConfig()) return [];
  if (user.role !== 'admin' && user.role !== 'super_admin') return [];

  if (await isPlatformAppAdminSession(user)) {
    return listAllActiveCentersForPlatformAdmin(user);
  }

  let clinicIds = await listAssignedClinicIdsForSession(user);
  if (!clinicIds.length) {
    if (user.clinicId) clinicIds = [user.clinicId];
    else return [];
  }

  const db = getSupabaseAdmin();
  const authUserId = await authUserIdForSession(user);

  const [{ data: clinics }, { data: profiles }] = await Promise.all([
    db
      .from('clinics')
      .select('id, tenant_id, name, city, address, status')
      .in('id', clinicIds)
      .eq('status', 'active'),
    authUserId
      ? db
          .from('profiles')
          .select('id, clinic_id, tenant_id, role, full_name, email')
          .eq('auth_user_id', authUserId)
          .in('clinic_id', clinicIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] })
  ]);

  const profileByClinic = new Map<string, ClinicProfileRow>();
  for (const row of profiles ?? []) {
    const role = String(row.role);
    if (!STAFF_ROLES.has(role) || !row.clinic_id) continue;
    profileByClinic.set(row.clinic_id as string, row as ClinicProfileRow);
  }

  return (clinics ?? [])
    .map((c) => {
      const profile = profileByClinic.get(c.id as string);
      if (!profile) return null;
      const tenantId = (c.tenant_id as string | null) ?? profile.tenant_id ?? '';
      return {
        clinicId: c.id as string,
        tenantId,
        name: c.name as string,
        city: (c.city as string | null) ?? null,
        address: (c.address as string | null) ?? null,
        profileId: profile.id,
        staffRole: profile.role,
        isCurrent: user.clinicId === c.id
      } satisfies AssignedCenter;
    })
    .filter((c): c is AssignedCenter => Boolean(c))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

async function listAllActiveCentersForPlatformAdmin(
  user: Omit<SessionUser, 'expiresAt'>
): Promise<AssignedCenter[]> {
  const db = getSupabaseAdmin();
  const authUserId = await authUserIdForSession(user);

  const { data: clinics } = await db
    .from('clinics')
    .select('id, tenant_id, name, city, address, status')
    .eq('status', 'active')
    .order('name');

  const clinicIds = (clinics ?? []).map((c) => c.id as string);
  const profileByClinic = new Map<string, ClinicProfileRow>();

  if (authUserId && clinicIds.length) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, clinic_id, tenant_id, role, full_name, email')
      .eq('auth_user_id', authUserId)
      .in('clinic_id', clinicIds);

    for (const row of profiles ?? []) {
      const role = String(row.role);
      if (!STAFF_ROLES.has(role) || !row.clinic_id) continue;
      profileByClinic.set(row.clinic_id as string, row as ClinicProfileRow);
    }
  }

  return (clinics ?? []).map((c) => {
    const profile = profileByClinic.get(c.id as string);
    const tenantId = (c.tenant_id as string | null) ?? profile?.tenant_id ?? '';
    return {
      clinicId: c.id as string,
      tenantId,
      name: c.name as string,
      city: (c.city as string | null) ?? null,
      address: (c.address as string | null) ?? null,
      profileId: profile?.id ?? '',
      staffRole: profile?.role ?? 'super_admin',
      isCurrent: Boolean(user.clinicId === c.id || (user.platformInspect && user.clinicId === c.id))
    } satisfies AssignedCenter;
  });
}

export type PlatformClinicSwitchResult = {
  mode: 'inspect';
  inspectCookie: string;
  clinicId: string;
  clinicName: string;
};

/** Cambia la sesión al centro clínico indicado (perfil staff aislado por clínica). */
export async function switchSessionToClinic(
  user: SessionUser,
  clinicId: string
): Promise<Omit<SessionUser, 'expiresAt'> | PlatformClinicSwitchResult | null> {
  if (!hasSupabaseConfig()) return null;
  if (user.role !== 'admin' && user.role !== 'super_admin') return null;

  if (await isPlatformAppAdminSession(user)) {
    const inspect = await switchPlatformAdminToClinic(user, clinicId);
    if (!inspect) return null;
    const assigned = await listAllActiveCentersForPlatformAdmin(user);
    if (!assigned.some((c) => c.clinicId === clinicId)) return null;
    return {
      mode: 'inspect',
      inspectCookie: inspect.inspectCookie,
      clinicId,
      clinicName: inspect.clinicName
    };
  }

  if (user.platformInspect) return null;

  const assigned = await listAssignedClinicIdsForSession(user);
  if (!assigned.includes(clinicId)) return null;

  const authUserId = await authUserIdForSession(user);
  if (!authUserId) return null;

  const db = getSupabaseAdmin();
  const { data: profile } = await db
    .from('profiles')
    .select(
      'id, clinic_id, tenant_id, role, full_name, email, must_change_password, password_expires_at, activated_at'
    )
    .eq('auth_user_id', authUserId)
    .eq('clinic_id', clinicId)
    .maybeSingle();

  if (!profile || !STAFF_ROLES.has(String(profile.role))) return null;

  const { data: clinic } = await db.from('clinics').select('id, status, tenant_id').eq('id', clinicId).maybeSingle();
  if (!clinic || clinic.status !== 'active') return null;

  const tenantId = (profile.tenant_id as string | null) ?? (clinic.tenant_id as string | null) ?? null;

  await db.auth.admin.updateUserById(authUserId, {
    app_metadata: {
      clinic_id: clinicId,
      role: profile.role,
      tenant_id: tenantId
    }
  });

  if (!profile.tenant_id && tenantId) {
    await db.from('profiles').update({ tenant_id: tenantId }).eq('id', profile.id);
  }

  return toPortalSession({ ...(profile as ClinicProfileRow), tenant_id: tenantId });
}

export async function resolveEnterDestination(user: SessionUser | null): Promise<string> {
  if (!user) return '/login';
  if (user.mustChangePassword || user.passwordExpired) {
    return user.passwordExpired ? '/login/cambiar-password?expired=1' : '/login/cambiar-password';
  }

  if (hasSupabaseConfig() && !user.platformInspect) {
    const portalChoices = await listEnterPortalChoices(user);
    if (portalChoices.length > 1) return '/entrada/elegir-portal';
  }

  if (user.role === 'patient') return '/paciente';
  if (user.role === 'super_admin' && !user.platformInspect) {
    if (user.sessionPortal === 'clinic') {
      return postLoginPathForUser(user, { preferAdmin: true });
    }
    return postLoginPathForUser(user, { preferAdmin: false });
  }
  if (user.role === 'admin' || (user.role === 'super_admin' && user.platformInspect)) {
    return postLoginPathForUser(user, { preferAdmin: true });
  }
  return '/login';
}

export async function resolvePortalSwitchDestination(user: Omit<SessionUser, 'expiresAt'>): Promise<string> {
  if (user.mustChangePassword || user.passwordExpired) {
    return user.passwordExpired ? '/login/cambiar-password?expired=1' : '/login/cambiar-password';
  }
  if (user.role === 'patient') return '/paciente';
  if (user.role === 'super_admin' && !user.platformInspect) {
    if (user.sessionPortal === 'clinic') {
      return postLoginPathForUser(user, { preferAdmin: true });
    }
    return postLoginPathForUser(user, { preferAdmin: false });
  }
  if (user.role === 'admin' || (user.role === 'super_admin' && user.platformInspect)) {
    return postLoginPathForUser(user, { preferAdmin: true });
  }
  return '/login';
}

export async function resolvePostLoginAdminDestination(user: Omit<SessionUser, 'expiresAt'>): Promise<string> {
  if (user.mustChangePassword || user.passwordExpired) {
    return user.passwordExpired ? '/login/cambiar-password?expired=1' : '/login/cambiar-password';
  }
  const centers = await listAssignedCenters(user);
  if (centers.length === 0) return '/login/admin';
  if (centers.length <= 1 && !(await isPlatformAppAdminSession(user))) return '/admin';
  return '/admin/elegir-centro?auto=1';
}
