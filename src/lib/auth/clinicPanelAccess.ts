import type { SessionUser } from '@/lib/auth';
import { canAccessClinicPanel, inferSessionPortal } from '@/lib/auth/sessionPortal';

/** Usuario que puede operar en el panel clínica (cookie base, no solo sesión efectiva). */
export function canAccessClinicPanelFromRaw(
  user: Pick<
    SessionUser,
    'role' | 'clinicId' | 'platformInspect' | 'inspectMode' | 'staffRole' | 'sessionPortal' | 'patientId'
  >
): boolean {
  if (user.role === 'super_admin' && user.sessionPortal === 'clinic') return true;
  if (user.role === 'super_admin' && !user.sessionPortal) return true;
  return canAccessClinicPanel(user);
}

export function shouldGrantAdminGateCookie(user: Omit<SessionUser, 'expiresAt'>): boolean {
  return canAccessClinicPanelFromRaw(user);
}

/** Sesión válida para rutas /admin (SSR middleware y APIs). */
export async function hasClinicPanelAccess(cookies: {
  get(name: string): { value?: string } | undefined;
}): Promise<boolean> {
  const { hasClinicPanelHtmlAccess } = await import('@/lib/auth/panelRouteAccess');
  return hasClinicPanelHtmlAccess(cookies);
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
