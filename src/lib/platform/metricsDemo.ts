export type ModuleKey =
  | 'agenda'
  | 'patients'
  | 'billing'
  | 'documents'
  | 'patient_portal'
  | 'settings';

export type ClinicMetricsRow = {
  id: string;
  clinic_name: string;
  clinic_city: string;
  tenant_slug: string;
  active_users: number;
  sessions: number;
  events: number;
  last_activity: string;
  status: 'active' | 'pending' | 'suspended';
  status_label: string;
  top_module: string;
  clinic_panel_pct: number;
  patient_portal_pct: number;
  modules: { key: ModuleKey; label: string; events: number }[];
};

export type MetricsPayload = {
  updated_at: string;
  updated_label: string;
  kpis: {
    active_clinics: number;
    active_users: number;
    sessions_today: number;
    events_total: number;
    top_module: string;
    top_module_events: number;
  };
  daily_events: { label: string; value: number }[];
  module_usage: { label: string; events: number; key: ModuleKey }[];
  portal_split: { clinic_panel: number; patient_portal: number };
  heatmap: { hour: string; values: number[] };
  heatmap_days: string[];
  clinics: ClinicMetricsRow[];
  retention_days: number;
  retention_label: string;
};

const MODULES: { key: ModuleKey; label: string; events: number }[] = [
  { key: 'agenda', label: 'Agenda', events: 80 },
  { key: 'patients', label: 'Pacientes', events: 52 },
  { key: 'billing', label: 'Facturación', events: 44 },
  { key: 'documents', label: 'Documentos', events: 31 },
  { key: 'patient_portal', label: 'Portal paciente', events: 25 },
  { key: 'settings', label: 'Ajustes', events: 16 }
];

const DAILY = [
  { label: 'Lun', value: 24 },
  { label: 'Mar', value: 36 },
  { label: 'Mié', value: 42 },
  { label: 'Jue', value: 58 },
  { label: 'Vie', value: 44 },
  { label: 'Sáb', value: 28 },
  { label: 'Dom', value: 16 }
];

const HEATMAP_HOURS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
const HEATMAP_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Intensidades 0–1 por fila (hora) y columna (día) */
const HEATMAP_VALUES: number[][] = [
  [0.15, 0.25, 0.3, 0.35, 0.28, 0.12, 0.08],
  [0.45, 0.55, 0.6, 0.72, 0.65, 0.35, 0.18],
  [0.55, 0.68, 0.75, 0.85, 0.78, 0.42, 0.22],
  [0.5, 0.62, 0.7, 0.8, 0.72, 0.38, 0.2],
  [0.62, 0.75, 0.82, 0.95, 0.88, 0.48, 0.25],
  [0.35, 0.42, 0.48, 0.55, 0.5, 0.28, 0.15]
];

let retentionDays = 90;

function buildNovaRow(): ClinicMetricsRow {
  return {
    id: 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001',
    clinic_name: 'Clínica Dental Nova',
    clinic_city: 'Madrid, España',
    tenant_slug: 'clinica-dental-nova',
    active_users: 6,
    sessions: 12,
    events: 248,
    last_activity: 'Hoy, 10:35',
    status: 'active',
    status_label: 'Activa',
    top_module: 'Agenda',
    clinic_panel_pct: 72,
    patient_portal_pct: 28,
    modules: MODULES.map((m) => ({ ...m }))
  };
}

function buildPayload(): MetricsPayload {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  return {
    updated_at: now.toISOString(),
    updated_label: `Hoy, ${h}:${m}`,
    kpis: {
      active_clinics: 1,
      active_users: 6,
      sessions_today: 12,
      events_total: 248,
      top_module: 'Agenda',
      top_module_events: 80
    },
    daily_events: DAILY.map((d) => ({ ...d })),
    module_usage: MODULES.map((m) => ({ label: m.label, events: m.events, key: m.key })),
    portal_split: { clinic_panel: 72, patient_portal: 28 },
    heatmap: { hour: '', values: [] },
    heatmap_days: HEATMAP_DAYS,
    clinics: [buildNovaRow()],
    retention_days: retentionDays,
    retention_label: `${retentionDays} días`
  };
}

let demoPayload = buildPayload();

export function getMetricsDemo(): MetricsPayload {
  return {
    ...demoPayload,
    daily_events: demoPayload.daily_events.map((d) => ({ ...d })),
    module_usage: demoPayload.module_usage.map((m) => ({ ...m })),
    clinics: demoPayload.clinics.map((c) => ({
      ...c,
      modules: c.modules.map((m) => ({ ...m }))
    }))
  };
}

export function getHeatmapRows() {
  return HEATMAP_HOURS.map((hour, i) => ({
    hour,
    values: HEATMAP_VALUES[i] ?? []
  }));
}

export function refreshMetricsDemo(): MetricsPayload {
  demoPayload = buildPayload();
  return getMetricsDemo();
}

export function updateRetentionDemo(days: number): MetricsPayload {
  retentionDays = Math.min(365, Math.max(7, days));
  demoPayload.retention_days = retentionDays;
  demoPayload.retention_label = `${retentionDays} días`;
  return getMetricsDemo();
}

export function findClinicMetricsDemo(id: string) {
  return getMetricsDemo().clinics.find((c) => c.id === id) ?? null;
}

export function filterMetricsByRange(payload: MetricsPayload, range: 'today' | '7d' | '30d') {
  const factor = range === 'today' ? 0.35 : range === '7d' ? 0.75 : 1;
  return {
    ...payload,
    kpis: {
      ...payload.kpis,
      sessions_today: range === 'today' ? payload.kpis.sessions_today : Math.round(payload.kpis.sessions_today * factor * 2),
      events_total: Math.round(payload.kpis.events_total * factor)
    },
    daily_events: payload.daily_events.map((d, i) => ({
      ...d,
      value: Math.round(d.value * (range === 'today' && i < 6 ? 0 : factor))
    }))
  };
}

export const PRIVACY_CHECKLIST = [
  'Solo datos agregados',
  'Sin nombres de pacientes',
  'Sin historiales clínicos',
  'Sin contenido de documentos',
  'Separación por tenant',
  'Retención configurable'
];
