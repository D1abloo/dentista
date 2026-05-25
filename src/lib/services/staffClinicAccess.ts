import { isPlatformAppAdminSession } from '@/lib/auth/platformClinicAccess';
import type { SessionUser } from '@/lib/auth';
import type { ClinicUserRow } from '@/lib/services/clinicUsers';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';

const STAFF_ROLES = new Set(['clinic_admin', 'admin', 'owner', 'dentist', 'receptionist']);

export type ClinicAccessRow = {
  clinicId: string;
  clinicName: string;
  city: string | null;
  organizationName: string | null;
  profileId: string;
  role: string;
  isCurrent: boolean;
};

export type StaffUserAccessRow = {
  authUserId: string;
  fullName: string;
  email: string;
  clinics: ClinicAccessRow[];
};

export type AssignableClinic = {
  id: string;
  name: string;
  city: string | null;
  organizationName: string | null;
  alreadyAssigned: boolean;
};

function requireDb() {
  if (!hasSupabaseConfig()) throw new Error('Servicio no disponible.');
  return getSupabaseAdmin();
}

async function listClinicIdsInOrganization(organizationId: string): Promise<string[]> {
  const db = requireDb();
  const { data } = await db.from('clinics').select('id').eq('organization_id', organizationId).eq('status', 'active');
  return (data ?? []).map((r) => r.id as string);
}

/** Clínicas que el gestor puede asignar a otros usuarios. */
export async function listAssignableClinicsForManager(
  user: SessionUser,
  assignedAuthUserId?: string
): Promise<AssignableClinic[]> {
  const db = requireDb();
  const currentClinicId = user.clinicId;
  if (!currentClinicId && !(await isPlatformAppAdminSession(user))) return [];

  let clinicIds: string[] = [];

  if (await isPlatformAppAdminSession(user)) {
    const { data } = await db.from('clinics').select('id').eq('status', 'active');
    clinicIds = (data ?? []).map((r) => r.id as string);
  } else {
    const { data: current } = await db
      .from('clinics')
      .select('id, organization_id')
      .eq('id', currentClinicId)
      .maybeSingle();

    if (current?.organization_id) {
      clinicIds = await listClinicIdsInOrganization(current.organization_id as string);
    } else if (user.profileId) {
      const authId = await authUserIdFromProfile(user.profileId);
      if (authId) {
        const { data: rows } = await db
          .from('profiles')
          .select('clinic_id')
          .eq('auth_user_id', authId)
          .in('role', [...STAFF_ROLES]);
        clinicIds = [...new Set((rows ?? []).map((r) => r.clinic_id as string))];
      }
      if (!clinicIds.length && currentClinicId) clinicIds = [currentClinicId];
    } else if (currentClinicId) {
      clinicIds = [currentClinicId];
    }
  }

  if (!clinicIds.length) return [];

  const { data: clinics } = await db
    .from('clinics')
    .select('id, name, city, organization_id, organization_groups(name)')
    .in('id', clinicIds)
    .eq('status', 'active')
    .order('name');

  let existing = new Set<string>();
  if (assignedAuthUserId) {
    const { data: profs } = await db
      .from('profiles')
      .select('clinic_id')
      .eq('auth_user_id', assignedAuthUserId)
      .in('role', [...STAFF_ROLES]);
    existing = new Set((profs ?? []).map((p) => p.clinic_id as string));
  }

  return (clinics ?? []).map((c) => {
    const org = c.organization_groups as { name?: string } | null;
    return {
      id: c.id as string,
      name: c.name as string,
      city: (c.city as string | null) ?? null,
      organizationName: org?.name ?? null,
      alreadyAssigned: existing.has(c.id as string)
    };
  });
}

async function authUserIdFromProfile(profileId: string): Promise<string | null> {
  const db = requireDb();
  const { data } = await db.from('profiles').select('auth_user_id').eq('id', profileId).maybeSingle();
  return (data?.auth_user_id as string | undefined) ?? null;
}

