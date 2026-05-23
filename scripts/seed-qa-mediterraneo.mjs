#!/usr/bin/env node
/**
 * Semilla idempotente: 2 clínicas INDEPENDIENTES (cada una con su tenant).
 * Nombres comerciales del grupo Mediterráneo, sin compartir tenant_id.
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

const CLINICS = [
  { name: 'Clínica Dental Mediterráneo Centro', city: 'Valencia', phone: '+34 961 100 101', slugKey: 'mediterraneo-centro' },
  { name: 'Clínica Dental Mediterráneo Norte', city: 'Castellón', phone: '+34 964 100 102', slugKey: 'mediterraneo-norte' }
];

const ADMIN_EMAIL = (process.env.QA_MED_ADMIN_EMAIL || 'mediterraneo.admin@dentista.app').toLowerCase();
const ADMIN_NAME = 'Admin Mediterráneo';

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

async function upsertIndependentClinic(spec) {
  const { data: existing } = await db
    .from('clinics')
    .select('id, tenant_id, slug')
    .eq('slug', spec.slugKey)
    .maybeSingle();

  if (existing?.id) {
    console.log(`✓ Ya existe: ${spec.name} (${existing.slug})`);
    return existing;
  }

  const tenantCode = `TEN-${spec.slugKey.toUpperCase()}`;
  const { data: tenant, error: tErr } = await db
    .from('tenants')
    .insert({
      code: tenantCode,
      name: spec.name,
      type: 'clinica',
      owner_name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      phone: spec.phone,
      address: spec.city,
      active: true
    })
    .select('id')
    .single();
  if (tErr) throw tErr;

  const slug = spec.slugKey;
  const { data: clinic, error: cErr } = await db
    .from('clinics')
    .insert({
      name: spec.name,
      slug,
      tenant_id: tenant.id,
      email: ADMIN_EMAIL,
      phone: spec.phone,
      city: spec.city,
      status: 'active',
      is_main_branch: true,
      subscription_plan: 'professional',
      approved_at: new Date().toISOString()
    })
    .select('id, tenant_id, slug, name')
    .single();
  if (cErr) throw cErr;

  await db.from('clinic_subscriptions').upsert(
    { clinic_id: clinic.id, plan: 'professional', status: 'active', seats: 8 },
    { onConflict: 'clinic_id' }
  );
  await db.from('rooms').insert({ clinic_id: clinic.id, name: 'Gabinete 1', active: true });

  console.log(`✓ Clínica independiente: ${spec.name} (tenant ${String(tenant.id).slice(0, 8)}…)`);
  return clinic;
}

async function ensureAdminProfile(authUserId, clinic) {
  const { data: prof } = await db
    .from('profiles')
    .select('id')
    .eq('clinic_id', clinic.id)
    .eq('email', ADMIN_EMAIL)
    .eq('role', 'clinic_admin')
    .maybeSingle();

  const payload = {
    auth_user_id: authUserId,
    clinic_id: clinic.id,
    tenant_id: clinic.tenant_id,
    role: 'clinic_admin',
    full_name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    activated_at: new Date().toISOString()
  };

  if (prof?.id) {
    await db.from('profiles').update(payload).eq('id', prof.id);
  } else {
    await db.from('profiles').insert(payload);
  }
}

async function main() {
  const authUser = await ensureAuthUser(ADMIN_EMAIL, ADMIN_NAME);
  const created = [];

  for (const spec of CLINICS) {
    const clinic = await upsertIndependentClinic(spec);
    await ensureAdminProfile(authUser.id, clinic);
    created.push(clinic);
  }

  await db.auth.admin.updateUserById(authUser.id, {
    app_metadata: {
      role: 'clinic_admin',
      clinic_id: created[0].id,
      tenant_id: created[0].tenant_id
    }
  });

  console.log(`\n✓ ${created.length} clínicas independientes (sin tenant compartido)`);
  console.log(`  Admin: ${ADMIN_EMAIL}`);
  console.log('  Aplica migración 0029 en Supabase si había sedes legacy en un solo tenant.');
}

main().catch((err) => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
