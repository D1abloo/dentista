import type { SessionUser } from '@/lib/auth';
import { pickProfileForLogin } from '@/lib/auth/profilePick';
import { loginPlatformAdmin } from '@/lib/auth/productionLogin';
import type { AuthenticatedIdentity } from '@/lib/auth/portalChoices';
import { createPlatformInspectCookie } from '@/lib/auth/platformInspect';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';
import { logPlatformInspectEvent } from '@/lib/services/platformInspect';

function envSuperAdminEmail(): string | null {
  const configured = import.meta.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  return configured || null;
}

/** Cuenta SUPER_ADMIN_EMAIL del entorno (sin fila en platform_admins). */
export function isEnvSuperAdminEmail(email: string): boolean {
  const configured = envSuperAdminEmail();
  return Boolean(configured && email.trim().toLowerCase() === configured);
}

/** Super admin de plataforma (tabla platform_admins o SUPER_ADMIN_EMAIL). Puede entrar a cualquier clínica activa. */
export async function isPlatformAppAdminEmail(email: string): Promise<boolean> {
  if (isEnvSuperAdminEmail(email)) return true;
  if (!hasSupabaseConfig()) return false;
  const db = getSupabaseAdmin();
  const { data } = await db
    .from('platform_admins')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .eq('active', true)
    .maybeSingle();
  return Boolean(data);
}

export async function isPlatformAppAdminAuthUser(authUserId: string): Promise<boolean> {
  if (!hasSupabaseConfig()) return false;
  const db = getSupabaseAdmin();
  const { data } = await db
    .from('platform_admins')
    .select('id')
    .eq('auth_user_id', authUserId)
    .eq('active', true)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Administradores globales: todas las clínicas con status=active, sin perfiles por sede.
 * Se consulta en cada petición; clínicas nuevas o aprobadas quedan accesibles al instante.
 */
export async function hasGlobalClinicAdministratorAccess(
  user: Pick<SessionUser, 'email' | 'role'>
): Promise<boolean> {
  if (user.role === 'super_admin') return true;
  return isPlatformAppAdminEmail(user.email);
}

export async function listActiveClinicIdsForGlobalAdministrator(): Promise<string[]> {
  if (!hasSupabaseConfig()) return [];
  const db = getSupabaseAdmin();
  const { data } = await db.from('clinics').select('id').eq('status', 'active');
  return (data ?? []).map((row) => row.id as string);
}

/** Alias: sesión con acceso a todas las clínicas activas. */
export async function isPlatformAppAdminSession(
  user: Pick<SessionUser, 'email' | 'role'>
): Promise<boolean> {
  return hasGlobalClinicAdministratorAccess(user);
}

const STAFF_ROLES = new Set(['admin', 'owner', 'clinic_admin', 'dentist', 'receptionist']);

/** Super admin que elige panel clínica: sesión de plataforma (todas las sedes), no perfil staff de una sola clínica. */
export async function loginPlatformAppAdminForClinicPanel(
  identity: AuthenticatedIdentity
): Promise<Omit<SessionUser, 'expiresAt'> | null> {
  if (!hasSupabaseConfig()) return null;
  if (!(await isPlatformAppAdminAuthUser(identity.authUserId))) return null;
  const db = getSupabaseAdmin();

  const platformSession = await loginPlatformAdmin(db, identity.authUserId, identity.email);
  if (!platformSession) return null;

  const staffRow = pickProfileForLogin(identity.profiles, 'admin');
  if (staffRow && STAFF_ROLES.has(staffRow.role)) {
    const { data: clinic } = await db
      .from('clinics')
      .select('id, status, tenant_id')
      .eq('id', staffRow.clinic_id)
      .maybeSingle();
    if (clinic?.status === 'active') {
      const tenantId = staffRow.tenant_id ?? (clinic.tenant_id as string | null) ?? null;
      return {
        ...platformSession,
        sessionPortal: 'clinic',
        clinicId: staffRow.clinic_id,
        profileId: staffRow.id,
        tenantId: tenantId ?? undefined
      };
    }
  }

  return { ...platformSession, sessionPortal: 'clinic' };
}

/** Activa inspección de clínica y devuelve cookie para el panel /admin. */
export async function switchPlatformAdminToClinic(
  user: Pick<SessionUser, 'email' | 'name'>,
  clinicId: string
): Promise<{ inspectCookie: string; clinicName: string } | null> {
  if (!hasSupabaseConfig()) return null;
  const db = getSupabaseAdmin();
  const { data: clinic } = await db
    .from('clinics')
    .select('id, tenant_id, name, status')
    .eq('id', clinicId)
    .maybeSingle();
  if (!clinic || clinic.status !== 'active') return null;

  await logPlatformInspectEvent({
    actorEmail: user.email,
    actorName: user.name,
    inspectMode: 'clinic_admin',
    clinicId: clinic.id as string,
    tenantId: clinic.tenant_id as string | null,
    eventType: 'inspect_clinic_start',
    resourceLabel: clinic.name as string,
    pagePath: '/admin/elegir-centro'
  });

  const inspectCookie = createPlatformInspectCookie({
    superAdminEmail: user.email,
    superAdminName: user.name,
    accessRole: 'super_admin',
    mode: 'clinic_admin',
    clinicId: clinic.id as string,
    tenantId: (clinic.tenant_id as string | null) ?? undefined
  });

  return { inspectCookie, clinicName: clinic.name as string };
}
