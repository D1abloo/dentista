import { loginDemoUser } from '@/lib/auth';
import { authenticateCredentials } from '@/lib/auth/portalChoices';
import { pickProfileForLogin } from '@/lib/auth/profilePick';
import { resolveProductionLogin } from '@/lib/auth/loginResolve';
import { isPortalChoiceLogin, type LoginProductionResult } from '@/lib/auth/loginResolve';
import { hasSupabaseConfig, getSupabaseAdmin } from '@/lib/supabaseServer';
import type { LoginInput } from '@/lib/validators';

const STAFF_ROLES = new Set(['admin', 'owner', 'clinic_admin', 'dentist', 'receptionist']);

export async function loginClinicAdminOnly(input: LoginInput): Promise<LoginProductionResult | null> {
  if (input.role !== 'admin') return null;

  const demo = loginDemoUser(input);
  if (demo) return demo;

  if (!hasSupabaseConfig()) return null;

  return resolveProductionLogin({ ...input, role: 'admin' });
}

export type ClinicLoginDenialReason = 'invalid_credentials' | 'not_clinic_staff' | 'platform_only';

export async function detectClinicLoginDenial(
  email: string,
  password: string
): Promise<ClinicLoginDenialReason> {
  if (!hasSupabaseConfig()) return 'invalid_credentials';

  const identity = await authenticateCredentials(email, password);
  if (!identity) return 'invalid_credentials';

  const admin = getSupabaseAdmin();
  const { data: platformRow } = await admin
    .from('platform_admins')
    .select('id')
    .eq('auth_user_id', identity.authUserId)
    .eq('active', true)
    .maybeSingle();

  const staffProfile = pickProfileForLogin(identity.profiles, 'admin');
  const hasStaff =
    Boolean(staffProfile && STAFF_ROLES.has(staffProfile.role)) ||
    identity.profiles.some((p) => STAFF_ROLES.has(p.role));

  if (platformRow && !hasStaff) return 'platform_only';

  const patientOnly =
    identity.profiles.length > 0 &&
    identity.profiles.every((p) => p.role === 'patient') &&
    !hasStaff;

  if (patientOnly || (!hasStaff && !platformRow)) return 'not_clinic_staff';

  return 'invalid_credentials';
}

export { isPortalChoiceLogin };
