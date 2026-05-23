export type PolicyStatus = 'active' | 'inactive' | 'warning';

export type SecurityPolicy = {
  id: string;
  title: string;
  status: PolicyStatus;
  status_label: string;
  description: string;
  actions: { id: string; label: string }[];
};

export type SecurityRole = {
  id: string;
  role: string;
  access: string;
  scope: string;
  sessions: number;
  status: 'active' | 'disabled';
  status_label: string;
  risk: 'low' | 'medium' | 'high';
};

export type SecuritySession = {
  id: string;
  user: string;
  role: string;
  route: string;
  tenant: string;
  tenant_masked: string;
  ip: string;
  device: string;
  last_activity: string;
};

export type SecurityAlert = {
  id: string;
  label: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  severity_label: string;
  filter: string;
};

export type IsolationReport = {
  last_check: string;
  result: string;
  rls_rules: number;
  incidents: number;
};

export type SecurityKpis = {
  overall_status: string;
  active_sessions: number;
  roles_configured: number;
  failed_attempts: number;
  critical_alerts: number;
  last_review: string;
};

export type SecurityPayload = {
  kpis: SecurityKpis;
  policies: SecurityPolicy[];
  roles: SecurityRole[];
  sessions: SecuritySession[];
  alerts: SecurityAlert[];
  isolation: IsolationReport;
  policy_settings: {
    require2fa: boolean;
    strongPassword: boolean;
    blockFailedAttempts: boolean;
    auditSensitive: boolean;
    sessionExpiryMinutes: number;
    maxFailedAttempts: number;
  };
};

export type SecurityDetail =
  | { kind: 'policy'; item: SecurityPolicy }
  | { kind: 'role'; item: SecurityRole }
  | { kind: 'session'; item: SecuritySession };

const POLICIES: SecurityPolicy[] = [
  {
    id: 'isolation',
    title: 'Aislamiento por clínica',
    status: 'active',
    status_label: 'Activo',
    description:
      'Citas, facturas, perfiles y mensajes se filtran por clinic_id y tenant_id. Un usuario autenticado solo ve su organización.',
    actions: [
      { id: 'rules', label: 'Ver reglas' },
      { id: 'test', label: 'Ejecutar test' }
    ]
  },
  {
    id: 'role_session',
    title: 'Sesión por rol',
    status: 'active',
    status_label: 'Activo',
    description:
      'clinic_admin entra a /admin. super_admin entra a /platform. No hay listados globales de pacientes en el panel de clínica.',
    actions: [
      { id: 'roles', label: 'Ver roles' },
      { id: 'sessions', label: 'Configurar sesiones' }
    ]
  },
  {
    id: 'no_cross',
    title: 'Sin red social entre clínicas',
    status: 'active',
    status_label: 'Activo',
    description:
      'No existe buscador de otras clínicas ni mensajería entre tenants. El soporte pasa por tickets aislados por clinic_id.',
    actions: [
      { id: 'restrictions', label: 'Ver restricciones' },
      { id: 'audit_search', label: 'Auditar búsquedas' }
    ]
  },
  {
    id: 'manual_onboard',
    title: 'Alta manual',
    status: 'active',
    status_label: 'Activo',
    description:
      'Cada solicitud en Registros crea tenant, clínica y un único administrador antes de activar el panel.',
    actions: [
      { id: 'flow', label: 'Ver flujo' },
      { id: 'config_reg', label: 'Configurar altas' }
    ]
  }
];

const ROLES: SecurityRole[] = [
  {
    id: 'role-sa',
    role: 'Super Admin',
    access: '/platform',
    scope: 'Metadatos globales sin datos clínicos cruzados',
    sessions: 1,
    status: 'active',
    status_label: 'Activo',
    risk: 'medium'
  },
  {
    id: 'role-ca',
    role: 'Admin clínica',
    access: '/admin',
    scope: 'Solo su tenant',
    sessions: 1,
    status: 'active',
    status_label: 'Activo',
    risk: 'low'
  },
  {
    id: 'role-staff',
    role: 'Staff clínica',
    access: '/admin',
    scope: 'Según permisos asignados',
    sessions: 0,
    status: 'active',
    status_label: 'Activo',
    risk: 'low'
  },
  {
    id: 'role-patient',
    role: 'Paciente',
    access: '/portal',
    scope: 'Solo su perfil',
    sessions: 0,
    status: 'active',
    status_label: 'Activo',
    risk: 'low'
  }
];

