#!/usr/bin/env node
/**
 * Semilla idempotente: Grupo Dental Mediterráneo (2 sedes) + admin org.
 * Uso: npm run seed:qa-mediterraneo
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnvFile } from './lib/load-env.mjs';

loadEnvFile();

const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD || process.env.CLINIC_DEFAULT_PASSWORD;

if (!url || !serviceKey) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}
if (!PASSWORD || PASSWORD.length < 6) {
  console.error('Define SUPER_ADMIN_PASSWORD o CLINIC_DEFAULT_PASSWORD (mín. 6 caracteres).');
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ORG_NAME = 'Grupo Dental Mediterráneo';
const ADMIN_EMAIL = (process.env.QA_MED_ADMIN_EMAIL || 'mediterraneo.admin@dentista.app').toLowerCase();
const ADMIN_NAME = 'Admin Org Mediterráneo';

const BRANCHES = [
  { name: 'Clínica Dental Mediterráneo Centro', city: 'Valencia', phone: '+34 961 100 101' },
  { name: 'Clínica Dental Mediterráneo Norte', city: 'Castellón', phone: '+34 964 100 102' }
];

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

async function findAuthUserByEmail(email) {
  let page = 1;
  while (true) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = (data.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if ((data.users ?? []).length < 200) break;
    page++;
  }
  return null;
}

async function ensureAuthUser(email, name) {
  let user = await findAuthUserByEmail(email);
  if (user) {
    await db.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: name }
    });
    return user;
  }
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: name }
  });
  if (error) throw error;
  return data.user;
}

async function createBranch(tenantId, input, isMain) {
  if (isMain) {
    await db.from('clinics').update({ is_main_branch: false }).eq('tenant_id', tenantId);
  }
  const slug = `${slugify(input.name)}-${Date.now().toString(36).slice(-4)}`;
  const { data: clinic, error } = await db
    .from('clinics')
    .insert({
      name: input.name,
      slug,
      tenant_id: tenantId,
      email: ADMIN_EMAIL,
      phone: input.phone,
      city: input.city,
      status: 'active',
      is_main_branch: isMain,
      subscription_plan: 'professional',
      approved_at: new Date().toISOString()
    })
    .select('id, name, slug')
    .single();
  if (error) throw error;

  await db.from('clinic_subscriptions').upsert(
    { clinic_id: clinic.id, plan: 'professional', status: 'active', seats: 8 },
    { onConflict: 'clinic_id' }
  );
  await db.from('rooms').insert({ clinic_id: clinic.id, name: 'Gabinete 1', active: true });
  return clinic;
}

async function main() {
  const { data: existing } = await db.from('tenants').select('id, name').ilike('name', ORG_NAME).maybeSingle();
  if (existing?.id) {
    const { data: branches } = await db
      .from('clinics')
      .select('id, name')
      .eq('tenant_id', existing.id);
    console.log(`✓ Ya existe: ${ORG_NAME} (${branches?.length ?? 0} sedes)`);
    for (const b of branches ?? []) console.log(`  · ${b.name}`);
    return;
  }

  const tenantCode = `TEN-MED-${Date.now().toString(36).toUpperCase()}`;
  const { data: tenant, error: tenantErr } = await db
    .from('tenants')
    .insert({
      code: tenantCode,
      name: ORG_NAME,
      type: 'clinica',
      owner_name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      phone: '+34 961 100 100',
      address: 'Comunidad Valenciana',
      active: true
    })
    .select('id')
    .single();
  if (tenantErr) throw tenantErr;

  const created = [];
  for (let i = 0; i < BRANCHES.length; i++) {
    const branch = await createBranch(tenant.id, BRANCHES[i], i === 0);
    created.push(branch);
    console.log(`✓ Sede: ${branch.name} (${branch.slug})`);
  }

  const main = created[0];
  const authUser = await ensureAuthUser(ADMIN_EMAIL, ADMIN_NAME);
  const { data: prof } = await db
    .from('profiles')
    .select('id')
    .eq('clinic_id', main.id)
    .eq('email', ADMIN_EMAIL)
    .eq('role', 'clinic_admin')
    .maybeSingle();
  const profilePayload = {
    auth_user_id: authUser.id,
    clinic_id: main.id,
    tenant_id: tenant.id,
    role: 'clinic_admin',
    full_name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    activated_at: new Date().toISOString()
  };
  if (prof?.id) {
    await db.from('profiles').update(profilePayload).eq('id', prof.id);
  } else {
    await db.from('profiles').insert(profilePayload);
  }
  await db.auth.admin.updateUserById(authUser.id, {
    app_metadata: { role: 'clinic_admin', clinic_id: main.id, tenant_id: tenant.id }
  });

  console.log(`\n✓ Organización ${ORG_NAME} creada (${created.length} sedes)`);
  console.log(`  Admin org: ${ADMIN_EMAIL} (misma contraseña que CLINIC_DEFAULT_PASSWORD)`);
  console.log(`  Panel: /login/admin?email=${encodeURIComponent(ADMIN_EMAIL)}`);
}

main().catch((err) => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
