import { getSupabaseAdmin } from '@/lib/supabaseServer';

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

export type BranchInput = {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  isMainBranch?: boolean;
};

export type BranchRow = {
  id: string;
  tenant_id: string | null;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  status: string;
  is_main_branch: boolean;
  subscription_plan?: string;
  created_at: string;
};

export async function listBranchesByTenant(tenantId: string): Promise<BranchRow[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('clinics')
    .select('id, tenant_id, name, slug, email, phone, address, city, status, is_main_branch, subscription_plan, created_at')
    .eq('tenant_id', tenantId)
    .order('is_main_branch', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as BranchRow[];
}

export async function getClinicTenantId(clinicId: string): Promise<string | null> {
  const db = getSupabaseAdmin();
  const { data } = await db.from('clinics').select('tenant_id').eq('id', clinicId).maybeSingle();
  return data?.tenant_id ?? null;
}

export async function clinicBelongsToTenant(clinicId: string, tenantId: string): Promise<boolean> {
  const db = getSupabaseAdmin();
  const { data } = await db.from('clinics').select('id').eq('id', clinicId).eq('tenant_id', tenantId).maybeSingle();
  return Boolean(data);
}

export async function createBranch(tenantId: string, input: BranchInput): Promise<BranchRow> {
  const db = getSupabaseAdmin();
  const slug = `${slugify(input.name)}-${Date.now().toString(36)}`;

  if (input.isMainBranch) {
    await db.from('clinics').update({ is_main_branch: false }).eq('tenant_id', tenantId);
  }

  const { data: clinic, error } = await db
    .from('clinics')
    .insert({
      name: input.name.trim(),
      slug,
      tenant_id: tenantId,
      email: input.email?.trim() ?? null,
      phone: input.phone?.trim() ?? null,
      address: input.address?.trim() ?? null,
      city: input.city?.trim() ?? null,
      status: 'active',
      is_main_branch: input.isMainBranch ?? false,
      subscription_plan: 'essential'
    })
    .select('id, tenant_id, name, slug, email, phone, address, city, status, is_main_branch, subscription_plan, created_at')
    .single();
  if (error) throw error;

  await db.from('clinic_subscriptions').insert({
    clinic_id: clinic.id,
    plan: 'essential',
    status: 'active'
  });

  await db.from('rooms').insert({ clinic_id: clinic.id, name: 'Gabinete 1', active: true });

  return clinic as BranchRow;
}

export async function updateBranch(
  clinicId: string,
  patch: Partial<BranchInput> & { status?: string; active?: boolean }
) {
  const db = getSupabaseAdmin();
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name.trim();
  if (patch.address !== undefined) row.address = patch.address?.trim() ?? null;
  if (patch.city !== undefined) row.city = patch.city?.trim() ?? null;
  if (patch.phone !== undefined) row.phone = patch.phone?.trim() ?? null;
  if (patch.email !== undefined) row.email = patch.email?.trim() ?? null;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.isMainBranch === true) {
    const tenantId = await getClinicTenantId(clinicId);
    if (tenantId) await db.from('clinics').update({ is_main_branch: false }).eq('tenant_id', tenantId);
    row.is_main_branch = true;
  }
  const { error } = await db.from('clinics').update(row).eq('id', clinicId);
  if (error) throw error;
}

export async function createOrganizationWithBranches(input: {
  organizationName: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  branches: BranchInput[];
  createAdmin?: boolean;
  adminPassword?: string;
}) {
  const db = getSupabaseAdmin();
  if (!input.branches.length) throw new Error('Añade al menos una sede.');

  const tenantCode = `TEN-${Date.now().toString(36).toUpperCase()}`;
  const { data: tenant, error: tenantErr } = await db
    .from('tenants')
    .insert({
      code: tenantCode,
      name: input.organizationName.trim(),
      type: 'clinica',
      owner_name: input.ownerName.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      address: input.address?.trim() ?? null,
      active: true
    })
    .select('id')
    .single();
  if (tenantErr) throw tenantErr;

  const createdBranches: BranchRow[] = [];
  for (let i = 0; i < input.branches.length; i++) {
    const b = input.branches[i];
    const branch = await createBranch(tenant.id, {
      ...b,
      email: b.email ?? input.email,
      phone: b.phone ?? input.phone,
      isMainBranch: i === 0 || Boolean(b.isMainBranch)
    });
    createdBranches.push(branch);
  }

  let adminUserId: string | null = null;
  if (input.createAdmin !== false) {
    const main = createdBranches.find((c) => c.is_main_branch) ?? createdBranches[0];
    const password =
      input.adminPassword ??
      import.meta.env.CLINIC_DEFAULT_PASSWORD ??
      import.meta.env.SUPER_ADMIN_PASSWORD ??
      'ChangeMeNow!';
    const { data: authUser, error: authErr } = await db.auth.admin.createUser({
      email: input.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: input.ownerName },
      app_metadata: { clinic_id: main.id, tenant_id: tenant.id, role: 'clinic_admin' }
    });
    if (authErr) throw authErr;
    adminUserId = authUser.user.id;
    await db.from('profiles').insert({
      auth_user_id: authUser.user.id,
      clinic_id: main.id,
      tenant_id: tenant.id,
      role: 'clinic_admin',
      full_name: input.ownerName,
      email: input.email
    });
  }

  return { tenantId: tenant.id, branches: createdBranches, adminUserId };
}
