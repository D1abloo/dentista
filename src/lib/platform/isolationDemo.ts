export type IsolationRisk = 'low' | 'medium' | 'high';

export type IsolationClinicRow = {
  id: string;
  name: string;
  slug: string;
  tenant_id: string | null;
  tenant_display: string;
  status_label: 'Aislado' | 'Sin tenant' | 'Pendiente';
  rls_label: 'Activo' | 'Pendiente' | 'Inactivo';
  staff_count: number;
  patient_count: number;
  last_review: string;
  risk: IsolationRisk;
  has_tenant: boolean;
  rls_active: boolean;
  protected_tables: number;
  incidents: number;
  panel_path: string;
  portal_isolated: boolean;
};

export type IsolationTest = {
  id: string;
  label: string;
  status: 'ok' | 'fail' | 'pending';
};

export type IsolationActivity = {
  id: string;
  label: string;
  when: string;
  actor: string;
};

export type IsolationPayload = {
  lastVerification: string;
  verificationResult: string;
  coverage: number;
  kpis: {
    withTenant: number;
    withoutTenant: number;
    isolatedTenants: string;
    rlsRules: number;
    staffUsers: number;
    isolationIncidents: number;
  };
  clinics: IsolationClinicRow[];
  tests: IsolationTest[];
  activity: IsolationActivity[];
  policies: Record<string, boolean>;
};

export const POLICY_CHECKLIST = [
  'Tenant único por clínica',
  'RLS activo en Supabase',
  'Usuarios limitados a su clínica',
  'Portal paciente aislado',
  'Super Admin solo ve metadatos agregados',
  'Registros revisados manualmente'
];

const CLINIC_ID = 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001';

let demoClinics: IsolationClinicRow[] = [
  {
    id: CLINIC_ID,
    name: 'Clínica Dental Nova',
    slug: 'clinica-dental-nova',
    tenant_id: '80e9a6b1-4c2d-4a1f-9b3e-1a2b3c4d5e6f',
    tenant_display: '80e9a6b1…',
    status_label: 'Aislado',
    rls_label: 'Activo',
    staff_count: 1,
    patient_count: 5,
    last_review: 'Hoy, 08:45',
    risk: 'low',
    has_tenant: true,
    rls_active: true,
    protected_tables: 12,
    incidents: 0,
    panel_path: '/admin',
    portal_isolated: true
  }
];

let demoTests: IsolationTest[] = [
  { id: 't1', label: 'Usuario de Clínica A no puede ver pacientes de Clínica B', status: 'ok' },
  { id: 't2', label: 'Paciente no puede ver facturas de otro paciente', status: 'ok' },
  { id: 't3', label: 'Staff no puede acceder a otro tenant', status: 'ok' },
  { id: 't4', label: 'Token de portal no permite cruce de datos', status: 'ok' },
  { id: 't5', label: 'Super Admin no mezcla bandejas ni chats entre tenants', status: 'ok' }
];

let demoActivity: IsolationActivity[] = [
  { id: 'a1', label: 'Verificación RLS ejecutada', when: 'Hoy, 08:45', actor: 'Super Admin' },
  { id: 'a2', label: 'Tenant vinculado correctamente', when: 'Ayer, 18:45', actor: 'Sistema' },
  { id: 'a3', label: 'Acceso cruzado bloqueado', when: 'Ayer, 12:20', actor: 'Sistema' },
  { id: 'a4', label: 'Reglas de Supabase revisadas', when: 'Ayer, 11:05', actor: 'Super Admin' },
  { id: 'a5', label: 'Portal paciente verificado', when: '20/05/2026', actor: 'Super Admin' }
];

let demoPolicies: Record<string, boolean> = {
  uniqueTenant: true,
  rlsActive: true,
  clinicScopedUsers: true,
  isolatedPortal: true,
  adminMetadataOnly: true,
  manualReview: true
};

let lastVerification = 'Hoy, 08:45';
let verificationResult = 'Sin incidencias';
let coverage = 100;

export function getIsolationDemo(): IsolationPayload {
  const withTenant = demoClinics.filter((c) => c.has_tenant).length;
  const withoutTenant = demoClinics.filter((c) => !c.has_tenant).length;
  const staff = demoClinics.reduce((s, c) => s + c.staff_count, 0);
  const incidents = demoClinics.reduce((s, c) => s + c.incidents, 0);
  return {
    lastVerification,
    verificationResult,
    coverage,
    kpis: {
      withTenant,
      withoutTenant,
      isolatedTenants: `${withTenant} / ${withTenant || 1}`,
      rlsRules: 12,
      staffUsers: staff,
      isolationIncidents: incidents
    },
    clinics: demoClinics.map((c) => ({ ...c })),
    tests: demoTests.map((t) => ({ ...t })),
    activity: demoActivity.map((a) => ({ ...a })),
    policies: { ...demoPolicies }
  };
}

export function runVerificationDemo(): IsolationPayload {
  lastVerification = 'Ahora';
  verificationResult = 'Sin incidencias';
  coverage = 100;
  demoTests = demoTests.map((t) => ({ ...t, status: 'ok' as const }));
  demoActivity.unshift({
    id: 'a-' + Date.now(),
    label: 'Verificación RLS ejecutada',
    when: 'Ahora',
    actor: 'Super Admin'
  });
  demoClinics = demoClinics.map((c) => ({
    ...c,
    last_review: 'Ahora',
    rls_active: true,
    rls_label: 'Activo',
    risk: 'low'
  }));
  return getIsolationDemo();
}

export function runClinicTestDemo(clinicId: string): IsolationPayload {
  demoClinics = demoClinics.map((c) =>
    c.id === clinicId ? { ...c, last_review: 'Ahora', incidents: c.incidents } : c
  );
  demoActivity.unshift({
    id: 'a-test-' + Date.now(),
    label: `Test de aislamiento — ${demoClinics.find((c) => c.id === clinicId)?.name ?? 'clínica'}`,
    when: 'Ahora',
    actor: 'Super Admin'
  });
  return getIsolationDemo();
}

export function updatePoliciesDemo(policies: Record<string, boolean>) {
  demoPolicies = { ...demoPolicies, ...policies };
  return getIsolationDemo();
}

export function escalateIsolationDemo(clinicId: string) {
  const c = demoClinics.find((x) => x.id === clinicId);
  if (c) {
    c.incidents += 1;
    c.risk = 'high';
  }
  demoActivity.unshift({
    id: 'a-esc-' + Date.now(),
    label: 'Incidencia de aislamiento escalada',
    when: 'Ahora',
    actor: 'Super Admin'
  });
  return getIsolationDemo();
}