let sessionsStore: SecuritySession[] = [
  {
    id: 'sess-sa-001',
    user: 'Super Admin',
    role: 'Super Admin',
    route: '/platform',
    tenant: 'Global',
    tenant_masked: 'Global',
    ip: '181.23.45.67',
    device: 'Chrome · Windows',
    last_activity: 'Hoy, 10:35'
  }
];

function maskTenant(t: string) {
  if (t === 'Global' || t === 'Sin asignar') return t;
  if (t.length <= 10) return t;
  return `${t.slice(0, 8)}…`;
}

function buildPayload(): SecurityPayload {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  return {
    kpis: {
      overall_status: 'Seguro',
      active_sessions: sessionsStore.length,
      roles_configured: ROLES.length,
      failed_attempts: 0,
      critical_alerts: 0,
      last_review: `Hoy, ${h}:${m}`
    },
    policies: POLICIES.map((p) => ({ ...p, actions: [...p.actions] })),
    roles: ROLES.map((r) => ({ ...r })),
    sessions: sessionsStore.map((s) => ({ ...s })),
    alerts: [
      { id: 'failed', label: 'Intentos fallidos', count: 0, severity: 'low', severity_label: 'Bajo', filter: 'failed_login' },
      { id: 'tokens', label: 'Tokens inválidos', count: 0, severity: 'low', severity_label: 'Bajo', filter: 'invalid_token' },
      { id: 'blocked', label: 'Accesos bloqueados', count: 0, severity: 'low', severity_label: 'Bajo', filter: 'blocked' },
      { id: 'suspicious', label: 'Sesiones sospechosas', count: 0, severity: 'low', severity_label: 'Bajo', filter: 'suspicious' },
      { id: 'perms', label: 'Cambios de permisos', count: 1, severity: 'medium', severity_label: 'Medio', filter: 'permission_change' }
    ],
    isolation: {
      last_check: 'Hoy, 08:45',
      result: 'Sin incidencias',
      rls_rules: 12,
      incidents: 0
    },
    policy_settings: {
      require2fa: true,
      strongPassword: true,
      blockFailedAttempts: true,
      auditSensitive: true,
      sessionExpiryMinutes: 60,
      maxFailedAttempts: 5
    }
  };
}

let demoPayload = buildPayload();

export function getSecurityDemo(): SecurityPayload {
  const p = buildPayload();
  demoPayload.policy_settings = { ...demoPayload.policy_settings };
  return {
    ...p,
    policy_settings: { ...demoPayload.policy_settings }
  };
}

export function runSecurityReviewDemo(): { payload: SecurityPayload; passed: boolean; message: string } {
  const passed = true;
  const p = getSecurityDemo();
  p.kpis.last_review = p.kpis.last_review;
  p.isolation.last_check = p.kpis.last_review;
  p.isolation.result = passed ? 'Sin incidencias' : 'Incidencias detectadas';
  p.isolation.incidents = passed ? 0 : 1;
  demoPayload = { ...p, policy_settings: demoPayload.policy_settings };
  return {
    payload: getSecurityDemo(),
    passed,
    message: passed ? 'Revisión completada sin incidencias.' : 'Revisión completada con alertas.'
  };
}

export function revokeSessionDemo(sessionId: string): SecurityPayload | { error: string } {
  const before = sessionsStore.length;
  sessionsStore = sessionsStore.filter((s) => s.id !== sessionId);
  if (sessionsStore.length === before) return { error: 'No se pudo revocar la sesión.' };
  return getSecurityDemo();
}

export function updatePolicySettingsDemo(settings: SecurityPayload['policy_settings']): SecurityPayload {
  demoPayload.policy_settings = { ...settings };
  return getSecurityDemo();
}

export function runPolicyTestDemo(policyId: string): { ok: boolean; message: string } {
  const p = POLICIES.find((x) => x.id === policyId);
  if (!p) return { ok: false, message: 'Política no encontrada.' };
  return { ok: true, message: `Test de «${p.title}» superado correctamente.` };
}

export function maskTenantLabel(tenant: string) {
  return maskTenant(tenant);
}
