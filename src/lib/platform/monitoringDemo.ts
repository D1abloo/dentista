import type {
  MonitoringEventRow,
  MonitoringFilters,
  MonitoringPayload,
  MonitoringSeverity
} from './monitoringTypes';

const SEVERITY_LABELS: Record<MonitoringSeverity, string> = {
  info: 'Info',
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
  critical: 'Crítico'
};

const EVENTS: MonitoringEventRow[] = [
  {
    id: 'evt-001',
    event_code: 'EVT-2026-000041',
    created_at: '2026-05-24T10:35:00+02:00',
    date_time_label: '24/05/2026 10:35',
    event_label: 'Login correcto',
    module: 'auth',
    module_label: 'Auth',
    user_email: 'admin@clinicanova.es',
    user_role: 'Admin clínica',
    clinic_name: 'Clínica Dental Nova',
    resource_label: 'Sesión',
    severity: 'info',
    severity_label: 'Info',
    result: 'ok',
    result_label: 'Correcto',
    route: '/login/admin',
    ip_address: '185.199.108.10',
    user_agent: 'Mozilla/5.0 Chrome/124',
    browser_label: 'Chrome 124.0.0.0',
    os_label: 'Windows 11',
    event_type: 'auth.login_success',
    metadata: { origen: 'web' },
    reviewed: false,
    escalated: false
  },
  {
    id: 'evt-002',
    event_code: 'EVT-2026-000042',
    created_at: '2026-05-24T10:41:00+02:00',
    date_time_label: '24/05/2026 10:41',
    event_label: 'Informe publicado al paciente',
    module: 'reports',
    module_label: 'Informes',
    user_email: 'dra.elena@clinicanova.es',
    user_role: 'Doctor',
    clinic_name: 'Clínica Dental Nova',
    resource_label: 'INF-2026-0001',
    severity: 'low',
    severity_label: 'Bajo',
    result: 'ok',
    result_label: 'Correcto',
    route: '/admin/informes',
    ip_address: '185.199.108.11',
    user_agent: 'Mozilla/5.0 Safari/17',
    browser_label: 'Safari 17.0',
    os_label: 'macOS 14',
    event_type: 'report.published_to_patient',
    metadata: { informe_id: 'INF-2026-0001' },
    reviewed: true,
    escalated: false
  },
  {
    id: 'evt-003',
    event_code: 'EVT-2026-000045',
    created_at: '2026-05-24T10:45:12+02:00',
    date_time_label: '24/05/2026 10:45',
    event_label: 'Intento de acceso denegado',
    module: 'security',
    module_label: 'Seguridad',
    user_email: 'paciente@email.com',
    user_role: 'Paciente',
    clinic_name: 'Clínica Dental Nova',
    resource_label: 'Factura ajena',
    severity: 'high',
    severity_label: 'Alto',
    result: 'blocked',
    result_label: 'Bloqueado',
    route: '/api/v1/facturas/98765',
    ip_address: '185.199.108.25',
    user_agent: 'Mozilla/5.0 Chrome/124 Windows',
    browser_label: 'Chrome 124.0.0.0',
    os_label: 'Windows 11',
    event_type: 'security.access_denied',
    metadata: {
      recurso_id: 'FAC-2026-00987',
      metodo: 'GET',
      estado_http: 403,
      razon: 'Acceso a recurso no autorizado',
      origen: 'web'
    },
    reviewed: false,
    escalated: false
  },
  {
    id: 'evt-004',
    event_code: 'EVT-2026-000046',
    created_at: '2026-05-24T11:02:00+02:00',
    date_time_label: '24/05/2026 11:02',
    event_label: 'Descarga de factura',
    module: 'billing',
    module_label: 'Facturación',
    user_email: 'admin@clinicamediterraneo.es',
    user_role: 'Admin clínica',
    clinic_name: 'Clínica Mediterráneo Centro',
    resource_label: 'FAC-2026-0031',
    severity: 'medium',
    severity_label: 'Medio',
    result: 'ok',
    result_label: 'Correcto',
    route: '/admin/facturas',
    ip_address: '81.45.12.88',
    user_agent: 'Mozilla/5.0 Firefox/125',
    browser_label: 'Firefox 125.0',
    os_label: 'Linux',
    event_type: 'invoice.downloaded',
    metadata: { factura_id: 'FAC-2026-0031' },
    reviewed: false,
    escalated: false
  },
  {
    id: 'evt-005',
    event_code: 'EVT-2026-000047',
    created_at: '2026-05-24T11:15:00+02:00',
    date_time_label: '24/05/2026 11:15',
    event_label: 'Error al generar informe',
    module: 'reports',
    module_label: 'Informes',
    user_email: 'dra.maria@clinicaverde.es',
    user_role: 'Doctor',
    clinic_name: 'Clínica Verde',
    resource_label: 'INF-2026-0055',
    severity: 'medium',
    severity_label: 'Medio',
    result: 'failed',
    result_label: 'Fallido',
    route: '/api/records/report',
    ip_address: '92.168.1.44',
    user_agent: 'Mozilla/5.0 Chrome/124',
    browser_label: 'Chrome 124.0.0.0',
    os_label: 'Windows 10',
    event_type: 'error.pdf',
    metadata: { informe_id: 'INF-2026-0055', modulo: 'pdf' },
    reviewed: false,
    escalated: false
  }
];

