import type { SubscriptionPlan } from '@/lib/platform/types';
import { addClinicDemo } from '@/lib/platform/clinicsDemo';

export type RegistrationStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

export type RegistrationRow = {
  id: string;
  clinic_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  tax_id: string;
  message: string | null;
  requested_plan: string;
  assigned_plan: SubscriptionPlan | null;
  branches_count: number;
  status: RegistrationStatus;
  status_label: string;
  date_label: string;
  created_at: string;
  reviewed_at: string | null;
  clinic_id: string | null;
  review_notes: string | null;
  contact_display: string;
  has_tax_data: boolean;
  reviewed: boolean;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let demoStore: RegistrationRow[] = [
  {
    id: 'reg-approved-001',
    clinic_name: 'Clínica Dental Nova',
    owner_name: 'Ana Ruiz',
    email: 'ana@clinicadentalnova.es',
    phone: '+34 910 200 100',
    address: 'Calle Mayor 12',
    city: 'Madrid',
    tax_id: 'B12345678',
    message: 'Solicitud aprobada anteriormente.',
    requested_plan: 'PRO Clínica',
    assigned_plan: 'professional',
    branches_count: 1,
    status: 'approved',
    status_label: 'Aprobada',
    date_label: '20/05/2026',
    created_at: '2026-05-20T18:20:00.000Z',
    reviewed_at: '2026-05-20T10:35:00.000Z',
    clinic_id: 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001',
    review_notes: null,
    contact_display: 'ana@clinicadentalnova.es · +34 910 200 100',
    has_tax_data: true,
    reviewed: true
  },
  {
    id: 'reg-pending-002',
    clinic_name: 'Clínica Dental Sonrisa',
    owner_name: 'Laura Martín',
    email: 'laura@clinicasonrisa.com',
    phone: '+34 612 340 555',
    address: 'Calle de Alcalá 45',
    city: 'Madrid',
    tax_id: 'B87654321',
    message: 'Somos una clínica familiar con 2 gabinetes y queremos digitalizar citas y facturación.',
    requested_plan: 'PRO Clínica',
    assigned_plan: null,
    branches_count: 1,
    status: 'pending',
    status_label: 'Pendiente',
    date_label: 'Hoy, 10:35',
    created_at: '2026-05-21T08:35:00.000Z',
    reviewed_at: null,
    clinic_id: null,
    review_notes: null,
    contact_display: 'laura@clinicasonrisa.com · +34 612 340 555',
    has_tax_data: true,
    reviewed: false
  },
  {
    id: 'reg-review-003',
    clinic_name: 'Dental Plus Group',
    owner_name: 'Carlos Pérez',
    email: 'carlos@dentalplus.com',
    phone: '+34 612 340 777',
    address: 'Passeig de Gràcia 120',
    city: 'Barcelona',
    tax_id: 'B11223344',
    message: 'Grupo con 3 sedes. Necesitamos multi-sede y portal paciente unificado.',
    requested_plan: 'PRO Multi-sede',
    assigned_plan: null,
    branches_count: 3,
    status: 'in_review',
    status_label: 'En revisión',
    date_label: 'Ayer, 18:20',
    created_at: '2026-05-20T16:20:00.000Z',
    reviewed_at: null,
    clinic_id: null,
    review_notes: 'Pendiente de validar datos fiscales de sedes secundarias.',
    contact_display: 'carlos@dentalplus.com · +34 612 340 777',
    has_tax_data: true,
    reviewed: false
  }
];

export function planLabel(plan: SubscriptionPlan): string {
  if (plan === 'enterprise') return 'PRO Multi-sede';
  if (plan === 'professional') return 'PRO Clínica';
  return 'Básico';
}

export function getRegistrationsDemo(): RegistrationRow[] {
  return demoStore.map((r) => ({ ...r }));
}

export function getRegistrationsKpis(rows: RegistrationRow[]) {
  const approved = rows.filter((r) => r.status === 'approved');
  const reviewed = rows.filter((r) => r.reviewed_at);
  const avgMs =
    reviewed.length > 1
      ? reviewed.reduce((sum, r) => {
          const created = new Date(r.created_at).getTime();
          const done = new Date(r.reviewed_at!).getTime();
          return sum + (done - created);
        }, 0) / reviewed.length
      : null;

  return {
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: approved.length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
    inReview: rows.filter((r) => r.status === 'in_review').length,
    avgReviewLabel: avgMs ? `${Math.round(avgMs / 3600000)} h` : '—',
    tenantsCreated: approved.filter((r) => r.clinic_id).length
  };
}

export function findRegistrationDemo(id: string) {
  return demoStore.find((r) => r.id === id) ?? null;
}

export function slugTakenDemo(slug: string) {
  return demoStore.some((r) => r.status === 'approved' && r.clinic_name.toLowerCase().includes(slug.replace(/-/g, ' ')));
}

type ApproveInput = {
  id: string;
  plan: SubscriptionPlan;
  tenantSlug: string;
  adminEmail: string;
};

export function approveRegistrationDemo(input: ApproveInput): RegistrationRow | { error: string } {
  const idx = demoStore.findIndex((r) => r.id === input.id);
  if (idx < 0) return { error: 'No se pudo aprobar la solicitud.' };
  if (!input.plan) return { error: 'Selecciona un plan.' };
  if (!SLUG_RE.test(input.tenantSlug)) return { error: 'Introduce un slug de tenant válido.' };
  if (!EMAIL_RE.test(input.adminEmail)) return { error: 'Introduce un email de administrador válido.' };

  const reg = demoStore[idx];
  const clinicId = `clinic-${Date.now().toString(36)}`;
  const tenantId = `80e9a6b1-4c2d-4a1f-9b3e-${Date.now().toString(16).slice(0, 12)}`;

  addClinicDemo({
    id: clinicId,
    name: reg.clinic_name,
    slug: input.tenantSlug,
    email: input.adminEmail,
    phone: reg.phone,
    address: reg.address,
    city: reg.city,
    status: 'active',
    subscription_plan: input.plan,
    tenant_id: tenantId,
    is_main_branch: true,
    created_at: new Date().toISOString(),
    approved_at: new Date().toISOString(),
    organization_label: 'Independiente',
    tenant_display: `${tenantId.slice(0, 8)}…`,
    plan_label: planLabel(input.plan),
    activity_label: 'Ahora',
    staff_count: 1,
    patients_count: 0,
    appointments_month: 0,
    pending_invoices: 0,
    isolation_ok: true
  });

  const next: RegistrationRow = {
    ...reg,
    status: 'approved',
    status_label: 'Aprobada',
    assigned_plan: input.plan,
    clinic_id: clinicId,
    reviewed_at: new Date().toISOString(),
    date_label: 'Ahora',
    reviewed: true,
    email: input.adminEmail
  };
  demoStore[idx] = next;
  return next;
}

export function rejectRegistrationDemo(id: string, reason: string): RegistrationRow | { error: string } {
  if (!reason.trim()) return { error: 'El motivo del rechazo es obligatorio.' };
  const idx = demoStore.findIndex((r) => r.id === id);
  if (idx < 0) return { error: 'No se pudo rechazar la solicitud.' };
  const next: RegistrationRow = {
    ...demoStore[idx],
    status: 'rejected',
    status_label: 'Rechazada',
    review_notes: reason.trim(),
    reviewed_at: new Date().toISOString(),
    reviewed: true,
    date_label: 'Ahora'
  };
  demoStore[idx] = next;
  return next;
}

export function requestInfoDemo(id: string, message?: string): RegistrationRow | null {
  const idx = demoStore.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const next: RegistrationRow = {
    ...demoStore[idx],
    status: 'in_review',
    status_label: 'En revisión',
    review_notes: message?.trim() || 'Se solicitó información adicional al solicitante.',
    reviewed: false
  };
  demoStore[idx] = next;
  return next;
}

export function addManualRegistrationDemo(input: {
  clinicName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  plan: string;
}): RegistrationRow {
  const row: RegistrationRow = {
    id: `reg-manual-${Date.now()}`,
    clinic_name: input.clinicName,
    owner_name: input.ownerName,
    email: input.email,
    phone: input.phone,
    address: '—',
    city: input.city,
    tax_id: '—',
    message: 'Alta manual desde plataforma.',
    requested_plan: input.plan,
    assigned_plan: null,
    branches_count: 1,
    status: 'pending',
    status_label: 'Pendiente',
    date_label: 'Ahora',
    created_at: new Date().toISOString(),
    reviewed_at: null,
    clinic_id: null,
    review_notes: null,
    contact_display: `${input.email} · ${input.phone}`,
    has_tax_data: false,
    reviewed: false
  };
  demoStore = [row, ...demoStore];
  return row;
}
