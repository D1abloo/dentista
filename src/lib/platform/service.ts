import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';
import type {
  ClinicRegistration,
  ClinicStatus,
  PlatformClinic,
  PlatformOverview,
  RegistrationStatus,
  SubscriptionPlan,
  SupportRequest
} from '@/lib/platform/types';

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
    return { clinicsTotal: 0, clinicsActive: 0, clinicsPending: 0, registrationsPending: 0, supportOpen: 0 };
  }
  const db = getSupabaseAdmin();
  const [clinics, regs, support] = await Promise.all([
    db.from('clinics').select('id, status', { count: 'exact' }),
    db.from('clinic_registrations').select('id', { count: 'exact' }).eq('status', 'pending'),
    db.from('support_requests').select('id', { count: 'exact' }).in('status', ['open', 'in_progress'])
  ]);
  const rows = clinics.data ?? [];
  return {
    clinicsTotal: clinics.count ?? rows.length,
    clinicsActive: rows.filter((c) => c.status === 'active').length,
    clinicsPending: rows.filter((c) => c.status === 'pending').length,
    registrationsPending: regs.count ?? 0,
    supportOpen: support.count ?? 0
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

  return { registration: reg, clinic };
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
