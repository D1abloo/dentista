import type { SessionUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { signInWithEmailPassword } from '@/lib/supabaseAuth';
import type { LoginInput } from '@/lib/validators';

const STAFF_ROLES = new Set(['admin', 'owner', 'clinic_admin', 'dentist', 'receptionist']);

type ProfileRow = {
  id: string;
  clinic_id: string;
  tenant_id: string | null;
  role: string;
  full_name: string;
  email: string;
};

function toPortalSession(profile: ProfileRow): Omit<SessionUser, 'expiresAt'> {
  const isPatient = profile.role === 'patient';
  return {
    role: isPatient ? 'patient' : 'admin',
    email: profile.email,
    name: profile.full_name,
    clinicId: profile.clinic_id,
    tenantId: profile.tenant_id ?? undefined,
    patientId: isPatient ? profile.id : undefined,
    staffRole: profile.role
  };
}

async function loginPlatformAdmin(
  admin: ReturnType<typeof getSupabaseAdmin>,
  authUserId: string,
  fallbackEmail: string
): Promise<Omit<SessionUser, 'expiresAt'> | null> {
  const { data: row } = await admin
    .from('platform_admins')
    .select('email, full_name, active')
    .eq('auth_user_id', authUserId)
    .eq('active', true)
    .maybeSingle();
  if (!row) return null;
  await admin.auth.admin.updateUserById(authUserId, {
    app_metadata: { role: 'super_admin' }
  });
  return {
    role: 'super_admin',
    email: row.email ?? fallbackEmail,
    name: row.full_name ?? 'Super Admin'
  };
}

export async function loginWithSupabaseProfile(
  input: LoginInput
): Promise<Omit<SessionUser, 'expiresAt'> | null> {
  const { data: authData, error } = await signInWithEmailPassword(input.email, input.password);
  if (error || !authData.user) return null;

  const admin = getSupabaseAdmin();

  if (input.role === 'super_admin') {
    return loginPlatformAdmin(admin, authData.user.id, input.email);
  }
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, clinic_id, tenant_id, role, full_name, email')
    .eq('auth_user_id', authData.user.id)
    .maybeSingle();

  if (profileError || !profile) return null;

  const row = profile as ProfileRow;

  if (input.role === 'patient' && row.role !== 'patient') return null;
  if (input.role === 'admin' && !STAFF_ROLES.has(row.role)) return null;

  const { data: clinic } = await admin.from('clinics').select('id, status, tenant_id').eq('id', row.clinic_id).maybeSingle();
  if (!clinic || clinic.status !== 'active') return null;

  const tenantId = row.tenant_id ?? clinic.tenant_id ?? null;

  await admin.auth.admin.updateUserById(authData.user.id, {
    app_metadata: {
      clinic_id: row.clinic_id,
      role: row.role,
      tenant_id: tenantId
    }
  });

  if (!row.tenant_id && tenantId) {
    await admin.from('profiles').update({ tenant_id: tenantId }).eq('id', row.id);
  }

  return toPortalSession({ ...row, tenant_id: tenantId });
}
