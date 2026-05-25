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

export function canAccessPlatformPanel(
  user: Pick<SessionUser, 'role' | 'sessionPortal' | 'platformInspect'>
): boolean {
  if (user.role !== 'super_admin') return false;
  return inferSessionPortal(user) === 'platform' && !user.platformInspect;
}
