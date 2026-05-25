import type { SessionUser } from '@/lib/auth';
import { loginPlatformAdmin } from '@/lib/auth/productionLogin';
import type { AuthenticatedIdentity } from '@/lib/auth/portalChoices';
import { createPlatformInspectCookie } from '@/lib/auth/platformInspect';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';
import { logPlatformInspectEvent } from '@/lib/services/platformInspect';

/** Super admin de plataforma (tabla platform_admins). Puede entrar a cualquier clínica activa. */
export async function isPlatformAppAdminEmail(email: string): Promise<boolean> {
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

export async function isPlatformAppAdminSession(
  user: Pick<SessionUser, 'email' | 'role'>
): Promise<boolean> {
  if (user.role !== 'super_admin') return false;
  return isPlatformAppAdminEmail(user.email);
}

/** Sesión super_admin al entrar por /login/admin (sin perfil staff obligatorio). */
export async function loginPlatformAppAdminForClinicPanel(
  identity: AuthenticatedIdentity
): Promise<Omit<SessionUser, 'expiresAt'> | null> {
  if (!hasSupabaseConfig()) return null;
  if (!(await isPlatformAppAdminAuthUser(identity.authUserId))) return null;
  const db = getSupabaseAdmin();
  return loginPlatformAdmin(db, identity.authUserId, identity.email);
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
