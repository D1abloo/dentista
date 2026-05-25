import type { SessionUser } from '@/lib/auth';
import type { ClinicProfileRow } from '@/lib/auth/profilePick';
import { isPatientActivated } from '@/lib/services/patientRegistration';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';
import { signInWithEmailPassword } from '@/lib/supabaseAuth';

const STAFF_ROLES = new Set(['admin', 'owner', 'clinic_admin', 'dentist', 'receptionist']);

export type PortalChoiceId = 'admin' | 'patient' | 'platform';

export type PortalChoiceOption = {
  id: PortalChoiceId;
  label: string;
  description: string;
  href: string;
};

export type AuthenticatedIdentity = {
  authUserId: string;
  email: string;
  profiles: ClinicProfileRow[];
};

export async function authenticateCredentials(
  email: string,
  password: string
): Promise<AuthenticatedIdentity | null> {
  const { data: authData, error } = await signInWithEmailPassword(email, password);
  if (error || !authData.user) return null;

  const admin = getSupabaseAdmin();
  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select(
      'id, clinic_id, tenant_id, role, full_name, email, must_change_password, password_expires_at, activated_at'
    )
    .eq('auth_user_id', authData.user.id);

  if (profileError) return null;

  return {
    authUserId: authData.user.id,
    email,
    profiles: (profiles ?? []) as ClinicProfileRow[]
  };
}

async function clinicIsActive(clinicId: string) {
  const admin = getSupabaseAdmin();
  const { data: clinic } = await admin.from('clinics').select('id, status').eq('id', clinicId).maybeSingle();
  return Boolean(clinic?.status === 'active');
}

export async function listPortalChoices(identity: AuthenticatedIdentity): Promise<PortalChoiceOption[]> {
  const admin = getSupabaseAdmin();
  const options: PortalChoiceOption[] = [];

  const { data: platformRow } = await admin
    .from('platform_admins')
    .select('id')
    .eq('auth_user_id', identity.authUserId)
    .eq('active', true)
    .maybeSingle();

  if (platformRow) {
    options.push({
      id: 'platform',
      label: 'Plataforma Dentista+',
      description: 'Super administración SaaS, clínicas y soporte',
      href: '/platform'
    });
  }

  const staff = identity.profiles.filter((p) => STAFF_ROLES.has(p.role));
  const patients = identity.profiles.filter((p) => p.role === 'patient' && isPatientActivated(p));

  if (platformRow) {
    options.push({
      id: 'admin',
      label: 'Panel administrativo',
      description: 'Acceso a todas las clínicas activas de la plataforma',
      href: '/admin/elegir-centro'
    });
  }

  for (const profile of staff) {
    if (!(await clinicIsActive(profile.clinic_id))) continue;
    if (options.some((o) => o.id === 'admin')) continue;
    options.push({
      id: 'admin',
      label: 'Panel administrativo',
      description: 'Agenda, pacientes, facturación y configuración de la clínica',
      href: '/admin'
    });
    break;
  }

  for (const profile of patients) {
    if (!(await clinicIsActive(profile.clinic_id))) continue;
    if (options.some((o) => o.id === 'patient')) continue;
    options.push({
      id: 'patient',
      label: 'Portal del paciente',
      description: 'Tus citas, documentos clínicos y pagos',
      href: '/paciente'
    });
    break;
  }

  return options;
}

export function filterChoicesForClinicLogin(options: PortalChoiceOption[]) {
  return options.filter((o) => o.id === 'admin' || o.id === 'patient');
}

const PROFILE_SELECT =
  'id, clinic_id, tenant_id, role, full_name, email, must_change_password, password_expires_at, activated_at';

/** Perfiles Supabase vinculados a la sesión actual (sin volver a pedir contraseña). */
export async function getIdentityFromSession(user: SessionUser): Promise<AuthenticatedIdentity | null> {
  if (!hasSupabaseConfig()) return null;

  const admin = getSupabaseAdmin();
  const email = user.email.trim().toLowerCase();
  let authUserId: string | null = null;

  if (user.profileId) {
    const { data } = await admin.from('profiles').select('auth_user_id').eq('id', user.profileId).maybeSingle();
    authUserId = (data?.auth_user_id as string | undefined) ?? null;
  }

  if (!authUserId) {
    const { data: platformRow } = await admin
      .from('platform_admins')
      .select('auth_user_id')
      .eq('email', email)
      .eq('active', true)
      .maybeSingle();
    authUserId = (platformRow?.auth_user_id as string | undefined) ?? null;
  }

  if (!authUserId) {
    const { data: byEmail } = await admin
      .from('profiles')
      .select('auth_user_id')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();
    authUserId = (byEmail?.auth_user_id as string | undefined) ?? null;
  }

  if (!authUserId) return null;

  const { data: profiles, error } = await admin
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('auth_user_id', authUserId);

  if (error) return null;

  return {
    authUserId,
    email: user.email,
    profiles: (profiles ?? []) as ClinicProfileRow[]
  };
}

/** Portales disponibles para el botón «Entrar» con sesión ya iniciada. */
export async function listEnterPortalChoices(user: SessionUser): Promise<PortalChoiceOption[]> {
  const identity = await getIdentityFromSession(user);
  if (!identity) return [];
  return listPortalChoices(identity);
}
