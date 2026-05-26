import { getSessionUser, type SessionUser } from '@/lib/auth';
import { hasGlobalClinicAdministratorAccess } from '@/lib/auth/platformClinicAccess';
import { canAccessClinicPanelFromRaw } from '@/lib/auth/clinicPanelAccess';
import { enrichDualRoleClinicSession } from '@/lib/auth/dualRoleClinic';
import { getEffectiveSessionUser } from '@/lib/auth';
import { getPortalAccessSession } from '@/lib/auth/portalAccess';

const STAFF_ROLES = new Set(['admin', 'owner', 'clinic_admin', 'dentist', 'receptionist']);

export function normalizePanelPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function isAdminPanelHtmlPath(pathname: string): boolean {
  const path = normalizePanelPath(pathname);
  return path === '/admin' || path.startsWith('/admin/');
}

export function isPatientPortalHtmlPath(pathname: string): boolean {
  const path = normalizePanelPath(pathname);
  if (path === '/paciente/acceso') return false;
  return path === '/paciente' || path.startsWith('/paciente/');
}

export function isAdminAuthPage(pathname: string): boolean {
  const path = normalizePanelPath(pathname);
  return path === '/login/admin' || path.startsWith('/login/admin/');
}

export function isPatientAuthPage(pathname: string): boolean {
  const path = normalizePanelPath(pathname);
  return (
    path === '/portal-paciente' ||
    path === '/login/paciente' ||
    path.startsWith('/login/paciente/') ||
    path === '/paciente/acceso'
  );
}

function staffSessionAllowsClinicPanel(user: SessionUser): boolean {
  if (user.role === 'patient' && !user.platformInspect) return false;
  if (user.role === 'admin') return true;
  const staffRole = user.staffRole ?? user.role;
  if (STAFF_ROLES.has(staffRole)) return true;
  if (user.platformInspect && user.inspectMode === 'clinic_admin') return Boolean(user.clinicId);
  return canAccessClinicPanelFromRaw(user);
}

/** Sesión válida para HTML /admin/* (middleware SSR). */
export async function hasClinicPanelHtmlAccess(cookies: {
  get(name: string): { value?: string } | undefined;
}): Promise<boolean> {
  const raw = getSessionUser(cookies);
  if (!raw) return false;

  if (staffSessionAllowsClinicPanel(raw)) return true;

  if (await hasGlobalClinicAdministratorAccess(raw)) return true;

  const effective = getEffectiveSessionUser(cookies);
  if (effective && staffSessionAllowsClinicPanel({ ...effective, sessionPortal: raw.sessionPortal ?? effective.sessionPortal })) {
    return true;
  }

  if (raw.role === 'super_admin') {
    try {
      const enriched = await enrichDualRoleClinicSession(raw);
      return staffSessionAllowsClinicPanel(enriched);
    } catch {
      return false;
    }
  }

  return false;
}

/** Sesión válida para HTML /paciente/* (sin redirigir al login de clínica). */
export function hasPatientPortalHtmlAccess(cookies: {
  get(name: string): { value?: string } | undefined;
}): boolean {
  const raw = getSessionUser(cookies);
  if (!raw) {
    return Boolean(getPortalAccessSession(cookies));
  }

  if (raw.role === 'patient' || raw.patientId) return true;
  if (raw.platformInspect && raw.inspectMode === 'patient_portal') return true;
  if (raw.role === 'admin' || raw.role === 'super_admin') return true;
  const staffRole = raw.staffRole ?? raw.role;
  return STAFF_ROLES.has(staffRole);
}
