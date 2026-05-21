import type { SessionUser } from '@/lib/auth';
import { AccountNotActivatedError } from '@/lib/auth/accountErrors';
import { evaluatePasswordStatus } from '@/lib/auth/passwordPolicy';
import { loginPlatformAdmin } from '@/lib/auth/productionLogin';
import { pickProfileForLogin, type ClinicProfileRow } from '@/lib/auth/profilePick';
import type { AuthenticatedIdentity, PortalChoiceId } from '@/lib/auth/portalChoices';
import { isPatientActivated } from '@/lib/services/patientRegistration';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

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

export async function completePortalLogin(
  identity: AuthenticatedIdentity,
  portal: PortalChoiceId
): Promise<Omit<SessionUser, 'expiresAt'> | null> {
  const admin = getSupabaseAdmin();

  if (portal === 'platform') {
    return loginPlatformAdmin(admin, identity.authUserId, identity.email);
  }

  const intent = portal === 'patient' ? 'patient' : 'admin';
  const row = pickProfileForLogin(identity.profiles, intent);
  if (!row) return null;
  if (row.role !== 'patient' && !STAFF_ROLES.has(row.role)) return null;
  if (!isPatientActivated(row)) throw new AccountNotActivatedError();

  const { data: clinic } = await admin.from('clinics').select('id, status, tenant_id').eq('id', row.clinic_id).maybeSingle();
  if (!clinic || clinic.status !== 'active') return null;

  const tenantId = row.tenant_id ?? clinic.tenant_id ?? null;

  await admin.auth.admin.updateUserById(identity.authUserId, {
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

export function displayNameFromIdentity(identity: AuthenticatedIdentity): string {
  return identity.profiles[0]?.full_name ?? identity.email;
}
