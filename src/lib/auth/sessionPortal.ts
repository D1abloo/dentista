import type { SessionUser } from '@/lib/auth';

/** Portal elegido en el login (o inferido en sesiones antiguas). */
export type SessionPortal = 'platform' | 'clinic' | 'patient';

export function inferSessionPortal(
  user: Pick<SessionUser, 'clinicId' | 'platformInspect' | 'patientId' | 'sessionPortal'> & {
    role: SessionUser['role'] | string;
  }
): SessionPortal {
  if (user.sessionPortal) return user.sessionPortal;
  if (user.role === 'patient' || user.patientId) return 'patient';
  if (user.platformInspect) return 'clinic';
  if (user.clinicId || user.role === 'admin') return 'clinic';
  if (user.role === 'super_admin') return 'platform';
  return 'clinic';
}

export function settingsPathForPortal(portal: SessionPortal): string {
  if (portal === 'platform') return '/platform/configuracion';
  if (portal === 'patient') return '/paciente/perfil';
  return '/admin/configuracion';
}

export function homePathForPortal(portal: SessionPortal, clinicId?: string | null): string {
  if (portal === 'platform') return '/platform';
  if (portal === 'patient') return '/paciente';
  if (clinicId) return '/admin';
  return '/admin/elegir-centro';
}

export function canAccessClinicPanel(
  user: Pick<
    SessionUser,
    'role' | 'clinicId' | 'platformInspect' | 'inspectMode' | 'staffRole' | 'sessionPortal' | 'patientId'
  >
): boolean {
  const portal = inferSessionPortal(user);
  if (portal === 'patient') return false;
  if (portal === 'platform' && !user.platformInspect) return false;
  if (user.platformInspect && user.inspectMode === 'clinic_admin') return Boolean(user.clinicId);
  if (user.role === 'admin') return true;
  if (portal === 'clinic') {
    if (user.clinicId) return true;
    if (user.role === 'super_admin') return true;
  }
  const staffRole = user.staffRole ?? user.role;
  return ['clinic_admin', 'admin', 'owner', 'dentist', 'receptionist'].includes(staffRole);
}

/** Super admin con sesión base válida (ignora rol efectivo de inspección de clínica). */
export function canAccessPlatformPanel(user: {
  role?: SessionUser['role'] | string;
  baseRole?: SessionUser['role'] | string;
}): boolean {
  const baseRole = user.baseRole ?? user.role;
  return baseRole === 'super_admin';
}

/** @deprecated Alias de canAccessPlatformPanel para llamadas con /api/auth/me */
export function canAccessPlatformPanelFromSession(
  user: Pick<SessionUser, 'sessionPortal' | 'platformInspect'> & {
    role?: SessionUser['role'] | string;
    baseRole?: SessionUser['role'] | string;
  }
): boolean {
  return canAccessPlatformPanel(user);
}

/** Destino tras login según el portal elegido en la sesión. */
export function postLoginPathForUser(
  user: Pick<SessionUser, 'role' | 'clinicId' | 'sessionPortal' | 'platformInspect' | 'patientId'>,
  opts?: { preferAdmin?: boolean }
): string {
  const portal = inferSessionPortal(user);
  if (portal === 'patient' || user.role === 'patient') return '/paciente';
  if (portal === 'platform' && !user.platformInspect) {
    return opts?.preferAdmin ? '/admin/elegir-centro?auto=1' : '/platform';
  }
  if (user.clinicId) return '/admin';
  return '/admin/elegir-centro?auto=1';
}
