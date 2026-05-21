import type { AdminView } from '@/components/admin/nav';

const PDP_AUDIT_ROLES = new Set(['clinic_admin', 'admin', 'owner']);

/** Solo administración de clínica ve auditoría PdP (no dentistas ni recepción). */
export function canViewPdpAudit(role: string | undefined) {
  if (!role) return false;
  return PDP_AUDIT_ROLES.has(role);
}

export function isNavItemVisible(view: AdminView, role: string | undefined) {
  if (view === 'auditoria-pdp') return canViewPdpAudit(role);
  return true;
}
