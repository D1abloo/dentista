export type RiskLevel = 'low' | 'medium' | 'high';
export type IncidentStatus = 'registered' | 'pending' | 'critical' | 'reviewed' | 'escalated';
export type ModeKey = 'clinic_panel' | 'patient_portal' | 'billing' | 'documents' | 'users' | 'security' | 'isolation';

export type InspectionRow = {
  id: string;
  date_label: string;
  created_at: string;
  actor_name: string;
  actor_role: string;
  actor_initials: string;
  is_system: boolean;
  clinic_name: string;
  clinic_slug: string;
  clinic_id: string;
  patient_name: string | null;
  patient_id: string | null;
  mode: string;
  mode_key: ModeKey;
  event_label: string;
  resource_label: string;
  route: string;
  ip: string;
  device: string;
  reason: string;
  actions_done: string;
  risk: RiskLevel;
  status: IncidentStatus;
  priority: 'normal' | 'high' | 'critical';
};

function row(partial: Omit<InspectionRow, 'id'> & { id?: string }): InspectionRow {
  return { id: partial.id ?? crypto.randomUUID(), ...partial } as InspectionRow;
}

let demoStore: InspectionRow[] = [
  row({
    id: 'insp-1',
    date_label: 'Hoy, 10:35',
    created_at: new Date().toISOString(),
    actor_name: 'Super Admin',
    actor_role: 'Super administrador',
    actor_initials: 'SA',
    is_system: false,
    clinic_name: 'Clínica Dental Nova',
    clinic_slug: 'clinica-dental-nova',
    clinic_id: 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001',
    patient_name: 'María González',
    patient_id: 'u4',
    mode: 'Portal paciente',
    mode_key: 'patient_portal',
    event_label: 'Acceso a factura',
    resource_label: 'Factura #FAC-2041',
    route: '/paciente/facturas/FAC-2041',
    ip: '185.23.45.67',
    device: 'Chrome · Windows 10',
    reason: 'Revisión de soporte',
    actions_done: 'Visualización de factura',
    risk: 'low',
    status: 'registered',
    priority: 'normal'
  }),
  row({
    id: 'insp-2',
    date_label: 'Ayer, 18:45',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    actor_name: 'Super Admin',
    actor_role: 'Super administrador',
    actor_initials: 'SA',
    is_system: false,
    clinic_name: 'Clínica Dental Nova',
    clinic_slug: 'clinica-dental-nova',
    clinic_id: 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001',
    patient_name: 'Carlos Ruiz',
    patient_id: 'u3',
    mode: 'Panel clínica',
    mode_key: 'clinic_panel',
    event_label: 'Consulta de expediente',
    resource_label: 'Expediente #EXP-1023',
    route: '/expedientes/EXP-1023',
    ip: '185.23.45.67',
    device: 'Chrome · Windows 10',
    reason: 'Revisión administrativa solicitada',
    actions_done: 'Consulta de expediente y documentos',
    risk: 'medium',
    status: 'pending',
    priority: 'normal'
  }),
  row({
    id: 'insp-3',
    date_label: 'Ayer, 11:05',
    created_at: new Date(Date.now() - 90000000).toISOString(),
    actor_name: 'Sistema',
    actor_role: 'Automático',
    actor_initials: '⚙',
    is_system: true,
    clinic_name: 'Clínica Dental Nova',
    clinic_slug: 'clinica-dental-nova',
    clinic_id: 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001',
    patient_name: null,
    patient_id: null,
    mode: 'Seguridad',
    mode_key: 'security',
    event_label: 'Intento de token inválido',
    resource_label: 'Token portal',
    route: '/api/portal-access/verify',
    ip: '203.0.113.44',
    device: 'Desconocido',
    reason: '—',
    actions_done: 'Bloqueo automático',
    risk: 'high',
    status: 'critical',
    priority: 'critical'
  }),
  row({
    id: 'insp-4',
    date_label: '18/05/2026, 16:20',
    created_at: '2026-05-18T16:20:00.000Z',
    actor_name: 'Super Admin',
    actor_role: 'Super administrador',
    actor_initials: 'SA',
    is_system: false,
    clinic_name: 'Clínica Dental Nova',
    clinic_slug: 'clinica-dental-nova',
    clinic_id: 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001',
    patient_name: null,
    patient_id: null,
    mode: 'Facturación',
    mode_key: 'billing',
    event_label: 'Revisión de cobros',
    resource_label: 'Módulo facturación',
    route: '/admin/facturas',
    ip: '185.23.45.67',
    device: 'Firefox · macOS',
    reason: 'Auditoría mensual',
    actions_done: 'Listado de facturas pendientes',
    risk: 'low',
    status: 'reviewed',
    priority: 'normal'
  }),
  row({
    id: 'insp-5',
    date_label: '17/05/2026, 09:15',
    created_at: '2026-05-17T09:15:00.000Z',
    actor_name: 'Super Admin',
    actor_role: 'Super administrador',
    actor_initials: 'SA',
    is_system: false,
    clinic_name: 'Clínica Dental Nova',
    clinic_slug: 'clinica-dental-nova',
    clinic_id: 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001',
    patient_name: 'Ana Torres',
    patient_id: 'u2',
    mode: 'Documentos',
    mode_key: 'documents',
    event_label: 'Descarga de informe',
    resource_label: 'Informe clínico',
    route: '/admin/documentos/INF-88',
    ip: '185.23.45.67',
    device: 'Chrome · Windows 10',
    reason: 'Verificación RGPD',
    actions_done: 'Descarga PDF informe',
    risk: 'medium',
    status: 'reviewed',
    priority: 'normal'
  }),
  row({
    id: 'insp-6',
    date_label: '16/05/2026, 14:02',
    created_at: '2026-05-16T14:02:00.000Z',
    actor_name: 'Super Admin',
    actor_role: 'Super administrador',
    actor_initials: 'SA',
    is_system: false,
    clinic_name: 'Clínica Dental Nova',
    clinic_slug: 'clinica-dental-nova',
    clinic_id: 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001',
    patient_name: null,
    patient_id: null,
    mode: 'Usuarios',
    mode_key: 'users',
    event_label: 'Alta de usuario staff',
    resource_label: 'Usuario recepción',
    route: '/platform/usuarios',
    ip: '185.23.45.67',
    device: 'Chrome · Windows 10',
    reason: 'Onboarding clínica',
    actions_done: 'Creación de cuenta recepción',
    risk: 'low',
    status: 'registered',
    priority: 'normal'
  })
];

