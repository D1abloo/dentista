import type { AdminView } from '@/components/admin/nav';
import { isTokenFeaturesEnabled } from '@/lib/featureFlags';

const PDP_AUDIT_ROLES = new Set(['clinic_admin', 'admin', 'owner']);
const PROFESSIONAL_PROFILE_ROLES = new Set(['clinic_admin', 'admin', 'owner', 'dentist']);
const USER_MANAGER_ROLES = new Set(['clinic_admin', 'admin', 'owner']);

/** Solo administración de clínica ve auditoría PdP (no dentistas ni recepción). */
export function canViewPdpAudit(role: string | undefined) {
  if (!role) return false;
  return PDP_AUDIT_ROLES.has(role);
}

export function canManageClinicUsers(role: string | undefined) {
  if (!role) return false;
  return USER_MANAGER_ROLES.has(role);
}

export function canViewProfessionalProfiles(role: string | undefined) {
  if (!role) return true;
  return PROFESSIONAL_PROFILE_ROLES.has(role);
}

export function isNavItemVisible(view: AdminView, role: string | undefined) {
  if (view === 'acceso-portal' && !isTokenFeaturesEnabled()) return false;
  if (view === 'auditoria-pdp' || view === 'monitorizacion') return canViewPdpAudit(role);
  if (view === 'profesionales') return canViewProfessionalProfiles(role);
  if (view === 'usuarios') return canManageClinicUsers(role);
  return true;
}
