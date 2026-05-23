import type { AuditEventRow, AuditModuleKey } from '@/lib/platform/auditDemo';

type DbAuditRow = {
  id: string;
  clinic_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  event_type: string | null;
  module: string | null;
  severity: string | null;
  result: string | null;
  message: string | null;
  user_email: string | null;
  user_role: string | null;
  route: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const MODULE_KEYS: Record<string, AuditModuleKey> = {
  auth: 'security',
  security: 'security',
  platform: 'config',
  patient: 'patients',
  patients: 'patients',
  appointment: 'appointments',
  appointments: 'appointments',
  document: 'documents',
  documents: 'documents',
  report: 'reports',
  reports: 'reports',
  billing: 'billing',
  invoice: 'billing',
  payment: 'payments',
  payments: 'payments',
  support: 'support',
  storage: 'documents',
  error: 'security'
};

function moduleKey(module: string | null, eventType: string): AuditModuleKey {
  const m = (module ?? eventType.split('.')[0] ?? 'config').toLowerCase();
  return MODULE_KEYS[m] ?? 'config';
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Hoy, ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Ayer, ${time}`;
  return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
}

export function mapDbRowToAuditEvent(
  row: DbAuditRow,
  clinicName = '—',
  tenantSlug = 'global'
): AuditEventRow {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const actorName =
    (typeof meta.actor_name === 'string' && meta.actor_name) ||
    row.user_email?.split('@')[0] ||
    'Sistema';
  const isSystem = !row.user_email && actorName === 'Sistema';
  const severity = row.severity ?? 'info';
  const risk =
    severity === 'critical' || severity === 'high'
      ? 'high'
      : severity === 'medium'
        ? 'medium'
        : 'low';
  const resultRaw = row.result ?? 'ok';
  const result: 'ok' | 'blocked' | 'error' =
    resultRaw === 'denied' || resultRaw === 'blocked'
      ? 'blocked'
      : resultRaw === 'error'
        ? 'error'
        : 'ok';
  const resource = row.entity_id ?? row.entity ?? '—';
  const moduleKeyVal = moduleKey(row.module, row.event_type ?? row.action);
  const moduleLabels: Record<AuditModuleKey, string> = {
    security: 'Seguridad',
    users: 'Usuarios',
    clinics: 'Clínicas',
    patients: 'Pacientes',
    appointments: 'Citas',
    documents: 'Documentos',
    reports: 'Informes',
    billing: 'Facturación',
    payments: 'Pagos',
    support: 'Soporte',
    isolation: 'Aislamiento',
    config: 'Configuración',
    registrations: 'Registros'
  };

  return {
    id: row.id,
    event_code: `AUD-${row.id.slice(0, 8).toUpperCase()}`,
    date_label: formatDateLabel(row.created_at),
    created_at: row.created_at,
    actor_name: actorName,
    actor_role: row.user_role ?? (isSystem ? 'Sistema' : 'Usuario'),
    actor_initials: isSystem ? '⚙' : initials(actorName),
    is_system: isSystem,
    clinic_name: clinicName,
    tenant_slug: tenantSlug,
    tenant_masked: tenantSlug.length > 14 ? `${tenantSlug.slice(0, 12)}…` : tenantSlug,
    module: moduleLabels[moduleKeyVal] ?? row.module ?? 'General',
    module_key: moduleKeyVal,
    action: row.message ?? row.action,
    resource,
    resource_masked: resource.length > 12 ? `${resource.slice(0, 8)}…` : resource,
    risk,
    risk_label: risk === 'high' ? 'Alto' : risk === 'medium' ? 'Medio' : 'Bajo',
    result,
    result_label: result === 'blocked' ? 'Bloqueado' : result === 'error' ? 'Error' : 'Correcto',
    ip: row.ip_address ?? '—',
    device: (meta.device as string) ?? '—',
    route: row.route ?? '—',
    related_event: row.event_type,
    reason: row.message ?? row.action,
    technical_log: row.event_type ?? row.action,
    before_state: null,
    after_state: null,
    reviewed: Boolean(meta.reviewed),
    resource_href: typeof meta.resource_href === 'string' ? meta.resource_href : null
  };
}
