import type { SessionUser } from '@/lib/auth';
import { AccountNotActivatedError } from '@/lib/auth/accountErrors';
import { evaluatePasswordStatus } from '@/lib/auth/passwordPolicy';
import { pickProfileForLogin, type ClinicProfileRow } from '@/lib/auth/profilePick';
import { isPatientActivated } from '@/lib/services/patientRegistration';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { signInWithEmailPassword } from '@/lib/supabaseAuth';
import type { LoginInput } from '@/lib/validators';

const STAFF_ROLES = new Set(['admin', 'owner', 'clinic_admin', 'dentist', 'receptionist']);

function toPortalSession(profile: ClinicProfileRow): Omit<SessionUser, 'expiresAt'> {
  const isPatient = profile.role === 'patient';
  const pwd = evaluatePasswordStatus(profile);
  return {
    role: isPatient ? 'patient' : 'admin',
    email: profile.email,
    name: profile.full_name,
    profileId: profile.id,
    clinicId: profile.clinic_id,
    tenantId: profile.tenant_id ?? undefined,
    patientId: isPatient ? profile.id : undefined,
    staffRole: profile.role,
    mustChangePassword: pwd.requiresPasswordChange,
    passwordExpired: pwd.passwordExpired
  };
}

export async function loginPlatformAdmin(
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
  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select(
      'id, clinic_id, tenant_id, role, full_name, email, must_change_password, password_expires_at, activated_at'
    )
    .eq('auth_user_id', authData.user.id);

  if (profileError || !profiles?.length) return null;

  const intent = input.role === 'auto' ? 'auto' : input.role === 'patient' ? 'patient' : 'admin';
  const row = pickProfileForLogin(profiles as ClinicProfileRow[], intent);
  if (!row) return null;

  if (input.role === 'patient' && row.role !== 'patient') return null;
  if (input.role === 'patient' && !isPatientActivated(row)) throw new AccountNotActivatedError();
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