for (let i = 6; i <= 248; i++) {
  const base = EVENTS[i % 5]!;
  EVENTS.push({
    ...base,
    id: `evt-gen-${i}`,
    event_code: `EVT-2026-${String(i).padStart(6, '0')}`,
    date_time_label: `24/05/2026 ${String(8 + (i % 12)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
    reviewed: i % 7 === 0
  });
}

export function getMonitoringDemo(): MonitoringPayload {
  return {
    kpis: [
      { id: 'events_today', label: 'Eventos hoy', value: 248, trend_label: '18% vs ayer', trend_direction: 'up', trend_positive: true },
      { id: 'logins_ok', label: 'Inicios correctos', value: 36, trend_label: '20% vs ayer', trend_direction: 'up', trend_positive: true },
      { id: 'logins_failed', label: 'Inicios fallidos', value: 4, trend_label: '-20% vs ayer', trend_direction: 'down', trend_positive: false },
      { id: 'access_denied', label: 'Accesos denegados', value: 2, trend_label: '-33% vs ayer', trend_direction: 'down', trend_positive: false },
      { id: 'critical_errors', label: 'Errores críticos', value: 0, trend_label: '0% vs ayer', trend_direction: 'neutral', trend_positive: true },
      { id: 'downloads', label: 'Descargas', value: 18, trend_label: '12% vs ayer', trend_direction: 'up', trend_positive: true }
    ],
    alerts: [
      { id: 'alert-1', title: '5 intentos fallidos en 10 min', time_label: 'Hace 3 min', tone: 'red', event_id: 'evt-003' },
      { id: 'alert-2', title: 'Acceso denegado a recurso protegido', time_label: 'Hace 11 min', tone: 'orange', event_id: 'evt-003' }
    ],
    hourly: [
      { hour: '00:00', events: 8 },
      { hour: '04:00', events: 12 },
      { hour: '08:00', events: 28 },
      { hour: '10:00', events: 42 },
      { hour: '12:00', events: 38 },
      { hour: '16:00', events: 52 },
      { hour: '20:00', events: 24 }
    ],
    modules: [
      { label: 'Auth', percent: 40, color: '#0d9488' },
      { label: 'Plataforma', percent: 30, color: '#0891b2' },
      { label: 'Portal paciente', percent: 20, color: '#6366f1' },
      { label: 'Seguridad', percent: 10, color: '#f59e0b' }
    ],
    severity_breakdown: [
      { severity: 'info', label: 'Info', count: 120, percent: 48 },
      { severity: 'low', label: 'Bajo', count: 72, percent: 29 },
      { severity: 'medium', label: 'Medio', count: 36, percent: 15 },
      { severity: 'high', label: 'Alto', count: 16, percent: 6 },
      { severity: 'critical', label: 'Crítico', count: 4, percent: 2 }
    ],
    events: EVENTS,
    clinics: ['Todas', 'Clínica Dental Nova', 'Clínica Mediterráneo Centro', 'Clínica Verde'],
    users: ['Todos', 'admin@clinicanova.es', 'paciente@email.com', 'dra.elena@clinicanova.es'],
    total_events: 248
  };
}

function matchesChip(row: MonitoringEventRow, chip: string) {
  if (chip === 'all') return true;
  if (chip === 'login') return row.event_type.startsWith('auth.');
  if (chip === 'security') return row.module === 'security' || row.severity === 'high';
  if (chip === 'errors') return row.result === 'failed' || row.event_type.startsWith('error.');
  if (chip === 'downloads') return row.event_type.includes('download');
  if (chip === 'critical') return row.severity === 'critical' || row.severity === 'high';
  return true;
}

function matchesKpi(row: MonitoringEventRow, kpi: string) {
  if (kpi === 'events_today') return true;
  if (kpi === 'logins_ok') return row.event_type === 'auth.login_success';
  if (kpi === 'logins_failed') return row.event_type === 'auth.login_failed';
  if (kpi === 'access_denied') return row.result === 'blocked';
  if (kpi === 'critical_errors') return row.severity === 'critical';
  if (kpi === 'downloads') return row.event_type.includes('download');
  return true;
}

export function filterMonitoringEvents(payload: MonitoringPayload, filters: MonitoringFilters) {
  let list = [...payload.events];
  const q = filters.q?.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (e) =>
        e.user_email.toLowerCase().includes(q) ||
        e.clinic_name.toLowerCase().includes(q) ||
        e.event_label.toLowerCase().includes(q) ||
        e.resource_label.toLowerCase().includes(q) ||
        e.ip_address.includes(q) ||
        e.event_code.toLowerCase().includes(q)
    );
  }
  if (filters.chip && filters.chip !== 'all') list = list.filter((e) => matchesChip(e, filters.chip!));
  if (filters.kpi) list = list.filter((e) => matchesKpi(e, filters.kpi!));
  if (filters.module && filters.module !== 'Todos') {
    list = list.filter((e) => e.module_label === filters.module || e.module === filters.module);
  }
  if (filters.severity && filters.severity !== 'Todas') {
    list = list.filter((e) => e.severity_label === filters.severity || e.severity === filters.severity);
  }
  if (filters.clinic && filters.clinic !== 'Todas') list = list.filter((e) => e.clinic_name === filters.clinic);
  if (filters.user && filters.user !== 'Todos') list = list.filter((e) => e.user_email === filters.user);
  return list;
}

export function markMonitoringReviewedDemo(id: string): boolean {
  const e = EVENTS.find((x) => x.id === id);
  if (!e) return false;
  e.reviewed = true;
  return true;
}

export function escalateMonitoringDemo(id: string): boolean {
  const e = EVENTS.find((x) => x.id === id);
  if (!e) return false;
  e.escalated = true;
  e.reviewed = true;
  return true;
}

export { SEVERITY_LABELS };