export function getIncidentsDemo(): InspectionRow[] {
  return demoStore.map((r) => ({ ...r }));
}

export function getIncidentsKpis(rows: InspectionRow[]) {
  const today = rows.filter((r) => r.date_label.startsWith('Hoy')).length;
  return {
    reviewsStarted: rows.filter((r) => !r.is_system && r.status !== 'reviewed').length,
    eventsAudited: rows.length,
    openIncidents: rows.filter((r) => r.status === 'pending' || r.status === 'critical').length,
    panelAccess: rows.filter((r) => r.mode_key === 'clinic_panel').length,
    portalAccess: rows.filter((r) => r.mode_key === 'patient_portal').length,
    criticalEvents: rows.filter((r) => r.risk === 'high' || r.status === 'critical').length,
    today
  };
}

export function addIncidentDemo(row: InspectionRow) {
  demoStore = [row, ...demoStore];
  return row;
}

export function updateIncidentDemo(id: string, patch: Partial<InspectionRow>): InspectionRow | null {
  const idx = demoStore.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  demoStore[idx] = { ...demoStore[idx], ...patch };
  return demoStore[idx];
}

export const REVIEW_TYPES: { value: ModeKey | 'security'; label: string }[] = [
  { value: 'clinic_panel', label: 'Panel clínica' },
  { value: 'patient_portal', label: 'Portal paciente' },
  { value: 'billing', label: 'Facturación' },
  { value: 'documents', label: 'Documentos' },
  { value: 'users', label: 'Usuarios' },
  { value: 'isolation', label: 'Aislamiento' },
  { value: 'security', label: 'Seguridad' }
];

export const DEMO_PATIENTS = [
  { id: 'u4', name: 'María González' },
  { id: 'u3', name: 'Carlos Ruiz' },
  { id: 'u2', name: 'Ana Torres' },
  { id: 'u1', name: 'Lucía Méndez' }
];