export async function listStaffUsersWithClinicAccess(
  user: SessionUser,
  scopeClinicId: string
): Promise<StaffUserAccessRow[]> {
  const db = requireDb();
  const { data: scopeClinic } = await db
    .from('clinics')
    .select('id, organization_id, tenant_id')
    .eq('id', scopeClinicId)
    .maybeSingle();

  let profileQuery = db
    .from('profiles')
    .select('id, auth_user_id, clinic_id, role, full_name, email')
    .in('role', [...STAFF_ROLES]);

  const assignableIds = (await listAssignableClinicsForManager(user)).map((c) => c.id);
  const filterIds = assignableIds.length ? assignableIds : [scopeClinicId];
  profileQuery = profileQuery.in('clinic_id', filterIds);

  const { data: profiles, error } = await profileQuery;
  if (error) throw error;

  const byAuth = new Map<string, typeof profiles>();
  for (const p of profiles ?? []) {
    const aid = p.auth_user_id as string | null;
    if (!aid) continue;
    const list = byAuth.get(aid) ?? [];
    list.push(p);
    byAuth.set(aid, list);
  }

  const clinicIds = [...new Set((profiles ?? []).map((p) => p.clinic_id as string))];
  const { data: clinics } = clinicIds.length
    ? await db
        .from('clinics')
        .select('id, name, city, organization_groups(name)')
        .in('id', clinicIds)
    : { data: [] };

  const clinicMap = new Map(
    (clinics ?? []).map((c) => {
      const org = c.organization_groups as { name?: string } | null;
      return [
        c.id as string,
        {
          name: c.name as string,
          city: (c.city as string | null) ?? null,
          organizationName: org?.name ?? null
        }
      ];
    })
  );

  const rows: StaffUserAccessRow[] = [];
  for (const [authUserId, profs] of byAuth) {
    const first = profs[0]!;
    rows.push({
      authUserId,
      fullName: first.full_name as string,
      email: first.email as string,
      clinics: profs.map((p) => {
        const meta = clinicMap.get(p.clinic_id as string);
        return {
          clinicId: p.clinic_id as string,
          clinicName: meta?.name ?? 'Clínica',
          city: meta?.city ?? null,
          organizationName: meta?.organizationName ?? null,
          profileId: p.id as string,
          role: p.role as string,
          isCurrent: user.clinicId === p.clinic_id
        };
      })
    });
  }

  return rows.sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'));
}

export async function grantStaffClinicAccess(input: {
  manager: SessionUser;
  authUserId: string;
  targetClinicId: string;
  role: string;
  specialty?: string;
  collegiateNumber?: string;
}) {
  const db = requireDb();
  if (!STAFF_ROLES.has(input.role)) throw new Error('Rol no válido.');

  const assignable = await listAssignableClinicsForManager(input.manager, input.authUserId);
  if (!assignable.some((c) => c.id === input.targetClinicId)) {
    throw new Error('No puedes asignar acceso a esa clínica.');
  }

  const { data: existing } = await db
    .from('profiles')
    .select('id')
    .eq('auth_user_id', input.authUserId)
    .eq('clinic_id', input.targetClinicId)
    .in('role', [...STAFF_ROLES])
    .maybeSingle();

  if (existing?.id) throw new Error('El usuario ya tiene acceso a esa clínica.');

  const { data: anchor } = await db
    .from('profiles')
    .select('email, full_name')
    .eq('auth_user_id', input.authUserId)
    .limit(1)
    .maybeSingle();

  if (!anchor) throw new Error('Usuario no encontrado.');

  const { data: clinic } = await db
    .from('clinics')
    .select('id, tenant_id, status')
    .eq('id', input.targetClinicId)
    .maybeSingle();
  if (!clinic || clinic.status !== 'active') throw new Error('Clínica no disponible.');

  const { data: profile, error: profileErr } = await db
    .from('profiles')
    .insert({
      auth_user_id: input.authUserId,
      clinic_id: input.targetClinicId,
      tenant_id: clinic.tenant_id,
      role: input.role,
      full_name: anchor.full_name,
      email: anchor.email
    })
    .select('id, role, email, full_name, clinic_id, created_at')
    .single();
  if (profileErr) throw profileErr;

  if (input.role === 'dentist') {
    await db.from('dentists').insert({
      clinic_id: input.targetClinicId,
      profile_id: profile.id,
      name: anchor.full_name,
      specialty: input.specialty ?? 'General',
      collegiate_number: input.collegiateNumber?.trim() || `COL-${profile.id.slice(0, 8)}`,
      email: anchor.email,
      active: true
    });
  }

  const grantedBy = input.manager.profileId ?? null;
  await db.from('staff_clinic_assignments').upsert(
    {
      auth_user_id: input.authUserId,
      clinic_id: input.targetClinicId,
      profile_id: profile.id,
      role: input.role,
      granted_by: grantedBy,
      active: true
    },
    { onConflict: 'auth_user_id,clinic_id' }
  );

  return profile as ClinicUserRow;
}

export async function revokeStaffClinicAccess(input: {
  manager: SessionUser;
  profileId: string;
  scopeClinicId: string;
}) {
  const db = requireDb();
  const { data: target } = await db
    .from('profiles')
    .select('id, auth_user_id, clinic_id, role')
    .eq('id', input.profileId)
    .maybeSingle();

  if (!target?.auth_user_id) throw new Error('Perfil no encontrado.');
  if (target.clinic_id === input.scopeClinicId) {
    throw new Error('No puedes quitar el acceso a la clínica en la que estás conectado.');
  }

  const assignable = await listAssignableClinicsForManager(input.manager);
  if (!assignable.some((c) => c.id === target.clinic_id)) {
    throw new Error('No tienes permiso para revocar ese acceso.');
  }

  const { count } = await db
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('auth_user_id', target.auth_user_id as string)
    .in('role', [...STAFF_ROLES]);

  if ((count ?? 0) <= 1) throw new Error('El usuario debe conservar al menos un centro con acceso.');

  await db.from('dentists').delete().eq('profile_id', input.profileId);
  await db.from('staff_clinic_assignments').delete().eq('profile_id', input.profileId);
  const { error } = await db.from('profiles').delete().eq('id', input.profileId);
  if (error) throw error;

  return { revoked: true };
}
