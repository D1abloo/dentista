import { getEffectiveSessionUser, getSessionUser, type SessionUser } from '@/lib/auth';
import { canAccessClinicPanel, inferSessionPortal } from '@/lib/auth/sessionPortal';
import { enrichDualRoleClinicSession } from '@/lib/auth/dualRoleClinic';

/** Usuario que puede operar en el panel clínica (cookie base, no solo sesión efectiva). */
export function canAccessClinicPanelFromRaw(
  user: Pick<
    SessionUser,
    'role' | 'clinicId' | 'platformInspect' | 'inspectMode' | 'staffRole' | 'sessionPortal' | 'patientId'
  >
): boolean {
  if (user.role === 'super_admin' && user.sessionPortal === 'clinic') return true;
  return canAccessClinicPanel(user);
}

export function shouldGrantAdminGateCookie(user: Omit<SessionUser, 'expiresAt'>): boolean {
  return canAccessClinicPanelFromRaw(user);
}

/** Sesión válida para rutas /admin (SSR middleware y APIs). */
export async function hasClinicPanelAccess(cookies: {
  get(name: string): { value?: string } | undefined;
}): Promise<boolean> {
  const raw = getSessionUser(cookies);
  if (!raw) return false;

  if (raw.role === 'patient') return false;
  if (raw.role === 'super_admin' && raw.sessionPortal === 'platform') return false;

  if (canAccessClinicPanelFromRaw(raw)) return true;

  const effective = getEffectiveSessionUser(cookies);
  if (effective && canAccessClinicPanelFromRaw({ ...effective, sessionPortal: raw.sessionPortal ?? effective.sessionPortal })) {
    return true;
  }

  if (raw.role === 'super_admin') {
    try {
      const enriched = await enrichDualRoleClinicSession(raw);
      return canAccessClinicPanelFromRaw(enriched);
    } catch {
      return false;
    }
  }

  return false;
}

export function clinicPortalFromSession(
  user: Pick<SessionUser, 'role' | 'clinicId' | 'sessionPortal' | 'platformInspect' | 'patientId'>
) {
  return inferSessionPortal({
    role: user.role,
    clinicId: user.clinicId,
    sessionPortal: user.sessionPortal,
    platformInspect: false
  });
}
