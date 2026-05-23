export type AuditRisk = 'low' | 'medium' | 'high';
export type AuditResult = 'ok' | 'blocked' | 'error';
export type AuditModuleKey =
  | 'security'
  | 'users'
  | 'clinics'
  | 'patients'
  | 'appointments'
  | 'documents'
  | 'reports'
  | 'billing'
  | 'payments'
  | 'support'
  | 'isolation'
  | 'config'
  | 'registrations';

export type AuditEventRow = {
  id: string;
  event_code: string;
  date_label: string;
  created_at: string;
  actor_name: string;
  actor_role: string;
  actor_initials: string;
  is_system: boolean;
  clinic_name: string;
  tenant_slug: string;
  tenant_masked: string;
  module: string;
  module_key: AuditModuleKey;
  action: string;
  resource: string;
  resource_masked: string;
  risk: AuditRisk;
  risk_label: string;
  result: AuditResult;
  result_label: string;
  ip: string;
  device: string;
  route: string;
  related_event: string | null;
  reason: string;
  technical_log: string;
  before_state: string | null;
  after_state: string | null;
  reviewed: boolean;
  resource_href: string | null;
};

export type AuditKpis = {
  audited: number;
  critical: number;
  permission_changes: number;
  sensitive_access: number;
  exports: number;
  last_event: string;
};

export type CriticalSummaryRow = { id: string; label: string; count: number };
export type ModuleActivity = { label: string; percent: number };
export type ActorActivity = { label: string; events: number };

export type AuditPayload = {
  kpis: AuditKpis;
  events: AuditEventRow[];
  critical_summary: CriticalSummaryRow[];
  by_module: ModuleActivity[];
  by_actor: ActorActivity[];
  retention_days: number;
  actors: string[];
  tenants: { id: string; name: string; slug: string }[];
};

export const PRIVACY_AUDIT = [
  'Sin exposición de datos clínicos entre tenants',
  'IDs sensibles parcialmente ocultos',
  'Exportaciones registradas',
  'Acciones críticas requieren confirmación',
  'Retención configurable',
  'Acceso limitado por rol'
];

