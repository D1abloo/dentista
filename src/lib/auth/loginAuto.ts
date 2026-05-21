import type { SessionUser } from '@/lib/auth';
import { AccountNotActivatedError } from '@/lib/auth/accountErrors';
import { evaluatePasswordStatus } from '@/lib/auth/passwordPolicy';
import { loginPlatformAdmin } from '@/lib/auth/productionLogin';
import { pickProfileForLogin, type ClinicProfileRow } from '@/lib/auth/profilePick';
import { isPatientActivated } from '@/lib/services/patientRegistration';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { signInWithEmailPassword } from '@/lib/supabaseAuth';

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

/** Inicio de sesión único: detecta paciente, personal de clínica o super admin de plataforma. */
export async function loginAutoDetect(
  email: string,
  password: string
): Promise<Omit<SessionUser, 'expiresAt'> | null> {
  const { data: authData, error } = await signInWithEmailPassword(email, password);
  if (error || !authData.user) return null;

  const admin = getSupabaseAdmin();
  const platform = await loginPlatformAdmin(admin, authData.user.id, email);
  if (platform) return platform;

  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select(
      'id, clinic_id, tenant_id, role, full_name, email, must_change_password, password_expires_at, activated_at'
    )
    .eq('auth_user_id', authData.user.id);

  if (profileError || !profiles?.length) return null;

  const row = pickProfileForLogin(profiles as ClinicProfileRow[], 'auto');
  if (!row) return null;
  if (row.role !== 'patient' && !STAFF_ROLES.has(row.role)) return null;
  if (!isPatientActivated(row)) throw new AccountNotActivatedError();

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
