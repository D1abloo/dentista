import type { SubscriptionPlan } from '@/lib/platform/types';
import { planLabel } from '@/lib/platform/clinicsDemo';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

export type SubscriptionRow = {
  id: string;
  clinic_id: string;
  clinic_name: string;
  clinic_email: string;
  tenant_slug: string;
  plan: SubscriptionPlan;
  plan_label: string;
  status: SubscriptionStatus;
  status_label: string;
  seats_contracted: number;
  seats_used: number;
  seats_percent: number;
  renews_at: string;
  renewal_label: string;
  renewal_sublabel: string;
  monthly_price: number;
  billing_label: string;
  billing_status: 'ok' | 'pending' | 'overdue';
  billing_status_label: string;
  billing_email: string;
  tax_id: string;
  payment_method: string;
  last_invoice: string | null;
  next_invoice: string;
  mrr: number;
  is_pro: boolean;
  expiring_soon: boolean;
  has_unpaid: boolean;
  created_at: string;
};

export const PLATFORM_PLANS: { id: SubscriptionPlan; name: string; desc: string }[] = [
  { id: 'essential', name: 'Básico', desc: 'Para clínicas pequeñas' },
  { id: 'professional', name: 'Profesional', desc: 'Gestión completa de clínica' },
  { id: 'professional', name: 'PRO Clínica', desc: 'Funciones avanzadas' },
  { id: 'enterprise', name: 'PRO Multi-sede', desc: 'Organizaciones con varias clínicas' },
  { id: 'enterprise', name: 'Enterprise', desc: 'Contratos a medida' }
];

const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  essential: 49,
  professional: 0,
  enterprise: 199
};

let demoStore: SubscriptionRow[] = [
  {
    id: 'sub-nova-001',
    clinic_id: 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001',
    clinic_name: 'Clínica Dental Nova',
    clinic_email: 'contacto@clinicadentalnova.es',
    tenant_slug: 'clinica-dental-nova',
    plan: 'professional',
    plan_label: 'Profesional',
    status: 'active',
    status_label: 'Activa',
    seats_contracted: 10,
    seats_used: 10,
    seats_percent: 100,
    renews_at: '2026-06-20T00:00:00.000Z',
    renewal_label: '20/06/2026',
    renewal_sublabel: 'En 30 días',
    monthly_price: 0,
    billing_label: '0 € / mes',
    billing_status: 'ok',
    billing_status_label: 'Al día',
    billing_email: 'contacto@clinicadentalnova.es',
    tax_id: 'B00000000',
    payment_method: 'No configurado',
    last_invoice: null,
    next_invoice: '20/06/2026',
    mrr: 0,
    is_pro: true,
    expiring_soon: true,
    has_unpaid: false,
    created_at: '2026-05-20T09:00:00.000Z'
  }
];

export function getSubscriptionsDemo(): SubscriptionRow[] {
  return demoStore.map((s) => ({ ...s }));
}

export function getSubscriptionsKpis(rows: SubscriptionRow[]) {
  const active = rows.filter((r) => r.status === 'active' || r.status === 'trialing');
  const mrr = rows.reduce((s, r) => s + r.mrr, 0);
  const seatsUsed = rows.reduce((s, r) => s + r.seats_used, 0);
  const seatsTotal = rows.reduce((s, r) => s + r.seats_contracted, 0);
  return {
    active: active.length,
    mrr,
    arr: mrr * 12,
    proPlans: rows.filter((r) => r.is_pro).length,
    seatsLabel: `${seatsUsed} / ${seatsTotal || 10}`,
    seatsPercent: seatsTotal ? Math.round((seatsUsed / seatsTotal) * 100) : 0,
    pendingPayments: rows.filter((r) => r.has_unpaid || r.status === 'past_due').length
  };
}

export function findSubscriptionDemo(id: string) {
  return demoStore.find((s) => s.id === id) ?? null;
}

function refreshRow(row: SubscriptionRow): SubscriptionRow {
  const pct = row.seats_contracted ? Math.round((row.seats_used / row.seats_contracted) * 100) : 0;
  return {
    ...row,
    seats_percent: pct,
    plan_label: planLabel(row.plan),
    billing_label: `${row.monthly_price} € / mes`,
    is_pro: row.plan === 'professional' || row.plan === 'enterprise',
    mrr: row.monthly_price
  };
}

