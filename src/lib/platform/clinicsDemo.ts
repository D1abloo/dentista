import type { PlatformClinic, SubscriptionPlan } from '@/lib/platform/types';

export type ClinicListRow = PlatformClinic & {
  organization_label: string;
  tenant_display: string;
  plan_label: string;
  activity_label: string;
  staff_count: number;
  patients_count: number;
  appointments_month: number;
  pending_invoices: number;
  isolation_ok: boolean;
};

export function planLabel(plan: SubscriptionPlan): string {
  if (plan === 'enterprise') return 'PRO Multi-sede';
  if (plan === 'professional') return 'Profesional';
  return 'Básico';
}

let demoStore: ClinicListRow[] = [
  {
    id: 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001',
    name: 'Clínica Dental Nova',
    slug: 'clinica-dental-nova',
    email: 'contacto@clinicadentalnova.es',
    phone: '+34 910 200 100',
    address: 'Calle Mayor 12',
    city: 'Madrid',
    status: 'active',
    subscription_plan: 'professional',
    tenant_id: '80e9a6b1-4c2d-4a1f-9b3e-1a2b3c4d5e6f',
    is_main_branch: true,
    created_at: '2026-05-20T08:00:00.000Z',
    approved_at: '2026-05-20T09:00:00.000Z',
    organization_label: 'Independiente',
    tenant_display: '80e9a6b1…',
    plan_label: 'Profesional',
    activity_label: 'Hoy, 10:35',
    staff_count: 1,
    patients_count: 4,
    appointments_month: 28,
    pending_invoices: 4,
    isolation_ok: true
  }
];

export function getClinicsDemo(): ClinicListRow[] {
  return demoStore.map((c) => ({ ...c }));
}

export function getClinicsKpis(rows: ClinicListRow[]) {
  return {
    total: rows.length,
    active: rows.filter((c) => c.status === 'active').length,
    pending: rows.filter((c) => c.status === 'pending').length,
    suspended: rows.filter((c) => c.status === 'suspended').length,
    planPro: rows.filter((c) => c.subscription_plan === 'professional' || c.subscription_plan === 'enterprise').length,
    tenantsLinked: rows.filter((c) => Boolean(c.tenant_id)).length
  };
}

export function updateClinicDemo(id: string, patch: Partial<ClinicListRow>): ClinicListRow | null {
  const idx = demoStore.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  const next = { ...demoStore[idx], ...patch };
  if (patch.subscription_plan) next.plan_label = planLabel(patch.subscription_plan);
  if (patch.status === 'active') next.activity_label = 'Hoy, ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  demoStore[idx] = next;
  return next;
}

export function addClinicDemo(row: ClinicListRow) {
  demoStore = [row, ...demoStore];
  return row;
}

export function slugExists(slug: string, exceptId?: string) {
  return demoStore.some((c) => c.slug === slug && c.id !== exceptId);
}

export function tenantExists(tenantId: string | null, exceptId?: string) {
  if (!tenantId) return false;
  return demoStore.some((c) => c.tenant_id === tenantId && c.id !== exceptId);
}
