import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';
import type {
  ClinicRegistration,
  ClinicStatus,
  PlatformClinic,
  PlatformClinicUser,
  PlatformIsolationReport,
  PlatformOverview,
  PlatformSettingRow,
  PlatformSubscription,
  PlatformUsageRow,
  RegistrationStatus,
  SubscriptionPlan,
  SupportRequest,
  SupportStatus
} from '@/lib/platform/types';

function joinedClinic<T>(raw: unknown): T | null {
  if (!raw || Array.isArray(raw)) return (raw as T[] | null)?.[0] ?? null;
  return raw as T;
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

export async function fetchPlatformOverview(): Promise<PlatformOverview> {
  if (!hasSupabaseConfig()) {
    return {
      clinicsTotal: 0,
      clinicsActive: 0,
      clinicsPending: 0,
      clinicsSuspended: 0,
      registrationsPending: 0,
      supportOpen: 0,
      staffUsers: 0,
      tenantsLinked: 0
    };
  }
  const db = getSupabaseAdmin();
  const [clinics, regs, support, staff, tenants] = await Promise.all([
    db.from('clinics').select('id, status, tenant_id', { count: 'exact' }),
    db.from('clinic_registrations').select('id', { count: 'exact' }).eq('status', 'pending'),
    db.from('support_requests').select('id', { count: 'exact' }).in('status', ['open', 'in_progress']),
    db
      .from('profiles')
      .select('id', { count: 'exact' })
      .in('role', ['clinic_admin', 'admin', 'dentist', 'receptionist', 'owner']),
    db.from('clinics').select('id', { count: 'exact' }).not('tenant_id', 'is', null)
  ]);
  const rows = clinics.data ?? [];
  return {
    clinicsTotal: clinics.count ?? rows.length,
    clinicsActive: rows.filter((c) => c.status === 'active').length,
    clinicsPending: rows.filter((c) => c.status === 'pending').length,
    clinicsSuspended: rows.filter((c) => c.status === 'suspended').length,
    registrationsPending: regs.count ?? 0,
    supportOpen: support.count ?? 0,
    staffUsers: staff.count ?? 0,
    tenantsLinked: tenants.count ?? rows.filter((c) => c.tenant_id).length
  };
}

export async function listClinics(): Promise<PlatformClinic[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('clinics')
    .select('id, name, slug, email, phone, address, status, subscription_plan, tenant_id, created_at, approved_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PlatformClinic[];
}

export async function listRegistrations(status?: RegistrationStatus): Promise<ClinicRegistration[]> {
  const db = getSupabaseAdmin();
  let q = db
    .from('clinic_registrations')
    .select('*')
    .order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ClinicRegistration[];
}

export async function listSupportRequests(): Promise<SupportRequest[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('support_requests').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SupportRequest[];
}

export async function createRegistration(input: {
  clinic_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  message?: string;
}) {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('clinic_registrations').insert({ ...input, status: 'pending' }).select().single();
  if (error) throw error;
  return data as ClinicRegistration;
}

export async function reviewRegistration(
  id: string,
  decision: 'approved' | 'rejected',
  reviewNotes?: string
) {
  const db = getSupabaseAdmin();
  const { data: reg, error: regErr } = await db.from('clinic_registrations').select('*').eq('id', id).single();
  if (regErr || !reg) throw regErr ?? new Error('Registro no encontrado');

  if (decision === 'rejected') {
    const { error } = await db
      .from('clinic_registrations')
      .update({ status: 'rejected', review_notes: reviewNotes, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return { registration: reg, clinic: null };
  }

  const slug = `${slugify(reg.clinic_name)}-${Date.now().toString(36)}`;
  const tenantCode = `TEN-${Date.now().toString(36).toUpperCase()}`;
  const { data: tenant, error: tenantErr } = await db
    .from('tenants')
    .insert({
      code: tenantCode,
      name: reg.clinic_name,
      type: 'clinica',
      owner_name: reg.owner_name,
      email: reg.email,
      phone: reg.phone,
      address: reg.address ?? null,
      active: true
    })
    .select('id')
    .single();
  if (tenantErr) throw tenantErr;

  const { data: clinic, error: clinicErr } = await db
    .from('clinics')
    .insert({
      name: reg.clinic_name,
      slug,
      email: reg.email,
      phone: reg.phone,
      address: reg.address,
      status: 'active',
      subscription_plan: 'essential',
      tenant_id: tenant.id,
      approved_at: new Date().toISOString()
    })
    .select()
    .single();
  if (clinicErr) throw clinicErr;

  await db.from('clinic_subscriptions').insert({
    clinic_id: clinic.id,
    plan: 'essential',
    status: 'active'
  });

  await db
    .from('clinic_registrations')
    .update({
      status: 'approved',
      clinic_id: clinic.id,
      review_notes: reviewNotes,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id);

  const defaultPassword =
    import.meta.env.CLINIC_DEFAULT_PASSWORD ?? import.meta.env.SUPER_ADMIN_PASSWORD ?? 'ChangeMeNow!';
  const { data: authUser, error: authErr } = await db.auth.admin.createUser({
    email: reg.email,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: { full_name: reg.owner_name },
    app_metadata: { clinic_id: clinic.id, tenant_id: tenant.id, role: 'clinic_admin' }
  });
  if (authErr) throw authErr;

  const { error: profileErr } = await db.from('profiles').insert({
    auth_user_id: authUser.user.id,
    clinic_id: clinic.id,
    tenant_id: tenant.id,
    role: 'clinic_admin',
    full_name: reg.owner_name,
    email: reg.email
  });
  if (profileErr) throw profileErr;

  return { registration: reg, clinic, tenantId: tenant.id, adminEmail: reg.email, adminPanelPath: '/admin' };
}

export async function setClinicStatus(clinicId: string, status: ClinicStatus) {
  const db = getSupabaseAdmin();
  const patch: Record<string, unknown> = { status };
  if (status === 'active') patch.approved_at = new Date().toISOString();
  if (status === 'suspended') patch.suspended_at = new Date().toISOString();
  const { error } = await db.from('clinics').update(patch).eq('id', clinicId);
  if (error) throw error;
}

export async function setClinicPlan(clinicId: string, plan: SubscriptionPlan) {
  const db = getSupabaseAdmin();
  await db.from('clinics').update({ subscription_plan: plan }).eq('id', clinicId);
  await db.from('clinic_subscriptions').update({ plan, updated_at: new Date().toISOString() }).eq('clinic_id', clinicId);
}

const STAFF_ROLES = ['clinic_admin', 'admin', 'dentist', 'receptionist', 'owner'] as const;

export async function listClinicUsers(clinicId?: string): Promise<PlatformClinicUser[]> {
  const db = getSupabaseAdmin();
  let q = db
    .from('profiles')
    .select('id, clinic_id, role, full_name, email, tenant_id, created_at, clinics(name, slug, status)')
    .in('role', [...STAFF_ROLES])
    .order('created_at', { ascending: false });
  if (clinicId) q = q.eq('clinic_id', clinicId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((row) => {
    const clinic = joinedClinic<{ name: string; slug: string; status: ClinicStatus }>(row.clinics);
    return {
      id: row.id,
      clinic_id: row.clinic_id,
      clinic_name: clinic?.name ?? '—',
      clinic_slug: clinic?.slug ?? '—',
      clinic_status: clinic?.status ?? 'pending',
      role: row.role as PlatformClinicUser['role'],
      full_name: row.full_name,
      email: row.email,
      tenant_id: row.tenant_id,
      created_at: row.created_at
    };
  });
}

export async function listSubscriptions(): Promise<PlatformSubscription[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('clinic_subscriptions')
    .select('id, clinic_id, plan, status, seats, renews_at, created_at, clinics(name, slug)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const clinic = joinedClinic<{ name: string; slug: string }>(row.clinics);
    return {
      id: row.id,
      clinic_id: row.clinic_id,
      clinic_name: clinic?.name ?? '—',
      clinic_slug: clinic?.slug ?? '—',
      plan: row.plan as SubscriptionPlan,
      status: row.status as PlatformSubscription['status'],
      seats: row.seats,
      renews_at: row.renews_at,
      created_at: row.created_at
    };
  });
}

export async function fetchIsolationReport(): Promise<PlatformIsolationReport> {
  const db = getSupabaseAdmin();
  const { data: clinics, error } = await db
    .from('clinics')
    .select('id, name, slug, status, tenant_id')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const { data: profiles } = await db.from('profiles').select('clinic_id, role');
  const staffByClinic = new Map<string, number>();
  const patientsByClinic = new Map<string, number>();
  for (const p of profiles ?? []) {
    if (STAFF_ROLES.includes(p.role as (typeof STAFF_ROLES)[number])) {
      staffByClinic.set(p.clinic_id, (staffByClinic.get(p.clinic_id) ?? 0) + 1);
    }
    if (p.role === 'patient') {
      patientsByClinic.set(p.clinic_id, (patientsByClinic.get(p.clinic_id) ?? 0) + 1);
    }
  }
  const clinicRows = (clinics ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    status: c.status as ClinicStatus,
    tenant_id: c.tenant_id,
    staff_count: staffByClinic.get(c.id) ?? 0,
    patient_profiles: patientsByClinic.get(c.id) ?? 0,
    has_tenant: Boolean(c.tenant_id)
  }));
  return {
    policy: [
      'Cada clínica aprobada recibe un tenant_id único y un panel /admin propio.',
      'Pacientes, citas, facturas y mensajes están acotados por clinic_id y RLS en Supabase.',
      'Los usuarios de una clínica no pueden listar ni contactar datos de otra clínica.',
      'El Super Admin ve metadatos agregados; no comparte bandejas ni chats entre tenants.',
      'Las solicitudes de registro se revisan manualmente antes de crear credenciales.'
    ],
    clinicsWithTenant: clinicRows.filter((c) => c.has_tenant).length,
    clinicsWithoutTenant: clinicRows.filter((c) => !c.has_tenant).length,
    totalStaff: [...staffByClinic.values()].reduce((a, b) => a + b, 0),
    clinics: clinicRows
  };
}

export async function listPlatformSettings(): Promise<PlatformSettingRow[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('platform_settings').select('key, value, updated_at').order('key');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    key: r.key,
    value: (r.value ?? {}) as Record<string, unknown>,
    updated_at: r.updated_at
  }));
}

export async function updatePlatformSetting(key: string, value: Record<string, unknown>) {
  const db = getSupabaseAdmin();
  const { error } = await db
    .from('platform_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
}

export async function listUsageMetrics(limit = 30): Promise<PlatformUsageRow[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('clinic_usage_daily')
    .select('clinic_id, day, appointments_count, patients_count, invoices_count, clinics(name)')
    .order('day', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    clinic_id: r.clinic_id,
    clinic_name: joinedClinic<{ name: string }>(r.clinics)?.name ?? '—',
    day: r.day,
    appointments_count: r.appointments_count,
    patients_count: r.patients_count,
    invoices_count: r.invoices_count
  }));
}

export async function setSupportStatus(id: string, status: SupportStatus) {
  const db = getSupabaseAdmin();
  const { error } = await db
    .from('support_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