const MODULE_LABELS: Record<AuditModuleKey, string> = {
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

function maskId(value: string) {
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}…${value.slice(-3)}`;
}

function maskTenant(slug: string) {
  if (slug === 'global' || !slug) return 'Global';
  return slug.length > 14 ? `${slug.slice(0, 12)}…` : slug;
}

function row(partial: Omit<AuditEventRow, 'risk_label' | 'result_label' | 'tenant_masked' | 'resource_masked'>): AuditEventRow {
  return {
    ...partial,
    risk_label: partial.risk === 'high' ? 'Alto' : partial.risk === 'medium' ? 'Medio' : 'Bajo',
    result_label: partial.result === 'blocked' ? 'Bloqueado' : partial.result === 'error' ? 'Error' : 'Correcto',
    tenant_masked: maskTenant(partial.tenant_slug),
    resource_masked: maskId(partial.resource)
  };
}

let retentionDays = 180;

let demoStore: AuditEventRow[] = [
  row({
    id: 'aud-001',
    event_code: 'AUD-2026-0001',
    date_label: 'Hoy, 10:35',
    created_at: new Date().toISOString(),
    actor_name: 'Super Admin',
    actor_role: 'Super Admin',
    actor_initials: 'SA',
    is_system: false,
    clinic_name: 'Clínica Dental Nova',
    tenant_slug: 'clinica-dental-nova',
    module: 'Registros',
    module_key: 'registrations',
    action: 'Aprobar solicitud',
    resource: 'clinica-dental-nova',
    risk: 'medium',
    result: 'ok',
    ip: '181.23.45.67',
    device: 'Chrome · Windows',
    route: '/platform/registrations',
    related_event: 'REG-2026-0001',
    reason: 'Aprobación de solicitud de clínica',
    technical_log: 'Tenant creado, credenciales enviadas y suscripción asignada.',
    before_state: 'Estado: Pendiente',
    after_state: 'Estado: Aprobada · Tenant creado',
    reviewed: false,
    resource_href: '/platform/registros'
  }),
  row({
    id: 'aud-002',
    event_code: 'AUD-2026-0002',
    date_label: 'Hoy, 09:12',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    actor_name: 'María recepción',
    actor_role: 'Recepción',
    actor_initials: 'MR',
    is_system: false,
    clinic_name: 'Clínica Dental Nova',
    tenant_slug: 'clinica-dental-nova',
    module: 'Facturación',
    module_key: 'billing',
    action: 'Crear factura',
    resource: 'FAC-2026-0001',
    risk: 'low',
    result: 'ok',
    ip: '192.168.1.44',
    device: 'Chrome · macOS',
    route: '/admin/facturas',
    related_event: null,
    reason: 'Emisión de factura en panel clínica',
    technical_log: 'Factura creada sin datos clínicos en el registro de auditoría.',
    before_state: null,
    after_state: null,
    reviewed: true,
    resource_href: '/admin/facturas'
  }),
  row({
    id: 'aud-003',
    event_code: 'AUD-2026-0003',
    date_label: 'Ayer, 18:45',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    actor_name: 'Sistema',
    actor_role: 'Sistema',
    actor_initials: '⚙',
    is_system: true,
    clinic_name: 'Global',
    tenant_slug: 'global',
    module: 'Seguridad',
    module_key: 'security',
    action: 'Token inválido',
    resource: 'Portal paciente',
    risk: 'high',
    result: 'blocked',
    ip: '203.0.113.44',
    device: 'Desconocido',
    route: '/api/portal-access/verify',
    related_event: null,
    reason: 'Intento de acceso con token expirado',
    technical_log: 'Bloqueo automático sin exposición de datos de paciente.',
    before_state: null,
    after_state: null,
    reviewed: true,
    resource_href: null
  }),
  row({
    id: 'aud-004',
    event_code: 'AUD-2026-0004',
    date_label: 'Ayer, 16:22',
    created_at: new Date(Date.now() - 90000000).toISOString(),
    actor_name: 'Super Admin',
    actor_role: 'Super Admin',
    actor_initials: 'SA',
    is_system: false,
    clinic_name: 'Clínica Dental Nova',
    tenant_slug: 'clinica-dental-nova',
    module: 'Soporte',
    module_key: 'support',
    action: 'Responder ticket',
    resource: 'SUP-2026-0001',
    risk: 'low',
    result: 'ok',
    ip: '181.23.45.67',
    device: 'Chrome · Windows',
    route: '/platform/soporte',
    related_event: 'SUP-2026-0001',
    reason: 'Respuesta a ticket de plataforma',
    technical_log: 'Mensaje enviado sin datos clínicos del paciente.',
    before_state: null,
    after_state: null,
    reviewed: false,
    resource_href: '/platform/soporte'
  }),
  row({
    id: 'aud-005',
    event_code: 'AUD-2026-0005',
    date_label: '20/05/2026, 11:05',
    created_at: '2026-05-20T11:05:00.000Z',
    actor_name: 'Super Admin',
    actor_role: 'Super Admin',
    actor_initials: 'SA',
    is_system: false,
    clinic_name: 'Global',
    tenant_slug: 'global',
    module: 'Aislamiento',
    module_key: 'isolation',
    action: 'Ejecutar verificación RLS',
    resource: '12 reglas',
    risk: 'low',
    result: 'ok',
    ip: '181.23.45.67',
    device: 'Firefox · macOS',
    route: '/platform/aislamiento',
    related_event: null,
    reason: 'Auditoría programada de aislamiento',
    technical_log: '12 reglas RLS verificadas sin incidencias.',
    before_state: null,
    after_state: null,
    reviewed: true,
    resource_href: '/platform/aislamiento'
  })
];

function computeKpis(events: AuditEventRow[]): AuditKpis {
  return {
    audited: 248,
    critical: events.filter((e) => e.risk === 'high' || e.result === 'blocked').length,
    permission_changes: 3,
    sensitive_access: 6,
    exports: 4,
    last_event: events[0]?.date_label ?? '—'
  };
}

function buildAnalytics() {
  return {
    critical_summary: [
      { id: 'cross', label: 'Intentos de acceso cruzado', count: 0 },
      { id: 'tokens', label: 'Tokens inválidos repetidos', count: 0 },
      { id: 'perms', label: 'Cambios masivos de permisos', count: 0 },
      { id: 'exports', label: 'Exportaciones sensibles', count: 4 },
      { id: 'isolation', label: 'Fallos de aislamiento', count: 0 }
    ],
    by_module: [
      { label: 'Seguridad', percent: 38 },
      { label: 'Facturación', percent: 22 },
      { label: 'Registros', percent: 18 },
      { label: 'Soporte', percent: 12 },
      { label: 'Otros', percent: 10 }
    ],
    by_actor: [
      { label: 'Super Admin', events: 142 },
      { label: 'Staff clínica', events: 68 },
      { label: 'Sistema', events: 24 },
      { label: 'Paciente', events: 14 }
    ]
  };
}

export function getAuditDemo(): AuditPayload {
  const events = demoStore.map((e) => ({ ...e }));
  const analytics = buildAnalytics();
  return {
    kpis: computeKpis(events),
    events,
    ...analytics,
    retention_days: retentionDays,
    actors: ['Todos', 'Super Admin', 'María recepción', 'Sistema'],
    tenants: [
      { id: 'all', name: 'Todas las clínicas', slug: '' },
      { id: 'nova', name: 'Clínica Dental Nova', slug: 'clinica-dental-nova' },
      { id: 'global', name: 'Global', slug: 'global' }
    ]
  };
}

export function findAuditEvent(id: string) {
  return demoStore.find((e) => e.id === id) ?? null;
}

export function markAuditReviewedDemo(id: string): AuditPayload | { error: string } {
  const e = demoStore.find((x) => x.id === id);
  if (!e) return { error: 'No se pudo actualizar el evento.' };
  e.reviewed = true;
  return getAuditDemo();
}

export function escalateAuditDemo(id: string): AuditPayload | { error: string } {
  const e = demoStore.find((x) => x.id === id);
  if (!e) return { error: 'No se pudo escalar la incidencia.' };
  e.risk = 'high';
  e.risk_label = 'Alto';
  return getAuditDemo();
}

export function updateAuditRetentionDemo(days: number): AuditPayload {
  retentionDays = Math.min(365, Math.max(30, days));
  return getAuditDemo();
}

export function refreshAuditDemo(): AuditPayload {
  return getAuditDemo();
}

export function moduleLabel(key: AuditModuleKey) {
  return MODULE_LABELS[key] ?? key;
}

export function chipToModule(chip: string): AuditModuleKey | null {
  const map: Record<string, AuditModuleKey> = {
    security: 'security',
    users: 'users',
    clinics: 'clinics',
    patients: 'patients',
    appointments: 'appointments',
    documents: 'documents',
    reports: 'reports',
    billing: 'billing',
    payments: 'payments',
    support: 'support',
    isolation: 'isolation',
    config: 'config'
  };
  return map[chip] ?? null;
}