export function createSubscriptionDemo(input: {
  clinicId: string;
  clinicName: string;
  clinicEmail: string;
  tenantSlug: string;
  plan: SubscriptionPlan;
  seats: number;
  billingEmail: string;
}): SubscriptionRow | { error: string } {
  if (!input.clinicId) return { error: 'Selecciona una clínica.' };
  if (!input.plan) return { error: 'Selecciona un plan.' };
  if (input.seats < 1) return { error: 'El número de asientos debe ser mayor que 0.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.billingEmail)) {
    return { error: 'Introduce un email de facturación válido.' };
  }
  if (demoStore.some((s) => s.clinic_id === input.clinicId)) {
    return { error: 'Esta clínica ya tiene una suscripción.' };
  }
  const price = PLAN_PRICES[input.plan] ?? 0;
  const row = refreshRow({
    id: `sub-${Date.now()}`,
    clinic_id: input.clinicId,
    clinic_name: input.clinicName,
    clinic_email: input.clinicEmail,
    tenant_slug: input.tenantSlug,
    plan: input.plan,
    plan_label: planLabel(input.plan),
    status: 'active',
    status_label: 'Activa',
    seats_contracted: input.seats,
    seats_used: 1,
    seats_percent: 0,
    renews_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    renewal_label: new Date(Date.now() + 30 * 86400000).toLocaleDateString('es-ES'),
    renewal_sublabel: 'En 30 días',
    monthly_price: price,
    billing_label: `${price} € / mes`,
    billing_status: 'ok',
    billing_status_label: 'Al día',
    billing_email: input.billingEmail,
    tax_id: 'B00000000',
    payment_method: 'No configurado',
    last_invoice: null,
    next_invoice: new Date(Date.now() + 30 * 86400000).toLocaleDateString('es-ES'),
    mrr: price,
    is_pro: input.plan !== 'essential',
    expiring_soon: true,
    has_unpaid: false,
    created_at: new Date().toISOString()
  });
  demoStore = [row, ...demoStore];
  return row;
}

export function updatePlanDemo(id: string, plan: SubscriptionPlan): SubscriptionRow | { error: string } {
  if (!plan) return { error: 'Selecciona un plan.' };
  const idx = demoStore.findIndex((s) => s.id === id);
  if (idx < 0) return { error: 'No se pudo guardar la suscripción.' };
  const price = PLAN_PRICES[plan] ?? 0;
  demoStore[idx] = refreshRow({
    ...demoStore[idx],
    plan,
    monthly_price: price
  });
  return demoStore[idx];
}

export function updateSeatsDemo(id: string, seats: number): SubscriptionRow | { error: string } {
  if (seats < 1) return { error: 'El número de asientos debe ser mayor que 0.' };
  const idx = demoStore.findIndex((s) => s.id === id);
  if (idx < 0) return { error: 'No se pudo guardar la suscripción.' };
  demoStore[idx] = refreshRow({
    ...demoStore[idx],
    seats_contracted: seats,
    seats_used: Math.min(demoStore[idx].seats_used, seats)
  });
  return demoStore[idx];
}

export function suspendSubscriptionDemo(id: string): SubscriptionRow | null {
  const idx = demoStore.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  demoStore[idx] = refreshRow({
    ...demoStore[idx],
    status: 'canceled',
    status_label: 'Suspendida'
  });
  return demoStore[idx];
}

export function generateInvoiceDemo(id: string): SubscriptionRow | null {
  const idx = demoStore.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const now = new Date().toLocaleDateString('es-ES');
  demoStore[idx] = { ...demoStore[idx], last_invoice: now };
  return demoStore[idx];
}

export function updateBillingDemo(id: string, billingEmail: string, taxId?: string): SubscriptionRow | { error: string } {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
    return { error: 'Introduce un email de facturación válido.' };
  }
  const idx = demoStore.findIndex((s) => s.id === id);
  if (idx < 0) return { error: 'No se pudo guardar la suscripción.' };
  demoStore[idx] = {
    ...demoStore[idx],
    billing_email: billingEmail,
    tax_id: taxId ?? demoStore[idx].tax_id
  };
  return demoStore[idx];
}

export function getPlanConfigDemo() {
  return PLATFORM_PLANS;
}
