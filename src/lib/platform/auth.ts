import type { APIContext } from 'astro';
import { getSessionUser, type SessionUser } from '@/lib/auth';
import { fail } from '@/lib/http';
import type { PlatformRole } from '@/lib/platform/types';

export function isSuperAdmin(user: SessionUser | null): user is SessionUser & { role: 'super_admin' } {
  return Boolean(user && user.role === 'super_admin');
}

export function requireSuperAdmin(context: APIContext) {
  const user = getSessionUser(context.cookies);
  if (!isSuperAdmin(user)) {
    return { user: null as null, response: fail('Acceso denegado. Se requiere Super Admin.', 403) };
  }
  return { user, response: null as null };
}

export function clinicRoles(): PlatformRole[] {
  return ['clinic_admin', 'admin', 'dentist', 'receptionist', 'owner'] as PlatformRole[];
}

export function canAccessClinicPanel(role: string) {
  return clinicRoles().includes(role as PlatformRole) || role === 'admin';
}
