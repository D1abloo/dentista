import { getRegistrationsDemo, planLabel, type RegistrationRow } from '@/lib/platform/registrationsDemo';

export type ProcessedDecision = 'approved' | 'rejected';

export type TimelineStep = {
  id: string;
  label: string;
  done: boolean;
  active?: boolean;
};

export type ProcessedHistoryRow = {
  id: string;
  clinic_name: string;
  clinic_url: string;
  owner_name: string;
  email: string;
  phone: string;
  decision: ProcessedDecision;
  decision_label: string;
  tenant_slug: string;
  tenant_display: string;
  tenant_id_masked: string;
  plan_label: string;
  processed_by: string;
  decision_date_label: string;
  request_date_label: string;
  created_at: string;
  reviewed_at: string;
  clinic_id: string | null;
  credentials_sent: boolean;
  welcome_email_sent: boolean;
  rejection_reason: string | null;
  has_tenant: boolean;
  has_incidents: boolean;
  timeline: TimelineStep[];
};

const ENRICHED: Record<string, Partial<ProcessedHistoryRow>> = {
  'reg-approved-001': {
    clinic_name: 'Clínica Dental Nova',
    clinic_url: 'clinicadentalnova.es',
    owner_name: 'Administrador plataforma',
    email: 'contacto@clinicadentalnova.es',
    phone: '+34 932 180 420',
    tenant_slug: 'clinica-dental-nova',
    tenant_display: 'clinica-dental-nova',
    tenant_id_masked: '80e9a6b1…',
    plan_label: 'Profesional',
    processed_by: 'Super Admin',
    decision_date_label: '20/05/2026 · 10:35',
    request_date_label: '20/05/2026 · 18:20',
    credentials_sent: true,
    welcome_email_sent: true,
    rejection_reason: null
  }
};

function buildTimeline(decision: ProcessedDecision): TimelineStep[] {
  if (decision === 'rejected') {
    return [
      { id: 't1', label: 'Solicitud recibida', done: true },
      { id: 't2', label: 'Datos revisados', done: true },
      { id: 't3', label: 'Solicitud rechazada', done: true, active: true }
    ];
  }
  return [
    { id: 't1', label: 'Solicitud recibida', done: true },
    { id: 't2', label: 'Datos revisados', done: true },
    { id: 't3', label: 'Tenant creado', done: true },
    { id: 't4', label: 'Credenciales enviadas', done: true },
    { id: 't5', label: 'Alta aprobada', done: true, active: true }
  ];
}

function mapRow(reg: RegistrationRow): ProcessedHistoryRow | null {
  if (reg.status !== 'approved' && reg.status !== 'rejected') return null;
  const decision: ProcessedDecision = reg.status === 'approved' ? 'approved' : 'rejected';
  const plan = reg.assigned_plan ? planLabel(reg.assigned_plan) : reg.requested_plan;
  const slug = decision === 'approved' ? slugify(reg.clinic_name) : '—';
  const extra = ENRICHED[reg.id] ?? {};
  const reviewed = reg.reviewed_at ? new Date(reg.reviewed_at) : new Date(reg.created_at);

  return {
    id: reg.id,
    clinic_name: extra.clinic_name ?? reg.clinic_name,
    clinic_url: extra.clinic_url ?? reg.email.split('@')[1] ?? '—',
    owner_name: extra.owner_name ?? reg.owner_name,
    email: extra.email ?? reg.email,
    phone: extra.phone ?? reg.phone,
    decision,
    decision_label: decision === 'approved' ? 'Aprobada' : 'Rechazada',
    tenant_slug: extra.tenant_slug ?? slug,
    tenant_display: extra.tenant_display ?? slug,
    tenant_id_masked: extra.tenant_id_masked ?? (reg.clinic_id ? `${reg.clinic_id.slice(0, 8)}…` : '—'),
    plan_label: extra.plan_label ?? plan,
    processed_by: extra.processed_by ?? 'Super Admin',
    decision_date_label: extra.decision_date_label ?? formatDecisionDate(reviewed),
    request_date_label: extra.request_date_label ?? formatDecisionDate(new Date(reg.created_at)),
    created_at: reg.created_at,
    reviewed_at: reg.reviewed_at ?? reg.created_at,
    clinic_id: reg.clinic_id,
    credentials_sent: extra.credentials_sent ?? decision === 'approved',
    welcome_email_sent: extra.welcome_email_sent ?? decision === 'approved',
    rejection_reason: extra.rejection_reason ?? reg.review_notes,
    has_tenant: Boolean(reg.clinic_id),
    has_incidents: false,
    timeline: buildTimeline(decision)
  };
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function formatDecisionDate(d: Date) {
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', ' ·');
}

export function getHistoryDemo(): ProcessedHistoryRow[] {
  return getRegistrationsDemo()
    .map(mapRow)
    .filter((r): r is ProcessedHistoryRow => r !== null)
    .sort((a, b) => new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime());
}

export function getHistoryKpis(rows: ProcessedHistoryRow[]) {
  const approved = rows.filter((r) => r.decision === 'approved');
  const reviewed = rows.filter((r) => r.reviewed_at);
  let avgHours = '—';
  if (reviewed.length) {
    const ms =
      reviewed.reduce((sum, r) => {
        return sum + (new Date(r.reviewed_at).getTime() - new Date(r.created_at).getTime());
      }, 0) / reviewed.length;
    const h = Math.round(ms / 3600000);
    avgHours = h > 0 ? `${h} h` : '< 1 h';
  }
  const last = rows[0];
  const lastLabel = last
    ? new Date(last.reviewed_at).toDateString() === new Date().toDateString()
      ? 'Hoy'
      : last.decision_date_label.split(' ·')[0]
    : '—';

  return {
    processed: rows.length,
    approved: approved.length,
    rejected: rows.filter((r) => r.decision === 'rejected').length,
    tenantsCreated: approved.filter((r) => r.has_tenant).length,
    avgApproval: avgHours === '—' && approved.length ? '2 h' : avgHours,
    lastRegistration: lastLabel
  };
}

export function findHistoryRow(id: string) {
  return getHistoryDemo().find((r) => r.id === id) ?? null;
}

export function resendCredentialsDemo(id: string): ProcessedHistoryRow | null {
  const row = findHistoryRow(id);
  if (!row || row.decision !== 'approved') return null;
  return { ...row, credentials_sent: true };
}

export function historyReportLines(row: ProcessedHistoryRow): string[] {
  return [
    'Informe de alta — AgendaClinic Plataforma',
    `Clínica: ${row.clinic_name}`,
    `Responsable: ${row.owner_name}`,
    `Decisión: ${row.decision_label}`,
    `Tenant: ${row.tenant_slug}`,
    `Plan: ${row.plan_label}`,
    `Procesado por: ${row.processed_by}`,
    `Fecha solicitud: ${row.request_date_label}`,
    `Fecha decisión: ${row.decision_date_label}`,
    `Credenciales enviadas: ${row.credentials_sent ? 'Sí' : 'No'}`,
    row.rejection_reason ? `Motivo rechazo: ${row.rejection_reason}` : ''
  ].filter(Boolean);
}
