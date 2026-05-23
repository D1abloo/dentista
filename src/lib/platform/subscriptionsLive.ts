import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { planLabel } from '@/lib/platform/clinicsDemo';
import type { SubscriptionRow, SubscriptionStatus } from '@/lib/platform/subscriptionsDemo';
import type { SubscriptionPlan } from '@/lib/platform/types';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

const STAFF_ROLES = ['clinic_admin', 'admin', 'owner', 'dentist', 'receptionist'] as const;

const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  essential: 49,
  professional: 99,
  enterprise: 199
};

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Activa',
  trialing: 'En prueba',
  past_due: 'Impago',
  canceled: 'Suspendida'
};

function joinedClinic<T>(raw: unknown): T | null {
  if (!raw || Array.isArray(raw)) return (raw as T[] | null)?.[0] ?? null;
  return raw as T;
}

function renewalLabels(renewsAt: string | null) {
  if (!renewsAt) {
    return { renewal_label: 'Sin fecha', renewal_sublabel: 'Configurar renovación', expiring_soon: false };
  }
  const date = new Date(renewsAt);
  if (Number.isNaN(date.getTime())) {
    return { renewal_label: 'Sin fecha', renewal_sublabel: 'Revisar renovación', expiring_soon: false };
  }
  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return {
    renewal_label: format(date, 'dd/MM/yyyy', { locale: es }),
    renewal_sublabel: days <= 30 ? `En ${days} días` : formatDistanceToNow(date, { addSuffix: true, locale: es }),
    expiring_soon: days <= 30 && days >= 0
  };
}

function mapRow(
  row: {
    id: string;
    clinic_id: string;
    plan: string;
    status: string;
    seats: number;
    renews_at: string | null;
    created_at: string;
    billing_email?: string | null;
    tax_id?: string | null;
    payment_method?: string | null;
    last_invoice?: string | null;
  },
  clinic: { name: string; slug: string; email?: string | null } | null,
  seatsUsed: number
): SubscriptionRow {
  const plan = row.plan as SubscriptionPlan;
  const status = (row.status in STATUS_LABELS ? row.status : 'active') as SubscriptionStatus;
  const seatsContracted = row.seats ?? 5;
  const seatsPercent = seatsContracted ? Math.round((seatsUsed / seatsContracted) * 100) : 0;
  const monthly = PLAN_PRICES[plan] ?? 49;
  const renewal = renewalLabels(row.renews_at);
  const billingEmail = row.billing_email ?? clinic?.email ?? '—';

  return {
    id: row.id,
    clinic_id: row.clinic_id,
    clinic_name: clinic?.name ?? '—',
    clinic_email: clinic?.email ?? billingEmail,
    tenant_slug: clinic?.slug ?? '—',
    plan,
    plan_label: planLabel(plan),
    status,
    status_label: STATUS_LABELS[status] ?? status,
    seats_contracted: seatsContracted,
    seats_used: seatsUsed,
    seats_percent: seatsPercent,
    renews_at: row.renews_at ?? new Date().toISOString(),
    renewal_label: renewal.renewal_label,
    renewal_sublabel: renewal.renewal_sublabel,
    monthly_price: monthly,
    billing_label: `${monthly} € / mes`,
    billing_status: status === 'past_due' ? 'overdue' : status === 'trialing' ? 'pending' : 'ok',
    billing_status_label: status === 'past_due' ? 'Pendiente' : status === 'trialing' ? 'En prueba' : 'Al día',
    billing_email: billingEmail,
    tax_id: row.tax_id ?? '—',
    payment_method: row.payment_method ?? 'Transferencia / tarjeta',
    last_invoice: row.last_invoice ?? null,
    next_invoice: renewal.renewal_label,
    mrr: monthly,
    is_pro: plan === 'professional' || plan === 'enterprise',
    expiring_soon: renewal.expiring_soon ?? false,
    has_unpaid: status === 'past_due',
    created_at: row.created_at
  };
}

async function staffCountByClinic(clinicIds: string[]) {
  const map = new Map<string, number>();
  if (!clinicIds.length) return map;
  const db = getSupabaseAdmin();
  const { data } = await db
    .from('profiles')
    .select('clinic_id, role')
    .in('clinic_id', clinicIds);
  for (const p of data ?? []) {
    if (!STAFF_ROLES.includes(p.role as (typeof STAFF_ROLES)[number])) continue;
    const id = p.clinic_id as string;
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
}

export async function listSubscriptionsLive(): Promise<SubscriptionRow[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('clinic_subscriptions')
    .select('id, clinic_id, plan, status, seats, renews_at, created_at, clinics(name, slug, email)')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const clinicIds = (data ?? []).map((r) => r.clinic_id as string);
  const staffMap = await staffCountByClinic(clinicIds);

  return (data ?? []).map((row) => {
    const clinic = joinedClinic<{ name: string; slug: string; email?: string | null }>(row.clinics);
    return mapRow(
      {
        id: row.id as string,
        clinic_id: row.clinic_id as string,
        plan: row.plan as string,
        status: row.status as string,
        seats: row.seats as number,
        renews_at: (row.renews_at as string | null) ?? null,
        created_at: row.created_at as string
      },
      clinic,
      staffMap.get(row.clinic_id as string) ?? 0
    );
  });
}

export async function createSubscriptionLive(input: {
  clinicId: string;
  plan: SubscriptionPlan;
  seats: number;
  billingEmail: string;
}) {
  const db = getSupabaseAdmin();
  const renews = new Date();
  renews.setMonth(renews.getMonth() + 1);

  const { data: existing } = await db
    .from('clinic_subscriptions')
    .select('id')
    .eq('clinic_id', input.clinicId)
    .maybeSingle();
  if (existing?.id) throw new Error('Esta clínica ya tiene una suscripción.');

  const { error } = await db.from('clinic_subscriptions').insert({
    clinic_id: input.clinicId,
    plan: input.plan,
    status: 'active',
    seats: input.seats,
    renews_at: renews.toISOString()
  });
  if (error) throw error;

  await db.from('clinics').update({ subscription_plan: input.plan }).eq('id', input.clinicId);
}

export async function updateSubscriptionPlanLive(id: string, plan: SubscriptionPlan) {
  const db = getSupabaseAdmin();
  const { data: sub, error } = await db
    .from('clinic_subscriptions')
    .update({ plan, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('clinic_id')
    .single();
  if (error) throw error;
  if (sub?.clinic_id) {
    await db.from('clinics').update({ subscription_plan: plan }).eq('id', sub.clinic_id);
  }
}

export async function updateSubscriptionSeatsLive(id: string, seats: number) {
  const db = getSupabaseAdmin();
  const { error } = await db
    .from('clinic_subscriptions')
    .update({ seats, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function suspendSubscriptionLive(id: string) {
  const db = getSupabaseAdmin();
  const { data: sub, error } = await db
    .from('clinic_subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('clinic_id')
    .single();
  if (error) throw error;
  if (sub?.clinic_id) {
    await db.from('clinics').update({ status: 'suspended' }).eq('id', sub.clinic_id);
  }
}
