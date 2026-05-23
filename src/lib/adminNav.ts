import type { AdminView } from '@/components/admin/nav';

const PDP_AUDIT_ROLES = new Set(['clinic_admin', 'admin', 'owner']);
const PROFESSIONAL_PROFILE_ROLES = new Set(['clinic_admin', 'admin', 'owner', 'dentist']);

/** Solo administración de clínica ve auditoría PdP (no dentistas ni recepción). */
export function canViewPdpAudit(role: string | undefined) {
  if (!role) return false;
  return PDP_AUDIT_ROLES.has(role);
}

export function canViewProfessionalProfiles(role: string | undefined) {
  if (!role) return true;
  return PROFESSIONAL_PROFILE_ROLES.has(role);
}

export function isNavItemVisible(view: AdminView, role: string | undefined) {
  if (view === 'auditoria-pdp') return canViewPdpAudit(role);
  if (view === 'profesionales') return canViewProfessionalProfiles(role);
  return true;
}
