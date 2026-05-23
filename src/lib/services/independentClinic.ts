import { getSupabaseAdmin } from '@/lib/supabaseServer';
import type { BranchInput, BranchRow } from '@/lib/services/branches';

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

/** Una clínica = un tenant propio. Nunca compartir tenant entre sedes. */
export async function createIndependentClinic(input: BranchInput & { subscriptionPlan?: string }): Promise<{
  tenantId: string;
  clinic: BranchRow;
}> {
  const db = getSupabaseAdmin();
  const tenantCode = `TEN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const clinicName = input.name.trim();

  const { data: tenant, error: tenantErr } = await db
    .from('tenants')
    .insert({
      code: tenantCode,
      name: clinicName,
      type: 'clinica',
      owner_name: clinicName,
      email: input.email?.trim() ?? null,
      phone: input.phone?.trim() ?? null,
      address: input.address?.trim() ?? null,
      active: true
    })
    .select('id')
    .single();
  if (tenantErr) throw tenantErr;

  const slug = `${slugify(clinicName)}-${Date.now().toString(36).slice(-4)}`;
  const plan = input.subscriptionPlan ?? 'essential';

  const { data: clinic, error: clinicErr } = await db
    .from('clinics')
    .insert({
      name: clinicName,
      slug,
      tenant_id: tenant.id,
      email: input.email?.trim() ?? null,
      phone: input.phone?.trim() ?? null,
      address: input.address?.trim() ?? null,
      city: input.city?.trim() ?? null,
      status: 'active',
      is_main_branch: true,
      subscription_plan: plan,
      approved_at: new Date().toISOString()
    })
    .select('id, tenant_id, name, slug, email, phone, address, city, status, is_main_branch, subscription_plan, created_at')
    .single();
  if (clinicErr) throw clinicErr;

  await db.from('clinic_subscriptions').insert({
    clinic_id: clinic.id,
    plan,
    status: 'active'
  });

  await db.from('rooms').insert({ clinic_id: clinic.id, name: 'Gabinete 1', active: true });

  return {
    tenantId: tenant.id as string,
    clinic: clinic as BranchRow
  };
}
